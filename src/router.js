import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Create from './views/Create.vue'
import Detail from './views/Detail.vue'
import Mine from './views/Mine.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/create', component: Create },
  { path: '/detail/:id', component: Detail },
  { path: '/mine', component: Mine },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
