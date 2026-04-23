import api from './api'

export const getMyAudits = () => api.get('/audits/my')
export const getAuditById = (id) => api.get(`/audits/${id}`)
export const createAudit = (data) => api.post('/audits', data)
export const startAudit = (id) => api.patch(`/audits/${id}/start`)
export const submitAudit = (id) => api.patch(`/audits/${id}/submit`)
export const updateAudit = (id, data) => api.put(`/audits/${id}`, data)
export const deleteAudit = (id) => api.delete(`/audits/${id}`)
export const getAuditProgress = (id) => api.get(`/audits/${id}/responses/progress`)
export const saveResponsesBulk = (id, data) => api.post(`/audits/${id}/responses/bulk`, data).then(res => res.data)
export const getResponsesByAudit = (id) => api.get(`/audits/${id}/responses`)
export const signOffAudit = (id, data) => api.patch(`/audits/${id}/signoff`, data)
export const getAudits = () => api.get('/audits')