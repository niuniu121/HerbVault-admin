import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../views/AdminLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import HerbListView from '../views/HerbListView.vue'
import StockHistoryView from '../views/StockHistoryView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  {
    path: '/',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
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
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
