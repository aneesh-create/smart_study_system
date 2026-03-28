"""
AI Service Layer
Wraps all Anthropic Claude API calls:
  - chat_with_ai()
  - summarize_notes()
  - generate_performance_insights()
  - generate_study_plan()
  - generate_quiz()
"""

import json
import requests

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-20250514"
HEADERS_BASE = {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
}


def _call_claude(messages: list, system: str, api_key: str, max_tokens: int = 1000) -> str:
    """Low-level Claude API call. Returns text or error message."""
    if not api_key:
        return "[AI service not configured – set ANTHROPIC_API_KEY in .env]"
    try:
        headers = {**HEADERS_BASE, "x-api-key": api_key}
        payload = {
            "model": MODEL,
            "max_tokens": max_tokens,
            "system": system,
            "messages": messages,
        }
        resp = requests.post(ANTHROPIC_URL, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"]
    except requests.exceptions.Timeout:
        return "AI request timed out. Please try again."
    except Exception as e:
        return f"AI service error: {str(e)}"


def chat_with_ai(user_message: str, history: list, subject_context: list, api_key: str) -> str:
    """Multi-turn study assistant chat."""
    system = f"""You are StudyAI, an intelligent academic assistant for a Smart Study Management System.

Student's subjects and status:
{json.dumps(subject_context, indent=2)}

Your role:
- Create personalised study plans and schedules
- Explain difficult academic concepts clearly
- Analyse progress and recommend improvements
- Motivate students and reduce exam stress
- Suggest revision strategies and memory techniques

Be concise, practical, and encouraging. Use bullet points for lists.
Respond in English."""

    # Build messages array from history + new message
    messages = []
    for h in history:
        role = "assistant" if h["role"] in ("assistant", "ai") else "user"
        messages.append({"role": role, "content": h["content"]})
    messages.append({"role": "user", "content": user_message})

    return _call_claude(messages, system, api_key, max_tokens=1000)


def summarize_notes(content: str, title: str, api_key: str) -> str:
    """Summarise student notes into key bullet points."""
    system = "You are an expert academic summariser. Produce concise, well-structured summaries."
    messages = [{
        "role": "user",
        "content": f"Summarise these study notes titled '{title}' into 3-5 key bullet points:\n\n{content}"
    }]
    return _call_claude(messages, system, api_key, max_tokens=500)


def generate_performance_insights(subject_data: list, api_key: str) -> str:
    """Generate insights on academic performance from subject averages."""
    system = "You are an academic performance analyst. Give practical, actionable insights."
    data_str = json.dumps(subject_data, indent=2)
    messages = [{
        "role": "user",
        "content": f"""Analyse this student's performance data and provide:
1. Top strengths (subjects performing well)
2. Areas needing improvement
3. Specific actionable recommendations

Data:
{data_str}

Keep it concise and motivating."""
    }]
    return _call_claude(messages, system, api_key, max_tokens=700)


def generate_study_plan(subject_data: list, days: int, api_key: str) -> str:
    """Generate a day-by-day study plan."""
    system = "You are an expert study planner. Create practical, achievable study schedules."
    data_str = json.dumps(subject_data, indent=2)
    messages = [{
        "role": "user",
        "content": f"""Create a detailed {days}-day study plan for this student.

Subject data (name, progress %, difficulty 1-5, exam date, hours/day):
{data_str}

Format the plan as:
Day 1: [date]
- Subject: X hours – specific topics/chapters to cover
- Subject: X hours – specific focus

Prioritise subjects with upcoming exams and lower progress.
End with 3 key revision tips."""
    }]
    return _call_claude(messages, system, api_key, max_tokens=1500)


def generate_quiz(subject_name: str, topic: str, count: int, api_key: str) -> list:
    """Generate multiple-choice quiz questions. Returns list of question dicts."""
    system = """You are an expert educator. Generate quiz questions and return ONLY valid JSON.
No markdown fences, no extra text – just a raw JSON array."""

    topic_str = f" specifically on {topic}" if topic else ""
    messages = [{
        "role": "user",
        "content": f"""Generate {count} multiple-choice questions for {subject_name}{topic_str}.

Return a JSON array where each element has:
{{
  "question": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "answer": "A",
  "explanation": "..."
}}"""
    }]

    raw = _call_claude(messages, system, api_key, max_tokens=1500)
    try:
        # Strip any accidental markdown fences
        cleaned = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(cleaned)
    except Exception:
        return [{"question": "Could not parse quiz. Please try again.", "options": [], "answer": "", "explanation": raw}]
