import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../utils/ui';
import './Auth.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: 'demo@studyai.com', password: 'demo1234' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>StudyAI</h1>
          <p>Smart Study Management System</p>
        </div>
        <div className="auth-title">Welcome back 👋</div>
        <div className="auth-sub text-muted text-sm mb-20">Sign in to your study dashboard</div>
        {error && <div className="alert alert-danger mb-14">{error}</div>}
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={loading}>
            {loading ? <><Spinner /> Signing in…</> : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer text-sm text-muted">
          Don't have an account? <Link to="/register" className="text-accent">Register</Link>
        </div>
        <div className="demo-hint">
          <span>Demo: </span>demo@studyai.com / demo1234
        </div>
      </div>
    </div>
  );
}
