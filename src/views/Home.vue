<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMemorials } from '../composables/useMemorials.js'

const router = useRouter()
const { publicMemorials } = useMemorials()
const canvasRef = ref(null)
const showTip = ref(false)
const tipPos = ref({ x: 0, y: 0 })
const viewMode = ref('sphere') // 'sphere' | 'list'

const sortedMemorials = computed(() => {
  const list = [...publicMemorials.value]
  list.sort((a, b) => {
    const daysA = getDaysSinceLeave(a)
    const daysB = getDaysSinceLeave(b)
    return daysB - daysA // 去世越久排越前
  })
  return list
})

function getDaysSinceLeave(m) {
  if (!m.leaveYear || !m.leaveMonth || !m.leaveDay) return -1
  const leave = new Date(m.leaveYear, m.leaveMonth - 1, m.leaveDay)
  return Math.max(0, Math.floor((Date.now() - leave.getTime()) / 86400000))
}

function formatDate(m) {
  if (!m.leaveYear) return ''
  return `${m.leaveYear}年${m.leaveMonth}月${m.leaveDay}日`
}

const dailyQuote = computed(() => {
  const q = ['每个小天使来到这个世界，都曾带来无尽的爱与希望。','他们虽然离开了，但爱永远不会消失。','在另一个世界，他们一定在微笑着看着我们。','生命的意义不在于长短，而在于曾经带来的温暖。','每一次思念，都是爱的延续。','他们教会了我们什么是无条件的爱。']
  return q[new Date().toDateString().split('').reduce((s,c)=>s+c.charCodeAt(0),0) % q.length]
})

const MOCK_NAMES = [
  '小星星','月亮宝宝','云朵儿','小雨点','暖暖','甜甜','小贝壳','棉花糖','小彩虹','小雪花',
  '小太阳','小天使','小花朵','小露珠','小铃铛','小糖果','小珍珠','小棉花','小樱桃','小蜜糖',
  '小海豚','小蝴蝶','小蜻蜓','小萤火','小晨曦','小晚霞','小微风','小溪流','小浪花','小山丘',
  '小森林','小星辰','小银河','小流星','小云雀','小百灵','小画眉','小燕子','小鸽子','小天鹅',
  '小茉莉','小百合','小玫瑰','小雏菊','小向日葵','小薰衣草','小琥珀','小水晶','小玛瑙','小翡翠',
]

function initParticles() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  let w, h, time = 0
  let rotateX = 0.3, rotateY = 0, autoRotate = true
  let zoom = 1, targetZoom = 1
  let isDragging = false, lastX = 0, lastY = 0, touchDist = 0
  let moved = false
  const RADIUS = 170
  const LIGHT = { x: 0.4, y: -0.3, z: 0.8 }
  const lLen = Math.sqrt(LIGHT.x**2 + LIGHT.y**2 + LIGHT.z**2)
  LIGHT.x /= lLen; LIGHT.y /= lLen; LIGHT.z /= lLen

  const imageCache = {}

  function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }

  function generatePoints() {
    const points = []
    const realList = publicMemorials.value
    const mockCount = Math.max(0, 50 - realList.length)
    const mockList = Array.from({ length: mockCount }, (_, i) => ({
      id: 'mock-' + i, type: 'mock', name: MOCK_NAMES[i % MOCK_NAMES.length], gender: ['boy','girl','unknown'][i % 3],
    }))
    const allList = [...realList.map(m => ({ ...m, type: 'real' })), ...mockList]
    const total = allList.length

    for (let i = 0; i < total; i++) {
      const entry = allList[i]
      const isReal = entry.type === 'real'
      let phi, theta
      if (isReal) {
        const realTotal = realList.length
        phi = Math.PI * 0.25 + (Math.PI * 0.5) * (i / Math.max(realTotal - 1, 1))
        theta = Math.PI * 2 * (i / Math.max(realTotal, 1)) + Math.PI * 0.5
      } else {
        const mockIdx = i - realList.length
        phi = Math.acos(1 - 2 * (mockIdx + 0.5) / Math.max(mockCount, 1))
        theta = Math.PI * (1 + Math.sqrt(5)) * mockIdx
      }
      const nx = Math.sin(phi) * Math.cos(theta)
      const ny = Math.sin(phi) * Math.sin(theta)
      const nz = Math.cos(phi)
      points.push({
        x3d: RADIUS * nx, y3d: RADIUS * ny, z3d: RADIUS * nz,
        nx, ny, nz, type: entry.type,
        data: isReal ? { id: entry.id, name: entry.name, photo: entry.photo, gender: entry.gender } : null,
        id: entry.id, icon: entry.gender === 'boy' ? '👦' : entry.gender === 'girl' ? '👧' : '👼',
        name: entry.name || '', hue: isReal ? 45 : 30 + Math.random() * 20,
        baseSize: isReal ? 22 : 10,
      })
    }
    return points
  }

  let points = generatePoints()

  // 预加载图片
  function loadImages() {
    publicMemorials.value.forEach(m => {
      if (m.photo && !imageCache[m.id]) {
        const img = new Image()
        img.onload = () => { imageCache[m.id] = img }
        img.src = m.photo
        imageCache[m.id] = img
      }
    })
  }
  loadImages()
  watch(publicMemorials, () => { points = generatePoints(); loadImages() }, { deep: true })

  function rotate(x, y, z) {
    let y1 = y * Math.cos(rotateX) - z * Math.sin(rotateX)
    let z1 = y * Math.sin(rotateX) + z * Math.cos(rotateX)
    let x2 = x * Math.cos(rotateY) + z1 * Math.sin(rotateY)
    let z2 = -x * Math.sin(rotateY) + z1 * Math.cos(rotateY)
    return { x: x2, y: y1, z: z2 }
  }

  function project(x, y, z) {
    const fov = 500 * zoom
    const scale = fov / (fov + z + RADIUS)
    return { sx: w/2 + x * scale, sy: h/2 + y * scale, scale, z }
  }

  let projected = []

  function draw() {
    time++
    ctx.clearRect(0, 0, w, h)

    const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.7)
    grad.addColorStop(0, '#0d1025'); grad.addColorStop(0.5, '#060612'); grad.addColorStop(1, '#020208')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)

    if (autoRotate && !isDragging) rotateY += 0.004
    zoom += (targetZoom - zoom) * 0.1

    // 轨道线
    ctx.strokeStyle = 'rgba(255,215,0,0.025)'; ctx.lineWidth = 0.5
    for (let r = 50; r <= 200; r += 30) {
      ctx.beginPath()
      for (let i = 0; i <= 60; i++) {
        const a = (i / 60) * Math.PI * 2
        const r2 = rotate(Math.cos(a) * r, Math.sin(a) * r * 0.6, Math.sin(a) * r * 0.4)
        const p = project(r2.x, r2.y, r2.z)
        if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy)
      }
      ctx.stroke()
    }

    // 投影排序
    projected = points.map(sp => {
      const r = rotate(sp.x3d, sp.y3d, sp.z3d)
      const p = project(r.x, r.y, r.z)
      const rnx = rotate(sp.nx, sp.ny, sp.nz)
      const dot = rnx.x * LIGHT.x + rnx.y * LIGHT.y + rnx.z * LIGHT.z
      let lighting = Math.max(0.15, dot * 0.5 + 0.5)
      if (sp.type === 'real') lighting = Math.max(0.7, lighting)
      return { ...sp, ...p, lighting }
    }).sort((a, b) => a.z - b.z)

    // 连线 - 所有点之间
    const allPoints = projected.filter(p => p.type === 'memorial' || p.type === 'mock' || p.type === 'real')
    for (let i = 0; i < allPoints.length; i++) {
      for (let j = i + 1; j < allPoints.length; j++) {
        const dx = allPoints[i].sx - allPoints[j].sx, dy = allPoints[i].sy - allPoints[j].sy
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < 150) {
          const distFactor = 1 - dist / 150
          ctx.globalAlpha = distFactor * 0.2
          ctx.strokeStyle = 'rgba(200,190,220,0.4)'
          ctx.lineWidth = 0.4 + distFactor * 0.3
          ctx.beginPath(); ctx.moveTo(allPoints[i].sx, allPoints[i].sy); ctx.lineTo(allPoints[j].sx, allPoints[j].sy); ctx.stroke()
        }
      }
    }
    ctx.globalAlpha = 1

    // 绘制点
    projected.forEach(p => {
      const depth = (p.z + RADIUS) / (2 * RADIUS)
      const size = Math.max(2, p.baseSize * p.scale * p.lighting)
      const alpha = Math.max(0.1, depth * p.lighting)

      if (p.type === 'real') {
        const r = Math.max(3, size * 0.9)
        const img = p.data?.photo ? imageCache[p.data.id] : null
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save(); ctx.globalAlpha = alpha
          ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
          ctx.drawImage(img, p.sx - r, p.sy - r, r * 2, r * 2)
          ctx.restore()
          ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(255,215,0,0.7)'; ctx.lineWidth = 2; ctx.stroke()
        } else {
          const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, Math.max(1, r * 2))
          glow.addColorStop(0, 'rgba(255,215,0,' + (0.3 * alpha) + ')'); glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.sx, p.sy, Math.max(1, r * 2), 0, Math.PI * 2); ctx.fill()
          ctx.save(); ctx.globalAlpha = alpha
          ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2)
          const bg = ctx.createRadialGradient(p.sx - r*0.3, p.sy - r*0.3, 0, p.sx, p.sy, r)
          bg.addColorStop(0, 'rgba(255,240,180,' + p.lighting + ')'); bg.addColorStop(1, 'rgba(180,140,40,' + (p.lighting*0.6) + ')')
          ctx.fillStyle = bg; ctx.fill()
          ctx.fillStyle = '#0a0a1a'; ctx.font = Math.round(size * 0.6) + 'px sans-serif'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(p.icon, p.sx, p.sy); ctx.restore()
        }
        // 名字
        if (size > 6) {
          ctx.fillStyle = 'rgba(255,230,180,' + (alpha * 0.85) + ')'
          ctx.font = Math.round(size * 0.5) + 'px sans-serif'
          ctx.textAlign = 'center'; ctx.fillText(p.name, p.sx, p.sy + Math.max(3, size * 0.9) + 8)
        }
      } else {
        // mock - 高亮发光版本
        const pulse = 0.6 + 0.4 * Math.sin(time * 0.003 + p.z * 0.1)
        const brightness = 55 + p.lighting * 35
        const hueSat = Math.round(p.hue)
        const r = Math.max(2, size * 0.6)
        // 外层大光晕
        const outerR = r * 3.5
        const outer = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, outerR)
        outer.addColorStop(0, 'hsla(' + hueSat + ',60%,' + brightness + '%,0.2)')
        outer.addColorStop(1, 'transparent')
        ctx.fillStyle = outer
        ctx.beginPath(); ctx.arc(p.sx, p.sy, outerR, 0, Math.PI * 2); ctx.fill()
        // 内层光晕
        const innerR = r * 2
        const inner = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, innerR)
        inner.addColorStop(0, 'hsla(' + hueSat + ',70%,' + (brightness + 15) + '%,0.35)')
        inner.addColorStop(1, 'transparent')
        ctx.fillStyle = inner
        ctx.beginPath(); ctx.arc(p.sx, p.sy, innerR, 0, Math.PI * 2); ctx.fill()
        // 主体
        ctx.save(); ctx.globalAlpha = alpha * 0.8 * pulse
        ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2)
        ctx.fillStyle = 'hsla(' + hueSat + ',60%,' + (brightness + 20) + '%,0.8)'
        ctx.fill()
        ctx.strokeStyle = 'hsla(' + hueSat + ',70%,' + (brightness + 25) + '%,0.5)'
        ctx.lineWidth = 1
        ctx.stroke()
        // 中心高光
        ctx.beginPath(); ctx.arc(p.sx - r*0.25, p.sy - r*0.25, r*0.3, 0, Math.PI * 2)
        ctx.fillStyle = 'hsla(' + hueSat + ',80%,' + (brightness + 30) + '%,0.4)'
        ctx.fill()
        // 图标
        ctx.fillStyle = 'hsla(0,0%,80%,0.7)'
        ctx.font = Math.round(size * 0.4) + 'px sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('👼', p.sx, p.sy); ctx.restore()
      }
      p._sx = p.sx; p._sy = p.sy; p._size = size
    })

    // 鼠标光晕
    if (lastX > 0 && lastY > 0) {
      const mg = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 35)
      mg.addColorStop(0, 'rgba(255,215,0,0.05)'); mg.addColorStop(1, 'transparent')
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(lastX, lastY, 35, 0, Math.PI * 2); ctx.fill()
    }

    requestAnimationFrame(draw)
  }

  // 事件
  canvas.addEventListener('mousedown', e => { isDragging = true; autoRotate = false; lastX = e.clientX; lastY = e.clientY; moved = false })
  canvas.addEventListener('mousemove', e => {
    if (isDragging) {
      rotateY += (e.clientX - lastX) * 0.006; rotateX += (e.clientY - lastY) * 0.006
      rotateX = Math.max(-1.2, Math.min(1.2, rotateX)); moved = true
    }
    lastX = e.clientX; lastY = e.clientY
  })
  canvas.addEventListener('mouseup', e => {
    isDragging = false; setTimeout(() => autoRotate = true, 3000)
    if (!moved) handleClick(e.clientX, e.clientY)
  })
  canvas.addEventListener('wheel', e => { e.preventDefault(); targetZoom = Math.max(0.4, Math.min(2.5, targetZoom - e.deltaY * 0.001)) }, { passive: false })

  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { isDragging = true; autoRotate = false; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; moved = false }
    else if (e.touches.length === 2) { const dx = e.touches[0].clientX-e.touches[1].clientX, dy = e.touches[0].clientY-e.touches[1].clientY; touchDist = Math.sqrt(dx*dx+dy*dy) }
  }, { passive: true })
  canvas.addEventListener('touchmove', e => {
    e.preventDefault()
    if (e.touches.length === 1 && isDragging) {
      rotateY += (e.touches[0].clientX - lastX) * 0.006; rotateX += (e.touches[0].clientY - lastY) * 0.006
      rotateX = Math.max(-1.2, Math.min(1.2, rotateX)); moved = true
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX-e.touches[1].clientX, dy = e.touches[0].clientY-e.touches[1].clientY
      const dist = Math.sqrt(dx*dx+dy*dy); targetZoom = Math.max(0.4, Math.min(2.5, targetZoom * (dist / touchDist))); touchDist = dist
    }
  }, { passive: false })
  canvas.addEventListener('touchend', e => {
    isDragging = false; setTimeout(() => autoRotate = true, 3000)
    if (!moved && e.changedTouches.length === 1) handleClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
  })

  function handleClick(cx, cy) {
    for (const p of projected) {
      if (!p._sx) continue
      const dx = p._sx - cx, dy = p._sy - cy
      if (Math.sqrt(dx*dx + dy*dy) < (p._size || 10) + 12) {
        if (p.type === 'real' && p.data) {
          router.push('/detail/' + p.data.id)
        } else {
          tipPos.value = { x: cx, y: cy - 50 }
          showTip.value = true
          setTimeout(() => showTip.value = false, 3000)
        }
        return
      }
    }
  }

  resize(); draw()
  window.addEventListener('resize', resize)
}

onMounted(() => { initParticles() })
</script>

<template>
  <div style="height:100vh;overflow:hidden;position:relative;">
    <canvas ref="canvasRef" style="position:fixed;inset:0;width:100vw;height:100vh;z-index:1;"></canvas>

    <div style="position:relative;z-index:2;pointer-events:none;">
      <div class="hero">
        <h1 class="hero-title">小天使纪念园</h1>
        <p class="hero-sub">每一颗星星，都是一个小天使</p>
        <div class="star-counter"><span>✨</span><span>{{ publicMemorials.length }} 位小天使在闪耀</span></div>
      </div>
    </div>

    <div class="daily-quote" style="position:fixed;bottom:60px;left:0;right:0;z-index:2;pointer-events:none;">
      <span style="color:rgba(255,215,0,0.3);">✦</span> {{ dailyQuote }}
    </div>

    <!-- 切换按钮 -->
    <div style="position:fixed;top:20px;right:16px;z-index:3;">
      <button @click="viewMode = viewMode === 'sphere' ? 'list' : 'sphere'" style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.2);border-radius:20px;padding:6px 14px;color:#ffd700;font-size:0.75rem;cursor:pointer;font-family:inherit;backdrop-filter:blur(8px);">
        {{ viewMode === 'sphere' ? '📋 列表' : '🌌 星球' }}
      </button>
    </div>

    <!-- 列表视图 -->
    <div v-if="viewMode === 'list'" style="position:fixed;inset:0;z-index:2;overflow-y:auto;padding:80px 16px 100px;background:rgba(6,6,16,0.97);">
      <div v-if="sortedMemorials.length === 0" style="text-align:center;padding:60px 20px;color:rgba(200,190,220,0.4);">
        <div style="font-size:3rem;margin-bottom:16px;">✨</div>
        <p>还没有小天使</p>
      </div>
      <div v-else style="max-width:480px;margin:0 auto;display:flex;flex-direction:column;gap:10px;">
        <div v-for="m in sortedMemorials" :key="m.id" @click="$router.push('/detail/' + m.id)" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(20,20,40,0.8);border:1px solid rgba(255,215,0,0.06);border-radius:16px;cursor:pointer;transition:all 0.2s;backdrop-filter:blur(10px);"
             @mouseenter="$event.target.style.borderColor='rgba(255,215,0,0.2)'" @mouseleave="$event.target.style.borderColor='rgba(255,215,0,0.06)'">
          <div style="width:44px;height:44px;border-radius:50%;overflow:hidden;flex-shrink:0;background:rgba(255,215,0,0.1);display:flex;align-items:center;justify-content:center;font-size:1.4rem;">
            <img v-if="m.photo" :src="m.photo" style="width:100%;height:100%;object-fit:cover;" />
            <span v-else>{{ m.gender==='boy'?'👦':m.gender==='girl'?'👧':'👼' }}</span>
          </div>
          <div style="flex:1;min-width:0;">
            <p style="font-size:1rem;font-weight:600;">{{ m.name }}</p>
            <p v-if="m.leaveYear" style="font-size:0.75rem;color:rgba(200,190,220,0.5);margin-top:2px;">
              去世时间 {{ formatDate(m) }}
              <span v-if="getDaysSinceLeave(m) >= 0" style="color:rgba(232,160,176,0.6);margin-left:8px;">已离开 {{ getDaysSinceLeave(m) }} 天</span>
            </p>
          </div>
          <div style="display:flex;gap:6px;align-items:center;font-size:0.75rem;color:rgba(200,190,220,0.4);flex-shrink:0;">
            <span style="display:inline-flex;align-items:center;gap:3px;">🕯{{ m.candles || 0 }}</span>
            <span style="display:inline-flex;align-items:center;gap:3px;"><svg width="14" height="14" viewBox="0 0 100 100" style="vertical-align:middle;"><g transform="translate(50,50)" stroke="#e0d8c8" stroke-width="0.3"><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#f5f0e8" transform="rotate(0)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#fff" transform="rotate(45)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#f5f0e8" transform="rotate(90)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#fff" transform="rotate(135)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#f5f0e8" transform="rotate(180)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#fff" transform="rotate(225)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#f5f0e8" transform="rotate(270)"/><ellipse cx="0" cy="-20" rx="7" ry="16" fill="#fff" transform="rotate(315)"/><circle cx="0" cy="0" r="9" fill="#f0e0a0"/><circle cx="0" cy="0" r="5" fill="#e0c860"/></g></svg>{{ m.flowers || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <transition name="fade">
        <div v-if="showTip" class="tip-popup" :style="{ left: tipPos.x + 'px', top: tipPos.y + 'px' }">
          <p style="margin-bottom:8px;">待点亮</p>
          <button class="tip-btn" @click="showTip = false; $router.push('/create')">去点亮</button>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.hero{text-align:center;padding:50px 20px 20px;pointer-events:none}
.hero-title{font-family:'Noto Serif SC',serif;font-size:1.5rem;font-weight:700;color:#ffd700;text-shadow:0 0 20px rgba(255,215,0,0.3);margin-bottom:8px}
.hero-sub{font-size:0.875rem;color:rgba(200,190,220,0.6);margin-bottom:16px}
.star-counter{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:20px;background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.2);color:#ffd700;font-size:0.8125rem}
.daily-quote{text-align:center;font-size:0.6875rem;color:rgba(200,190,220,0.4)}
</style>

<style>
.tip-popup{position:fixed;background:rgba(10,10,30,0.98);border:1px solid rgba(255,215,0,0.3);border-radius:14px;padding:14px 18px;text-align:center;z-index:99999;font-size:0.8rem;color:rgba(200,190,220,0.9);box-shadow:0 8px 30px rgba(0,0,0,0.6);transform:translate(-50%,-100%);pointer-events:auto}
.tip-btn{padding:6px 20px;border:1px solid rgba(255,215,0,0.4);border-radius:16px;background:linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,215,0,0.25));color:#ffd700;font-size:0.75rem;cursor:pointer;font-family:inherit;font-weight:600}
.tip-btn:active{background:rgba(255,215,0,0.3)}
</style>
