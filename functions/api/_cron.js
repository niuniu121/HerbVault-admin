export async function onSchedule(event, env, ctx) {
  const TARGET_HOUR = 7   // 你要的时间：7点
  const TARGET_MINUTE = 0

  // 获取墨尔本时间
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(event.scheduledTime))

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  const hour = Number(map.hour)
  const minute = Number(map.minute)

  // 只有 07:00 才执行
  if (hour !== TARGET_HOUR || minute !== TARGET_MINUTE) {
    return
  }

  // 调用你的 daily check API
  const res = await fetch('https://herbvault-admin.pages.dev/api/check-low-stock-daily', {
    method: 'POST',
    headers: {
      'x-cron-secret': env.CRON_CALL_SECRET,
    },
  })

  const text = await res.text()
  console.log('Daily check result:', res.status, text)
}
