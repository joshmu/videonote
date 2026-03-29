import '@testing-library/jest-dom/vitest'

import React from 'react'
import { vi } from 'vitest'

// INTERSECTION OBSERVER MOCK
const intersectionObserverMock = () => ({
  observe: () => null,
  disconnect: () => null,
  unobserve: () => null,
})
window.IntersectionObserver = vi
  .fn()
  .mockImplementation(intersectionObserverMock)

// MOTION MOCK
vi.mock('motion/react', () => {
  const toLowerCaseList = ['whileHover']
  const attrsToLowerCase = vi.fn((props: Record<string, unknown>) => {
    return Object.entries(props).reduce(
      (acc, [key, val]) => {
        key = toLowerCaseList.includes(key) ? key.toLowerCase() : key
        acc[key] = val
        return acc
      },
      {} as Record<string, unknown>
    )
  })

  const AnimatePresence = vi.fn(
    ({ children }: { children: React.ReactNode }) => children
  )
  const motion = {
    div: vi.fn(
      ({
        children,
        ...props
      }: { children?: React.ReactNode } & Record<string, unknown>) => (
        <div {...attrsToLowerCase(props)}>{children}</div>
      )
    ),
    span: vi.fn(
      ({
        children,
        ...props
      }: { children?: React.ReactNode } & Record<string, unknown>) => (
        <span {...attrsToLowerCase(props)}>{children}</span>
      )
    ),
    svg: vi.fn(
      ({
        children,
        ...props
      }: { children?: React.ReactNode } & Record<string, unknown>) => (
        <svg {...attrsToLowerCase(props)}>{children}</svg>
      )
    ),
    path: vi.fn(
      ({
        children,
        ...props
      }: { children?: React.ReactNode } & Record<string, unknown>) => (
        <path {...attrsToLowerCase(props)}>{children}</path>
      )
    ),
    button: vi.fn(
      ({
        children,
        ...props
      }: { children?: React.ReactNode } & Record<string, unknown>) => (
        <button {...attrsToLowerCase(props)}>{children}</button>
      )
    ),
    ul: vi.fn(
      ({
        children,
        ...props
      }: { children?: React.ReactNode } & Record<string, unknown>) => (
        <ul {...attrsToLowerCase(props)}>{children}</ul>
      )
    ),
  }
  const useAnimation = vi.fn(() => ({ start: () => null }))
  const useTransform = vi.fn(() => null)
  const useSpring = vi.fn(() => null)
  const scrollYProgress = vi.fn(() => 0)
  const useScroll = vi.fn(() => ({ scrollYProgress, scrollY: 0 }))
  return {
    AnimatePresence,
    motion,
    useTransform,
    useSpring,
    useAnimation,
    useScroll,
  }
})

// TW CONFIG
vi.mock('@/root/tailwind.config', () => {
  const config = vi.fn(() => ({}))
  return { default: config }
})

// GLOBAL CONTEXT
vi.mock('@/context/globalContext', () => {
  const scrollProgress = 0
  const values = { scrollProgress }
  const useGlobalContext = vi.fn(() => values)

  return {
    useGlobalContext,
  }
})

// THEME CONTEXT
vi.mock('@/context/themeContext', () => {
  const toggleTheme = vi.fn()
  const values = { toggleTheme }
  const useThemeContext = vi.fn(() => values)

  return {
    useThemeContext,
  }
})
