import { createRouter, createWebHistory } from 'vue-router'
import { useCoupleStore } from '@/stores/couple'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/link',
    name: 'Link',
    component: () => import('@/views/LinkView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dates',
    name: 'Dates',
    component: () => import('@/views/DatesView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dates/new',
    name: 'NewDate',
    component: () => import('@/views/NewDateView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/bucket-list',
    name: 'BucketList',
    component: () => import('@/views/BucketListView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard - disabled, all routes accessible
// router.beforeEach((to, from, next) => {
//   const coupleStore = useCoupleStore()

//   if (to.meta.requiresAuth && !coupleStore.isLinked) {
//     next('/link')
//   } else if (to.path === '/link' && coupleStore.isLinked) {
//     next('/dashboard')
//   } else {
//     next()
//   }
// })

export default router
