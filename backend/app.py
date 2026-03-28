"""
Smart Study Management System - Flask Backend
Main application entry point
"""

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os

from models import db
from routes.auth import auth_bp
from routes.subjects import subjects_bp
from routes.schedule import schedule_bp
from routes.notes import notes_bp
from routes.reminders import reminders_bp
from routes.performance import performance_bp
from routes.ai_assistant import ai_bp
from routes.dashboard import dashboard_bp

def create_app(config_name="development"):
    app = Flask(__name__)

    # ── Configuration ─────────────────────────────────────────
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "jwt-secret-change-in-production")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

    # SQLite for development; swap to MySQL/PostgreSQL for production
    db_path = os.path.join(os.path.dirname(__file__), "study_system.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", f"sqlite:///{db_path}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Anthropic API Key
    app.config["ANTHROPIC_API_KEY"] = os.environ.get("ANTHROPIC_API_KEY", "")

    # ── Extensions ────────────────────────────────────────────
    CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])
    db.init_app(app)
    JWTManager(app)

    # ── Blueprints ────────────────────────────────────────────
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(subjects_bp, url_prefix="/api/subjects")
    app.register_blueprint(schedule_bp, url_prefix="/api/schedule")
    app.register_blueprint(notes_bp, url_prefix="/api/notes")
    app.register_blueprint(reminders_bp, url_prefix="/api/reminders")
    app.register_blueprint(performance_bp, url_prefix="/api/performance")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    # ── Create Tables ─────────────────────────────────────────
    with app.app_context():
        db.create_all()
        from utils.seed import seed_demo_data
        seed_demo_data()

    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "Smart Study Management System API running"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
