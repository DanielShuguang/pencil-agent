type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastOptions {
  duration?: number
  action?: { label: string; onClick: () => void }
}

const MAX_VISIBLE = 3
const activeToasts: HTMLElement[] = []

function repositionToasts() {
  activeToasts.forEach((el, i) => {
    el.style.top = `${16 + i * 48}px`
  })
}

function showToast(message: string, type: ToastType = 'info', options?: ToastOptions) {
  const duration = options?.duration ?? 3000

  if (activeToasts.length >= MAX_VISIBLE) {
    const oldest = activeToasts.shift()
    if (oldest) {
      oldest.style.opacity = '0'
      oldest.style.transform = 'translateY(-8px) scale(0.95)'
      setTimeout(() => oldest.remove(), 200)
    }
  }

  const el = document.createElement('div')
  el.className = [
    'fixed right-4 z-[9999] flex items-center gap-2 px-4 py-2 rounded-md shadow-lg text-sm font-medium',
    'transition-all duration-300 ease-out',
    type === 'error' ? 'bg-destructive text-destructive-foreground' :
    type === 'success' ? 'bg-green-600 text-white' :
    type === 'warning' ? 'bg-yellow-600 text-white' :
    'bg-primary text-primary-foreground',
  ].join(' ')

  const textSpan = document.createElement('span')
  textSpan.textContent = message
  el.appendChild(textSpan)

  if (options?.action) {
    const btn = document.createElement('button')
    btn.textContent = options.action.label
    btn.className = 'underline font-semibold hover:opacity-80'
    btn.onclick = () => {
      options.action!.onClick()
      dismiss()
    }
    el.appendChild(btn)
  }

  el.style.opacity = '0'
  el.style.transform = 'translateY(-8px) scale(0.95)'

  activeToasts.push(el)
  document.body.appendChild(el)
  repositionToasts()

  requestAnimationFrame(() => {
    el.style.opacity = '1'
    el.style.transform = 'translateY(0) scale(1)'
  })

  let timer: ReturnType<typeof setTimeout>

  const dismiss = () => {
    clearTimeout(timer)
    el.style.opacity = '0'
    el.style.transform = 'translateY(-8px) scale(0.95)'
    const idx = activeToasts.indexOf(el)
    if (idx !== -1) activeToasts.splice(idx, 1)
    setTimeout(() => {
      el.remove()
      repositionToasts()
    }, 200)
  }

  timer = setTimeout(dismiss, duration)
  el.addEventListener('mouseenter', () => clearTimeout(timer))
  el.addEventListener('mouseleave', () => {
    timer = setTimeout(dismiss, 1500)
  })
}

export const toast = {
  success: (msg: string, opts?: ToastOptions) => showToast(msg, 'success', opts),
  error: (msg: string, opts?: ToastOptions) => showToast(msg, 'error', opts),
  warning: (msg: string, opts?: ToastOptions) => showToast(msg, 'warning', opts),
  info: (msg: string, opts?: ToastOptions) => showToast(msg, 'info', opts),
}
