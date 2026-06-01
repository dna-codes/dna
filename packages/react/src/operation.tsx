import React, { ReactNode, useEffect, useState } from 'react'
import { useDnaContext } from './provider'

type OperationProps = {
  name:      string
  children:  ReactNode
  fallback?: ReactNode
  loading?:  ReactNode
}

export function Operation({ name, children, fallback = null, loading: loadingNode = null }: OperationProps) {
  const ctx = useDnaContext()
  const [flagEnabled, setFlagEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    const result = ctx.resolveFlag(name)
    if (typeof result === 'boolean') {
      setFlagEnabled(result)
    } else {
      result.then(setFlagEnabled)
    }
  }, [name, ctx])

  // Still resolving roles or flags
  if (ctx.loading || flagEnabled === null) return <>{loadingNode}</>

  const permitted = ctx.permitted(name)
  if (!permitted || !flagEnabled) return <>{fallback}</>

  return <>{children}</>
}
