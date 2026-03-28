import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Spinner, EmptyState } from '../utils/ui';

const TYPES = ['revision','assignment','quiz','test','exam','meeting'];
const TYPE_COLOR = { revision:'blue', assignment:'purple', quiz:'yellow', test:'yellow', exam:'red', meeting:'green' };
const EMPTY = { title:'', subject_id:'', reminder_type:'revision', reminder_datetime:'' };

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [subjects, setSubjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = async () => {
    const [r, s] = await Promise.all([api.get('/reminders/'), api.get('/subjects/')]);
    setReminders(r.data); setSubjects(s.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async id => {
    await api.post(`/reminders/${id}/toggle`); load();
  };
  const del = async id => {
    await api.delete(`/reminders/${id}`); load();
  };
  const save = async () => {
    if (!form.title || !form.reminder_datetime) { setError('Title and datetime required'); return; }
    setSaving(true);
    try {
      await api.post('/reminders/', form);
      setModal(false); load();
    } catch(e) { setError(e.response?.data?.error||'Failed to save'); }
    setSaving(false);
  };

  const f = field => ({ value: form[field], onChange: e => setForm({...form,[field]:e.target.value}) });

  const pending = reminders.filter(r => !r.is_done);
  const done = reminders.filter(r => r.is_done);

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>;

  const ReminderItem = ({ r }) => (
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
      <div style={{width:36,height:36,borderRadius:10,background:'rgba(245,158,11,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',flexShrink:0}}>
        {r.is_done ? '✅' : '🔔'}
      </div>
      <div style={{flex:1,opacity:r.is_done?0.6:1}}>
        <div style={{fontSize:'0.88rem',fontWeight:600,textDecoration:r.is_done?'line-through':'none'}}>{r.title}</div>
        <div className="text-xs text-muted2">
          {r.subject_name} · {new Date(r.reminder_datetime).toLocaleString()}
        </div>
      </div>
      <span className={`tag tag-${TYPE_COLOR[r.reminder_type]||'blue'}`}>{r.reminder_type}</span>
      <button className="btn btn-ghost btn-xs" onClick={() => toggle(r.id)} title={r.is_done?'Mark pending':'Mark done'}>
        {r.is_done ? '↩️' : '✅'}
      </button>
      <button className="btn btn-danger btn-xs" onClick={() => del(r.id)}>🗑️</button>
    </div>
  );

  return (
    <div className="page-fade">
      <div className="flex justify-between items-center mb-20">
        <div>
          <h2 className="font-syne" style={{fontSize:'1.2rem',fontWeight:800}}>Smart Reminders</h2>
          <div className="text-muted text-sm">AI-driven reminders for tasks, revision & exams</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => {
          setForm({...EMPTY,subject_id:subjects[0]?.id||''}); setError(''); setModal(true);
        }}>➕ Add Reminder</button>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">🔔 Pending ({pending.length})</div>
          {pending.length===0
            ? <EmptyState icon="🎉" title="No pending reminders" desc="You're all caught up!"/>
            : pending.map(r => <ReminderItem key={r.id} r={r}/>)
          }
        </div>
        <div className="card">
          <div className="card-title">✅ Completed ({done.length})</div>
          {done.length===0
            ? <EmptyState icon="📭" title="No completed reminders" desc="Mark reminders done as you finish them"/>
            : done.map(r => <ReminderItem key={r.id} r={r}/>)
          }
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🔔 Add Reminder</div>
            {error && <div className="alert alert-danger mb-14">{error}</div>}
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" {...f('title')} placeholder="e.g. Math Revision Session"/>
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-select" value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})}>
                <option value="">– General –</option>
                {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date & Time *</label>
              <input className="form-input" type="datetime-local" {...f('reminder_datetime')}/>
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.reminder_type} onChange={e=>setForm({...form,reminder_type:e.target.value})}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-10 mt-10">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving?<><Spinner/> Saving…</>:'Add Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
