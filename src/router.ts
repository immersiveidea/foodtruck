import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import AdminPage from './pages/AdminPage.vue'
import BookingPage from './pages/BookingPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/menu/:categoryId?/:itemSlug?',
      name: 'menu',
      component: HomePage
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminPage
    },
    {
      path: '/book',
      name: 'book',
      component: BookingPage
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('./pages/CheckoutPage.vue')
    },
    {
      path: '/order/success',
      name: 'order-success',
      component: () => import('./pages/OrderConfirmationPage.vue')
    },
    {
      path: '/order/cancelled',
      name: 'order-cancelled',
      component: () => import('./pages/OrderCancelledPage.vue')
    }
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    if (to.name === 'menu') {
      return { el: '#menu', behavior: 'smooth' }
    }
    return { top: 0 }
  }
})

export default router
