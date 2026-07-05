import axios from 'axios';

const API = axios.create({ baseURL: 'https://issuetrackerbackend-x7ey.onrender.com/api' });

// AUTH
export const login = (data) => API.post('/login', data);

// USERS
export const getUsers = () => API.get('/users');
export const getManagers = () => API.get('/users/managers');
export const getDevelopers = () => API.get('/users/developers');
export const getReporters = () => API.get('/users/reporters');
export const getUsersByRole = (role) => API.get(`/users/role/${role}`);
export const createUser = (data) => API.post('/users', data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// PROJECTS
export const getProjects = () => API.get('/projects');
export const getProjectsByManager = (id) => API.get(`/projects/manager/${id}`);
export const createProject = (data) => API.post('/projects', data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);

// ISSUES
export const getIssues = () => API.get('/issues');
export const getIssuesByReporter = (id) => API.get(`/issues/reporter/${id}`);
export const getIssuesByDeveloper = (id) => API.get(`/issues/developer/${id}`);
export const getIssuesByProject = (id) => API.get(`/issues/project/${id}`);
export const getIssueStats = () => API.get('/issues/stats');
export const searchIssues = (keyword, reporterId, developerId) => {
  const params = {};
  if (keyword) params.keyword = keyword;
  if (reporterId) params.reporterId = reporterId;
  if (developerId) params.developerId = developerId;
  return API.get('/issues/search', { params });
};
export const createIssue = (formData) =>
  API.post('/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const assignIssue = (id, data) => API.put(`/issues/${id}/assign`, data);
export const updateIssueStatus = (id, status, file, developerId) => {
  const formData = new FormData();
  if (file) formData.append('file', file);
  const params = new URLSearchParams({ status });
  if (developerId) params.append('developerId', developerId);
  return API.put(`/issues/${id}/status?${params}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const approveIssue = (id, approved, reporterId, rejectionNote) => {
  const params = new URLSearchParams({ approved, reporterId });
  if (rejectionNote) params.append('rejectionNote', rejectionNote);
  return API.put(`/issues/${id}/approve?${params}`);
};

// COMMENTS
export const getComments = (issueId) => API.get(`/issues/${issueId}/comments`);
export const addComment = (issueId, data) => API.post(`/issues/${issueId}/comments`, data);

// RATINGS
export const addRating = (issueId, data) => API.post(`/issues/${issueId}/rating`, data);
export const getDeveloperRatings = (devId) => API.get(`/ratings/developer/${devId}`);
export const getDeveloperAvgScore = (devId) => API.get(`/ratings/developer/${devId}/average`);

// NOTIFICATIONS
export const getNotifications = (userId) => API.get(`/notifications/user/${userId}`);
export const getUnreadCount = (userId) => API.get(`/notifications/user/${userId}/unread-count`);
export const markAllRead = (userId) => API.put(`/notifications/user/${userId}/mark-all-read`);
export const markRead = (id) => API.put(`/notifications/${id}/read`);

// REASSIGN REQUESTS
export const createReassignRequest = (data) => API.post('/reassign', data);
export const getReassignByDeveloper = (devId) => API.get(`/reassign/developer/${devId}`);
export const getPendingReassignForManager = (managerId) => API.get(`/reassign/manager/${managerId}/pending`);
export const handleReassignRequest = (id, approved) => API.put(`/reassign/${id}/handle?approved=${approved}`);

export default API;

// Updated reassign endpoints
export const getReassignAllForManager = (managerId) => API.get(`/reassign/manager/${managerId}/all`);
export const doReassignIssue = (requestId, developerIds, dueDate) =>
  API.put(`/reassign/${requestId}/reassign`, { developerIds, dueDate });
