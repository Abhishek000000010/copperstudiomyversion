import { apiGet, apiPost, apiPut, apiDelete } from "./api.js";

export const clientApi = {
  getProfile: (token) => apiGet("/api/client/profile", token),
  updateProfile: (body, token) => apiPut("/api/client/profile", body, token),
  changePassword: (body, token) => apiPut("/api/client/change-password", body, token),
  getOrders: (token) => apiGet("/api/client/orders", token),
  getProjects: (token) => apiGet("/api/client/projects", token),
  getDocuments: (token) => apiGet("/api/client/documents", token),
  getMeetings: (token) => apiGet("/api/client/meetings", token),
  requestMeeting: (body, token) => apiPost("/api/client/meetings", body, token),
};

export const adminApi = {
  getClients: (token) => apiGet("/api/admin/clients", token),
  getClientDetail: (id, token) => apiGet(`/api/admin/clients/${id}`, token),
  getProjects: (token) => apiGet("/api/admin/projects", token),
  createProject: (body, token) => apiPost("/api/admin/projects", body, token),
  updateProject: (id, body, token) => apiPut(`/api/admin/projects/${id}`, body, token),
  deleteProject: (id, token) => apiDelete(`/api/admin/projects/${id}`, token),
  getDocuments: (token) => apiGet("/api/admin/documents", token),
  createDocument: (body, token) => apiPost("/api/admin/documents", body, token),
  updateDocument: (id, body, token) => apiPut(`/api/admin/documents/${id}`, body, token),
  deleteDocument: (id, token) => apiDelete(`/api/admin/documents/${id}`, token),
  getMeetings: (token) => apiGet("/api/admin/meetings", token),
  updateMeeting: (id, body, token) => apiPut(`/api/admin/meetings/${id}`, body, token),
  createMeeting: (body, token) => apiPost("/api/admin/meetings", body, token),
  deleteMeeting: (id, token) => apiDelete(`/api/admin/meetings/${id}`, token),
};
