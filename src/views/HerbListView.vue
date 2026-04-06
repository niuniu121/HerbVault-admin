<template>
  <div class="herb-page">
    <section class="page-header-card">
      <div>
        <h2>Inventory</h2>
      </div>

      <div class="header-actions">
        <!-- <button class="ghost-btn" :disabled="loading || importingExcel" @click="handleImportSeeds">
          Import Default List
        </button> -->

        <label class="ghost-btn file-btn" :class="{ disabled: importingExcel }">
          {{ importingExcel ? 'Importing Excel...' : 'Import New Stock Excel' }}
          <input
            ref="excelInputRef"
            type="file"
            accept=".xlsx,.xls,.csv"
            class="hidden-file-input"
            @change="handleExcelImport"
          />
        </label>

        <button class="ghost-btn" @click="openAddCategoryModal">Add Category</button>
        <button class="primary-btn" @click="openAddHerbModal">Add Herb</button>

        <button
          class="sort-btn"
          :class="{ active: sortMode === 'default' }"
          @click="sortMode = 'default'"
        >
          Default
        </button>
        <button
          class="sort-btn"
          :class="{ active: sortMode === 'alphabetical' }"
          @click="sortMode = 'alphabetical'"
        >
          A–Z
        </button>
      </div>
    </section>

    <section class="toolbar-card">
      <input
        v-model="searchKeyword"
        class="search-input"
        type="text"
        placeholder="Search herb name..."
      />

      <select v-model="selectedCategory" class="category-select">
        <option value="all">All Categories</option>
        <option v-for="item in categories" :key="item.id" :value="item.name">
          {{ item.name }}
        </option>
      </select>
    </section>

    <section v-if="!loading" class="summary-card">
      <div class="summary-top">
        <div>
          <h3>Herb Stock Overview</h3>
        </div>
        <span class="summary-total">{{ summaryHerbCount }} herbs</span>
      </div>

      <div v-if="summaryGroups.length" class="summary-groups">
        <div v-for="group in summaryGroups" :key="group.category" class="summary-group-item">
          <button class="summary-group-trigger" @click="toggleSummaryCategory(group.category)">
            <div class="summary-group-left">
              <span
                class="summary-chevron"
                :class="{ open: isSummaryCategoryOpen(group.category) }"
              >
                ▾
              </span>
              <span class="summary-group-name">{{ group.category }}</span>
            </div>

            <div class="summary-group-right">
              <span class="summary-group-count">{{ group.herbs.length }} herbs</span>
            </div>
          </button>

          <transition name="expand-fade">
            <div v-if="isSummaryCategoryOpen(group.category)" class="summary-group-panel">
              <div class="summary-herb-list">
                <div v-for="herb in group.herbs" :key="herb.id" class="summary-herb-row">
                  <span class="summary-herb-name">{{ herb.nameCn }}</span>
                  <span class="summary-herb-stock" :class="{ low: getDisplayStock(herb) <= 3 }">
                    {{ getDisplayStock(herb) }} 瓶
                  </span>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div v-else class="summary-empty">No herb summary available.</div>
    </section>

    <section v-if="loading" class="empty-card">
      <p>Loading herbs...</p>
    </section>

    <template v-else>
      <section v-if="sortMode === 'default'" class="group-list">
        <div v-for="group in groupedHerbs" :key="group.category" class="group-card">
          <div class="group-header">
            <h3>{{ group.category }}</h3>
            <span>{{ group.herbs.length }} herbs</span>
          </div>

          <div class="table-head default-head">
            <div class="col-order">顺序</div>
            <div class="col-name">药材名称</div>
            <div class="col-stock">库存管理</div>
            <div class="col-actions">操作</div>
          </div>

          <div class="herb-list">
            <div v-for="herb in group.herbs" :key="herb.id" class="herb-row default-row">
              <div class="col-order">
                <span class="order-badge">{{ herb.defaultOrder }}</span>
              </div>

              <div class="col-name">
                <div class="name-main">{{ herb.nameCn }}</div>
              </div>

              <div class="col-stock">
                <div class="stock-editor">
                  <button class="stock-step-btn minus" @click="decreaseStock(herb)">−</button>

                  <input
                    v-model.number="herb.editStock"
                    class="stock-input"
                    type="number"
                    min="0"
                  />

                  <button class="stock-step-btn plus" @click="increaseStock(herb)">+</button>

                  <span
                    class="stock-status"
                    :class="{ low: herb.editStock <= 3, normal: herb.editStock > 3 }"
                  >
                    {{ herb.editStock }} 瓶
                  </span>
                </div>
              </div>

              <div class="col-actions">
                <div class="action-group">
                  <button
                    class="save-btn"
                    :disabled="savingId === herb.id"
                    @click="saveStock(herb)"
                  >
                    {{ savingId === herb.id ? 'Saving...' : 'Save' }}
                  </button>
                  <button
                    class="delete-btn"
                    :disabled="deletingId === herb.id"
                    @click="openDeleteModal(herb)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section v-if="groupedHerbs.length === 0" class="empty-card">
          <p>No herbs found.</p>
        </section>
      </section>

      <section v-else class="group-card">
        <div class="group-header">
          <h3>Alphabetical View</h3>
          <span>{{ filteredAlphabeticalHerbs.length }} herbs</span>
        </div>

        <div class="table-head alpha-head">
          <div class="col-category">分类</div>
          <div class="col-name">药材名称</div>
          <div class="col-stock">库存管理</div>
          <div class="col-actions">操作</div>
        </div>

        <div class="herb-list">
          <div v-for="herb in filteredAlphabeticalHerbs" :key="herb.id" class="herb-row alpha-row">
            <div class="col-category">
              <span class="category-pill">{{ herb.category }}</span>
            </div>

            <div class="col-name">
              <div class="name-main">{{ herb.nameCn }}</div>
            </div>

            <div class="col-stock">
              <div class="stock-editor">
                <button class="stock-step-btn minus" @click="decreaseStock(herb)">−</button>

                <input v-model.number="herb.editStock" class="stock-input" type="number" min="0" />

                <button class="stock-step-btn plus" @click="increaseStock(herb)">+</button>

                <span
                  class="stock-status"
                  :class="{ low: herb.editStock <= 3, normal: herb.editStock > 3 }"
                >
                  {{ herb.editStock }} 瓶
                </span>
              </div>
            </div>

            <div class="col-actions">
              <div class="action-group">
                <button class="save-btn" :disabled="savingId === herb.id" @click="saveStock(herb)">
                  {{ savingId === herb.id ? 'Saving...' : 'Save' }}
                </button>
                <button
                  class="delete-btn"
                  :disabled="deletingId === herb.id"
                  @click="openDeleteModal(herb)"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <section v-if="filteredAlphabeticalHerbs.length === 0" class="empty-card">
          <p>No herbs found.</p>
        </section>
      </section>
    </template>

    <transition name="toast-fade">
      <div v-if="toast.show" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </transition>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-card">
        <div class="modal-icon warning">!</div>
        <h3>Confirm Delete</h3>
        <p>
          Are you sure you want to delete
          <strong>{{ herbToDelete?.nameCn }}</strong
          >?
        </p>

        <div class="modal-actions">
          <button class="modal-cancel-btn" @click="closeDeleteModal">Cancel</button>
          <button
            class="modal-delete-btn"
            :disabled="deletingId === herbToDelete?.id"
            @click="confirmDelete"
          >
            {{ deletingId === herbToDelete?.id ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAddCategoryModal" class="modal-overlay" @click.self="closeAddCategoryModal">
      <div class="modal-card form-modal">
        <div class="modal-icon success">+</div>
        <h3>Add Category</h3>

        <div class="form-area single-form-area">
          <label>Category Name</label>
          <input v-model.trim="newCategoryName" class="modal-input" type="text" placeholder="" />
        </div>

        <div class="modal-actions">
          <button class="modal-cancel-btn" @click="closeAddCategoryModal">Cancel</button>
          <button class="modal-save-btn" :disabled="addingCategory" @click="confirmAddCategory">
            {{ addingCategory ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAddHerbModal" class="modal-overlay" @click.self="closeAddHerbModal">
      <div class="modal-card form-modal larger-modal">
        <div class="modal-icon success">+</div>
        <h3>Add Herb</h3>

        <div class="form-grid roomy-form-grid">
          <div class="form-area">
            <label>Herb Name</label>
            <input
              v-model.trim="newHerb.nameCn"
              class="modal-input"
              type="text"
              placeholder="请输入药材名称"
            />
          </div>

          <div class="form-area">
            <label>Category</label>
            <select v-model="newHerb.category" class="modal-input">
              <option value="">Select a category</option>
              <option v-for="item in categories" :key="item.id" :value="item.name">
                {{ item.name }}
              </option>
            </select>
          </div>

          <div class="form-area">
            <label>Stock</label>
            <input v-model.number="newHerb.stock" class="modal-input" type="number" min="0" />
          </div>

          <div class="form-area">
            <label>Unit</label>
            <input class="modal-input" type="text" value="瓶" disabled />
          </div>
        </div>

        <div class="modal-actions roomy-actions">
          <button class="modal-cancel-btn" @click="closeAddHerbModal">Cancel</button>
          <button class="modal-save-btn" :disabled="addingHerb" @click="confirmAddHerb">
            {{ addingHerb ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import * as XLSX from 'xlsx'
import { auth, db } from '../services/firebase'
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore'
import { herbSeeds } from '../data/herbSeeds.js'

const HERBS = 'herbs'
const LOGS = 'stock_logs'
const LOW_STOCK_THRESHOLD = 3

const sortMode = ref('default')
const searchKeyword = ref('')
const selectedCategory = ref('all')

const herbs = ref([])
const openSummaryCategories = ref([])

const loading = ref(true)
const savingId = ref('')
const deletingId = ref('')
const addingCategory = ref(false)
const addingHerb = ref(false)
const importingExcel = ref(false)
const excelInputRef = ref(null)

const toast = ref({
  show: false,
  message: '',
  type: 'success',
})

const showDeleteModal = ref(false)
const herbToDelete = ref(null)

const showAddCategoryModal = ref(false)
const newCategoryName = ref('')

const showAddHerbModal = ref(false)
const newHerb = ref({
  nameCn: '',
  category: '',
  stock: 0,
  unit: '瓶',
})

const IS_LOCAL_DEV =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

const ALERT_API_URL = IS_LOCAL_DEV
  ? 'https://herbvault-admin.pages.dev/api/send-telegram-alert'
  : '/api/send-telegram-alert'

const TELEGRAM_ALERT_SECRET = import.meta.env.VITE_TELEGRAM_ALERT_SECRET || ''

function getOperator() {
  return {
    uid: auth.currentUser?.uid || '',
    email: auth.currentUser?.email || '',
  }
}

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 2200)
}

async function loadPageData() {
  loading.value = true
  try {
    const snap = await getDocs(collection(db, HERBS))

    herbs.value = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      editStock: Number(d.data().stock || 0),
      lowStockAlertSent: d.data().lowStockAlertSent === true,
      telegramNotifyEnabled: d.data().telegramNotifyEnabled !== false,
      categoryNotifyEnabled: d.data().categoryNotifyEnabled !== false,
    }))
  } catch (e) {
    console.error('loadPageData error:', e)
    showToast(e.message || 'Load failed', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPageData()
})

const categories = computed(() => {
  const unique = [...new Set(herbs.value.map((h) => h.category).filter(Boolean))]
  return unique.map((name) => ({
    id: name,
    name,
  }))
})

const filteredHerbs = computed(() => {
  const keyword = searchKeyword.value.trim()

  return herbs.value.filter((h) => {
    const matchName = !keyword || h.nameCn.includes(keyword)
    const matchCat = selectedCategory.value === 'all' || h.category === selectedCategory.value
    return matchName && matchCat
  })
})

const groupedHerbs = computed(() => {
  const map = new Map()

  filteredHerbs.value
    .slice()
    .sort((a, b) => {
      if (a.groupOrder !== b.groupOrder) return a.groupOrder - b.groupOrder
      return a.defaultOrder - b.defaultOrder
    })
    .forEach((h) => {
      if (!map.has(h.category)) {
        map.set(h.category, {
          category: h.category,
          groupOrder: h.groupOrder,
          herbs: [],
        })
      }
      map.get(h.category).herbs.push(h)
    })

  return [...map.values()].sort((a, b) => a.groupOrder - b.groupOrder)
})

const filteredAlphabeticalHerbs = computed(() => {
  return [...filteredHerbs.value].sort((a, b) => a.nameCn.localeCompare(b.nameCn, 'zh-Hans-CN'))
})

function getDisplayStock(herb) {
  const stock = Number(herb?.editStock ?? herb?.stock ?? 0)
  return Number.isNaN(stock) ? 0 : Math.max(0, stock)
}

const summarySourceHerbs = computed(() => {
  return herbs.value.filter((h) => h.nameCn && h.nameCn !== '添加药材')
})

const summaryGroups = computed(() => {
  const map = new Map()

  summarySourceHerbs.value
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

  return [...map.values()].sort((a, b) => a.groupOrder - b.groupOrder)
})

const summaryHerbCount = computed(() => summarySourceHerbs.value.length)

function toggleSummaryCategory(categoryName) {
  const exists = openSummaryCategories.value.includes(categoryName)

  if (exists) {
    openSummaryCategories.value = openSummaryCategories.value.filter(
      (item) => item !== categoryName,
    )
  } else {
    openSummaryCategories.value = [...openSummaryCategories.value, categoryName]
  }
}

function isSummaryCategoryOpen(categoryName) {
  return openSummaryCategories.value.includes(categoryName)
}

function increaseStock(h) {
  h.editStock++
}

function decreaseStock(h) {
  h.editStock = Math.max(0, h.editStock - 1)
}

async function sendLowStockTelegramAlert(herbName, currentStock) {
  if (!TELEGRAM_ALERT_SECRET) {
    throw new Error('Missing VITE_TELEGRAM_ALERT_SECRET')
  }

  const message = `🔥 Low Stock Alert

Herb: ${herbName}
Current Stock: ${currentStock}
Threshold: ≤ ${LOW_STOCK_THRESHOLD}

Please restock soon.`

  const response = await fetch(ALERT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-secret': TELEGRAM_ALERT_SECRET,
    },
    body: JSON.stringify({ message }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.message || `Telegram alert failed (${response.status})`)
  }

  return data
}

async function syncLowStockAlertStatus(herb, finalStock) {
  try {
    const alreadySent = herb.lowStockAlertSent === true

    const categoryNotifyEnabled = herb.categoryNotifyEnabled !== false
    const herbNotifyEnabled = herb.telegramNotifyEnabled !== false
    const allowTelegram = categoryNotifyEnabled && herbNotifyEnabled

    if (!allowTelegram) {
      if (alreadySent) {
        await updateDoc(doc(db, HERBS, herb.id), {
          lowStockAlertSent: false,
          lowStockThreshold: LOW_STOCK_THRESHOLD,
        })
        herb.lowStockAlertSent = false
      }
      return
    }

    if (finalStock <= LOW_STOCK_THRESHOLD && !alreadySent) {
      await sendLowStockTelegramAlert(herb.nameCn, finalStock)

      await updateDoc(doc(db, HERBS, herb.id), {
        lowStockAlertSent: true,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      })

      herb.lowStockAlertSent = true
      return
    }

    if (finalStock > LOW_STOCK_THRESHOLD && alreadySent) {
      await updateDoc(doc(db, HERBS, herb.id), {
        lowStockAlertSent: false,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      })

      herb.lowStockAlertSent = false
      return
    }

    if (finalStock > LOW_STOCK_THRESHOLD && !alreadySent) {
      herb.lowStockAlertSent = false
    }
  } catch (e) {
    console.error('syncLowStockAlertStatus error:', e)
    showToast('Stock saved, but alert failed', 'error')
  }
}

async function saveStock(herb) {
  try {
    savingId.value = herb.id

    const finalStock = Math.max(0, Number(herb.editStock || 0))
    const delta = finalStock - Number(herb.stock || 0)

    await updateDoc(doc(db, HERBS, herb.id), {
      stock: finalStock,
      unit: '瓶',
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      updatedAt: serverTimestamp(),
    })

    await addDoc(collection(db, LOGS), {
      herbId: herb.id,
      herbName: herb.nameCn,
      herbNameCn: herb.nameCn,
      category: herb.category,
      stock: finalStock,
      change: delta,
      type: 'manual_update',
      operator: getOperator(),
      timestamp: serverTimestamp(),
    })

    herb.stock = finalStock
    herb.editStock = finalStock

    showToast('Saved')

    await syncLowStockAlertStatus(herb, finalStock)
  } catch (e) {
    console.error('saveStock error:', e)
    showToast('Save failed', 'error')
  } finally {
    savingId.value = ''
  }
}

function openDeleteModal(h) {
  herbToDelete.value = h
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  herbToDelete.value = null
}

async function confirmDelete() {
  try {
    if (!herbToDelete.value) return

    deletingId.value = herbToDelete.value.id

    await deleteDoc(doc(db, HERBS, herbToDelete.value.id))

    herbs.value = herbs.value.filter((h) => h.id !== herbToDelete.value.id)

    showToast('Deleted')
  } catch (e) {
    console.error('confirmDelete error:', e)
    showToast('Delete failed', 'error')
  } finally {
    deletingId.value = ''
    closeDeleteModal()
  }
}

function openAddCategoryModal() {
  newCategoryName.value = ''
  showAddCategoryModal.value = true
}

function closeAddCategoryModal() {
  showAddCategoryModal.value = false
}

async function confirmAddCategory() {
  try {
    const name = newCategoryName.value.trim()

    if (!name) {
      showToast('Please enter category name', 'error')
      return
    }

    if (categories.value.some((item) => item.name === name)) {
      showToast('Category already exists', 'error')
      return
    }

    addingCategory.value = true

    const nextGroupOrder =
      herbs.value.length > 0
        ? Math.max(...herbs.value.map((h) => Number(h.groupOrder || 0))) + 1
        : 1

    await addDoc(collection(db, HERBS), {
      nameCn: `添加药材`,
      category: name,
      groupOrder: nextGroupOrder,
      defaultOrder: 1,
      stock: 0,
      unit: '瓶',
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStockAlertSent: false,
      telegramNotifyEnabled: true,
      categoryNotifyEnabled: true,
      isActive: true,
      createdAt: serverTimestamp(),
    })

    showToast('Category added')
    closeAddCategoryModal()
    await loadPageData()
  } catch (e) {
    console.error('confirmAddCategory error:', e)
    showToast('Add category failed', 'error')
  } finally {
    addingCategory.value = false
  }
}

function openAddHerbModal() {
  newHerb.value = {
    nameCn: '',
    category: selectedCategory.value === 'all' ? '' : selectedCategory.value,
    stock: 0,
    unit: '瓶',
  }
  showAddHerbModal.value = true
}

function closeAddHerbModal() {
  showAddHerbModal.value = false
}

async function confirmAddHerb() {
  try {
    const name = newHerb.value.nameCn.trim()
    const category = newHerb.value.category
    const stock = Math.max(0, Number(newHerb.value.stock || 0))

    if (!name) {
      showToast('Please enter herb name', 'error')
      return
    }

    if (!category) {
      showToast('Please select category', 'error')
      return
    }

    addingHerb.value = true

    const sameCategoryHerbs = herbs.value.filter((h) => h.category === category)
    const nextDefaultOrder =
      sameCategoryHerbs.length > 0
        ? Math.max(...sameCategoryHerbs.map((h) => Number(h.defaultOrder || 0))) + 1
        : 1

    const foundCategory = herbs.value.find((h) => h.category === category)
    const groupOrder = foundCategory ? Number(foundCategory.groupOrder || 1) : 1

    await addDoc(collection(db, HERBS), {
      nameCn: name,
      category,
      groupOrder,
      defaultOrder: nextDefaultOrder,
      stock,
      unit: '瓶',
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStockAlertSent: false,
      telegramNotifyEnabled: true,
      categoryNotifyEnabled: true,
      isActive: true,
      createdAt: serverTimestamp(),
    })

    showToast('Herb added')
    closeAddHerbModal()
    await loadPageData()
  } catch (e) {
    console.error('confirmAddHerb error:', e)
    showToast('Add herb failed', 'error')
  } finally {
    addingHerb.value = false
  }
}

async function handleImportSeeds() {
  try {
    loading.value = true

    const snap = await getDocs(collection(db, HERBS))
    if (!snap.empty) {
      showToast('Already imported', 'error')
      return
    }

    for (const item of herbSeeds) {
      await addDoc(collection(db, HERBS), {
        ...item,
        stock: item.stock || 0,
        unit: '瓶',
        lowStockThreshold: LOW_STOCK_THRESHOLD,
        lowStockAlertSent: false,
        telegramNotifyEnabled: true,
        categoryNotifyEnabled: true,
        createdAt: serverTimestamp(),
      })
    }

    showToast('Import success')
    await loadPageData()
  } catch (e) {
    console.error('handleImportSeeds error:', e)
    showToast('Import failed', 'error')
  } finally {
    loading.value = false
  }
}

async function handleExcelImport(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    importingExcel.value = true

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    if (!rows.length) {
      showToast('Excel is empty', 'error')
      return
    }

    let updatedCount = 0

    for (const row of rows) {
      const herbName = String(row.name || row.Name || row.herb || row.药名 || '').trim()
      const quantityRaw = row.quantity ?? row.Quantity ?? row.qty ?? row.数量 ?? ''
      const quantity = Number(quantityRaw)

      if (!herbName || Number.isNaN(quantity) || quantity <= 0) {
        continue
      }

      const q = query(collection(db, HERBS), where('nameCn', '==', herbName))
      const snap = await getDocs(q)

      if (snap.empty) {
        continue
      }

      const targetDoc = snap.docs[0]
      const herbData = targetDoc.data()
      const currentStock = Number(herbData.stock || 0)
      const nextStock = currentStock + quantity
      const alreadySent = herbData.lowStockAlertSent === true

      const updatePayload = {
        stock: nextStock,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
        telegramNotifyEnabled: herbData.telegramNotifyEnabled !== false,
        categoryNotifyEnabled: herbData.categoryNotifyEnabled !== false,
        updatedAt: serverTimestamp(),
      }

      if (nextStock > LOW_STOCK_THRESHOLD && alreadySent) {
        updatePayload.lowStockAlertSent = false
      }

      await updateDoc(doc(db, HERBS, targetDoc.id), updatePayload)

      await addDoc(collection(db, LOGS), {
        herbId: targetDoc.id,
        herbName: herbName,
        herbNameCn: herbName,
        category: herbData.category || '',
        stock: nextStock,
        change: quantity,
        type: 'import',
        source: 'excel',
        operator: getOperator(),
        timestamp: serverTimestamp(),
      })

      updatedCount++
    }

    if (updatedCount === 0) {
      showToast('No matching herbs found in Excel', 'error')
    } else {
      showToast(`Excel import success: ${updatedCount} updated`)
      await loadPageData()
    }
  } catch (e) {
    console.error('handleExcelImport error:', e)
    showToast('Excel import failed', 'error')
  } finally {
    importingExcel.value = false
    if (excelInputRef.value) {
      excelInputRef.value.value = ''
    }
  }
}
</script>

<style scoped>
.herb-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header-card,
.toolbar-card,
.group-card,
.empty-card,
.summary-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.empty-card {
  text-align: center;
  color: #6b7280;
  font-weight: 700;
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
  max-width: 620px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.primary-btn,
.ghost-btn,
.sort-btn,
.file-btn {
  border-radius: 14px;
  height: 42px;
  padding: 0 16px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.primary-btn {
  border: none;
  background: #184c3b;
  color: #fff;
}

.ghost-btn,
.file-btn {
  border: 1px solid #d9e1db;
  background: #ffffff;
  color: #355447;
}

.sort-btn {
  border: 1px solid #d9e1db;
  background: #f7faf8;
  color: #355447;
}

.sort-btn.active {
  background: #184c3b;
  color: #fff;
  border-color: #184c3b;
}

.primary-btn:hover,
.ghost-btn:hover,
.sort-btn:hover,
.file-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:disabled,
.ghost-btn:disabled,
.sort-btn:disabled,
.file-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hidden-file-input {
  display: none;
}

.toolbar-card {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.85fr);
  gap: 18px;
  align-items: center;
}

.search-input,
.category-select,
.modal-input {
  height: 48px;
  border: 1px solid #d8dee7;
  border-radius: 14px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  background: #fff;
  width: 85%;
}

.search-input:focus,
.category-select:focus,
.modal-input:focus {
  border-color: #1c5b47;
  box-shadow: 0 0 0 4px rgba(28, 91, 71, 0.08);
}

.summary-card {
  padding: 22px;
}

.summary-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.summary-top h3 {
  margin: 0;
  font-size: 22px;
  color: #173c2f;
}

.summary-top p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
}

.summary-total {
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

.summary-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-group-item {
  border: 1px solid #e7eeea;
  border-radius: 18px;
  background: linear-gradient(180deg, #fbfcfb 0%, #f7faf8 100%);
  overflow: hidden;
}

.summary-group-trigger {
  width: 100%;
  border: none;
  background: transparent;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: 0.2s ease;
}

.summary-group-trigger:hover {
  background: rgba(24, 76, 59, 0.02);
}

.summary-group-left,
.summary-group-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  font-size: 14px;
  color: #184c3b;
  transition: transform 0.2s ease;
}

.summary-chevron.open {
  transform: rotate(180deg);
}

.summary-group-name {
  font-size: 16px;
  font-weight: 800;
  color: #173c2f;
}

.summary-group-count {
  font-size: 12px;
  font-weight: 800;
  color: #6b7280;
  background: #ffffff;
  border: 1px solid #e5ebe7;
  border-radius: 999px;
  padding: 6px 10px;
}

.summary-group-panel {
  padding: 0 18px 18px;
}

.summary-herb-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
}

.summary-herb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #edf2ef;
}

.summary-herb-name {
  color: #1f2937;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}

.summary-herb-stock {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  background: #edf8f1;
  color: #24995b;
}

.summary-herb-stock.low {
  background: #fff1f2;
  color: #dc2626;
}

.summary-empty {
  color: #6b7280;
  font-weight: 700;
  text-align: center;
  padding: 12px 0 4px;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.group-header h3 {
  margin: 0;
  font-size: 22px;
  color: #173c2f;
}

.group-header span {
  font-size: 13px;
  color: #6b7280;
  font-weight: 700;
}

.table-head {
  gap: 14px;
  padding: 0 14px 10px;
  border-bottom: 1px solid #edf2ef;
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 800;
}

.default-head {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) 340px 170px;
}

.alpha-head {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) 340px 170px;
}

.herb-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.herb-row {
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px solid #e7eeea;
  border-radius: 18px;
  background: linear-gradient(180deg, #fbfcfb 0%, #f7faf8 100%);
  transition: 0.2s ease;
}

.default-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) 340px 170px;
}

.alpha-row {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) 340px 170px;
}

.herb-row:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.col-order,
.col-category,
.col-name,
.col-stock,
.col-actions {
  min-width: 0;
}

.order-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 46px;
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #eef5f1;
  color: #184c3b;
  font-size: 13px;
  font-weight: 800;
}

.name-main {
  font-size: 17px;
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
  line-height: 1.4;
}

.stock-editor {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stock-step-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s ease;
}

.stock-step-btn.minus {
  background: #fef2f2;
  color: #dc2626;
}

.stock-step-btn.plus {
  background: #edf8f1;
  color: #24995b;
}

.stock-step-btn:hover {
  transform: translateY(-1px);
}

.stock-input {
  width: 90px;
  height: 38px;
  border: 1px solid #d8dee7;
  border-radius: 12px;
  padding: 0 10px;
  font-size: 14px;
  font-weight: 700;
  outline: none;
  text-align: center;
}

.stock-input:focus {
  border-color: #1c5b47;
  box-shadow: 0 0 0 4px rgba(28, 91, 71, 0.08);
}

.stock-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.stock-status.normal {
  background: #edf8f1;
  color: #24995b;
}

.stock-status.low {
  background: #fff1f2;
  color: #dc2626;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.save-btn,
.delete-btn {
  border: none;
  border-radius: 12px;
  height: 36px;
  padding: 0 14px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s ease;
}

.save-btn {
  background: #184c3b;
  color: #ffffff;
}

.delete-btn {
  background: #1f2937;
  color: #ffffff;
}

.save-btn:hover,
.delete-btn:hover {
  transform: translateY(-1px);
}

.save-btn:disabled,
.delete-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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

.expand-fade-enter-active,
.expand-fade-leave-active {
  transition: all 0.22s ease;
}

.expand-fade-enter-from,
.expand-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 999;
}

.modal-card {
  width: 100%;
  max-width: 460px;
  background: #ffffff;
  border-radius: 24px;
  padding: 32px 34px;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.16);
  text-align: center;
}

.larger-modal {
  max-width: 730px;
  padding: 42px 36px 34px;
}

.form-modal {
  text-align: left;
}

.modal-icon {
  width: 82px;
  height: 82px;
  margin: 0 auto 22px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  font-weight: 500;
}

.modal-icon.warning {
  background: #fff1f2;
  color: #dc2626;
}

.modal-icon.success {
  background: #edf8f1;
  color: #24995b;
}

.modal-card h3 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
  text-align: center;
}

.modal-card p {
  margin: 12px 0 0;
  color: #6b7280;
  line-height: 1.6;
  text-align: center;
}

.modal-note {
  font-size: 13px;
  color: #9ca3af;
}

.form-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px 26px;
}

.roomy-form-grid {
  margin-top: 28px;
  gap: 26px 28px;
}

.form-area {
  margin-top: 18px;
}

.single-form-area {
  margin-top: 26px;
}

.form-grid .form-area {
  margin-top: 0;
}

.form-area label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.modal-actions {
  margin-top: 26px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.roomy-actions {
  margin-top: 34px;
  gap: 16px;
}

.modal-cancel-btn,
.modal-delete-btn,
.modal-save-btn {
  min-width: 110px;
  height: 42px;
  border: none;
  border-radius: 14px;
  font-weight: 800;
  cursor: pointer;
}

.modal-cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.modal-delete-btn {
  background: #dc2626;
  color: white;
}

.modal-save-btn {
  background: #184c3b;
  color: white;
}

@media (max-width: 1100px) {
  .default-head,
  .default-row {
    grid-template-columns: 100px minmax(0, 1fr) 1fr 150px;
  }

  .alpha-head,
  .alpha-row {
    grid-template-columns: 140px minmax(0, 1fr) 1fr 150px;
  }

  .summary-herb-list {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 900px) {
  .page-header-card,
  .toolbar-card,
  .summary-top {
    display: flex;
    flex-direction: column;
  }

  .table-head {
    display: none;
  }

  .default-row,
  .alpha-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .name-main {
    font-size: 16px;
  }

  .stock-editor,
  .action-group {
    justify-content: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .toast {
    right: 14px;
    left: 14px;
    max-width: none;
    min-width: auto;
  }

  .toolbar-card {
    gap: 14px;
  }

  .larger-modal {
    max-width: 100%;
    padding: 30px 20px 24px;
  }

  .modal-card {
    padding: 28px 20px;
  }

  .summary-herb-list {
    grid-template-columns: 1fr;
  }
}
</style>
