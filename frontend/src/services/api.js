import axios from 'axios';
import { emitToast } from '../utils/toastBus';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  const info = localStorage.getItem('userInfo');
  if (info) req.headers.Authorization = `Bearer ${JSON.parse(info).token}`;
  return req;
});

// Any failed request (wrong email/password, duplicate email, missing field,
// validation error, server down, etc.) automatically pops a toast saying
// exactly what went wrong — no need to handle it page by page.
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong. Please try again.';
    emitToast(message, 'error');
    return Promise.reject(err);
  }
);

// Auth — Registration (OTP required)
export const sendRegisterOtp   = (d) => API.post('/auth/register/send-otp',   d);
export const verifyRegisterOtp = (d) => API.post('/auth/register/verify-otp', d);
export const resendOtp         = (d) => API.post('/auth/resend-otp',          d);

// Auth — Login (simple, no OTP)
export const loginUser = (d) => API.post('/auth/login', d);
export const getMe     = ()  => API.get('/auth/me');

// Auth — Forgot Password (OTP-based)
export const sendForgotPasswordOtp   = (d) => API.post('/auth/forgot-password/send-otp',   d);
export const verifyForgotPasswordOtp = (d) => API.post('/auth/forgot-password/verify-otp', d);
export const resetPassword           = (d) => API.post('/auth/forgot-password/reset',      d);
export const resendForgotPasswordOtp = (d) => API.post('/auth/forgot-password/resend-otp',  d);

// Legacy alias
export const registerUser = (d) => API.post('/auth/register/send-otp', d);

// Elections
export const getElections    = ()  => API.get('/elections');
export const getElectionById = (id)=> API.get(`/elections/${id}`);
export const castVote        = (id,d)=> API.post(`/elections/${id}/vote`, d);
export const getMyVotes      = (id)=> API.get(`/elections/${id}/my-votes`);
export const getResults      = (id)=> API.get(`/elections/${id}/results`);

// Student
export const getMyComplaints   = ()  => API.get('/student/complaints');
export const getAllComplaints  = ()  => API.get('/student/complaints/all');
export const submitComplaint   = (d) => API.post('/student/complaints', d, {
  headers: d instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const getLostFound      = ()  => API.get('/student/lost-found');
export const updateLostFound   = (id,d) => API.put(`/student/lost-found/${id}`, d, { headers: { 'Content-Type': d instanceof FormData ? 'multipart/form-data' : 'application/json' } });
export const deleteLostFound   = (id) => API.delete(`/student/lost-found/${id}`);
export const submitLostFound   = (d) => API.post('/student/lost-found', d, {
  headers: d instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const getAnnouncements  = ()  => API.get('/student/announcements');

// Admin
export const adminStats            = ()     => API.get('/admin/stats');
export const adminGetUsers         = ()     => API.get('/admin/users');
export const adminUpdateRole       = (id,d) => API.put(`/admin/users/${id}/role`, d);
export const adminBlockUser        = (id,d) => API.put(`/admin/users/${id}/block`, d);
export const adminUnblockUser      = (id)   => API.put(`/admin/users/${id}/unblock`);
export const adminDeleteUser       = (id)   => API.delete(`/admin/users/${id}`);
export const adminCreateElection   = (d)    => API.post('/admin/elections', d);
export const adminUpdateElection   = (id,d) => API.put(`/admin/elections/${id}`, d);
export const adminDeleteElection   = (id)   => API.delete(`/admin/elections/${id}`);
export const adminAddCandidate     = (id,d) => API.post(`/admin/elections/${id}/candidates`, d, {
  headers: d instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const adminUpdateCandidate  = (eId,cId,d) => API.put(`/admin/elections/${eId}/candidates/${cId}`, d, {
  headers: d instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const adminRemoveCandidate  = (eId,cId) => API.delete(`/admin/elections/${eId}/candidates/${cId}`);
export const adminGetAnnouncements = ()     => API.get('/admin/announcements');
export const adminCreateAnn        = (d)    => API.post('/admin/announcements', d, {
  headers: d instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const adminUpdateAnn        = (id,d) => API.put(`/admin/announcements/${id}`, d, {
  headers: d instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const adminDeleteAnn        = (id)   => API.delete(`/admin/announcements/${id}`);
export const adminGetComplaints    = ()     => API.get('/admin/complaints');
export const adminUpdateComplaint  = (id,d) => API.put(`/admin/complaints/${id}/status`, d);
export const adminReplyComplaint   = (id,d) => API.post(`/admin/complaints/${id}/reply`, d);
export const adminGetLostFound     = ()     => API.get('/admin/lost-found');
export const adminUpdateLostFound  = (id,d) => API.put(`/admin/lost-found/${id}/status`, d);
export const adminGetActivity      = (p,c) => API.get(`/admin/activity?page=${p||1}&limit=30${c?'&category='+c:''}`);
export const adminDeleteLostFound  = (id)   => API.delete(`/admin/lost-found/${id}`);

// Registration Config (super_admin only)
export const getRegConfigs      = ()      => API.get('/reg-config/configs');
export const upsertRegConfig    = (d)     => API.post('/reg-config/configs', d);
export const deleteRegConfig    = (id)    => API.delete(`/reg-config/configs/${id}`);
export const getAdminLimits     = ()      => API.get('/reg-config/admin-limits');
export const updateAdminLimits  = (d)     => API.put('/reg-config/admin-limits', d);

export default API;

// Profile
export const updateProfile    = (d) => API.put('/auth/profile', d, {
  headers: d instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const changePassword   = (d) => API.put('/auth/change-password', d);

// AI Chat (FOT Buddy)
export const sendChatMessage = (message) => API.post('/ai-chat/message', { message });