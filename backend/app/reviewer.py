import os
import json
from typing import List, Dict, Any

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env")

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")


def review_code_files(files: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    all_suggestions = []

    for file_data in files[:3]:
        try:
            prompt = f"""
You are a senior software engineer.

Review this code and find issues.

Return ONLY a JSON array.

Example:

[
  {{
    "line_number": 10,
    "category": "security",
    "severity": "HIGH",
    "title": "SQL Injection Risk",
    "description": "User input is directly used in query.",
    "suggestion_code": "Use parameterized queries",
    "original_code": "SELECT * FROM users WHERE id = " + user_input
  }}
]

Allowed categories:
security
readability
optimization
code_quality

Allowed severities:
HIGH
MEDIUM
LOW

File Path:
{file_data["file_path"]}

Language:
{file_data["file_language"]}

Code:
{file_data["content"][:6000]}
"""

            response = model.generate_content(prompt)

            text = response.text.strip()

            if text.startswith("```json"):
                text = text.replace("```json", "").replace("```", "").strip()

            issues = json.loads(text)

            for issue in issues:
                issue["file_path"] = file_data["file_path"]
                issue["file_language"] = file_data["file_language"]

                all_suggestions.append(issue)

        except Exception as e:
            print(f"Gemini error: {e}")

    return all_suggestions
