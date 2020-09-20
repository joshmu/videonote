import { createContext, useContext, useEffect, useState } from 'react'

// const temp = {
//   account: {
//     username: 'josh',
//     email: 'mu@joshmu.com',
//   },
//   projects: [
//     {
//       id: '', // todo: maybe?
//       src: 'https://www.youtube.com/watch?v=gdZLi9oWNZg',
//       todos: [],
//       created: new Date(),
//       updated: undefined,
//       deleted: undefined,
//     },
//   ],
//   settings: {
//     playOffset: -4,
//   },
// }

const globalContext = createContext({
  account: {},
  projects: [],
  settings: {},
  project: null,
})

export function GlobalProvider(props) {
  const [account, setAccount] = useState(null)
  const [projects, setProjects] = useState([])
  const [settings, setSettings] = useState(null)

  const [project, setProject] = useState(null)

  // initial load, check for localStorage
  useEffect(() => {
    const accountJson = window.localStorage.getItem('account')
    const projectsJson = window.localStorage.getItem('projects')
    const settingsJson = window.localStorage.getItem('settings')
    if (accountJson) setAccount(JSON.parse(accountJson))
    if (projectsJson) setProjects(JSON.parse(projectsJson))
    if (settingsJson) setSettings(JSON.parse(settingsJson))
  }, [])

  // update if any change
  useEffect(() => {
    updateLocalStorage()
  }, [account, projects, settings])

  useEffect(() => {
    // if we have projects and no current then autoselect first project
    if (projects.length > 0 && project === null) setProject(projects[0])
    // whenever projects change then lets update storage
    updateLocalStorage()
  }, [projects])

  const updateLocalStorage = () => {
    if (account !== null)
      window.localStorage.setItem('account', JSON.stringify(account))
    if (projects.length > 0)
      window.localStorage.setItem('projects', JSON.stringify(projects))
    if (settings !== null)
      window.localStorage.setItem('settings', JSON.stringify(settings))
  }

  const updateAccount = data => setAccount({ ...account, ...data })
  const updateProjects = project => {
    const updatedProjects = projects.map(p => {
      return p.src === project.src ? project : p
    })
    setProjects(updatedProjects)
  }
  const updateSettings = data => setSettings({ ...settings, ...data })

  const value = {
    account,
    updateAccount,
    projects,
    updateProjects,
    project,
    settings,
    updateSettings,
  }

  return <globalContext.Provider value={value} {...props} />
}

export function useGlobalContext() {
  return useContext(globalContext)
}
