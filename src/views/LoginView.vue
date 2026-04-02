<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand-block">
        <div class="brand-badge">HV</div>
        <h1>HerbVault Admin</h1>
        <p>Sign in to manage herbal inventory.</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="Enter your email" />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="Enter your password" />
        </div>

        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

        <button class="login-btn" type="submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginWithEmail } from '../services/authService'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter email and password.'
    return
  }

  try {
    loading.value = true
    await loginWithEmail(email.value, password.value)
    router.push('/dashboard')
  } catch (error) {
    errorMessage.value = error.message || 'Login failed.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(
    circle at top left,
    #f5f8f2 0%,
    #eef3ed 28%,
    #f7f8fb 58%,
    #f4f6fa 100%
  );
}

.login-card {
  width: 100%;
  max-width: 460px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(15, 23, 42, 0.05);
}

.brand-block {
  text-align: center;
  margin-bottom: 26px;
}

.brand-badge {
  width: 58px;
  height: 58px;
  margin: 0 auto 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, #dcefd8, #b6ddca);
  color: #174c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 20px;
}

.brand-block h1 {
  margin: 0;
  font-size: 30px;
  color: #173c2f;
}

.brand-block p {
  margin: 8px 0 0;
  color: #6b7280;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.form-group input {
  height: 48px;
  border: 1px solid #d8dee7;
  border-radius: 14px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  transition: 0.2s ease;
}

.form-group input:focus {
  border-color: #1c5b47;
  box-shadow: 0 0 0 4px rgba(28, 91, 71, 0.08);
}

.error-text {
  margin: -4px 0 0;
  color: #dc2626;
  font-size: 13px;
}

.login-btn {
  height: 50px;
  border: none;
  border-radius: 14px;
  background: #184c3b;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(24, 76, 59, 0.18);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
