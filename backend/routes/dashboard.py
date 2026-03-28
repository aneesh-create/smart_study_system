"""
Dashboard Routes
GET /api/dashboard/summary  – aggregated overview for home screen
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Subject, Reminder, ScheduleSlot, Performance
from datetime import datetime, timedelta, date

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    uid = int(get_jwt_identity())
    today = datetime.utcnow()
    today_weekday = today.weekday()  # Mon=0, Sun=6 → convert to Sun=0
    day_of_week = (today_weekday + 1) % 7

    subjects = Subject.query.filter_by(user_id=uid).all()
    subject_list = [s.to_dict() for s in subjects]

    # Overall progress
    overall_progress = 0
    if subjects:
        overall_progress = round(sum(s.progress for s in subjects) / len(subjects))

    # Today's schedule
    today_slots = ScheduleSlot.query.filter_by(user_id=uid, day_of_week=day_of_week).all()

    # Pending reminders
    pending_reminders = Reminder.query.filter_by(user_id=uid, is_done=False)\
        .order_by(Reminder.reminder_datetime.asc()).limit(5).all()

    # Exam countdowns
    exams = []
    for s in subjects:
        if s.exam_date:
            days_left = (s.exam_date - date.today()).days
            exams.append({
                "subject": s.name,
                "exam_date": s.exam_date.isoformat(),
                "days_left": days_left,
                "color": s.color,
            })
    exams.sort(key=lambda x: x["days_left"])

    # Performance summary
    perf_data = {}
    perfs = Performance.query.filter_by(user_id=uid).all()
    for p in perfs:
        name = p.subject.name if p.subject else "Unknown"
        pct = round((p.score / p.max_score) * 100, 1)
        perf_data.setdefault(name, []).append(pct)
    perf_summary = {k: round(sum(v) / len(v), 1) for k, v in perf_data.items()}

    # AI recommendations (rule-based)
    recommendations = []
    for s in subjects:
        if s.progress < 50:
            recommendations.append({"type": "warning", "message": f"{s.name} is below 50% – needs urgent attention"})
        elif s.progress < 70:
            recommendations.append({"type": "info", "message": f"{s.name} is at {s.progress}% – increase study hours"})
    if overall_progress >= 80:
        recommendations.append({"type": "success", "message": "Great progress! You are on track for exams."})

    return jsonify({
        "overall_progress": overall_progress,
        "total_subjects": len(subjects),
        "subjects": subject_list,
        "today_slots": [sl.to_dict() for sl in today_slots],
        "pending_reminders": [r.to_dict() for r in pending_reminders],
        "exam_countdowns": exams,
        "performance_summary": perf_summary,
        "recommendations": recommendations,
    }), 200
