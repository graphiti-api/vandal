import Vue from 'vue'
import App from './App.vue'
import router from './router'
import moment from 'moment'
const VueHighlightJS = require('vue-highlightjs')

Vue.use(VueHighlightJS)

Vue.config.productionTip = false

Vue.mixin({
  methods: {
    tempSet(obj, prop, val, duration, after = null) {
      let valueAfter = obj[prop]
      if (after !== null) {
        valueAfter = after
      }
      obj[prop] = val
      let reset = () => {
        obj[prop] = valueAfter
      }
      setTimeout(reset, duration)
    }
  }
})

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
