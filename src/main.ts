import Vue from 'vue'
import App from './App.vue'
import router from './router'
const VueHighlightJS = require('vue-highlightjs')

Vue.use(VueHighlightJS)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
