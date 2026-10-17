import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/token/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/admin/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// ===== Catalog API =====
export const catalogAPI = {
  getParfums: (params) => api.get('/catalog/parfums/', { params }),
  getParfum: (id) => api.get(`/catalog/parfums/${id}/`),
  getFeatured: () => api.get('/catalog/parfums/featured/'),
  getNouveautes: () => api.get('/catalog/parfums/nouveautes/'),
  getMarques: () => api.get('/catalog/marques/'),
  getCollections: () => api.get('/catalog/collections/'),
}

// ===== Contact API =====
export const contactAPI = {
  sendMessage: (data) => api.post('/orders/contact/', data),
}

// ===== Orders API =====
export const ordersAPI = {
  createCommande: (data) => api.post('/orders/commandes/', data),
}

// ===== Admin API =====
export const adminAPI = {
  login: (credentials) => axios.post('/api/token/', credentials),
  getStats: () => api.get('/catalog/stats/'),
  // Parfums CRUD
  getParfums: (params) => api.get('/catalog/parfums/', { params: { include_inactive: 'true', ...params } }),
  createParfum: (data) => api.post('/catalog/parfums/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateParfum: (id, data) => api.patch(`/catalog/parfums/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteParfum: (id) => api.delete(`/catalog/parfums/${id}/`),
  createPack: (data) => api.post('/catalog/parfums/create_pack/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updatePack: (id, data) => api.post(`/catalog/parfums/${id}/update_pack/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadImage: (id, formData) => api.post(`/catalog/parfums/${id}/upload_image/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Formats
  getFormats: (params) => api.get('/catalog/formats/', { params }),
  createFormat: (data) => api.post('/catalog/formats/', data),
  updateFormat: (id, data) => api.patch(`/catalog/formats/${id}/`, data),
  deleteFormat: (id) => api.delete(`/catalog/formats/${id}/`),
  bulkUpdateStock: (updates) => api.post('/catalog/formats/bulk_update_stock/', updates),
  // Marques
  getMarques: () => api.get('/catalog/marques/'),
  createMarque: (data) => api.post('/catalog/marques/', data),
  // Collections
  getCollections: (params) => api.get('/catalog/collections/', { params }),
  createCollection: (data) => api.post('/catalog/collections/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateCollection: (id, data) => api.patch(`/catalog/collections/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteCollection: (id) => api.delete(`/catalog/collections/${id}/`),
  assignParfumsToCollection: (id, parfum_ids) => api.post(`/catalog/collections/${id}/assign_parfums/`, { parfum_ids }),
  // Commandes
  getCommandes: (params) => api.get('/orders/commandes/', { params }),
  getCommande: (id) => api.get(`/orders/commandes/${id}/`),
  updateCommande: (id, data) => api.patch(`/orders/commandes/${id}/`, data),
  deleteCommande: (id) => api.delete(`/orders/commandes/${id}/`),
  // Contact messages
  getMessages: (params) => api.get('/orders/contact/', { params }),
  updateMessage: (id, data) => api.patch(`/orders/contact/${id}/`, data),
}

export default api
