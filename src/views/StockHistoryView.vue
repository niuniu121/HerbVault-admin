<template>
  <div class="history-page">
    <section class="page-header-card">
      <div>
        <h2>Stock Logs</h2>
      </div>

      <div class="header-actions">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'usage' }"
          @click="activeTab = 'usage'"
        >
          Usage Log
        </button>

        <button
          class="tab-btn"
          :class="{ active: activeTab === 'manual-in' }"
          @click="activeTab = 'manual-in'"
        >
          Manual Stock-In
        </button>

        <button
          class="tab-btn"
          :class="{ active: activeTab === 'incoming' }"
          @click="activeTab = 'incoming'"
        >
          Incoming Log
        </button>
      </div>
    </section>

    <section class="toolbar-card">
      <div class="toolbar-left">
        <div class="date-field">
          <label>Search by Date</label>
          <input v-model="selectedDate" type="date" class="date-input" />
        </div>

        <button class="ghost-btn" @click="clearDateFilter">Clear</button>
      </div>

      <div class="toolbar-right">
        <button class="primary-btn" @click="exportCurrentReport">
          Export {{ exportTitle }} Report
        </button>
      </div>
    </section>

    <section v-if="loading" class="empty-card">
      <p>Loading history...</p>
    </section>

    <section v-else-if="groupedLogs.length === 0" class="empty-card">
      <p>No history found.</p>
    </section>

    <section v-else class="history-groups">
      <div v-for="group in paginatedGroups" :key="group.key" class="history-day-card">
        <div class="history-day-header clickable" @click="toggleDay(group.key)">
          <div class="day-left">
            <h3>{{ group.label }}</h3>
            <p>{{ group.items.length }} records</p>
          </div>

          <div class="day-right">
            <div class="day-info-chip neutral-chip">{{ group.items.length }} records</div>

            <div class="day-info-chip" :class="chipClass">{{ chipTitle }}: {{ group.total }}</div>

            <button class="expand-btn">
              {{ isExpanded(group.key) ? 'Hide' : 'View' }}
            </button>
          </div>
        </div>

        <transition name="collapse-fade">
          <div v-if="isExpanded(group.key)">
            <div class="history-table-head">
              <div class="col-time">Time</div>
              <div class="col-herb">Herb</div>
              <div class="col-category">Category</div>
              <div class="col-change">{{ qtyTitle }}</div>
              <div class="col-stock">Stock After</div>
            </div>

            <div class="history-list">
              <div v-for="item in group.items" :key="item.id" class="history-row">
                <div class="col-time">
                  {{ formatTime(item.dateObj) }}
                </div>

                <div class="col-herb">
                  <div class="herb-main">{{ item.herbNameCn || item.herbName || '-' }}</div>
                </div>

                <div class="col-category">
                  <span class="category-pill">{{ item.category || '-' }}</span>
                </div>

                <div class="col-change">
                  <span class="change-chip" :class="chipClass">
                    {{ chipSign }}{{ Math.abs(Number(item.change || 0)) }}
                  </span>
                </div>

                <div class="col-stock">
                  {{ Number(item.stock || 0) }}
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </section>

    <section v-if="groupedLogs.length > 0" class="pagination-bar">
      <button class="page-btn" :disabled="currentPage === 1" @click="prevPage">Prev</button>

      <span class="page-text"> Page {{ currentPage }} / {{ totalPages }} </span>

      <button class="page-btn" :disabled="currentPage === totalPages" @click="nextPage">
        Next
      </button>
    </section>

    <transition name="toast-fade">
      <div v-if="toast.show" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'

const LOGS = 'stock_logs'

const loading = ref(true)
const selectedDate = ref('')
const activeTab = ref('usage')
const logs = ref([])

const currentPage = ref(1)
const pageSize = 7
const expandedDays = ref({})

const toast = ref({
  show: false,
  message: '',
  type: 'success',
})

function showToast(message, type = 'success') {
  toast.value = {
    show: true,
    message,
    type,
  }

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

function formatDateLabel(date) {
  if (!date) return 'Unknown Date'

  const weekday = date.toLocaleDateString('en-AU', { weekday: 'long' })

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${weekday} ${day}/${month}/${year}`
}

function formatDateKey(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(date) {
  if (!date) return '-'
  return date.toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

async function loadLogs() {
  loading.value = true
  try {
    const q = query(collection(db, LOGS), orderBy('timestamp', 'desc'))
    const snap = await getDocs(q)

    logs.value = snap.docs.map((docItem) => {
      const data = docItem.data()
      const dateObj = toJsDate(data.timestamp)

      return {
        id: docItem.id,
        ...data,
        dateObj,
        dateKey: formatDateKey(dateObj),
        dateLabel: formatDateLabel(dateObj),
      }
    })
  } catch (error) {
    console.error('loadLogs error:', error)
    showToast(error.message || 'Failed to load history.', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})

watch([activeTab, selectedDate], () => {
  currentPage.value = 1
  expandedDays.value = {}
})

const usageLogs = computed(() => {
  return logs.value.filter((item) => {
    const change = Number(item.change || 0)
    return item.type === 'manual_update' && change < 0
  })
})

const manualInLogs = computed(() => {
  return logs.value.filter((item) => {
    const change = Number(item.change || 0)
    return item.type === 'manual_update' && change > 0
  })
})

const incomingLogs = computed(() => {
  return logs.value.filter((item) => item.type === 'import')
})

const currentTabLogs = computed(() => {
  if (activeTab.value === 'usage') return usageLogs.value
  if (activeTab.value === 'manual-in') return manualInLogs.value
  return incomingLogs.value
})

const filteredLogs = computed(() => {
  if (!selectedDate.value) return currentTabLogs.value
  return currentTabLogs.value.filter((item) => item.dateKey === selectedDate.value)
})

const groupedLogs = computed(() => {
  const map = new Map()

  filteredLogs.value.forEach((item) => {
    if (!map.has(item.dateKey)) {
      map.set(item.dateKey, {
        key: item.dateKey,
        label: item.dateLabel,
        items: [],
        total: 0,
      })
    }

    const group = map.get(item.dateKey)
    group.items.push(item)
    group.total += Math.abs(Number(item.change || 0))
  })

  return [...map.values()]
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(groupedLogs.value.length / pageSize))
})

const paginatedGroups = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return groupedLogs.value.slice(start, end)
})

const exportTitle = computed(() => {
  if (activeTab.value === 'usage') return 'Usage'
  if (activeTab.value === 'manual-in') return 'Manual Stock-In'
  return 'Incoming'
})

const qtyTitle = computed(() => {
  if (activeTab.value === 'usage') return 'Used Qty'
  if (activeTab.value === 'manual-in') return 'Manual In Qty'
  return 'Incoming Qty'
})

const chipTitle = computed(() => {
  if (activeTab.value === 'usage') return 'Used'
  if (activeTab.value === 'manual-in') return 'Manual In'
  return 'Imported'
})

const chipSign = computed(() => {
  return activeTab.value === 'usage' ? '-' : '+'
})

const chipClass = computed(() => {
  return activeTab.value === 'usage' ? 'usage-chip' : 'incoming-chip'
})

function clearDateFilter() {
  selectedDate.value = ''
}

function toggleDay(dateKey) {
  expandedDays.value[dateKey] = !expandedDays.value[dateKey]
}

function isExpanded(dateKey) {
  return !!expandedDays.value[dateKey]
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function exportCurrentReport() {
  try {
    const rows = filteredLogs.value.map((item) => ({
      date: item.dateKey,
      time: formatTime(item.dateObj),
      herbName: item.herbNameCn || item.herbName || '',
      category: item.category || '',
      change: Math.abs(Number(item.change || 0)),
      stockAfter: Number(item.stock || 0),
      operator: item.operator?.email || item.operatorEmail || '',
      logType:
        activeTab.value === 'usage'
          ? 'usage'
          : activeTab.value === 'manual-in'
            ? 'manual-stock-in'
            : 'incoming',
    }))

    if (rows.length === 0) {
      showToast('No records to export.', 'error')
      return
    }

    const headers = Object.keys(rows[0])
    const csvLines = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((key) => {
            const value = String(row[key] ?? '').replaceAll('"', '""')
            return `"${value}"`
          })
          .join(','),
      ),
    ]

    const csvContent = '\uFEFF' + csvLines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    const today = selectedDate.value || 'all-dates'
    const reportName =
      activeTab.value === 'usage'
        ? `usage-report-${today}.csv`
        : activeTab.value === 'manual-in'
          ? `manual-stock-in-report-${today}.csv`
          : `incoming-report-${today}.csv`

    a.href = url
    a.download = reportName
    a.click()

    URL.revokeObjectURL(url)
    showToast('Report exported successfully')
  } catch (error) {
    console.error('exportCurrentReport error:', error)
    showToast('Export failed.', 'error')
  }
}
</script>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header-card,
.toolbar-card,
.history-day-card,
.empty-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.page-header-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #799483;
}

.page-header-card h2 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  color: #173c2f;
}

.page-desc {
  margin: 10px 0 0;
  color: #6b7280;
  line-height: 1.6;
  max-width: 660px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.tab-btn,
.primary-btn,
.ghost-btn {
  border-radius: 14px;
  height: 42px;
  padding: 0 16px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.tab-btn {
  border: 1px solid #d9e1db;
  background: #f7faf8;
  color: #355447;
}

.tab-btn.active,
.primary-btn {
  border: none;
  background: #184c3b;
  color: #fff;
}

.ghost-btn {
  border: 1px solid #d9e1db;
  background: #ffffff;
  color: #355447;
}

.tab-btn:hover,
.primary-btn:hover,
.ghost-btn:hover {
  transform: translateY(-1px);
}

.toolbar-card {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: end;
  gap: 12px;
  flex-wrap: wrap;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-field label {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
}

.date-input {
  height: 46px;
  min-width: 220px;
  border: 1px solid #d8dee7;
  border-radius: 14px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  background: #fff;
}

.date-input:focus {
  border-color: #1c5b47;
  box-shadow: 0 0 0 4px rgba(28, 91, 71, 0.08);
}

.history-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.history-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 0;
}

.clickable {
  cursor: pointer;
}

.day-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-day-header h3 {
  margin: 0;
  font-size: 22px;
  color: #173c2f;
}

.history-day-header p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.day-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.day-info-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.neutral-chip {
  background: #f4f6f8;
  color: #506072;
}

.history-table-head {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) 200px 140px 130px;
  gap: 14px;
  padding: 18px 14px 10px;
  border-bottom: 1px solid #edf2ef;
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 800;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) 200px 140px 130px;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px solid #e7eeea;
  border-radius: 18px;
  background: linear-gradient(180deg, #fbfcfb 0%, #f7faf8 100%);
  transition: 0.2s ease;
}

.history-row:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.herb-main {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  background: #f4f6f8;
  color: #506072;
  font-size: 12px;
  font-weight: 700;
}

.day-total-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.change-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 800;
}

.usage-chip {
  background: #fff1f2;
  color: #dc2626;
}

.incoming-chip {
  background: #edf8f1;
  color: #24995b;
}

.expand-btn {
  border: 1px solid #d9e1db;
  background: #ffffff;
  color: #355447;
  border-radius: 12px;
  height: 36px;
  padding: 0 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.expand-btn:hover {
  transform: translateY(-1px);
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 6px;
}

.page-btn {
  border: none;
  background: #184c3b;
  color: #fff;
  border-radius: 12px;
  height: 40px;
  padding: 0 16px;
  font-weight: 700;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-text {
  font-size: 14px;
  font-weight: 700;
  color: #355447;
}

.empty-card {
  text-align: center;
  color: #6b7280;
  font-weight: 700;
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
.toast-fade-leave-active,
.collapse-fade-enter-active,
.collapse-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to,
.collapse-fade-enter-from,
.collapse-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 1280px) {
  .history-table-head,
  .history-row {
    grid-template-columns: 120px minmax(0, 1fr) 170px 120px 110px;
  }
}

@media (max-width: 900px) {
  .page-header-card,
  .toolbar-card {
    flex-direction: column;
    align-items: stretch;
  }

  .history-table-head {
    display: none;
  }

  .history-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .day-right {
    justify-content: flex-start;
  }

  .pagination-bar {
    flex-wrap: wrap;
  }

  .toast {
    right: 14px;
    left: 14px;
    max-width: none;
    min-width: auto;
  }
}
</style>
