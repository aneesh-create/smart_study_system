"""
Database Models for Smart Study Management System
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    roll_number = db.Column(db.String(50))
    institution = db.Column(db.String(150))
    semester = db.Column(db.String(50))
    daily_study_goal = db.Column(db.Float, default=6.0)
    preferred_study_time = db.Column(db.String(20), default="morning")
    learning_style = db.Column(db.String(30), default="visual")
    notifications_enabled = db.Column(db.Boolean, default=True)
    ai_recommendations = db.Column(db.Boolean, default=True)
    target_percentage = db.Column(db.Float, default=85.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subjects = db.relationship("Subject", backref="user", lazy=True, cascade="all, delete-orphan")
    notes = db.relationship("Note", backref="user", lazy=True, cascade="all, delete-orphan")
    reminders = db.relationship("Reminder", backref="user", lazy=True, cascade="all, delete-orphan")
    schedules = db.relationship("ScheduleSlot", backref="user", lazy=True, cascade="all, delete-orphan")
    performances = db.relationship("Performance", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "roll_number": self.roll_number,
            "institution": self.institution,
            "semester": self.semester,
            "daily_study_goal": self.daily_study_goal,
            "preferred_study_time": self.preferred_study_time,
            "learning_style": self.learning_style,
            "notifications_enabled": self.notifications_enabled,
            "ai_recommendations": self.ai_recommendations,
            "target_percentage": self.target_percentage,
            "created_at": self.created_at.isoformat(),
        }


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(10), default="#4f8ef7")
    difficulty = db.Column(db.Integer, default=3)   # 1–5
    total_chapters = db.Column(db.Integer, default=10)
    completed_chapters = db.Column(db.Integer, default=0)
    hours_per_day = db.Column(db.Float, default=2.0)
    exam_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    notes = db.relationship("Note", backref="subject", lazy=True, cascade="all, delete-orphan")
    reminders = db.relationship("Reminder", backref="subject", lazy=True)
    schedules = db.relationship("ScheduleSlot", backref="subject", lazy=True, cascade="all, delete-orphan")
    performances = db.relationship("Performance", backref="subject", lazy=True, cascade="all, delete-orphan")

    @property
    def progress(self):
        if self.total_chapters == 0:
            return 0
        return round((self.completed_chapters / self.total_chapters) * 100)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color,
            "difficulty": self.difficulty,
            "total_chapters": self.total_chapters,
            "completed_chapters": self.completed_chapters,
            "progress": self.progress,
            "hours_per_day": self.hours_per_day,
            "exam_date": self.exam_date.isoformat() if self.exam_date else None,
            "created_at": self.created_at.isoformat(),
        }


class ScheduleSlot(db.Model):
    __tablename__ = "schedule_slots"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)   # 0=Sun … 6=Sat
    hour = db.Column(db.Integer, nullable=False)           # 0–23
    slot_type = db.Column(db.String(20), default="study")  # study | revision | exam
    duration_minutes = db.Column(db.Integer, default=90)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else "",
            "subject_color": self.subject.color if self.subject else "#4f8ef7",
            "day_of_week": self.day_of_week,
            "hour": self.hour,
            "slot_type": self.slot_type,
            "duration_minutes": self.duration_minutes,
        }


class Note(db.Model):
    __tablename__ = "notes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    ai_summary = db.Column(db.Text, nullable=True)
    tags = db.Column(db.String(500), default="")   # comma-separated
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else "",
            "title": self.title,
            "content": self.content,
            "ai_summary": self.ai_summary,
            "tags": [t.strip() for t in self.tags.split(",") if t.strip()],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class Reminder(db.Model):
    __tablename__ = "reminders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    reminder_type = db.Column(db.String(30), default="revision")  # revision|assignment|quiz|test|exam
    reminder_datetime = db.Column(db.DateTime, nullable=False)
    is_done = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else "General",
            "title": self.title,
            "reminder_type": self.reminder_type,
            "reminder_datetime": self.reminder_datetime.isoformat(),
            "is_done": self.is_done,
            "created_at": self.created_at.isoformat(),
        }


class Performance(db.Model):
    __tablename__ = "performances"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    test_name = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Float, nullable=False)       # percentage
    max_score = db.Column(db.Float, default=100.0)
    test_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else "",
            "test_name": self.test_name,
            "score": self.score,
            "max_score": self.max_score,
            "percentage": round((self.score / self.max_score) * 100, 1),
            "test_date": self.test_date.isoformat(),
            "notes": self.notes,
        }


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(10), nullable=False)   # user | assistant
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
        }
