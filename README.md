# Smart Study Management System using AI

> An AI-powered academic platform that generates personalised study schedules, tracks syllabus progress, delivers intelligent reminders, and provides a Claude-powered assistant — all in one full-stack application.

**Team:** T. Aneesh Krishna · A. Varun Vijay · B. Hari Krishna  
**Guide:** Mr. Konka Kishan (Associate Professor)  
**Coordinator:** Mr. Sasiram Anupoju (Assistant Professor)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Python 3.11, Flask 3, Flask-JWT-Extended, SQLAlchemy |
| Database | SQLite (dev) / MySQL or PostgreSQL (prod) |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Auth | JWT (JSON Web Tokens) |

---

## Features

- **Dashboard** — overall progress, AI recommendations, today's sessions, exam countdown
- **Subjects** — CRUD with difficulty, chapter tracking, colour coding, exam dates
- **Schedule** — AI-generated weekly timetable (priority-based algorithm)
- **Notes** — rich notes with AI summarisation (Claude API)
- **Performance** — score tracking, trend charts, AI insights
- **Reminders** — smart reminders with mark-done/undo
- **AI Assistant** — full Claude chat, 7-day study plan generator, interactive quiz
- **Settings** — profile, study goals, learning style, notification toggles

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- An Anthropic API key → https://console.anthropic.com

---

### 1. Clone / unzip the project

```bash
cd smart_study_system
```

---

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Activate
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your ANTHROPIC_API_KEY

python app.py
```

Backend runs at **http://localhost:5000**

Demo credentials are auto-seeded:
- Email: `demo@studyai.com`
- Password: `demo1234`

---

### 3. Frontend setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at **http://localhost:3000**

The `"proxy": "http://localhost:5000"` in `package.json` forwards all `/api` requests to Flask automatically.

---

## Environment Variables (backend/.env)

```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
FLASK_ENV=development
ANTHROPIC_API_KEY=sk-ant-...your-key-here...

# Optional: switch to MySQL
# DATABASE_URL=mysql+pymysql://user:pass@localhost/study_db
```

---

## Project Structure

```
smart_study_system/
├── backend/
│   ├── app.py                  # Flask entry point
│   ├── models.py               # SQLAlchemy models (User, Subject, Note, …)
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   │   ├── auth.py             # Register, Login, Profile
│   │   ├── subjects.py         # Subject CRUD + chapter completion
│   │   ├── schedule.py         # Schedule CRUD + AI generation
│   │   ├── notes.py            # Notes CRUD + AI summarisation
│   │   ├── reminders.py        # Reminder CRUD + toggle
│   │   ├── performance.py      # Score tracking + analytics + AI insights
│   │   ├── ai_assistant.py     # Chat, study plan, quiz generation
│   │   └── dashboard.py        # Aggregated dashboard summary
│   ├── services/
│   │   ├── ai_service.py       # All Claude API calls
│   │   └── schedule_service.py # Priority-based schedule algorithm
│   └── utils/
│       └── seed.py             # Demo data seeder
│
├── frontend/
│   ├── public/index.html
│   ├── package.json
│   └── src/
│       ├── App.js              # Router + protected routes
│       ├── index.js
│       ├── context/
│       │   └── AuthContext.js  # JWT token + user state
│       ├── utils/
│       │   ├── api.js          # Axios instance with auth interceptor
│       │   └── ui.js           # Shared UI components (ProgressRing, etc.)
│       ├── styles/
│       │   └── global.css      # Full design system CSS
│       ├── components/
│       │   └── Layout/         # Sidebar + topbar shell
│       └── pages/
│           ├── LoginPage.js
│           ├── RegisterPage.js
│           ├── DashboardPage.js
│           ├── SubjectsPage.js
│           ├── SchedulePage.js
│           ├── NotesPage.js
│           ├── PerformancePage.js
│           ├── RemindersPage.js
│           ├── AIAssistantPage.js
│           └── SettingsPage.js
│
├── docker-compose.yml          # One-command Docker setup
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile/settings |

### Subjects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects/` | List all subjects |
| POST | `/api/subjects/` | Create subject |
| PUT | `/api/subjects/<id>` | Update subject |
| DELETE | `/api/subjects/<id>` | Delete subject |
| POST | `/api/subjects/<id>/complete-chapter` | Mark chapter done |

### Schedule
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedule/` | Get weekly schedule |
| POST | `/api/schedule/` | Add slot manually |
| DELETE | `/api/schedule/<id>` | Remove slot |
| POST | `/api/schedule/generate` | AI-generate full schedule |
| DELETE | `/api/schedule/clear` | Clear all slots |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes/` | List notes (filter by subject_id) |
| POST | `/api/notes/` | Create note |
| PUT | `/api/notes/<id>` | Update note |
| DELETE | `/api/notes/<id>` | Delete note |
| POST | `/api/notes/<id>/summarize` | AI summarise note |
| POST | `/api/notes/search` | Full-text search |

### Reminders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reminders/` | List reminders |
| POST | `/api/reminders/` | Create reminder |
| PUT | `/api/reminders/<id>` | Update reminder |
| DELETE | `/api/reminders/<id>` | Delete reminder |
| POST | `/api/reminders/<id>/toggle` | Toggle done/pending |
| GET | `/api/reminders/upcoming` | Next 7 days |

### Performance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/performance/` | List records |
| POST | `/api/performance/` | Add test score |
| DELETE | `/api/performance/<id>` | Delete record |
| GET | `/api/performance/analytics` | Per-subject averages + trends |
| GET | `/api/performance/insights` | AI performance insights |

### AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Chat with Claude |
| GET | `/api/ai/history` | Load chat history |
| DELETE | `/api/ai/history` | Clear history |
| POST | `/api/ai/study-plan` | Generate study plan |
| POST | `/api/ai/quiz` | Generate MCQ quiz |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Full dashboard data |

---

## Docker (Optional)

```bash
# From project root
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## Production Deployment

1. Set `FLASK_ENV=production` and use a strong `SECRET_KEY`
2. Switch `DATABASE_URL` to MySQL/PostgreSQL
3. Build frontend: `npm run build` (serves from `frontend/build/`)
4. Use Gunicorn: `gunicorn app:create_app() -w 4 -b 0.0.0.0:5000`
5. Configure nginx to serve React build + proxy `/api` to Gunicorn

---

## License

Academic project — Malla Reddy Engineering College, 2025
