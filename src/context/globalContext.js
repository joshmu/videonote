import { createContext, useContext, useEffect, useState } from 'react'
import { useNotificationContext } from './notificationContext'

const globalContext = createContext({
  account: {},
  projects: [],
  settings: {
    playOffset: -4,
    showHints: true,
    seekJump: 10,
    sidebarWidth: 400,
    currentProject: null,
  },
  project: null,
  updateAccount: a => {},
  updateProjects: a => {},
  removeProject: id => {},
  updateSettings: a => {},
  settingsOpen: false,
  toggleSettingsOpen: (a = undefined) => {},
  modalOpen: null,
  toggleModalOpen: (a = 0) => {},
  login: a => {},
  createProject: a => {},
  resetGlobalState: () => {},
  switchProject: (a = 0) => {},
  loadProject: () => {},
  openSidebar: true,
  toggleSidebar: (a = undefined) => {},
  handleInitialServerData: a => {},
})

export function GlobalProvider(props) {
  const [account, setAccount] = useState(null)
  const [projects, setProjects] = useState([])
  const [settings, setSettings] = useState({
    playOffset: -4,
    showHints: true,
    seekJump: 10,
    sidebarWidth: 400,
    currentProject: null,
  })

  const [project, setProject] = useState(null)

  const [openSidebar, setOpenSidebar] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(null)
  const { addAlert } = useNotificationContext()

  const resetGlobalState = () => {
    setAccount(null)
    setProjects([])
    setSettings({
      playOffset: -4,
      showHints: true,
      seekJump: 10,
      sidebarWidth: 400,
      currentProject: null,
    })
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
    let db = JSON.parse(data)

    // if no user then create
    if (!db[user.email]) db[user.email] = createUserDefaults(user)

    const userData = db[user.email]
    console.log({ userData })
    // todo: update account based on settings update (do this when we have finished populating account details)
    if (userData.account) setAccount(userData.account)
    if (userData.projects.length > 0) {
      setProjects(userData.projects)
    } else {
      addAlert({ type: 'info', msg: 'Create a project to start' })
    }

    // merge default settings with saved so we are up to date
    if (userData.settings) {
      const updatedSettings = { ...settings, ...userData.settings }
      setSettings(updatedSettings)
    }
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
    db[account.email] = { account, projects, settings }
    // update db
    window.localStorage.setItem('vn', JSON.stringify(db))
  }

  const loadProject = () => {
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
      return p.id === project.id ? project : p
    })
    setProjects(updatedProjects)
  }

  const updateProject = data => {
    const updatedProject = { ...project, ...data }
    setProject(updatedProject)
  }

  // update projects when we update the current project
  useEffect(() => {
    if (project === null) return
    updateProjects(project)
  }, [project])

  const updateSettings = data => setSettings({ ...settings, ...data })

  const toggleSettingsOpen = (state = undefined) => {
    const cmd = state ? state : !settingsOpen
    setSettingsOpen(cmd)
  }
  const toggleSidebar = (state = undefined) => {
    setOpenSidebar(currentState => {
      const updatedState = state ? state : !currentState
      return updatedState
    })
  }
  const toggleModalOpen = modalName => {
    if (!modalName) return setModalOpen(null)
    if (modalName === modalOpen) return setModalOpen(null)
    setModalOpen(modalName)
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

    // notification
    addAlert({ type: 'success', msg: `${project.title.toUpperCase()}` })
  }

  const removeProject = id => {
    const updatedProjects = projects.filter(p => p.id !== id)
    setProjects(updatedProjects)
    // switch project if we are removing the currently viewed project
    if (settings.currentProject === id) switchProject(updatedProjects[0].id)
  }

  //-------------------------------
  const handleInitialServerData = data => {
    console.log('handle initial server data', data)
    login(data.user)
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
    openSidebar,
    toggleSidebar,
    updateProject,
    handleInitialServerData,
  }

  return <globalContext.Provider value={value} {...props} />
}

export function useGlobalContext() {
  return useContext(globalContext)
}
