import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import IssueModal from '../../components/IssueModal';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import {
  getUsers, getManagers, getDevelopers, getReporters,
  getProjects, createUser, updateUser, deleteUser,
  createProject, updateProject, deleteProject,
  getIssues, getIssueStats, getUnreadCount
} from '../../api';
import { formatDate, getStatusBadge, getPriorityBadge, getRoleBadge } from '../../utils/helpers';
import PasswordInput from '../../components/PasswordInput';

const PAGES = { dashboard:'Dashboard', users:'Employees', projects:'Projects', issues:'All Issues' };
const ADMIN_NAV = [
  { icon:'📊', label:'Dashboard', key:'dashboard' },
  { icon:'👥', label:'Employees', key:'users' },
  { icon:'📁', label:'Projects', key:'projects' },
  { icon:'🐛', label:'All Issues', key:'issues' },
];

export default function AdminDashboard() {
  const [page, setPage] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({});
  const [unread, setUnread] = useState(0);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { logoutUser } = useAuth();

  const loadAll = useCallback(async () => {
    try {
      const [u, p, i, s, un] = await Promise.all([
        getUsers(), getProjects(), getIssues(), getIssueStats(), getUnreadCount(user.id)
      ]);
      setUsers(u.data); setProjects(p.data); setIssues(i.data);
      setStats(s.data); setUnread(un.data.count || 0);
    } catch(e) { console.error(e); }
  }, [user.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const managers = users.filter(u => u.role === 'MANAGER');
  const developers = users.filter(u => u.role === 'DEVELOPER');
  const reporters = users.filter(u => u.role === 'REPORTER');

  return (
    <div className="app-shell">
      <AdminSidebar activePage={page} onNavigate={setPage} username={user.username} unreadCount={unread} logoutUser={logoutUser} />
      <div className="main-content">
        <Topbar title={PAGES[page]||'Admin'} unreadCount={unread} onUnreadChange={setUnread} />
        <div className="page-content">
          {page==='dashboard' && <AdminOverview stats={stats} users={users} projects={projects} issues={issues} managers={managers} developers={developers} reporters={reporters} />}
          {page==='users'     && <EmployeesPage users={users} onRefresh={loadAll} />}
          {page==='projects'  && <ProjectsPage projects={projects} managers={managers} onRefresh={loadAll} />}
          {page==='issues'    && <AllIssuesPage issues={issues} />}
        </div>
      </div>
    </div>
  );
}

/* ── Admin Sidebar ── */
function AdminSidebar({ activePage, onNavigate, username, unreadCount, logoutUser }) {
  
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span>IssueTrack<span style={{background:'linear-gradient(135deg,var(--primary),var(--accent))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Pro</span></span>
        <span className="logo-sub">Admin Panel</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-title">Administration</div>
        {ADMIN_NAV.map(item=>(
          <button key={item.key} className={`nav-item ${activePage===item.key?'active':''}`} onClick={()=>onNavigate(item.key)}>
            <span className="nav-icon">{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar" style={{background:'linear-gradient(135deg,#f59e0b,#ef4444)'}}>A</div>
          <div className="user-info"><div className="user-name">{username}</div><div className="user-role">Administrator</div></div>
        </div>
        <button className="btn btn-secondary w-full mt-2" style={{fontSize:13,padding:8}} onClick={logoutUser}>🚪 Logout</button>
      </div>
    </div>
  );
}

/* ── Overview ── */
function AdminOverview({ stats, users, projects, managers, developers, reporters, issues }) {
  const cards = [
    { label:'Total Issues', value:stats.total||0, color:'blue', icon:'🐛' },
    { label:'Open', value:stats.opened||0, color:'orange', icon:'🔓' },
    { label:'In Progress', value:stats.inProgress||0, color:'purple', icon:'⚡' },
    { label:'Closed', value:stats.closed||0, color:'green', icon:'✅' },
    { label:'Projects', value:projects.length, color:'blue', icon:'📁' },
    { label:'Employees', value:users.filter(u=>u.role!=='ADMIN').length, color:'purple', icon:'👥' },
  ];
  return (
    <>
      <div className="page-header"><h1>Admin Dashboard</h1><p>Complete system overview</p></div>
      <div className="stats-grid">{cards.map(c=>(
        <div key={c.label} className={`stat-card ${c.color}`}>
          <div className="stat-label">{c.label}</div><div className="stat-value">{c.value}</div><div className="stat-icon">{c.icon}</div>
        </div>
      ))}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:20}}>
        {[
          {title:'👔 Managers',data:managers,color:'var(--purple)'},
          {title:'💻 Developers',data:developers,color:'var(--primary)'},
          {title:'🧪 Testers',data:reporters,color:'var(--accent)'},
        ].map(({title,data,color})=>(
          <div key={title} className="card" style={{borderTop:`3px solid ${color}`}}>
            <div className="card-header"><span className="card-title">{title}</span><span style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,color}}>{data.length}</span></div>
            {data.length===0?<p className="text-muted text-sm">None yet</p>:data.slice(0,3).map(u=>(
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${color},var(--bg-hover))`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{u.username[0].toUpperCase()}</div>
                <div><div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{u.username}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{u.email}</div></div>
              </div>
            ))}
            {data.length>3&&<div style={{fontSize:12,color:'var(--text-muted)',marginTop:6}}>+{data.length-3} more</div>}
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">📁 Projects ({projects.length})</span></div>
        {projects.length===0?<p className="text-muted text-sm">No projects</p>:(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
            {projects.map(p=>(
              <div key={p.id} style={{padding:'12px 14px',background:'var(--bg-base)',borderRadius:'var(--radius)',border:'1px solid var(--border)'}}>
                <div style={{fontWeight:700,fontSize:14,color:'var(--text-primary)'}}>{p.name}</div>
                <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>Manager: {p.manager?.username||<span style={{color:'var(--danger)'}}>Unassigned</span>}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Employees Page ── */
function EmployeesPage({ users, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username:'', email:'', password:'', role:'DEVELOPER' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeRole, setActiveRole] = useState('ALL');

  const employees = users.filter(u => u.role !== 'ADMIN');
  const filtered = activeRole === 'ALL' ? employees : employees.filter(u => u.role === activeRole);

  const openCreate = () => { setEditUser(null); setForm({username:'',email:'',password:'',role:'DEVELOPER'}); setError(''); setShowForm(true); };
  const openEdit = (u) => { setEditUser(u); setForm({username:u.username,email:u.email,password:'',role:u.role}); setError(''); setShowForm(true); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editUser) await updateUser(editUser.id, form);
      else await createUser(form);
      setShowForm(false); onRefresh();
    } catch(err) { setError(err.response?.data?.error || 'Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await deleteUser(id); onRefresh(); } catch(err) { alert(err.response?.data?.error||'Failed to delete'); }
  };

  const roleColor = { MANAGER:'var(--purple)', DEVELOPER:'var(--primary)', REPORTER:'var(--accent)' };
  const roleTabs = ['ALL','MANAGER','DEVELOPER','REPORTER'];

  return (
    <>
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div><h1>Employees</h1><p>{employees.length} team member{employees.length!==1?'s':''}</p></div>
        <button className="btn btn-primary" onClick={openCreate}>➕ Add Employee</button>
      </div>

      {/* Role filter tabs */}
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {roleTabs.map(r=>(
          <button key={r} onClick={()=>setActiveRole(r)}
            style={{padding:'7px 16px',borderRadius:'var(--radius)',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'var(--font-body)',
              background:activeRole===r?'var(--primary)':'var(--bg-card)',
              color:activeRole===r?'#fff':'var(--text-secondary)',transition:'all 0.2s'}}>
            {r==='ALL'?`All (${employees.length})`:r==='MANAGER'?`Managers (${employees.filter(u=>u.role==='MANAGER').length})`:r==='DEVELOPER'?`Developers (${employees.filter(u=>u.role==='DEVELOPER').length})`:`Testers (${employees.filter(u=>u.role==='REPORTER').length})`}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editUser?'Edit Employee':'Add Employee'}</span>
              <button className="modal-close" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            {error&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5',borderRadius:'var(--radius)',padding:'10px 14px',fontSize:13,marginBottom:12}}>{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group"><label className="form-label">Username *</label><input className="form-control" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required placeholder="username" /></div>
              <div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required placeholder="user@company.com" /></div>
              {!editUser && (
                <div className="form-group"><label className="form-label">Password *</label><PasswordInput value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required placeholder="Set a password" /></div>
              )}
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-control" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                  <option value="MANAGER">Manager</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="REPORTER">Tester / Reporter</option>
                </select>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving...':editUser?'Update':'Add Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filtered.length===0 ? <div className="empty-state"><div className="empty-icon">👥</div><p>No {activeRole==='ALL'?'employees':activeRole.toLowerCase()+'s'} yet</p></div> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
          {filtered.map(u=>(
            <div key={u.id} className="card" style={{borderLeft:`3px solid ${roleColor[u.role]||'var(--border)'}`}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${roleColor[u.role]||'var(--primary)'},var(--bg-hover))`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:800,flexShrink:0}}>{u.username[0].toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15,color:'var(--text-primary)'}}>{u.username}</div>
                  <div style={{fontSize:12,color:'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
                  <span className={`badge ${u.role==='MANAGER'?'badge-purple':u.role==='DEVELOPER'?'badge-blue':'badge-cyan'}`} style={{marginTop:4,fontSize:10}}>{u.role}</span>
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-sm btn-secondary" style={{flex:1}} onClick={()=>openEdit(u)}>✏️ Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Projects Page ── */
function ProjectsPage({ projects, managers, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState({ name:'', description:'', managerId:'' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openCreate = () => { setEditProject(null); setForm({name:'',description:'',managerId:''}); setError(''); setShowForm(true); };
  const openEdit = p => { setEditProject(p); setForm({name:p.name,description:p.description||'',managerId:p.manager?.id||''}); setError(''); setShowForm(true); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = {...form, managerId: form.managerId||null};
      if (editProject) await updateProject(editProject.id, payload);
      else await createProject(payload);
      setShowForm(false); onRefresh();
    } catch(err) { setError(err.response?.data?.error||'Failed'); }
    setSaving(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this project?')) return;
    try { await deleteProject(id); onRefresh(); } catch(err) { alert('Failed to delete'); }
  };

  return (
    <>
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div><h1>Projects</h1><p>{projects.length} project{projects.length!==1?'s':''}</p></div>
        <button className="btn btn-primary" onClick={openCreate}>➕ Create Project</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editProject?'Edit Project':'Create Project'}</span>
              <button className="modal-close" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            {error&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5',borderRadius:'var(--radius)',padding:'10px 14px',fontSize:13,marginBottom:12}}>{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group"><label className="form-label">Project Name *</label><input className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="e.g. Customer Portal" /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the project..." /></div>
              <div className="form-group">
                <label className="form-label">Assign Manager *</label>
                <select className="form-control" value={form.managerId} onChange={e=>setForm({...form,managerId:e.target.value})} required>
                  <option value="">— Select a manager —</option>
                  {managers.map(m=><option key={m.id} value={m.id}>{m.username} ({m.email})</option>)}
                </select>
                {managers.length===0&&<div style={{fontSize:12,color:'var(--warning)',marginTop:4}}>⚠ No managers available. Add a manager first.</div>}
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving||managers.length===0}>{saving?'Saving...':editProject?'Update':'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {projects.length===0 ? <div className="empty-state"><div className="empty-icon">📁</div><p>No projects yet</p></div> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {projects.map(p=>(
            <div key={p.id} className="card" style={{borderLeft:'3px solid var(--primary)'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,marginBottom:6}}>{p.name}</div>
              <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:12}}>{p.description||'No description'}</p>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,padding:'8px 10px',background:'var(--bg-base)',borderRadius:'var(--radius)'}}>
                <span style={{fontSize:12,color:'var(--text-muted)',fontWeight:600}}>MANAGER</span>
                {p.manager ? (
                  <span style={{fontSize:13,color:'var(--text-primary)',fontWeight:600}}>{p.manager.username}</span>
                ) : (
                  <span style={{fontSize:12,color:'var(--danger)',fontWeight:600}}>⚠ Unassigned</span>
                )}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-sm btn-secondary" style={{flex:1}} onClick={()=>openEdit(p)}>✏️ Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── All Issues Page ── */
function AllIssuesPage({ issues }) {
  const [selected, setSelected] = useState(null);
  

  return (
    <>
      <div className="page-header"><h1>All Issues</h1><p>{issues.length} total across all projects</p></div>
      {issues.length===0 ? <div className="empty-state"><div className="empty-icon">🐛</div><p>No issues yet</p></div> : (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table>
              <thead><tr><th>#</th><th>Title</th><th>Project</th><th>Priority</th><th>Status</th><th>Reporter</th><th>Developers</th><th>Due</th><th></th></tr></thead>
              <tbody>
                {issues.map(issue=>(
                  <tr key={issue.id}>
                    <td style={{color:'var(--text-muted)',fontSize:13}}>#{issue.id}</td>
                    <td style={{fontWeight:600,color:'var(--text-primary)',fontSize:14,maxWidth:200}}>{issue.title}</td>
                    <td style={{fontSize:13}}>{issue.project?.name||'—'}</td>
                    <td><span className={`badge ${getPriorityBadge(issue.priority)}`}>{issue.priority}</span></td>
                    <td><span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status?.replace(/_/g,' ')}</span></td>
                    <td style={{fontSize:13}}>{issue.reporter?.username||'—'}</td>
                    <td style={{fontSize:13}}>{issue.developers?.map(d=>d.username).join(', ')||'—'}</td>
                    <td style={{fontSize:13}}>{formatDate(issue.dueDate)}</td>
                    <td><button className="btn btn-sm btn-secondary" onClick={()=>setSelected(issue)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {selected&&<IssueModal issue={selected} onClose={()=>setSelected(null)} onRefresh={()=>setSelected(null)} />}
    </>
  );
}
