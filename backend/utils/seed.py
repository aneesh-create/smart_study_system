"""
Seed demo data for development/demo purposes.
Only runs if no users exist in the database.
"""

from models import db, User, Subject, Note, Reminder, ScheduleSlot, Performance
from datetime import date, datetime, timedelta


def seed_demo_data():
    if User.query.first():
        return   # Already seeded

    # ── Demo User ─────────────────────────────────────────────
    user = User(
        name="Aneesh Krishna",
        email="demo@studyai.com",
        roll_number="23AG1A66I5",
        institution="Malla Reddy Engineering College",
        semester="Semester 3",
        daily_study_goal=6.0,
        preferred_study_time="morning",
        learning_style="visual",
    )
    user.set_password("demo1234")
    db.session.add(user)
    db.session.flush()

    # ── Subjects ──────────────────────────────────────────────
    subjects_data = [
        {"name": "Mathematics",       "color": "#4f8ef7", "difficulty": 4, "total_chapters": 12, "completed_chapters": 8,  "hours_per_day": 2.0, "exam_date": date.today() + timedelta(days=10)},
        {"name": "Physics",           "color": "#7c3aed", "difficulty": 3, "total_chapters": 10, "completed_chapters": 5,  "hours_per_day": 1.5, "exam_date": date.today() + timedelta(days=12)},
        {"name": "Chemistry",         "color": "#06b6d4", "difficulty": 4, "total_chapters": 14, "completed_chapters": 6,  "hours_per_day": 2.0, "exam_date": date.today() + timedelta(days=14)},
        {"name": "Computer Science",  "color": "#10b981", "difficulty": 2, "total_chapters": 8,  "completed_chapters": 6,  "hours_per_day": 1.0, "exam_date": date.today() + timedelta(days=16)},
        {"name": "English",           "color": "#f59e0b", "difficulty": 1, "total_chapters": 6,  "completed_chapters": 5,  "hours_per_day": 0.5, "exam_date": date.today() + timedelta(days=18)},
    ]
    subjects = []
    for sd in subjects_data:
        s = Subject(user_id=user.id, **sd)
        db.session.add(s)
        subjects.append(s)
    db.session.flush()

    # ── Notes ─────────────────────────────────────────────────
    notes_data = [
        {"subject": "Mathematics",      "title": "Integration Formulas",       "content": "Key integration formulas:\n- ∫x^n dx = x^(n+1)/(n+1) + C\n- ∫sin(x) dx = -cos(x) + C\n- Substitution method: u = g(x)\n- Integration by parts: ∫u dv = uv - ∫v du", "tags": "formulas,calculus,integration"},
        {"subject": "Physics",          "title": "Newton's Laws Summary",       "content": "1st Law: An object remains at rest or uniform motion unless acted upon by force.\n2nd Law: F = ma (Net force = mass × acceleration)\n3rd Law: Every action has an equal and opposite reaction.\nApplications: projectile motion, circular motion, friction.", "tags": "mechanics,laws,newton"},
        {"subject": "Chemistry",        "title": "Periodic Table Groups",       "content": "Group 1 - Alkali metals: Li, Na, K, Rb, Cs\nGroup 17 - Halogens: F, Cl, Br, I\nGroup 18 - Noble gases: He, Ne, Ar\nReactivity increases down Group 1, decreases across periods.", "tags": "periodic table,elements,groups"},
        {"subject": "Computer Science", "title": "Data Structures Overview",   "content": "Arrays: O(1) access, O(n) insert\nLinked List: O(n) access, O(1) insert at head\nStack: LIFO – push/pop\nQueue: FIFO – enqueue/dequeue\nBST: O(log n) search avg", "tags": "data structures,complexity"},
    ]
    for nd in notes_data:
        subj = next((s for s in subjects if s.name == nd["subject"]), subjects[0])
        n = Note(user_id=user.id, subject_id=subj.id, title=nd["title"], content=nd["content"], tags=nd["tags"])
        db.session.add(n)

    # ── Reminders ─────────────────────────────────────────────
    reminders_data = [
        {"title": "Math Exam Revision",       "subject": "Mathematics",      "type": "revision",   "dt": datetime.utcnow() + timedelta(days=1, hours=9),  "done": False},
        {"title": "Submit Physics Assignment", "subject": "Physics",          "type": "assignment", "dt": datetime.utcnow() + timedelta(hours=18),          "done": False},
        {"title": "Chemistry Chapter 7 Quiz",  "subject": "Chemistry",        "type": "quiz",       "dt": datetime.utcnow() + timedelta(days=2, hours=10), "done": True},
        {"title": "CS Mock Test",              "subject": "Computer Science", "type": "test",       "dt": datetime.utcnow() + timedelta(days=2, hours=14), "done": False},
        {"title": "English Essay Submission",  "subject": "English",          "type": "assignment", "dt": datetime.utcnow() + timedelta(days=3, hours=12), "done": True},
    ]
    for rd in reminders_data:
        subj = next((s for s in subjects if s.name == rd["subject"]), subjects[0])
        r = Reminder(user_id=user.id, subject_id=subj.id, title=rd["title"],
                     reminder_type=rd["type"], reminder_datetime=rd["dt"], is_done=rd["done"])
        db.session.add(r)

    # ── Schedule Slots ────────────────────────────────────────
    schedule_raw = [
        (0, 8, "Mathematics",      "study"),
        (0, 10,"Physics",          "study"),
        (0, 15,"Chemistry",        "revision"),
        (1, 9, "Computer Science", "study"),
        (1, 11,"English",          "study"),
        (1, 16,"Mathematics",      "revision"),
        (2, 8, "Chemistry",        "study"),
        (2, 14,"Physics",          "revision"),
        (3, 9, "Mathematics",      "study"),
        (3, 11,"Computer Science", "revision"),
        (4, 8, "Physics",          "study"),
        (4, 10,"English",          "revision"),
        (5, 9, "Mathematics",      "study"),
        (5, 11,"Physics",          "study"),
        (6, 10,"Chemistry",        "revision"),
        (6, 14,"Computer Science", "study"),
    ]
    for day, hour, sub_name, stype in schedule_raw:
        subj = next((s for s in subjects if s.name == sub_name), subjects[0])
        slot = ScheduleSlot(user_id=user.id, subject_id=subj.id,
                            day_of_week=day, hour=hour, slot_type=stype)
        db.session.add(slot)

    # ── Performance Records ───────────────────────────────────
    perf_data = [
        ("Mathematics",      [("Test 1",72),("Test 2",75),("Test 3",80),("Test 4",78),("Test 5",85)]),
        ("Physics",          [("Test 1",60),("Test 2",65),("Test 3",68),("Test 4",72),("Test 5",70)]),
        ("Chemistry",        [("Test 1",50),("Test 2",55),("Test 3",60),("Test 4",58),("Test 5",65)]),
        ("Computer Science", [("Test 1",85),("Test 2",88),("Test 3",90),("Test 4",92),("Test 5",95)]),
        ("English",          [("Test 1",88),("Test 2",90),("Test 3",92),("Test 4",91),("Test 5",94)]),
    ]
    base_date = date.today() - timedelta(days=90)
    for sub_name, tests in perf_data:
        subj = next((s for s in subjects if s.name == sub_name), subjects[0])
        for i, (tname, score) in enumerate(tests):
            p = Performance(
                user_id=user.id,
                subject_id=subj.id,
                test_name=tname,
                score=score,
                max_score=100,
                test_date=base_date + timedelta(days=i*15),
            )
            db.session.add(p)

    db.session.commit()
    print("✅ Demo data seeded. Login: demo@studyai.com / demo1234")
