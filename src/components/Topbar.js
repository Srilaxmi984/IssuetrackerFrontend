import React, { useState, useEffect, useRef } from 'react';
import { getNotifications, markAllRead, markRead, updateUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/helpers';
import PasswordInput from './PasswordInput';

export default function Topbar({ title, unreadCount, onUnreadChange }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const panelRef = useRef();
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    try {
      await updateUser(user.id, { password: pwForm.newPassword });
      setPwSuccess('Password updated successfully!');
      setPwForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => { setShowPwModal(false); setPwSuccess(''); }, 1500);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to update password.');
    }
    setPwSaving(false);
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await getNotifications(user.id);
      setNotifications(res.data);
    } catch {}
  };

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) loadNotifications();
  };

  const handleMarkAll = async () => {
    await markAllRead(user.id);
    loadNotifications();
    if (onUnreadChange) onUnreadChange(0);
  };

  const handleMarkOne = async (id) => {
    await markRead(id);
    loadNotifications();
    if (onUnreadChange) onUnreadChange(Math.max(0, unreadCount - 1));
  };

  return (
    <>
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-actions">
        <div style={{ position: 'relative' }} ref={panelRef}>
          <button className="notif-btn" onClick={handleOpen}>
            🔔
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          {open && (
            <div className="notif-panel">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn btn-sm btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleMarkAll}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No notifications</div>
                ) : notifications.map(n => (
                  <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => !n.read && handleMarkOne(n.id)}>
                    <div className="notif-msg">{n.message}</div>
                    <div className="notif-time">{formatDateTime(n.createdDate)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user?.username}</strong>
          </div>
          {user?.role !== 'ADMIN' && (
            <button
              onClick={() => { setShowPwModal(true); setPwForm({ newPassword: '', confirmPassword: '' }); setPwError(''); setPwSuccess(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, padding: '5px 10px', borderRadius: 'var(--radius)', transition: 'all 0.15s' }}
              title="Change Password"
            >
              🔑 Change Password
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Change Password Modal */}
    {showPwModal && (
      <div className="modal-overlay" onClick={() => setShowPwModal(false)}>
        <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">🔑 Change Password</span>
            <button className="modal-close" onClick={() => setShowPwModal(false)}>✕</button>
          </div>
          {pwError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
              ❌ {pwError}
            </div>
          )}
          {pwSuccess && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
              ✅ {pwSuccess}
            </div>
          )}
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <PasswordInput value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Min. 6 characters" required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <PasswordInput value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="Re-enter new password" required />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPwModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={pwSaving}>{pwSaving ? 'Saving...' : 'Update Password'}</button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
