<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMemorials } from '../composables/useMemorials.js'

const router = useRouter()
const { addMemorial } = useMemorials()
const photoInput = ref(null)
const audioInput = ref(null)
const videoInput = ref(null)
const showBirth = ref(false)
const showLeave = ref(false)

function onBirthConfirm({ selectedValues }) {
  const [y, m, d] = selectedValues
  form.value.birthDateNative = y + '-' + String(m).padStart(2,'0') + '-' + String(d).padStart(2,'0')
  form.value.birthDateDisplay = y + '年' + m + '月' + d + '日'
  showBirth.value = false
}

function onLeaveConfirm({ selectedValues }) {
  const [y, m, d] = selectedValues
  form.value.leaveDateNative = y + '-' + String(m).padStart(2,'0') + '-' + String(d).padStart(2,'0')
  form.value.leaveDateDisplay = y + '年' + m + '月' + d + '日'
  showLeave.value = false
}

const form = ref({
  name: '', photo: null,
  birthDateNative: '',
  leaveDateNative: '',
  birthDateDisplay: '',
  leaveDateDisplay: '',
  gender: '', story: '', message: '',
  privacy: 'public',
})

// const years (unused)
// function daysInMonth (unused)
function onPhotoChange(e) { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { form.value.photo = ev.target.result }; r.readAsDataURL(f) }
function onAudioChange(e) { const f = e.target.files[0]; if (!f) return; form.value.audioName = f.name; const r = new FileReader(); r.onload = ev => { form.value.audio = ev.target.result }; r.readAsDataURL(f) }
function onVideoChange(e) { const f = e.target.files[0]; if (!f) return; form.value.videoName = f.name; const r = new FileReader(); r.onload = ev => { form.value.video = ev.target.result }; r.readAsDataURL(f) }

async function submit() {
  if (!form.value.name.trim()) { alert('请填写宝宝名字'); return }
  const data = { ...form.value }
  if (data.birthDateNative) {
    const d = new Date(data.birthDateNative)
    data.birthYear = d.getFullYear(); data.birthMonth = d.getMonth() + 1; data.birthDay = d.getDate()
  }
  if (data.leaveDateNative) {
    const d = new Date(data.leaveDateNative)
    data.leaveYear = d.getFullYear(); data.leaveMonth = d.getMonth() + 1; data.leaveDay = d.getDate()
  }
  delete data.birthDateNative; delete data.leaveDateNative

  // 尝试上传文件到七牛云
  const { uploadMedia } = await import('../qiniu.js')

  // 上传音频
  if (data.audio && data.audio.startsWith('data:')) {
    const file = await fetch(data.audio).then(r => r.blob())
    const url = await uploadMedia(file, 'audio')
    if (url) data.audio = url
    delete data.audioName
  }

  // 上传视频
  if (data.video && data.video.startsWith('data:')) {
    const file = await fetch(data.video).then(r => r.blob())
    const url = await uploadMedia(file, 'video')
    if (url) data.video = url
    delete data.videoName
  }

  addMemorial({ id: Date.now().toString(), ...data, candles: 0, flowers: 0, messages: [], createdAt: new Date().toISOString() })
  router.push('/')
}
</script>

<template>
  <div class="page">
    <div class="inner">
      <div class="header">
        <h2 class="title">点亮一颗星</h2>
        <p class="sub">为小天使在夜空中留下永恒的光</p>
      </div>

      <div class="card">
        <label class="label">宝宝照片（可选）</label>
        <div class="photo-upload" @click="photoInput?.click()">
          <img v-if="form.photo" :src="form.photo" class="photo-preview" />
          <div v-else class="photo-ph"><div style="font-size:2rem;margin-bottom:8px;">📷</div><p>点击上传照片</p></div>
          <input ref="photoInput" type="file" accept="image/*" style="display:none" @change="onPhotoChange" />
        </div>
      </div>

      <div class="card">
        <div class="fg"><label class="label">宝宝名字</label><input v-model="form.name" class="input" placeholder="给宝宝起个小名" /></div>
        <div class="fg">
          <label class="label">出生日期</label>
          <div class="input date-trigger" @click="showBirth = true">
            <span v-if="form.birthDateDisplay" style="color:#d8d0c8;">{{ form.birthDateDisplay }}</span>
            <span v-else style="color:rgba(200,190,220,0.4);">点击选择</span>
          </div>
        </div>
        <div class="fg">
          <label class="label">离开日期</label>
          <div class="input date-trigger" @click="showLeave = true">
            <span v-if="form.leaveDateDisplay" style="color:#d8d0c8;">{{ form.leaveDateDisplay }}</span>
            <span v-else style="color:rgba(200,190,220,0.4);">点击选择</span>
          </div>
        </div>
        <div class="fg">
          <label class="label">宝宝性别</label>
          <div class="tags">
            <span class="tag" :class="{active:form.gender==='boy'}" @click="form.gender='boy'">👦 男孩</span>
            <span class="tag" :class="{active:form.gender==='girl'}" @click="form.gender='girl'">👧 女孩</span>
            <span class="tag" :class="{active:form.gender==='unknown'}" @click="form.gender='unknown'">未知</span>
          </div>
        </div>
      </div>

      <div class="card"><label class="label">宝宝在人间的故事</label><textarea v-model="form.story" class="input ta" placeholder="写下宝宝来到这个世界的故事..."></textarea></div>
      <div class="card"><label class="label">想对宝宝说的话</label><textarea v-model="form.message" class="input ta" placeholder="写下你想对宝宝说的话..."></textarea></div>
        <div class="card"><label class="label">音频（可选）</label>
        <div style="display:flex;align-items:center;gap:10px;margin-top:8px;">
          <button type="button" class="media-btn" @click="$refs.audioInput.click()">🎵 选择音频文件</button>
          <span v-if="form.audioName" style="font-size:0.75rem;color:rgba(255,215,0,0.6);">{{ form.audioName }}</span>
        </div>
        <input ref="audioInput" type="file" accept="audio/*" style="display:none" @change="onAudioChange" />
      </div>
      <div class="card"><label class="label">视频（可选）</label>
        <div style="display:flex;align-items:center;gap:10px;margin-top:8px;">
          <button type="button" class="media-btn" @click="$refs.videoInput.click()">🎬 选择视频文件</button>
          <span v-if="form.videoName" style="font-size:0.75rem;color:rgba(255,215,0,0.6);">{{ form.videoName }}</span>
        </div>
        <input ref="videoInput" type="file" accept="video/*" style="display:none" @change="onVideoChange" />
      </div>

      <div class="card">
        <label class="label">隐私设置</label>
        <div class="po">
          <label class="po-item" :class="{active:form.privacy==='public'}"><input type="radio" v-model="form.privacy" value="public" /><div><p class="po-t">公开（在星空中闪耀）</p><p class="po-d">让所有人都能看到这颗星星</p></div></label>
          <label class="po-item" :class="{active:form.privacy==='private'}"><input type="radio" v-model="form.privacy" value="private" /><div><p class="po-t">私密（只有自己能看到）</p><p class="po-d">只在"我的"页面显示</p></div></label>
        </div>
      </div>

      <button class="btn-primary" @click="submit">✨ 点亮这颗星</button>
    </div>

    <!-- 出生日期选择器 -->
    <van-popup v-model:show="showBirth" position="bottom" round :style="{ height: '50%' }">
      <div style="background:#0d1025;padding-bottom:env(safe-area-inset-bottom);">
        <van-date-picker
          title="选择出生日期"
          @cancel="showBirth = false"
          @confirm="onBirthConfirm"
          :columns-type="['year', 'month', 'day']"
          :min-date="new Date(1900,0,1)"
          :max-date="new Date()"
        />
      </div>
    </van-popup>

    <!-- 离开日期选择器 -->
    <van-popup v-model:show="showLeave" position="bottom" round :style="{ height: '45%' }">
      <div style="background:#0d1025;padding-bottom:env(safe-area-inset-bottom);">
        <van-date-picker
          title="选择离开日期"
          @cancel="showLeave = false"
          @confirm="onLeaveConfirm"
          :columns-type="['year', 'month', 'day']"
          :min-date="new Date(1900,0,1)"
          :max-date="new Date()"
        />
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.page{min-height:100vh;padding:20px 16px 100px;background:rgba(6,6,16,0.98)}
.inner{max-width:480px;margin:0 auto}
.header{text-align:center;margin-bottom:24px}
.title{font-family:'Noto Serif SC',serif;font-size:1.25rem;font-weight:700;color:#ffd700}
.sub{font-size:0.875rem;color:rgba(200,190,220,0.5);margin-top:4px}
.card{background:rgba(20,20,40,0.8);border:1px solid rgba(255,215,0,0.08);border-radius:16px;padding:20px;margin-bottom:16px;backdrop-filter:blur(10px)}
.label{display:block;font-size:0.8125rem;font-weight:500;color:rgba(255,215,0,0.6);margin-bottom:8px}
.input{width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,215,0,0.12);border-radius:10px;color:#d8d0c8;font-size:0.9375rem;font-family:inherit;outline:none;transition:border-color 0.2s}
.input:focus{border-color:rgba(255,215,0,0.4)}
.ta{min-height:80px;resize:vertical}
.fg{margin-bottom:16px}
.ds{display:flex;gap:6px}.ds select{flex:1}
.tags{display:flex;gap:8px;flex-wrap:wrap}
.tag{padding:6px 14px;border-radius:20px;font-size:0.8125rem;cursor:pointer;border:1px solid rgba(255,215,0,0.12);background:rgba(255,255,255,0.03);color:rgba(200,190,220,0.6);transition:all 0.2s}
.tag.active{background:rgba(255,215,0,0.15);color:#ffd700;border-color:rgba(255,215,0,0.3)}
.photo-upload{border:2px dashed rgba(255,215,0,0.15);border-radius:16px;padding:24px;text-align:center;cursor:pointer}
.photo-preview{width:96px;height:96px;border-radius:50%;object-fit:cover}
.photo-ph{color:rgba(200,190,220,0.4)}
.po{display:flex;flex-direction:column;gap:10px}
.po-item{display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;cursor:pointer;border:1px solid rgba(255,215,0,0.08);background:rgba(255,255,255,0.02);transition:all 0.2s}
.po-item.active{border-color:rgba(255,215,0,0.2);background:rgba(255,215,0,0.05)}
.po-item input[type='radio']{accent-color:#ffd700}
.po-t{font-size:0.875rem;font-weight:500}
.po-d{font-size:0.75rem;color:rgba(200,190,220,0.4);margin-top:2px}
.btn-primary{width:100%;padding:14px;border:none;border-radius:14px;background:linear-gradient(135deg,#c89030,#ffd700);color:#0a0a1a;font-size:1rem;font-weight:600;font-family:inherit;cursor:pointer;box-shadow:0 4px 20px rgba(255,215,0,0.2)}
.btn-primary:active{transform:scale(0.98)}
.media-btn{padding:8px 16px;border:1px solid rgba(255,215,0,0.2);border-radius:10px;background:rgba(255,255,255,0.03);color:#d8d0c8;font-size:0.8125rem;cursor:pointer;font-family:inherit}
</style>
