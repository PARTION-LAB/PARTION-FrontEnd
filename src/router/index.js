import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '../views/AuthView.vue'
import BoardDetailView from '../views/BoardDetailView.vue'
import BoardView from '../views/BoardView.vue'
import BoardWriteView from '../views/BoardWriteView.vue'
import HomeView from '../views/HomeView.vue'
import InvestView from '../views/InvestView.vue'
import LedgerView from '../views/LedgerView.vue'
import MarketView from '../views/MarketView.vue'
import PaymentFailView from '../views/PaymentFailView.vue'
import PaymentSuccessView from '../views/PaymentSuccessView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import ProfileView from '../views/ProfileView.vue'
import RegisterProductView from '../views/RegisterProductView.vue'

const routes = [
  {
    path: '/',
    name: 'products',
    component: HomeView,
    meta: { navKey: 'products' },
  },
  {
    path: '/products/:productId',
    name: 'product-detail',
    component: ProductDetailView,
    meta: { navKey: 'products' },
  },
  {
    path: '/invest',
    name: 'invest',
    component: InvestView,
    meta: { navKey: 'invest' },
  },
  {
    path: '/payment/success',
    name: 'payment-success',
    component: PaymentSuccessView,
    meta: { navKey: 'invest' },
  },
  {
    path: '/payment/fail',
    name: 'payment-fail',
    component: PaymentFailView,
    meta: { navKey: 'invest' },
  },
  {
    path: '/market',
    name: 'market',
    component: MarketView,
    meta: { navKey: 'market' },
  },
  {
    path: '/board',
    name: 'board',
    component: BoardView,
    meta: { navKey: 'board' },
  },
  {
    path: '/board/write',
    name: 'board-write',
    component: BoardWriteView,
    meta: { navKey: 'board' },
  },
  {
    path: '/board/:boardId',
    name: 'board-detail',
    component: BoardDetailView,
    meta: { navKey: 'board' },
  },
  {
    path: '/ledger',
    name: 'ledger',
    component: LedgerView,
    meta: { navKey: 'ledger' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { navKey: 'profile' },
  },
  {
    path: '/auth',
    name: 'auth',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: AuthView,
    meta: { navKey: 'auth' },
  },
  {
    path: '/signup',
    name: 'signup',
    component: AuthView,
    meta: { navKey: 'auth' },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterProductView,
    meta: { navKey: 'register' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
