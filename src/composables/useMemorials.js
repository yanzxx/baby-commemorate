import { ref, computed } from 'vue'

const memorials = ref([])

function load() {
  try {
    const raw = localStorage.getItem('baby_memorials')
    if (!raw) { memorials.value = []; return }
    if (raw.length > 3000000) {
      // 数据太大，清理后重新保存
      const data = JSON.parse(raw)
      const clean = data.map(sanitize)
      localStorage.setItem('baby_memorials', JSON.stringify(clean))
      memorials.value = clean
    } else {
      memorials.value = JSON.parse(raw)
    }
  } catch {
    memorials.value = []
  }
}

function sanitize(m) {
  const c = { ...m }
  if (c.audio && c.audio.startsWith('data:')) delete c.audio
  if (c.video && c.video.startsWith('data:')) delete c.video
  if (c.audioName) delete c.audioName
  if (c.videoName) delete c.videoName
  return c
}

function save() {
  const clean = memorials.value.map(sanitize)
  try {
    localStorage.setItem('baby_memorials', JSON.stringify(clean))
  } catch {
    // 终极方案：只保留文字数据，清理所有媒体
    const minimal = clean.map(m => {
      delete m.photo; delete m.audio; delete m.video
      return m
    })
    localStorage.setItem('baby_memorials', JSON.stringify(minimal))
  }
  memorials.value = clean
}

function addMemorial(m) {
  memorials.value.unshift(m)
  save()
}

function updateMemorial(id, updates) {
  const idx = memorials.value.findIndex(m => m.id === id)
  if (idx >= 0) {
    Object.assign(memorials.value[idx], updates)
    save()
  }
}

function getMemorial(id) {
  return memorials.value.find(m => m.id === id)
}

const publicMemorials = computed(() => memorials.value.filter(m => m.privacy === 'public'))

load()

export function useMemorials() {
  return { memorials, publicMemorials, addMemorial, updateMemorial, getMemorial, save, load }
}
