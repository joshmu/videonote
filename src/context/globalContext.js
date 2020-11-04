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
    reset: promptReset,
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

      // if we have a previously open modal, close it
      if (modalsOpen.length > 0) toggleModalOpen()

      // welcome modal
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
      updateSettings({ currentProject: null, _id: settings._id })
  }, [projects, settings])

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
    if (!admin) return

    // add _id for db processing
    projectData._id = currentProject._id

    const response = await projectApi('update', projectData)
    if (!response) return console.error('api error')

    const { project } = response

    // update the relevant project
    // ! avoid updating the 'notes' as this was previously populated by mongoose converting the _id references to data
    setProjects(current =>
      current.map(p => {
        return p._id === project._id ? { ...project, notes: p.notes } : p
      })
    )
    // also update current project state
    // ! avoid updating the 'notes' as this was previously populated by mongoose converting the _id references to data
    setCurrentProject(current => ({ ...project, notes: current.notes }))
  }

  const shareProject = async shareData => {
    const body = {
      action: 'share',
      project: { _id: currentProject._id },
      share: shareData,
    }

    const {
      res,
      data: { msg, ...data },
    } = await fetcher('/api/project', body)

    if (badResponse(res, msg)) return

    if (!data) return console.error('api error')

    console.log('share project api response...')
    console.log(data)
    const { project } = data

    // update the relevant project 'share' prop
    setProjects(current =>
      current.map(p => {
        return p._id === project._id ? { ...p, share: project.share } : p
      })
    )
    // also update current project state with new 'share' data
    setCurrentProject(current => ({ ...current, share: project.share }))

    // return true/false based on returned data matching data sent to server
    const valuesToCheck = ['canEdit', 'url']
    return valuesToCheck.every(key => project.share[key] === shareData[key])
  }
  const removeShareProject = async () => {
    const body = {
      action: 'remove share',
      project: { _id: currentProject._id },
      share: { _id: currentProject.share._id },
    }
    const {
      res,
      data: { msg, ...data },
    } = await fetcher('/api/project', body)

    if (badResponse(res, msg)) return

    if (!data) return console.error('api error')

    const { project } = data

    // update the relevant project
    setProjects(current =>
      current.map(p => {
        return p._id === project._id ? project : p
      })
    )
    // also update current project state
    setCurrentProject(project)

    return res.status === 200
  }

  // to have access to general projects information (like note count) we need to update the projects list
  // we do not alter the current project state with the notes change to avoid a potential update loop
  const updateProjectsStateWithUpdatedNotes = async notes => {
    console.log('update projects notes state')
    // alter state of projects
    setProjects(current =>
      current.map(p => {
        if (p._id === currentProject._id) {
          p.notes = notes
        }
        return p
        // return p._id === currentProject._id ? { ...currentProject, notes } : p
      })
    )
  }

  const loadProject = async projectId => {
    const projectData = { _id: projectId }
    const response = await projectApi('get', projectData)
    if (!response) return console.error('api error')

    const { project } = response

    // update the relevant project
    setProjects(current =>
      current.map(p => {
        return p._id === project._id ? project : p
      })
    )

    // also update current project state
    setCurrentProject(project)

    // update current project settings if it has changed
    if (project._id !== settings.currentProject) {
      updateSettings({ currentProject: project._id, _id: settings._id })
    }

    alertProjectLoaded(project)
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
    if (settings) setSettings(settings)
    setUser(user)
  }

  const updateSettings = async newSettingsData => {
    if (!admin) return

    console.log('updating settings...', newSettingsData)
    // always make sure we include settings _id if we have one (this has been passed earlier)
    const body = {
      settings: newSettingsData,
    }
    // send updated settings to server, token will hold user information required
    const {
      res,
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

  const createProject = async projectData => {
    const response = await projectApi('create', projectData)
    if (!response) return console.error('api error')

    // expect project as response from server
    const { project } = response

    // add project
    setProjects(current => [...current, project])

    // set current project
    setCurrentProject(project)

    // update settings
    updateSettings({ currentProject: project._id })

    alertProjectLoaded(project)
  }

  const removeProject = async _id => {
    const projectData = { _id }
    const response = await projectApi('remove', projectData)
    if (!response) return console.error('api error')

    const { project } = response

    // if 'project' received then 'delete' is successful
    if (project) {
      const remainingProjects = projects.filter(p => p._id !== project._id)
      // remove project from state
      setProjects(remainingProjects)

      // load another project if we are removing current project
      if (remainingProjects.length > 0 && settings.currentProject === _id) {
        const newCurrentProject = remainingProjects.slice(-1)[0]
        loadProject(newCurrentProject._id)
      }
    }
  }

  const fetchWithPasswordPublicProject = async password => {
    // get id
    const shareUrl = window.location.pathname.split('/').slice(-1)[0]

    // fetch config
    const origin = window.location.origin
    const url = `${origin}/api/public_project`
    const body = {
      shareUrl,
      password,
    }

    // request project
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // if an error occurs, redirect to homepage for a guest
    if (res.status !== StatusCodes.OK) {
      Router.push('/')
    }

    // parse
    const data = await res.json()

    return data
  }

  //-------------------------------
  const handleInitialServerData = data => {
    // if password is required then lets exit early
    // fetch data again providing password
    // re-init 'handleInitialServerData'
    if (data.msg === 'shared project password required') {
      prompt({
        msg: (
          <div>
            <h2 className='mb-2 text-xl font-bold text-themeAccent'>
              <a href='/'>VideoNote</a>
            </h2>
            <span className='whitespace-pre'>
              A <span className='text-themeAccent'>password </span>
              is required to access this project
            </span>
          </div>
        ),
        passwordRequired: true,
        action: async data => {
          promptReset()
          const { password } = data
          setTimeout(async () => {
            // get password and send again
            const serverData = await fetchWithPasswordPublicProject(password)
            handleInitialServerData(serverData)
          }, 300)
        },
      })
      return
    } else if (data.msg === 'password incorrect') {
      prompt({
        msg: (
          <div>
            <h2 className='mb-2 text-xl font-bold text-themeAccent'>
              <a href='/'>VideoNote</a>
            </h2>
            <span className='whitespace-pre'>
              The <span className='text-themeAccent'>password </span>
              is incorrect. Do you want to try again?
            </span>
          </div>
        ),
        passwordRequired: true,
        action: async data => {
          promptReset()
          const { password } = data

          setTimeout(async () => {
            // get password and send again
            const serverData = await fetchWithPasswordPublicProject(password)
            handleInitialServerData(serverData)
          }, 300)
        },
      })
      return
    }

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

    if (Object.keys(userAccount).length > 0) {
      const { settings, ...user } = userAccount
      setUser(user)

      // avoid null values from mongo
      // if we have any null property values in returned settings then replace with defaults
      if (typeof settings === 'object' && settings !== null) {
        // if we have any null settings lets swap them to their defaults
        Object.entries(settings).forEach(([key, val]) => {
          if (settings[key] === null) settings[key] = SETTINGS_DEFAULTS[key]
        })
        setSettings({ ...SETTINGS_DEFAULTS, ...settings })
      }

      addAlert({ type: 'success', msg: `Logged in: ${user.username}` })
    } else {
      // if there is no account data then admin is not present, client is guest
      console.log('GUEST MODE')
      setAdmin(false)
    }

    if (projects.length > 0) {
      let currentProject
      if (settings && settings.currentProject) {
        currentProject = projects.find(
          project => project._id === settings.currentProject
        )
      }
      // if we still don't have anything then just grab last project entry in the list
      if (!currentProject) {
        currentProject = projects.slice(-1)[0]
      }
      setCurrentProject(currentProject)

      alertProjectLoaded(currentProject)
    }
  }

  const alertProjectLoaded = project => {
    // notification when we load a project
    addAlert({
      type: 'project',
      msg: `${project.title.toUpperCase()}`,
    })
  }

  const projectApi = async (action, project) => {
    console.log(action, { project })
    // api request to create project, assign user id to it
    const body = {
      action: action,
      project,
    }
    // api sends all available projects back
    const {
      res,
      data: { msg, ...data },
    } = await fetcher('/api/project', body)

    if (badResponse(res, msg)) return

    // api returns all projects for the user
    if (!projects) {
      console.error('projects from server is incorrect')
      return
    }

    return data
  }

  const copyToClipboard = (txt, alertMsg = 'Copied to clipboard!') => {
    if (!txt) return

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
    if (promptState.isOpen) promptReset()
    if (menuOpen) setMenuOpen(false)
  }
  const handleGlobalEscapeKey = key => {
    if (key === 'Escape') {
      cancelModals()
    }
  }
  useGlobalKeydown(handleGlobalEscapeKey)

  const checkCanEdit = () => {
    return admin || currentProject?.share.canEdit
  }

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
    promptCancel: promptReset,
    cancelModals,
    noteApi,
    noteApiRemoveDoneNotes,
    updateProjectsStateWithUpdatedNotes,
    shareProject,
    removeShareProject,
    checkCanEdit,
  }

  return <globalContext.Provider value={value} {...props} />
}

export function useGlobalContext() {
  return useContext(globalContext)
}
