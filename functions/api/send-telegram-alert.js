const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-telegram-secret',
  'Content-Type': 'application/json',
}

export async function onRequest(context) {
  const { request } = context

  // 1) 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // 2) 只允许 POST
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

    // 3) secret 校验
    const incomingSecret = request.headers.get('x-telegram-secret') || ''
    const expectedSecret = String(env.TELEGRAM_ALERT_SECRET || '').trim()

    if (!expectedSecret || incomingSecret !== expectedSecret) {
      return json(
        {
          success: false,
          message: 'Unauthorized',
        },
        401
      )
    }

    // 4) 解析 body
    const body = await request.json().catch(() => ({}))
    const message = String(body.message || '🔥 HerbVault Alert Test').trim()

    const token = String(env.TELEGRAM_ALERT_BOT_TOKEN || '').trim()
    const chatId = String(env.TELEGRAM_ALERT_CHAT_ID || '').trim()

    if (!token || !chatId) {
      return json(
        {
          success: false,
          message: 'Missing TELEGRAM_ALERT_BOT_TOKEN or TELEGRAM_ALERT_CHAT_ID',
        },
        500
      )
    }

    // 5) 发送 Telegram
    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    })

    const telegramData = await telegramRes.json().catch(() => ({}))

    if (!telegramRes.ok || !telegramData.ok) {
      return json(
        {
          success: false,
          message: telegramData?.description || 'Telegram send failed',
          telegramData,
        },
        500
      )
    }

    return json({
      success: true,
      telegramData,
    })
  } catch (error) {
    console.error('send-telegram-alert error:', error)

    return json(
      {
        success: false,
        message: error.message || 'Unknown error',
      },
      500
    )
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  })
}
