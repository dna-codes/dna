import { useDnaContext } from './provider'

export function useOperation(name: string) {
  const ctx = useDnaContext()
  return {
    permitted: ctx.permitted(name),
    perform:   (payload?: unknown) => ctx.perform(name, payload),
  }
}
