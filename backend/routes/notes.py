"""
Notes Routes
GET    /api/notes/
POST   /api/notes/
GET    /api/notes/<id>
PUT    /api/notes/<id>
DELETE /api/notes/<id>
POST   /api/notes/<id>/summarize  – AI summarization
POST   /api/notes/search          – Full-text search
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Note, Subject
from services.ai_service import summarize_notes

notes_bp = Blueprint("notes", __name__)


def get_user_id():
    return int(get_jwt_identity())


@notes_bp.route("/", methods=["GET"])
@jwt_required()
def get_notes():
    uid = get_user_id()
    subject_id = request.args.get("subject_id", type=int)
    query = Note.query.filter_by(user_id=uid)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    notes = query.order_by(Note.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notes]), 200


@notes_bp.route("/", methods=["POST"])
@jwt_required()
def create_note():
    data = request.get_json()
    for f in ["subject_id", "title", "content"]:
        if not data.get(f):
            return jsonify({"error": f"{f} is required"}), 400

    tags = data.get("tags", [])
    tags_str = ",".join(tags) if isinstance(tags, list) else tags

    note = Note(
        user_id=get_user_id(),
        subject_id=int(data["subject_id"]),
        title=data["title"],
        content=data["content"],
        tags=tags_str,
    )
    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_dict()), 201


@notes_bp.route("/<int:note_id>", methods=["GET"])
@jwt_required()
def get_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=get_user_id()).first_or_404()
    return jsonify(note.to_dict()), 200


@notes_bp.route("/<int:note_id>", methods=["PUT"])
@jwt_required()
def update_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=get_user_id()).first_or_404()
    data = request.get_json()

    if "title" in data:
        note.title = data["title"]
    if "content" in data:
        note.content = data["content"]
    if "tags" in data:
        tags = data["tags"]
        note.tags = ",".join(tags) if isinstance(tags, list) else tags

    db.session.commit()
    return jsonify(note.to_dict()), 200


@notes_bp.route("/<int:note_id>", methods=["DELETE"])
@jwt_required()
def delete_note(note_id):
    note = Note.query.filter_by(id=note_id, user_id=get_user_id()).first_or_404()
    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "Note deleted"}), 200


@notes_bp.route("/<int:note_id>/summarize", methods=["POST"])
@jwt_required()
def ai_summarize(note_id):
    note = Note.query.filter_by(id=note_id, user_id=get_user_id()).first_or_404()
    api_key = current_app.config.get("ANTHROPIC_API_KEY", "")

    summary = summarize_notes(note.content, note.title, api_key)
    note.ai_summary = summary
    db.session.commit()
    return jsonify({"summary": summary}), 200


@notes_bp.route("/search", methods=["POST"])
@jwt_required()
def search_notes():
    data = request.get_json()
    q = data.get("query", "").strip()
    if not q:
        return jsonify([]), 200

    uid = get_user_id()
    notes = Note.query.filter(
        Note.user_id == uid,
        (Note.title.ilike(f"%{q}%")) | (Note.content.ilike(f"%{q}%")) | (Note.tags.ilike(f"%{q}%"))
    ).order_by(Note.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notes]), 200
