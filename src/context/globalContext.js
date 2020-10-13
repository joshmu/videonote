import Router from 'next/router'
import { createContext, useContext, useEffect, useState } from 'react'

import { fetcher } from '../../utils/clientHelpers'
import { useNotificationContext } from './notificationContext'

const SETTINGS_DEFAULTS = {
  playOffset: -4,
  showHints: true,
  seekJump: 10,
  sidebarWidth: 400,
  currentProjectId: null,
}

const HINTS = [
  'Spacebar = Play/Pause',
  'Left/Right = Seek',
  'Up/Down = Volume',
  'Drag list edge to resize',
  'Shift Key = show/hide notes',
  'Click note to jump to time',
  'Mark notes by clicking their time',
  'Double click note = Edit',
]

const globalContext = createContext({})

export function GlobalProvider({ serverData, ...props }) {
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS)

  const [currentProject, setCurrentProject] = useState(null)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(null)

  const [guest, setGuest] = useState(false)

  const { addAlert } = useNotificationContext()

  // todo: check if this is still up to date
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
    } else {
      // todo: reset state here for empty projects after deletion?
    }
  }, [projects, currentProject, settings])

  const updateProject = async project => {
    if (guest) return guestUpdateProject(project)

    // if no project id is provided then grab it from current project
    // * _id is requird for the api
    if (!project._id) project._id = currentProject._id
    // * todos > currentProject > update this project on server > update projects with server response
    // @ts-ignore
    const response = await handleProjectApi('update', user, project)
    if (!response) return console.error('api error')
    const { user, projects } = response

    // update projects from server response
    setProjects(projects)

    // get current project from server response and set
    const projectId = project._id || currentProject._id
    const updatedProject = projects.find(p => p._id === projectId)
    setCurrentProject(updatedProject)
  }

  const guestUpdateProject = async project => {
    console.log('guest is updating project', project)
    const body = {
      project,
    }
    const res = await fetch('/api/public_project_update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    const { project: updatedProject, msg } = data

    // handle if we get a bad response
    if (badResponse(res, msg)) return

    // success
    console.log(data.msg)
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

    console.log({ settings, user })
    setSettings(settings)
    setUser(user)
  }

  const updateSettings = async newSettingsData => {
    if (guest) return

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
    setSidebarOpen(currentState => {
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
    const insertedProject = projects.find(
      p => p.src === project.src && p.title === project.title
    )
    loadProject(insertedProject)
  }

  // typically handle project data or presume id has been passed
  const loadProject = projectOrId => {
    // todo: when projectOrId is undefined then can we reset global state?

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
    addAlert({
      type: 'success',
      msg: `Project: ${selectedProject.title.toUpperCase()}`,
    })
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
    const { user: account, projects, msg } = data

    // if msg presume there is an error
    if (msg) {
      Router.push('/login')
      addAlert({ type: 'error', msg })
      return
    }

    // allocate server data to respective areas
    setProjects(projects)

    if (account) {
      const { settings, ...user } = account
      setUser(user)

      // avoid null values from mongo if we have any in settings and assign defaults
      if (settings) {
        // if we have any null settings lets use the defaults
        Object.entries(settings).forEach(([key, val]) => {
          if (settings[key] === null) settings[key] = SETTINGS_DEFAULTS[key]
        })
      }

      setSettings({ ...SETTINGS_DEFAULTS, ...settings })

      // alerts
      // addAlert({ type: 'success', msg: `Logged in: ${user.username}` })
    } else {
      // if we receive no account data then we can presume we are in guest mode with a single project
      setGuest(true)
    }
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

  const copyToClipboard = (txt, alertMsg = 'Copied to clipboard!') => {
    // if no text is defined presume we are sharing the project url
    if (!txt) txt = `https://videonote.app/vn/${currentProject._id}`

    // copy to clipboard
    navigator.clipboard.writeText(txt).then(
      function () {
        /* clipboard successfully set */
        addAlert({ type: 'info', msg: `${alertMsg} ${txt}` })
      },
      function () {
        /* clipboard write failed */
        console.log('clipboard copy failed')
      }
    )
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
    sidebarOpen,
    toggleSidebar,
    updateProject,
    handleInitialServerData,
    SETTINGS_DEFAULTS,
    HINTS,
    guest,
    copyToClipboard,
  }

  return <globalContext.Provider value={value} {...props} />
}

export function useGlobalContext() {
  return useContext(globalContext)
}
