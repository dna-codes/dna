import type { dia } from '@joint/plus'

/**
 * Adds mouse-wheel zoom (centred on cursor) and blank-space drag-to-pan to a
 * JointJS Paper. Double-click blank to reset the view.
 */
export function enableZoomPan(paper: dia.Paper): void {
  const el = paper.el as HTMLElement

  // ── Cursor feedback ──────────────────────────────────────────────────────
  paper.on('blank:pointerenter', () => { el.style.cursor = 'grab' })
  paper.on('blank:pointerleave', () => { el.style.cursor = '' })

  // ── Mouse-wheel zoom, centred on cursor position ─────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paper.on('blank:mousewheel', (_evt: any, x: number, y: number, delta: number) => {
    _evt.preventDefault?.()
    const { sx }     = paper.scale()
    const { tx, ty } = paper.translate()
    const newScale   = Math.max(0.15, Math.min(3.0, sx * (delta > 0 ? 1.1 : 0.9)))
    // Keep the paper point (x, y) fixed in the viewport
    paper.scale(newScale, newScale)
    paper.translate(tx + x * (sx - newScale), ty + y * (sx - newScale))
  })

  // ── Drag-to-pan on blank space ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paper.on('blank:pointerdown', (evt: any) => {
    el.style.cursor = 'grabbing'
    const startX = evt.clientX as number
    const startY = evt.clientY as number
    const { tx: originTx, ty: originTy } = paper.translate()

    const onMove = (e: MouseEvent) => {
      paper.translate(originTx + e.clientX - startX, originTy + e.clientY - startY)
    }
    const onUp = () => {
      el.style.cursor = 'grab'
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  })

  // ── Double-click blank to reset ───────────────────────────────────────────
  paper.on('blank:pointerdblclick', () => {
    paper.scale(1, 1)
    paper.translate(0, 0)
  })
}
