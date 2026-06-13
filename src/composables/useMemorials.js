import { ref, computed } from 'vue'
import api from '../api.js'

const memorials = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    memorials.value = await api.get('/memorials')
  } catch {
    // fallback to localStorage
    try {
      memorials.value = JSON.parse(localStorage.getItem('baby_memorials') || '[]')
    } catch {
      memorials.value = []
    }
  }
  loading.value = false
}

async function addMemorial(m) {
  try {
    // 清理前端临时字段
    const data = { ...m }
    delete data.id
    delete data.audioName
    delete data.videoName

    const saved = await api.post('/memorials', data)
    memorials.value.unshift(saved)
    return saved
  } catch (e) {
    console.warn('后端保存失败，使用本地存储:', e.message)
    memorials.value.unshift(m)
    saveToLocal()
    return m
  }
}

async function updateMemorial(id, updates) {
  // 清理前端临时字段
  const data = { ...updates }
  delete data.audioName
  delete data.videoName

  try {
    const saved = await api.put('/memorials/' + id, data)
    const idx = memorials.value.findIndex(m => m.id === id)
    if (idx >= 0) Object.assign(memorials.value[idx], saved)
    return saved
  } catch (e) {
    console.warn('后端更新失败，使用本地存储:', e.message)
    const idx = memorials.value.findIndex(m => m.id === id)
    if (idx >= 0) {
      Object.assign(memorials.value[idx], data)
      saveToLocal()
    }
    return memorials.value[idx]
  }
}

async function getMemorial(id) {
  try {
    return await api.get('/memorials/' + id)
  } catch {
    return memorials.value.find(m => m.id === id)
  }
}

async function lightCandle(id) {
  try {
    const saved = await api.post('/memorials/' + id + '/candle')
    const idx = memorials.value.findIndex(m => m.id === id)
    if (idx >= 0) memorials.value[idx].candles = saved.candles
  } catch (e) {
    console.warn('点蜡烛失败:', e.message)
    const m = memorials.value.find(m => m.id === id)
    if (m) m.candles = (m.candles || 0) + 1
  }
}

async function offerFlower(id) {
  try {
    const saved = await api.post('/memorials/' + id + '/flower')
    const idx = memorials.value.findIndex(m => m.id === id)
    if (idx >= 0) memorials.value[idx].flowers = saved.flowers
  } catch (e) {
    console.warn('献花失败:', e.message)
    const m = memorials.value.find(m => m.id === id)
    if (m) m.flowers = (m.flowers || 0) + 1
  }
}

async function addMessage(id, text) {
  try {
    const saved = await api.post('/memorials/' + id + '/message', { text })
    const idx = memorials.value.findIndex(m => m.id === id)
    if (idx >= 0) memorials.value[idx].messagesJson = saved.messagesJson
  } catch (e) {
    console.warn('留言失败:', e.message)
    // 本地fallback
    const m = memorials.value.find(m => m.id === id)
    if (m) {
      if (!m.messages) m.messages = []
      m.messages.push({ text, time: new Date().toISOString() })
      saveToLocal()
    }
  }
}

function saveToLocal() {
  try {
    localStorage.setItem('baby_memorials', JSON.stringify(memorials.value))
  } catch {}
}

function sanitizeForLocal(m) {
  const c = { ...m }
  if (c.audio && c.audio.startsWith('data:')) delete c.audio
  if (c.video && c.video.startsWith('data:')) delete c.video
  return c
}

const publicMemorials = computed(() =>
  memorials.value.filter(m => m.privacy === 'public')
)

load()

export function useMemorials() {
  return { memorials, publicMemorials, loading, addMemorial, updateMemorial, getMemorial, lightCandle, offerFlower, addMessage, load }
}
