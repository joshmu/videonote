import { StatusCodes } from 'http-status-codes'
import Router from 'next/router'
import { createContext, useContext, useEffect, useState } from 'react'
import Cookie from 'universal-cookie'

import useGlobalKeydown from '@/hooks/useGlobalKeydown'
import usePrompt from '@/hooks/usePrompt'
import { fetcher } from '@/utils/clientHelpers'

import { useNotificationContext } from './notificationContext'

const SETTINGS_DEFAULTS = {
  playOffset: -4,
  showHints: true,
  seekJump: 10,
  sidebarWidth: 400,
  currentProject: null,
}

const HINTS = [
  'Spacebar = Play/Pause',
  'Left/Right = Seek',
  'Up/Down = Volume',
  'Shift + Spacebar = show/hide notes',
  'Click note to jump to time',
  'Mark notes done by clicking their time',
  'Double click note = Edit',
  'Shift + Left/Right = Prev/Next note',
  'Click video timeline to jump',
  'Drag list edge to resize',
]

const globalContext = createContext({})

export function GlobalProvider({ serverData, ...props }) {
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS)

  const [currentProject, setCurrentProject] = useState(null)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalsOpen, setModalsOpen] = useState([])

  const [admin, setAdmin] = useState(true)

  const { addAlert } = useNotificationContext()
  const {
    promptState,
    prompt,
    confirm: promptConfirm,
    reset: promptCancel,
  } = usePrompt()

  // initial load
  useEffect(() => {
    // initial response from server
    handleInitialServerData(serverData)
  }, [])

  // notification recommend creating a project if there are no projects and we have loaded the user
  useEffect(() => {
    if (projects.length === 0 && user) {
      // wipe any existing state if there were previously projects
      setCurrentProject(null)
      // presume user could be new (this could also occur if previous projects have been removed)

      toggleModalOpen('welcome')

      addAlert({
        type: 'info',
        msg: 'Create a project to start',
      })
    }
  }, [projects, user])

  // reset settings.currentProject when projects are empty
  useEffect(() => {
    if (projects.length === 0 && settings.currentProject)
      updateSettings({ currentProject: null })
  }, [projects, settings.currentProject])

  // if we have projects and one isn't assigned then let's do it
  useEffect(() => {
    if (projects.length > 0 && currentProject === null) {
      if (settings.currentProject) {
        loadProject(settings.currentProject)
      } else {
        // otherwise use most recent project
        const recentProject = projects.slice(-1)[0]
        console.log({ recentProject })
        loadProject(recentProject)
      }
    }
  }, [projects, currentProject, settings])

  const noteApi = async noteData => {
    console.log('note api request', noteData)
    // merge note and user information together match 'user' mongo doc
    const body = {
      note: noteData,
    }
    // send updated note to server, token will hold user information required
    const {
      res,
      // @ts-ignore
      data: { note, msg },
    } = await fetcher('/api/note', body)

    if (badResponse(res, msg)) return 'error'

    return note
  }

  const noteApiRemoveDoneNotes = async () => {
    console.log('remove completed notes')
    // api request to delete 'done' notes in current project
    // merge note and user information together match 'user' mongo doc
    const body = {
      action: 'remove done notes',
      projectId: currentProject._id,
    }
    // send updated note to server, token will hold user information required
    const {
      res,
      // @ts-ignore
      data: { notes, msg },
    } = await fetcher('/api/note', body)

    if (badResponse(res, msg)) return 'error'

    return notes
  }

  const updateProject = async projectData => {
    if (!admin) return guestUpdaingProject(projectData)

    // if no project id is provided then grab it from current project
    // * _id is requird for the api
    if (!projectData._id) projectData._id = currentProject._id
    // * notes > currentProject > update this project on server > update projects with server response
    // @ts-ignore
    const response = await handleProjectApi('update', user, projectData)
    if (!response) return console.error('api error')
    const { user, projects } = response

    // update projects from server response
    setProjects(projects)

    // get current project from server response and set
    const projectId = projectData._id || currentProject._id
    const updatedProject = projects.find(p => p._id === projectId)
    setCurrentProject(updatedProject)
  }

  const guestUpdaingProject = async project => {
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
    if (!admin) return

    console.log('updating settings...', newSettingsData)
    // merge settings and user information together match 'user' mongo doc
    const body = {
      settings: newSettingsData,
    }
    // send updated settings to server, token will hold user information required
    const {
      res,
      // @ts-ignore
      data: { settings, msg },
    } = await fetcher('/api/settings', body)

    if (badResponse(res, msg)) return

    // any settings which are not present from DB we fill with defaults
    const fullSettings = { ...SETTINGS_DEFAULTS, ...settings }

    setSettings(fullSettings)
  }

  const toggleMenuOpen = (state = undefined) => {
    const ismenuOpen = state ? state : !menuOpen
    setMenuOpen(ismenuOpen)
  }
  const toggleSidebar = (state = undefined) => {
    setSidebarOpen(currentState => {
      const updatedState = state ? state : !currentState
      return updatedState
    })
  }
  const toggleModalOpen = modalName => {
    console.log('opening modal', modalName)
    // if no param then turn off modals
    if (!modalName) return setModalsOpen([])
    // if modal name exists then find it and remove from modals open list
    if (modalsOpen.includes(modalName))
      return setModalsOpen(currentModals =>
        currentModals.filter(modal => modal !== modalName)
      )
    // otherwise add modal to list of open modals
    setModalsOpen(currentModals => [...currentModals, modalName])
    // setModalsOpen(modalsOpen === modalName ? null : modalName)
  }

  const createProject = async project => {
    const response = await handleProjectApi('create', user, project)
    if (!response) return console.error('api error')
    const { user, projects } = response

    // reset user's projects
    setProjects(projects)
    // grab newly created project from the server response and set
    // const insertedProject = projects.find(
    //   p => p.src === project.src && p.title === project.title
    // )
    // loadProject(insertedProject)
  }

  // typically handle project data or presume id has been passed
  const loadProject = projectOrId => {
    console.log('switch to project', projectOrId)
    // id has been passed and we need to grab the project
    if (typeof projectOrId === 'string')
      projectOrId = projects.find(p => p._id === projectOrId)

    const selectedProject = projectOrId

    if (!selectedProject) {
      addAlert({ type: 'error', msg: 'Project not found' })
      return
    }

    setCurrentProject(selectedProject)

    // only update if there is a change
    if (selectedProject._id !== settings.currentProject) {
      updateSettings({ currentProject: selectedProject._id })
    }

    // notification when we load a project
    addAlert({
      type: 'project',
      msg: `${selectedProject.title.toUpperCase()}`,
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
    if (settings.currentProject === _id) {
      const newCurrentProject = projects.slice(-1)[0]
      loadProject(newCurrentProject)
    }
  }

  //-------------------------------
  const handleInitialServerData = data => {
    console.log('handle initial server data', data)
    // user data and msg for server messages
    const { user, msg } = data
    // grab user projects as seperate var and rest is the account
    const { projects, ...userAccount } = user

    // if msg presume there is an error
    if (msg) {
      Router.push('/login')
      addAlert({ type: 'error', msg })
      return
    }

    // allocate server data to respective areas
    setProjects(projects)

    if (userAccount) {
      const { settings, ...user } = userAccount
      setUser(user)

      // avoid null values from mongo
      // if we have any null values in returned settings then replace with defaults
      if (settings instanceof Object) {
        // if we have any null settings lets swap them to their defaults
        Object.entries(settings).forEach(([key, val]) => {
          if (settings[key] === null) settings[key] = SETTINGS_DEFAULTS[key]
        })
        setSettings({ ...SETTINGS_DEFAULTS, ...settings })
      }

      addAlert({ type: 'success', msg: `Logged in: ${user.username}` })
    } else {
      // if there is no account data then admin is not present, client is guest
      setAdmin(false)
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
    if (res.status !== StatusCodes.OK) {
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

  const removeAccount = async userData => {
    console.log('removing account', userData.username)

    // request account deletion
    // api request to create project, assign user id to it
    const body = {
      action: 'remove',
      // use passed data otherwise use current user information in global state
      user: userData || user,
    }

    // api sends all available projects back
    const { res, data } = await fetcher('/api/user', body)

    if (badResponse(res, data.msg)) return

    // presume status 200
    addAlert({ type: 'success', msg: 'Account removed. Goodbye! 👋' })

    // remove JWT token cookie
    const cookies = new Cookie()
    cookies.remove('token')

    // redirect to landing page
    Router.push('/hello')
  }

  const cancelModals = () => {
    if (modalsOpen.length > 0) setModalsOpen([])
    if (promptState.isOpen) promptCancel()
    if (menuOpen) setMenuOpen(false)
  }
  const handleGlobalEscapeKey = key => {
    if (key === 'Escape') {
      cancelModals()
    }
  }
  useGlobalKeydown(handleGlobalEscapeKey)

  const value = {
    user,
    updateUser,
    projects,
    removeProject,
    project: currentProject,
    settings,
    updateSettings,
    menuOpen,
    toggleMenuOpen,
    modalsOpen,
    toggleModalOpen,
    createProject,
    loadProject,
    sidebarOpen,
    toggleSidebar,
    updateProject,
    handleInitialServerData,
    SETTINGS_DEFAULTS,
    HINTS,
    admin,
    copyToClipboard,
    removeAccount,
    promptState,
    prompt,
    promptConfirm,
    promptCancel,
    cancelModals,
    noteApi,
    noteApiRemoveDoneNotes,
  }

  return <globalContext.Provider value={value} {...props} />
}

export function useGlobalContext() {
  return useContext(globalContext)
}
