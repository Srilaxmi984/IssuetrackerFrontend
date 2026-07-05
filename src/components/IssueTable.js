import React, { useState } from 'react';
import IssueModal from './IssueModal';
import { getPriorityBadge, getStatusBadge, formatDate } from '../utils/helpers';

export default function IssueTable({ issues, onRefresh, showProject = true }) {
  const [selected, setSelected] = useState(null);

  if (!issues || issues.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🐛</div>
        <p>No issues found</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              {showProject && <th>Project</th>}
              <th>Priority</th>
              <th>Status</th>
              <th>Reporter</th>
              <th>Due Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => (
              <tr key={issue.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>#{issue.id}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{issue.title}</div>
                  {issue.issueType && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{issue.issueType}</div>}
                </td>
                {showProject && <td>{issue.project?.name || '—'}</td>}
                <td><span className={`badge ${getPriorityBadge(issue.priority)}`}>{issue.priority}</span></td>
                <td><span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status?.replace('_', ' ')}</span></td>
                <td>{issue.reporter?.username || '—'}</td>
                <td style={{ fontSize: 13 }}>{formatDate(issue.dueDate)}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => setSelected(issue)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <IssueModal issue={selected} onClose={() => setSelected(null)} onRefresh={() => { onRefresh && onRefresh(); setSelected(null); }} />
      )}
    </>
  );
}
