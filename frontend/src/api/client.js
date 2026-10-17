import axios from 'axios'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const api = axios.create({
  baseURL: `${API_BASE}/api`,
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
          const { data } = await axios.post(`${API_BASE}/api/token/refresh/`, { refresh })
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

// ===== In-Memory SWR Cache for Instant Page Transitions =====
const apiCache = new Map()

export function clearApiCache() {
  apiCache.clear()
}

async function cachedGet(url, config = {}, ttlMs = 180000) {
  const cacheKey = `${url}:${JSON.stringify(config.params || {})}`
  const cached = apiCache.get(cacheKey)
  const now = Date.now()

  // Si on a des données en cache encore valides, les renvoyer immédiatement (0 ms)
  if (cached && (now - cached.timestamp < ttlMs)) {
    // Si les données ont plus de 30 secondes, rafraîchir discrètement en arrière-plan
    if (now - cached.timestamp > 30000) {
      api.get(url, config).then((res) => {
        apiCache.set(cacheKey, { data: res, timestamp: Date.now() })
      }).catch(() => {})
    }
    return cached.data
  }

  // Requête réseau initiale
  const res = await api.get(url, config)
  apiCache.set(cacheKey, { data: res, timestamp: Date.now() })
  return res
}

// ===== Catalog API (Ultra-rapide avec cache) =====
export const catalogAPI = {
  getParfums: (params) => cachedGet('/catalog/parfums/', { params }),
  getParfum: (id) => cachedGet(`/catalog/parfums/${id}/`),
  getFeatured: () => cachedGet('/catalog/parfums/featured/'),
  getNouveautes: () => cachedGet('/catalog/parfums/nouveautes/'),
  getMarques: () => cachedGet('/catalog/marques/'),
  getCollections: () => cachedGet('/catalog/collections/'),
}

// ===== Contact API =====
export const contactAPI = {
  sendMessage: (data) => api.post('/orders/contact/', data),
}

// ===== Orders API =====
export const ordersAPI = {
  createCommande: async (data) => {
    const res = await api.post('/orders/commandes/', data)
    clearApiCache()
    return res
  },
}

// ===== Admin API =====
export const adminAPI = {
  login: (credentials) => axios.post(`${API_BASE}/api/token/`, credentials),
  getStats: () => cachedGet('/catalog/stats/', {}, 60000),
  // Parfums CRUD
  getParfums: (params) => cachedGet('/catalog/parfums/', { params: { include_inactive: 'true', ...params } }, 60000),
  createParfum: async (data) => {
    const res = await api.post('/catalog/parfums/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    clearApiCache()
    return res
  },
  updateParfum: async (id, data) => {
    const res = await api.patch(`/catalog/parfums/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    clearApiCache()
    return res
  },
  deleteParfum: async (id) => {
    const res = await api.delete(`/catalog/parfums/${id}/`)
    clearApiCache()
    return res
  },
  createPack: async (data) => {
    const res = await api.post('/catalog/parfums/create_pack/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    clearApiCache()
    return res
  },
  updatePack: async (id, data) => {
    const res = await api.post(`/catalog/parfums/${id}/update_pack/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    clearApiCache()
    return res
  },
  uploadImage: async (id, formData) => {
    const res = await api.post(`/catalog/parfums/${id}/upload_image/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    clearApiCache()
    return res
  },
  // Formats
  getFormats: (params) => cachedGet('/catalog/formats/', { params }, 60000),
  createFormat: async (data) => {
    const res = await api.post('/catalog/formats/', data)
    clearApiCache()
    return res
  },
  updateFormat: async (id, data) => {
    const res = await api.patch(`/catalog/formats/${id}/`, data)
    clearApiCache()
    return res
  },
  deleteFormat: async (id) => {
    const res = await api.delete(`/catalog/formats/${id}/`)
    clearApiCache()
    return res
  },
  bulkUpdateStock: async (updates) => {
    const res = await api.post('/catalog/formats/bulk_update_stock/', updates)
    clearApiCache()
    return res
  },
  // Marques
  getMarques: () => cachedGet('/catalog/marques/'),
  createMarque: async (data) => {
    const res = await api.post('/catalog/marques/', data)
    clearApiCache()
    return res
  },
  getCollections: (params) => api.get('/catalog/collections/', { params: { include_inactive: true, ...params } }),
  createCollection: async (data) => {
    const isFormData = data instanceof FormData
    const res = await api.post('/catalog/collections/', data, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined)
    clearApiCache()
    return res
  },
  updateCollection: async (id, data) => {
    const isFormData = data instanceof FormData
    const res = await api.patch(`/catalog/collections/${id}/`, data, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined)
    clearApiCache()
    return res
  },
  deleteCollection: async (id) => {
    const res = await api.delete(`/catalog/collections/${id}/`)
    clearApiCache()
    return res
  },
  assignParfumsToCollection: async (id, parfum_ids) => {
    const res = await api.post(`/catalog/collections/${id}/assign_parfums/`, { parfum_ids })
    clearApiCache()
    return res
  },
  // Commandes
  getCommandes: (params) => api.get('/orders/commandes/', { params }),
  getCommande: (id) => api.get(`/orders/commandes/${id}/`),
  updateCommande: async (id, data) => {
    const res = await api.patch(`/orders/commandes/${id}/`, data)
    clearApiCache()
    return res
  },
  deleteCommande: async (id) => {
    const res = await api.delete(`/orders/commandes/${id}/`)
    clearApiCache()
    return res
  },
  // Contact messages
  getMessages: (params) => api.get('/orders/contact/', { params }),
  updateMessage: (id, data) => api.patch(`/orders/contact/${id}/`, data),
}

export default api
