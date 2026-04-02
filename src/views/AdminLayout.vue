<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-badge">HV</div>
        <div>
          <h1>HerbVault</h1>
          <p>Admin System</p>
        </div>
      </div>

      <nav class="nav">
        <RouterLink to="/dashboard" class="nav-link">
          <span class="nav-icon">⌂</span>
          <span>Dashboard</span>
        </RouterLink>

        <RouterLink to="/herbs" class="nav-link">
          <span class="nav-icon">✿</span>
          <span>Herbs</span>
        </RouterLink>

        <RouterLink to="/history" class="nav-link">
          <span class="nav-icon">↺</span>
          <span>History</span>
        </RouterLink>

        <RouterLink to="/settings" class="nav-link">
          <span class="nav-icon">⚙</span>
          <span>Settings</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="footer-card">
          <p class="footer-title">Inventory Status</p>
          <p class="footer-text">Manage herbs, stock changes, and alerts in one place.</p>
        </div>
      </div>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div>
          <p class="topbar-label">Herbal Inventory</p>
          <h2 class="topbar-title">Dashboard Overview</h2>
        </div>

        <div class="topbar-right">
          <div class="status-pill">
            <span class="dot"></span>
            <span>System Ready</span>
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
import { RouterLink } from 'vue-router'
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
}

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
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 30px;
  padding: 8px 6px;
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

.topbar-label {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6b7280;
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

.dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #2fb36d;
  box-shadow: 0 0 0 5px rgba(47, 179, 109, 0.12);
}

.content-area {
  padding: 28px 32px 36px;
}

@media (max-width: 900px) {
  .sidebar {
    width: 220px;
  }

  .topbar {
    padding: 0 18px;
  }

  .content-area {
    padding: 20px 18px 28px;
  }

  .topbar-title {
    font-size: 22px;
  }

  .status-pill {
    display: none;
  }
}
</style>
