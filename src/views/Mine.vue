<script setup>
import { useRouter } from 'vue-router'
import { useMemorials } from '../composables/useMemorials.js'

const router = useRouter()
const { memorials } = useMemorials()

function formatDateRange(m) {
  const b = m.birthYear ? `${m.birthYear}年${m.birthMonth}月${m.birthDay}日` : ''
  const l = m.leaveYear ? `${m.leaveYear}年${m.leaveMonth}月${m.leaveDay}日` : ''
  return b && l ? `${b} — ${l}` : b ? `出生于 ${b}` : l ? `离开于 ${l}` : ''
}
</script>

<template>
  <div class="page">
    <div class="inner">
      <div class="header">
        <h2 class="title">我的星星</h2>
        <p class="sub">我点亮的每一颗星</p>
      </div>

      <div v-if="memorials.length === 0" class="empty">
        <div style="font-size:3rem;margin-bottom:16px;">✨</div>
        <p>你还没有点亮任何星星</p>
        <button class="btn-primary" @click="router.push('/create')">点亮第一颗星</button>
      </div>

      <div v-else class="list">
        <div v-for="m in memorials" :key="m.id" class="card" @click="router.push('/detail/' + m.id)">
          <div class="row">
            <div class="av">
              <img v-if="m.photo" :src="m.photo" class="av-img" />
              <span v-else>{{ m.gender==='boy'?'👦':m.gender==='girl'?'👧':'👼' }}</span>
            </div>
            <div class="info">
              <h3 class="nm">{{ m.name }}</h3>
              <p class="dt">{{ formatDateRange(m) }}</p>
              <div class="stats">
                <span>🕯{{ m.candles || 0 }}</span>
                <span>🤍{{ m.flowers || 0 }}</span>
                <span>💬{{ m.messages?.length || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page{min-height:100vh;padding:20px 16px 100px;background:rgba(6,6,16,0.98)}
.inner{max-width:480px;margin:0 auto}
.header{text-align:center;margin-bottom:24px}
.title{font-family:'Noto Serif SC',serif;font-size:1.25rem;font-weight:700;color:#ffd700}
.sub{font-size:0.875rem;color:rgba(200,190,220,0.5);margin-top:4px}
.empty{text-align:center;padding:60px 20px;color:rgba(200,190,220,0.4)}
.list{display:flex;flex-direction:column;gap:12px}
.card{background:rgba(20,20,40,0.8);border:1px solid rgba(255,215,0,0.08);border-radius:16px;padding:16px;cursor:pointer;transition:transform 0.2s}
.card:active{transform:scale(0.98)}
.row{display:flex;gap:14px;align-items:center}
.av{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:rgba(255,215,0,0.1);flex-shrink:0;overflow:hidden}
.av-img{width:100%;height:100%;object-fit:cover}
.info{flex:1;min-width:0}
.nm{font-size:1rem;font-weight:600}
.dt{font-size:0.75rem;color:rgba(200,190,220,0.4);margin-top:2px}
.stats{display:flex;gap:12px;font-size:0.75rem;color:rgba(200,190,220,0.4);margin-top:6px}
.btn-primary{margin-top:16px;padding:12px 24px;border:none;border-radius:12px;background:linear-gradient(135deg,#c89030,#ffd700);color:#0a0a1a;font-size:0.9rem;font-weight:600;font-family:inherit;cursor:pointer}
</style>
