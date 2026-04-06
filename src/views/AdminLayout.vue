<template>
  <div class="admin-shell">
    <!-- 移动端遮罩 -->
    <transition name="fade">
      <div v-if="isMobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>
    </transition>

    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-mobile-open': isMobileMenuOpen }]">
      <div class="brand">
        <div class="brand-badge">HV</div>
        <div>
          <h1>HerbVault</h1>
          <p>Admin System</p>
        </div>

        <!-- 移动端关闭按钮 -->
        <button class="mobile-close-btn" @click="closeMobileMenu" aria-label="Close menu">✕</button>
      </div>

      <nav class="nav">
        <RouterLink to="/dashboard" class="nav-link" @click="handleNavClick">
          <span class="nav-icon">⌂</span>
          <span>Dashboard</span>
        </RouterLink>

        <RouterLink to="/herbs" class="nav-link" @click="handleNavClick">
          <span class="nav-icon">✿</span>
          <span>Herbs</span>
        </RouterLink>

        <RouterLink to="/history" class="nav-link" @click="handleNavClick">
          <span class="nav-icon">↺</span>
          <span>History</span>
        </RouterLink>

        <RouterLink to="/settings" class="nav-link" @click="handleNavClick">
          <span class="nav-icon">⚙</span>
          <span>Settings</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <!-- 移动端汉堡按钮 -->
          <button class="hamburger-btn" @click="toggleMobileMenu" aria-label="Open menu">
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div>
            <h2 class="topbar-title">Herbal Inventory</h2>
          </div>
        </div>

        <div class="topbar-right">
          <div class="status-pill">
            <button class="logout-btn" @click="handleLogout">⎋ Logout</button>
          </div>
        </div>
      </header>

      <section class="content-area">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const router = useRouter()
const isMobileMenuOpen = ref(false)
const isMobile = ref(false)

const checkScreen = () => {
  isMobile.value = window.innerWidth <= 900
  if (!isMobile.value) {
    isMobileMenuOpen.value = false
  }
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleNavClick = () => {
  if (isMobile.value) {
    closeMobileMenu()
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  checkScreen()
  window.addEventListener('resize', checkScreen)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreen)
})
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: flex;
  background: radial-gradient(
    circle at top left,
    #f5f8f2 0%,
    #eef3ed 28%,
    #f7f8fb 58%,
    #f4f6fa 100%
  );
  color: #1f2937;
  position: relative;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 272px;
  background: linear-gradient(180deg, #174c3c 0%, #12392d 100%);
  color: #ffffff;
  padding: 24px 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 8px 0 30px rgba(18, 57, 45, 0.08);
  z-index: 30;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 30px;
  padding: 8px 6px;
  position: relative;
}

.brand-badge {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #dcefd8, #b6ddca);
  color: #174c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(9, 31, 24, 0.18);
  flex-shrink: 0;
}

.brand h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.brand p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.mobile-close-btn {
  display: none;
  margin-left: auto;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.22s ease;
}

.mobile-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.88);
  text-decoration: none;
  padding: 14px 14px;
  border-radius: 16px;
  transition: all 0.22s ease;
  font-size: 15px;
  font-weight: 600;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(2px);
}

.router-link-active {
  background: linear-gradient(135deg, rgba(220, 239, 216, 0.18), rgba(255, 255, 255, 0.1));
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(220, 239, 216, 0.12);
}

.nav-icon {
  width: 18px;
  text-align: center;
  opacity: 0.95;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 22px;
}

.footer-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 16px;
  backdrop-filter: blur(6px);
}

.footer-title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #dcefd8;
}

.footer-text {
  margin: 0;
  line-height: 1.5;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.76);
}

/* Main */
.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 86px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.topbar-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #183b2e;
}

.topbar-right {
  display: flex;
  align-items: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 14px;
  color: #374151;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}

.content-area {
  padding: 28px 32px 36px;
}

.logout-btn {
  border: none;
  background: linear-gradient(135deg, #174c3c, #2f7d5c);
  color: #fff;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 6px 14px rgba(23, 76, 60, 0.2);
}

.logout-btn:hover {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 10px 20px rgba(23, 76, 60, 0.28);
  background: linear-gradient(135deg, #1f6a53, #3aa87b);
}

.logout-btn:active {
  transform: scale(0.95);
}

/* Hamburger */
.hamburger-btn {
  display: none;
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffffff, #f3f7f2);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  padding: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  transition: all 0.22s ease;
}

.hamburger-btn:hover {
  transform: translateY(-1px);
}

.hamburger-btn span {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: #174c3c;
}

/* Mobile overlay */
.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(3px);
  z-index: 20;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 900px) {
  .admin-shell {
    display: block;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 270px;
    max-width: 82vw;
    height: 100vh;
    transform: translateX(-100%);
    box-shadow: 18px 0 36px rgba(0, 0, 0, 0.18);
    padding-top: 18px;
  }

  .sidebar.sidebar-mobile-open {
    transform: translateX(0);
  }

  .mobile-close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .hamburger-btn {
    display: inline-flex;
  }

  .topbar {
    height: 78px;
    padding: 0 18px;
  }

  .topbar-title {
    font-size: 22px;
    line-height: 1.2;
  }

  .content-area {
    padding: 20px 18px 28px;
  }

  .status-pill {
    padding: 6px;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .logout-btn {
    padding: 8px 12px;
    font-size: 12px;
  }
}

@media (max-width: 560px) {
  .topbar {
    padding: 0 14px;
  }

  .topbar-title {
    font-size: 18px;
  }

  .content-area {
    padding: 16px 14px 24px;
  }

  .logout-btn {
    padding: 7px 11px;
    font-size: 12px;
  }

  .brand h1 {
    font-size: 20px;
  }
}
</style>
