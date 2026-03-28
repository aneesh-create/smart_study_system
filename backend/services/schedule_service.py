"""
Schedule Generation Service
Generates an optimised weekly study schedule based on:
- Subject difficulty (higher difficulty → more slots)
- Days until exam (closer exam → higher priority)
- Progress (lower progress → more slots)
- Preferred hours (morning / afternoon / evening)
"""

from models import ScheduleSlot
from datetime import date
import random


MORNING_HOURS = [8, 9, 10, 11]
AFTERNOON_HOURS = [12, 13, 14, 15, 16]
EVENING_HOURS = [17, 18, 19, 20]
ALL_HOURS = MORNING_HOURS + AFTERNOON_HOURS + EVENING_HOURS

DAYS = list(range(7))  # 0=Sun … 6=Sat


def _priority_score(subject) -> float:
    """Higher score → more slots assigned."""
    score = 0.0

    # Difficulty weight
    score += subject.difficulty * 2  # 2–10

    # Progress weight (less done → higher priority)
    score += (100 - subject.progress) / 10  # 0–10

    # Exam proximity weight
    if subject.exam_date:
        days_left = (subject.exam_date - date.today()).days
        if days_left <= 0:
            score += 15
        elif days_left <= 7:
            score += 12
        elif days_left <= 14:
            score += 8
        elif days_left <= 30:
            score += 4
    else:
        score += 2

    return score


def generate_ai_schedule(user_id: int, subjects) -> list:
    """
    Returns a list of ScheduleSlot objects for the week.
    Distributes study/revision slots across 7 days.
    """
    occupied = {}   # (day, hour) → True
    slots = []

    # Score and sort subjects
    scored = sorted(subjects, key=_priority_score, reverse=True)
    total_score = sum(_priority_score(s) for s in scored)

    # Total available slots in the week (one slot per hour, 7 days)
    # We'll aim for max 4 sessions/day (4 * 7 = 28 slots)
    MAX_SLOTS_PER_DAY = 4
    all_available = [
        (day, hour)
        for day in DAYS
        for hour in ALL_HOURS
    ]
    random.shuffle(all_available)

    # Pre-plan: how many total slots per subject
    TOTAL_WEEKLY_SLOTS = 20
    subject_slot_counts = {}
    for sub in scored:
        proportion = _priority_score(sub) / total_score if total_score > 0 else 1 / len(scored)
        count = max(2, round(proportion * TOTAL_WEEKLY_SLOTS))
        subject_slot_counts[sub.id] = count

    # Assign slots
    day_slot_count = {d: 0 for d in DAYS}

    for sub in scored:
        target = subject_slot_counts[sub.id]
        assigned = 0
        revision_due = max(1, target // 3)   # ~1/3 of slots are revision

        for (day, hour) in all_available:
            if assigned >= target:
                break
            if (day, hour) in occupied:
                continue
            if day_slot_count[day] >= MAX_SLOTS_PER_DAY:
                continue

            slot_type = "revision" if assigned >= (target - revision_due) else "study"
            slot = ScheduleSlot(
                user_id=user_id,
                subject_id=sub.id,
                day_of_week=day,
                hour=hour,
                slot_type=slot_type,
                duration_minutes=90,
            )
            slots.append(slot)
            occupied[(day, hour)] = True
            day_slot_count[day] += 1
            assigned += 1

    # Add exam markers for subjects with exam in next 14 days
    for sub in subjects:
        if not sub.exam_date:
            continue
        days_left = (sub.exam_date - date.today()).days
        if 0 <= days_left <= 14:
            for day in range(days_left % 7, 7):
                for hour in [9, 14]:
                    if (day, hour) not in occupied and day_slot_count.get(day, 0) < MAX_SLOTS_PER_DAY:
                        slot = ScheduleSlot(
                            user_id=user_id,
                            subject_id=sub.id,
                            day_of_week=day,
                            hour=hour,
                            slot_type="exam",
                            duration_minutes=60,
                        )
                        slots.append(slot)
                        occupied[(day, hour)] = True
                        day_slot_count[day] = day_slot_count.get(day, 0) + 1
                        break

    return slots
