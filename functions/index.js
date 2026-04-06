const { onRequest } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

function getMelbourneDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))

  return {
    dateKey: `${map.year}-${map.month}-${map.day}`,
    hour: Number(map.hour),
    minute: Number(map.minute),
  }
}

exports.checkLowStockDaily = onRequest(async (req, res) => {
  try {
    const cronSecret = req.get('x-cron-secret') || ''
    const expectedSecret = process.env.LOW_STOCK_CRON_SECRET || ''

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const { dateKey } = getMelbourneDateParts(new Date())

    const reportRef = db.collection('system_jobs').doc(`low_stock_daily_${dateKey}`)
    const reportSnap = await reportRef.get()

    // 防止同一天重复发送
    if (reportSnap.exists) {
      return res.json({
        success: true,
        skipped: true,
        message: `Already sent for ${dateKey}`,
      })
    }

    const herbsSnap = await db
      .collection('herbs')
      .where('stock', '<=', 2)
      .get()

    const lowStockItems = herbsSnap.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          nameCn: data.nameCn || 'Unnamed Herb',
          category: data.category || 'Uncategorized',
          stock: Number(data.stock || 0),
        }
      })
      .sort((a, b) => a.stock - b.stock || a.nameCn.localeCompare(b.nameCn, 'zh-Hans-CN'))

    if (lowStockItems.length === 0) {
      await reportRef.set({
        dateKey,
        sent: false,
        reason: 'no_low_stock_items',
        checkedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      return res.json({
        success: true,
        skipped: true,
        message: 'No low stock items today',
      })
    }

    const lines = lowStockItems.map(
      (item, index) => `${index + 1}. ${item.nameCn}｜${item.stock} 瓶｜${item.category}`
    )

    const telegramMessage = [
      '📦 HerbVault Daily Low Stock Check',
      `📅 Date: ${dateKey}`,
      '',
      'The following herbs are at or below 2 bottles:',
      '',
      ...lines,
      '',
      'Please restock soon.',
    ].join('\n')

    const telegramResponse = await fetch(process.env.TELEGRAM_ALERT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-secret': process.env.TELEGRAM_ALERT_SECRET || '',
      },
      body: JSON.stringify({
        message: telegramMessage,
      }),
    })

    const telegramData = await telegramResponse.json().catch(() => ({}))

    if (!telegramResponse.ok) {
      throw new Error(
        telegramData?.message || `Telegram API failed with ${telegramResponse.status}`
      )
    }

    await reportRef.set({
      dateKey,
      sent: true,
      itemCount: lowStockItems.length,
      items: lowStockItems,
      checkedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.json({
      success: true,
      sent: true,
      itemCount: lowStockItems.length,
      items: lowStockItems,
    })
  } catch (error) {
    console.error('checkLowStockDaily error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal error',
    })
  }
})
