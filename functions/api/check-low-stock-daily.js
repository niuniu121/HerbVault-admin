const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-cron-secret',
  'Content-Type': 'application/json',
}

const FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1/projects'

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
  const accessToken = String(env.FIREBASE_ACCESS_TOKEN || '').trim()

  if (!projectId || !accessToken) {
    throw new Error('Missing FIREBASE_PROJECT_ID or FIREBASE_ACCESS_TOKEN')
  }

  const url = `${FIRESTORE_BASE_URL}/${projectId}/databases/(default)/documents/herbs`

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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  })
}
