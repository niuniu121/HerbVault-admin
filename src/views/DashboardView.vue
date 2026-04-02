<template>
  <div class="dashboard-page">
    <section class="hero-card">
      <div class="hero-left">
        <h1>Welcome</h1>
        <div class="hero-actions">
          <button class="primary-btn" @click="router.push('/herbs')">Go to Herbs</button>
          <button class="ghost-btn" @click="router.push('/history')">View History</button>
        </div>
      </div>

      <div class="hero-logo-card">
        <img class="floating-logo" :src="logo" alt="HerbVault logo" />
      </div>
    </section>

    <!-- Top row -->
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-top">
          <p>Total Herbs</p>
          <span class="stat-icon green">✿</span>
        </div>
        <h2>{{ totalHerbs }}</h2>
        <p class="stat-sub">Total herbs currently stored in the system</p>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <p>Low Stock Items</p>
          <span class="stat-icon amber">!</span>
        </div>
        <h2>{{ lowStockItems.length }}</h2>
        <p class="stat-sub">Items at or below 3 bottles</p>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <p>Used Today</p>
          <span class="stat-icon mint">↺</span>
        </div>
        <h2>{{ usedToday }}</h2>
        <p class="stat-sub">Total quantity used today</p>
      </div>
    </section>

    <!-- Middle row -->
    <section class="middle-grid">
      <div class="panel-card">
        <div class="panel-head">
          <h3>Low Stock Alerts</h3>
          <span class="panel-badge danger">{{ lowStockItems.length }} items</span>
        </div>

        <div v-if="loading" class="panel-empty">Loading...</div>
        <div v-else-if="lowStockItems.length === 0" class="panel-empty">
          No low stock items right now.
        </div>
        <div v-else class="list-block scroll-list">
          <div v-for="item in lowStockItems" :key="item.id" class="list-row">
            <div>
              <div class="row-title">{{ item.nameCn }}</div>
              <div class="row-meta">{{ item.category || 'Uncategorised' }}</div>
            </div>
            <div class="pill danger-pill">{{ Number(item.stock || 0) }} 瓶</div>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-head">
          <h3>Recent Activity</h3>
          <span class="panel-badge neutral">{{ recentActivities.length }} recent</span>
        </div>

        <div v-if="loading" class="panel-empty">Loading...</div>
        <div v-else-if="recentActivities.length === 0" class="panel-empty">
          No recent stock activity.
        </div>
        <div v-else class="list-block activity-scroll">
          <div v-for="item in recentActivities" :key="item.id" class="list-row">
            <div>
              <div class="row-title">{{ item.herbNameCn || item.herbName || '-' }}</div>
              <div class="row-meta">
                {{ formatActivityLabel(item) }} · {{ formatDateTime(item.dateObj) }}
              </div>
            </div>

            <div
              class="pill"
              :class="
                item.change > 0 ? 'success-pill' : item.change < 0 ? 'danger-pill' : 'neutral-pill'
              "
            >
              {{ item.change > 0 ? '+' : '' }}{{ Number(item.change || 0) }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom row -->
    <section class="bottom-grid">
      <div class="panel-card">
        <div class="panel-head">
          <div>
            <h3>Top Used Herbs (60 Days)</h3>
            <p class="panel-note">By usage count and total quantity used</p>
          </div>
          <span class="panel-badge success">{{ topUsedHerbs.length }} items</span>
        </div>

        <div v-if="loading" class="panel-empty">Loading...</div>
        <div v-else-if="topUsedHerbs.length === 0" class="panel-empty">
          No usage records in the last 60 days.
        </div>
        <div v-else class="ranking-list">
          <div v-for="(item, index) in topUsedHerbs" :key="item.herbName" class="ranking-row">
            <div class="rank-left">
              <span class="rank-index">{{ index + 1 }}</span>
              <div>
                <div class="row-title">{{ item.herbName }}</div>
                <div class="row-meta">{{ item.category || 'Uncategorised' }}</div>
              </div>
            </div>

            <div class="rank-right">
              <div class="metric">
                <span class="metric-label">Count</span>
                <strong>{{ item.usageCount }}</strong>
              </div>
              <div class="metric">
                <span class="metric-label">Used</span>
                <strong>{{ item.totalUsed }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-head">
          <div>
            <h3>Least Used Herbs (60 Days)</h3>
          </div>
          <span class="panel-badge neutral">
            {{ leastUsedHerbs.length > 0 ? `${leastUsedHerbs.length} items` : 'No data' }}
          </span>
        </div>

        <div v-if="loading" class="panel-empty">Loading...</div>
        <div v-else-if="leastUsedHerbs.length === 0" class="panel-empty">
          No meaningful data yet
        </div>
        <div v-else class="ranking-list">
          <div v-for="(item, index) in leastUsedHerbs" :key="item.herbName" class="ranking-row">
            <div class="rank-left">
              <span class="rank-index soft">{{ index + 1 }}</span>
              <div>
                <div class="row-title">{{ item.herbName }}</div>
                <div class="row-meta">
                  {{ item.category || 'Uncategorised' }}
                  <template v-if="item.usageCount === 0"> · No usage in 60 days</template>
                </div>
              </div>
            </div>

            <div class="rank-right">
              <div class="metric">
                <span class="metric-label">Count</span>
                <strong>{{ item.usageCount }}</strong>
              </div>
              <div class="metric">
                <span class="metric-label">Used</span>
                <strong>{{ item.totalUsed }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <transition name="toast-fade">
      <div v-if="toast.show" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'
import logo from '../assets/logo.svg'

const router = useRouter()

const HERBS = 'herbs'
const LOGS = 'stock_logs'

const loading = ref(true)
const herbs = ref([])
const logs = ref([])

const toast = ref({
  show: false,
  message: '',
  type: 'success',
})

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  window.clearTimeout(showToast._timer)
  showToast._timer = window.setTimeout(() => {
    toast.value.show = false
  }, 2200)
}

function toJsDate(rawTimestamp) {
  if (!rawTimestamp) return null
  if (typeof rawTimestamp.toDate === 'function') return rawTimestamp.toDate()
  return new Date(rawTimestamp)
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function getSixtyDaysAgo() {
  const now = new Date()
  const d = new Date(now)
  d.setDate(now.getDate() - 60)
  return d
}

function formatDateTime(date) {
  if (!date) return '-'
  return date.toLocaleString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatActivityLabel(item) {
  if (item.type === 'import') return 'Excel import'
  if (item.type === 'manual_update') {
    return Number(item.change || 0) < 0 ? 'Usage update' : 'Manual stock-in'
  }
  return item.type || 'Update'
}

async function loadDashboardData() {
  loading.value = true
  try {
    const herbsSnap = await getDocs(collection(db, HERBS))
    herbs.value = herbsSnap.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }))

    const logsQuery = query(collection(db, LOGS), orderBy('timestamp', 'desc'))
    const logsSnap = await getDocs(logsQuery)
    logs.value = logsSnap.docs.map((docItem) => {
      const data = docItem.data()
      return {
        id: docItem.id,
        ...data,
        dateObj: toJsDate(data.timestamp),
      }
    })
  } catch (error) {
    console.error('loadDashboardData error:', error)
    showToast(error.message || 'Failed to load dashboard.', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})

const totalHerbs = computed(() => herbs.value.length)

const lowStockItems = computed(() => {
  return [...herbs.value]
    .filter((item) => Number(item.stock || 0) <= 3)
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
})

const usedToday = computed(() => {
  const todayStart = startOfToday()
  return logs.value
    .filter((item) => {
      const change = Number(item.change || 0)
      return (
        item.type === 'manual_update' && change < 0 && item.dateObj && item.dateObj >= todayStart
      )
    })
    .reduce((sum, item) => sum + Math.abs(Number(item.change || 0)), 0)
})

const recentActivities = computed(() => {
  return logs.value.slice(0, 6)
})

const last60DaysUsageLogs = computed(() => {
  const cutoff = getSixtyDaysAgo()
  return logs.value.filter((item) => {
    const change = Number(item.change || 0)
    return item.type === 'manual_update' && change < 0 && item.dateObj && item.dateObj >= cutoff
  })
})

const usageSummaryAll = computed(() => {
  const map = new Map()

  herbs.value.forEach((item) => {
    const herbName = item.nameCn || 'Unknown Herb'
    map.set(herbName, {
      herbName,
      category: item.category || '',
      usageCount: 0,
      totalUsed: 0,
    })
  })

  last60DaysUsageLogs.value.forEach((item) => {
    const herbName = item.herbNameCn || item.herbName || 'Unknown Herb'

    if (!map.has(herbName)) {
      map.set(herbName, {
        herbName,
        category: item.category || '',
        usageCount: 0,
        totalUsed: 0,
      })
    }

    const target = map.get(herbName)
    target.usageCount += 1
    target.totalUsed += Math.abs(Number(item.change || 0))
  })

  return [...map.values()]
})

const topUsedHerbs = computed(() => {
  return usageSummaryAll.value
    .filter((item) => item.usageCount > 0)
    .sort((a, b) => {
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount
      return b.totalUsed - a.totalUsed
    })
    .slice(0, 6)
})

const leastUsedHerbs = computed(() => {
  const hasMeaningfulUsageData = usageSummaryAll.value.some((item) => item.usageCount > 0)

  if (!hasMeaningfulUsageData) {
    return []
  }

  const unused = usageSummaryAll.value
    .filter((item) => item.usageCount === 0)
    .sort((a, b) => a.herbName.localeCompare(b.herbName, 'zh-Hans-CN'))

  const lowUsed = usageSummaryAll.value
    .filter((item) => item.usageCount > 0)
    .sort((a, b) => {
      if (a.usageCount !== b.usageCount) return a.usageCount - b.usageCount
      return a.totalUsed - b.totalUsed
    })

  return [...unused, ...lowUsed].slice(0, 6)
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.hero-card,
.stat-card,
.panel-card {
  background: #ffffff;
  border-radius: 28px;
  padding: 15px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.hero-card {
  display: grid;
  grid-template-columns: 1.45fr 0.85fr;
  gap: 22px;
  align-items: center;
}

.hero-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #799483;
}

.hero-card h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  color: #173c2f;
}

.hero-desc {
  margin: 12px 0 0;
  color: #6b7280;
  line-height: 1.7;
  max-width: 680px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.hero-logo-card {
  min-height: 260px;
  border-radius: 28px;
  /*background: linear-gradient(180deg, #1e6a4e 0%, #185a43 100%);*/
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.floating-logo {
  width: min(72%, 200px);
  height: auto;
  display: block;
  animation: floatUpDown 3.8s ease-in-out infinite;
  filter: drop-shadow(0 18px 28px rgba(10, 37, 29, 0.18));
}

@keyframes floatUpDown {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-12px);
  }
  100% {
    transform: translateY(0px);
  }
}

.primary-btn,
.ghost-btn {
  height: 44px;
  border-radius: 14px;
  padding: 0 18px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s ease;
}

.primary-btn {
  border: none;
  background: #184c3b;
  color: #fff;
}

.ghost-btn {
  border: 1px solid #d9e1db;
  background: #fff;
  color: #355447;
}

.primary-btn:hover,
.ghost-btn:hover {
  transform: translateY(-1px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-top p {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #667085;
}

.stat-card h2 {
  margin: 18px 0 0;
  font-size: 48px;
  line-height: 1;
  color: #173c2f;
}

.stat-sub {
  margin: 18px 0 0;
  font-size: 14px;
  color: #8b96a7;
  line-height: 1.6;
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}

.stat-icon.green {
  background: #edf8f1;
  color: #1e7d4f;
}

.stat-icon.amber {
  background: #fff6e8;
  color: #d18a1d;
}

.stat-icon.mint {
  background: #eaf7ef;
  color: #2a8b60;
}

.middle-grid,
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.panel-head h3 {
  margin: 0;
  font-size: 18px;
  color: #173c2f;
}

.panel-note {
  margin: 8px 0 0;
  color: #7b8794;
  font-size: 13px;
  line-height: 1.5;
}

.panel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.panel-badge.danger {
  background: #fff1f2;
  color: #dc2626;
}

.panel-badge.success {
  background: #edf8f1;
  color: #24995b;
}

.panel-badge.neutral {
  background: #f3f5f7;
  color: #5f6f82;
}

.panel-empty {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b96a7;
  font-weight: 700;
  text-align: center;
}

.list-block,
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-row,
.ranking-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #e7eeea;
  border-radius: 18px;
  background: linear-gradient(180deg, #fbfcfb 0%, #f7faf8 100%);
}

.row-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
}

.row-meta {
  margin-top: 6px;
  font-size: 13px;
  color: #7b8794;
  line-height: 1.5;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.danger-pill {
  background: #fff1f2;
  color: #dc2626;
}

.success-pill {
  background: #edf8f1;
  color: #24995b;
}

.neutral-pill {
  background: #f3f5f7;
  color: #5f6f82;
}

.rank-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.rank-index {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #184c3b;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 20px;
  flex-shrink: 0;
}

.rank-index.soft {
  background: #eaf1ed;
  color: #355447;
}

.rank-right {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-shrink: 0;
  min-width: 120px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  min-width: 42px;
}

.metric-label {
  font-size: 12px;
  color: #7b8794;
  font-weight: 700;
}

.metric strong {
  font-size: 18px;
  color: #173c2f;
  line-height: 1;
}

.toast {
  position: fixed;
  top: 22px;
  right: 22px;
  z-index: 1200;
  min-width: 220px;
  max-width: 320px;
  padding: 14px 16px;
  border-radius: 16px;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.18);
}

.toast.success {
  background: #184c3b;
}

.toast.error {
  background: #dc2626;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.scroll-list {
  max-height: 560px;
  overflow-y: auto;
  padding-right: 6px;
}

.activity-scroll {
  max-height: 560px;
  overflow-y: auto;
  padding-right: 6px;
}

.scroll-list::-webkit-scrollbar,
.activity-scroll::-webkit-scrollbar {
  width: 8px;
}

.scroll-list::-webkit-scrollbar-thumb,
.activity-scroll::-webkit-scrollbar-thumb {
  background: #d7e2db;
  border-radius: 999px;
}

.scroll-list::-webkit-scrollbar-track,
.activity-scroll::-webkit-scrollbar-track {
  background: transparent;
}

@media (max-width: 1200px) {
  .hero-card,
  .middle-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .hero-logo-card {
    min-height: 220px;
  }

  .floating-logo {
    width: min(56%, 200px);
  }
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .rank-right {
    gap: 12px;
  }

  .metric {
    min-width: 36px;
  }

  .toast {
    right: 14px;
    left: 14px;
    max-width: none;
    min-width: auto;
  }
}
</style>
