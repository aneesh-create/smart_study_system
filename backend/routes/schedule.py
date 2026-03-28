"""
Schedule Routes
GET    /api/schedule/
POST   /api/schedule/
DELETE /api/schedule/<id>
POST   /api/schedule/generate   – AI-powered schedule generation
DELETE /api/schedule/clear      – Clear all slots
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, ScheduleSlot, Subject
from services.schedule_service import generate_ai_schedule

schedule_bp = Blueprint("schedule", __name__)


def get_user_id():
    return int(get_jwt_identity())


@schedule_bp.route("/", methods=["GET"])
@jwt_required()
def get_schedule():
    slots = ScheduleSlot.query.filter_by(user_id=get_user_id()).all()
    return jsonify([s.to_dict() for s in slots]), 200


@schedule_bp.route("/", methods=["POST"])
@jwt_required()
def create_slot():
    data = request.get_json()
    required = ["subject_id", "day_of_week", "hour"]
    for f in required:
        if f not in data:
            return jsonify({"error": f"{f} is required"}), 400

    # Prevent duplicate
    existing = ScheduleSlot.query.filter_by(
        user_id=get_user_id(),
        day_of_week=int(data["day_of_week"]),
        hour=int(data["hour"])
    ).first()
    if existing:
        return jsonify({"error": "Slot already occupied"}), 409

    slot = ScheduleSlot(
        user_id=get_user_id(),
        subject_id=int(data["subject_id"]),
        day_of_week=int(data["day_of_week"]),
        hour=int(data["hour"]),
        slot_type=data.get("slot_type", "study"),
        duration_minutes=int(data.get("duration_minutes", 90)),
    )
    db.session.add(slot)
    db.session.commit()
    return jsonify(slot.to_dict()), 201


@schedule_bp.route("/<int:slot_id>", methods=["DELETE"])
@jwt_required()
def delete_slot(slot_id):
    slot = ScheduleSlot.query.filter_by(id=slot_id, user_id=get_user_id()).first_or_404()
    db.session.delete(slot)
    db.session.commit()
    return jsonify({"message": "Slot deleted"}), 200


@schedule_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate_schedule():
    """AI-powered schedule generation based on subjects, difficulty & exam dates."""
    uid = get_user_id()
    subjects = Subject.query.filter_by(user_id=uid).all()
    if not subjects:
        return jsonify({"error": "Add subjects first"}), 400

    # Clear old schedule
    ScheduleSlot.query.filter_by(user_id=uid).delete()
    db.session.commit()

    new_slots = generate_ai_schedule(uid, subjects)
    for slot in new_slots:
        db.session.add(slot)
    db.session.commit()

    slots = ScheduleSlot.query.filter_by(user_id=uid).all()
    return jsonify([s.to_dict() for s in slots]), 200


@schedule_bp.route("/clear", methods=["DELETE"])
@jwt_required()
def clear_schedule():
    ScheduleSlot.query.filter_by(user_id=get_user_id()).delete()
    db.session.commit()
    return jsonify({"message": "Schedule cleared"}), 200
