import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Toggle, Spinner } from '../utils/ui';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    roll_number: user?.roll_number || '',
    institution: user?.institution || '',
    semester: user?.semester || '',
    daily_study_goal: user?.daily_study_goal || 6,
    preferred_study_time: user?.preferred_study_time || 'morning',
    learning_style: user?.learning_style || 'visual',
    notifications_enabled: user?.notifications_enabled ?? true,
    ai_recommendations: user?.ai_recommendations ?? true,
    target_percentage: user?.target_percentage || 85,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try {
      const r = await api.put('/auth/profile', form);
      updateUser(r.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch(e) { setError(e.response?.data?.error || 'Failed to save settings'); }
    setSaving(false);
  };

  const f = field => ({ value: form[field], onChange: e => setForm({...form, [field]: e.target.value}) });

  return (
    <div className="page-fade">
      <div className="mb-20">
        <h2 className="font-syne" style={{fontSize:'1.2rem',fontWeight:800,marginBottom:4}}>Settings</h2>
        <div className="text-muted text-sm">Configure your profile, study preferences and AI options</div>
      </div>

      {error && <div className="alert alert-danger mb-14">{error}</div>}
      {saved && <div className="alert alert-success mb-14">Settings saved successfully!</div>}

      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card-title">Profile</div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" {...f('name')} placeholder="Your full name"/>
          </div>
          <div className="form-group">
            <label className="form-label">Roll Number</label>
            <input className="form-input" {...f('roll_number')} placeholder="23AG1A66I5"/>
          </div>
          <div className="form-group">
            <label className="form-label">Institution</label>
            <input className="form-input" {...f('institution')} placeholder="Your college/university"/>
          </div>
          <div className="form-group">
            <label className="form-label">Semester / Year</label>
            <input className="form-input" {...f('semester')} placeholder="Semester 3"/>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Study Goals</div>
          <div className="form-group">
            <label className="form-label">Target Percentage</label>
            <input className="form-input" type="number" min={50} max={100} {...f('target_percentage')}/>
          </div>
          <div className="form-group">
            <label className="form-label">Daily Study Goal: {form.daily_study_goal}h</label>
            <input type="range" min={1} max={12} step={0.5} value={form.daily_study_goal}
              onChange={e=>setForm({...form,daily_study_goal:+e.target.value})}/>
            <div className="flex justify-between text-xs text-muted2 mt-4">
              <span>1h</span><span>6h</span><span>12h</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Preferred Study Time</label>
            <select className="form-select" {...f('preferred_study_time')}>
              <option value="morning">Morning (6am-12pm)</option>
              <option value="afternoon">Afternoon (12pm-6pm)</option>
              <option value="evening">Evening (6pm-10pm)</option>
              <option value="night">Night (10pm-2am)</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Preferences</div>
          {[
            ['notifications_enabled','Smart Reminders','Get notified for upcoming tasks'],
            ['ai_recommendations','AI Recommendations','Receive AI-powered study suggestions'],
          ].map(([key,label,desc]) => (
            <div key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid var(--border)'}}>
              <div>
                <div style={{fontSize:'0.875rem',fontWeight:600}}>{label}</div>
                <div className="text-xs text-muted2">{desc}</div>
              </div>
              <Toggle value={form[key]} onChange={v=>setForm({...form,[key]:v})}/>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">AI Configuration</div>
          <div className="form-group">
            <label className="form-label">Learning Style</label>
            <select className="form-select" {...f('learning_style')}>
              <option value="visual">Visual Learner</option>
              <option value="reading">Reading / Writing</option>
              <option value="kinesthetic">Kinesthetic</option>
              <option value="auditory">Auditory</option>
            </select>
          </div>
          <div className="alert alert-info" style={{fontSize:'0.82rem'}}>
            AI personalises study plans based on your learning style and performance data.
          </div>
          <div className="alert alert-warn" style={{fontSize:'0.82rem',marginTop:8}}>
            Set ANTHROPIC_API_KEY in backend/.env to enable all AI features.
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-10">
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <><Spinner/> Saving...</> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
