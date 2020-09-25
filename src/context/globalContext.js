import { createContext, useContext, useEffect, useState } from 'react'
import { useNotificationContext } from './notificationContext'

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
  settings: {
    playOffset: -4,
    sidebarWidth: 400,
    currentProject: null,
  },
  project: null,
})

export function GlobalProvider(props) {
  const [account, setAccount] = useState(null)
  const [projects, setProjects] = useState([])
  const [settings, setSettings] = useState({
    playOffset: -4,
    sidebarWidth: 400,
    currentProject: null,
  })

  const [project, setProject] = useState(null)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(null)
  const { addAlert } = useNotificationContext()

  const resetGlobalState = () => {
    setAccount(null)
    setProjects([])
    setSettings({ playOffset: -4, sidebarWidth: 400, currentProject: null })
    setProject(null)
    setSettingsOpen(false)
    setModalOpen(false)
  }

  const login = user => {
    let data = window.localStorage.getItem('vn')
    if (!data) {
      // set up app db
      window.localStorage.setItem('vn', JSON.stringify({}))
      data = window.localStorage.getItem('vn')
    }

    // convert local storage string to db data object
    const db = JSON.parse(data)

    // if no user then create
    if (!db[user.username]) db[user.username] = createUserDefaults(user)

    const userData = db[user.username]
    console.log({ userData })
    if (userData.account) setAccount(userData.account)
    if (userData.projects) setProjects(userData.projects)
    if (userData.settings) setSettings(userData.settings)

    loadProject()
  }

  const createUserDefaults = user => {
    return {
      account: user,
      projects: [],
      settings: { playOffset: -4, sidebarWidth: 400, currentProject: null },
    }
  }

  // update if any change
  useEffect(() => {
    if (account && projects && settings && project) updateLocalStorage()
    if (projects.length > 0 && settings.currentProject && project === null)
      loadProject()
  }, [account, projects, settings, project])

  const updateLocalStorage = () => {
    console.log('update storage', { account, projects, settings })
    if (!account) return
    // get db
    const db = JSON.parse(window.localStorage.getItem('vn'))
    // update user account
    db[account.username] = { account, projects, settings }
    // update db
    window.localStorage.setItem('vn', JSON.stringify(db))
  }

  const loadProject = () => {
    // only update when we have projects available
    if (projects.length === 0) {
      // todo: dont load until we are ready - msg received when we are still loading projects
      addAlert({ type: 'warning', msg: 'you need to create a project' })
    }
    // if we have projects and no current then autoselect first project
    if (projects.length > 0) {
      if (settings.currentProject) {
        switchProject(settings.currentProject)
      } else {
        // auto select first project
        switchProject()
        updateSettings({ currentProject: projects[0].id })
      }
    }
  }

  const updateAccount = data => setAccount({ ...account, ...data })

  const updateProjects = project => {
    const updatedProjects = projects.map(p => {
      return p.src === project.src ? project : p
    })
    setProjects(updatedProjects)
  }
  const updateSettings = data => setSettings({ ...settings, ...data })

  const toggleSettingsOpen = () => {
    setSettingsOpen(!settingsOpen)
  }
  const toggleModalOpen = modalName => {
    console.log({ modalName })
    if (!modalName) return setModalOpen(null)
    if (modalName === modalOpen) return setModalOpen(null)
    setModalOpen(modalName)
    console.log('open modal', modalName)
    setModalOpen(modalOpen === modalName ? null : modalName)
  }
  const createProject = project => {
    const newProject = { ...project, todos: [], id: Date.now() }
    setProjects([...projects, newProject])
    setProject(newProject)
    updateSettings({ currentProject: newProject.id })
  }

  const switchProject = id => {
    let project = projects[0]
    if (id) {
      console.log('switch to project id', id)
      const found = projects.find(p => p.id === id)
      if (found) project = found
    }

    setProject(project)
    updateSettings({ currentProject: project.id })
    addAlert({ type: 'success', msg: project.title })
  }

  const removeProject = id => {
    const updatedProjects = projects.filter(p => p.id !== id)
    setProjects(updatedProjects)
    // switch project if we are removing the currently viewed project
    if (settings.currentProject === id) switchProject(updatedProjects[0].id)
  }

  const value = {
    account,
    updateAccount,
    projects,
    updateProjects,
    removeProject,
    project,
    settings,
    updateSettings,
    settingsOpen,
    toggleSettingsOpen,
    modalOpen,
    toggleModalOpen,
    login,
    createProject,
    resetGlobalState,
    switchProject,
    loadProject,
  }

  return <globalContext.Provider value={value} {...props} />
}

export function useGlobalContext() {
  return useContext(globalContext)
}
