import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Spinner, DaysLeft, EmptyState } from '../utils/ui';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20];

export default function SchedulePage() {
  const [slots, setSlots]       = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    const [sl, su] = await Promise.all([api.get('/schedule/'), api.get('/subjects/')]);
    setSlots(sl.data); setSubjects(su.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const getCell = (day, hour) => slots.find(s => s.day_of_week === day && s.hour === hour);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/schedule/generate');
      setSlots(r.data);
    } catch (e) { alert(e.response?.data?.error || 'Generation failed'); }
    setGenerating(false);
  };

  const clearAll = async () => {
    if (!window.confirm('Clear the entire schedule?')) return;
    await api.delete('/schedule/clear'); setSlots([]);
  };

  const deleteSlot = async (slot) => {
    await api.delete(`/schedule/${slot.id}`);
    setSlots(prev => prev.filter(s => s.id !== slot.id));
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>;

  const hourCount = {};
  slots.forEach(s => { hourCount[s.subject_name] = (hourCount[s.subject_name]||0) + 1.5; });

  return (
    <div className="page-fade">
      <div className="flex justify-between items-center mb-20">
        <div>
          <h2 className="font-syne" style={{fontSize:'1.2rem',fontWeight:800}}>Weekly Study Schedule</h2>
          <div className="text-muted text-sm">AI-optimised timetable based on exam dates & difficulty</div>
        </div>
        <div className="flex gap-10">
          <button className="btn btn-danger btn-sm" onClick={clearAll} disabled={slots.length===0}>🗑️ Clear</button>
          <button className="btn btn-primary btn-sm" onClick={generate} disabled={generating}>
            {generating ? <><Spinner/> Generating…</> : '🤖 AI Generate Schedule'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="card mb-14">
        <div className="flex gap-18 mb-14" style={{flexWrap:'wrap',fontSize:'0.78rem'}}>
          <div className="flex items-center gap-6"><div style={{width:12,height:12,borderRadius:3,background:'rgba(79,142,247,0.5)'}}/> Study Session</div>
          <div className="flex items-center gap-6"><div style={{width:12,height:12,borderRadius:3,background:'rgba(16,185,129,0.5)'}}/> Revision</div>
          <div className="flex items-center gap-6"><div style={{width:12,height:12,borderRadius:3,background:'rgba(239,68,68,0.5)'}}/> Exam Prep</div>
        </div>

        {subjects.length === 0
          ? <EmptyState icon="📅" title="No subjects" desc="Add subjects first, then generate a schedule"/>
          : (
            <div style={{overflowX:'auto'}}>
              <div style={{display:'grid', gridTemplateColumns:`60px repeat(7, minmax(80px,1fr))`, gap:2, minWidth:600}}>
                {/* Header */}
                <div/>
                {DAYS.map(d => (
                  <div key={d} style={{textAlign:'center',padding:'8px 4px',color:'var(--text3)',fontWeight:600,fontSize:'0.78rem'}}>{d}</div>
                ))}
                {/* Rows */}
                {HOURS.map(h => (
                  <React.Fragment key={h}>
                    <div style={{padding:'8px 4px',color:'var(--text3)',textAlign:'right',fontSize:'0.7rem',paddingTop:10}}>{h}:00</div>
                    {DAYS.map((_,di) => {
                      const cell = getCell(di, h);
                      const bg = !cell ? 'var(--bg)'
                        : cell.slot_type==='exam'   ? 'rgba(239,68,68,0.18)'
                        : cell.slot_type==='revision'? 'rgba(16,185,129,0.18)'
                        : cell.subject_color ? cell.subject_color+'28'
                        : 'rgba(79,142,247,0.18)';
                      const border = !cell ? 'var(--border)'
                        : cell.slot_type==='exam' ? 'rgba(239,68,68,0.4)'
                        : cell.slot_type==='revision' ? 'rgba(16,185,129,0.4)'
                        : (cell.subject_color||'var(--accent)')+'66';
                      return (
                        <div key={di}
                          onClick={() => cell && deleteSlot(cell)}
                          title={cell ? `${cell.subject_name} – ${cell.slot_type}\nClick to remove` : 'Empty'}
                          style={{
                            minHeight:42, borderRadius:6, background:bg, border:`1px solid ${border}`,
                            display:'flex',alignItems:'center',justifyContent:'center',
                            cursor:cell?'pointer':'default',
                            fontSize:'0.65rem',textAlign:'center',padding:3,
                            color: cell ? (cell.subject_color||'var(--accent)') : 'transparent',
                            fontWeight:600, transition:'all 0.15s',
                          }}>
                          {cell ? cell.subject_name.split(' ')[0] : ''}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )
        }
        <div className="text-xs text-muted2 mt-10">Click any session to remove it</div>
      </div>

      <div className="grid-2">
        {/* Hours distribution */}
        <div className="card">
          <div className="card-title">📊 Weekly Hours Distribution</div>
          {subjects.map(s => {
            const hrs = hourCount[s.name] || 0;
            return (
              <div key={s.id} className="flex items-center gap-10 mb-10">
                <div style={{width:130,fontSize:'0.82rem',color:s.color||'var(--text2)',fontWeight:600}}>{s.name}</div>
                <div style={{flex:1}} className="progress-wrap">
                  <div className="progress-fill" style={{width:`${Math.min((hrs/20)*100,100)}%`,background:s.color}}/>
                </div>
                <div className="text-xs text-muted2" style={{width:36}}>{hrs.toFixed(1)}h</div>
              </div>
            );
          })}
        </div>

        {/* Exam countdowns */}
        <div className="card">
          <div className="card-title">📅 Exam Countdown</div>
          {subjects.filter(s=>s.exam_date).map(s => (
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:36,height:36,borderRadius:10,background:s.color+'22',display:'flex',alignItems:'center',justifyContent:'center'}}>📝</div>
              <div style={{flex:1}}>
                <div style={{fontSize:'0.88rem',fontWeight:600}}>{s.name}</div>
                <div className="text-xs text-muted2">{s.exam_date}</div>
              </div>
              <DaysLeft date={s.exam_date}/>
            </div>
          ))}
          {subjects.filter(s=>s.exam_date).length===0 && <div className="text-muted text-sm">No exam dates set</div>}
        </div>
      </div>
    </div>
  );
}
