import { useAutoAnimate } from '@formkit/auto-animate/react'

// 列表动画 hook，添加平滑的增删/排序动画
export function useListAnimate<T extends HTMLElement>() {
  return useAutoAnimate<T>({
    duration: 150,
    easing: 'ease-out',
  })
}
