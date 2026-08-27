import { beforeAll, vi } from 'vitest'

// Mock matchMedia before tests run. Needed by next-themes.
beforeAll(() => {
  // Server-only specs opt into `@vitest-environment node`, where there is no window.
  if (typeof window === 'undefined') return

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})
