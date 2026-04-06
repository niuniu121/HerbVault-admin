<template>
  <div class="settings-page">
    <section class="page-card settings-header-card">
      <div>
        <h2>Settings</h2>
      </div>

      <div class="header-right">
        <span class="header-pill">{{ categoryGroups.length }} categories</span>
      </div>
    </section>

    <section class="page-card toolbar-card">
      <input
        v-model.trim="searchKeyword"
        class="search-input"
        type="text"
        placeholder="Search category or herb name..."
      />

      <div class="toolbar-right">
        <button class="ghost-btn" @click="expandAll">Expand All</button>
        <button class="ghost-btn" @click="collapseAll">Collapse All</button>
      </div>
    </section>

    <section v-if="loading" class="page-card empty-card">
      <p>Loading settings...</p>
    </section>

    <section v-else-if="filteredGroups.length === 0" class="page-card empty-card">
      <p>No matching categories or herbs found.</p>
    </section>

    <section v-else class="group-list">
      <div v-for="group in filteredGroups" :key="group.category" class="page-card group-card">
        <div class="group-top">
          <button class="group-left" @click="toggleGroup(group.category)">
            <span class="chevron" :class="{ open: isGroupOpen(group.category) }">▾</span>

            <div class="group-meta">
              <div class="group-title-row">
                <h3>{{ group.category }}</h3>
                <span class="group-count">{{ group.herbs.length }} herbs</span>
              </div>
              <p class="group-desc">
                Turn off this category to stop Telegram alerts for all herbs inside it.
              </p>
            </div>
          </button>

          <div class="group-switch-area">
            <span class="switch-label">
              {{ group.categoryNotifyEnabled ? 'Visible' : 'Hidden' }}
            </span>

            <button
              class="switch-btn"
              :class="{
                active: group.categoryNotifyEnabled,
                disabled: savingCategoryMap[group.category],
              }"
              :disabled="savingCategoryMap[group.category]"
              @click.stop="toggleCategoryNotification(group)"
            >
              <span class="switch-thumb"></span>
            </button>
          </div>
        </div>

        <transition name="expand-fade">
          <div v-if="isGroupOpen(group.category)" class="group-panel">
            <div class="herb-list">
              <div v-for="herb in group.herbs" :key="herb.id" class="herb-row">
                <div class="herb-main">
                  <div class="herb-name-row">
                    <span class="herb-name">{{ herb.nameCn }}</span>
                    <span
                      class="stock-pill"
                      :class="{
                        low: Number(herb.stock || 0) <= 3,
                        normal: Number(herb.stock || 0) > 3,
                      }"
                    >
                      {{ Number(herb.stock || 0) }} 瓶
                    </span>
                  </div>

                  <p class="herb-desc">
                    {{ getHerbStatusText(group, herb) }}
                  </p>
                </div>

                <div class="herb-switch-area">
                  <span class="switch-label">
                    {{ getEffectiveNotifyEnabled(group, herb) ? 'Visible' : 'Hidden' }}
                  </span>

                  <button
                    class="switch-btn"
                    :class="{
                      active: herb.telegramNotifyEnabled !== false,
                      disabled:
                        savingHerbId === herb.id ||
                        savingCategoryMap[group.category] ||
                        !group.categoryNotifyEnabled,
                    }"
                    :disabled="
                      savingHerbId === herb.id ||
                      savingCategoryMap[group.category] ||
                      !group.categoryNotifyEnabled
                    "
                    @click.stop="toggleHerbNotification(group, herb)"
                  >
                    <span class="switch-thumb"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>
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
import { db } from '../services/firebase'
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'

const HERBS = 'herbs'

const loading = ref(true)
const herbs = ref([])
const searchKeyword = ref('')
const openGroups = ref([])

const savingHerbId = ref('')
const savingCategoryMap = ref({})

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

function normalizeBoolean(value, fallback = true) {
  return typeof value === 'boolean' ? value : fallback
}

function mapHerbDoc(d) {
  const data = d.data()

  return {
    id: d.id,
    ...data,
    stock: Number(data.stock || 0),
    telegramNotifyEnabled: normalizeBoolean(data.telegramNotifyEnabled, true),
    categoryNotifyEnabled: normalizeBoolean(data.categoryNotifyEnabled, true),
  }
}

async function loadSettings() {
  loading.value = true
  try {
    const snap = await getDocs(collection(db, HERBS))

    herbs.value = snap.docs
      .map(mapHerbDoc)
      .filter((item) => item.category && item.nameCn && item.nameCn !== '添加药材')
  } catch (error) {
    console.error('loadSettings error:', error)
    showToast(error.message || 'Load failed', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadSettings()
  expandAll()
})

const categoryGroups = computed(() => {
  const map = new Map()

  herbs.value
    .slice()
    .sort((a, b) => {
      if (Number(a.groupOrder || 0) !== Number(b.groupOrder || 0)) {
        return Number(a.groupOrder || 0) - Number(b.groupOrder || 0)
      }
      return Number(a.defaultOrder || 0) - Number(b.defaultOrder || 0)
    })
    .forEach((item) => {
      if (!map.has(item.category)) {
        map.set(item.category, {
          category: item.category,
          groupOrder: Number(item.groupOrder || 0),
          herbs: [],
          categoryNotifyEnabled: item.categoryNotifyEnabled !== false,
        })
      }

      map.get(item.category).herbs.push(item)
    })

  return [...map.values()].sort((a, b) => a.groupOrder - b.groupOrder)
})

const filteredGroups = computed(() => {
  const keyword = searchKeyword.value.trim()

  if (!keyword) return categoryGroups.value

  return categoryGroups.value
    .map((group) => {
      const categoryMatched = group.category.includes(keyword)

      if (categoryMatched) {
        return group
      }

      const matchedHerbs = group.herbs.filter((herb) => herb.nameCn.includes(keyword))

      if (!matchedHerbs.length) return null

      return {
        ...group,
        herbs: matchedHerbs,
      }
    })
    .filter(Boolean)
})

function expandAll() {
  openGroups.value = categoryGroups.value.map((group) => group.category)
}

function collapseAll() {
  openGroups.value = []
}

function toggleGroup(categoryName) {
  if (openGroups.value.includes(categoryName)) {
    openGroups.value = openGroups.value.filter((item) => item !== categoryName)
  } else {
    openGroups.value = [...openGroups.value, categoryName]
  }
}

function isGroupOpen(categoryName) {
  return openGroups.value.includes(categoryName)
}

function getEffectiveNotifyEnabled(group, herb) {
  return group.categoryNotifyEnabled && herb.telegramNotifyEnabled !== false
}

function getHerbStatusText(group, herb) {
  if (!group.categoryNotifyEnabled) {
    return 'Category is hidden. Telegram alerts for this herb are disabled.'
  }

  if (herb.telegramNotifyEnabled === false) {
    return 'This herb is hidden. Telegram alerts for this herb are disabled.'
  }

  return 'Telegram alerts are enabled for this herb.'
}

async function toggleCategoryNotification(group) {
  const nextValue = !group.categoryNotifyEnabled

  try {
    savingCategoryMap.value = {
      ...savingCategoryMap.value,
      [group.category]: true,
    }

    const batch = writeBatch(db)

    const affectedHerbs = herbs.value.filter((item) => item.category === group.category)

    affectedHerbs.forEach((item) => {
      batch.update(doc(db, HERBS, item.id), {
        categoryNotifyEnabled: nextValue,
        updatedAt: serverTimestamp(),
      })
    })

    await batch.commit()

    herbs.value = herbs.value.map((item) => {
      if (item.category !== group.category) return item
      return {
        ...item,
        categoryNotifyEnabled: nextValue,
      }
    })

    showToast(
      nextValue
        ? `${group.category} Telegram alerts shown`
        : `${group.category} Telegram alerts hidden`,
    )
  } catch (error) {
    console.error('toggleCategoryNotification error:', error)
    showToast('Category update failed', 'error')
  } finally {
    savingCategoryMap.value = {
      ...savingCategoryMap.value,
      [group.category]: false,
    }
  }
}

async function toggleHerbNotification(group, herb) {
  const nextValue = herb.telegramNotifyEnabled === false

  try {
    savingHerbId.value = herb.id

    await updateDoc(doc(db, HERBS, herb.id), {
      telegramNotifyEnabled: nextValue,
      updatedAt: serverTimestamp(),
    })

    herbs.value = herbs.value.map((item) => {
      if (item.id !== herb.id) return item
      return {
        ...item,
        telegramNotifyEnabled: nextValue,
      }
    })

    showToast(
      nextValue ? `${herb.nameCn} Telegram alert shown` : `${herb.nameCn} Telegram alert hidden`,
    )
  } catch (error) {
    console.error('toggleHerbNotification error:', error)
    showToast('Herb update failed', 'error')
  } finally {
    savingHerbId.value = ''
  }
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.settings-header-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.settings-header-card h2 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  color: #173c2f;
}

.page-desc {
  margin: 10px 0 0;
  color: #6b7280;
  line-height: 1.6;
  max-width: 640px;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: #eef5f1;
  color: #184c3b;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.toolbar-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 48px;
  border: 1px solid #d8dee7;
  border-radius: 14px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  background: #fff;
}

.search-input:focus {
  border-color: #1c5b47;
  box-shadow: 0 0 0 4px rgba(28, 91, 71, 0.08);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ghost-btn {
  border: 1px solid #d9e1db;
  background: #ffffff;
  color: #355447;
  border-radius: 14px;
  height: 42px;
  padding: 0 16px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.ghost-btn:hover {
  transform: translateY(-1px);
}

.empty-card {
  text-align: center;
  color: #6b7280;
  font-weight: 700;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.group-card {
  padding: 0;
  overflow: hidden;
}

.group-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 22px;
}

.group-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  padding: 0;
}

.chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  min-width: 24px;
  color: #184c3b;
  font-size: 14px;
  transition: transform 0.2s ease;
  margin-top: 2px;
}

.chevron.open {
  transform: rotate(180deg);
}

.group-meta {
  min-width: 0;
}

.group-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.group-title-row h3 {
  margin: 0;
  font-size: 22px;
  color: #173c2f;
}

.group-count {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f4f7f5;
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.group-desc {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
}

.group-switch-area,
.herb-switch-area {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.switch-label {
  font-size: 13px;
  font-weight: 700;
  color: #6b7280;
  min-width: 50px;
  text-align: right;
}

.switch-btn {
  width: 58px;
  height: 32px;
  border: none;
  border-radius: 999px;
  background: #d9e1db;
  position: relative;
  cursor: pointer;
  transition: all 0.22s ease;
  padding: 0;
}

.switch-btn.active {
  background: linear-gradient(135deg, #174c3c, #2f7d5c);
}

.switch-btn.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.switch-thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.16);
  transition: all 0.22s ease;
}

.switch-btn.active .switch-thumb {
  left: 30px;
}

.group-panel {
  padding: 0 22px 22px;
  border-top: 1px solid #edf2ef;
  background: linear-gradient(180deg, #fbfcfb 0%, #f7faf8 100%);
}

.herb-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 16px;
}

.herb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #e7eeea;
}

.herb-main {
  flex: 1;
  min-width: 0;
}

.herb-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.herb-name {
  font-size: 16px;
  font-weight: 800;
  color: #1f2937;
}

.herb-desc {
  margin: 8px 0 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
}

.stock-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.stock-pill.normal {
  background: #edf8f1;
  color: #24995b;
}

.stock-pill.low {
  background: #fff1f2;
  color: #dc2626;
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

@media (max-width: 900px) {
  .settings-header-card,
  .toolbar-card,
  .group-top,
  .herb-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-right,
  .group-switch-area,
  .herb-switch-area {
    width: 100%;
    justify-content: space-between;
  }

  .toast {
    right: 14px;
    left: 14px;
    max-width: none;
    min-width: auto;
  }
}
</style>
