from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

# If using SQLite, we need to disable the same-thread check
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create SQLModel engine
engine = create_engine(settings.database_url, connect_args=connect_args, echo=False)


def init_db():
    """
    Initializes the database tables based on our SQLModel declarations.
    """
    SQLModel.metadata.create_all(engine)


def get_db():
    """
    Dependency generator for database sessions.
    Ensures sessions are closed after the request lifecycle.
    """
    with Session(engine) as session:
        yield session
