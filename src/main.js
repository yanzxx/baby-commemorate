import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import 'vant/lib/index.css'

// 按需注册组件
import VanField from 'vant/es/field'
import 'vant/es/field/style'
import VanPopup from 'vant/es/popup'
import 'vant/es/popup/style'
import VanDatePicker from 'vant/es/date-picker'
import 'vant/es/date-picker/style'

const app = createApp(App)
app.use(router)
app.component('van-field', VanField)
app.component('van-popup', VanPopup)
app.component('van-date-picker', VanDatePicker)
app.mount('#app')
