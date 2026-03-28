import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ProgressRing, DaysLeft, Spinner } from '../utils/ui';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary').then(r => { setData(r.data); setLoading(false); });
  }, []);

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>;
  if (!data) return null;

  const { overall_progress, total_subjects, subjects, today_slots, pending_reminders, exam_countdowns, recommendations } = data;

  return (
    <div className="page-fade">
      {/* Header */}
      <div className="flex justify-between items-center mb-20">
        <div>
          <h2 className="font-syne" style={{fontSize:'1.5rem',fontWeight:800}}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h2>
          <div className="text-muted text-sm">Here's your academic overview for today</div>
        </div>
        <span className="badge-pill">🎓 {user?.semester || 'Semester'}</span>
      </div>

      {/* Stat cards */}
      <div className="grid-4 mb-20">
        <div className="stat-card blue">
          <div className="stat-val">{overall_progress}%</div>
          <div className="stat-label">Overall Syllabus</div>
          <div className="stat-sub">↑ Based on chapter progress</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-val">{total_subjects}</div>
          <div className="stat-label">Active Subjects</div>
          <div className="stat-sub">{subjects.filter(s=>s.progress>=70).length} on track</div>
        </div>
        <div className="stat-card green">
          <div className="stat-val">{today_slots.length}</div>
          <div className="stat-label">Sessions Today</div>
          <div className="stat-sub">~{(today_slots.length * 1.5).toFixed(1)}h planned</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-val">{pending_reminders.length}</div>
          <div className="stat-label">Pending Tasks</div>
          <div className="stat-sub">Upcoming reminders</div>
        </div>
      </div>

      <div className="grid-2 mb-20">
        {/* Subject Progress */}
        <div className="card">
          <div className="card-title">📚 Subject Progress</div>
          {subjects.map(s => (
            <div key={s.id} style={{marginBottom:14}}>
              <div className="flex justify-between mb-4">
                <span style={{fontSize:'0.85rem',fontWeight:600,color:s.color}}>{s.name}</span>
                <span className="text-sm text-muted">
                  {s.completed_chapters}/{s.total_chapters} ch ·{' '}
                  <span style={{color: s.progress>=70?'var(--green)':'var(--yellow)'}}>{s.progress}%</span>
                </span>
              </div>
              <div className="progress-wrap">
                <div className="progress-fill" style={{width:s.progress+'%', background:s.color}} />
              </div>
            </div>
          ))}
        </div>

        {/* AI Recommendations */}
        <div className="card">
          <div className="card-title">🤖 AI Recommendations</div>
          {recommendations.length === 0
            ? <div className="alert alert-success">✅ All subjects are on track! Keep it up.</div>
            : recommendations.map((r,i) => (
              <div key={i} className={`alert alert-${r.type==='warning'?'warn':r.type==='success'?'success':'info'}`}>
                {r.type==='warning'?'⚠️':r.type==='success'?'✅':'💡'} {r.message}
              </div>
            ))
          }
          {/* Daily allocation */}
          <hr className="divider" />
          <div className="text-sm text-muted mb-8">AI Daily Hour Allocation</div>
          {subjects.map(s => (
            <div key={s.id} className="flex items-center gap-10 mb-8">
              <div style={{width:120,fontSize:'0.78rem',color:'var(--text2)'}}>{s.name}</div>
              <div style={{flex:1}} className="progress-wrap">
                <div className="progress-fill" style={{width:`${(s.hours_per_day/4)*100}%`, background:s.color}} />
              </div>
              <div className="text-xs text-muted2" style={{width:32}}>{s.hours_per_day}h</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2 mb-20">
        {/* Today's Schedule */}
        <div className="card">
          <div className="card-title">⏰ Today's Sessions</div>
          {today_slots.length === 0
            ? <div className="text-muted text-sm" style={{padding:'20px 0',textAlign:'center'}}>No sessions scheduled today</div>
            : today_slots.map((sl, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{
                  width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',
                  background: sl.slot_type==='exam'?'rgba(239,68,68,0.15)':sl.slot_type==='revision'?'rgba(16,185,129,0.15)':'rgba(79,142,247,0.15)'
                }}>
                  {sl.slot_type==='exam'?'📝':sl.slot_type==='revision'?'🔄':'📖'}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.88rem',fontWeight:600}}>{sl.subject_name}</div>
                  <div className="text-xs text-muted2">{sl.hour}:00 – {sl.hour+1}:30</div>
                </div>
                <span className={`tag tag-${sl.slot_type==='exam'?'red':sl.slot_type==='revision'?'green':'blue'}`}>
                  {sl.slot_type}
                </span>
              </div>
            ))
          }
        </div>

        {/* Exam Countdown */}
        <div className="card">
          <div className="card-title">📅 Exam Countdown</div>
          {exam_countdowns.slice(0, 6).map((e, i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:36,height:36,borderRadius:10,background:e.color+'22',display:'flex',alignItems:'center',justifyContent:'center'}}>📝</div>
              <div style={{flex:1}}>
                <div style={{fontSize:'0.88rem',fontWeight:600}}>{e.subject}</div>
                <div className="text-xs text-muted2">{e.exam_date}</div>
              </div>
              <DaysLeft date={e.exam_date} />
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Reminders */}
      {pending_reminders.length > 0 && (
        <div className="card">
          <div className="card-title">🔔 Upcoming Reminders</div>
          <div className="grid-2">
            {pending_reminders.map(r => (
              <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0'}}>
                <div style={{width:36,height:36,borderRadius:10,background:'rgba(245,158,11,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>🔔</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.88rem',fontWeight:600}}>{r.title}</div>
                  <div className="text-xs text-muted2">{r.subject_name} · {new Date(r.reminder_datetime).toLocaleString()}</div>
                </div>
                <span className="tag tag-yellow">{r.reminder_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
