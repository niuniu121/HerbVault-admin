export async function onRequestPost(context) {
  try {
    const { request, env } = context
    const body = await request.json().catch(() => ({}))

    const message = String(body.message || '🔥 HerbVault Alert Test').trim()

    const token = env.TELEGRAM_ALERT_BOT_TOKEN
    const chatId = env.TELEGRAM_ALERT_CHAT_ID

    if (!token || !chatId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing TELEGRAM_ALERT_BOT_TOKEN or TELEGRAM_ALERT_CHAT_ID',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

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

    const telegramData = await telegramRes.json()

    if (!telegramRes.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          telegramData,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        telegramData,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
