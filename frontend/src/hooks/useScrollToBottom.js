import { useRef, useEffect } from 'react'

export const useScrollToBottom = (dependencies = []) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, dependencies)

  return ref
}