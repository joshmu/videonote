import { createContext, useContext, useState } from 'react'

const globalContext = createContext({})

export function GlobalProvider(props) {
  return <globalContext.Provider value={value} {...props} />
}

export function useGlobalContext() {
  return useContext(globalContext)
}
