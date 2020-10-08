import { createContext, useContext, useEffect, useState } from 'react'
import { useNotificationContext } from './notificationContext'
import { fetcher } from '../../utils/clientHelpers'
import Router from 'next/router'

const SETTINGS_DEFAULTS = {
  playOffset: -4,
  showHints: true,
  seekJump: 10,
  sidebarWidth: 400,
  currentProjectId: null,
}

const globalContext = createContext({})

export function GlobalProvider({ serverData, ...props }) {
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS)

  const [currentProject, setCurrentProject] = useState(null)

  const [openSidebar, setOpenSidebar] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(null)
  const { addAlert } = useNotificationContext()

  const resetGlobalState = () => {
    setUser(null)
    setProjects([])
    setSettings(SETTINGS_DEFAULTS)
    setCurrentProject(null)
    setSettingsOpen(false)
    setModalOpen(false)
  }

  // initial response from server
  useEffect(() => {
    handleInitialServerData(serverData)
  }, [])

  // recommend creating a project if there are no projects and we have loaded the user
  useEffect(() => {
    if (projects.length === 0 && user)
      addAlert({ type: 'info', msg: 'Create a project to start' })
  }, [projects, user])

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

  // update projects when we update the current project
  // useEffect(() => {
  //   if (currentProject === null) return
  //   updateProjects(currentProject)
  // }, [currentProject])

  // const updateProjects = project => {
  //   const updatedProjects = projects.map(p => {
  //     return p._id === project._id ? project : p
  //   })
  //   setProjects(updatedProjects)
  // }

  const updateProject = async project => {
    // * todos > currentProject > update this project on server > update projects with server response
    // @ts-ignore
    const response = await handleProjectApi('update', user, project)
    if (!response) return console.error('api error')
    const { user, projects } = response

    // setCurrentProject(updatedProject)
    setProjects(projects)
  }

  const updateUser = async userData => {
    // respect format of user mongo object on server
    // @ts-ignore
    console.log('updating user...', userData)
    // merge settings and user information together match 'user' mongo doc
    const body = {
      action: 'update',
      user: userData,
    }
    // send data to update to server, token will hold user information required to authenticate
    const {
      res,
      // @ts-ignore
      data: { user: account, msg },
    } = await fetcher('/api/user', body)

    // handle if we get a bad response
    if (badResponse(res, msg)) return

    // api returns all projects for the user
    if (!account) {
      console.error('user from server is incorrect')
      return
    }

    const { settings, ...user } = account

    setSettings(settings)
    setUser(user)
  }

  const updateSettings = async newSettingsData => {
    console.log('updating settings...', newSettingsData)
    // merge settings and user information together match 'user' mongo doc
    const body = {
      action: 'update',
      user: { settings: newSettingsData },
    }
    // send updated settings to server, token will hold user information required
    const {
      res,
      // @ts-ignore
      data: { user: account, msg },
    } = await fetcher('/api/user', body)

    if (badResponse(res, msg)) return

    // api returns all projects for the user
    if (!account) {
      console.error('user from server is incorrect')
      return
    }

    const { settings, ...user } = account

    setSettings(settings)
    setUser(user)
  }

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
  const createProject = async project => {
    const response = await handleProjectApi('create', user, project)
    if (!response) return console.error('api error')
    const { user, projects } = response

    // reset user's projects
    setProjects(projects)
    // grab newly created project from the server response and set
    const insertedProject = projects.find(p => p.src === project.src)
    loadProject(insertedProject)
  }

  // typically handle project data or presume id has been passed
  const loadProject = projectOrId => {
    console.log('switch to project', projectOrId)
    // therefor id has been passed and we need to grab the project
    if (typeof projectOrId === 'string')
      projectOrId = projects.find(p => p._id === projectOrId)

    const selectedProject = projectOrId

    if (!selectedProject) {
      addAlert({ type: 'error', msg: 'Project not found' })
      return
    }

    setCurrentProject(selectedProject)

    // only update if there is a change
    if (selectedProject._id !== settings.currentProjectId) {
      updateSettings({ currentProjectId: selectedProject._id })
    }

    // notification
    addAlert({ type: 'success', msg: `${selectedProject.title.toUpperCase()}` })
  }

  const removeProject = async _id => {
    const projectData = { _id }
    // @ts-ignore
    const response = await handleProjectApi('remove', user, projectData)
    if (!response) return console.error('api error')
    const { user, projects } = response

    // reset user's projects with updated version
    setProjects(projects)

    // switch project if we are removing the currently viewed project
    if (settings.currentProjectId === _id) {
      const newCurrentProject = projects.slice(-1)[0]
      loadProject(newCurrentProject)
    }
  }

  //-------------------------------
  const handleInitialServerData = data => {
    console.log('handle initial server data', data)
    const { user: account, projects } = data
    const { settings, ...user } = account
    // allocate server data to respective areas
    setUser(user)
    setSettings(settings)
    setProjects(projects)
  }

  const handleProjectApi = async (action, userData, project) => {
    console.log(action, { project })
    // api request to create project, assign user id to it
    const body = {
      action: action,
      user: userData,
      project,
    }
    // api sends all available projects back
    const {
      res,
      data: { user, projects, msg },
    } = await fetcher('/api/project', body)

    if (badResponse(res, msg)) return

    // api returns all projects for the user
    if (!projects) {
      console.error('projects from server is incorrect')
      return
    }

    return { user, projects }
  }

  const badResponse = (res, msg) => {
    if (res.status !== 200) {
      if (msg.match(/invalid token/i)) {
        console.log('invalid token, redirecting...')
        const alertMsg = 'Session expired, please re-enter your credentials'
        addAlert({ type: 'error', msg: alertMsg })
        Router.push('/login')
        return true
      }
      addAlert({ type: 'error', msg: msg })
      return true
    }
    return false
  }

  const value = {
    user,
    updateUser,
    projects,
    // updateProjects,
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
    loadProject,
    openSidebar,
    toggleSidebar,
    updateProject,
    handleInitialServerData,
    SETTINGS_DEFAULTS,
  }

  return <globalContext.Provider value={value} {...props} />
}

export function useGlobalContext() {
  return useContext(globalContext)
}
