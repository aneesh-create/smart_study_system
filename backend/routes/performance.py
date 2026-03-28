"""
Performance Routes
GET    /api/performance/
POST   /api/performance/
DELETE /api/performance/<id>
GET    /api/performance/analytics   – aggregated stats per subject
GET    /api/performance/insights    – AI-driven weak/strong subject analysis
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Performance, Subject
from datetime import date
from sqlalchemy import func
from services.ai_service import generate_performance_insights

performance_bp = Blueprint("performance", __name__)


def get_user_id():
    return int(get_jwt_identity())


@performance_bp.route("/", methods=["GET"])
@jwt_required()
def get_performance():
    uid = get_user_id()
    subject_id = request.args.get("subject_id", type=int)
    query = Performance.query.filter_by(user_id=uid)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    records = query.order_by(Performance.test_date.desc()).all()
    return jsonify([r.to_dict() for r in records]), 200


@performance_bp.route("/", methods=["POST"])
@jwt_required()
def add_performance():
    data = request.get_json()
    for f in ["subject_id", "test_name", "score", "test_date"]:
        if f not in data:
            return jsonify({"error": f"{f} is required"}), 400

    try:
        test_date = date.fromisoformat(data["test_date"])
    except ValueError:
        return jsonify({"error": "Invalid test_date format"}), 400

    perf = Performance(
        user_id=get_user_id(),
        subject_id=int(data["subject_id"]),
        test_name=data["test_name"],
        score=float(data["score"]),
        max_score=float(data.get("max_score", 100)),
        test_date=test_date,
        notes=data.get("notes", ""),
    )
    db.session.add(perf)
    db.session.commit()
    return jsonify(perf.to_dict()), 201


@performance_bp.route("/<int:perf_id>", methods=["DELETE"])
@jwt_required()
def delete_performance(perf_id):
    perf = Performance.query.filter_by(id=perf_id, user_id=get_user_id()).first_or_404()
    db.session.delete(perf)
    db.session.commit()
    return jsonify({"message": "Record deleted"}), 200


@performance_bp.route("/analytics", methods=["GET"])
@jwt_required()
def analytics():
    """Returns per-subject average, trend and last-5 scores."""
    uid = get_user_id()
    subjects = Subject.query.filter_by(user_id=uid).all()
    result = []
    for sub in subjects:
        records = Performance.query.filter_by(
            user_id=uid, subject_id=sub.id
        ).order_by(Performance.test_date.asc()).all()

        if not records:
            result.append({
                "subject_id": sub.id,
                "subject_name": sub.name,
                "subject_color": sub.color,
                "avg": 0,
                "scores": [],
                "trend": "neutral",
            })
            continue

        percentages = [round((r.score / r.max_score) * 100, 1) for r in records]
        avg = round(sum(percentages) / len(percentages), 1)
        last5 = percentages[-5:]
        trend = "up" if len(percentages) >= 2 and percentages[-1] > percentages[0] else "down"

        result.append({
            "subject_id": sub.id,
            "subject_name": sub.name,
            "subject_color": sub.color,
            "avg": avg,
            "scores": last5,
            "trend": trend,
            "records": [r.to_dict() for r in records],
        })
    return jsonify(result), 200


@performance_bp.route("/insights", methods=["GET"])
@jwt_required()
def insights():
    """AI-generated weak/strong subject insights."""
    uid = get_user_id()
    subjects = Subject.query.filter_by(user_id=uid).all()
    api_key = current_app.config.get("ANTHROPIC_API_KEY", "")

    subject_data = []
    for sub in subjects:
        records = Performance.query.filter_by(user_id=uid, subject_id=sub.id).all()
        if records:
            avg = round(sum((r.score / r.max_score) * 100 for r in records) / len(records), 1)
        else:
            avg = 0
        subject_data.append({
            "name": sub.name,
            "avg": avg,
            "progress": sub.progress,
            "difficulty": sub.difficulty,
            "exam_date": sub.exam_date.isoformat() if sub.exam_date else None,
        })

    insights_text = generate_performance_insights(subject_data, api_key)
    return jsonify({"insights": insights_text}), 200
