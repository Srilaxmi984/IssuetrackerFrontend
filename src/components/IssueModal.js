import React, { useState, useEffect, useRef } from 'react';
import { getComments, addComment, approveIssue, addRating, updateIssueStatus } from '../api';
import { useAuth } from '../context/AuthContext';
import { getPriorityBadge, getStatusBadge, formatDate, formatDateTime, FILE_BASE } from '../utils/helpers';

/* ── Inline file viewer ── */
function FileViewer({ fileName, label }) {
  const [expanded, setExpanded] = useState(false);
  if (!fileName) return null;
  const url = `${FILE_BASE}${fileName}`;
  const ext = fileName.split('.').pop().toLowerCase();
  const isImage = ['png','jpg','jpeg','gif','webp','bmp'].includes(ext);
  const isPdf = ext === 'pdf';
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href={url} target="_blank" rel="noreferrer" className="file-link">📎 {label || 'View File'}</a>
        {(isImage || isPdf) && (
          <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            {expanded ? '▲ Hide Preview' : '▼ Preview'}
          </button>
        )}
      </div>
      {expanded && isImage && (
        <div style={{ marginTop: 10, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img src={url} alt="attachment" style={{ maxWidth: '100%', maxHeight: 400, display: 'block', objectFit: 'contain', background: '#000' }} />
        </div>
      )}
      {expanded && isPdf && (
        <div style={{ marginTop: 10, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <iframe src={url} title="PDF Preview" style={{ width: '100%', height: 420, border: 'none' }} />
        </div>
      )}
    </div>
  );
}

/* ── Star picker for one developer ── */
function StarPicker({ devId, devName, ratings, onChange }) {
  const [hover, setHover] = useState(0);
  const current = ratings[devId] || { score: 0, feedback: '' };
  return (
    <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
          {devName[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{devName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Developer</div>
        </div>
        {current.score > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>✓ Rated {current.score}/5</span>
        )}
      </div>
      {/* Stars */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
        {[1,2,3,4,5].map(s => (
          <span key={s}
            onClick={() => onChange(devId, 'score', s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            style={{ fontSize: 30, cursor: 'pointer', userSelect: 'none', transition: 'transform 0.1s, filter 0.1s', transform: (hover || current.score) >= s ? 'scale(1.18)' : 'scale(1)', filter: (hover || current.score) >= s ? 'drop-shadow(0 0 4px gold)' : 'none' }}>
            {(hover || current.score) >= s ? '⭐' : '☆'}
          </span>
        ))}
        {(hover || current.score) > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6, fontWeight: 600 }}>
            {['','1 – Poor','2 – Fair','3 – Good','4 – Great','5 – Excellent'][hover || current.score]}
          </span>
        )}
      </div>
      {/* Feedback */}
      <textarea
        className="form-control"
        rows={2}
        value={current.feedback}
        onChange={e => onChange(devId, 'feedback', e.target.value)}
        placeholder={`Feedback for ${devName}… (optional)`}
        style={{ fontSize: 13 }}
      />
    </div>
  );
}

export default function IssueModal({ issue: initialIssue, onClose, onRefresh, readOnly = false }) {
  const { user } = useAuth();
  const [issue] = useState(initialIssue);
  const [comments, setComments] = useState([]);
  const [msg, setMsg] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Per-developer ratings: { [devId]: { score, feedback } }
  const [devRatings, setDevRatings] = useState({});
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState('');

  const [activeTab, setActiveTab] = useState('details');
  const [statusFile, setStatusFile] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  const [rejectionNote, setRejectionNote] = useState('');
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');

  const commentsEndRef = useRef(null);
  const statusFileRef = useRef(null);

  useEffect(() => { loadComments(); }, [issue.id]);
  useEffect(() => {
    if (activeTab === 'comments') {
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [comments, activeTab]);

  const loadComments = async () => {
    try {
      const r = await getComments(issue.id);
      setComments(Array.isArray(r.data) ? r.data : []);
    } catch (e) { console.error('Load comments:', e); }
  };

  const submitComment = async () => {
    const trimmed = msg.trim();
    if (!trimmed) return;
    setCommentError(''); setSendingComment(true);
    try {
      const res = await addComment(issue.id, { message: trimmed, createdBy: user.username });
      if (res.data?.id) setComments(prev => [...prev, res.data]);
      setMsg('');
      await loadComments();
    } catch (e) {
      setCommentError(e.response?.data?.error || 'Failed to send comment.');
    }
    setSendingComment(false);
  };

  const handleApprove = async (approved) => {
    setApproving(true); setApproveError('');
    try {
      await approveIssue(issue.id, approved, user.id, approved ? null : rejectionNote);
      onRefresh(); onClose();
    } catch (e) {
      setApproveError(e.response?.data?.error || 'Error processing review.');
      setApproving(false);
    }
  };

  // Update per-developer rating state
  const handleDevRatingChange = (devId, field, value) => {
    setDevRatings(prev => ({
      ...prev,
      [devId]: { ...prev[devId], score: prev[devId]?.score || 0, feedback: prev[devId]?.feedback || '', [field]: value }
    }));
    setRatingError('');
  };

  // Submit ratings for ALL developers
  const handleSubmitAllRatings = async () => {
    const developers = issue.developers || [];
    // Validate at least one developer rated
    const ratedDevs = developers.filter(d => devRatings[d.id]?.score > 0);
    if (ratedDevs.length === 0) { setRatingError('Please rate at least one developer.'); return; }

    setRatingSubmitting(true); setRatingError('');
    const errors = [];
    for (const dev of ratedDevs) {
      const r = devRatings[dev.id];
      try {
        await addRating(issue.id, { score: r.score, feedback: r.feedback || '', reporterId: user.id, developerId: dev.id });
      } catch (e) {
        const msg = e.response?.data?.error || `Failed for ${dev.username}`;
        if (!msg.includes('already rated')) errors.push(msg);
      }
    }
    if (errors.length > 0) {
      setRatingError(errors.join(' | '));
      setRatingSubmitting(false);
      return;
    }
    setRatingSubmitted(true);
    onRefresh();
    setRatingSubmitting(false);
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) { setStatusError('Please select a status.'); return; }
    setStatusError(''); setUpdatingStatus(true);
    try {
      await updateIssueStatus(issue.id, newStatus, statusFile, user.id);
      onRefresh(); onClose();
    } catch (e) {
      setStatusError(e.response?.data?.error || 'Error updating status.');
      setUpdatingStatus(false);
    }
  };

  const isAssignedDev = user.role === 'DEVELOPER' && issue.developers?.some(d => d.id === user.id);
  const canUpdateStatus = isAssignedDev && ['OPENED','IN_PROGRESS','REOPENED'].includes(issue.status);
  const canReview = user.role === 'REPORTER' && issue.status === 'RESOLVED' && issue.reporter?.id === user.id;
  const canRate = user.role === 'REPORTER' && issue.status === 'CLOSED' && issue.reporter?.id === user.id && issue.developers?.length > 0;
  const canComment = !readOnly && (
    user.role === 'MANAGER' ||
    (user.role === 'REPORTER' && issue.reporter?.id === user.id) ||
    isAssignedDev
  );

  const tabs = ['details', 'comments'];
  if (canUpdateStatus) tabs.push('update');
  if (canReview) tabs.push('review');
  if (canRate) tabs.push('rate');

  const tabLabels = {
    details: '📋 Details',
    comments: `💬 Comments${comments.length > 0 ? ` (${comments.length})` : ''}`,
    update: '🔄 Update Status',
    review: '🔍 Review',
    rate: `⭐ Rate${issue.developers?.length > 1 ? ` (${issue.developers.length})` : ''}`,
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxWidth: 680 }}>

        {/* Header */}
        <div className="modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="modal-title" style={{ fontSize: 17, wordBreak: 'break-word', lineHeight: 1.4 }}>{issue.title}</h2>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status?.replace(/_/g,' ')}</span>
              <span className={`badge ${getPriorityBadge(issue.priority)}`}>{issue.priority}</span>
              {issue.issueType && <span className="badge badge-gray">{issue.issueType}</span>}
              {readOnly && <span className="badge badge-gray">👁 Read-Only</span>}
              {canReview && <span className="badge badge-orange" style={{ animation: 'pulse 1.5s infinite' }}>⚡ Needs Review</span>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ flexShrink: 0, marginLeft: 12 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              color: activeTab === t ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s', fontFamily: 'var(--font-body)',
            }}>{tabLabels[t]}</button>
          ))}
        </div>

        {/* ── DETAILS ── */}
        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {issue.description && (
              <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Description</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14, whiteSpace: 'pre-wrap' }}>{issue.description}</p>
              </div>
            )}
            <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {[
                ['Project', issue.project?.name || '—'],
                ['Reporter', issue.reporter?.username || '—'],
                ['Assigned To', issue.developers?.length > 0 ? issue.developers.map(d => d.username).join(', ') : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>],
                ['Status', <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status?.replace(/_/g,' ')}</span>],
                ['Created', formatDateTime(issue.createdDate)],
                ['Due Date', issue.dueDate ? formatDate(issue.dueDate) : <span style={{ color: 'var(--text-muted)' }}>Not set</span>],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', minWidth: 110, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{val}</span>
                </div>
              ))}
              {issue.filePath && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Attachment</span>
                  <FileViewer fileName={issue.filePath} label="View Attached File" />
                </div>
              )}
              {issue.resolvedFilePath && (
                <div style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Resolution Proof</span>
                  <FileViewer fileName={issue.resolvedFilePath} label="View Resolution File" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMMENTS ── */}
        {activeTab === 'comments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ maxHeight: 320, overflowY: 'auto', background: 'var(--bg-base)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>💬</div>
                  <p style={{ fontSize: 14 }}>No comments yet. Be the first!</p>
                </div>
              ) : (
                <>
                  {comments.map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0, color: '#fff' }}>
                        {(c.createdBy || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{c.createdBy}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(c.createdDate)}</span>
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, wordBreak: 'break-word' }}>{c.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </>
              )}
            </div>
            {canComment ? (
              <div>
                {commentError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, marginBottom: 8 }}>❌ {commentError}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-control" placeholder="Write a comment… (Enter to send)" value={msg}
                    onChange={e => { setMsg(e.target.value); setCommentError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                    disabled={sendingComment} style={{ flex: 1 }} />
                  <button className="btn btn-primary" onClick={submitComment} disabled={sendingComment || !msg.trim()} style={{ flexShrink: 0 }}>
                    {sendingComment ? '⏳' : '➤ Send'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--primary-glow)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: '#93c5fd' }}>
                {readOnly ? '👁 Viewing in read-only mode.' : 'You cannot comment on this issue.'}
              </div>
            )}
          </div>
        )}

        {/* ── UPDATE STATUS (Developer) ── */}
        {activeTab === 'update' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--primary-glow)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13, color: '#93c5fd' }}>
              Current status: <strong>{issue.status?.replace(/_/g,' ')}</strong>
            </div>
            {statusError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13 }}>❌ {statusError}</div>}
            <div className="form-group">
              <label className="form-label">New Status *</label>
              <select className="form-control" value={newStatus} onChange={e => { setNewStatus(e.target.value); setStatusError(''); }}>
                <option value="">— Select new status —</option>
                {(issue.status === 'OPENED' || issue.status === 'REOPENED') && <option value="IN_PROGRESS">🔄 In Progress</option>}
                {issue.status === 'IN_PROGRESS' && <option value="RESOLVED">✅ Resolved — send for reporter review</option>}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Resolution Proof <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <div className="file-upload" onClick={() => statusFileRef.current?.click()} style={{ cursor: 'pointer', padding: 20 }}>
                <input ref={statusFileRef} type="file" style={{ display: 'none' }} onChange={e => setStatusFile(e.target.files[0])} />
                <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                <div style={{ fontSize: 14, color: statusFile ? 'var(--success)' : 'var(--text-secondary)', fontWeight: statusFile ? 600 : 400 }}>
                  {statusFile ? `✓ ${statusFile.name}` : 'Click to attach a screenshot or file'}
                </div>
                {statusFile && <button type="button" onClick={e => { e.stopPropagation(); setStatusFile(null); }} style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>✕ Remove</button>}
              </div>
            </div>
            <button className="btn btn-primary btn-lg w-full" onClick={handleStatusUpdate} disabled={updatingStatus || !newStatus}>
              {updatingStatus ? '⏳ Updating...' : '🔄 Update Status'}
            </button>
          </div>
        )}

        {/* ── REVIEW (Reporter, RESOLVED) ── */}
        {activeTab === 'review' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fbbf24', marginBottom: 6 }}>🔍 Developer marked this issue as Resolved</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Review the resolution proof, then decide if the issue is truly fixed.
              </p>
            </div>
            {issue.resolvedFilePath ? (
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Resolution Proof</div>
                <FileViewer fileName={issue.resolvedFilePath} label="View Resolution File" />
              </div>
            ) : (
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                ℹ No resolution file attached.
              </div>
            )}
            {approveError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13 }}>❌ {approveError}</div>}
            {/* NOT SOLVED */}
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', padding: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--danger)', marginBottom: 10 }}>❌ Not Solved — Send back for rework</div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Reason <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <textarea className="form-control" rows={3} placeholder="What still needs to be fixed…" value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} />
              </div>
              <button className="btn btn-danger w-full" onClick={() => handleApprove(false)} disabled={approving}>
                {approving ? '⏳ Processing...' : '❌ Mark as NOT Solved'}
              </button>
            </div>
            {/* SOLVED */}
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius)', padding: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)', marginBottom: 10 }}>✅ Solved — Close the issue</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                Closing the issue unlocks the <strong>⭐ Rate</strong> tab so you can rate all assigned developers.
              </p>
              <button className="btn btn-success w-full" onClick={() => handleApprove(true)} disabled={approving}>
                {approving ? '⏳ Processing...' : '✅ Confirm SOLVED — Close Issue'}
              </button>
            </div>
          </div>
        )}

        {/* ── RATE TAB — one section per developer ── */}
        {activeTab === 'rate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ratingSubmitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--success)', marginBottom: 8 }}>Ratings Submitted!</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Thank you. All developers have been notified.</div>
              </div>
            ) : (
              <>
                {/* Header info */}
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Rate {issue.developers?.length} developer{issue.developers?.length > 1 ? 's' : ''} on this issue
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {issue.developers?.length > 1
                      ? 'Rate each developer individually. You must rate at least one to submit.'
                      : 'Give a score and optional feedback for the developer.'}
                  </div>
                </div>

                {ratingError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13 }}>❌ {ratingError}</div>}

                {/* One StarPicker per developer */}
                {issue.developers?.map(dev => (
                  <StarPicker
                    key={dev.id}
                    devId={dev.id}
                    devName={dev.username}
                    ratings={devRatings}
                    onChange={handleDevRatingChange}
                  />
                ))}

                {/* Progress indicator */}
                {issue.developers?.length > 1 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
                    {Object.values(devRatings).filter(r => r?.score > 0).length} of {issue.developers.length} developer{issue.developers.length > 1 ? 's' : ''} rated
                  </div>
                )}

                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={handleSubmitAllRatings}
                  disabled={ratingSubmitting || Object.values(devRatings).filter(r => r?.score > 0).length === 0}>
                  {ratingSubmitting
                    ? '⏳ Submitting...'
                    : issue.developers?.length > 1
                      ? `⭐ Submit Ratings (${Object.values(devRatings).filter(r => r?.score > 0).length}/${issue.developers.length})`
                      : '⭐ Submit Rating & Feedback'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
