import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import IssueModal from '../../components/IssueModal';
import {
  getIssuesByReporter, getProjects, createIssue, getUnreadCount,
  getNotifications, markAllRead, markRead, searchIssues
} from '../../api';
import { getPriorityBadge, getStatusBadge, formatDate, formatDateTime } from '../../utils/helpers';

const PAGES = { dashboard:'Dashboard', 'create-issue':'Report Issue', issues:'My Issues', notifications:'Notifications' };

export default function ReporterDashboard() {
  const [page, setPage] = useState('dashboard');
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [unread, setUnread] = useState(0);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadAll = useCallback(async () => {
    try {
      const [i, p, u] = await Promise.all([
        getIssuesByReporter(user.id), getProjects(), getUnreadCount(user.id)
      ]);
      setIssues(i.data); setProjects(p.data); setUnread(u.data.count||0);
    } catch(e) { console.error(e); }
  }, [user.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const stats = {
    total: issues.length,
    opened: issues.filter(i=>i.status==='OPENED').length,
    inProgress: issues.filter(i=>i.status==='IN_PROGRESS').length,
    resolved: issues.filter(i=>i.status==='RESOLVED').length,
    closed: issues.filter(i=>i.status==='CLOSED').length,
    reopened: issues.filter(i=>i.status==='REOPENED').length,
  };

  return (
    <div className="app-shell">
      <Sidebar activePage={page} onNavigate={setPage} unreadCount={unread} />
      <div className="main-content">
        <Topbar title={PAGES[page]||'Reporter'} unreadCount={unread} onUnreadChange={setUnread} />
        <div className="page-content">
          {page==='dashboard'    && <Overview stats={stats} issues={issues} onRefresh={loadAll} onNavigate={setPage} />}
          {page==='create-issue' && <CreateIssue projects={projects} userId={user.id} onSuccess={()=>{loadAll();setPage('issues');}} />}
          {page==='issues'       && <MyIssues issues={issues} userId={user.id} onRefresh={loadAll} />}
          {page==='notifications'&& <NotificationsPage userId={user.id} onUnreadChange={setUnread} />}
        </div>
      </div>
    </div>
  );
}

/* ── Overview ── */
function Overview({ stats, issues, onRefresh, onNavigate }) {
  const cards = [
    { label:'My Issues', value:stats.total||0, color:'blue', icon:'🐛' },
    { label:'Open', value:stats.opened||0, color:'orange', icon:'🔓' },
    { label:'In Progress', value:stats.inProgress||0, color:'purple', icon:'⚡' },
    { label:'Resolved', value:stats.resolved||0, color:'blue', icon:'🔍' },
    { label:'Closed', value:stats.closed||0, color:'green', icon:'✅' },
  ];
  const needsReview = issues.filter(i=>i.status==='RESOLVED');
  const recent = [...issues].sort((a,b)=>new Date(b.createdDate)-new Date(a.createdDate)).slice(0,5);

  return (
    <>
      <div className="page-header"><h1>Reporter Dashboard</h1><p>Track and manage your reported issues</p></div>
      <div className="stats-grid">{cards.map(c=>(
        <div key={c.label} className={`stat-card ${c.color}`}>
          <div className="stat-label">{c.label}</div><div className="stat-value">{c.value}</div><div className="stat-icon">{c.icon}</div>
        </div>
      ))}</div>

      {needsReview.length>0 && (
        <div className="alert alert-info" style={{marginBottom:20}}>
          🔔 <strong>{needsReview.length}</strong> issue{needsReview.length>1?'s need':'needs'} your review — developer marked them resolved!
          <button className="btn btn-sm btn-primary" style={{marginLeft:12}} onClick={()=>onNavigate('issues')}>Review Now</button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span className="card-title">Recent Issues</span>
            <button className="btn btn-sm btn-secondary" onClick={()=>onNavigate('issues')}>View All</button>
          </div>
          <IssuesMiniTable issues={recent} onRefresh={onRefresh} />
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {needsReview.length>0&&(
            <div className="card" style={{borderLeft:'3px solid var(--warning)'}}>
              <div className="card-header"><span className="card-title">⏳ Awaiting Review ({needsReview.length})</span></div>
              {needsReview.map(issue=>(
                <div key={issue.id} style={{padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                  <div style={{fontWeight:600,color:'var(--text-primary)'}}>{issue.title}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{issue.developers?.map(d=>d.username).join(', ')||'—'}</div>
                  <span className="badge badge-purple" style={{marginTop:4,fontSize:10}}>RESOLVED — Needs Review</span>
                </div>
              ))}
            </div>
          )}
          <div className="card" style={{borderLeft:'3px solid var(--success)'}}>
            <div className="card-header"><span className="card-title">Quick Actions</span></div>
            <button className="btn btn-primary w-full" style={{marginBottom:8}} onClick={()=>onNavigate('create-issue')}>➕ Report New Issue</button>
            <button className="btn btn-secondary w-full" onClick={()=>onNavigate('issues')}>🐛 View My Issues</button>
          </div>
        </div>
      </div>
    </>
  );
}

function IssuesMiniTable({ issues, onRefresh }) {
  const [selected, setSelected] = useState(null);
  if (!issues || issues.length===0) return <div className="empty-state" style={{padding:24}}><div className="empty-icon">🐛</div><p>No issues yet</p></div>;
  return (
    <>
      <div style={{overflowX:'auto'}}>
        <table>
          <thead><tr><th>Title</th><th>Priority</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {issues.map(i=>(
              <tr key={i.id}>
                <td style={{fontWeight:600,color:'var(--text-primary)',fontSize:13,maxWidth:200}}>{i.title}</td>
                <td><span className={`badge ${getPriorityBadge(i.priority)}`}>{i.priority}</span></td>
                <td><span className={`badge ${getStatusBadge(i.status)}`}>{i.status?.replace(/_/g,' ')}</span></td>
                <td><button className="btn btn-sm btn-secondary" onClick={()=>setSelected(i)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected&&<IssueModal issue={selected} onClose={()=>setSelected(null)} onRefresh={()=>{onRefresh();setSelected(null);}} />}
    </>
  );
}

/* ── Create Issue ── */
function CreateIssue({ projects, userId, onSuccess }) {
  const [form, setForm] = useState({ title:'', description:'', issueType:'Bug', priority:'MEDIUM', projectId:'', dueDate:'', reporterId:userId });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = React.useRef(null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('issue', JSON.stringify({...form, projectId:form.projectId||null}));
      if (file) fd.append('file', file);
      await createIssue(fd);
      onSuccess();
    } catch(err) { setError(err.response?.data?.error||'Failed to create issue. Please try again.'); }
    setSaving(false);
  };

  return (
    <>
      <div className="page-header"><h1>Report New Issue</h1><p>Describe the bug or problem you've found</p></div>
      <div style={{maxWidth:700}}>
        <div className="card">
          {error&&<div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Issue Title *</label>
              <input className="form-control" placeholder="Brief, descriptive title..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={5} placeholder="Steps to reproduce, expected vs actual behavior..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Issue Type</label>
                <select className="form-control" value={form.issueType} onChange={e=>setForm({...form,issueType:e.target.value})}>
                  {['Bug','Feature Request','Performance','Security','UI/UX','Documentation','Other'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                  {['LOW','MEDIUM','HIGH','CRITICAL'].map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Project</label>
                <select className="form-control" value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})}>
                  <option value="">No project</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-control" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Attachment <span style={{color:'var(--text-muted)',fontWeight:400}}>(screenshot, logs, etc.)</span></label>
              <div className="file-upload" onClick={()=>fileRef.current?.click()} style={{cursor:'pointer'}}>
                <input ref={fileRef} type="file" style={{display:'none'}} onChange={e=>setFile(e.target.files[0])} />
                <div style={{fontSize:28,marginBottom:6}}>📎</div>
                <div style={{fontSize:14,color:file?'var(--success)':'var(--text-secondary)'}}>
                  {file?`✓ ${file.name}`:'Click to attach a file'}
                </div>
                <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>PNG, JPG, PDF, ZIP up to 10MB</div>
                {file&&<button type="button" onClick={e=>{e.stopPropagation();setFile(null);}} style={{marginTop:6,background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:12}}>✕ Remove</button>}
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{marginTop:8}}>
              {saving?'⏳ Submitting...':'🐛 Submit Issue'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/* ── My Issues ── */
function MyIssues({ issues, userId, onRefresh }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(issues);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(()=>{ applyFilters(issues, search, status); }, [issues]);

  const applyFilters = (source, kw, st) => {
    let f = source;
    if (st) f = f.filter(i=>i.status===st);
    if (kw) f = f.filter(i=>
      i.title.toLowerCase().includes(kw.toLowerCase()) ||
      (i.project?.name||'').toLowerCase().includes(kw.toLowerCase()) ||
      i.developers?.some(d=>d.username.toLowerCase().includes(kw.toLowerCase()))
    );
    setResults(f);
  };

  const handleSearch = async () => {
    if (!search.trim() && !status) { setResults(issues); return; }
    setSearching(true);
    try {
      if (search.trim()) {
        const r = await searchIssues(search.trim(), userId);
        let f = r.data;
        if (status) f = f.filter(i=>i.status===status);
        setResults(f);
      } else {
        applyFilters(issues, '', status);
      }
    } catch { applyFilters(issues, search, status); }
    setSearching(false);
  };

  const handleClear = () => { setSearch(''); setStatus(''); setResults(issues); };

  return (
    <>
      <div className="page-header"><h1>My Issues</h1><p>{issues.length} issue{issues.length!==1?'s':''} reported by you</p></div>
      <div className="filters-row">
        <div className="search-bar" style={{maxWidth:340}}>
          <span>🔍</span>
          <input placeholder="Search by title, project, developer..." value={search}
            onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} />
        </div>
        <select className="filter-select" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['OPENED','IN_PROGRESS','RESOLVED','CLOSED','REOPENED'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={handleSearch} disabled={searching}>{searching?'...':'Search'}</button>
        <button className="btn btn-secondary btn-sm" onClick={handleClear}>Clear</button>
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {results.length===0 ? <div className="empty-state"><div className="empty-icon">🐛</div><p>No issues found</p></div> : (
          <div style={{overflowX:'auto'}}>
            <table>
              <thead><tr><th>#</th><th>Title</th><th>Project</th><th>Priority</th><th>Status</th><th>Developers</th><th>Due</th><th>Action</th></tr></thead>
              <tbody>
                {results.map(issue=>(
                  <tr key={issue.id}>
                    <td style={{color:'var(--text-muted)',fontSize:13}}>#{issue.id}</td>
                    <td><div style={{fontWeight:600,color:'var(--text-primary)',fontSize:14}}>{issue.title}</div>{issue.issueType&&<div style={{fontSize:11,color:'var(--text-muted)'}}>{issue.issueType}</div>}</td>
                    <td style={{fontSize:13}}>{issue.project?.name||'—'}</td>
                    <td><span className={`badge ${getPriorityBadge(issue.priority)}`}>{issue.priority}</span></td>
                    <td><span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status?.replace(/_/g,' ')}</span></td>
                    <td style={{fontSize:13}}>{issue.developers?.map(d=>d.username).join(', ')||<span style={{color:'var(--text-muted)'}}>Unassigned</span>}</td>
                    <td style={{fontSize:13}}>{formatDate(issue.dueDate)}</td>
                    <td>
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        <button className="btn btn-sm btn-secondary" onClick={()=>setSelected(issue)}>View</button>
                        {issue.status==='RESOLVED'&&<span className="badge badge-orange" style={{fontSize:10}}>Review!</span>}
                        {issue.status==='CLOSED'&&<span className="badge badge-green" style={{fontSize:10}}>Closed</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected&&<IssueModal issue={selected} onClose={()=>setSelected(null)} onRefresh={()=>{onRefresh();setSelected(null);}} />}
    </>
  );
}

/* ── Notifications ── */
function NotificationsPage({ userId, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const load = async () => { try { const r = await getNotifications(userId); setNotifications(r.data); } catch {} };
  useEffect(()=>{load();},[userId]);
  const handleMarkAll = async () => { await markAllRead(userId); load(); onUnreadChange(0); };
  const handleMarkOne = async id => { await markRead(id); load(); onUnreadChange(p=>Math.max(0,p-1)); };
  const unreadCount = notifications.filter(n=>!n.read).length;
  return (
    <>
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div><h1>Notifications</h1><p>{unreadCount} unread</p></div>
        {unreadCount>0&&<button className="btn btn-secondary" onClick={handleMarkAll}>Mark all read</button>}
      </div>
      {notifications.length===0?<div className="empty-state"><div className="empty-icon">🔔</div><p>No notifications</p></div>:(
        <div className="card" style={{padding:0}}>
          {notifications.map(n=>(
            <div key={n.id} style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',gap:14,alignItems:'flex-start',background:!n.read?'var(--primary-glow)':'transparent',cursor:!n.read?'pointer':'default'}} onClick={()=>!n.read&&handleMarkOne(n.id)}>
              <div style={{width:8,height:8,borderRadius:'50%',background:!n.read?'var(--primary)':'transparent',flexShrink:0,marginTop:6}} />
              <div style={{flex:1}}><p style={{fontSize:14,color:!n.read?'var(--text-primary)':'var(--text-secondary)',lineHeight:1.6}}>{n.message}</p><p style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>{formatDateTime(n.createdDate)}</p></div>
              {!n.read&&<span className="badge badge-blue" style={{fontSize:10}}>NEW</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
