import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AdminLayout from '../views/AdminLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import HerbListView from '../views/HerbListView.vue'
import StockHistoryView from '../views/StockHistoryView.vue'
import SettingsView from '../views/SettingsView.vue'
import PrescriptionView from '../views/PrescriptionView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/',
    component: AdminLayout,
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
      },
      {
        path: 'herbs',
        name: 'herbs',
        component: HerbListView,
      },
      {
        path: 'history',
        name: 'history',
        component: StockHistoryView,
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView,
      },
      {
        path: '/prescriptions',
        component: PrescriptionView,
      }
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
