import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import IssueModal from '../../components/IssueModal';
import {
  getIssuesByDeveloper, getIssuesByProject, getDeveloperRatings, getDeveloperAvgScore,
  getUnreadCount, getNotifications, markAllRead, markRead,
  updateIssueStatus, searchIssues, createReassignRequest, getReassignByDeveloper
} from '../../api';
import { getPriorityBadge, getStatusBadge, formatDate, formatDateTime, FILE_BASE } from '../../utils/helpers';

const PAGES = {
  dashboard: 'Dashboard', issues: 'Assigned Issues',
  reassign: 'Request Reassign', ratings: 'My Ratings', notifications: 'Notifications'
};

export default function DeveloperDashboard() {
  const [page, setPage] = useState('dashboard');
  const [myIssues, setMyIssues] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [avgScore, setAvgScore] = useState(0);
  const [unread, setUnread] = useState(0);
  const [reassignRequests, setReassignRequests] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadAll = useCallback(async () => {
    try {
      const [i, r, a, u, rr] = await Promise.all([
        getIssuesByDeveloper(user.id), getDeveloperRatings(user.id),
        getDeveloperAvgScore(user.id), getUnreadCount(user.id),
        getReassignByDeveloper(user.id),
      ]);
      setMyIssues(i.data); setRatings(r.data);
      setAvgScore(a.data.average || 0); setUnread(u.data.count || 0);
      setReassignRequests(rr.data);
    } catch (e) { console.error(e); }
  }, [user.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const stats = {
    total: myIssues.length,
    opened: myIssues.filter(i => i.status === 'OPENED').length,
    inProgress: myIssues.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: myIssues.filter(i => i.status === 'RESOLVED').length,
    closed: myIssues.filter(i => i.status === 'CLOSED').length,
    reopened: myIssues.filter(i => i.status === 'REOPENED').length,
  };

  return (
    <div className="app-shell">
      <Sidebar activePage={page} onNavigate={setPage} unreadCount={unread} />
      <div className="main-content">
        <Topbar title={PAGES[page] || 'Developer'} unreadCount={unread} onUnreadChange={setUnread} />
        <div className="page-content">
          {page === 'dashboard'     && <Overview stats={stats} myIssues={myIssues} ratings={ratings} avgScore={avgScore} userId={user.id} onRefresh={loadAll} onNavigate={setPage} />}
          {page === 'issues'        && <AssignedIssues myIssues={myIssues} userId={user.id} onRefresh={loadAll} />}
          {page === 'reassign'      && <ReassignRequestPage myIssues={myIssues} userId={user.id} reassignRequests={reassignRequests} onRefresh={loadAll} />}
          {page === 'ratings'       && <RatingsPage ratings={ratings} avgScore={avgScore} />}
          {page === 'notifications' && <NotificationsPage userId={user.id} onUnreadChange={setUnread} />}
        </div>
      </div>
    </div>
  );
}

/* ── Overview ── */
function Overview({ stats, myIssues, ratings, avgScore, userId, onRefresh, onNavigate }) {
  const cards = [
    { label: 'Assigned', value: stats.total || 0, color: 'blue', icon: '📋' },
    { label: 'Open', value: stats.opened || 0, color: 'orange', icon: '🔓' },
    { label: 'In Progress', value: stats.inProgress || 0, color: 'purple', icon: '⚡' },
    { label: 'Resolved', value: stats.resolved || 0, color: 'blue', icon: '🔍' },
    { label: 'Closed', value: stats.closed || 0, color: 'green', icon: '✅' },
    { label: 'Avg Rating', value: avgScore > 0 ? avgScore.toFixed(1) : '—', color: 'orange', icon: '⭐' },
  ];
  const active = myIssues.filter(i => ['OPENED', 'IN_PROGRESS', 'REOPENED'].includes(i.status));
  const needRework = myIssues.filter(i => i.status === 'REOPENED');

  return (
    <>
      <div className="page-header"><h1>Developer Dashboard</h1><p>Your assigned issues and performance</p></div>
      <div className="stats-grid">{cards.map(c => (
        <div key={c.label} className={`stat-card ${c.color}`}>
          <div className="stat-label">{c.label}</div><div className="stat-value">{c.value}</div><div className="stat-icon">{c.icon}</div>
        </div>
      ))}</div>

      {needRework.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#fca5a5' }}>⚠️ <strong>{needRework.length}</strong> issue{needRework.length > 1 ? 's' : ''} rejected — rework required</span>
          <button className="btn btn-sm btn-danger" onClick={() => onNavigate('issues')}>View</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Active Issues ({active.length})</span>
            <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('issues')}>View All</button>
          </div>
          {active.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><div className="empty-icon">✅</div><p>No active issues!</p></div>
          ) : active.slice(0, 6).map(issue => (
            <div key={issue.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <span className={`badge ${getPriorityBadge(issue.priority)}`} style={{ fontSize: 10 }}>{issue.priority}</span>
                  <span className={`badge ${getStatusBadge(issue.status)}`} style={{ fontSize: 10 }}>{issue.status?.replace(/_/g,' ')}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{issue.project?.name || 'No project'} · Due: {formatDate(issue.dueDate)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ borderLeft: '3px solid var(--warning)', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>My Rating</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, lineHeight: 1, color: avgScore >= 4 ? 'var(--success)' : avgScore >= 3 ? 'var(--warning)' : avgScore > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {avgScore > 0 ? avgScore.toFixed(1) : '—'}
            </div>
            <div style={{ fontSize: 24, margin: '8px 0' }}>{'⭐'.repeat(Math.round(avgScore))}{'☆'.repeat(5 - Math.round(avgScore))}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ratings.length} review{ratings.length !== 1 ? 's' : ''}</div>
          </div>
          {needRework.length > 0 && (
            <div className="card" style={{ borderLeft: '3px solid var(--danger)' }}>
              <div className="card-header"><span className="card-title" style={{ color: 'var(--danger)' }}>🔁 Needs Rework</span></div>
              {needRework.map(i => (
                <div key={i.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{i.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Assigned Issues ── */
function AssignedIssues({ myIssues, userId, onRefresh }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(myIssues);
  const [selected, setSelected] = useState(null);
  const [readOnly, setReadOnly] = useState(null);
  const [relatedIssues, setRelatedIssues] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);

  useEffect(() => { applyLocal(myIssues, search, status); }, [myIssues]);

  const applyLocal = (src, kw, st) => {
    let f = src;
    if (st) f = f.filter(i => i.status === st);
    if (kw) f = f.filter(i => i.title.toLowerCase().includes(kw.toLowerCase()) || (i.project?.name || '').toLowerCase().includes(kw.toLowerCase()) || i.developers?.some(d => d.username.toLowerCase().includes(kw.toLowerCase())));
    setResults(f);
  };

  const handleSearch = () => applyLocal(myIssues, search, status);
  const handleClear = () => { setSearch(''); setStatus(''); setResults(myIssues); setRelatedIssues([]); setActiveProjectId(null); };

  const loadRelated = async (issue) => {
    if (!issue.project) return;
    const pid = issue.project.id;
    if (activeProjectId === pid) { setRelatedIssues([]); setActiveProjectId(null); return; }
    try {
      const r = await getIssuesByProject(pid);
      setRelatedIssues(r.data.filter(i => !i.developers?.some(d => d.id === userId)));
      setActiveProjectId(pid);
    } catch {}
  };

  const nextStatus = s => (s === 'OPENED' || s === 'REOPENED') ? 'IN_PROGRESS' : s === 'IN_PROGRESS' ? 'RESOLVED' : null;

  return (
    <>
      <div className="page-header"><h1>Assigned Issues</h1><p>{myIssues.length} issue{myIssues.length !== 1 ? 's' : ''} assigned to you</p></div>
      <div className="filters-row">
        <div className="search-bar" style={{ maxWidth: 340 }}>
          <span>🔍</span>
          <input placeholder="Search title, project, developer..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        </div>
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['OPENED','IN_PROGRESS','RESOLVED','CLOSED','REOPENED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
        <button className="btn btn-secondary btn-sm" onClick={handleClear}>Clear</button>
      </div>

      {updateModal && <StatusUpdateModal issue={updateModal} userId={userId} onClose={() => setUpdateModal(null)} onRefresh={() => { onRefresh(); setUpdateModal(null); }} />}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {results.length === 0 ? <div className="empty-state"><div className="empty-icon">✅</div><p>No issues match</p></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>#</th><th>Title</th><th>Project</th><th>Priority</th><th>Status</th><th>Reporter</th><th>Due</th><th>Actions</th></tr></thead>
              <tbody>
                {results.map(issue => {
                  const next = nextStatus(issue.status);
                  return (
                    <tr key={issue.id} style={{ background: issue.status === 'REOPENED' ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>#{issue.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, maxWidth: 180 }}>{issue.title}</div>
                        {issue.status === 'REOPENED' && <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>⚠ Needs Rework</div>}
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{issue.project?.name || '—'}</div>
                        {issue.project && <button onClick={() => loadRelated(issue)} style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          {activeProjectId === issue.project.id ? '↑ hide related' : '↓ see related'}
                        </button>}
                      </td>
                      <td><span className={`badge ${getPriorityBadge(issue.priority)}`}>{issue.priority}</span></td>
                      <td><span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status?.replace(/_/g, ' ')}</span></td>
                      <td style={{ fontSize: 13 }}>{issue.reporter?.username || '—'}</td>
                      <td style={{ fontSize: 13 }}>{formatDate(issue.dueDate)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => setSelected(issue)}>View</button>
                          {next && <button className="btn btn-sm btn-primary" onClick={() => setUpdateModal(issue)}>{next === 'IN_PROGRESS' ? '▶ Start' : '✔ Resolve'}</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeProjectId && relatedIssues.length > 0 && (
        <div className="card" style={{ marginTop: 20, borderLeft: '3px solid var(--accent)' }}>
          <div className="card-header">
            <span className="card-title">👁 Related Issues — Same Project <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>(view only)</span></span>
            <button className="btn btn-sm btn-secondary" onClick={() => { setRelatedIssues([]); setActiveProjectId(null); }}>Close</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>#</th><th>Title</th><th>Priority</th><th>Status</th><th>Assigned To</th><th>Due</th><th></th></tr></thead>
              <tbody>
                {relatedIssues.map(i => (
                  <tr key={i.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>#{i.id}</td>
                    <td style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', maxWidth: 200 }}>{i.title}</td>
                    <td><span className={`badge ${getPriorityBadge(i.priority)}`}>{i.priority}</span></td>
                    <td><span className={`badge ${getStatusBadge(i.status)}`}>{i.status?.replace(/_/g, ' ')}</span></td>
                    <td style={{ fontSize: 13 }}>{i.developers?.map(d => d.username).join(', ') || 'Unassigned'}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(i.dueDate)}</td>
                    <td><button className="btn btn-sm btn-secondary" onClick={() => setReadOnly(i)}>👁 View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && <IssueModal issue={selected} onClose={() => setSelected(null)} onRefresh={() => { onRefresh(); setSelected(null); }} />}
      {readOnly && <IssueModal issue={readOnly} readOnly={true} onClose={() => setReadOnly(null)} onRefresh={() => setReadOnly(null)} />}
    </>
  );
}

/* ── Status Update Modal ── */
function StatusUpdateModal({ issue, userId, onClose, onRefresh }) {
  const [newStatus, setNewStatus] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleUpdate = async () => {
    if (!newStatus) { setError('Please select a status.'); return; }
    setSaving(true); setError('');
    try {
      await updateIssueStatus(issue.id, newStatus, file, userId);
      onRefresh();
    } catch (e) { setError(e.response?.data?.error || 'Failed to update.'); setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><span className="modal-title">Update Status</span><button className="modal-close" onClick={onClose}>✕</button></div>
        <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{issue.title}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status?.replace(/_/g, ' ')}</span>
            <span className={`badge ${getPriorityBadge(issue.priority)}`}>{issue.priority}</span>
          </div>
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">New Status *</label>
          <select className="form-control" value={newStatus} onChange={e => { setNewStatus(e.target.value); setError(''); }}>
            <option value="">— Select —</option>
            {(issue.status === 'OPENED' || issue.status === 'REOPENED') && <option value="IN_PROGRESS">🔄 In Progress</option>}
            {issue.status === 'IN_PROGRESS' && <option value="RESOLVED">✅ Resolved (send for review)</option>}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Resolution Proof <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
          <div className="file-upload" onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer', padding: 20 }}>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
            <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
            <div style={{ fontSize: 14, color: file ? 'var(--success)' : 'var(--text-secondary)' }}>{file ? `✓ ${file.name}` : 'Attach screenshot or proof file'}</div>
            {file && <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>✕ Remove</button>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate} disabled={saving || !newStatus}>{saving ? 'Updating...' : 'Update Status'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Request Reassign Page ── */
function ReassignRequestPage({ myIssues, userId, reassignRequests, onRefresh }) {
  const [selectedIssue, setSelectedIssue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Issues developer can request reassignment for (active ones)
  const eligible = myIssues.filter(i => ['OPENED', 'IN_PROGRESS', 'REOPENED'].includes(i.status));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedIssue) { setError('Please select an issue.'); return; }
    if (!reason.trim()) { setError('Please provide a reason.'); return; }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      await createReassignRequest({ issueId: parseInt(selectedIssue), developerId: userId, reason: reason.trim() });
      setReason(''); setSelectedIssue('');
      setSuccess('Reassignment request submitted! The manager has been notified.');
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit request.');
    }
    setSubmitting(false);
  };

  const statusColor = { PENDING: 'var(--warning)', APPROVED: 'var(--success)', REJECTED: 'var(--danger)' };

  return (
    <>
      <div className="page-header"><h1>Request Reassignment</h1><p>Request the manager to reassign an issue to another developer</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Submit Form */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📤 Submit New Request</div>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>✅ {success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Select Issue *</label>
              {eligible.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 0' }}>No active issues eligible for reassignment.</div>
              ) : (
                <select className="form-control" value={selectedIssue} onChange={e => { setSelectedIssue(e.target.value); setError(''); }}>
                  <option value="">— Select an issue —</option>
                  {eligible.map(i => (
                    <option key={i.id} value={i.id}>#{i.id} — {i.title} ({i.status?.replace(/_/g,' ')})</option>
                  ))}
                </select>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Reassignment *</label>
              <textarea className="form-control" rows={5} value={reason}
                onChange={e => { setReason(e.target.value); setError(''); }}
                placeholder="Explain why you need this issue reassigned. e.g. Lack of expertise in this technology, blocked by external dependency, workload conflict..." />
            </div>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12, color: '#fbbf24', marginBottom: 14 }}>
              ⚠️ This request will be sent to your project manager for approval. You remain responsible for the issue until approved.
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={submitting || eligible.length === 0}>
              {submitting ? '⏳ Submitting...' : '📤 Submit Reassignment Request'}
            </button>
          </form>
        </div>

        {/* My Requests */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span className="card-title">My Requests ({reassignRequests.length})</span>
          </div>
          {reassignRequests.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}><div className="empty-icon">🔁</div><p>No requests submitted yet</p></div>
          ) : reassignRequests.map(r => (
            <div key={r.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <em>"{r.reason}"</em>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(r.createdDate)}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: statusColor[r.status], textTransform: 'uppercase', border: `1px solid ${statusColor[r.status]}`, padding: '2px 8px', borderRadius: 99, flexShrink: 0, marginLeft: 10 }}>{r.status}</span>
              </div>
              {r.status === 'REJECTED' && (
                <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>You must continue working on this issue.</div>
              )}
              {r.status === 'APPROVED' && (
                <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>Manager will reassign this issue.</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Ratings Page ── */
function RatingsPage({ ratings, avgScore }) {
  return (
    <>
      <div className="page-header"><h1>My Ratings</h1><p>Feedback from reporters</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center', borderLeft: '3px solid var(--warning)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Avg Score</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 800, lineHeight: 1, color: avgScore >= 4 ? 'var(--success)' : avgScore >= 3 ? 'var(--warning)' : avgScore > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{avgScore > 0 ? avgScore.toFixed(1) : '—'}</div>
          <div style={{ fontSize: 22, margin: '8px 0' }}>{'⭐'.repeat(Math.round(avgScore))}{'☆'.repeat(5 - Math.round(avgScore))}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ratings.length} review{ratings.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Score Distribution</span></div>
          {[5, 4, 3, 2, 1].map(score => {
            const count = ratings.filter(r => r.score === score).length;
            const pct = ratings.length ? Math.round((count / ratings.length) * 100) : 0;
            return (
              <div key={score} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 13, width: 24, textAlign: 'right', flexShrink: 0 }}>{score}⭐</span>
                <div style={{ flex: 1, height: 8, background: 'var(--bg-base)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: score >= 4 ? 'var(--success)' : score === 3 ? 'var(--warning)' : 'var(--danger)', borderRadius: 99, transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 32 }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
      {ratings.length === 0 ? <div className="empty-state"><div className="empty-icon">⭐</div><p>No ratings yet</p></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ratings.map(r => (
            <div key={r.id} className="card" style={{ borderLeft: `3px solid ${r.score >= 4 ? 'var(--success)' : r.score === 3 ? 'var(--warning)' : 'var(--danger)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: r.feedback ? 8 : 0 }}>
                <div><span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{r.reporter?.username}</span><span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>on "{r.issue?.title}"</span></div>
                <span style={{ fontSize: 20 }}>{'⭐'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span>
              </div>
              {r.feedback && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.feedback}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Notifications Page ── */
function NotificationsPage({ userId, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const load = async () => { try { const r = await getNotifications(userId); setNotifications(r.data); } catch {} };
  useEffect(() => { load(); }, [userId]);
  const handleMarkAll = async () => { await markAllRead(userId); load(); onUnreadChange(0); };
  const handleMarkOne = async id => { await markRead(id); load(); onUnreadChange(p => Math.max(0, p - 1)); };
  const unreadCount = notifications.filter(n => !n.read).length;
  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Notifications</h1><p>{unreadCount} unread</p></div>
        {unreadCount > 0 && <button className="btn btn-secondary" onClick={handleMarkAll}>Mark all read</button>}
      </div>
      {notifications.length === 0 ? <div className="empty-state"><div className="empty-icon">🔔</div><p>No notifications</p></div> : (
        <div className="card" style={{ padding: 0 }}>
          {notifications.map(n => (
            <div key={n.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start', background: !n.read ? 'var(--primary-glow)' : 'transparent', cursor: !n.read ? 'pointer' : 'default' }} onClick={() => !n.read && handleMarkOne(n.id)}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: !n.read ? 'var(--primary)' : 'transparent', flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1 }}><p style={{ fontSize: 14, color: !n.read ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.6 }}>{n.message}</p><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{formatDateTime(n.createdDate)}</p></div>
              {!n.read && <span className="badge badge-blue" style={{ fontSize: 10 }}>NEW</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
