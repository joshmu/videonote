import { createContext, useContext, useEffect, useState } from 'react'
import { useNotificationContext } from './notificationContext'

const settingDefaults = {
  playOffset: -4,
  showHints: true,
  seekJump: 10,
  sidebarWidth: 400,
  currentProjectId: null,
}

const globalContext = createContext({
  account: {},
  projects: [],
  settings: settingDefaults,
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

export function GlobalProvider({ serverData, ...props }) {
  const [account, setAccount] = useState(null)
  const [projects, setProjects] = useState([])
  const [settings, setSettings] = useState(settingDefaults)

  const [currentProject, setCurrentProject] = useState(null)

  const [openSidebar, setOpenSidebar] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(null)
  const { addAlert } = useNotificationContext()

  const resetGlobalState = () => {
    setAccount(null)
    setProjects([])
    setSettings(settingDefaults)
    setCurrentProject(null)
    setSettingsOpen(false)
    setModalOpen(false)
  }

  // initial response from server
  useEffect(() => {
    handleInitialServerData(serverData)
  }, [])

  // recommend creating a project if there are no projects
  useEffect(() => {
    if (projects.length === 0)
      addAlert({ type: 'info', msg: 'Create a project to start' })
  }, [projects])

  // if we have projects and one isn't assigned then let's do it
  useEffect(() => {
    if (projects.length > 0 && currentProject === null) {
      if (settings.currentProjectId) {
        loadProject(settings.currentProjectId)
      } else {
        // otherwise use most recent project
        const recentProjectId = projects.slice(-1)[0]
        loadProject(recentProjectId)
      }
    }
  }, [projects, currentProject, settings.currentProjectId])

  // if current project changes then update settings
  useEffect(() => {
    if (currentProject) updateSettings({ currentProjectId: currentProject.id })
  }, [currentProject])

  const updateAccount = data => setAccount({ ...account, ...data })

  const updateProjects = project => {
    const updatedProjects = projects.map(p => {
      return p.id === project.id ? project : p
    })
    setProjects(updatedProjects)
  }

  const updateProject = data => {
    const updatedProject = { ...currentProject, ...data }
    setCurrentProject(updatedProject)
  }

  // update projects when we update the current project
  useEffect(() => {
    if (currentProject === null) return
    updateProjects(currentProject)
  }, [currentProject])

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
    console.log('createProject', { project })
    // project = {title, src}
    // todo: api request to create project, assign user id to it
    // todo: api sends all available projects back
    // todo: notifications
    // todo: match input project with response 'projects'
    // todo: set projects
    // todo: set new current projects
    // todo: grab the right one
    const newProject = { ...project, todos: [], id: Date.now() }
    setProjects([...projects, newProject])
    setCurrentProject(newProject)
  }

  const loadProject = id => {
    console.log('switch to project id', id)
    const project = projects.find(p => p.id === id)

    if (!project) addAlert({ type: 'error', msg: 'Project not found' })

    setCurrentProject(project)

    // notification
    addAlert({ type: 'success', msg: `${project.title.toUpperCase()}` })
  }

  const removeProject = id => {
    // todo: request project removal from api (provide user token)
    // todo: mark project 'deleted' timestamp on server
    // todo: pass back to client all available projects for them
    // todo: setProjects
    // todo: notifications

    // this is the success data from api
    const updatedUserProjects = []

    setProjects(updatedUserProjects)

    // switch project if we are removing the currently viewed project
    if (settings.currentProjectId === id) {
      const newCurrentProject = updatedUserProjects.slice(-1)[0]
      loadProject(newCurrentProject.id)
    }
  }

  //-------------------------------
  const handleInitialServerData = data => {
    console.log('handle initial server data', data)
    const { user } = data
    const { settings, ...account } = user
    // allocate server data to respective areas
    console.log({ account, settings })
    setAccount(account)
    setSettings(settings)
    // todo: get projects based on their idList and pass back
  }

  const value = {
    account,
    updateAccount,
    projects,
    updateProjects,
    removeProject,
    project: currentProject,
    settings,
    updateSettings,
    settingsOpen,
    toggleSettingsOpen,
    modalOpen,
    toggleModalOpen,
    createProject,
    resetGlobalState,
    switchProject: loadProject,
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
