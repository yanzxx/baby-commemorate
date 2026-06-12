<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const currentPath = computed(() => route.path)

function go(path) {
  router.push(path)
}
</script>

<template>
  <div class="app">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <nav class="bottom-nav">
      <button class="nav-item" :class="{ active: currentPath === '/' }" @click="go('/')">
        <span class="nav-icon">🌌</span>
        <span class="nav-text">星空</span>
      </button>
      <button class="nav-item" :class="{ active: currentPath === '/create' }" @click="go('/create')">
        <span class="nav-icon">✨</span>
        <span class="nav-text">点亮</span>
      </button>
      <button class="nav-item" :class="{ active: currentPath === '/mine' }" @click="go('/mine')">
        <span class="nav-icon">💝</span>
        <span class="nav-text">我的</span>
      </button>
    </nav>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html{overflow-x:hidden}
body{font-family:'Noto Sans SC',system-ui,sans-serif;background:#060610;color:#d8d0c8;min-height:100vh;overflow-x:hidden}
body::-webkit-scrollbar{width:0;display:none}body{-ms-overflow-style:none;scrollbar-width:none}

.fade-enter-active,.fade-leave-active{transition:opacity 0.2s}
.fade-enter-from,.fade-leave-to{opacity:0}

.bottom-nav{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-around;padding:8px 0 max(8px,env(safe-area-inset-bottom));background:rgba(10,10,26,0.95);backdrop-filter:blur(10px);border-top:1px solid rgba(255,215,0,0.08);z-index:1000}
.nav-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 20px;border:none;background:none;color:rgba(200,190,220,0.4);font-size:0.6875rem;cursor:pointer;font-family:inherit;transition:color 0.2s}
.nav-item.active{color:#ffd700}
.nav-icon{font-size:1.25rem}
</style>
