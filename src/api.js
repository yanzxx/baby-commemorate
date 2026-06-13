/**
 * API 配置
 */
const API_BASE = 'http://localhost:8080/api'

async function request(path, options = {}) {
  const url = API_BASE + path
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }
  const res = await fetch(url, config)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export default {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: data }),
  put: (path, data) => request(path, { method: 'PUT', body: data }),
  del: (path) => request(path, { method: 'DELETE' }),
}
