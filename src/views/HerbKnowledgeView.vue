<template>
  <div class="knowledge-page">
    <section class="page-header-card">
      <div>
        <h2>Herb Notes</h2>
      </div>
    </section>

    <section class="toolbar-card">
      <input
        v-model.trim="searchKeyword"
        class="search-input"
        type="text"
        placeholder="Search herb name / functions / default dose / unit price..."
      />

      <select v-model="selectedCategory" class="category-select">
        <option value="all">All Categories</option>
        <option v-for="item in categories" :key="item.id" :value="item.name">
          {{ normalizeCategoryName(item.name) }}
        </option>
      </select>
    </section>

    <section v-if="loading" class="empty-card">
      <p>Loading herb knowledge...</p>
    </section>

    <template v-else>
      <section v-if="groupedHerbs.length" class="group-list">
        <div v-for="(group, groupIndex) in groupedHerbs" :key="group.category" class="group-card">
          <div class="group-header">
            <div class="group-header-left">
              <h3>{{ getCategoryDisplayName(groupIndex, group.category) }}</h3>
            </div>
            <span class="group-count">{{ group.herbs.length }} herbs</span>
          </div>

          <div class="knowledge-list">
            <div v-for="herb in group.herbs" :key="herb.id" class="knowledge-row">
              <button class="knowledge-trigger" @click="toggleHerb(herb.id)">
                <div class="knowledge-trigger-left">
                  <span class="sequence-badge">{{ herb.sequenceCode }}</span>

                  <div class="title-stack">
                    <div class="title-line">
                      <h4>{{ herb.nameCn }}</h4>

                      <span
                        v-if="getSingleLineFunctionPreview(herb.functions)"
                        class="function-preview"
                      >
                        {{ getSingleLineFunctionPreview(herb.functions) }}
                      </span>
                    </div>

                    <div
                      v-if="herb.functions"
                      class="function-preview-multiline"
                      v-html="formatMultilineText(herb.functions)"
                    ></div>
                  </div>
                </div>

                <div class="knowledge-trigger-right">
                  <span class="meta-pill">{{ normalizeCategoryName(herb.category) }}</span>
                  <span class="dose-pill">{{ herb.defaultDose }}g</span>
                  <span class="price-pill">AUD {{ formatMoney(herb.unitPrice) }}/g</span>
                  <span class="chevron" :class="{ open: isOpen(herb.id) }">▾</span>
                </div>
              </button>

              <transition name="expand-fade">
                <div v-if="isOpen(herb.id)" class="knowledge-panel">
                  <div class="edit-grid">
                    <div class="edit-block herb-name-block">
                      <label class="field-label">Herb Name</label>
                      <input
                        v-model.trim="herb.editNameCn"
                        class="text-input"
                        type="text"
                        placeholder="Enter herb name"
                      />
                    </div>

                    <div class="edit-block">
                      <label class="field-label">Default Dose (g)</label>
                      <input
                        :value="herb.editDefaultDose"
                        class="dose-input"
                        type="text"
                        inputmode="decimal"
                        placeholder="10"
                        @input="handleDoseInput($event, herb)"
                        @blur="normalizeDoseOnBlur(herb)"
                      />
                    </div>

                    <div class="edit-block">
                      <label class="field-label">Unit Price (AUD/g)</label>
                      <input
                        :value="herb.editUnitPrice"
                        class="price-input"
                        type="text"
                        inputmode="decimal"
                        placeholder="0.00"
                        @input="handlePriceInput($event, herb)"
                        @blur="normalizePriceOnBlur(herb)"
                      />
                    </div>
                  </div>

                  <label class="field-label">Functions</label>

                  <textarea
                    v-model="herb.editFunctions"
                    class="function-textarea"
                    placeholder=""
                  ></textarea>

                  <div class="panel-actions">
                    <!-- <button
                      class="ghost-btn"
                      :disabled="savingId === herb.id"
                      @click="confirmResetCurrentEdit(herb)"
                    >
                      Reset
                    </button> -->

                    <button
                      class="save-btn"
                      :disabled="savingId === herb.id"
                      @click="confirmSaveKnowledge(herb)"
                    >
                      {{ savingId === herb.id ? 'Saving...' : 'Save' }}
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </section>

      <section v-else class="empty-card">
        <p>No herbs found.</p>
      </section>
    </template>

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
import { computed, onMounted, ref } from 'vue'
import { collection, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

const HERBS = 'herbs'
const DEFAULT_DOSE = '10'
const DEFAULT_UNIT_PRICE = '0'

const loading = ref(true)
const savingId = ref('')
const herbs = ref([])
const searchKeyword = ref('')
const selectedCategory = ref('all')
const openHerbIds = ref([])

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

function isRealHerb(herb) {
  return herb?.nameCn && herb.nameCn !== '添加药材'
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

function filterDecimalInput(value) {
  const raw = String(value || '')
  let cleaned = raw.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')

  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join('')}`
  }

  return cleaned
}

function sanitizeDose(value) {
  const cleaned = String(value || '').trim()
  return cleaned || DEFAULT_DOSE
}

function sanitizeUnitPrice(value) {
  const cleaned = String(value || '').trim()
  return cleaned || DEFAULT_UNIT_PRICE
}

function sanitizeHerbName(value) {
  return String(value || '').trim()
}

function handleDoseInput(event, herb) {
  const cleaned = filterDecimalInput(event.target.value)
  herb.editDefaultDose = cleaned
  event.target.value = cleaned
}

function normalizeDoseOnBlur(herb) {
  herb.editDefaultDose = sanitizeDose(herb.editDefaultDose)
}

function handlePriceInput(event, herb) {
  const cleaned = filterDecimalInput(event.target.value)
  herb.editUnitPrice = cleaned
  event.target.value = cleaned
}

function normalizePriceOnBlur(herb) {
  herb.editUnitPrice = sanitizeUnitPrice(herb.editUnitPrice)
}

function formatMoney(value) {
  const number = Number(value || 0)
  if (Number.isNaN(number)) return '0.00'
  return number.toFixed(2)
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

function getCategoryDisplayName(index, rawName) {
  return `${getAlphabetLabel(index)}. ${normalizeCategoryName(rawName)}`
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

function getSingleLineFunctionPreview(value, max = 28) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}...` : text
}

function isOpen(id) {
  return openHerbIds.value.includes(id)
}

function toggleHerb(id) {
  if (isOpen(id)) {
    openHerbIds.value = openHerbIds.value.filter((item) => item !== id)
  } else {
    openHerbIds.value = [...openHerbIds.value, id]
  }
}

function resetCurrentEdit(herb) {
  herb.editNameCn = herb.nameCn || ''
  herb.editFunctions = herb.functions || ''
  herb.editDefaultDose = sanitizeDose(herb.defaultDose)
  herb.editUnitPrice = sanitizeUnitPrice(herb.unitPrice)
  showToast('Reset complete')
}

function confirmResetCurrentEdit(herb) {
  openDialog({
    title: 'Reset this herb?',
    message: 'This will discard the unsaved changes for this herb.',
    confirmText: 'Reset',
    type: 'neutral',
    action: () => resetCurrentEdit(herb),
  })
}

function confirmSaveKnowledge(herb) {
  const nextName = sanitizeHerbName(herb.editNameCn)

  if (!nextName) {
    showToast('Herb name cannot be empty', 'error')
    return
  }

  openDialog({
    title: 'Save this herb?',
    message: 'The herb name, functions, default dose and unit price will be saved.',
    confirmText: 'Save',
    type: 'neutral',
    action: () => saveKnowledge(herb),
  })
}

async function loadHerbs() {
  loading.value = true

  try {
    const snap = await getDocs(collection(db, HERBS))

    herbs.value = snap.docs
      .map((d) => ({
        id: d.id,
        ...d.data(),
      }))
      .filter((item) => isRealHerb(item))
      .map((item) => ({
        ...item,
        nameCn: sanitizeHerbName(item.nameCn),
        editNameCn: sanitizeHerbName(item.nameCn),

        functions: String(item.functions || '').trim(),
        editFunctions: String(item.functions || '').trim(),

        defaultDose: sanitizeDose(item.defaultDose || item.defaultGrams || DEFAULT_DOSE),
        editDefaultDose: sanitizeDose(item.defaultDose || item.defaultGrams || DEFAULT_DOSE),

        unitPrice: sanitizeUnitPrice(item.unitPrice || item.pricePerGram || DEFAULT_UNIT_PRICE),
        editUnitPrice: sanitizeUnitPrice(item.unitPrice || item.pricePerGram || DEFAULT_UNIT_PRICE),
      }))
  } catch (error) {
    console.error('loadHerbs error:', error)
    showToast('Load failed', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadHerbs()
})

const categories = computed(() => {
  const unique = [...new Set(herbs.value.map((h) => h.category).filter(Boolean))]
  return unique.map((name) => ({
    id: name,
    name,
  }))
})

const filteredHerbs = computed(() => {
  const keyword = normalizeString(searchKeyword.value)

  return herbs.value.filter((h) => {
    const matchKeyword =
      !keyword ||
      normalizeString(h.nameCn).includes(keyword) ||
      normalizeString(h.editNameCn).includes(keyword) ||
      normalizeString(h.editFunctions).includes(keyword) ||
      normalizeString(h.functions).includes(keyword) ||
      normalizeString(h.defaultDose).includes(keyword) ||
      normalizeString(h.unitPrice).includes(keyword)

    const matchCategory = selectedCategory.value === 'all' || h.category === selectedCategory.value

    return matchKeyword && matchCategory
  })
})

const groupedHerbs = computed(() => {
  const map = new Map()

  filteredHerbs.value
    .slice()
    .sort((a, b) => {
      if (Number(a.groupOrder || 0) !== Number(b.groupOrder || 0)) {
        return Number(a.groupOrder || 0) - Number(b.groupOrder || 0)
      }
      return Number(a.defaultOrder || 0) - Number(b.defaultOrder || 0)
    })
    .forEach((h) => {
      if (!map.has(h.category)) {
        map.set(h.category, {
          category: h.category,
          groupOrder: Number(h.groupOrder || 0),
          herbs: [],
        })
      }

      map.get(h.category).herbs.push(h)
    })

  const groups = [...map.values()].sort((a, b) => a.groupOrder - b.groupOrder)

  return groups.map((group, groupIndex) => ({
    ...group,
    herbs: group.herbs.map((herb) => ({
      ...herb,
      sequenceCode: `${getAlphabetLabel(groupIndex)}${Number(herb.defaultOrder || 0)}`,
    })),
  }))
})

async function saveKnowledge(herb) {
  const nextName = sanitizeHerbName(herb.editNameCn)

  if (!nextName) {
    showToast('Herb name cannot be empty', 'error')
    return
  }

  try {
    savingId.value = herb.id

    const payload = {
      nameCn: nextName,
      functions: String(herb.editFunctions || '').trim(),
      defaultDose: sanitizeDose(herb.editDefaultDose),
      unitPrice: sanitizeUnitPrice(herb.editUnitPrice),
      updatedAt: serverTimestamp(),
    }

    await updateDoc(doc(db, HERBS, herb.id), payload)

    herb.nameCn = payload.nameCn
    herb.editNameCn = payload.nameCn

    herb.functions = payload.functions
    herb.editFunctions = payload.functions

    herb.defaultDose = payload.defaultDose
    herb.editDefaultDose = payload.defaultDose

    herb.unitPrice = payload.unitPrice
    herb.editUnitPrice = payload.unitPrice

    showToast('Herb name, functions, default dose and unit price saved')
  } catch (error) {
    console.error('saveKnowledge error:', error)
    showToast('Save failed', 'error')
  } finally {
    savingId.value = ''
  }
}
</script>

<style scoped>
.knowledge-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header-card,
.toolbar-card,
.group-card,
.empty-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(15, 23, 42, 0.04);
  box-sizing: border-box;
}

.page-header-card h2 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  color: #173c2f;
}

.toolbar-card {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.85fr);
  gap: 18px;
  align-items: center;
}

.search-input,
.category-select,
.text-input,
.dose-input,
.price-input {
  width: 100%;
  height: 48px;
  border: 1px solid #d8dee7;
  border-radius: 14px;
  padding: 0 14px;
  font-size: 14px;
  background: #fff;
  outline: none;
  box-sizing: border-box;
}

.search-input:focus,
.category-select:focus,
.text-input:focus,
.dose-input:focus,
.price-input:focus,
.function-textarea:focus {
  border-color: #1c5b47;
  box-shadow: 0 0 0 4px rgba(28, 91, 71, 0.08);
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.group-card {
  overflow: hidden;
}

.group-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
}

.group-header h3 {
  margin: 0;
  font-size: 22px;
  color: #173c2f;
  font-weight: 800;
}

.group-count {
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

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-row {
  border-bottom: 1px solid #edf2ef;
  overflow: hidden;
}

.knowledge-row:last-child {
  border-bottom: none;
}

.knowledge-trigger {
  width: 100%;
  border: none;
  background: transparent;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 2px;
  cursor: pointer;
  text-align: left;
  box-sizing: border-box;
}

.knowledge-trigger-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.title-stack {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.title-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.title-line h4 {
  margin: 0;
  font-size: 17px;
  color: #173c2f;
  font-weight: 800;
}

.sequence-badge {
  min-width: 52px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #184c3b;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.function-preview {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  max-width: 420px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef5f1;
  color: #184c3b;
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.function-preview-multiline {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.7;
  white-space: normal;
  overflow-wrap: anywhere;
}

.knowledge-trigger-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.meta-pill,
.dose-pill,
.price-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  box-sizing: border-box;
}

.meta-pill {
  background: #eef5f1;
  color: #184c3b;
}

.dose-pill {
  background: #f7efe4;
  color: #8b5e1a;
}

.price-pill {
  background: #d68ba226;
  color: #184c3b;
}

.chevron {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: #f5f7fb;
  color: #355447;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.chevron.open {
  transform: rotate(180deg);
}

.knowledge-panel {
  width: 100%;
  box-sizing: border-box;
  padding: 0 0 18px 66px;
  overflow: hidden;
}

.edit-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 220px) minmax(160px, 220px);
  gap: 14px;
  margin-bottom: 14px;
  align-items: end;
}

.edit-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.herb-name-block {
  min-width: 0;
}

.field-label {
  display: block;
  margin-bottom: 10px;
  color: #355447;
  font-size: 13px;
  font-weight: 800;
}

.function-textarea {
  display: block;
  width: 100%;
  min-height: 140px;
  border: 1px solid #d8dee7;
  border-radius: 16px;
  padding: 14px 16px;
  font-size: 14px;
  background: #fff;
  outline: none;
  resize: vertical;
  line-height: 1.8;
  color: #1f2937;
  box-sizing: border-box;
  max-width: 100%;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.save-btn,
.ghost-btn,
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
  box-sizing: border-box;
}

.save-btn {
  border: none;
  background: #184c3b;
  color: #fff;
}

.ghost-btn {
  border: 1px solid #d9e1db;
  background: #ffffff;
  color: #355447;
}

.save-btn:hover,
.ghost-btn:hover,
.dialog-confirm-btn:hover {
  transform: translateY(-1px);
}

.save-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-card {
  text-align: center;
  color: #6b7280;
  font-weight: 700;
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
  z-index: 1000;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.14);
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
.expand-fade-leave-active,
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: all 0.24s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to,
.expand-fade-enter-from,
.expand-fade-leave-to,
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(3px);
  z-index: 1200;
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
  box-sizing: border-box;
}

.dialog-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 14px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 900;
  background: #eef5f1;
  color: #184c3b;
}

.dialog-title {
  margin: 0 0 8px;
  color: #173c2f;
  font-size: 20px;
  font-weight: 800;
}

.dialog-message {
  margin: 0;
  color: #6b7280;
  line-height: 1.7;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}

.dialog-confirm-btn.neutral {
  border: none;
  background: #184c3b;
  color: #fff;
}

.dialog-confirm-btn.danger {
  border: none;
  background: #dc2626;
  color: #fff;
}

@media (max-width: 1100px) {
  .edit-grid {
    grid-template-columns: 1fr 1fr;
  }

  .herb-name-block {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .toolbar-card {
    grid-template-columns: 1fr;
  }

  .knowledge-trigger {
    flex-direction: column;
    align-items: stretch;
  }

  .knowledge-trigger-right {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .knowledge-panel {
    padding-left: 0;
  }

  .edit-grid {
    grid-template-columns: 1fr;
  }

  .herb-name-block {
    grid-column: auto;
  }
}
</style>
