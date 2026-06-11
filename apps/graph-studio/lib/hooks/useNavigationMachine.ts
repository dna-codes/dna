'use client'
import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useMachine } from '@xstate/react'
import { navigationMachine } from '../machines/navigation'

export function useNavigationMachine() {
  const router = useRouter()
  const pathname = usePathname()
  const [state, send] = useMachine(navigationMachine)
  const isProgrammatic = useRef(false)
  const isFirstRender = useRef(true)

  // Push route when machine transitions (skip initial render — pathname → machine sync handles that)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (state.value === 'lens' && state.context.activeLens) {
      const target = `/lens/${state.context.activeLens}`
      if (pathname !== target) {
        isProgrammatic.current = true
        router.push(target)
      }
    } else if (state.value === 'home' && pathname !== '/') {
      isProgrammatic.current = true
      router.push('/')
    }
  }, [state.value, state.context.activeLens]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync browser navigation (back/forward) into machine
  useEffect(() => {
    if (isProgrammatic.current) {
      isProgrammatic.current = false
      return
    }
    if (pathname === '/') {
      if (state.value !== 'home') {
        send({ type: 'GO_HOME' })
      }
    } else if (pathname.startsWith('/lens/')) {
      const name = pathname.slice('/lens/'.length)
      if (state.value !== 'lens' || state.context.activeLens !== name) {
        send({ type: 'SELECT_LENS', name })
      }
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return { state, send }
}
