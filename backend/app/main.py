from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from typing import List
from contextlib import asynccontextmanager

from app.config import settings
from app.database import get_db, init_db
from app.schemas import AnalysisRequest, AnalysisRead, AnalysisDetailRead
import app.crud as crud
import app.git_utils as git_utils
import app.reviewer as reviewer


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan event handler. Initializes database tables on startup.
    """
    init_db()
    yield


app = FastAPI(
    title="AI GitHub Code Review Assistant API",
    description="Backend service for cloning repositories and analyzing code using LangChain and OpenAI",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Vite development port or production origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_analysis_pipeline(analysis_id: int, repo_url: str):
    """
    Background pipeline worker. Clones the repository, extracts supported
    source files, gets review suggestions from the LLM, inserts them
    into the database, and deletes temporary files.
    """
    # Open a new database session manually since this runs inside a separate background thread
    from app.database import Session, engine

    clone_path = None
    with Session(engine) as db:
        try:
            # Step 1: Shallow Clone and Crawl Repository
            clone_path, files, repo_name = git_utils.clone_and_extract_files(repo_url)

            if not files:
                crud.update_analysis_status(
                    db,
                    analysis_id=analysis_id,
                    status="FAILED",
                    error_message="No supported files (.py, .js, .jsx, .ts, .tsx, .java) found in the repository.",
                )
                return

            # Step 2: Invoke LangChain OpenAI Code Review
            suggestions = reviewer.review_code_files(files)

            # Step 3: Populate database suggestions and mark complete
            if suggestions:
                crud.create_suggestions(db, analysis_id=analysis_id, suggestions_data=suggestions)

            crud.update_analysis_status(db, analysis_id=analysis_id, status="COMPLETED")

        except Exception as e:
            # Capture failure and record details
            crud.update_analysis_status(db, analysis_id=analysis_id, status="FAILED", error_message=str(e))
            print(f"Background review worker failure for analysis ID {analysis_id}: {str(e)}")

        finally:
            # Step 4: Ensure repository cleanup
            if clone_path:
                git_utils.cleanup_cloned_repo(clone_path)


@app.post("/api/analyze", response_model=AnalysisRead, status_code=status.HTTP_202_ACCEPTED)
def analyze_repository(request: AnalysisRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Initiates analysis on a public GitHub URL.
    Returns immediately with a status of PENDING, executing the full pipeline in the background.
    """
    repo_name = git_utils.extract_repo_name(request.repo_url)

    # 1. Register analysis record in database
    analysis_record = crud.create_analysis(db, repo_url=request.repo_url, repo_name=repo_name)

    # 2. Add pipeline process to background tasks
    background_tasks.add_task(run_analysis_pipeline, analysis_id=analysis_record.id, repo_url=request.repo_url)

    return analysis_record


@app.get("/api/analyses", response_model=List[AnalysisRead])
def get_analyses_history(db: Session = Depends(get_db)):
    """
    Retrieves all historical repository reviews.
    """
    return crud.get_analyses(db)


@app.get("/api/analyses/{analysis_id}", response_model=AnalysisDetailRead)
def get_analysis_details(analysis_id: int, db: Session = Depends(get_db)):
    """
    Retrieves specific analysis details along with its code review suggestions.
    """
    analysis = crud.get_analysis(db, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Analysis with ID {analysis_id} not found.")
    return analysis


@app.delete("/api/analyses/{analysis_id}", status_code=status.HTTP_200_OK)
def delete_analysis_record(analysis_id: int, db: Session = Depends(get_db)):
    """
    Deletes an analysis record and its corresponding database suggestions.
    """
    success = crud.delete_analysis(db, analysis_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Analysis with ID {analysis_id} not found.")
    return {"success": True, "detail": f"Analysis {analysis_id} successfully deleted."}
