<template>
  <div class="prescription-page">
    <section class="page-header-card">
      <div>
        <h2>Prescriptions</h2>
      </div>

      <div class="header-actions">
        <button class="ghost-btn" @click="addRow">Add Row</button>
        <button class="ghost-btn" @click="clearAll">Clear</button>
        <button class="primary-btn" :disabled="saving" @click="savePrescription">
          {{
            saving
              ? editingId
                ? 'Updating...'
                : 'Saving...'
              : editingId
                ? 'Update Prescription'
                : 'Save Prescription'
          }}
        </button>
      </div>
    </section>

    <section class="content-grid">
      <div class="left-panel card">
        <div class="section-top">
          <h3>Input</h3>
          <span class="section-badge">{{ inputRows.length }} items</span>
        </div>

        <div v-if="editingId" class="editing-banner">
          <div class="editing-text">
            <strong>Editing mode</strong>
            <span>You are updating an existing prescription.</span>
          </div>
          <button class="ghost-btn small-btn" @click="cancelEdit">Cancel Edit</button>
        </div>

        <div class="input-list">
          <div v-for="(row, index) in inputRows" :key="row.key" class="input-row-card">
            <div class="row-top">
              <span class="row-index">#{{ index + 1 }}</span>
              <button
                class="remove-btn"
                @click="confirmRemoveRow(index)"
                :disabled="inputRows.length === 1"
              >
                Remove
              </button>
            </div>

            <div class="row-fields">
              <div class="name-field">
                <label class="field-label">Herb Name</label>
                <input
                  v-model.trim="row.name"
                  class="row-input"
                  type="text"
                  placeholder="Type herb name..."
                  @keydown.enter.prevent="handleEnter(index)"
                />
              </div>

              <div class="gram-field">
                <label class="field-label">Dose (g)</label>
                <input
                  :value="row.grams"
                  class="gram-input"
                  type="text"
                  inputmode="decimal"
                  placeholder="Optional"
                  @input="handleGramsInput($event, row)"
                />
              </div>
            </div>

            <div class="row-meta">
              <template v-if="row.name && getMatchedHerb(row.name)">
                <span class="meta-pill success">
                  {{ getMatchedHerb(row.name).sequenceCode }}
                </span>
                <span class="meta-text">
                  {{ buildMetaDisplay(getMatchedHerb(row.name), row.grams) }}
                </span>
              </template>

              <template v-else-if="row.name">
                <span class="meta-pill error">Not Found</span>
                <span class="meta-text">Please check herb name</span>
              </template>

              <template v-else>
                <span class="meta-pill neutral">Empty</span>
                <span class="meta-text">Waiting for input</span>
              </template>
            </div>
          </div>
        </div>

        <div class="notes-area">
          <label>Notes</label>
          <textarea
            v-model.trim="notes"
            class="notes-input"
            placeholder="Optional notes for dispensing..."
          ></textarea>
        </div>
      </div>

      <div class="right-panel card">
        <div class="section-top">
          <h3>Prescription Preview</h3>
          <span class="section-badge">{{ previewItems.length }} matched</span>
        </div>

        <div v-if="previewItems.length" class="preview-list">
          <div
            v-for="(item, index) in previewItems"
            :key="`${item.herbId}-${index}`"
            class="preview-item"
          >
            <div class="preview-left">
              <span class="sequence-badge">{{ item.sequenceCode }}</span>
              <div class="preview-text">
                <div class="preview-name">
                  {{ formatHerbDisplay(item.herbName, item.grams) }}
                </div>
                <div class="preview-category">
                  {{ normalizeCategoryName(item.category) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">No matched herbs yet.</div>

        <div class="divider"></div>

        <div class="save-summary">
          <div class="summary-row">
            <span>Total Input</span>
            <strong>{{ inputRows.filter((item) => item.name).length }}</strong>
          </div>
          <div class="summary-row">
            <span>Matched</span>
            <strong>{{ previewItems.length }}</strong>
          </div>
          <div class="summary-row">
            <span>Unmatched</span>
            <strong>{{ unmatchedCount }}</strong>
          </div>
          <div class="summary-row">
            <span>With Notes</span>
            <strong>{{ notes ? 'Yes' : 'No' }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="history-card card">
      <div class="section-top history-top">
        <div>
          <h3>Recent Prescriptions</h3>
          <span class="history-subtitle">Search by herb name, notes, or date/time</span>
        </div>
        <span class="section-badge">{{ filteredPrescriptions.length }}</span>
      </div>

      <div class="history-toolbar">
        <input
          v-model.trim="searchKeyword"
          class="search-input"
          type="text"
          placeholder="Search by herb name, notes, or date..."
        />

        <select v-model="searchField" class="filter-select">
          <option value="all">All</option>
          <option value="herb">Herb Name</option>
          <option value="date">Date / Time</option>
          <option value="notes">Notes</option>
        </select>
      </div>

      <div v-if="paginatedPrescriptions.length" class="history-list">
        <div v-for="item in paginatedPrescriptions" :key="item.id" class="history-item">
          <div class="history-item-top">
            <div>
              <div class="history-title">Prescription</div>
              <div class="history-time">{{ formatDate(item.createdAt) }}</div>
            </div>

            <div class="history-item-actions">
              <button class="ghost-btn small-btn" @click="editPrescription(item)">Edit</button>
              <button class="danger-btn small-btn" @click="confirmDeletePrescription(item.id)">
                Delete
              </button>
            </div>
          </div>

          <div class="history-tags">
            <span
              v-for="(herb, idx) in item.items || []"
              :key="`${item.id}-${idx}`"
              class="history-tag"
            >
              {{ getLiveSequenceCode(herb) }}
              {{ formatHerbDisplay(herb.herbName || herb.inputName, herb.grams) }}
            </span>
          </div>

          <div v-if="item.notes" class="history-notes">
            <span class="history-notes-label">Notes</span>
            <p class="history-notes-text">{{ item.notes }}</p>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">No matching prescriptions found.</div>

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

    <transition name="dialog-fade">
      <div v-if="dialog.show" class="dialog-overlay" @click="closeDialog">
        <div class="dialog-card" @click.stop>
          <div class="dialog-icon" :class="dialog.type">
            {{ dialog.type === 'danger' ? '!' : '?' }}
          </div>

          <h4 class="dialog-title">{{ dialog.title }}</h4>
          <p class="dialog-message">{{ dialog.message }}</p>

          <div class="dialog-actions">
            <button class="ghost-btn dialog-btn" @click="closeDialog">Cancel</button>
            <button
              class="dialog-confirm-btn"
              :class="dialog.type === 'danger' ? 'danger' : 'neutral'"
              @click="handleDialogConfirm"
            >
              {{ dialog.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { auth, db } from '../services/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

const HERBS = 'herbs'
const PRESCRIPTIONS = 'prescriptions'
const PAGE_SIZE = 10

const herbs = ref([])
const prescriptions = ref([])
const saving = ref(false)
const notes = ref('')
const editingId = ref('')
const currentPage = ref(1)
const searchKeyword = ref('')
const searchField = ref('all')

const toast = ref({
  show: false,
  message: '',
  type: 'success',
})

const dialog = ref({
  show: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  type: 'neutral',
  action: null,
})

const inputRows = ref([createEmptyRow()])

function createEmptyRow(data = {}) {
  return {
    key: crypto.randomUUID(),
    name: data.name || '',
    grams: data.grams || '',
  }
}

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 2200)
}

function openDialog({
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  type = 'neutral',
  action = null,
}) {
  dialog.value = {
    show: true,
    title,
    message,
    confirmText,
    type,
    action,
  }
}

function closeDialog() {
  dialog.value = {
    show: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    type: 'neutral',
    action: null,
  }
}

async function handleDialogConfirm() {
  const action = dialog.value.action
  closeDialog()
  if (typeof action === 'function') {
    await action()
  }
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

function sanitizeGrams(value) {
  return String(value || '').trim()
}

function filterGramsInput(value) {
  const raw = String(value || '')
  let cleaned = raw.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')

  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join('')}`
  }

  return cleaned
}

function handleGramsInput(event, row) {
  const cleaned = filterGramsInput(event.target.value)
  row.grams = cleaned
  event.target.value = cleaned
}

function formatHerbDisplay(name, grams) {
  const cleanName = String(name || '').trim()
  const cleanGrams = sanitizeGrams(grams)
  return cleanGrams ? `${cleanName} ${cleanGrams}g` : cleanName
}

function buildMetaDisplay(herb, grams) {
  const category = normalizeCategoryName(herb?.category)
  const doseText = sanitizeGrams(grams) ? ` · ${sanitizeGrams(grams)}g` : ''
  return `${category}${doseText}`
}

function getAlphabetLabel(index) {
  let n = index + 1
  let result = ''

  while (n > 0) {
    n--
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26)
  }

  return result
}

function isRealHerb(herb) {
  return herb?.nameCn && herb.nameCn !== '添加药材'
}

async function loadHerbs() {
  const snap = await getDocs(collection(db, HERBS))
  herbs.value = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }))
}

async function loadPrescriptions() {
  try {
    const q = query(collection(db, PRESCRIPTIONS), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    prescriptions.value = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }))
  } catch (error) {
    console.error('loadPrescriptions error:', error)
  }
}

onMounted(async () => {
  await loadHerbs()
  await loadPrescriptions()
})

watch([searchKeyword, searchField], () => {
  currentPage.value = 1
})

const orderedRealHerbs = computed(() => {
  return herbs.value
    .filter((h) => isRealHerb(h))
    .slice()
    .sort((a, b) => {
      if (Number(a.groupOrder || 0) !== Number(b.groupOrder || 0)) {
        return Number(a.groupOrder || 0) - Number(b.groupOrder || 0)
      }
      return Number(a.defaultOrder || 0) - Number(b.defaultOrder || 0)
    })
})

const categoryOrderMap = computed(() => {
  const categories = [
    ...new Set(orderedRealHerbs.value.map((item) => item.category).filter(Boolean)),
  ]

  const map = new Map()
  categories.forEach((category, index) => {
    map.set(category, {
      index,
      letter: getAlphabetLabel(index),
    })
  })
  return map
})

const herbLookupList = computed(() => {
  return orderedRealHerbs.value.map((item) => {
    const categoryMeta = categoryOrderMap.value.get(item.category)
    return {
      ...item,
      sequenceCode: `${categoryMeta?.letter || ''}${Number(item.defaultOrder || 0)}`,
    }
  })
})

const herbLookupMap = computed(() => {
  const map = new Map()

  herbLookupList.value.forEach((item) => {
    map.set(normalizeString(item.nameCn), item)
  })

  return map
})

const herbIdLookupMap = computed(() => {
  const map = new Map()

  herbLookupList.value.forEach((item) => {
    if (item.id) {
      map.set(String(item.id), item)
    }
  })

  return map
})

function getMatchedHerb(inputName) {
  const key = normalizeString(inputName)
  if (!key) return null
  return herbLookupMap.value.get(key) || null
}

function getLiveHerbRecord(savedHerb) {
  if (!savedHerb) return null

  const herbId = String(savedHerb.herbId || '').trim()
  if (herbId && herbIdLookupMap.value.has(herbId)) {
    return herbIdLookupMap.value.get(herbId)
  }

  const herbName = normalizeString(savedHerb.herbName || savedHerb.inputName)
  if (herbName && herbLookupMap.value.has(herbName)) {
    return herbLookupMap.value.get(herbName)
  }

  return null
}

function getLiveSequenceCode(savedHerb) {
  const liveHerb = getLiveHerbRecord(savedHerb)
  return liveHerb?.sequenceCode || savedHerb?.sequenceCode || ''
}

const previewItems = computed(() => {
  return inputRows.value
    .map((row) => {
      const matched = getMatchedHerb(row.name)
      if (!matched) return null

      return {
        herbId: matched.id,
        herbName: matched.nameCn,
        category: matched.category,
        groupOrder: Number(matched.groupOrder || 0),
        defaultOrder: Number(matched.defaultOrder || 0),
        sequenceCode: matched.sequenceCode,
        grams: sanitizeGrams(row.grams),
        matched: true,
      }
    })
    .filter(Boolean)
})

const unmatchedCount = computed(() => {
  return inputRows.value.filter((row) => row.name && !getMatchedHerb(row.name)).length
})

function addRow() {
  inputRows.value.push(createEmptyRow())
}

function removeRow(index) {
  if (inputRows.value.length === 1) return
  inputRows.value.splice(index, 1)
}

function confirmRemoveRow(index) {
  if (inputRows.value.length === 1) return

  openDialog({
    title: 'Remove this herb?',
    message: 'This row will be removed from the current prescription.',
    confirmText: 'Remove',
    type: 'neutral',
    action: () => {
      removeRow(index)
      showToast('Row removed')
    },
  })
}

function clearAll() {
  inputRows.value = [createEmptyRow()]
  notes.value = ''
  editingId.value = ''
}

function cancelEdit() {
  clearAll()
  showToast('Edit cancelled', 'success')
}

function handleEnter(index) {
  if (index === inputRows.value.length - 1) {
    addRow()
  }
}

function getOperator() {
  return {
    uid: auth.currentUser?.uid || '',
    email: auth.currentUser?.email || '',
  }
}

async function savePrescription() {
  try {
    const rows = inputRows.value
      .map((row) => ({
        name: String(row.name || '').trim(),
        grams: sanitizeGrams(row.grams),
      }))
      .filter((row) => row.name)

    if (!rows.length) {
      showToast('Please enter at least one herb', 'error')
      return
    }

    if (rows.some((row) => !getMatchedHerb(row.name))) {
      showToast('Please resolve unmatched herb names first', 'error')
      return
    }

    saving.value = true

    const items = rows.map((row) => {
      const matched = getMatchedHerb(row.name)
      return {
        inputName: row.name,
        herbId: matched.id,
        herbName: matched.nameCn,
        category: matched.category,
        sequenceCode: matched.sequenceCode,
        groupOrder: Number(matched.groupOrder || 0),
        defaultOrder: Number(matched.defaultOrder || 0),
        grams: row.grams || '',
        matched: true,
      }
    })

    const payload = {
      notes: notes.value || '',
      items,
      createdBy: getOperator(),
      updatedAt: serverTimestamp(),
    }

    if (editingId.value) {
      await updateDoc(doc(db, PRESCRIPTIONS, editingId.value), payload)
      showToast('Prescription updated')
    } else {
      await addDoc(collection(db, PRESCRIPTIONS), {
        ...payload,
        createdAt: serverTimestamp(),
      })
      showToast('Prescription saved')
    }

    clearAll()
    await loadPrescriptions()
    currentPage.value = 1
  } catch (error) {
    console.error('savePrescription error:', error)
    showToast('Failed to save prescription', 'error')
  } finally {
    saving.value = false
  }
}

function editPrescription(item) {
  inputRows.value =
    (item.items || []).length > 0
      ? item.items.map((herb) =>
          createEmptyRow({
            name: herb.herbName || herb.inputName || '',
            grams: herb.grams || '',
          }),
        )
      : [createEmptyRow()]

  notes.value = item.notes || ''
  editingId.value = item.id
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function confirmDeletePrescription(id) {
  openDialog({
    title: 'Delete this prescription?',
    message: 'This action cannot be undone.',
    confirmText: 'Delete',
    type: 'danger',
    action: async () => {
      await deletePrescription(id)
    },
  })
}

async function deletePrescription(id) {
  try {
    await deleteDoc(doc(db, PRESCRIPTIONS, id))

    if (editingId.value === id) {
      clearAll()
    }

    showToast('Prescription deleted')
    await loadPrescriptions()

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value || 1
    }
  } catch (error) {
    console.error('deletePrescription error:', error)
    showToast('Failed to delete prescription', 'error')
  }
}

function formatDate(value) {
  if (!value) return 'Just now'

  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value)

  if (Number.isNaN(date.getTime())) return 'Just now'

  return date.toLocaleString()
}

const filteredPrescriptions = computed(() => {
  const keyword = normalizeString(searchKeyword.value)

  if (!keyword) return prescriptions.value

  return prescriptions.value.filter((item) => {
    const dateText = normalizeString(formatDate(item.createdAt))
    const notesText = normalizeString(item.notes)
    const herbText = normalizeString(
      (item.items || [])
        .map((herb) => {
          const liveCode = getLiveSequenceCode(herb)
          const liveName = formatHerbDisplay(herb.herbName || herb.inputName, herb.grams)
          return `${liveCode} ${liveName}`
        })
        .join(' '),
    )

    if (searchField.value === 'date') {
      return dateText.includes(keyword)
    }

    if (searchField.value === 'notes') {
      return notesText.includes(keyword)
    }

    if (searchField.value === 'herb') {
      return herbText.includes(keyword)
    }

    return dateText.includes(keyword) || notesText.includes(keyword) || herbText.includes(keyword)
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
.prescription-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header-card,
.card {
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
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.primary-btn,
.ghost-btn,
.remove-btn,
.danger-btn,
.dialog-confirm-btn {
  border-radius: 14px;
  height: 42px;
  padding: 0 16px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.small-btn {
  height: 36px;
  padding: 0 14px;
  font-size: 13px;
}

.primary-btn {
  background: #184c3b;
  color: #fff;
}

.ghost-btn,
.remove-btn {
  border: 1px solid #d9e1db;
  background: #ffffff;
  color: #355447;
}

.danger-btn {
  border: 1px solid #fecaca;
  background: #fff5f5;
  color: #dc2626;
}

.primary-btn:hover,
.ghost-btn:hover,
.remove-btn:hover,
.danger-btn:hover,
.dialog-confirm-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:disabled,
.ghost-btn:disabled,
.remove-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.section-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-top h3 {
  margin: 0;
  font-size: 22px;
  color: #173c2f;
}

.section-badge {
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

.editing-banner {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f5fbf7;
  border: 1px solid #d9eee1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.editing-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.editing-text strong {
  color: #184c3b;
  font-size: 14px;
}

.editing-text span {
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
}

.input-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.input-row-card {
  border: 1px solid #e7eeea;
  border-radius: 18px;
  background: linear-gradient(180deg, #fbfcfb 0%, #f7faf8 100%);
  padding: 14px;
}

.row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.row-index {
  font-size: 13px;
  font-weight: 800;
  color: #6b7280;
}

.row-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  gap: 12px;
}

.name-field,
.gram-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 12px;
  font-weight: 800;
  color: #355447;
}

.row-input,
.gram-input,
.notes-input,
.search-input,
.filter-select {
  width: 100%;
  border: 1px solid #d8dee7;
  border-radius: 14px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  background: #fff;
  box-sizing: border-box;
}

.row-input,
.gram-input,
.search-input,
.filter-select {
  height: 48px;
}

.notes-input {
  min-height: 110px;
  padding: 14px;
  resize: vertical;
}

.row-input:focus,
.gram-input:focus,
.notes-input:focus,
.search-input:focus,
.filter-select:focus {
  border-color: #1c5b47;
  box-shadow: 0 0 0 4px rgba(28, 91, 71, 0.08);
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.meta-pill,
.sequence-badge,
.history-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.meta-pill {
  min-height: 30px;
  padding: 0 10px;
}

.meta-pill.success {
  background: #edf8f1;
  color: #24995b;
}

.meta-pill.error {
  background: #fff1f2;
  color: #dc2626;
}

.meta-pill.neutral {
  background: #f3f4f6;
  color: #6b7280;
}

.meta-text {
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.notes-area {
  margin-top: 18px;
}

.notes-area label {
  display: inline-block;
  margin-bottom: 10px;
  color: #355447;
  font-weight: 800;
  font-size: 14px;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-item {
  border: 1px solid #e7eeea;
  border-radius: 18px;
  background: linear-gradient(180deg, #fbfcfb 0%, #f7faf8 100%);
  padding: 14px;
}

.preview-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sequence-badge {
  min-width: 52px;
  height: 34px;
  padding: 0 12px;
  background: #184c3b;
  color: #fff;
}

.preview-name {
  font-size: 15px;
  font-weight: 800;
  color: #173c2f;
}

.preview-category {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 700;
}

.divider {
  height: 1px;
  background: #edf2ef;
  margin: 20px 0 16px;
}

.save-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #355447;
  font-size: 14px;
  font-weight: 700;
}

.history-card {
  margin-top: 0;
}

.history-top {
  align-items: flex-start;
}

.history-subtitle {
  display: inline-block;
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
}

.history-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 12px;
  margin-bottom: 18px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.history-item {
  border: 1px solid #e7eeea;
  border-radius: 18px;
  background: linear-gradient(180deg, #fbfcfb 0%, #f7faf8 100%);
  padding: 16px;
}

.history-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.history-item-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.history-title {
  font-size: 15px;
  font-weight: 800;
  color: #173c2f;
}

.history-time {
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.history-tag {
  min-height: 32px;
  padding: 0 12px;
  background: #eef5f1;
  color: #184c3b;
}

.history-notes {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e8ecef;
}

.history-notes-label {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 800;
  color: #355447;
}

.history-notes-text {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 18px;
}

.page-indicator {
  min-width: 120px;
  text-align: center;
  color: #355447;
  font-size: 14px;
  font-weight: 800;
}

.empty-state {
  color: #6b7280;
  font-weight: 700;
  text-align: center;
  padding: 24px 0 8px;
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
.toast-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.36);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1100;
}

.dialog-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 24px;
  padding: 28px 24px 22px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  text-align: center;
}

.dialog-icon {
  width: 54px;
  height: 54px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 24px;
  font-weight: 800;
}

.dialog-icon.neutral {
  background: #eef5f1;
  color: #184c3b;
}

.dialog-icon.danger {
  background: #fff1f2;
  color: #dc2626;
}

.dialog-title {
  margin: 0;
  font-size: 22px;
  color: #173c2f;
  font-weight: 800;
}

.dialog-message {
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
  font-weight: 600;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 22px;
}

.dialog-btn {
  min-width: 110px;
}

.dialog-confirm-btn {
  min-width: 110px;
}

.dialog-confirm-btn.neutral {
  background: #184c3b;
  color: #fff;
}

.dialog-confirm-btn.danger {
  background: #dc2626;
  color: #fff;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: all 0.22s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .dialog-card,
.dialog-fade-leave-to .dialog-card {
  transform: translateY(10px) scale(0.98);
}

@media (max-width: 980px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .history-toolbar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-header-card {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .page-header-card h2 {
    font-size: 28px;
  }

  .row-fields {
    grid-template-columns: 1fr;
  }

  .history-item-top {
    flex-direction: column;
    align-items: stretch;
  }

  .history-item-actions {
    justify-content: flex-start;
  }

  .pagination-bar {
    flex-wrap: wrap;
  }

  .dialog-actions {
    flex-direction: column;
  }

  .dialog-btn,
  .dialog-confirm-btn {
    width: 100%;
  }
}
</style>
