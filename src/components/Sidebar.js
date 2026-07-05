import React from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = {
  ADMIN: [
    { icon:'📊', label:'Dashboard', key:'dashboard' },
    { icon:'👥', label:'Employees', key:'users' },
    { icon:'📁', label:'Projects', key:'projects' },
    { icon:'🐛', label:'All Issues', key:'issues' },
  ],
  MANAGER: [
    { icon:'📊', label:'Dashboard', key:'dashboard' },
    { icon:'📁', label:'My Projects', key:'projects' },
    { icon:'🐛', label:'Issues', key:'issues' },
    { icon:'🔁', label:'Reassign Requests', key:'reassign' },
    { icon:'📈', label:'Performance', key:'performance' },
    { icon:'🔔', label:'Notifications', key:'notifications' },
  ],
  REPORTER: [
    { icon:'📊', label:'Dashboard', key:'dashboard' },
    { icon:'➕', label:'Report Issue', key:'create-issue' },
    { icon:'🐛', label:'My Issues', key:'issues' },
    { icon:'🔔', label:'Notifications', key:'notifications' },
  ],
  DEVELOPER: [
    { icon:'📊', label:'Dashboard', key:'dashboard' },
    { icon:'🐛', label:'Assigned Issues', key:'issues' },
    { icon:'🔁', label:'Request Reassign', key:'reassign' },
    { icon:'⭐', label:'My Ratings', key:'ratings' },
    { icon:'🔔', label:'Notifications', key:'notifications' },
  ],
};

const ROLE_COLORS = {
  ADMIN: 'linear-gradient(135deg,#f59e0b,#ef4444)',
  MANAGER: 'linear-gradient(135deg,var(--purple),#a78bfa)',
  REPORTER: 'linear-gradient(135deg,var(--accent),var(--primary))',
  DEVELOPER: 'linear-gradient(135deg,var(--primary),var(--accent))',
};

export default function Sidebar({ activePage, onNavigate, unreadCount = 0 }) {
  const { user, logoutUser } = useAuth();
  if (!user) return null;
  const navItems = NAV[user.role] || [];
  const initials = user.username ? user.username[0].toUpperCase() : '?';

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>
          IssueTrack<span style={{ background: 'linear-gradient(135deg,var(--primary),var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pro</span>
        </span>
        <span className="logo-sub">{user.role === 'ADMIN' ? 'Admin Panel' : user.role === 'MANAGER' ? 'Manager Portal' : user.role === 'REPORTER' ? 'Reporter Portal' : 'Developer Portal'}</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map(item => (
          <button key={item.key} className={`nav-item ${activePage === item.key ? 'active' : ''}`} onClick={() => onNavigate(item.key)}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.key === 'notifications' && unreadCount > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--danger)', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {unreadCount}
              </span>
            )}
            {item.key === 'reassign' && user.role === 'MANAGER' && (
              <span style={{ marginLeft: 'auto', background: 'var(--warning)', color: '#000', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>!</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar" style={{ background: ROLE_COLORS[user.role] }}>{initials}</div>
          <div className="user-info">
            <div className="user-name">{user.username}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
        <button className="btn btn-secondary w-full mt-2" style={{ fontSize: 13, padding: 8 }} onClick={logoutUser}>🚪 Logout</button>
      </div>
    </div>
  );
}
