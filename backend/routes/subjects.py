"""
Subjects Routes
GET    /api/subjects/
POST   /api/subjects/
GET    /api/subjects/<id>
PUT    /api/subjects/<id>
DELETE /api/subjects/<id>
POST   /api/subjects/<id>/complete-chapter
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Subject
from datetime import date

subjects_bp = Blueprint("subjects", __name__)


def get_user_id():
    return int(get_jwt_identity())


@subjects_bp.route("/", methods=["GET"])
@jwt_required()
def get_subjects():
    subjects = Subject.query.filter_by(user_id=get_user_id()).all()
    return jsonify([s.to_dict() for s in subjects]), 200


@subjects_bp.route("/", methods=["POST"])
@jwt_required()
def create_subject():
    data = request.get_json()
    if not data.get("name"):
        return jsonify({"error": "Subject name is required"}), 400

    exam_date = None
    if data.get("exam_date"):
        try:
            exam_date = date.fromisoformat(data["exam_date"])
        except ValueError:
            return jsonify({"error": "Invalid exam_date format (use YYYY-MM-DD)"}), 400

    subject = Subject(
        user_id=get_user_id(),
        name=data["name"],
        color=data.get("color", "#4f8ef7"),
        difficulty=int(data.get("difficulty", 3)),
        total_chapters=int(data.get("total_chapters", 10)),
        completed_chapters=int(data.get("completed_chapters", 0)),
        hours_per_day=float(data.get("hours_per_day", 2.0)),
        exam_date=exam_date,
    )
    db.session.add(subject)
    db.session.commit()
    return jsonify(subject.to_dict()), 201


@subjects_bp.route("/<int:subject_id>", methods=["GET"])
@jwt_required()
def get_subject(subject_id):
    subject = Subject.query.filter_by(id=subject_id, user_id=get_user_id()).first_or_404()
    return jsonify(subject.to_dict()), 200


@subjects_bp.route("/<int:subject_id>", methods=["PUT"])
@jwt_required()
def update_subject(subject_id):
    subject = Subject.query.filter_by(id=subject_id, user_id=get_user_id()).first_or_404()
    data = request.get_json()

    if "name" in data:
        subject.name = data["name"]
    if "color" in data:
        subject.color = data["color"]
    if "difficulty" in data:
        subject.difficulty = int(data["difficulty"])
    if "total_chapters" in data:
        subject.total_chapters = int(data["total_chapters"])
    if "completed_chapters" in data:
        subject.completed_chapters = int(data["completed_chapters"])
    if "hours_per_day" in data:
        subject.hours_per_day = float(data["hours_per_day"])
    if "exam_date" in data:
        try:
            subject.exam_date = date.fromisoformat(data["exam_date"]) if data["exam_date"] else None
        except ValueError:
            return jsonify({"error": "Invalid exam_date format"}), 400

    db.session.commit()
    return jsonify(subject.to_dict()), 200


@subjects_bp.route("/<int:subject_id>", methods=["DELETE"])
@jwt_required()
def delete_subject(subject_id):
    subject = Subject.query.filter_by(id=subject_id, user_id=get_user_id()).first_or_404()
    db.session.delete(subject)
    db.session.commit()
    return jsonify({"message": "Subject deleted"}), 200


@subjects_bp.route("/<int:subject_id>/complete-chapter", methods=["POST"])
@jwt_required()
def complete_chapter(subject_id):
    subject = Subject.query.filter_by(id=subject_id, user_id=get_user_id()).first_or_404()
    if subject.completed_chapters < subject.total_chapters:
        subject.completed_chapters += 1
        db.session.commit()
    return jsonify(subject.to_dict()), 200
