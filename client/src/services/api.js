import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ─── API publique (sans auth) ───────────────────────────────────────────────
const pubApi = axios.create({ baseURL: BASE_URL });
export const publicApi = {
  getActualites: (limit) => pubApi.get('/public/actualites', { params: limit ? { limit } : {} }),
  getDocuments:  (limit) => pubApi.get('/public/documents',  { params: limit ? { limit } : {} }),
};

// ─── Student API ───────────────────────────────────────────────────────────
export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(config => {
  try {
    const stored = localStorage.getItem('fseg-student-auth');
    const token  = stored ? JSON.parse(stored)?.state?.token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fseg-student-auth');
      window.location.href = '/etudiants/connexion';
    }
    return Promise.reject(err);
  }
);

// ─── Admin API ─────────────────────────────────────────────────────────────
export const adminApi = axios.create({ baseURL: BASE_URL });

adminApi.interceptors.request.use(config => {
  try {
    const stored = localStorage.getItem('fseg-admin-auth');
    const token  = stored ? JSON.parse(stored)?.state?.token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

adminApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fseg-admin-auth');
      window.location.href = '/admin/connexion';
    }
    return Promise.reject(err);
  }
);


// ─── API helpers ──────────────────────────────────────────────────────────
export const studentApi = {
  login:             (data) => api.post('/auth/login', data),
  verifierEtudiant:  (data) => api.post('/auth/verifier-etudiant', data),
  register:          (data) => api.post('/auth/register', data),
  forgotPassword:    (data) => api.post('/auth/forgot-password', data),
  resetPassword:     (data) => api.post('/auth/reset-password', data),
  logout:         ()         => api.post('/auth/logout'),
  changePassword: (data)     => api.post('/auth/change-password', data),
  getProfil:      ()         => api.get('/profil'),
  updateTelephone: (data)    => api.put('/profil/telephone', data),
  updatePhoto:    (form)     => api.post('/profil/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getCours:       ()         => api.get('/cours'),
  getNotes:       (semestre) => api.get(`/notes?semestre=${semestre}`),
  getNoteDocuments: ()       => api.get('/notes/documents'),
  getEmplois:     ()         => api.get('/emplois'),
  getActualites:  (page = 1) => api.get(`/actualites?page=${page}`),
};

export const admApi = {
  login:           (data)       => adminApi.post('/admin/auth/login', data),
  logout:          ()           => adminApi.post('/admin/auth/logout'),
  getMe:           ()           => adminApi.get('/admin/auth/me'),
  getStats:        ()           => adminApi.get('/admin/stats'),
  getAdmins:       ()           => adminApi.get('/admin/admins'),
  createAdmin:     (data)       => adminApi.post('/admin/admins', data),
  deleteAdmin:     (id)         => adminApi.delete(`/admin/admins/${id}`),

  // Classes
  getClasses:      ()           => adminApi.get('/admin/classes'),
  createClasse:    (data)       => adminApi.post('/admin/classes', data),
  updateClasse:    (id, data)   => adminApi.put(`/admin/classes/${id}`, data),
  deleteClasse:    (id)         => adminApi.delete(`/admin/classes/${id}`),

  // Étudiants
  getEtudiants:    (params)     => adminApi.get('/admin/etudiants', { params }),
  getEtudiant:     (id)         => adminApi.get(`/admin/etudiants/${id}`),
  getComptes:      ()           => adminApi.get('/admin/etudiants/comptes'),
  createEtudiant:  (data)       => adminApi.post('/admin/etudiants', data),
  updateEtudiant:  (id, data)   => adminApi.put(`/admin/etudiants/${id}`, data),
  deleteEtudiant:  (id)         => adminApi.delete(`/admin/etudiants/${id}`),
  toggleCompte:    (id, action) => adminApi.post(`/admin/etudiants/${id}/toggle`, { action }),
  importEtudiants: (form)       => adminApi.post('/admin/etudiants/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000
  }),
  exportEtudiants: (params)     => adminApi.get('/admin/etudiants/export', { params, responseType: 'blob' }),
  getImports:      ()           => adminApi.get('/admin/etudiants/imports'),
  getImportStudents: (id, params) => adminApi.get(`/admin/etudiants/imports/${id}`, { params }),
  deleteImports:   (ids)        => adminApi.delete('/admin/etudiants/imports', { data: { ids } }),

  // Cours
  getCours:        (params)     => adminApi.get('/admin/cours', { params }),
  createCours:     (form)       => adminApi.post('/admin/cours', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCours:     (id, data)   => adminApi.put(`/admin/cours/${id}`, data),
  deleteCours:     (id)         => adminApi.delete(`/admin/cours/${id}`),
  addFilesCours:   (id, form)   => adminApi.post(`/admin/cours/${id}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteFileCours: (fileId)     => adminApi.delete(`/admin/cours/files/${fileId}`),

  // Notes (documents)
  getNotes:        (params)     => adminApi.get('/admin/notes', { params }),
  createNote:      (form)       => adminApi.post('/admin/notes', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateNote:      (id, data)   => adminApi.put(`/admin/notes/${id}`, data),
  deleteNote:      (id)         => adminApi.delete(`/admin/notes/${id}`),
  addFilesNote:    (id, form)   => adminApi.post(`/admin/notes/${id}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteFileNote:  (fileId)     => adminApi.delete(`/admin/notes/files/${fileId}`),
  previewNotesImport: (form)    => adminApi.post('/admin/notes/import/preview', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }),
  importNotes:     (form)       => adminApi.post('/admin/notes/import', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),

  // Emplois
  getEmplois:      (params)     => adminApi.get('/admin/emplois', { params }),
  createEmploi:    (form)       => adminApi.post('/admin/emplois', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateEmploi:    (id, data)   => adminApi.put(`/admin/emplois/${id}`, data),
  deleteEmploi:    (id)         => adminApi.delete(`/admin/emplois/${id}`),
  addFilesEmploi:  (id, form)   => adminApi.post(`/admin/emplois/${id}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteFileEmploi:(fileId)     => adminApi.delete(`/admin/emplois/files/${fileId}`),

  // Actualités
  getActualites:   ()           => adminApi.get('/admin/actualites'),
  createActualite: (form)       => adminApi.post('/admin/actualites', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateActualite: (id, data)   => adminApi.put(`/admin/actualites/${id}`, data),
  deleteActualite: (id)         => adminApi.delete(`/admin/actualites/${id}`),

  // Documents officiels
  getDocuments:     ()           => adminApi.get('/admin/documents'),
  createDocument:   (form)       => adminApi.post('/admin/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateDocument:   (id, data)   => adminApi.put(`/admin/documents/${id}`, data),
  deleteDocument:   (id)         => adminApi.delete(`/admin/documents/${id}`),
  addFilesDocument:(id, form)    => adminApi.post(`/admin/documents/${id}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateFileDocument: (fileId, form) => adminApi.put(`/admin/documents/files/${fileId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteFileDocument: (fileId)   => adminApi.delete(`/admin/documents/files/${fileId}`),
};
