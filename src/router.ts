import Vue from 'vue'
import Router from 'vue-router'
import All from './views/All.vue'

Vue.use(Router)

export default new Router({
  base: '',
  routes: [
    {
      path: '/',
      name: 'vandal',
      component: All
    }
  ]
})