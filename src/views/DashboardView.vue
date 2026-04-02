<template>
  <div class="dashboard-page">
    <section class="hero-card">
      <div class="hero-left">
        <p class="hero-kicker">Overview</p>
        <h2>Welcome back</h2>
        <p class="hero-desc">
          Manage herb inventory, monitor low stock items, and keep daily stock changes organised.
        </p>

        <div class="hero-actions">
          <RouterLink to="/herbs" class="primary-btn">Go to Herbs</RouterLink>
          <RouterLink to="/history" class="secondary-btn">View History</RouterLink>
        </div>
      </div>

      <div class="hero-right">
        <div class="mini-panel">
          <p>Quick Note</p>
          <h3>Default order + A–Z sorting</h3>
          <span>Ready for next step</span>
        </div>
      </div>
    </section>

    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-title">Total Herbs</span>
          <span class="stat-icon">✿</span>
        </div>
        <div class="stat-value">0</div>
        <p class="stat-note">Total herbs currently stored in the system</p>
      </div>

      <div class="stat-card warning">
        <div class="stat-top">
          <span class="stat-title">Low Stock Items</span>
          <span class="stat-icon">!</span>
        </div>
        <div class="stat-value">0</div>
        <p class="stat-note">Items below threshold will appear here</p>
      </div>

      <div class="stat-card success">
        <div class="stat-top">
          <span class="stat-title">Today Changes</span>
          <span class="stat-icon">↺</span>
        </div>
        <div class="stat-value">0</div>
        <p class="stat-note">Number of inventory updates made today</p>
      </div>
    </section>

    <section class="bottom-grid">
      <div class="panel-card">
        <div class="panel-header">
          <h3>Next Features</h3>
          <span class="panel-tag">Planned</span>
        </div>

        <div class="feature-list">
          <div class="feature-item">
            <span class="feature-dot"></span>
            <div>
              <h4>Quick + / - stock adjustment</h4>
              <p>Tap to increase or decrease herb quantity quickly.</p>
            </div>
          </div>

          <div class="feature-item">
            <span class="feature-dot"></span>
            <div>
              <h4>Default / Alphabetical sorting</h4>
              <p>Switch between boss’s usual order and A–Z order.</p>
            </div>
          </div>

          <div class="feature-item">
            <span class="feature-dot"></span>
            <div>
              <h4>Telegram low stock reminders</h4>
              <p>Send alerts when herbs are running low.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-card soft-green">
        <div class="panel-header">
          <h3>System Notes</h3>
          <span class="panel-tag">Info</span>
        </div>

        <div class="notes-box">
          <p>Firebase can store:</p>
          <ul>
            <li>Herb basic info</li>
            <li>Stock quantity</li>
            <li>Default order</li>
            <li>Low stock threshold</li>
            <li>Stock history logs</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.hero-card {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 18px;
  background: linear-gradient(135deg, #ffffff 0%, #f6fbf7 100%);
  border-radius: 28px;
  padding: 28px;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.hero-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #799483;
}

.hero-left h2 {
  margin: 0;
  font-size: 36px;
  font-weight: 800;
  color: #173c2f;
}

.hero-desc {
  max-width: 640px;
  margin: 12px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: #667085;
}

.hero-actions {
  margin-top: 22px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn {
  text-decoration: none;
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 700;
  font-size: 14px;
  transition: 0.2s ease;
}

.primary-btn {
  background: #184c3b;
  color: #fff;
  box-shadow: 0 10px 22px rgba(24, 76, 59, 0.18);
}

.primary-btn:hover {
  transform: translateY(-1px);
}

.secondary-btn {
  background: #f4f6f8;
  color: #22313f;
  border: 1px solid rgba(15, 23, 42, 0.07);
}

.secondary-btn:hover {
  background: #edf1f3;
}

.hero-right {
  display: flex;
  align-items: stretch;
}

.mini-panel {
  width: 100%;
  border-radius: 22px;
  padding: 22px;
  background: linear-gradient(180deg, #1b5b47 0%, #174c3c 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.mini-panel p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.mini-panel h3 {
  margin: 16px 0 10px;
  font-size: 24px;
  line-height: 1.3;
}

.mini-panel span {
  font-size: 13px;
  color: #d9eee5;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.stat-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-title {
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #f3f7f4;
  color: #184c3b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.stat-value {
  margin-top: 18px;
  font-size: 40px;
  font-weight: 800;
  color: #173c2f;
}

.stat-note {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #7c8798;
}

.warning .stat-icon {
  background: #fff6ea;
  color: #c98318;
}

.success .stat-icon {
  background: #edf8f1;
  color: #24995b;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 18px;
}

.panel-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.soft-green {
  background: linear-gradient(180deg, #f8fcf8 0%, #f3faf5 100%);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.panel-header h3 {
  margin: 0;
  font-size: 20px;
  color: #173c2f;
}

.panel-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: #f4f6f8;
  color: #5b6678;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #eef2f5;
}

.feature-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.feature-dot {
  width: 10px;
  height: 10px;
  margin-top: 8px;
  border-radius: 999px;
  background: #2d9d66;
  flex-shrink: 0;
}

.feature-item h4 {
  margin: 0 0 6px;
  font-size: 15px;
  color: #1f2937;
}

.feature-item p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
}

.notes-box p {
  margin: 0 0 10px;
  font-weight: 700;
  color: #1f2937;
}

.notes-box ul {
  margin: 0;
  padding-left: 18px;
  color: #667085;
  line-height: 1.8;
  font-size: 14px;
}

@media (max-width: 1100px) {
  .hero-card,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .hero-left h2 {
    font-size: 28px;
  }

  .hero-card,
  .panel-card {
    padding: 20px;
    border-radius: 20px;
  }
}
</style>
