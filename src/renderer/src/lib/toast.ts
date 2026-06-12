type ToastType = 'success' | 'error' | 'info'

interface ToastOptions {
  duration?: number
}

function showToast(message: string, type: ToastType = 'info', options?: ToastOptions) {
  const duration = options?.duration ?? 3000
  const el = document.createElement('div')
  el.textContent = message
  el.className = [
    'fixed top-4 right-4 z-[9999] px-4 py-2 rounded-md shadow-lg text-sm font-medium',
    'transition-all duration-300 ease-out',
    type === 'error' ? 'bg-destructive text-destructive-foreground' :
    type === 'success' ? 'bg-green-600 text-white' :
    'bg-primary text-primary-foreground',
  ].join(' ')
  el.style.opacity = '0'
  el.style.transform = 'translateY(-8px)'
  document.body.appendChild(el)

  requestAnimationFrame(() => {
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
  })

  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(-8px)'
    setTimeout(() => el.remove(), 300)
  }, duration)
}

export const toast = {
  success: (msg: string) => showToast(msg, 'success'),
  error: (msg: string) => showToast(msg, 'error'),
  info: (msg: string) => showToast(msg, 'info'),
}
