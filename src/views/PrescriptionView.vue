<template>
  <div class="prescription-page">
    <section class="page-header-card">
      <div>
        <h2>Prescriptions</h2>
      </div>

      <div class="header-actions">
        <button class="ghost-btn" @click="addRow">Add Row</button>
        <button class="ghost-btn" @click="confirmResetRows">Reset 25 Rows</button>
        <button class="ghost-btn" @click="clearAll">Clear</button>
        <button class="ghost-btn" :disabled="!canExportCurrent" @click="exportCurrentPrescription">
          Export Excel
        </button>
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

    <section class="top-form-card card">
      <div class="top-form-grid top-form-grid-main">
        <div class="top-form-field">
          <label class="field-label">Prescription Name</label>
          <input v-model.trim="prescriptionTitle" class="row-input" type="text" placeholder="" />
        </div>

        <div class="top-form-field compact-field">
          <label class="field-label">Rows</label>
          <div class="row-count-box">{{ inputRows.length }}</div>
        </div>
      </div>

      <div class="ratio-info-bar">
        <div class="ratio-info-left">
          <span class="ratio-info-label">Granule Ratio</span>
          <span class="ratio-info-value">{{ GRANULE_RATIO }}</span>
        </div>
      </div>

      <div class="dosing-grid">
        <div class="top-form-field">
          <label class="field-label">Spoons / Time (勺/次)</label>
          <input
            :value="spoonsPerTime"
            class="row-input"
            type="text"
            inputmode="decimal"
            placeholder=""
            @input="handleSpoonsPerTimeInput"
          />
        </div>

        <div class="top-form-field">
          <label class="field-label">Times / Day (次/天)</label>
          <input
            :value="timesPerDay"
            class="row-input"
            type="text"
            inputmode="decimal"
            placeholder=""
            @input="handleTimesPerDayInput"
          />
        </div>

        <div class="top-form-field">
          <label class="field-label">Days (天)</label>
          <input
            :value="totalDays"
            class="row-input"
            type="text"
            inputmode="decimal"
            placeholder=""
            @input="handleTotalDaysInput"
          />
        </div>

        <div class="top-form-field">
          <label class="field-label">Target Total (g)</label>
          <div class="target-total-box">
            <span class="target-total-value">{{ targetTotalNumber }}g</span>
            <span class="target-total-formula">
              {{ toNumber(spoonsPerTime) }} × {{ GRAMS_PER_SPOON }} × {{ toNumber(timesPerDay) }} ×
              {{ toNumber(totalDays) }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="left-panel card">
        <div class="section-top">
          <h3>Input</h3>
          <span class="section-badge">{{ inputRows.length }} rows</span>
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

            <div class="row-fields row-fields-3">
              <div class="name-field">
                <label class="field-label">Herb Name</label>
                <input
                  v-model.trim="row.name"
                  class="row-input"
                  type="text"
                  placeholder=""
                  @input="handleNameInput(row)"
                  @keydown.enter.prevent="handleEnter(index)"
                />
              </div>

              <div class="pinyin-field">
                <label class="field-label">Pinyin</label>
                <input
                  v-model.trim="row.pinyin"
                  class="row-input"
                  type="text"
                  placeholder=""
                  @input="markPinyinAsManual(row)"
                />
              </div>

              <div class="gram-field">
                <label class="field-label">Dose (g)</label>
                <input
                  :value="row.grams"
                  class="gram-input"
                  type="text"
                  inputmode="decimal"
                  placeholder="10"
                  @input="handleGramsInput($event, row)"
                  @blur="normalizeGramsOnBlur(row)"
                />
              </div>
            </div>

            <div class="row-meta">
              <template v-if="row.name && getMatchedHerb(row.name)">
                <span class="meta-pill success">
                  {{ getMatchedHerb(row.name).sequenceCode }}
                </span>
                <span class="meta-text">
                  {{ buildMetaDisplay(getMatchedHerb(row.name), row) }}
                </span>
              </template>

              <template v-else-if="row.name">
                <span class="meta-pill error">Not Found</span>
                <span class="meta-text">
                  {{ row.pinyin ? `Auto Pinyin: ${row.pinyin}` : 'Please check herb name' }}
                </span>
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

        <div class="preview-headline">
          <div class="preview-title-line">
            <span class="preview-title-label">Name</span>
            <strong>{{ previewDisplayTitle }}</strong>
          </div>
          <div class="preview-title-line">
            <span class="preview-title-label">Date</span>
            <strong>{{ previewNowText }}</strong>
          </div>
          <div class="preview-title-line">
            <span class="preview-title-label">Target Total</span>
            <strong>{{ targetTotalNumber }}g</strong>
          </div>
        </div>

        <div v-if="previewItems.length" class="preview-list">
          <div
            v-for="(item, index) in previewItems"
            :key="`${item.herbId || item.herbName}-${index}`"
            class="preview-item"
          >
            <div class="preview-left">
              <span class="sequence-badge">{{ item.sequenceCode }}</span>
              <div class="preview-text">
                <div class="preview-name">{{ item.herbName }} {{ item.grams }}g</div>
                <div class="preview-pinyin" v-if="item.pinyin">
                  {{ item.pinyin }}
                </div>
                <div class="preview-category">
                  {{ normalizeCategoryName(item.category) }}
                </div>
                <div class="preview-raw" v-if="item.rawGrams !== item.grams">
                  <span class="preview-raw-label">Rx</span>
                  <span class="preview-raw-value">{{ item.rawGrams }}g</span>
                  <span class="preview-raw-arrow">→</span>
                  <span class="preview-raw-scaled">{{ item.grams }}g</span>
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
            <span>Granule Ratio</span>
            <strong>{{ GRANULE_RATIO }}</strong>
          </div>
          <div class="summary-row">
            <span>Raw Sum</span>
            <strong>{{ rawInputTotalGrams }}g</strong>
          </div>
          <div class="summary-row">
            <span>Scaled Total</span>
            <strong>{{ previewTotalGrams }}g</strong>
          </div>
          <div class="summary-row">
            <span>Target Total</span>
            <strong>{{ targetTotalNumber }}g</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="history-card card">
      <div class="section-top history-top">
        <div>
          <h3>Recent Prescriptions</h3>
        </div>

        <div class="history-top-right">
          <button
            class="ghost-btn small-btn"
            :disabled="prescriptions.length === 0"
            @click="exportAllPrescriptions"
          >
            Export All
          </button>
          <span class="section-badge">{{ filteredPrescriptions.length }}</span>
        </div>
      </div>

      <div class="history-toolbar">
        <input
          v-model.trim="searchKeyword"
          class="search-input"
          type="text"
          placeholder="Search by prescription name, herb, pinyin, functions, notes, or date..."
        />

        <select v-model="searchField" class="filter-select">
          <option value="all">All</option>
          <option value="title">Prescription Name</option>
          <option value="herb">Herb / Pinyin / Functions</option>
          <option value="date">Date / Time</option>
          <option value="notes">Notes</option>
        </select>
      </div>

      <div v-if="paginatedPrescriptions.length" class="history-list">
        <div v-for="item in paginatedPrescriptions" :key="item.id" class="history-item">
          <div class="history-item-top">
            <div class="history-item-title-wrap">
              <div class="history-title">
                {{ item.title || 'Untitled Prescription' }}
              </div>
              <div class="history-time">{{ formatDate(item.createdAt) }}</div>
            </div>

            <div class="history-item-actions">
              <button class="collapse-prescription-btn" @click="togglePrescriptionCard(item.id)">
                {{ isPrescriptionCardOpen(item.id) ? 'Hide Details' : 'Show Details' }}
              </button>
              <button class="ghost-btn small-btn" @click="exportSavedPrescription(item)">
                Export
              </button>
              <button class="ghost-btn small-btn" @click="editPrescription(item)">Edit</button>
              <button class="danger-btn small-btn" @click="confirmDeletePrescription(item.id)">
                Delete
              </button>
            </div>
          </div>

          <div class="history-summary-grid">
            <div class="history-summary-box">
              <span class="history-summary-label">Target Total</span>
              <strong>{{ item.targetTotal || '-' }}g</strong>
            </div>
            <div class="history-summary-box">
              <span class="history-summary-label">Granule Ratio</span>
              <strong>{{ item.granuleRatio || GRANULE_RATIO }}</strong>
            </div>
            <div class="history-summary-box">
              <span class="history-summary-label">Times / Day</span>
              <strong>{{ item.timesPerDay || '-' }}</strong>
            </div>
            <div class="history-summary-box">
              <span class="history-summary-label">Days</span>
              <strong>{{ item.totalDays || '-' }}</strong>
            </div>
          </div>

          <transition name="expand-fade">
            <div v-if="isPrescriptionCardOpen(item.id)" class="history-expand-body">
              <div v-if="item.notes" class="history-notes">
                <span class="history-notes-label">Notes</span>
                <p class="history-notes-text">{{ item.notes }}</p>
              </div>

              <div class="history-detail-list">
                <div
                  v-for="(herb, idx) in item.items || []"
                  :key="`${item.id}-${idx}`"
                  class="history-detail-card"
                >
                  <div class="history-detail-top">
                    <div class="history-detail-left">
                      <span class="sequence-badge history-sequence-badge">
                        {{ getLiveSequenceCode(herb) || herb.sequenceCode }}
                      </span>

                      <div class="history-detail-text">
                        <div class="history-herb-name-row">
                          <span class="history-herb-name">
                            {{ herb.herbName || herb.inputName }}
                          </span>
                          <span class="history-dose-pill">
                            {{ getDisplayDoseForSavedHerb(herb) }}g
                          </span>
                        </div>

                        <div class="history-meta-row">
                          <span class="history-mini-pill">
                            {{ normalizeCategoryName(getDisplayCategoryForSavedHerb(herb)) }}
                          </span>
                          <span v-if="getDisplayPinyinForSavedHerb(herb)" class="history-pinyin">
                            {{ getDisplayPinyinForSavedHerb(herb) }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      v-if="getDisplayFunctionsForSavedHerb(herb)"
                      class="toggle-detail-btn"
                      @click="toggleSavedHerbDetail(item.id, idx)"
                    >
                      {{
                        isSavedHerbDetailOpen(item.id, idx) ? 'Hide Functions' : 'Show Functions'
                      }}
                    </button>
                  </div>

                  <transition name="expand-fade">
                    <div
                      v-if="
                        getDisplayFunctionsForSavedHerb(herb) && isSavedHerbDetailOpen(item.id, idx)
                      "
                      class="history-functions-panel"
                    >
                      <div class="history-functions-title">Functions</div>
                      <div
                        class="history-functions-content"
                        v-html="formatMultilineText(getDisplayFunctionsForSavedHerb(herb))"
                      ></div>
                    </div>
                  </transition>
                </div>
              </div>
            </div>
          </transition>
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
import * as XLSX from 'xlsx'
import { pinyin as toPinyin } from 'pinyin-pro'
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
const DEFAULT_ROWS = 25
const DEFAULT_GRAMS = '10'
const GRAMS_PER_SPOON = 1.5
const DEFAULT_SPOONS_PER_TIME = '4'
const DEFAULT_TIMES_PER_DAY = '2'
const DEFAULT_TOTAL_DAYS = '7'
const GRANULE_RATIO = 5

const herbs = ref([])
const prescriptions = ref([])
const saving = ref(false)
const notes = ref('')
const prescriptionTitle = ref('')
const editingId = ref('')
const currentPage = ref(1)
const searchKeyword = ref('')
const searchField = ref('all')
const savedHerbOpenMap = ref({})
const prescriptionOpenMap = ref({})

const spoonsPerTime = ref(DEFAULT_SPOONS_PER_TIME)
const timesPerDay = ref(DEFAULT_TIMES_PER_DAY)
const totalDays = ref(DEFAULT_TOTAL_DAYS)

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

const inputRows = ref(createDefaultRows())

function createEmptyRow(data = {}) {
  return {
    key: crypto.randomUUID(),
    name: data.name || '',
    pinyin: data.pinyin || '',
    grams: data.grams || DEFAULT_GRAMS,
    pinyinEdited: Boolean(data.pinyinEdited),
    gramsEdited: Boolean(data.gramsEdited),
  }
}

function createDefaultRows() {
  return Array.from({ length: DEFAULT_ROWS }, () => createEmptyRow())
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
  const clean = String(value || '').trim()
  return clean || DEFAULT_GRAMS
}

function sanitizeDose(value) {
  const clean = String(value || '').trim()
  return clean || DEFAULT_GRAMS
}

function toNumber(value) {
  const num = Number(String(value || '').trim())
  return Number.isFinite(num) ? num : 0
}

function roundTo2(num) {
  return Math.round(num * 100) / 100
}

function filterDecimalInput(value) {
  const raw = String(value || '')
  let cleaned = raw.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')

  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join('')}`
  }

  return cleaned
}

function filterGramsInput(value) {
  return filterDecimalInput(value)
}

function handleGramsInput(event, row) {
  const cleaned = filterGramsInput(event.target.value)
  row.grams = cleaned
  row.gramsEdited = true
  event.target.value = cleaned
}

function normalizeGramsOnBlur(row) {
  row.grams = sanitizeGrams(row.grams)
}

function handleSpoonsPerTimeInput(event) {
  const cleaned = filterDecimalInput(event.target.value)
  spoonsPerTime.value = cleaned
  event.target.value = cleaned
}

function handleTimesPerDayInput(event) {
  const cleaned = filterDecimalInput(event.target.value)
  timesPerDay.value = cleaned
  event.target.value = cleaned
}

function handleTotalDaysInput(event) {
  const cleaned = filterDecimalInput(event.target.value)
  totalDays.value = cleaned
  event.target.value = cleaned
}

function scaleRowsToTarget(rows, targetValue) {
  const target = toNumber(targetValue)

  if (target <= 0) {
    return rows.map((row) => ({ ...row }))
  }

  const validRows = rows.filter((row) => row.name && toNumber(row.grams) > 0)
  const granuleEquivalents = validRows.map((row) => toNumber(row.grams) / GRANULE_RATIO)
  const dayTotal = granuleEquivalents.reduce((sum, val) => sum + val, 0)

  if (!dayTotal || !validRows.length) {
    return rows.map((row) => ({ ...row }))
  }

  let accumulated = 0

  return rows.map((row) => {
    if (!row.name || toNumber(row.grams) <= 0) {
      return { ...row }
    }

    const validIndex = validRows.findIndex((item) => item.key === row.key)
    const isLastValid = validIndex === validRows.length - 1
    const j = granuleEquivalents[validIndex]

    let scaled

    if (isLastValid) {
      scaled = roundTo2(target - accumulated)
    } else {
      scaled = roundTo2((j / dayTotal) * target)
      accumulated += scaled
    }

    return {
      ...row,
      grams: String(scaled),
    }
  })
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

function getHerbPinyin(herb) {
  return String(
    herb?.pinyin || herb?.namePinyin || herb?.pinyinPlain || herb?.romanization || '',
  ).trim()
}

function getHerbFunctions(herb) {
  return String(herb?.functions || '').trim()
}

function getHerbDefaultDose(herb) {
  return sanitizeDose(herb?.defaultDose || herb?.defaultGrams || DEFAULT_GRAMS)
}

function hasChinese(value) {
  return /[\u4e00-\u9fff]/.test(String(value || ''))
}

function normalizeAutoPinyin(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function generatePinyinFromChinese(text) {
  const source = String(text || '').trim()
  if (!source || !hasChinese(source)) return ''

  try {
    return normalizeAutoPinyin(
      toPinyin(source, {
        toneType: 'none',
        type: 'array',
      }).join(' '),
    )
  } catch (error) {
    console.error('generatePinyinFromChinese error:', error)
    return ''
  }
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

watch(
  inputRows,
  (rows) => {
    rows.forEach((row) => {
      const currentName = String(row.name || '').trim()
      const matched = getMatchedHerb(currentName)

      if (!row.pinyinEdited && !String(row.pinyin || '').trim()) {
        if (matched) {
          const herbStoredPinyin = getHerbPinyin(matched)
          if (herbStoredPinyin) {
            row.pinyin = normalizeAutoPinyin(herbStoredPinyin)
          } else {
            const generated = generatePinyinFromChinese(currentName)
            if (generated) {
              row.pinyin = generated
            }
          }
        } else {
          const generated = generatePinyinFromChinese(currentName)
          if (generated) {
            row.pinyin = generated
          }
        }
      }
    })
  },
  { deep: true },
)

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
      herbPinyin: getHerbPinyin(item),
      herbFunctions: getHerbFunctions(item),
      herbDefaultDose: getHerbDefaultDose(item),
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

function getResolvedRowPinyin(row, matched) {
  return normalizeAutoPinyin(
    row?.pinyin || matched?.herbPinyin || generatePinyinFromChinese(row?.name),
  )
}

function buildMetaDisplay(herb, row) {
  const category = normalizeCategoryName(herb?.category)
  const doseText = `${sanitizeGrams(row?.grams)}g`
  const pinyinText = getResolvedRowPinyin(row, herb)
  return pinyinText ? `${category} · ${pinyinText} · ${doseText}` : `${category} · ${doseText}`
}

function handleNameInput(row) {
  const currentName = String(row.name || '').trim()
  const matched = getMatchedHerb(currentName)

  if (!row.pinyinEdited) {
    if (matched) {
      const herbStoredPinyin = getHerbPinyin(matched)
      row.pinyin = normalizeAutoPinyin(herbStoredPinyin || generatePinyinFromChinese(currentName))
    } else {
      row.pinyin = generatePinyinFromChinese(currentName)
    }
  }

  if (matched && !row.gramsEdited) {
    row.grams = getHerbDefaultDose(matched)
  }
}

function markPinyinAsManual(row) {
  row.pinyinEdited = true
}

const previewItems = computed(() => {
  const namedMatchedRows = inputRows.value
    .map((row) => ({ row, matched: getMatchedHerb(row.name) }))
    .filter(({ row, matched }) => row.name && matched)

  if (!namedMatchedRows.length) return []

  const target = targetTotalNumber.value
  const rawTotal = namedMatchedRows.reduce(
    (sum, { row }) => sum + toNumber(sanitizeGrams(row.grams)),
    0,
  )
  const shouldScale = target > 0 && rawTotal > 0

  let accumulated = 0

  return namedMatchedRows.map(({ row, matched }, index) => {
    const rawGrams = toNumber(sanitizeGrams(row.grams))
    let displayGrams = sanitizeGrams(row.grams)

    if (shouldScale) {
      const j = rawGrams / GRANULE_RATIO
      const dayTotal = rawTotal / GRANULE_RATIO
      const isLast = index === namedMatchedRows.length - 1
      const scaled = isLast ? roundTo2(target - accumulated) : roundTo2((j / dayTotal) * target)

      if (!isLast) accumulated += scaled
      displayGrams = String(scaled)
    }

    return {
      herbId: matched.id,
      herbName: matched.nameCn,
      category: matched.category,
      groupOrder: Number(matched.groupOrder || 0),
      defaultOrder: Number(matched.defaultOrder || 0),
      sequenceCode: matched.sequenceCode,
      rawGrams: sanitizeGrams(row.grams),
      grams: displayGrams,
      pinyin: getResolvedRowPinyin(row, matched),
      matched: true,
    }
  })
})

const unmatchedCount = computed(() => {
  return inputRows.value.filter((row) => row.name && !getMatchedHerb(row.name)).length
})

const previewDisplayTitle = computed(() => {
  return prescriptionTitle.value || 'Untitled Prescription'
})

const previewNowText = computed(() => {
  return new Date().toLocaleString()
})

const canExportCurrent = computed(() => {
  return previewItems.value.length > 0
})

const rawInputTotalGrams = computed(() => {
  return roundTo2(
    inputRows.value
      .filter((row) => row.name)
      .reduce((sum, row) => sum + toNumber(sanitizeGrams(row.grams)), 0),
  )
})

const previewTotalGrams = computed(() => {
  return roundTo2(previewItems.value.reduce((sum, item) => sum + toNumber(item.grams), 0))
})

const targetTotalNumber = computed(() => {
  const spoons = toNumber(spoonsPerTime.value)
  const times = toNumber(timesPerDay.value)
  const days = toNumber(totalDays.value)
  return roundTo2(spoons * GRAMS_PER_SPOON * times * days)
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

function confirmResetRows() {
  openDialog({
    title: 'Reset all rows?',
    message: 'This will reset the current input back to 25 default rows.',
    confirmText: 'Reset',
    type: 'neutral',
    action: () => {
      resetToDefaultRows()
    },
  })
}

function resetToDefaultRows() {
  inputRows.value = createDefaultRows()
  showToast('Reset to 25 default rows')
}

function clearAll() {
  inputRows.value = createDefaultRows()
  notes.value = ''
  prescriptionTitle.value = ''
  editingId.value = ''
  spoonsPerTime.value = DEFAULT_SPOONS_PER_TIME
  timesPerDay.value = DEFAULT_TIMES_PER_DAY
  totalDays.value = DEFAULT_TOTAL_DAYS
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
    const rawRows = inputRows.value
      .map((row) => ({
        ...row,
        name: String(row.name || '').trim(),
        pinyin: normalizeAutoPinyin(row.pinyin),
        grams: sanitizeGrams(row.grams),
        pinyinEdited: Boolean(row.pinyinEdited),
        gramsEdited: Boolean(row.gramsEdited),
      }))
      .filter((row) => row.name)

    if (!rawRows.length) {
      showToast('Please enter at least one herb', 'error')
      return
    }

    if (rawRows.some((row) => !getMatchedHerb(row.name))) {
      showToast('Please resolve unmatched herb names first', 'error')
      return
    }

    if (rawRows.some((row) => toNumber(row.grams) <= 0)) {
      showToast('Dose must be greater than 0', 'error')
      return
    }

    const target = targetTotalNumber.value

    if (target <= 0) {
      showToast('Please set spoons, times per day, and days (Target Total must be > 0)', 'error')
      return
    }

    const rawGramsByKey = new Map(rawRows.map((row) => [row.key, sanitizeGrams(row.grams)]))
    const rows = scaleRowsToTarget(rawRows, target)

    saving.value = true

    inputRows.value = scaleRowsToTarget(
      inputRows.value.map((row) => ({
        ...row,
        grams: sanitizeGrams(row.grams),
      })),
      target,
    )

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
        rawGrams: rawGramsByKey.get(row.key) || row.grams,
        grams: row.grams,
        granuleRatio: GRANULE_RATIO,
        pinyin: normalizeAutoPinyin(
          row.pinyin || matched.herbPinyin || generatePinyinFromChinese(row.name),
        ),
        functions: getHerbFunctions(matched),
        defaultDose: getHerbDefaultDose(matched),
        matched: true,
      }
    })

    const payload = {
      title: prescriptionTitle.value || '',
      notes: notes.value || '',
      targetTotal: String(target),
      spoonsPerTime: String(toNumber(spoonsPerTime.value)),
      timesPerDay: String(toNumber(timesPerDay.value)),
      totalDays: String(toNumber(totalDays.value)),
      gramsPerSpoon: String(GRAMS_PER_SPOON),
      granuleRatio: String(GRANULE_RATIO),
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
            pinyin: herb.pinyin || '',
            grams: herb.rawGrams || herb.grams || herb.defaultDose || DEFAULT_GRAMS,
            pinyinEdited: Boolean(herb.pinyin),
            gramsEdited: true,
          }),
        )
      : createDefaultRows()

  prescriptionTitle.value = item.title || ''
  notes.value = item.notes || ''
  editingId.value = item.id

  if (item.spoonsPerTime || item.timesPerDay || item.totalDays) {
    spoonsPerTime.value = item.spoonsPerTime || DEFAULT_SPOONS_PER_TIME
    timesPerDay.value = item.timesPerDay || DEFAULT_TIMES_PER_DAY
    totalDays.value = item.totalDays || DEFAULT_TOTAL_DAYS
  } else if (item.targetTotal) {
    const savedTarget = toNumber(item.targetTotal)
    const times = toNumber(DEFAULT_TIMES_PER_DAY)
    const days = toNumber(DEFAULT_TOTAL_DAYS)
    const derivedSpoons =
      times > 0 && days > 0
        ? savedTarget / (GRAMS_PER_SPOON * times * days)
        : toNumber(DEFAULT_SPOONS_PER_TIME)
    spoonsPerTime.value = String(roundTo2(derivedSpoons))
    timesPerDay.value = DEFAULT_TIMES_PER_DAY
    totalDays.value = DEFAULT_TOTAL_DAYS
  } else {
    spoonsPerTime.value = DEFAULT_SPOONS_PER_TIME
    timesPerDay.value = DEFAULT_TIMES_PER_DAY
    totalDays.value = DEFAULT_TOTAL_DAYS
  }

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

function buildExportRowsFromPrescription(payload) {
  const titleText = payload.title || 'Untitled Prescription'
  const notesText = payload.notes || ''

  return (payload.items || []).map((item, index) => ({
    处方名: index === 0 ? titleText : '',
    序号: getLiveSequenceCode(item) || item.sequenceCode || '',
    药名: item.herbName || item.inputName || '',
    拼音: item.pinyin || '',
    '医生原方(g)': item.rawGrams ? `${item.rawGrams}g` : '',
    '颗粒克数(g)': `${item.grams || DEFAULT_GRAMS}g`,
    浓缩比: payload.granuleRatio || item.granuleRatio || String(GRANULE_RATIO),
    分类: normalizeCategoryName(item.category || ''),
    Functions: item.functions || '',
    Notes: index === 0 ? notesText : '',
  }))
}

function buildExportRowsForAllPrescriptions(list) {
  const rows = []

  list.forEach((prescription, prescriptionIndex) => {
    const prescriptionRows = buildExportRowsFromPrescription(prescription)
    rows.push(...prescriptionRows)

    if (prescriptionIndex !== list.length - 1) {
      rows.push({
        处方名: '',
        序号: '',
        药名: '',
        拼音: '',
        '医生原方(g)': '',
        '颗粒克数(g)': '',
        浓缩比: '',
        分类: '',
        Functions: '',
        Notes: '',
      })
    }
  })

  return rows
}

function exportWorkbook(rows, filenameBase, sheetName = 'Prescription') {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const safeName = String(filenameBase || 'prescription')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()

  XLSX.writeFile(workbook, `${safeName || 'prescription'}.xlsx`)
}

function exportCurrentPrescription() {
  try {
    if (!previewItems.value.length) {
      showToast('No matched herbs to export', 'error')
      return
    }

    const payload = {
      title: previewDisplayTitle.value,
      notes: notes.value || '',
      targetTotal: String(targetTotalNumber.value),
      items: previewItems.value.map((item) => {
        const live = getMatchedHerb(item.herbName)
        return {
          ...item,
          functions: getHerbFunctions(live),
        }
      }),
    }

    const rows = buildExportRowsFromPrescription(payload)
    exportWorkbook(rows, payload.title || 'prescription', 'Prescription')
    showToast('Prescription exported')
  } catch (error) {
    console.error('exportCurrentPrescription error:', error)
    showToast('Export failed', 'error')
  }
}

function exportSavedPrescription(item) {
  try {
    const rows = buildExportRowsFromPrescription(item)
    exportWorkbook(rows, item.title || 'prescription', 'Prescription')
    showToast('Prescription exported')
  } catch (error) {
    console.error('exportSavedPrescription error:', error)
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
    exportWorkbook(rows, 'all-prescriptions', 'Prescriptions')
    showToast('All prescriptions exported')
  } catch (error) {
    console.error('exportAllPrescriptions error:', error)
    showToast('Export failed', 'error')
  }
}

function getSavedHerbOpenKey(prescriptionId, herbIndex) {
  return `${prescriptionId}__${herbIndex}`
}

function toggleSavedHerbDetail(prescriptionId, herbIndex) {
  const key = getSavedHerbOpenKey(prescriptionId, herbIndex)
  savedHerbOpenMap.value = {
    ...savedHerbOpenMap.value,
    [key]: !savedHerbOpenMap.value[key],
  }
}

function isSavedHerbDetailOpen(prescriptionId, herbIndex) {
  return Boolean(savedHerbOpenMap.value[getSavedHerbOpenKey(prescriptionId, herbIndex)])
}

function getPrescriptionOpenKey(prescriptionId) {
  return String(prescriptionId || '')
}

function togglePrescriptionCard(prescriptionId) {
  const key = getPrescriptionOpenKey(prescriptionId)
  prescriptionOpenMap.value = {
    ...prescriptionOpenMap.value,
    [key]: !prescriptionOpenMap.value[key],
  }
}

function isPrescriptionCardOpen(prescriptionId) {
  const key = getPrescriptionOpenKey(prescriptionId)
  return Boolean(prescriptionOpenMap.value[key])
}

function getDisplayFunctionsForSavedHerb(savedHerb) {
  const live = getLiveHerbRecord(savedHerb)
  return getHerbFunctions(live) || String(savedHerb?.functions || '').trim()
}

function getDisplayDoseForSavedHerb(savedHerb) {
  return sanitizeDose(
    savedHerb?.grams || savedHerb?.rawGrams || savedHerb?.defaultDose || DEFAULT_GRAMS,
  )
}

function getDisplayPinyinForSavedHerb(savedHerb) {
  const live = getLiveHerbRecord(savedHerb)
  return getHerbPinyin(live) || String(savedHerb?.pinyin || '').trim()
}

function getDisplayCategoryForSavedHerb(savedHerb) {
  const live = getLiveHerbRecord(savedHerb)
  return live?.category || savedHerb?.category || ''
}

const filteredPrescriptions = computed(() => {
  const keyword = normalizeString(searchKeyword.value)

  if (!keyword) return prescriptions.value

  return prescriptions.value.filter((item) => {
    const dateText = normalizeString(formatDate(item.createdAt))
    const notesText = normalizeString(item.notes)
    const titleText = normalizeString(item.title)
    const herbText = normalizeString(
      (item.items || [])
        .map((herb) => {
          const liveCode = getLiveSequenceCode(herb)
          const herbName = herb.herbName || herb.inputName || ''
          const herbPinyin = getDisplayPinyinForSavedHerb(herb)
          const herbDose = `${getDisplayDoseForSavedHerb(herb)}g`
          const herbFunctions = getDisplayFunctionsForSavedHerb(herb)
          return `${liveCode} ${herbName} ${herbPinyin} ${herbDose} ${herbFunctions}`
        })
        .join(' '),
    )

    if (searchField.value === 'title') {
      return titleText.includes(keyword)
    }

    if (searchField.value === 'date') {
      return dateText.includes(keyword)
    }

    if (searchField.value === 'notes') {
      return notesText.includes(keyword)
    }

    if (searchField.value === 'herb') {
      return herbText.includes(keyword)
    }

    return (
      titleText.includes(keyword) ||
      dateText.includes(keyword) ||
      notesText.includes(keyword) ||
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

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.top-form-card {
  padding-top: 18px;
  padding-bottom: 18px;
}

.top-form-grid {
  display: grid;
  gap: 14px;
}

.top-form-grid-main {
  grid-template-columns: minmax(0, 1fr) 120px;
  margin-bottom: 14px;
}

.ratio-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  margin-bottom: 12px;
  border-radius: 14px;
  background: #eef5f1;
  border: 1px solid #d9eee1;
}

.ratio-info-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ratio-info-label {
  font-size: 12px;
  font-weight: 800;
  color: #355447;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.ratio-info-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: #184c3b;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

.dosing-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  background: #f8fbf9;
  border: 1px solid #e7eeea;
}

.top-form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compact-field {
  max-width: 120px;
}

.target-total-box {
  height: 48px;
  border-radius: 14px;
  border: 1px solid #184c3b;
  background: #eef5f1;
  color: #184c3b;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 6px 14px;
  box-sizing: border-box;
  overflow: hidden;
}

.target-total-value {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.1;
}

.target-total-formula {
  font-size: 11px;
  font-weight: 700;
  color: #355447;
  opacity: 0.75;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row-count-box {
  height: 48px;
  border-radius: 14px;
  border: 1px solid #d8dee7;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fbf9;
  font-weight: 800;
  color: #184c3b;
}

.primary-btn,
.ghost-btn,
.remove-btn,
.danger-btn,
.dialog-confirm-btn,
.toggle-detail-btn,
.collapse-prescription-btn {
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
.remove-btn,
.toggle-detail-btn,
.collapse-prescription-btn {
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
.dialog-confirm-btn:hover,
.toggle-detail-btn:hover,
.collapse-prescription-btn:hover {
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
  grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);
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

.history-top-right {
  display: flex;
  align-items: center;
  gap: 12px;
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
  max-height: 980px;
  overflow-y: auto;
  padding-right: 4px;
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
  gap: 12px;
}

.row-fields-3 {
  grid-template-columns: minmax(0, 1fr) minmax(180px, 0.8fr) 110px;
}

.name-field,
.pinyin-field,
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
.sequence-badge {
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

.preview-headline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fbf9;
  border: 1px solid #e7eeea;
}

.preview-title-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  color: #355447;
}

.preview-title-label {
  font-weight: 700;
  color: #6b7280;
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
  align-items: flex-start;
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

.preview-pinyin {
  margin-top: 4px;
  font-size: 13px;
  color: #355447;
  font-weight: 700;
}

.preview-category {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 700;
}

.preview-raw {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #fff;
  border: 1px dashed #d9e1db;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}

.preview-raw-label {
  color: #355447;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.03em;
}

.preview-raw-value {
  color: #6b7280;
}

.preview-raw-arrow {
  color: #9aa5ad;
}

.preview-raw-scaled {
  color: #184c3b;
  font-weight: 800;
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

.history-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 14px;
  margin-bottom: 16px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.history-item {
  border: 1px solid #e7eeea;
  border-radius: 24px;
  background: linear-gradient(180deg, #fbfcfb 0%, #f7faf8 100%);
  padding: 18px;
}

.history-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.history-item-title-wrap {
  min-width: 0;
}

.history-item-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
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

.history-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.history-summary-box {
  border: 1px solid #e7eeea;
  background: #f8fbf9;
  border-radius: 16px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-summary-label {
  font-size: 12px;
  font-weight: 800;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.history-summary-box strong {
  color: #173c2f;
  font-size: 18px;
}

.history-expand-body {
  margin-top: 16px;
}

.history-notes {
  padding: 14px 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #edf2ef;
}

.history-notes-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  color: #6b7280;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.history-notes-text {
  margin: 0;
  color: #355447;
  font-size: 14px;
  line-height: 1.6;
}

.history-detail-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 16px;
}

.history-detail-card {
  border: 1px solid #dfe9e3;
  background: #ffffff;
  border-radius: 20px;
  padding: 14px;
}

.history-detail-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.history-detail-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.history-sequence-badge {
  flex-shrink: 0;
}

.history-detail-text {
  min-width: 0;
  flex: 1;
}

.history-herb-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.history-herb-name {
  font-size: 16px;
  font-weight: 800;
  color: #173c2f;
}

.history-dose-pill {
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

.history-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.history-mini-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f3f8f5;
  color: #355447;
  font-size: 12px;
  font-weight: 800;
}

.history-pinyin {
  font-size: 13px;
  color: #355447;
  font-weight: 700;
}

.history-functions-panel {
  margin-top: 14px;
  border-radius: 16px;
  background: #f8fbf9;
  border: 1px dashed #d9e8de;
  padding: 14px 16px;
}

.history-functions-title {
  font-size: 12px;
  font-weight: 800;
  color: #184c3b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.history-functions-content {
  color: #355447;
  font-size: 14px;
  line-height: 1.8;
  word-break: break-word;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
}

.page-indicator {
  font-size: 13px;
  font-weight: 800;
  color: #355447;
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
.toast-fade-leave-active,
.dialog-fade-enter-active,
.dialog-fade-leave-active,
.expand-fade-enter-active,
.expand-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to,
.dialog-fade-enter-from,
.dialog-fade-leave-to,
.expand-fade-enter-from,
.expand-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(3px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.dialog-card {
  width: min(100%, 420px);
  background: #ffffff;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(15, 23, 42, 0.05);
  text-align: center;
}

.dialog-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  font-size: 22px;
  font-weight: 900;
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
  font-size: 20px;
  color: #173c2f;
}

.dialog-message {
  margin: 10px 0 0;
  color: #6b7280;
  line-height: 1.6;
  font-size: 14px;
}

.dialog-actions {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.dialog-btn {
  min-width: 100px;
}

.dialog-confirm-btn.neutral {
  background: #184c3b;
  color: #fff;
}

.dialog-confirm-btn.danger {
  background: #dc2626;
  color: #fff;
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .row-fields-3 {
    grid-template-columns: 1fr;
  }

  .top-form-grid,
  .top-form-grid-main,
  .history-toolbar {
    grid-template-columns: 1fr;
  }

  .dosing-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .history-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .history-detail-top {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 520px) {
  .dosing-grid,
  .history-summary-grid {
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

  .history-item-top {
    flex-direction: column;
  }

  .history-top-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
