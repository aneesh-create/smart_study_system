import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const NAV = [
  { section: 'Overview', items: [
    { to: '/',            icon: '📊', label: 'Dashboard' },
    { to: '/performance', icon: '📈', label: 'Performance' },
  ]},
  { section: 'Planning', items: [
    { to: '/subjects',  icon: '📚', label: 'Subjects' },
    { to: '/schedule',  icon: '📅', label: 'Schedule' },
    { to: '/reminders', icon: '🔔', label: 'Reminders' },
  ]},
  { section: 'Learning', items: [
    { to: '/notes',        icon: '📝', label: 'Notes' },
    { to: '/ai-assistant', icon: '🤖', label: 'AI Assistant' },
  ]},
  { section: 'Account', items: [
    { to: '/settings', icon: '⚙️', label: 'Settings' },
  ]},
];

const PAGE_TITLES = {
  '/': 'Dashboard', '/performance': 'Performance Analytics',
  '/subjects': 'Subjects & Syllabus', '/schedule': 'Study Schedule',
  '/reminders': 'Smart Reminders', '/notes': 'Study Notes',
  '/ai-assistant': 'AI Assistant', '/settings': 'Settings',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = window.location.pathname;
  const title = PAGE_TITLES[currentPath] || 'StudyAI';
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'U';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout-root">
      {/* Mobile overlay */}
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <h1>StudyAI</h1>
          <p>Smart Study Management</p>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(sec => (
            <div key={sec.section} className="nav-section">
              <div className="nav-section-title">{sec.section}</div>
              {sec.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="avatar">{initials}</div>
            <div>
              <div className="user-name">{user?.name || 'Student'}</div>
              <div className="user-roll">{user?.roll_number || ''}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={handleLogout} style={{width:'100%',marginTop:8}}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <button className="hamburger" onClick={() => setMobileOpen(o => !o)}>☰</button>
          <div className="topbar-title font-syne">{title}</div>
          <div className="topbar-right">
            <span className="badge-pill">🤖 AI Active</span>
            <span className="topbar-date text-muted text-sm">
              {new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}
            </span>
          </div>
        </header>
        <main className="page-content page-fade">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
