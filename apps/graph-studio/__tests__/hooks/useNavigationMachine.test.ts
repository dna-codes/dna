import { renderHook, act } from '@testing-library/react'
import { useNavigationMachine } from '../../lib/hooks/useNavigationMachine'

const mockPush = jest.fn()
let mockPathname = '/'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}))

beforeEach(() => {
  mockPush.mockClear()
  mockPathname = '/'
})

describe('useNavigationMachine', () => {
  it('SELECT_LENS calls router.push with the lens path', () => {
    const { result } = renderHook(() => useNavigationMachine())
    act(() => {
      result.current.send({ type: 'SELECT_LENS', name: 'org-chart' })
    })
    expect(mockPush).toHaveBeenCalledWith('/lens/org-chart')
  })

  it('GO_HOME calls router.push("/")', () => {
    const { result, rerender } = renderHook(() => useNavigationMachine())
    act(() => {
      result.current.send({ type: 'SELECT_LENS', name: 'org-chart' })
    })
    // Simulate browser navigating to the pushed route (as would happen in real browser)
    mockPathname = '/lens/org-chart'
    rerender()
    act(() => {
      result.current.send({ type: 'GO_HOME' })
    })
    expect(mockPush).toHaveBeenLastCalledWith('/')
  })

  it('machine stays in sync when browser navigates back to /', () => {
    mockPathname = '/lens/org-chart'
    const { result, rerender } = renderHook(() => useNavigationMachine())

    // Simulate browser navigating back to /
    mockPathname = '/'
    rerender()

    expect(result.current.state.value).toBe('home')
    // router.push should NOT be called (browser already navigated)
    expect(mockPush).not.toHaveBeenCalledWith('/')
  })
})
