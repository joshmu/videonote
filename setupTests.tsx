// add custom jest matchers from jest-dom
import '@testing-library/jest-dom/extend-expect'

// import dependencies
import React from 'react'

// export and init setup
export const setupTests = (() => {
  // console.log(`============ test setup file loaded ===========`)

  ///////////////
  // REQUIRED MOCKS
  ///////////////

  // INTERSECTION OBSERVER MOCK
  const intersectionObserverMock = () => ({
    observe: () => null,
    disconnect: () => null,
    unobserve: () => null,
  })
  window.IntersectionObserver = jest
    .fn()
    .mockImplementation(intersectionObserverMock)

  // FRAMER MOTION MOCK
  jest.mock('framer-motion', () => {
    // helper
    const toLowerCaseList = ['whileHover']
    const attrsToLowerCase = jest.fn(props => {
      return Object.entries(props).reduce((acc, [key, val]) => {
        key = toLowerCaseList.includes(key) ? key.toLowerCase() : key
        acc[key] = val
        return acc
      }, {})
    })

    const AnimatePresence = jest.fn(({ children }) => children)
    const motion = {
      div: jest.fn(({ children, ...props }) => (
        <div {...attrsToLowerCase(props)}>{children}</div>
      )),
      span: jest.fn(({ children, ...props }) => (
        <span {...attrsToLowerCase(props)}>{children}</span>
      )),
      svg: jest.fn(({ children, ...props }) => (
        <svg {...attrsToLowerCase(props)}>{children}</svg>
      )),
      path: jest.fn(({ children, ...props }) => (
        <path {...attrsToLowerCase(props)}>{children}</path>
      )),
      button: jest.fn(({ children, ...props }) => (
        <button {...attrsToLowerCase(props)}>{children}</button>
      )),
      ul: jest.fn(({ children, ...props }) => (
        <ul {...attrsToLowerCase(props)}>{children}</ul>
      )),
    }
    const useAnimation = jest.fn(() => ({ start: () => null }))
    return {
      AnimatePresence,
      motion,
      useAnimation,
    }
  })

  // GLOBAL CONTEXT
  jest.mock('@/context/GlobalContext', () => {
    const scrollProgress = 0
    const values = { scrollProgress }
    const useGlobalContext = jest.fn(() => values)

    return {
      useGlobalContext,
    }
  })

  // THEME CONTEXT
  jest.mock('@/context/ThemeContext', () => {
    const toggleTheme = jest.fn()
    const values = { toggleTheme }
    const useThemeContext = jest.fn(() => values)

    return {
      useThemeContext,
    }
  })
})()
