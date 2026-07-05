import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import IssueModal from '../../components/IssueModal';
import {
  getIssueStats, getProjectsByManager, getDevelopers,
  assignIssue, getUnreadCount, getNotifications,
  markAllRead, markRead, searchIssues,
  handleReassignRequest, getReassignAllForManager,
  getDeveloperRatings, getDeveloperAvgScore, getIssuesByProject,
  doReassignIssue
} from '../../api';
import { getPriorityBadge, getStatusBadge, formatDate, formatDateTime } from '../../utils/helpers';

const PAGES = {
  dashboard: 'Dashboard', projects: 'My Projects', issues: 'Issues',
  reassign: 'Reassign Requests', performance: 'Performance', notifications: 'Notifications'
};

export default function ManagerDashboard() {
  const [page, setPage] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [stats, setStats] = useState({});
  const [unread, setUnread] = useState(0);
  const [reassignRequests, setReassignRequests] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadAll = useCallback(async () => {
    try {
      const [p, d, u, rr] = await Promise.all([
        getProjectsByManager(user.id),
        getDevelopers(),
        getUnreadCount(user.id),
        getReassignAllForManager(user.id),
      ]);
      const projects = p.data;
      setProjects(projects);
      setDevelopers(d.data);
      setUnread(u.data.count || 0);
      setReassignRequests(rr.data);

      // Collect all issues from manager's projects
      let issues = [];
      for (const proj of projects) {
        try {
          const r = await getIssuesByProject(proj.id);
          issues = [...issues, ...r.data];
        } catch {}
      }
      // deduplicate
      const unique = issues.filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
      setAllIssues(unique);
      setStats({
        total: unique.length,
        opened: unique.filter(i => i.status === 'OPENED').length,
        inProgress: unique.filter(i => i.status === 'IN_PROGRESS').length,
        resolved: unique.filter(i => i.status === 'RESOLVED').length,
        closed: unique.filter(i => i.status === 'CLOSED').length,
        reopened: unique.filter(i => i.status === 'REOPENED').length,
      });
    } catch (e) { console.error(e); }
  }, [user.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const pendingReassign = reassignRequests.filter(r => r.status === 'PENDING');

  return (
    <div className="app-shell">
      <Sidebar activePage={page} onNavigate={setPage} unreadCount={unread} />
      <div className="main-content">
        <Topbar title={PAGES[page] || 'Manager'} unreadCount={unread} onUnreadChange={setUnread} />
        <div className="page-content">
          {page === 'dashboard'     && <Overview stats={stats} projects={projects} allIssues={allIssues} developers={developers} pendingReassign={pendingReassign} onRefresh={loadAll} onNavigate={setPage} />}
          {page === 'projects'      && <MyProjectsPage projects={projects} allIssues={allIssues} />}
          {page === 'issues'        && <IssuesPage allIssues={allIssues} developers={developers} onRefresh={loadAll} />}
          {page === 'reassign'      && <ReassignPage requests={reassignRequests} developers={developers} onRefresh={loadAll} />}
          {page === 'performance'   && <PerformancePage developers={developers} />}
          {page === 'notifications' && <NotificationsPage userId={user.id} onUnreadChange={setUnread} />}
        </div>
      </div>
    </div>
  );
}

/* ── Overview ── */
function Overview({ stats, projects, allIssues, developers, pendingReassign, onRefresh, onNavigate }) {
  const cards = [
    { label: 'My Projects', value: projects.length, color: 'blue', icon: '📁' },
    { label: 'Total Issues', value: stats.total || 0, color: 'orange', icon: '🐛' },
    { label: 'In Progress', value: stats.inProgress || 0, color: 'purple', icon: '⚡' },
    { label: 'Resolved', value: stats.resolved || 0, color: 'blue', icon: '🔍' },
    { label: 'Closed', value: stats.closed || 0, color: 'green', icon: '✅' },
    { label: 'Reassign Req', value: pendingReassign.length, color: pendingReassign.length > 0 ? 'red' : 'green', icon: '🔁' },
  ];
  const unassigned = allIssues.filter(i => !i.developers || i.developers.length === 0);
  const recent = [...allIssues].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate)).slice(0, 5);

  return (
    <>
      <div className="page-header"><h1>Manager Dashboard</h1><p>Overview of your assigned projects and issues</p></div>
      <div className="stats-grid">{cards.map(c => (
        <div key={c.label} className={`stat-card ${c.color}`}>
          <div className="stat-label">{c.label}</div><div className="stat-value">{c.value}</div><div className="stat-icon">{c.icon}</div>
        </div>
      ))}</div>

      {unassigned.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: '#fca5a5' }}>⚠️ <strong>{unassigned.length}</strong> issue{unassigned.length > 1 ? 's are' : ' is'} unassigned</span>
          <button className="btn btn-sm btn-danger" onClick={() => onNavigate('issues')}>Assign Now</button>
        </div>
      )}
      {pendingReassign.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: '#fbbf24' }}>🔁 <strong>{pendingReassign.length}</strong> developer reassignment request{pendingReassign.length > 1 ? 's' : ''} pending your decision</span>
          <button className="btn btn-sm btn-warning" onClick={() => onNavigate('reassign')}>Review</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}><span className="card-title">Recent Issues</span></div>
          <MiniIssueTable issues={recent} onRefresh={onRefresh} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">📁 My Projects</span></div>
            {projects.length === 0 ? <p className="text-muted text-sm">No projects assigned yet</p> : projects.map(p => (
              <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{allIssues.filter(i => i.project?.id === p.id).length} issues</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">💻 Developers ({developers.length})</span></div>
            {developers.length === 0 ? <p className="text-muted text-sm">No developers</p> : developers.slice(0, 4).map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{d.username[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{d.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{allIssues.filter(i => i.developers?.some(dev => dev.id === d.id) && ['OPENED','IN_PROGRESS'].includes(i.status)).length} active issues</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Mini issue table for overview ── */
function MiniIssueTable({ issues, onRefresh }) {
  const [selected, setSelected] = useState(null);
  if (!issues.length) return <div className="empty-state" style={{ padding: 24 }}><div className="empty-icon">🐛</div><p>No issues yet</p></div>;
  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>Title</th><th>Project</th><th>Priority</th><th>Status</th><th></th></tr></thead>
          <tbody>{issues.map(i => (
            <tr key={i.id}>
              <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, maxWidth: 180 }}>{i.title}</td>
              <td style={{ fontSize: 12 }}>{i.project?.name || '—'}</td>
              <td><span className={`badge ${getPriorityBadge(i.priority)}`} style={{ fontSize: 10 }}>{i.priority}</span></td>
              <td><span className={`badge ${getStatusBadge(i.status)}`} style={{ fontSize: 10 }}>{i.status?.replace(/_/g, ' ')}</span></td>
              <td><button className="btn btn-sm btn-secondary" onClick={() => setSelected(i)}>View</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {selected && <IssueModal issue={selected} onClose={() => setSelected(null)} onRefresh={() => { onRefresh?.(); setSelected(null); }} />}
    </>
  );
}

/* ── My Projects Page ── */
function MyProjectsPage({ projects, allIssues }) {
  return (
    <>
      <div className="page-header"><h1>My Projects</h1><p>{projects.length} project{projects.length !== 1 ? 's' : ''} assigned to you</p></div>
      {projects.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📁</div><p>No projects assigned to you yet. Contact your Admin.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {projects.map(p => {
            const pIssues = allIssues.filter(i => i.project?.id === p.id);
            const open = pIssues.filter(i => i.status === 'OPENED').length;
            const inProg = pIssues.filter(i => i.status === 'IN_PROGRESS').length;
            const closed = pIssues.filter(i => i.status === 'CLOSED').length;
            return (
              <div key={p.id} className="card" style={{ borderLeft: '3px solid var(--primary)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{p.description || 'No description'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[['Open', open, 'var(--warning)'], ['Active', inProg, 'var(--purple)'], ['Closed', closed, 'var(--success)']].map(([label, val, color]) => (
                    <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg-base)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total: {pIssues.length} issue{pIssues.length !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ── Issues Page ── */
function IssuesPage({ allIssues, developers, onRefresh }) {
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(allIssues);
  const [assignModal, setAssignModal] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => { applyFilters(allIssues, search, priority, status); }, [allIssues]);

  const applyFilters = (src, kw, pri, st) => {
    let f = src;
    if (kw) f = f.filter(i => i.title.toLowerCase().includes(kw.toLowerCase()) || (i.project?.name || '').toLowerCase().includes(kw.toLowerCase()) || i.developers?.some(d => d.username.toLowerCase().includes(kw.toLowerCase())));
    if (pri) f = f.filter(i => i.priority === pri);
    if (st) f = f.filter(i => i.status === st);
    setResults(f);
  };

  const handleSearch = () => applyFilters(allIssues, search, priority, status);
  const handleClear = () => { setSearch(''); setPriority(''); setStatus(''); setResults(allIssues); };

  return (
    <>
      <div className="page-header"><h1>Issues</h1><p>{results.length} of {allIssues.length} issues shown</p></div>
      <div className="filters-row">
        <div className="search-bar" style={{ maxWidth: 340 }}>
          <span>🔍</span>
          <input placeholder="Search title, project, developer..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        </div>
        <select className="filter-select" value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {['LOW','MEDIUM','HIGH','CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['OPENED','IN_PROGRESS','RESOLVED','CLOSED','REOPENED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
        <button className="btn btn-secondary btn-sm" onClick={handleClear}>Clear</button>
      </div>

      {assignModal && <AssignModal issue={assignModal} developers={developers} onClose={() => setAssignModal(null)} onRefresh={() => { onRefresh(); setAssignModal(null); }} />}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {results.length === 0 ? <div className="empty-state"><div className="empty-icon">🐛</div><p>No issues found</p></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>#</th><th>Title</th><th>Project</th><th>Priority</th><th>Status</th><th>Reporter</th><th>Developers</th><th>Due</th><th>Actions</th></tr></thead>
              <tbody>
                {results.map(issue => (
                  <tr key={issue.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>#{issue.id}</td>
                    <td><div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, maxWidth: 180 }}>{issue.title}</div>{issue.issueType && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{issue.issueType}</div>}</td>
                    <td style={{ fontSize: 13 }}>{issue.project?.name || '—'}</td>
                    <td><span className={`badge ${getPriorityBadge(issue.priority)}`}>{issue.priority}</span></td>
                    <td><span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status?.replace(/_/g,' ')}</span></td>
                    <td style={{ fontSize: 13 }}>{issue.reporter?.username || '—'}</td>
                    <td style={{ fontSize: 13 }}>
                      {issue.developers?.length > 0 ? issue.developers.map(d => d.username).join(', ') : <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 12 }}>⚠ Unassigned</span>}
                    </td>
                    <td style={{ fontSize: 13 }}>{formatDate(issue.dueDate)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setSelected(issue)}>View</button>
                        <button className="btn btn-sm btn-primary" onClick={() => setAssignModal(issue)}>Assign</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && <IssueModal issue={selected} onClose={() => setSelected(null)} onRefresh={() => { onRefresh(); setSelected(null); }} />}
    </>
  );
}

/* ── Assign Modal ── */
function AssignModal({ issue, developers, onClose, onRefresh }) {
  const [selectedDevs, setSelectedDevs] = useState(issue.developers?.map(d => String(d.id)) || []);
  const [dueDate, setDueDate] = useState(issue.dueDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = id => setSelectedDevs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = async () => {
    if (selectedDevs.length === 0) { setError('Select at least one developer.'); return; }
    setSaving(true); setError('');
    try {
      await assignIssue(issue.id, { developerIds: selectedDevs.map(Number), dueDate });
      onRefresh();
    } catch (e) { setError(e.response?.data?.error || 'Failed'); setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Assign Developers</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{issue.title}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className={`badge ${getPriorityBadge(issue.priority)}`}>{issue.priority}</span>
            <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status?.replace(/_/g, ' ')}</span>
          </div>
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Select Developers <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(one or more)</span></label>
          {developers.length === 0 ? <p className="text-muted text-sm">No developers available</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 250, overflowY: 'auto' }}>
              {developers.map(d => {
                const checked = selectedDevs.includes(String(d.id));
                return (
                  <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-base)', borderRadius: 'var(--radius)', border: `1px solid ${checked ? 'var(--primary)' : 'var(--border-light)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(String(d.id))} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{d.username[0].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{d.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.email}</div>
                    </div>
                    {checked && <span style={{ color: 'var(--primary)', fontSize: 18 }}>✓</span>}
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input className="form-control" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Assigning...' : '✓ Assign'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Reassign Requests Page ── */
function ReassignPage({ requests, developers, onRefresh }) {
  const [handling, setHandling] = useState(null);
  const [reassignModal, setReassignModal] = useState(null);
  const pending = requests.filter(r => r.status === 'PENDING');
  const approved = requests.filter(r => r.status === 'APPROVED');
  const history = requests.filter(r => r.status === 'REJECTED' || r.status === 'COMPLETED');

  const handle = async (id, isApproved) => {
    setHandling(id);
    try {
      await handleReassignRequest(id, isApproved);
      onRefresh();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    setHandling(null);
  };

  const statusColor = { PENDING: 'var(--warning)', APPROVED: 'var(--success)', REJECTED: 'var(--danger)', COMPLETED: 'var(--accent)' };
  const statusLabel = { PENDING: '⏳ Pending', APPROVED: '✅ Approved', REJECTED: '❌ Rejected', COMPLETED: '✔ Completed' };

  return (
    <>
      <div className="page-header"><h1>Reassign Requests</h1><p>Manage developer reassignment requests</p></div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>⏳ Awaiting Your Decision ({pending.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map(r => (
              <div key={r.id} className="card" style={{ borderLeft: '3px solid var(--warning)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                      🔁 <span style={{ color: 'var(--primary)' }}>{r.developer?.username}</span>
                      {r.issueTitle && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>on "{r.issueTitle}"</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Reason: <em>"{r.reason}"</em>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(r.createdDate)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-sm btn-success" onClick={() => handle(r.id, true)} disabled={handling === r.id}>✓ Approve</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handle(r.id, false)} disabled={handling === r.id}>✕ Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved — ready to reassign */}
      {approved.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>✅ Approved — Reassign Now ({approved.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {approved.map(r => (
              <div key={r.id} className="card" style={{ borderLeft: '3px solid var(--success)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                      🔁 <span style={{ color: 'var(--success)' }}>{r.developer?.username}</span>
                      {r.issueTitle && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>on "{r.issueTitle}"</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}><em>"{r.reason}"</em></div>
                    <div style={{ fontSize: 12, color: 'var(--success)' }}>Request approved — please choose new developer(s) and reassign</div>
                  </div>
                  <button className="btn btn-primary" onClick={() => setReassignModal(r)} style={{ flexShrink: 0 }}>
                    🔁 Reassign Issue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && approved.length === 0 && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: 14, color: 'var(--success)' }}>
          ✅ No pending reassignment requests
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>History ({history.length})</div>
          <div className="card" style={{ padding: 0 }}>
            {history.map(r => (
              <div key={r.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[r.status], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.developer?.username}</span>
                  {r.issueTitle && <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>— "{r.issueTitle}"</span>}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.reason}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: statusColor[r.status], border: `1px solid ${statusColor[r.status]}`, padding: '2px 8px', borderRadius: 99, flexShrink: 0 }}>
                  {statusLabel[r.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {reassignModal && (
        <DoReassignModal
          request={reassignModal}
          developers={developers.filter(d => d.id !== reassignModal.developer?.id)}
          onClose={() => setReassignModal(null)}
          onRefresh={() => { onRefresh(); setReassignModal(null); }}
        />
      )}
    </>
  );
}

/* ── Do Reassign Modal ── */
function DoReassignModal({ request, developers, onClose, onRefresh }) {
  const [selectedDevs, setSelectedDevs] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = id => setSelectedDevs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleReassign = async () => {
    if (selectedDevs.length === 0) { setError('Please select at least one developer.'); return; }
    setSaving(true); setError('');
    try {
      await doReassignIssue(request.id, selectedDevs.map(Number), dueDate || null);
      onRefresh();
    } catch (e) { setError(e.response?.data?.error || 'Failed to reassign.'); setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🔁 Reassign Issue</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {/* Issue info */}
        <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Reassigning from <strong style={{ color: 'var(--danger)' }}>{request.developer?.username}</strong></div>
          {request.issueTitle && <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{request.issueTitle}</div>}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Reason: "{request.reason}"</div>
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Assign to New Developer(s) *</label>
          {developers.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No other developers available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {developers.map(d => {
                const checked = selectedDevs.includes(String(d.id));
                return (
                  <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-base)', borderRadius: 'var(--radius)', border: `1px solid ${checked ? 'var(--primary)' : 'var(--border-light)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(String(d.id))} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{d.username[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{d.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.email}</div>
                    </div>
                    {checked && <span style={{ color: 'var(--primary)', fontSize: 16, marginLeft: 'auto' }}>✓</span>}
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Due Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input className="form-control" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleReassign} disabled={saving || selectedDevs.length === 0}>
            {saving ? 'Reassigning...' : '🔁 Confirm Reassign'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Performance Page ── */
function PerformancePage({ developers }) {
  const [data, setData] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    
    developers.forEach(async d => {
      try {
        const [r, a] = await Promise.all([getDeveloperRatings(d.id), getDeveloperAvgScore(d.id)]);
        setData(prev => ({ ...prev, [d.id]: { ratings: r.data, avg: a.data.average || 0 } }));
      } catch {}
    });
  }, [developers]);

  return (
    <>
      <div className="page-header"><h1>Performance</h1><p>Developer ratings from reporters</p></div>
      {developers.length === 0 ? <div className="empty-state"><div className="empty-icon">📈</div><p>No developers</p></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {developers.map(d => {
            const info = data[d.id] || { ratings: [], avg: 0 };
            return (
              <div key={d.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>{d.username[0].toUpperCase()}</div>
                  <div><div style={{ fontWeight: 700, fontSize: 15 }}>{d.username}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{info.ratings.length} review{info.ratings.length !== 1 ? 's' : ''}</div></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: info.avg >= 4 ? 'var(--success)' : info.avg >= 3 ? 'var(--warning)' : info.avg > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{info.avg > 0 ? info.avg.toFixed(1) : '—'}</div>
                  <div><div>{'⭐'.repeat(Math.round(info.avg))}{'☆'.repeat(5 - Math.round(info.avg))}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>avg score</div></div>
                </div>
                {expanded === d.id && info.ratings.map(r => (
                  <div key={r.id} style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid var(--border)', fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>{r.reporter?.username}</span><span>{'⭐'.repeat(r.score)}</span></div>
                    {r.feedback && <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{r.feedback}</p>}
                  </div>
                ))}
              </div>
            );
          })}
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
