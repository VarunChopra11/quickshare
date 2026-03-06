import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
})

/**
 * Share plain text. Returns { code, expires_in, type }
 */
export async function uploadText(text) {
  try {
    const res = await api.post('/api/share/text', { text, type: 'text' })
    return res.data
  } catch (err) {
    const detail = err.response?.data?.detail || err.message || 'Unknown error'
    throw new Error(detail)
  }
}

/**
 * Upload a file with progress callback. Returns { code, expires_in, type }
 */
export async function uploadFile(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await api.post('/api/share/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    })
    return res.data
  } catch (err) {
    const detail = err.response?.data?.detail || err.message || 'Upload failed'
    throw new Error(detail)
  }
}

/**
 * Retrieve share metadata by code. Returns RetrieveResponse.
 */
export async function retrieve(code) {
  try {
    const res = await api.get(`/api/receive/${code}`)
    return res.data
  } catch (err) {
    const status = err.response?.status
    if (status === 404) {
      const detail = err.response?.data?.detail || 'Code not found or expired'
      throw new Error(detail)
    }
    if (status === 422) {
      throw new Error('Code must be exactly 6 digits')
    }
    if (status === 429) {
      throw new Error('Too many requests — please wait a moment')
    }
    const detail = err.response?.data?.detail || err.message || 'Unknown error'
    throw new Error(detail)
  }
}

/**
 * Returns the full download URL for a file share.
 */
export function getDownloadUrl(code) {
  return `${API_BASE}/api/receive/${code}/download`
}
