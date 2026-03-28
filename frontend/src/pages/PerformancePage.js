import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { MiniBar, DonutChart, Spinner, EmptyState } from '../utils/ui';

const EMPTY_FORM = { subject_id:'', test_name:'', score:'', max_score:100, test_date:'', notes:'' };

export default function PerformancePage() {
  const [analytics, setAnalytics] = useState([]);
  const [subjects, setSubjects]   = useState([]);
  const [insights, setInsights]   = useState('');
  const [loading, setLoading]     = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = async () => {
    const [a, s] = await Promise.all([api.get('/performance/analytics'), api.get('/subjects/')]);
    setAnalytics(a.data); setSubjects(s.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadInsights = async () => {
    setInsightsLoading(true);
    try {
      const r = await api.get('/performance/insights');
      setInsights(r.data.insights);
    } catch { setInsights('Could not load AI insights. Please check your API key.'); }
    setInsightsLoading(false);
  };

  const save = async () => {
    if (!form.subject_id || !form.test_name || !form.score || !form.test_date) { setError('All fields required'); return; }
    setSaving(true);
    try {
      await api.post('/performance/', form);
      setModal(false); load();
    } catch(e) { setError(e.response?.data?.error||'Failed to save'); }
    setSaving(false);
  };

  const del = async id => {
    await api.delete(`/performance/${id}`); load();
  };

  const f = field => ({ value: form[field], onChange: e => setForm({...form,[field]:e.target.value}) });

  const totals = analytics.reduce((a,p)=>({sum:a.sum+p.avg,count:a.count+(p.avg>0?1:0)}),{sum:0,count:0});
  const overall = totals.count ? Math.round(totals.sum/totals.count) : 0;
  const best = analytics.filter(p=>p.avg>0).sort((a,b)=>b.avg-a.avg)[0];
  const worst = analytics.filter(p=>p.avg>0).sort((a,b)=>a.avg-b.avg)[0];

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>;

  return (
    <div className="page-fade">
      <div className="flex justify-between items-center mb-20">
        <div>
          <h2 className="font-syne" style={{fontSize:'1.2rem',fontWeight:800}}>Performance Analytics</h2>
          <div className="text-muted text-sm">AI-powered insights into your academic performance</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={()=>{setForm({...EMPTY_FORM,subject_id:subjects[0]?.id||'',test_date:new Date().toISOString().split('T')[0]});setError('');setModal(true);}}>
          ➕ Add Test Score
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid-3 mb-20">
        <div className="stat-card blue">
          <div className="stat-val">{overall}%</div>
          <div className="stat-label">Overall Average</div>
          <div className="stat-sub">Across all subjects</div>
        </div>
        <div className="stat-card green">
          <div className="stat-val">{best ? best.subject_name.split(' ')[0] : '–'}</div>
          <div className="stat-label">Top Subject {best ? `· ${best.avg}%` : ''}</div>
          <div className="stat-sub">Consistent performer</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-val">{worst ? worst.subject_name.split(' ')[0] : '–'}</div>
          <div className="stat-label">Needs Focus {worst ? `· ${worst.avg}%` : ''}</div>
          <div className="stat-sub">Improvement needed</div>
        </div>
      </div>

      {analytics.every(a => a.scores.length === 0)
        ? <EmptyState icon="📈" title="No performance records yet" desc="Add test scores to see analytics"/>
        : (
          <>
            <div className="grid-2 mb-20">
              {/* Score trends */}
              <div className="card">
                <div className="card-title">📊 Score Trends (Last 5 Tests)</div>
                {analytics.map(p => (
                  <div key={p.subject_id} className="flex items-center gap-14 mb-14">
                    <div style={{width:130,fontSize:'0.82rem',color:p.subject_color||'var(--accent)',fontWeight:600}}>{p.subject_name}</div>
                    <div style={{flex:1}}>
                      {p.scores.length > 0
                        ? <MiniBar scores={p.scores} color={p.subject_color||'var(--accent)'}/>
                        : <div className="text-xs text-muted2">No data</div>
                      }
                    </div>
                    <div style={{fontSize:'0.9rem',fontWeight:700,color:p.subject_color||'var(--accent)',width:40}}>{p.avg>0?p.avg+'%':'–'}</div>
                    <span style={{fontSize:'1rem'}}>{p.trend==='up'?'📈':'📉'}</span>
                  </div>
                ))}
              </div>

              {/* Donut */}
              <div className="card">
                <div className="card-title">🍩 Subject Contribution</div>
                <div style={{display:'flex',alignItems:'center',gap:24}}>
                  <DonutChart size={130} data={analytics.filter(p=>p.avg>0).map(p=>({label:p.subject_name,value:p.avg,color:p.subject_color||'#4f8ef7'}))}/>
                  <div style={{display:'flex',flexDirection:'column',gap:8,flex:1}}>
                    {analytics.filter(p=>p.avg>0).map(p=>(
                      <div key={p.subject_id} className="flex items-center gap-8" style={{fontSize:'0.8rem'}}>
                        <div style={{width:10,height:10,borderRadius:'50%',background:p.subject_color||'var(--accent)',flexShrink:0}}/>
                        <span style={{color:'var(--text2)',flex:1}}>{p.subject_name}</span>
                        <span style={{color:p.subject_color||'var(--accent)',fontWeight:600}}>{p.avg}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed table */}
            <div className="card mb-20">
              <div className="card-title">📋 Score History</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Subject</th><th>Test Name</th><th>Score</th><th>Percentage</th><th>Date</th><th>Trend</th><th></th></tr>
                  </thead>
                  <tbody>
                    {analytics.flatMap(p =>
                      (p.records||[]).map(r => (
                        <tr key={r.id}>
                          <td style={{color:p.subject_color||'var(--accent)',fontWeight:600}}>{p.subject_name}</td>
                          <td>{r.test_name}</td>
                          <td>{r.score}/{r.max_score}</td>
                          <td style={{color:r.percentage>=80?'var(--green)':r.percentage>=60?'var(--yellow)':'var(--red)',fontWeight:700}}>{r.percentage}%</td>
                          <td>{r.test_date}</td>
                          <td>{r.percentage>=80?'✅':r.percentage>=60?'⚠️':'❌'}</td>
                          <td><button className="btn btn-danger btn-xs" onClick={()=>del(r.id)}>🗑️</button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      }

      {/* AI Insights */}
      <div className="card">
        <div className="flex justify-between items-center mb-14">
          <div className="card-title" style={{marginBottom:0}}>🤖 AI Performance Insights</div>
          <button className="btn btn-outline btn-sm" onClick={loadInsights} disabled={insightsLoading}>
            {insightsLoading?<><Spinner/> Analysing…</>:'🔄 Generate Insights'}
          </button>
        </div>
        {insights
          ? <div style={{whiteSpace:'pre-wrap',fontSize:'0.88rem',lineHeight:1.7,color:'var(--text2)'}}>{insights}</div>
          : <div className="text-muted text-sm" style={{padding:'20px 0',textAlign:'center'}}>Click "Generate Insights" to get AI-powered performance analysis</div>
        }
      </div>

      {modal && (
        <div className="modal-overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">➕ Add Test Score</div>
            {error && <div className="alert alert-danger mb-14">{error}</div>}
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-select" value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})}>
                {subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Test Name</label>
              <input className="form-input" {...f('test_name')} placeholder="e.g. Unit Test 1"/>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Score Obtained</label>
                <input className="form-input" type="number" min={0} {...f('score')}/>
              </div>
              <div className="form-group">
                <label className="form-label">Out of (Max)</label>
                <input className="form-input" type="number" min={1} {...f('max_score')}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Test Date</label>
              <input className="form-input" type="date" {...f('test_date')}/>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-textarea" {...f('notes')} placeholder="Any remarks…"/>
            </div>
            <div className="flex justify-end gap-10 mt-10">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving?<><Spinner/> Saving…</>:'💾 Save Score'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
