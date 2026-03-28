import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../utils/ui';
import './Auth.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', roll_number: '', institution: '', semester: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) });

  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <h1>StudyAI</h1>
          <p>Smart Study Management System</p>
        </div>
        <div className="auth-title">Create Account 🎓</div>
        <div className="auth-sub text-muted text-sm mb-20">Join StudyAI and ace your exams</div>
        {error && <div className="alert alert-danger mb-14">{error}</div>}
        <form onSubmit={handle}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" {...f('name')} placeholder="Your full name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" {...f('email')} placeholder="your@email.com" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" {...f('password')} placeholder="Min 6 characters" required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input className="form-input" {...f('roll_number')} placeholder="23AG1A66I5" />
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <input className="form-input" {...f('semester')} placeholder="Semester 3" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Institution</label>
            <input className="form-input" {...f('institution')} placeholder="Your college / university" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={loading}>
            {loading ? <><Spinner /> Creating account…</> : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer text-sm text-muted">
          Already have an account? <Link to="/login" className="text-accent">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
