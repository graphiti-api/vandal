import Vue from 'vue'
import Router from 'vue-router'
import All from './views/All.vue'

Vue.use(Router)

export const router = new Router({
  base: '',
  routes: [
    {
      path: '/',
      name: 'vandal',
      component: All,
      meta: {
        requiresAuth: true,
      },
    }
  ]
})


router.beforeEach((to, from, next) => {
  // redirect to login page if not logged in and trying to access a restricted page
  const publicPages = ['/login'];
  const authRequired = !publicPages.includes(to.path);
  const loggedIn = localStorage.getItem('user');

  if (authRequired && !loggedIn) {
    return next({
      path: '/login',
      query: { returnUrl: to.path }
    });
  }

  next();
})