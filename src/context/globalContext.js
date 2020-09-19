import { createContext, useContext } from 'react'

const globalContext = createContext({})

export function GlobalProvider(props) {
  const value = {}
  return <globalContext.Provider value={value} {...props} />
}

export function useGlobalContext() {
  return useContext(globalContext)
}
