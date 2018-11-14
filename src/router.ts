import Vue from 'vue'
import Router from 'vue-router'
import All from './views/All.vue'
import Demo from './views/Demo.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: '/vandal',
  routes: [
    {
      path: '/',
      name: 'vandal',
      component: All
    },
    {
      path: '/demo',
      name: 'demo',
      component: Demo
    }
  ]
})
