import Vue from 'vue'
import App from './App.vue'
import router from './router'
import moment from 'moment'
const VueHighlightJS = require('vue-highlightjs')

Vue.use(VueHighlightJS)

Vue.config.productionTip = false

Vue.filter('dateTimeType', (value: any) => {
  if (value) {
    return moment(String(value)).format('M/D/YYYY h:mm a')
  }
})

Vue.filter('dateType', (value: any) => {
  if (value) {
    return moment(String(value)).format('M/D/YYYY')
  }
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
