"""
AI Assistant Routes
POST /api/ai/chat         – send a message, get AI reply
GET  /api/ai/history      – load chat history
DELETE /api/ai/history    – clear chat history
POST /api/ai/study-plan   – generate a detailed study plan
POST /api/ai/quiz         – generate quiz questions for a subject
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ChatMessage, Subject, Performance
from services.ai_service import chat_with_ai, generate_study_plan, generate_quiz

ai_bp = Blueprint("ai", __name__)


def get_user_id():
    return int(get_jwt_identity())


@ai_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    data = request.get_json()
    if not data.get("message"):
        return jsonify({"error": "message is required"}), 400

    uid = get_user_id()
    api_key = current_app.config.get("ANTHROPIC_API_KEY", "")

    # Build student context
    subjects = Subject.query.filter_by(user_id=uid).all()
    subject_context = [
        {
            "name": s.name,
            "progress": s.progress,
            "difficulty": s.difficulty,
            "exam_date": s.exam_date.isoformat() if s.exam_date else "N/A",
            "hours_per_day": s.hours_per_day,
        }
        for s in subjects
    ]

    # Load recent chat history (last 10 messages for context window)
    history = ChatMessage.query.filter_by(user_id=uid)\
        .order_by(ChatMessage.created_at.asc()).all()[-10:]
    history_list = [{"role": m.role, "content": m.content} for m in history]

    # Save user message
    user_msg = ChatMessage(user_id=uid, role="user", content=data["message"])
    db.session.add(user_msg)
    db.session.flush()

    # Call AI
    reply = chat_with_ai(
        user_message=data["message"],
        history=history_list,
        subject_context=subject_context,
        api_key=api_key
    )

    # Save AI reply
    ai_msg = ChatMessage(user_id=uid, role="assistant", content=reply)
    db.session.add(ai_msg)
    db.session.commit()

    return jsonify({"reply": reply}), 200


@ai_bp.route("/history", methods=["GET"])
@jwt_required()
def get_history():
    uid = get_user_id()
    messages = ChatMessage.query.filter_by(user_id=uid)\
        .order_by(ChatMessage.created_at.asc()).all()
    return jsonify([m.to_dict() for m in messages]), 200


@ai_bp.route("/history", methods=["DELETE"])
@jwt_required()
def clear_history():
    ChatMessage.query.filter_by(user_id=get_user_id()).delete()
    db.session.commit()
    return jsonify({"message": "Chat history cleared"}), 200


@ai_bp.route("/study-plan", methods=["POST"])
@jwt_required()
def study_plan():
    uid = get_user_id()
    api_key = current_app.config.get("ANTHROPIC_API_KEY", "")
    subjects = Subject.query.filter_by(user_id=uid).all()
    data = request.get_json() or {}
    days = data.get("days", 7)

    subject_data = [
        {
            "name": s.name,
            "progress": s.progress,
            "difficulty": s.difficulty,
            "exam_date": s.exam_date.isoformat() if s.exam_date else "N/A",
            "hours_per_day": s.hours_per_day,
        }
        for s in subjects
    ]

    plan = generate_study_plan(subject_data, days, api_key)
    return jsonify({"plan": plan}), 200


@ai_bp.route("/quiz", methods=["POST"])
@jwt_required()
def quiz():
    data = request.get_json()
    if not data.get("subject_name"):
        return jsonify({"error": "subject_name is required"}), 400

    api_key = current_app.config.get("ANTHROPIC_API_KEY", "")
    questions = generate_quiz(
        subject_name=data["subject_name"],
        topic=data.get("topic", ""),
        count=int(data.get("count", 5)),
        api_key=api_key
    )
    return jsonify({"questions": questions}), 200
