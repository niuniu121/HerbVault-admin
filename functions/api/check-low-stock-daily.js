async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000)

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const claimSet = {
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encoder = new TextEncoder()

  const base64UrlEncode = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')

  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(claimSet)}`

  const privateKeyPem = String(env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(unsignedToken)
  )

  const jwt = `${unsignedToken}.${arrayBufferToBase64Url(signature)}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to get access token')
  }

  return tokenData.access_token
}

function pemToArrayBuffer(pem) {
  const base64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes.buffer
}

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function getMelbourneDateInfo(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  const dateKey = `${map.year}-${map.month}-${map.day}`

  return { dateKey }
}

function parseFirestoreValue(fieldValue) {
  if (!fieldValue || typeof fieldValue !== 'object') return null

  if ('stringValue' in fieldValue) return fieldValue.stringValue
  if ('integerValue' in fieldValue) return Number(fieldValue.integerValue)
  if ('doubleValue' in fieldValue) return Number(fieldValue.doubleValue)
  if ('booleanValue' in fieldValue) return fieldValue.booleanValue
  if ('nullValue' in fieldValue) return null

  return null
}

function getField(fields, key, fallback = null) {
  return key in fields ? parseFirestoreValue(fields[key]) : fallback
}

function buildTelegramMessage(items, dateKey, threshold) {
  const lines = items.map((item, index) => {
    return `${index + 1}. ${item.name}｜${item.stock} bottles｜${item.category}`
  })

  return [
    '📦 HerbVault Daily Low Stock Check',
    `📅 Date: ${dateKey}`,
    `⚠️ Threshold: <= ${threshold} bottles`,
    '',
    'The following herbs need restocking:',
    '',
    ...lines,
    '',
    'Please restock soon.',
  ].join('\n')
}

async function fetchHerbs(env) {
  const accessToken = await getAccessToken(env)

  const projectId = env.FIREBASE_PROJECT_ID
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/herbs?pageSize=1000`

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error?.message || 'Failed to fetch herbs from Firestore')
  }

  const documents = data.documents || []

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
    }
  })
}

async function sendTelegramMessage(env, message) {
  const sendRes = await fetch('https://herbvault-admin.pages.dev/api/send-telegram-alert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-secret': env.TELEGRAM_ALERT_SECRET,
    },
    body: JSON.stringify({ message }),
  })

  const sendData = await sendRes.json().catch(() => ({}))

  if (!sendRes.ok || !sendData.success) {
    throw new Error(sendData?.message || 'Failed to send Telegram alert')
  }

  return sendData
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, 405)
  }

  try {
    const cronSecret = request.headers.get('x-cron-secret') || ''
    const expectedSecret = String(env.CRON_CALL_SECRET || '').trim()

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return json({ success: false, message: 'Unauthorized' }, 401)
    }

    const { dateKey } = getMelbourneDateInfo(new Date())
    const kvKey = `low-stock-daily:${dateKey}`

    const alreadySent = await env.HERBVAULT_JOBS.get(kvKey)
    if (alreadySent) {
      return json({
        success: true,
        skipped: true,
        message: `Already sent for ${dateKey}`,
      })
    }

    const threshold = Number(env.LOW_STOCK_THRESHOLD || 3)
    const herbs = await fetchHerbs(env)

    const lowStockItems = herbs
      .filter((item) => Number(item.stock) <= threshold)
      .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name, 'zh-Hans-CN'))

    if (lowStockItems.length === 0) {
      await env.HERBVAULT_JOBS.put(
        kvKey,
        JSON.stringify({
          sent: false,
          reason: 'no_low_stock_items',
          checkedAt: new Date().toISOString(),
        }),
        { expirationTtl: 60 * 60 * 24 * 7 }
      )

      return json({
        success: true,
        skipped: true,
        message: 'No low stock items today',
      })
    }

    const telegramMessage = buildTelegramMessage(lowStockItems, dateKey, threshold)
    const telegramResult = await sendTelegramMessage(env, telegramMessage)

    await env.HERBVAULT_JOBS.put(
      kvKey,
      JSON.stringify({
        sent: true,
        itemCount: lowStockItems.length,
        dateKey,
        checkedAt: new Date().toISOString(),
      }),
      { expirationTtl: 60 * 60 * 24 * 7 }
    )

    return json({
      success: true,
      sent: true,
      dateKey,
      itemCount: lowStockItems.length,
      items: lowStockItems,
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
