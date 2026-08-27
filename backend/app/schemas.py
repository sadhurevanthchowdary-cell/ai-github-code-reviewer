from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import re


class AnalysisRequest(BaseModel):
    """
    Schema for initiating a new repository analysis.
    """

    repo_url: str = Field(..., description="The HTTPS URL of the public GitHub repository.")

    @field_validator("repo_url")
    @classmethod
    def validate_github_url(cls, value: str) -> str:
        """
        Validates that the input is a valid GitHub repository URL.
        Supports both https://github.com/user/repo and https://github.com/user/repo.git format.
        """
        value = value.strip()
        # Regex to validate GitHub URL format
        pattern = r"^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+(\.git)?\/?$"
        if not re.match(pattern, value):
            raise ValueError("Must be a valid public GitHub repository URL (e.g., https://github.com/owner/repo)")
        return value


class SuggestionRead(BaseModel):
    """
    Schema representing a suggestion in an API response.
    """

    id: int
    analysis_id: int
    file_path: str
    file_language: str
    line_number: Optional[int] = None
    category: str
    severity: str
    title: str
    description: str
    suggestion_code: Optional[str] = None
    original_code: Optional[str] = None

    model_config = {"from_attributes": True}


class AnalysisRead(BaseModel):
    """
    Schema representing a summary of an analysis in list responses.
    """

    id: int
    repo_url: str
    repo_name: str
    analyzed_at: datetime
    status: str
    error_message: Optional[str] = None

    model_config = {"from_attributes": True}


class AnalysisDetailRead(AnalysisRead):
    """
    Detailed schema representing an analysis, including all AI suggestions.
    """

    suggestions: List[SuggestionRead] = []

    model_config = {"from_attributes": True}
