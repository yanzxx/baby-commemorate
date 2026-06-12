<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMemorials } from '../composables/useMemorials.js'

const route = useRoute()
const router = useRouter()
const { getMemorial, updateMemorial } = useMemorials()
const newMessage = ref('')

const m = computed(() => getMemorial(route.params.id))
const daysSinceLeave = computed(() => {
  if (!m.value?.leaveYear || !m.value?.leaveMonth || !m.value?.leaveDay) return null
  const leave = new Date(m.value.leaveYear, m.value.leaveMonth - 1, m.value.leaveDay)
  return Math.max(0, Math.floor((Date.now() - leave.getTime()) / 86400000))
})

function formatDateRange() {
  if (!m.value) return ''
  const b = m.value.birthYear ? `${m.value.birthYear}年${m.value.birthMonth}月${m.value.birthDay}日` : ''
  const l = m.value.leaveYear ? `${m.value.leaveYear}年${m.value.leaveMonth}月${m.value.leaveDay}日` : ''
  return b && l ? `${b} — ${l}` : b ? `出生于 ${b}` : l ? `离开于 ${l}` : ''
}

function formatTime(t) {
  const d = Date.now() - new Date(t).getTime()
  return d < 60000 ? '刚刚' : d < 3600000 ? `${Math.floor(d/60000)}分钟前` : d < 86400000 ? `${Math.floor(d/3600000)}小时前` : new Date(t).toLocaleDateString('zh-CN')
}

function lightCandle() { if (m.value) updateMemorial(m.value.id, { candles: (m.value.candles || 0) + 1 }) }
function offerFlower() { if (m.value) updateMemorial(m.value.id, { flowers: (m.value.flowers || 0) + 1 }) }
function addMessage() {
  if (!m.value || !newMessage.value.trim()) return
  const msgs = [...(m.value.messages || []), { text: newMessage.value.trim(), time: new Date().toISOString() }]
  updateMemorial(m.value.id, { messages: msgs })
  newMessage.value = ''
}
</script>

<template>
  <div class="page">
    <div class="inner" v-if="m">
      <button class="back" @click="router.push('/')">← 回到星空</button>

      <div class="card tc">
        <div class="photo-area">
          <img v-if="m.photo" :src="m.photo" class="avatar" />
          <div v-else class="avatar-ph">{{ m.gender==='boy'?'👦':m.gender==='girl'?'👧':'👼' }}</div>
        </div>
        <h2 class="name">{{ m.name }}</h2>
        <p class="dates">{{ formatDateRange() }}</p>
        <p v-if="daysSinceLeave" class="days">已经离开 {{ daysSinceLeave }} 天</p>
        <div v-if="m.story" class="story"><p class="story-label">📖 在人间的故事</p><p class="story-text">{{ m.story }}</p></div>
        <p v-if="m.message" class="msg">{{ m.message }}</p>
      </div>

      <div class="card">
        <div class="interact-row">
          <button class="ibtn" @click="lightCandle">
            <svg width="24" height="40" viewBox="0 0 48 80"><rect x="16" y="20" width="16" height="50" rx="3" fill="#f8f4e8" stroke="#e8dcc8" stroke-width="1"/><line x1="24" y1="12" x2="24" y2="22" stroke="#666" stroke-width="2"/><ellipse cx="24" cy="10" rx="6" ry="10" fill="#ffcc00" opacity="0.9"/></svg>
            <span class="ic">{{ m.candles || 0 }}</span>
            <span class="il">点蜡烛</span>
          </button>
          <button class="ibtn" @click="offerFlower">
            <svg width="32" height="32" viewBox="0 0 100 100"><g transform="translate(50,50)"><ellipse cx="0" cy="-20" rx="8" ry="18" fill="#f5f0e8" stroke="#e0d8c8" stroke-width="0.5" transform="rotate(0)"/><ellipse cx="0" cy="-20" rx="8" ry="18" fill="#fff" stroke="#e0d8c8" stroke-width="0.5" transform="rotate(45)"/><ellipse cx="0" cy="-20" rx="8" ry="18" fill="#f5f0e8" stroke="#e0d8c8" stroke-width="0.5" transform="rotate(90)"/><ellipse cx="0" cy="-20" rx="8" ry="18" fill="#fff" stroke="#e0d8c8" stroke-width="0.5" transform="rotate(135)"/><ellipse cx="0" cy="-20" rx="8" ry="18" fill="#f5f0e8" stroke="#e0d8c8" stroke-width="0.5" transform="rotate(180)"/><ellipse cx="0" cy="-20" rx="8" ry="18" fill="#fff" stroke="#e0d8c8" stroke-width="0.5" transform="rotate(225)"/><ellipse cx="0" cy="-20" rx="8" ry="18" fill="#f5f0e8" stroke="#e0d8c8" stroke-width="0.5" transform="rotate(270)"/><ellipse cx="0" cy="-20" rx="8" ry="18" fill="#fff" stroke="#e0d8c8" stroke-width="0.5" transform="rotate(315)"/><circle cx="0" cy="0" r="10" fill="#f0e0a0"/><circle cx="0" cy="0" r="6" fill="#e0c860"/></g></svg>
            <span class="ic">{{ m.flowers || 0 }}</span>
            <span class="il">献白菊</span>
          </button>
        </div>
      </div>

      <div class="card">
        <h3 class="st">💬 留言寄思</h3>
        <div v-if="m.messages?.length" class="ml">
          <div v-for="(msg,i) in m.messages" :key="i" class="mi"><p class="mt">{{ msg.text }}</p><p class="mtime">{{ formatTime(msg.time) }}</p></div>
        </div>
        <p v-else class="nm">还没有留言，写下第一条吧</p>
        <div class="mi-row"><input v-model="newMessage" class="input" placeholder="写下你的祝福..." @keyup.enter="addMessage" /><button class="bs" @click="addMessage">发送</button></div>
      </div>
    </div>
    <div v-else class="inner" style="text-align:center;padding-top:100px;color:rgba(200,190,220,0.5);">
      <p>未找到该纪念</p>
      <button class="back" @click="router.push('/')">← 回到星空</button>
    </div>
  </div>
</template>

<style scoped>
.page{min-height:100vh;padding:20px 16px 100px;background:rgba(6,6,16,0.98)}
.inner{max-width:480px;margin:0 auto}
.back{background:none;border:none;color:rgba(200,190,220,0.5);font-size:0.875rem;cursor:pointer;margin-bottom:16px;font-family:inherit}
.card{background:rgba(20,20,40,0.8);border:1px solid rgba(255,215,0,0.08);border-radius:16px;padding:20px;margin-bottom:16px}
.tc{text-align:center}
.photo-area{margin-bottom:16px}
.avatar{width:96px;height:96px;border-radius:50%;object-fit:cover;box-shadow:0 0 30px rgba(255,215,0,0.3)}
.avatar-ph{width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:rgba(255,215,0,0.1);margin:0 auto}
.name{font-family:'Noto Serif SC',serif;font-size:1.25rem;color:#ffd700;text-shadow:0 0 20px rgba(255,215,0,0.3)}
.dates{font-size:0.8125rem;color:rgba(200,190,220,0.5);margin-top:4px}
.days{font-size:0.875rem;color:rgba(232,160,176,0.7);margin-top:12px}
.story{margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,215,0,0.08);text-align:left}
.story-label{font-size:0.75rem;color:rgba(255,215,0,0.5);margin-bottom:8px}
.story-text{font-size:0.875rem;color:rgba(200,190,220,0.7);line-height:1.8;white-space:pre-wrap}
.msg{margin-top:16px;font-size:0.875rem;color:rgba(200,190,220,0.7);line-height:1.7;text-align:left}
.interact-row{display:flex;justify-content:space-around}
.ibtn{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 24px;border:none;border-radius:16px;background:rgba(255,255,255,0.03);cursor:pointer;font-family:inherit}
.ibtn:active{background:rgba(255,255,255,0.08)}
.ic{font-size:0.875rem;font-weight:600;color:#ffd700}
.il{font-size:0.75rem;color:rgba(200,190,220,0.5)}
.st{font-family:'Noto Serif SC',serif;font-size:1rem;color:rgba(255,230,180,0.7);margin-bottom:16px}
.ml{margin-bottom:16px}
.mi{padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
.mt{font-size:0.875rem;color:rgba(200,190,220,0.7)}
.mtime{font-size:0.6875rem;color:rgba(200,190,220,0.35);margin-top:4px}
.nm{text-align:center;font-size:0.875rem;color:rgba(200,190,220,0.3);padding:16px 0}
.mi-row{display:flex;gap:8px}
.input{flex:1;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,215,0,0.12);border-radius:10px;color:#d8d0c8;font-size:0.9375rem;font-family:inherit;outline:none}
.input:focus{border-color:rgba(255,215,0,0.4)}
.bs{padding:10px 16px;border:none;border-radius:10px;background:linear-gradient(135deg,#c89030,#ffd700);color:#0a0a1a;font-size:0.875rem;font-weight:500;cursor:pointer;font-family:inherit}
</style>
