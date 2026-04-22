<template>
  <div class="issued-page">
    <section class="page-header-card">
      <div>
        <h2>Prescriptions Details</h2>
      </div>

      <div class="header-summary">
        <button
          class="ghost-btn"
          :disabled="prescriptions.length === 0"
          @click="exportAllPrescriptions"
        >
          Export All
        </button>

        <span class="summary-pill">{{ filteredPrescriptions.length }} prescriptions</span>
      </div>
    </section>

    <section class="toolbar-card">
      <input
        v-model.trim="searchKeyword"
        class="search-input"
        type="text"
        placeholder="Search prescription name / herb / function / notes..."
      />

      <select v-model="searchField" class="filter-select">
        <option value="all">All</option>
        <option value="title">Prescription Name</option>
        <option value="herb">Herb</option>
        <option value="function">Functions</option>
        <option value="notes">Notes</option>
        <option value="date">Date</option>
      </select>
    </section>

    <section v-if="loading" class="empty-card">
      <p>Loading issued prescriptions...</p>
    </section>

    <section v-else class="list-card">
      <div v-if="paginatedPrescriptions.length" class="issued-list">
        <div v-for="item in paginatedPrescriptions" :key="item.id" class="issued-item">
          <button class="issued-trigger" @click="toggleOpen(item.id)">
            <div class="issued-trigger-left">
              <div class="issued-title">{{ item.title || 'Untitled Prescription' }}</div>
              <div class="issued-time">{{ formatDate(item.createdAt) }}</div>
            </div>

            <div class="issued-trigger-right">
              <span class="count-pill">{{ (item.items || []).length }} herbs</span>
              <span class="chevron" :class="{ open: isOpen(item.id) }">▾</span>
            </div>
          </button>

          <transition name="expand-fade">
            <div v-if="isOpen(item.id)" class="issued-panel">
              <div class="panel-top-actions">
                <button class="ghost-btn small-btn" @click="exportSinglePrescription(item)">
                  Export
                </button>
              </div>

              <div class="issued-meta-grid">
                <div class="meta-box">
                  <span class="meta-label">Target Total</span>
                  <strong>{{ item.targetTotal || '-' }}g</strong>
                </div>

                <div class="meta-box">
                  <span class="meta-label">Granule Ratio</span>
                  <strong>{{ item.granuleRatio || '-' }}</strong>
                </div>

                <div class="meta-box">
                  <span class="meta-label">Times / Day</span>
                  <strong>{{ item.timesPerDay || '-' }}</strong>
                </div>

                <div class="meta-box">
                  <span class="meta-label">Days</span>
                  <strong>{{ item.totalDays || '-' }}</strong>
                </div>
              </div>

              <div v-if="item.notes" class="notes-box">
                <div class="notes-label">Notes</div>
                <div class="notes-text">{{ item.notes }}</div>
              </div>

              <div class="herb-list">
                <div
                  v-for="(herb, idx) in getSortedItems(item.items || [])"
                  :key="`${item.id}-${idx}`"
                  class="herb-card"
                >
                  <div class="herb-top">
                    <div class="herb-top-left">
                      <span class="sequence-badge">
                        {{ getLiveSequenceCode(herb) || herb.sequenceCode || '-' }}
                      </span>

                      <div class="herb-main">
                        <div class="herb-name-line">
                          <span class="herb-name">
                            {{ herb.herbName || herb.inputName || 'Unknown Herb' }}
                          </span>
                          <span class="herb-dose">{{ herb.grams || '10' }}g</span>
                        </div>

                        <div class="herb-subline">
                          <span class="category-pill">
                            {{ normalizeCategoryName(herb.category || '') }}
                          </span>

                          <span v-if="herb.pinyin" class="pinyin-text">
                            {{ herb.pinyin }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="getHerbFunctions(herb)" class="functions-box">
                    <div class="functions-label">Functions</div>
                    <div
                      class="functions-text"
                      v-html="formatMultilineText(getHerbFunctions(herb))"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div v-else class="empty-card inner-empty">
        <p>No issued prescriptions found.</p>
      </div>

      <div v-if="totalPages > 1" class="pagination-bar">
        <button class="ghost-btn small-btn" :disabled="currentPage === 1" @click="goToPrevPage">
          Previous
        </button>

        <div class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</div>

        <button
          class="ghost-btn small-btn"
          :disabled="currentPage === totalPages"
          @click="goToNextPage"
        >
          Next
        </button>
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
import { computed, onMounted, ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'

const HERBS = 'herbs'
const PRESCRIPTIONS = 'prescriptions'
const PAGE_SIZE = 10

const loading = ref(true)
const prescriptions = ref([])
const herbs = ref([])
const searchKeyword = ref('')
const searchField = ref('all')
const currentPage = ref(1)
const openIds = ref([])

const toast = ref({
  show: false,
  message: '',
  type: 'success',
})

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 2200)
}

function normalizeCategoryName(name) {
  return String(name || '')
    .replace(/^[A-Z]+\.\s*/, '')
    .trim()
}

function normalizeString(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatMultilineText(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  return escapeHtml(text).replace(/\n/g, '<br />')
}

function isRealHerb(herb) {
  return herb?.nameCn && herb.nameCn !== '添加药材'
}

async function loadHerbs() {
  const snap = await getDocs(collection(db, HERBS))
  herbs.value = snap.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
    }))
    .filter((item) => isRealHerb(item))
}

async function loadPrescriptions() {
  const q = query(collection(db, PRESCRIPTIONS), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  prescriptions.value = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }))
}

onMounted(async () => {
  try {
    loading.value = true
    await Promise.all([loadHerbs(), loadPrescriptions()])
  } catch (error) {
    console.error('load issued prescriptions error:', error)
    showToast('Load failed', 'error')
  } finally {
    loading.value = false
  }
})

watch([searchKeyword, searchField], () => {
  currentPage.value = 1
})

const herbIdLookupMap = computed(() => {
  const map = new Map()
  herbs.value.forEach((item) => {
    if (item.id) {
      map.set(String(item.id), item)
    }
  })
  return map
})

const herbNameLookupMap = computed(() => {
  const map = new Map()
  herbs.value.forEach((item) => {
    map.set(normalizeString(item.nameCn), item)
  })
  return map
})

function getLiveHerbRecord(savedHerb) {
  if (!savedHerb) return null

  const herbId = String(savedHerb.herbId || '').trim()
  if (herbId && herbIdLookupMap.value.has(herbId)) {
    return herbIdLookupMap.value.get(herbId)
  }

  const herbName = normalizeString(savedHerb.herbName || savedHerb.inputName)
  if (herbName && herbNameLookupMap.value.has(herbName)) {
    return herbNameLookupMap.value.get(herbName)
  }

  return null
}

function getLiveSequenceCode(savedHerb) {
  const liveHerb = getLiveHerbRecord(savedHerb)
  return liveHerb?.sequenceCode || savedHerb?.sequenceCode || ''
}

function getHerbFunctions(savedHerb) {
  if (String(savedHerb?.functions || '').trim()) {
    return String(savedHerb.functions).trim()
  }

  const liveHerb = getLiveHerbRecord(savedHerb)
  return String(liveHerb?.functions || '').trim()
}

function formatDate(value) {
  if (!value) return 'Just now'

  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  return date.toLocaleString()
}

function getSortedItems(items) {
  return [...items].sort((a, b) => {
    if (Number(a.groupOrder || 0) !== Number(b.groupOrder || 0)) {
      return Number(a.groupOrder || 0) - Number(b.groupOrder || 0)
    }
    return Number(a.defaultOrder || 0) - Number(b.defaultOrder || 0)
  })
}

function isOpen(id) {
  return openIds.value.includes(id)
}

function toggleOpen(id) {
  if (isOpen(id)) {
    openIds.value = openIds.value.filter((item) => item !== id)
  } else {
    openIds.value = [...openIds.value, id]
  }
}

function buildExportRowsFromPrescription(item) {
  const titleText = item.title || 'Untitled Prescription'
  const notesText = item.notes || ''

  return getSortedItems(item.items || []).map((herb, index) => ({
    处方名: index === 0 ? titleText : '',
    时间: index === 0 ? formatDate(item.createdAt) : '',
    目标总量: index === 0 ? `${item.targetTotal || '-'}g` : '',
    浓缩比: index === 0 ? item.granuleRatio || '-' : '',
    次数每天: index === 0 ? item.timesPerDay || '-' : '',
    天数: index === 0 ? item.totalDays || '-' : '',
    序号: getLiveSequenceCode(herb) || herb.sequenceCode || '',
    药名: herb.herbName || herb.inputName || '',
    剂量: `${herb.grams || '10'}g`,
    分类: normalizeCategoryName(herb.category || ''),
    拼音: herb.pinyin || '',
    功能说明: getHerbFunctions(herb) || '',
    Notes: index === 0 ? notesText : '',
  }))
}

function buildExportRowsForAllPrescriptions(list) {
  const rows = []

  list.forEach((item, index) => {
    rows.push(...buildExportRowsFromPrescription(item))

    if (index !== list.length - 1) {
      rows.push({
        处方名: '',
        时间: '',
        目标总量: '',
        浓缩比: '',
        次数每天: '',
        天数: '',
        序号: '',
        药名: '',
        剂量: '',
        分类: '',
        拼音: '',
        功能说明: '',
        Notes: '',
      })
    }
  })

  return rows
}

function exportWorkbook(rows, filenameBase, sheetName = 'Issued Prescriptions') {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const safeName = String(filenameBase || 'issued-prescriptions')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()

  XLSX.writeFile(workbook, `${safeName || 'issued-prescriptions'}.xlsx`)
}

function exportSinglePrescription(item) {
  try {
    const rows = buildExportRowsFromPrescription(item)
    exportWorkbook(rows, item.title || 'issued-prescription', 'Issued Prescription')
    showToast('Prescription exported')
  } catch (error) {
    console.error('exportSinglePrescription error:', error)
    showToast('Export failed', 'error')
  }
}

function exportAllPrescriptions() {
  try {
    if (!prescriptions.value.length) {
      showToast('No prescriptions to export', 'error')
      return
    }

    const rows = buildExportRowsForAllPrescriptions(prescriptions.value)
    exportWorkbook(rows, 'all-issued-prescriptions', 'Issued Prescriptions')
    showToast('All prescriptions exported')
  } catch (error) {
    console.error('exportAllPrescriptions error:', error)
    showToast('Export failed', 'error')
  }
}

const filteredPrescriptions = computed(() => {
  const keyword = normalizeString(searchKeyword.value)
  if (!keyword) return prescriptions.value

  return prescriptions.value.filter((item) => {
    const titleText = normalizeString(item.title)
    const notesText = normalizeString(item.notes)
    const dateText = normalizeString(formatDate(item.createdAt))

    const herbText = normalizeString(
      (item.items || [])
        .map((herb) => {
          const herbName = herb.herbName || herb.inputName || ''
          const herbFunctions = getHerbFunctions(herb)
          return `${herbName} ${herbFunctions} ${herb.pinyin || ''}`
        })
        .join(' '),
    )

    if (searchField.value === 'title') {
      return titleText.includes(keyword)
    }

    if (searchField.value === 'notes') {
      return notesText.includes(keyword)
    }

    if (searchField.value === 'date') {
      return dateText.includes(keyword)
    }

    if (searchField.value === 'herb') {
      return herbText.includes(keyword)
    }

    if (searchField.value === 'function') {
      return herbText.includes(keyword)
    }

    return (
      titleText.includes(keyword) ||
      notesText.includes(keyword) ||
      dateText.includes(keyword) ||
      herbText.includes(keyword)
    )
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredPrescriptions.value.length / PAGE_SIZE))
})

const paginatedPrescriptions = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return filteredPrescriptions.value.slice(start, end)
})

function goToPrevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function goToNextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}
</script>

<style scoped>
.issued-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header-card,
.toolbar-card,
.list-card,
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

.page-header-card h2 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  color: #173c2f;
}

.page-subtitle {
  margin: 10px 0 0;
  color: #6b7280;
  font-weight: 600;
}

.header-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.summary-pill,
.count-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #eef5f1;
  color: #184c3b;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.toolbar-card {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) 220px;
  gap: 18px;
  align-items: center;
}

.search-input,
.filter-select {
  width: 100%;
  height: 48px;
  border: 1px solid #d8dee7;
  border-radius: 14px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  background: #fff;
  box-sizing: border-box;
}

.search-input:focus,
.filter-select:focus {
  border-color: #1c5b47;
  box-shadow: 0 0 0 4px rgba(28, 91, 71, 0.08);
}

.issued-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.issued-item {
  border: 1px solid #e7eeea;
  border-radius: 20px;
  background: linear-gradient(180deg, #fbfcfb 0%, #f7faf8 100%);
  overflow: hidden;
}

.issued-trigger {
  width: 100%;
  border: none;
  background: transparent;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  text-align: left;
  cursor: pointer;
}

.issued-trigger-left {
  min-width: 0;
}

.issued-title {
  font-size: 18px;
  font-weight: 800;
  color: #173c2f;
}

.issued-time {
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.issued-trigger-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.chevron {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #f5f7fb;
  color: #355447;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

.issued-panel {
  padding: 0 18px 18px;
}

.panel-top-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.issued-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.meta-box {
  border-radius: 16px;
  background: #f8fbf9;
  border: 1px solid #e7eeea;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-label {
  font-size: 12px;
  font-weight: 800;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.meta-box strong {
  color: #173c2f;
  font-size: 15px;
}

.notes-box {
  margin-bottom: 16px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #edf2ef;
  padding: 14px 16px;
}

.notes-label {
  font-size: 12px;
  font-weight: 800;
  color: #6b7280;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.notes-text {
  color: #355447;
  font-size: 14px;
  line-height: 1.7;
}

.herb-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.herb-card {
  border-radius: 18px;
  border: 1px solid #e7eeea;
  background: #ffffff;
  padding: 14px;
}

.herb-top-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.sequence-badge {
  min-width: 52px;
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #184c3b;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.herb-main {
  min-width: 0;
  flex: 1;
}

.herb-name-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.herb-name {
  font-size: 15px;
  font-weight: 800;
  color: #173c2f;
}

.herb-dose {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef5f1;
  color: #184c3b;
  font-size: 12px;
  font-weight: 800;
}

.herb-subline {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f5f7fb;
  color: #4b5563;
  font-size: 12px;
  font-weight: 800;
}

.pinyin-text {
  font-size: 13px;
  color: #6b7280;
  font-weight: 700;
}

.functions-box {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fbf9;
  border: 1px dashed #d7e7dd;
}

.functions-label {
  font-size: 12px;
  font-weight: 800;
  color: #184c3b;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.functions-text {
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
  white-space: normal;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin-top: 18px;
}

.page-indicator {
  font-size: 13px;
  font-weight: 800;
  color: #355447;
}

.ghost-btn {
  border-radius: 14px;
  height: 42px;
  padding: 0 16px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9e1db;
  background: #ffffff;
  color: #355447;
}

.small-btn {
  height: 36px;
  padding: 0 14px;
  font-size: 13px;
}

.ghost-btn:hover {
  transform: translateY(-1px);
}

.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  min-width: 180px;
  max-width: 320px;
  padding: 14px 16px;
  border-radius: 14px;
  color: #fff;
  font-weight: 800;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);
  z-index: 999;
}

.toast.success {
  background: #184c3b;
}

.toast.error {
  background: #dc2626;
}

.toast-fade-enter-active,
.toast-fade-leave-active,
.expand-fade-enter-active,
.expand-fade-leave-active {
  transition: all 0.24s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to,
.expand-fade-enter-from,
.expand-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.empty-card,
.inner-empty {
  text-align: center;
  color: #6b7280;
  font-weight: 700;
}

@media (max-width: 960px) {
  .toolbar-card {
    grid-template-columns: 1fr;
  }

  .issued-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page-header-card,
  .issued-trigger {
    flex-direction: column;
    align-items: stretch;
  }

  .issued-trigger-right {
    justify-content: space-between;
  }

  .issued-meta-grid {
    grid-template-columns: 1fr;
  }

  .header-summary {
    width: 100%;
    justify-content: flex-start;
  }

  .page-header-card h2 {
    font-size: 28px;
  }
}
</style>
