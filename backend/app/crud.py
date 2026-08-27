from typing import List, Optional
from sqlmodel import Session, select
from app.models import RepositoryAnalysis, ReviewSuggestion


def create_analysis(session: Session, repo_url: str, repo_name: str) -> RepositoryAnalysis:
    """
    Creates a new repository analysis record in PENDING state.
    """
    analysis = RepositoryAnalysis(repo_url=repo_url, repo_name=repo_name, status="PENDING")
    session.add(analysis)
    session.commit()
    session.refresh(analysis)
    return analysis


def update_analysis_status(
    session: Session, analysis_id: int, status: str, error_message: Optional[str] = None
) -> Optional[RepositoryAnalysis]:
    """
    Updates the status and error messages of a repository analysis.
    """
    analysis = session.get(RepositoryAnalysis, analysis_id)
    if analysis:
        analysis.status = status
        if error_message:
            analysis.error_message = error_message
        session.add(analysis)
        session.commit()
        session.refresh(analysis)
    return analysis


def create_suggestions(session: Session, analysis_id: int, suggestions_data: List[dict]) -> List[ReviewSuggestion]:
    """
    Inserts a list of AI suggestions associated with a given analysis.
    """
    suggestions = []
    for item in suggestions_data:
        suggestion = ReviewSuggestion(
            analysis_id=analysis_id,
            file_path=item.get("file_path"),
            file_language=item.get("file_language"),
            line_number=item.get("line_number"),
            category=item.get("category"),
            severity=item.get("severity"),
            title=item.get("title"),
            description=item.get("description"),
            suggestion_code=item.get("suggestion_code"),
            original_code=item.get("original_code"),
        )
        session.add(suggestion)
        suggestions.append(suggestion)
    session.commit()
    return suggestions


def get_analyses(session: Session) -> List[RepositoryAnalysis]:
    """
    Retrieves all repository analyses, sorted by analyzed_at descending.
    """
    statement = select(RepositoryAnalysis).order_by(RepositoryAnalysis.analyzed_at.desc())
    return session.exec(statement).all()


def get_analysis(session: Session, analysis_id: int) -> Optional[RepositoryAnalysis]:
    """
    Retrieves a single repository analysis including relationships.
    """
    return session.get(RepositoryAnalysis, analysis_id)


def delete_analysis(session: Session, analysis_id: int) -> bool:
    """
    Deletes an analysis record. Due to cascading relationships, its
    suggestions will be automatically deleted as well.
    """
    analysis = session.get(RepositoryAnalysis, analysis_id)
    if analysis:
        session.delete(analysis)
        session.commit()
        return True
    return False
