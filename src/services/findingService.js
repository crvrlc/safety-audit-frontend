import api from './api'

export const getAllFindings       = ()         => api.get('/findings')
export const getMyFindings       = ()         => api.get('/findings/my')
export const getFindingById      = (id)       => api.get(`/findings/${id}`)
export const getFindingsByAudit  = (auditId)  => api.get(`/audits/${auditId}/findings`)
export const assignFinding       = (id, data) => api.patch(`/findings/${id}/assign`, data)
export const resolveFinding      = (id, data) => api.patch(`/findings/${id}/resolve`, data)
export const resolveAllFindings  = (auditId, data) => api.patch(`/audits/${auditId}/resolve-all`, data)