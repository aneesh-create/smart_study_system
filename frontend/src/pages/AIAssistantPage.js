import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import { Spinner } from '../utils/ui';

const QUICK_PROMPTS = [
  "Create a 7-day study plan for my exams",
  "Which subjects need the most attention?",
  "Give me tips to improve my Chemistry score",
  "How many hours should I study daily?",
  "Explain spaced repetition technique",
  "Motivate me to study harder today!",
  "What revision strategy should I follow?",
  "Create a mock quiz for Physics",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const [tab, setTab]           = useState('chat'); // chat | plan | quiz
  const [studyPlan, setStudyPlan] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planDays, setPlanDays] = useState(7);
  const [quizSub, setQuizSub]   = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [quiz, setQuiz]         = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers]   = useState({});
  const bottomRef = useRef();

  useEffect(() => {
    Promise.all([api.get('/ai/history'), api.get('/subjects/')]).then(([h, s]) => {
      setMessages(h.data.map(m => ({ role: m.role, text: m.content })));
      setSubjects(s.data);
      if (s.data.length) setQuizSub(s.data[0].name);
      setHistLoading(false);
    });
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    try {
      const r = await api.post('/ai/chat', { message: msg });
      setMessages(prev => [...prev, { role: 'assistant', text: r.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Could not reach AI. Please check your API key in backend .env.' }]);
    }
    setLoading(false);
  };

  const clearHistory = async () => {
    if (!window.confirm('Clear chat history?')) return;
    await api.delete('/ai/history');
    setMessages([]);
  };

  const generatePlan = async () => {
    setPlanLoading(true);
    try {
      const r = await api.post('/ai/study-plan', { days: planDays });
      setStudyPlan(r.data.plan);
    } catch { setStudyPlan('Failed to generate plan. Check your API key.'); }
    setPlanLoading(false);
  };

  const generateQuiz = async () => {
    setQuiz([]); setAnswers({});
    setQuizLoading(true);
    try {
      const r = await api.post('/ai/quiz', { subject_name: quizSub, topic: quizTopic, count: 5 });
      setQuiz(r.data.questions || []);
    } catch { setQuiz([{ question: 'Failed to generate quiz. Check your API key.', options:[], answer:'', explanation:'' }]); }
    setQuizLoading(false);
  };

  if (histLoading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>;

  return (
    <div className="page-fade">
      <div className="flex justify-between items-center mb-20">
        <div>
          <h2 className="font-syne" style={{fontSize:'1.2rem',fontWeight:800}}>AI Study Assistant</h2>
          <div className="text-muted text-sm">Powered by Claude – personalised guidance, study plans & quizzes</div>
        </div>
        <span className="badge-pill">🤖 Claude AI</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-10 mb-20">
        {[['chat','💬 Chat'],['plan','📋 Study Plan'],['quiz','🧩 Quiz Generator']].map(([id,label])=>(
          <button key={id}
            className={`btn btn-sm ${tab===id?'btn-primary':'btn-ghost'}`}
            onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* CHAT TAB */}
      {tab === 'chat' && (
        <div className="grid-2" style={{alignItems:'start'}}>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            {/* Chat header */}
            <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div className="flex items-center gap-10">
                <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent3),var(--accent))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem'}}>🤖</div>
                <div>
                  <div className="font-syne fw-700" style={{fontSize:'0.9rem'}}>StudyAI Assistant</div>
                  <div style={{fontSize:'0.7rem',color:'var(--green)'}}>● Online</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={clearHistory}>🗑️ Clear</button>
            </div>

            {/* Messages */}
            <div style={{height:380,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:12}}>
              {messages.length === 0 && (
                <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text3)'}}>
                  <div style={{fontSize:'2rem',marginBottom:8}}>🤖</div>
                  <div>Hi! I'm your AI study assistant. Ask me anything!</div>
                </div>
              )}
              {messages.map((m,i)=>(
                <div key={i} style={{display:'flex',gap:10,flexDirection:m.role==='user'?'row-reverse':'row'}}>
                  <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',
                    background:m.role==='user'?'linear-gradient(135deg,var(--accent2),#ec4899)':'linear-gradient(135deg,var(--accent3),var(--accent))'}}>
                    {m.role==='user'?'👤':'🤖'}
                  </div>
                  <div style={{
                    maxWidth:'75%',padding:'10px 14px',borderRadius:14,fontSize:'0.85rem',lineHeight:1.6,whiteSpace:'pre-wrap',
                    background:m.role==='user'?'linear-gradient(135deg,var(--accent),var(--accent2))':'var(--surface2)',
                    color: m.role==='user'?'white':'var(--text)',
                    borderBottomRightRadius:m.role==='user'?4:14,
                    borderBottomLeftRadius:m.role==='user'?14:4,
                  }}>{m.text}</div>
                </div>
              ))}
              {loading && (
                <div style={{display:'flex',gap:10}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent3),var(--accent))',display:'flex',alignItems:'center',justifyContent:'center'}}>🤖</div>
                  <div style={{background:'var(--surface2)',padding:'10px 14px',borderRadius:14,borderBottomLeftRadius:4}}>
                    <div style={{display:'flex',gap:4,alignItems:'center'}}>
                      {[0,1,2].map(i=><div key={i} className="typing-dot" style={{animationDelay:`${i*0.2}s`}}/>)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{display:'flex',gap:10,padding:'12px 14px',borderTop:'1px solid var(--border)'}}>
              <input className="form-input" value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask about study plans, concepts, tips…"/>
              <button className="btn btn-primary btn-sm" onClick={()=>send()} disabled={loading}>➤</button>
            </div>
          </div>

          {/* Quick prompts */}
          <div>
            <div className="card mb-14">
              <div className="card-title">⚡ Quick Prompts</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {QUICK_PROMPTS.map((p,i)=>(
                  <button key={i} className="btn btn-ghost" style={{textAlign:'left',justifyContent:'flex-start',fontSize:'0.82rem'}}
                    onClick={()=>send(p)}>{p}</button>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-title">📊 Subject Status</div>
              {subjects.map(s=>(
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:s.color||'var(--accent)',flexShrink:0}}/>
                  <span style={{flex:1,fontSize:'0.82rem',color:'var(--text2)'}}>{s.name}</span>
                  <span style={{fontSize:'0.78rem',fontWeight:600,color:s.progress>=70?'var(--green)':'var(--yellow)'}}>{s.progress}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STUDY PLAN TAB */}
      {tab === 'plan' && (
        <div className="grid-2" style={{alignItems:'start'}}>
          <div className="card">
            <div className="card-title">📋 Generate Study Plan</div>
            <div className="form-group">
              <label className="form-label">Plan Duration</label>
              <select className="form-select" value={planDays} onChange={e=>setPlanDays(+e.target.value)}>
                {[3,5,7,10,14,21,30].map(d=><option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
            <div className="alert alert-info mb-14" style={{fontSize:'0.82rem'}}>
              💡 AI will consider your subject progress, difficulty levels, exam dates, and daily hour goals.
            </div>
            <button className="btn btn-primary" onClick={generatePlan} disabled={planLoading} style={{width:'100%',justifyContent:'center'}}>
              {planLoading?<><Spinner/> Generating {planDays}-day plan…</>:`🤖 Generate ${planDays}-Day Plan`}
            </button>
            {studyPlan && (
              <div style={{marginTop:20,paddingTop:20,borderTop:'1px solid var(--border)',whiteSpace:'pre-wrap',fontSize:'0.88rem',lineHeight:1.7,color:'var(--text2)'}}>
                {studyPlan}
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-title">📚 Subjects Overview</div>
            {subjects.map(s=>(
              <div key={s.id} style={{marginBottom:14}}>
                <div className="flex justify-between mb-4">
                  <span style={{fontSize:'0.85rem',fontWeight:600,color:s.color}}>{s.name}</span>
                  <span className="text-xs text-muted2">{s.exam_date||'No exam set'}</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-fill" style={{width:s.progress+'%',background:s.color}}/>
                </div>
                <div className="text-xs text-muted2" style={{marginTop:3}}>{s.progress}% complete · {s.completed_chapters}/{s.total_chapters} chapters</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUIZ TAB */}
      {tab === 'quiz' && (
        <div>
          <div className="card mb-20">
            <div className="card-title">🧩 AI Quiz Generator</div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select" value={quizSub} onChange={e=>setQuizSub(e.target.value)}>
                  {subjects.map(s=><option key={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Topic (optional)</label>
                <input className="form-input" value={quizTopic} onChange={e=>setQuizTopic(e.target.value)} placeholder="e.g. Integration, Newton's Laws"/>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={generateQuiz} disabled={quizLoading}>
              {quizLoading?<><Spinner/> Generating…</>:'🎲 Generate 5 Questions'}
            </button>
          </div>

          {quiz.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {quiz.map((q,qi)=>(
                <div key={qi} className="card">
                  <div style={{fontSize:'0.92rem',fontWeight:700,marginBottom:12}}>Q{qi+1}. {q.question}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
                    {(q.options||[]).map((opt,oi)=>{
                      const letter = opt.charAt(0);
                      const chosen = answers[qi] === letter;
                      const correct = q.answer === letter;
                      const revealed = answers[qi] !== undefined;
                      return (
                        <div key={oi}
                          onClick={() => !answers[qi] && setAnswers(a=>({...a,[qi]:letter}))}
                          style={{
                            padding:'10px 14px',borderRadius:9,cursor:answers[qi]?'default':'pointer',fontSize:'0.85rem',
                            border: revealed
                              ? correct ? '1px solid var(--green)' : chosen ? '1px solid var(--red)' : '1px solid var(--border)'
                              : '1px solid var(--border)',
                            background: revealed
                              ? correct ? 'rgba(16,185,129,0.12)' : chosen ? 'rgba(239,68,68,0.10)' : 'var(--bg)'
                              : chosen ? 'rgba(79,142,247,0.12)' : 'var(--bg)',
                            transition:'all 0.18s'
                          }}>
                          {opt} {revealed && correct && '✅'} {revealed && chosen && !correct && '❌'}
                        </div>
                      );
                    })}
                  </div>
                  {answers[qi] !== undefined && q.explanation && (
                    <div className="alert alert-info" style={{fontSize:'0.82rem'}}>
                      💡 <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
              {Object.keys(answers).length === quiz.length && (
                <div className="card" style={{textAlign:'center'}}>
                  <div style={{fontSize:'2rem',marginBottom:8}}>🎯</div>
                  <div className="font-syne fw-700" style={{fontSize:'1.1rem'}}>
                    Score: {quiz.filter((_,i)=>answers[i]===quiz[i]?.answer).length}/{quiz.length}
                  </div>
                  <button className="btn btn-outline btn-sm" style={{marginTop:12}} onClick={()=>{setQuiz([]);setAnswers({});}}>Try Again</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
