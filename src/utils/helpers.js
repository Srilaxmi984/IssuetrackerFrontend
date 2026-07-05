export const FILE_BASE =
  process.env.REACT_APP_API_URL.replace('/api', '') + '/uploads/';

export function getPriorityBadge(priority) {
  const map = { LOW: 'badge-green', MEDIUM: 'badge-orange', HIGH: 'badge-red', CRITICAL: 'badge-red' };
  return map[priority] || 'badge-gray';
}

export function getStatusBadge(status) {
  const map = {
    OPENED: 'badge-blue',
    IN_PROGRESS: 'badge-orange',
    RESOLVED: 'badge-purple',
    CLOSED: 'badge-green',
    REOPENED: 'badge-red',
  };
  return map[status] || 'badge-gray';
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getRoleBadge(role) {
  const map = { MANAGER: 'badge-purple', REPORTER: 'badge-cyan', DEVELOPER: 'badge-blue' };
  return map[role] || 'badge-gray';
}
