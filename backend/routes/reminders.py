"""
Reminders Routes
GET    /api/reminders/
POST   /api/reminders/
PUT    /api/reminders/<id>
DELETE /api/reminders/<id>
POST   /api/reminders/<id>/toggle   – mark done/undone
GET    /api/reminders/upcoming      – next 7 days
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Reminder
from datetime import datetime, timedelta

reminders_bp = Blueprint("reminders", __name__)


def get_user_id():
    return int(get_jwt_identity())


@reminders_bp.route("/", methods=["GET"])
@jwt_required()
def get_reminders():
    uid = get_user_id()
    show_done = request.args.get("done", "all")
    query = Reminder.query.filter_by(user_id=uid)
    if show_done == "pending":
        query = query.filter_by(is_done=False)
    elif show_done == "done":
        query = query.filter_by(is_done=True)
    reminders = query.order_by(Reminder.reminder_datetime.asc()).all()
    return jsonify([r.to_dict() for r in reminders]), 200


@reminders_bp.route("/upcoming", methods=["GET"])
@jwt_required()
def get_upcoming():
    uid = get_user_id()
    now = datetime.utcnow()
    week_later = now + timedelta(days=7)
    reminders = Reminder.query.filter(
        Reminder.user_id == uid,
        Reminder.is_done == False,
        Reminder.reminder_datetime.between(now, week_later)
    ).order_by(Reminder.reminder_datetime.asc()).all()
    return jsonify([r.to_dict() for r in reminders]), 200


@reminders_bp.route("/", methods=["POST"])
@jwt_required()
def create_reminder():
    data = request.get_json()
    for f in ["title", "reminder_datetime"]:
        if not data.get(f):
            return jsonify({"error": f"{f} is required"}), 400

    try:
        dt = datetime.fromisoformat(data["reminder_datetime"].replace("Z", ""))
    except ValueError:
        return jsonify({"error": "Invalid datetime format"}), 400

    reminder = Reminder(
        user_id=get_user_id(),
        subject_id=data.get("subject_id"),
        title=data["title"],
        reminder_type=data.get("reminder_type", "revision"),
        reminder_datetime=dt,
    )
    db.session.add(reminder)
    db.session.commit()
    return jsonify(reminder.to_dict()), 201


@reminders_bp.route("/<int:reminder_id>", methods=["PUT"])
@jwt_required()
def update_reminder(reminder_id):
    reminder = Reminder.query.filter_by(id=reminder_id, user_id=get_user_id()).first_or_404()
    data = request.get_json()
    if "title" in data:
        reminder.title = data["title"]
    if "reminder_type" in data:
        reminder.reminder_type = data["reminder_type"]
    if "reminder_datetime" in data:
        try:
            reminder.reminder_datetime = datetime.fromisoformat(data["reminder_datetime"].replace("Z", ""))
        except ValueError:
            return jsonify({"error": "Invalid datetime format"}), 400
    if "subject_id" in data:
        reminder.subject_id = data["subject_id"]
    db.session.commit()
    return jsonify(reminder.to_dict()), 200


@reminders_bp.route("/<int:reminder_id>", methods=["DELETE"])
@jwt_required()
def delete_reminder(reminder_id):
    reminder = Reminder.query.filter_by(id=reminder_id, user_id=get_user_id()).first_or_404()
    db.session.delete(reminder)
    db.session.commit()
    return jsonify({"message": "Reminder deleted"}), 200


@reminders_bp.route("/<int:reminder_id>/toggle", methods=["POST"])
@jwt_required()
def toggle_reminder(reminder_id):
    reminder = Reminder.query.filter_by(id=reminder_id, user_id=get_user_id()).first_or_404()
    reminder.is_done = not reminder.is_done
    db.session.commit()
    return jsonify(reminder.to_dict()), 200
