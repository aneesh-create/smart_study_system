import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { ProgressRing, difficultyLabel, difficultyTagClass, DaysLeft, Spinner, EmptyState } from '../utils/ui';

const COLORS = ['#4f8ef7','#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6'];
const EMPTY_FORM = { name:'', color:'#4f8ef7', difficulty:3, total_chapters:10, completed_chapters:0, hours_per_day:2, exam_date:'' };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/subjects/').then(r => { setSubjects(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setError(''); setModal(true); };
  const openEdit = s => {
    setForm({ name:s.name, color:s.color, difficulty:s.difficulty, total_chapters:s.total_chapters,
      completed_chapters:s.completed_chapters, hours_per_day:s.hours_per_day, exam_date:s.exam_date||'' });
    setEditId(s.id); setError(''); setModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setError('Subject name is required'); return; }
    setSaving(true);
    try {
      if (editId) await api.put(`/subjects/${editId}`, form);
      else await api.post('/subjects/', form);
      setModal(false); load();
    } catch (e) { setError(e.response?.data?.error || 'Failed to save'); }
    setSaving(false);
  };

  const del = async id => {
    if (!window.confirm('Delete this subject and all its data?')) return;
    await api.delete(`/subjects/${id}`); load();
  };

  const completeChapter = async id => {
    await api.post(`/subjects/${id}/complete-chapter`); load();
  };

  const f = field => ({ value: form[field], onChange: e => setForm({...form, [field]: e.target.value}) });

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>;

  return (
    <div className="page-fade">
      <div className="flex justify-between items-center mb-20">
        <div>
          <h2 className="font-syne" style={{fontSize:'1.2rem',fontWeight:800}}>Subjects & Syllabus</h2>
          <div className="text-muted text-sm">Manage courses and track chapter completion</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>➕ Add Subject</button>
      </div>

      {subjects.length === 0
        ? <EmptyState icon="📚" title="No subjects yet" desc="Add your first subject to start tracking progress" />
        : <div className="grid-2">
            {subjects.map(s => (
              <div key={s.id} className="card" style={{borderTop:`3px solid ${s.color}`}}>
                <div className="flex items-center justify-between mb-14">
                  <div>
                    <div className="font-syne fw-700" style={{fontSize:'1rem',color:s.color,marginBottom:4}}>{s.name}</div>
                    <span className={`tag ${difficultyTagClass(s.difficulty)}`}>{difficultyLabel(s.difficulty)}</span>
                  </div>
                  <div className="flex items-center gap-10">
                    <ProgressRing pct={s.progress} color={s.color} size={56}/>
                    <div style={{fontSize:'1.1rem',fontWeight:800,color:s.color}}>{s.progress}%</div>
                  </div>
                </div>

                <div className="flex gap-18 mb-14" style={{fontSize:'0.8rem',color:'var(--text2)',flexWrap:'wrap'}}>
                  <span>📖 {s.completed_chapters}/{s.total_chapters} chapters</span>
                  <span>⏱ {s.hours_per_day}h/day</span>
                  {s.exam_date && <span>📅 {s.exam_date}</span>}
                </div>

                <div className="progress-wrap mb-14">
                  <div className="progress-fill" style={{width:s.progress+'%', background:s.color}}/>
                </div>

                {s.exam_date && (
                  <div className="mb-14" style={{display:'flex',alignItems:'center',gap:8}}>
                    <span className="text-xs text-muted">Exam:</span>
                    <DaysLeft date={s.exam_date}/>
                  </div>
                )}

                <div className="flex gap-8">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => del(s.id)}>🗑️</button>
                  <button className="btn btn-outline btn-sm" style={{marginLeft:'auto'}} onClick={() => completeChapter(s.id)}
                    disabled={s.completed_chapters >= s.total_chapters}>
                    ✅ Chapter Done
                  </button>
                </div>
              </div>
            ))}
          </div>
      }

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editId ? '✏️ Edit Subject' : '➕ Add New Subject'}</div>
            {error && <div className="alert alert-danger mb-14">{error}</div>}

            <div className="form-group">
              <label className="form-label">Subject Name *</label>
              <input className="form-input" {...f('name')} placeholder="e.g. Mathematics"/>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Total Chapters</label>
                <input className="form-input" type="number" min={1} {...f('total_chapters')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Completed Chapters</label>
                <input className="form-input" type="number" min={0} max={form.total_chapters} {...f('completed_chapters')}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty: {difficultyLabel(+form.difficulty)}</label>
              <input type="range" min={1} max={5} {...f('difficulty')}/>
              <div className="flex justify-between text-xs text-muted2 mt-4">
                <span>Very Easy</span><span>Very Hard</span>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Exam Date</label>
                <input className="form-input" type="date" {...f('exam_date')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Hours/Day</label>
                <input className="form-input" type="number" min={0.5} max={8} step={0.5} {...f('hours_per_day')}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="flex gap-6" style={{flexWrap:'wrap'}}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm({...form,color:c})}
                    style={{width:26,height:26,borderRadius:'50%',background:c,cursor:'pointer',
                      border: form.color===c?`3px solid white`:'3px solid transparent'}}/>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-10 mt-10">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <><Spinner/> Saving…</> : '💾 Save Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
