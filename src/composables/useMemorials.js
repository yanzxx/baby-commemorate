import { ref, computed } from 'vue'

const memorials = ref([])

function load() {
  try { memorials.value = JSON.parse(localStorage.getItem('baby_memorials') || '[]') }
  catch { memorials.value = [] }
}

function save() {
  localStorage.setItem('baby_memorials', JSON.stringify(memorials.value))
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
