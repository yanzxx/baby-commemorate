<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMemorials } from '../composables/useMemorials.js'

const route = useRoute()
const router = useRouter()
const { getMemorial, updateMemorial } = useMemorials()
const newMessage = ref('')
const replyTo = ref(null)
const isEditing = ref(false)
const editForm = ref({})
const photoInput = ref(null)
const editAudioInput = ref(null)
const editVideoInput = ref(null)

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

function startEdit() {
  const data = { ...m.value }
  // 转换日期为原生input格式
  if (data.birthYear) {
    data.birthDateNative = data.birthYear + '-' + String(data.birthMonth).padStart(2,'0') + '-' + String(data.birthDay).padStart(2,'0')
  } else { data.birthDateNative = '' }
  if (data.leaveYear) {
    data.leaveDateNative = data.leaveYear + '-' + String(data.leaveMonth).padStart(2,'0') + '-' + String(data.leaveDay).padStart(2,'0')
  } else { data.leaveDateNative = '' }
  editForm.value = data
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

async function saveEdit() {
  const data = { ...editForm.value }
  // 转换日期格式
  if (data.birthDateNative) {
    const d = new Date(data.birthDateNative)
    data.birthYear = d.getFullYear(); data.birthMonth = d.getMonth() + 1; data.birthDay = d.getDate()
  } else { data.birthYear = ''; data.birthMonth = ''; data.birthDay = '' }
  if (data.leaveDateNative) {
    const d = new Date(data.leaveDateNative)
    data.leaveYear = d.getFullYear(); data.leaveMonth = d.getMonth() + 1; data.leaveDay = d.getDate()
  } else { data.leaveYear = ''; data.leaveMonth = ''; data.leaveDay = '' }
  delete data.id; delete data.candles; delete data.flowers; delete data.messages; delete data.createdAt
  delete data.birthDateNative; delete data.leaveDateNative
  updateMemorial(m.value.id, data)
  isEditing.value = false
}

function onEditAudioChange(e) { const f = e.target.files[0]; if (!f) return; editForm.value.audioName = f.name; const r = new FileReader(); r.onload = ev => { editForm.value.audio = ev.target.result }; r.readAsDataURL(f) }
function onEditVideoChange(e) { const f = e.target.files[0]; if (!f) return; editForm.value.videoName = f.name; const r = new FileReader(); r.onload = ev => { editForm.value.video = ev.target.result }; r.readAsDataURL(f) }
function onPhotoChange(e) {
  const f = e.target.files[0]
  if (!f) return
  const r = new FileReader()
  r.onload = ev => { editForm.value.photo = ev.target.result }
  r.readAsDataURL(f)
}

const years = computed(() => Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i))
function daysInMonth(y, m) { return (!y || !m) ? 31 : new Date(y, m, 0).getDate() }

function lightCandle() { if (m.value) updateMemorial(m.value.id, { candles: (m.value.candles || 0) + 1 }) }
function offerFlower() { if (m.value) updateMemorial(m.value.id, { flowers: (m.value.flowers || 0) + 1 }) }
function addMessage() {
  if (!m.value || !newMessage.value.trim()) return
  const msgs = [...(m.value.messages || [])]
  if (replyTo.value) {
    // 回复
    const parent = msgs.find(msg => msg.id === replyTo.value)
    if (parent) {
      if (!parent.replies) parent.replies = []
      parent.replies.push({ id: Date.now().toString(), text: newMessage.value.trim(), time: new Date().toISOString() })
    }
    replyTo.value = null
  } else {
    // 新留言
    msgs.push({ id: Date.now().toString(), text: newMessage.value.trim(), time: new Date().toISOString(), replies: [] })
  }
  updateMemorial(m.value.id, { messages: msgs })
  newMessage.value = ''
}

function startReply(msgId) {
  replyTo.value = msgId
  document.querySelector('.mi-input input')?.focus()
}
</script>

<template>
  <div class="page">
    <div class="inner" v-if="m">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <button class="back" @click="router.push('/mine')">← 返回</button>
        <button v-if="!isEditing" class="back" style="color:rgba(255,215,0,0.5);" @click="startEdit">✏️ 编辑</button>
      </div>

      <div v-show="!isEditing" class="card tc">
        <div class="photo-area">
          <img v-if="m.photo" :src="m.photo" class="avatar" />
          <div v-else class="avatar-ph">{{ m.gender==='boy'?'👦':m.gender==='girl'?'👧':'👼' }}</div>
        </div>
        <h2 class="name">{{ m.name }}</h2>
        <p class="dates">{{ formatDateRange() }}</p>
        <p v-if="daysSinceLeave" class="days">已经离开 {{ daysSinceLeave }} 天</p>
        <div v-if="m.story" class="story"><p class="story-label">📖 在人间的故事</p><p class="story-text">{{ m.story }}</p></div>
        <div v-if="m.audio" class="story"><p class="story-label">🎵 音频</p>
          <audio :src="m.audio" controls style="width:100%;margin-top:8px;"></audio>
        </div>
        <div v-if="m.video" class="story"><p class="story-label">🎬 视频</p>
          <video :src="m.video" controls style="width:100%;max-height:300px;margin-top:8px;border-radius:8px;" playsinline></video>
        </div>
        <div v-if="m.message" class="story"><p class="story-label">💌 妈妈寄语</p><p class="story-text">{{ m.message }}</p></div>
      </div>

      <div v-show="!isEditing" class="card">
        <div class="interact-row">
          <button class="ibtn" @click="lightCandle">
            <span style="font-size:1.5rem;line-height:1;">🕯</span>
            <span class="ic">{{ m.candles || 0 }}</span>
            <span class="il">点蜡烛</span>
          </button>
          <button class="ibtn" @click="offerFlower">
            <span style="display:inline-flex;align-items:center;"><svg width="14" height="14" viewBox="0 0 100 100" style="vertical-align:middle;"><g transform="translate(50,50)" stroke="#e0d8c8" stroke-width="0.3"><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#f5f0e8" transform="rotate(0)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#fff" transform="rotate(45)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#f5f0e8" transform="rotate(90)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#fff" transform="rotate(135)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#f5f0e8" transform="rotate(180)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#fff" transform="rotate(225)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#f5f0e8" transform="rotate(270)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#fff" transform="rotate(315)"/><circle cx="0" cy="0" r="9" fill="#f0e0a0"/><circle cx="0" cy="0" r="5" fill="#e0c860"/></g></svg></span>
            <span class="ic">{{ m.flowers || 0 }}</span>
            <span class="il">献白菊</span>
          </button>
        </div>
      </div>

      <div class="card">
        <h3 v-show="!isEditing" class="st">💬 留言寄思</h3>
        <div v-if="m.messages?.length && !isEditing" class="ml">
          <div v-for="(msg,i) in m.messages" :key="msg.id" class="mi">
            <p class="mt">{{ msg.text }}</p>
            <p class="mtime">
              <span>{{ formatTime(msg.time) }}</span>
              <span class="reply-btn" @click="startReply(msg.id)">回复</span>
            </p>
            <!-- 回复列表 -->
            <div v-if="msg.replies?.length" class="replies">
              <div v-for="(r,ri) in msg.replies" :key="r.id" class="reply-item">
                <p class="rt">{{ r.text }}</p>
                <p class="mtime">{{ formatTime(r.time) }}</p>
              </div>
            </div>
          </div>
        </div>
        <p v-show="!isEditing" class="nm">还没有留言，写下第一条吧</p>
        <div v-if="isEditing" class="card" style="text-align:left;margin-top:16px;">
        <p style="font-size:0.8rem;color:rgba(255,215,0,0.5);margin-bottom:12px;">✏️ 编辑宝宝信息</p>
        <div class="fg"><label class="el">照片</label>
          <div style="display:flex;align-items:center;gap:12px;cursor:pointer;" @click="photoInput?.click()">
            <img v-if="editForm.photo" :src="editForm.photo" style="width:60px;height:60px;border-radius:50%;object-fit:cover;" />
            <div v-else style="width:60px;height:60px;border-radius:50%;background:rgba(255,215,0,0.1);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">📷</div>
            <span style="font-size:0.75rem;color:rgba(200,190,220,0.5);">点击更换</span>
          </div>
          <input ref="photoInput" type="file" accept="image/*" style="display:none" @change="onPhotoChange" />
        </div>
        <div class="fg"><label class="el">名字</label><input v-model="editForm.name" class="ei" /></div>
        <div class="fg"><label class="el">性别</label>
          <div style="display:flex;gap:8px;">
            <span class="tag" :class="{active:editForm.gender==='boy'}" @click="editForm.gender='boy'">👦 男孩</span>
            <span class="tag" :class="{active:editForm.gender==='girl'}" @click="editForm.gender='girl'">👧 女孩</span>
            <span class="tag" :class="{active:editForm.gender==='unknown'}" @click="editForm.gender='unknown'">未知</span>
          </div>
        </div>
        <div class="fg"><label class="el">出生日期</label>
          <input type="date" v-model="editForm.birthDateNative" class="ei" />
        </div>
        <div class="fg"><label class="el">离开日期</label>
          <input type="date" v-model="editForm.leaveDateNative" class="ei" />
        </div>
        <div class="fg"><label class="el">故事</label><textarea v-model="editForm.story" class="ei" style="min-height:60px;resize:vertical;"></textarea></div>
        <div class="fg"><label class="el">寄语</label><textarea v-model="editForm.message" class="ei" style="min-height:60px;resize:vertical;"></textarea></div>
        <div class="fg"><label class="el">音频</label>
          <button type="button" class="media-btn" @click="$refs.editAudioInput.click()">🎵 选择音频</button>
          <span v-if="editForm.audioName" style="margin-left:10px;font-size:0.75rem;color:rgba(255,215,0,0.6);">{{ editForm.audioName }}</span>
          <input ref="editAudioInput" type="file" accept="audio/*" style="display:none" @change="onEditAudioChange" />
        </div>
        <div class="fg"><label class="el">视频</label>
          <button type="button" class="media-btn" @click="$refs.editVideoInput.click()">🎬 选择视频</button>
          <span v-if="editForm.videoName" style="margin-left:10px;font-size:0.75rem;color:rgba(255,215,0,0.6);">{{ editForm.videoName }}</span>
          <input ref="editVideoInput" type="file" accept="video/*" style="display:none" @change="onEditVideoChange" />
        </div>
        <div style="display:flex;gap:12px;margin-top:16px;">
          <button style="flex:1;padding:12px;border:1px solid rgba(255,215,0,0.15);border-radius:12px;background:transparent;color:rgba(200,190,220,0.6);font-size:0.9375rem;cursor:pointer;font-family:inherit;" @click="cancelEdit">取消</button>
          <button style="flex:1;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#c89030,#ffd700);color:#0a0a1a;font-size:0.9375rem;font-weight:600;cursor:pointer;font-family:inherit;" @click="saveEdit">💾 保存</button>
        </div>
      </div>
        <div v-show="!isEditing" class="mi-row mi-input">
          <input v-model="newMessage" class="input" :placeholder="replyTo ? '回复中...' : '写下你的祝福...'" @keyup.enter="addMessage" />
          <button v-if="replyTo" class="bs" style="background:rgba(200,190,220,0.1);color:rgba(200,190,220,0.6);" @click="replyTo=null">取消</button>
          <button class="bs" @click="addMessage">发送</button>
        </div>
      </div>
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
<style scoped>
.fg{margin-bottom:14px}
.el{display:block;font-size:0.75rem;color:rgba(255,215,0,0.5);margin-bottom:6px}
.ei{width:100%;padding:8px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,215,0,0.12);border-radius:8px;color:#d8d0c8;font-size:0.875rem;font-family:inherit;outline:none}
.ei:focus{border-color:rgba(255,215,0,0.4)}
.media-btn{padding:8px 16px;border:1px solid rgba(255,215,0,0.2);border-radius:10px;background:rgba(255,255,255,0.03);color:#d8d0c8;font-size:0.8125rem;cursor:pointer;font-family:inherit}
.tag{display:inline-block;padding:4px 12px;border-radius:16px;font-size:0.75rem;cursor:pointer;border:1px solid rgba(255,215,0,0.12);background:rgba(255,255,255,0.03);color:rgba(200,190,220,0.6);transition:all 0.2s}
.tag.active{background:rgba(255,215,0,0.15);color:#ffd700;border-color:rgba(255,215,0,0.3)}
</style>
<style scoped>
.reply-btn{display:inline-block;margin-left:12px;font-size:0.6875rem;color:rgba(255,215,0,0.4);cursor:pointer}
.reply-btn:hover{color:rgba(255,215,0,0.7)}
.replies{margin-top:8px;margin-left:20px;padding-left:12px;border-left:2px solid rgba(255,215,0,0.1)}
.reply-item{padding:6px 0}
.rt{font-size:0.8125rem;color:rgba(200,190,220,0.6)}
</style>
<style scoped>
.fg{margin-bottom:14px}
.el{display:block;font-size:0.75rem;color:rgba(255,215,0,0.5);margin-bottom:6px}
.ei{width:100%;padding:8px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,215,0,0.12);border-radius:8px;color:#d8d0c8;font-size:0.875rem;font-family:inherit;outline:none}
.ei:focus{border-color:rgba(255,215,0,0.4)}
.media-btn{padding:8px 16px;border:1px solid rgba(255,215,0,0.2);border-radius:10px;background:rgba(255,255,255,0.03);color:#d8d0c8;font-size:0.8125rem;cursor:pointer;font-family:inherit}
.tag{display:inline-block;padding:4px 12px;border-radius:16px;font-size:0.75rem;cursor:pointer;border:1px solid rgba(255,215,0,0.12);background:rgba(255,255,255,0.03);color:rgba(200,190,220,0.6);transition:all 0.2s}
.tag.active{background:rgba(255,215,0,0.15);color:#ffd700;border-color:rgba(255,215,0,0.3)}
</style>
