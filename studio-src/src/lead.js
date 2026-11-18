import { BRAND } from './data/content'

// Отправка заявки: Cloudflare Worker -> Telegram (мгновенное уведомление) + Web3Forms (письмо на почту владельца).
// Возвращает true, если хотя бы один канал принял заявку.
export async function sendLead(text) {
  const f = BRAND.form || {}
  const jobs = []
  if (f.endpoint) {
    jobs.push(
      fetch(f.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Заявка из 3D-версии\n\n' + text }),
      }).then((r) => r.ok),
    )
  }
  if (f.web3formsKey) {
    const fd = new FormData()
    fd.append('access_key', f.web3formsKey)
    fd.append('subject', 'VOLNA film — заявка из 3D-версии')
    fd.append('from_name', 'Сайт VOLNA film (3D)')
    fd.append('message', text)
    jobs.push(
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd }).then((r) =>
        r.json().then((j) => r.ok && j.success !== false).catch(() => r.ok),
      ),
    )
  }
  const res = await Promise.allSettled(jobs)
  return res.some((r) => r.status === 'fulfilled' && r.value === true)
}
