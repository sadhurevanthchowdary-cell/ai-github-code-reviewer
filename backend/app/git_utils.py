import os
import shutil
import uuid
import re
from typing import List, Dict, Tuple
from git import Repo
from app.config import settings


def extract_repo_name(repo_url: str) -> str:
    """
    Extracts the repository name (e.g., 'owner/repo') from a GitHub URL.
    """
    # Pattern to match the user and repo names from a standard HTTPS URL
    pattern = r"github\.com/([\w\-\.]+)/([\w\-\.]+)"
    match = re.search(pattern, repo_url)
    if match:
        owner = match.group(1)
        repo = match.group(2)
        # Strip trailing .git if present
        if repo.endswith(".git"):
            repo = repo[:-4]
        return f"{owner}/{repo}"
    return "unknown/repository"


def get_file_language(file_path: str) -> str:
    """
    Determines the programming language based on the file extension.
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".py":
        return "python"
    elif ext in [".js", ".jsx", ".ts", ".tsx"]:
        return "javascript"
    elif ext == ".java":
        return "java"
    return "unknown"


def clone_and_extract_files(repo_url: str) -> Tuple[str, List[Dict[str, str]], str]:
    """
    Clones a public Git repository, extracts supported source code files,
    and returns a tuple containing:
      1. Cloned repo local path (for cleanup)
      2. List of file data dictionaries (path, content, language)
      3. Extracted repository clean name
    """
    repo_name = extract_repo_name(repo_url)
    unique_id = str(uuid.uuid4())[:8]

    # Create temp directory inside the project folder
    base_temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_repos")
    os.makedirs(base_temp_dir, exist_ok=True)

    clone_path = os.path.join(base_temp_dir, f"{repo_name.replace('/', '_')}_{unique_id}")

    # Excluded directories we should skip during parsing
    ignored_dirs = {
        ".git",
        "node_modules",
        "venv",
        "env",
        ".venv",
        "build",
        "dist",
        "__pycache__",
        ".idea",
        ".vscode",
        "target",
        "out",
    }

    # Supported file extensions
    supported_extensions = {".py", ".js", ".jsx", ".ts", ".tsx", ".java"}

    # Guardrails
    max_file_size_bytes = 100 * 1024  # 100 KB limit per file to avoid token bloat

    files_extracted = []

    try:
        # Shallow clone with depth=1 for extreme speed and minimal bandwidth
        Repo.clone_from(repo_url, clone_path, depth=1)

        # Traverse repository
        for root, dirs, files in os.walk(clone_path):
            # Prune directory searches for ignored folders in place
            dirs[:] = [d for d in dirs if d not in ignored_dirs]

            for file in files:
                file_ext = os.path.splitext(file)[1].lower()
                if file_ext in supported_extensions:
                    full_path = os.path.join(root, file)

                    # Skip files that exceed our maximum size guardrail
                    if os.path.getsize(full_path) > max_file_size_bytes:
                        continue

                    rel_path = os.path.relpath(full_path, clone_path)

                    try:
                        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()

                        # Only include files that have actual contents
                        if content.strip():
                            files_extracted.append(
                                {
                                    "file_path": rel_path.replace("\\", "/"),
                                    "content": content,
                                    "file_language": get_file_language(file),
                                }
                            )
                    except Exception:
                        # Skip files that fail reading (e.g., encoding issues)
                        continue

                    # Stop if we hit our maximum files threshold
                    if len(files_extracted) >= settings.max_files_to_analyze:
                        break

            if len(files_extracted) >= settings.max_files_to_analyze:
                break

    except Exception as e:
        # Ensure cleanup of clone path if cloning itself fails mid-way
        cleanup_cloned_repo(clone_path)
        raise RuntimeError(f"Failed cloning repository {repo_url}: {str(e)}")

    return clone_path, files_extracted, repo_name


def cleanup_cloned_repo(clone_path: str):
    """
    Safely deletes the cloned repository files from disk.
    """
    if clone_path and os.path.exists(clone_path):
        try:
            # git directories might have read-only files, this helper cleans them up
            def onerror(func, path, exc_info):
                import stat

                if not os.access(path, os.W_OK):
                    os.chmod(path, stat.S_IWUSR)
                    func(path)
                else:
                    raise

            shutil.rmtree(clone_path, onerror=onerror)
        except Exception:
            # Suppress errors on cleanup to prevent crashing request response
            pass
