const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-cron-secret',
  'Content-Type': 'application/json',
}

const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function onRequest(context) {
  const { request } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  if (request.method !== 'POST') {
    return json(
      {
        success: false,
        message: 'Method not allowed',
      },
      405
    )
  }

  return handlePost(context)
}

async function handlePost(context) {
  try {
    const { request, env } = context

    const incomingSecret = request.headers.get('x-cron-secret') || ''
    const expectedSecret = String(env.CRON_CALL_SECRET || '').trim()

    if (!expectedSecret || incomingSecret !== expectedSecret) {
      return json(
        {
          success: false,
          message: 'Unauthorized',
        },
        401
      )
    }

    const herbs = await fetchHerbs(env)
    const threshold = Number(env.LOW_STOCK_THRESHOLD || 3)

    const lowStockItems = herbs
      .filter((item) => item.name !== '添加药材')
      .filter((item) => item.categoryNotifyEnabled !== false)
      .filter((item) => item.telegramNotifyEnabled !== false)
      .filter((item) => Number(item.stock) <= threshold)
      .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name, 'zh-Hans-CN'))

    if (!lowStockItems.length) {
      return json({
        success: true,
        message: 'No low stock items found',
        count: 0,
      })
    }

    const telegramMessage = buildTelegramMessage(lowStockItems, threshold)
    const telegramResult = await sendTelegramMessage(env, telegramMessage)

    return json({
      success: true,
      message: 'Daily low stock check completed',
      count: lowStockItems.length,
      lowStockItems,
      telegramResult,
    })
  } catch (error) {
    console.error('check-low-stock-daily error:', error)

    return json(
      {
        success: false,
        message: error.message || 'Unknown error',
      },
      500
    )
  }
}

async function fetchHerbs(env) {
  const projectId = String(env.FIREBASE_PROJECT_ID || '').trim()
  const clientEmail = String(env.FIREBASE_CLIENT_EMAIL || '').trim()
  const privateKey = String(env.FIREBASE_PRIVATE_KEY || '')
    .replace(/\\n/g, '\n')
    .trim()

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY'
    )
  }

  const accessToken = await getAccessToken({
    clientEmail,
    privateKey,
  })

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/herbs`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to fetch herbs from Firestore')
  }

  const documents = Array.isArray(data.documents) ? data.documents : []

  return documents.map((doc) => {
    const fields = doc.fields || {}

    return {
      id: doc.name?.split('/').pop() || '',
      name:
        getField(fields, 'nameCn') ||
        getField(fields, 'name') ||
        getField(fields, 'title') ||
        'Unnamed Herb',
      category: getField(fields, 'category') || 'Uncategorized',
      stock: Number(getField(fields, 'stock', 0) || 0),
      telegramNotifyEnabled: getField(fields, 'telegramNotifyEnabled', true) !== false,
      categoryNotifyEnabled: getField(fields, 'categoryNotifyEnabled', true) !== false,
    }
  })
}

function getField(fields, key, fallback = '') {
  const field = fields[key]
  if (!field) return fallback

  if ('stringValue' in field) return field.stringValue
  if ('integerValue' in field) return Number(field.integerValue)
  if ('doubleValue' in field) return Number(field.doubleValue)
  if ('booleanValue' in field) return field.booleanValue

  return fallback
}

function buildTelegramMessage(items, threshold) {
  const lines = [
    `Daily Low Stock Check`,
    ``,
    `Threshold: ≤ ${threshold}`,
    `Count: ${items.length}`,
    ``,
  ]

  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name}`,
      `   Category: ${item.category}`,
      `   Stock: ${item.stock}`,
      ``
    )
  })

  lines.push('Please restock soon.')

  return lines.join('\n')
}

async function sendTelegramMessage(env, message) {
  const token = String(env.TELEGRAM_ALERT_BOT_TOKEN || '').trim()
  const chatId = String(env.TELEGRAM_ALERT_CHAT_ID || '').trim()

  if (!token || !chatId) {
    throw new Error('Missing TELEGRAM_ALERT_BOT_TOKEN or TELEGRAM_ALERT_CHAT_ID')
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data.ok) {
    throw new Error(data?.description || 'Telegram send failed')
  }

  return data
}

async function getAccessToken({ clientEmail, privateKey }) {
  const now = Math.floor(Date.now() / 1000)

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const payload = {
    iss: clientEmail,
    scope: FIRESTORE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }

  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload)
  )}`

  const signature = await signJwt(unsignedJwt, privateKey)
  const jwt = `${unsignedJwt}.${signature}`

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  })

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data.access_token) {
    throw new Error(data?.error_description || data?.error || 'Failed to get Google access token')
  }

  return data.access_token
}

async function signJwt(unsignedJwt, privateKeyPem) {
  const pem = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '')

  const binary = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binary.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedJwt)
  )

  return arrayBufferToBase64Url(signatureBuffer)
}

function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function arrayBufferToBase64Url(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  })
}
