import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Spinner, EmptyState } from '../utils/ui';

const EMPTY = { subject_id:'', title:'', content:'', tags:'' };

export default function NotesPage() {
  const [notes, setNotes]       = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch]     = useState('');
  const [filterSub, setFilterSub] = useState('All');
  const [saving, setSaving]     = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary]   = useState('');
  const [error, setError]       = useState('');

  const load = async () => {
    const [n, s] = await Promise.all([api.get('/notes/'), api.get('/subjects/')]);
    setNotes(n.data); setSubjects(s.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = notes.filter(n =>
    (filterSub==='All' || n.subject_name===filterSub) &&
    (n.title.toLowerCase().includes(search.toLowerCase()) ||
     n.content.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => {
    setForm({...EMPTY, subject_id: subjects[0]?.id||''});
    setEditId(null); setSummary(''); setError(''); setModal(true);
  };
  const openEdit = n => {
    setForm({ subject_id:n.subject_id, title:n.title, content:n.content, tags:n.tags.join(',') });
    setEditId(n.id); setSummary(n.ai_summary||''); setError(''); setModal(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) { setError('Title and content are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean) };
      if (editId) await api.put(`/notes/${editId}`, payload);
      else await api.post('/notes/', payload);
      setModal(false); load();
    } catch(e) { setError(e.response?.data?.error||'Failed to save'); }
    setSaving(false);
  };

  const del = async id => {
    if (!window.confirm('Delete this note?')) return;
    await api.delete(`/notes/${id}`); load();
  };

  const aiSummarize = async () => {
    if (!editId) { setError('Save the note first to use AI summarization'); return; }
    setSummarizing(true);
    try {
      const r = await api.post(`/notes/${editId}/summarize`);
      setSummary(r.data.summary);
    } catch(e) { setSummary('AI summarization failed. Please check your API key.'); }
    setSummarizing(false);
  };

  const f = field => ({ value: form[field], onChange: e => setForm({...form,[field]:e.target.value}) });

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>;

  return (
    <div className="page-fade">
      <div className="flex justify-between items-center mb-14">
        <div>
          <h2 className="font-syne" style={{fontSize:'1.2rem',fontWeight:800}}>Study Notes</h2>
          <div className="text-muted text-sm">Organise and review with AI summarisation</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>➕ New Note</button>
      </div>

      {/* Filters */}
      <div className="flex gap-10 mb-14" style={{flexWrap:'wrap'}}>
        <input className="form-input" style={{maxWidth:220}} placeholder="🔍 Search notes…"
          value={search} onChange={e=>setSearch(e.target.value)}/>
        {['All', ...subjects.map(s=>s.name)].map(s => (
          <button key={s}
            style={{padding:'6px 14px',borderRadius:8,fontSize:'0.82rem',fontWeight:600,cursor:'pointer',
              border: filterSub===s?'1px solid rgba(79,142,247,0.4)':'1px solid var(--border)',
              background: filterSub===s?'rgba(79,142,247,0.15)':'var(--surface2)',
              color: filterSub===s?'var(--accent)':'var(--text2)'}}
            onClick={()=>setFilterSub(s)}>{s}</button>
        ))}
      </div>

      {filtered.length===0
        ? <EmptyState icon="📝" title="No notes found" desc={notes.length===0?"Create your first note!":"Try a different filter"}/>
        : <div className="grid-2">
            {filtered.map(n => (
              <div key={n.id} className="card" style={{cursor:'pointer'}} onClick={()=>setExpanded(expanded===n.id?null:n.id)}>
                <div className="flex justify-between mb-8">
                  <div className="font-syne fw-700" style={{fontSize:'0.95rem'}}>{n.title}</div>
                  <span className="tag tag-blue">{n.subject_name}</span>
                </div>
                <div className="text-sm text-muted mb-8" style={{lineHeight:1.6}}>
                  {n.content.slice(0,130)}{n.content.length>130?'…':''}
                </div>
                {n.tags.length>0 && (
                  <div className="flex gap-6 mb-8" style={{flexWrap:'wrap'}}>
                    {n.tags.map(t=><span key={t} className="tag tag-purple">#{t}</span>)}
                  </div>
                )}
                <div className="text-xs text-muted2">{new Date(n.created_at).toLocaleDateString()}</div>

                {expanded===n.id && (
                  <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}} onClick={e=>e.stopPropagation()}>
                    {n.ai_summary && (
                      <div className="alert alert-info mb-10" style={{whiteSpace:'pre-wrap',fontSize:'0.82rem'}}>
                        <div><strong>🤖 AI Summary</strong></div>
                        {n.ai_summary}
                      </div>
                    )}
                    <div className="text-sm" style={{lineHeight:1.7,whiteSpace:'pre-wrap',marginBottom:12}}>{n.content}</div>
                    <div className="flex gap-8">
                      <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(n)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>del(n.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
      }

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{editId?'✏️ Edit Note':'📝 New Study Note'}</div>
            {error && <div className="alert alert-danger mb-14">{error}</div>}

            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-select" value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})}>
                {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" {...f('title')} placeholder="Note title"/>
            </div>
            <div className="form-group">
              <label className="form-label">Content *</label>
              <textarea className="form-textarea" style={{minHeight:140}} {...f('content')} placeholder="Write your notes here…"/>
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-input" {...f('tags')} placeholder="formulas, chapter3, important"/>
            </div>

            {summary && (
              <div className="alert alert-info mb-10" style={{whiteSpace:'pre-wrap',fontSize:'0.82rem'}}>
                <strong>🤖 AI Summary:</strong><br/>{summary}
              </div>
            )}

            <div className="flex justify-end gap-10 mt-10">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
              {editId && (
                <button className="btn btn-outline" onClick={aiSummarize} disabled={summarizing}>
                  {summarizing?<><Spinner/> Summarising…</>:'🤖 AI Summarise'}
                </button>
              )}
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving?<><Spinner/> Saving…</>:'💾 Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
