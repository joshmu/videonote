import { createContext, useContext, useEffect, useState } from 'react'
import { useGlobalContext } from './globalContext'

// todo: global data could be
// [{ user: {}, projects: [{ src: '', todos: [], created: '', updated: '', deleted: '' }] }]

const todoContext = createContext({ todos: [] })

export function TodoProvider(props) {
  const { project, updateProjects, settings } = useGlobalContext()
  const [todos, setTodos] = useState([])
  const [search, setSearch] = useState('')

  const [sidebar, setSidebar] = useState({
    width: 400,
    resizing: false,
  })

  // when a project is selected pre-fill the todos
  useEffect(() => {
    if (project !== null) setTodos(project.todos)
  }, [project])

  // when todos change, update project
  useEffect(() => {
    if (!project) return

    const updatedProject = project
    updatedProject.todos = todos
    updateProjects(updatedProject)
  }, [todos])

  const addTodo = todo => {
    const newTodo = {
      id: Date.now(),
      msg: todo.msg,
      time: todo.time,
      done: false,
    }
    setTodos([...todos, newTodo])
  }

  const updateTodo = todo => {
    const updatedTodos = todos.map(t => (t.id === todo.id ? todo : t))
    setTodos(updatedTodos)
  }

  const removeTodo = id => {
    const updatedTodos = todos.filter(todo => todo.id !== id)
    setTodos(updatedTodos)
  }

  const updateSearch = txt => {
    setSearch(txt)
  }

  const sort = todos => {
    // default is to sort chronologically
    let sorted = todos.sort((p, c) => p.time - c.time)

    // search
    if (search !== '') {
      sorted = sorted.filter(todo => todo.msg.includes(search))
    }

    return sorted
  }

  // resizable sidebar
  const sidebarResizeStart = () => {
    if (!sidebar.resizing) {
      console.log('start resize')
      setSidebar({ ...sidebar, resizing: true })
      document.addEventListener('mousemove', sidebarResizeMove)
      document.addEventListener('mouseup', sidebarResizeEnd)
      // lock resize cursor
      document.body.style.cursor = 'ew-resize'
      // iframe fix
      document.getElementsByTagName('iframe')[0].style.pointerEvents = 'none'
      // remove transition duration
      document.getElementById('videoContent').style.transitionDuration = '0'
      document.getElementById('sidebar').style.transitionDuration = '0'
    }
  }
  const sidebarResizeMove = e => {
    console.log('resizing')
    setSidebar({ ...sidebar, width: window.innerWidth - e.clientX })
  }
  const sidebarResizeEnd = e => {
    console.log('end resize')
    const newWidth = window.innerWidth - e.clientX
    setSidebar({ ...sidebar, width: newWidth, resizing: false })

    document.removeEventListener('mousemove', sidebarResizeMove)
    document.removeEventListener('mouseup', sidebarResizeEnd)
    // remove resize cursor
    document.body.style.cursor = 'default'
    // iframe fix
    document.getElementsByTagName('iframe')[0].style.pointerEvents = 'auto'
    // resume transition duration
    document.getElementById('videoContent').style.transitionDuration = '300'
    document.getElementById('sidebar').style.transitionDuration = '500'
  }

  const value = {
    todos,
    addTodo,
    updateTodo,
    removeTodo,
    search,
    updateSearch,
    sort,
    settings,
    sidebar,
    sidebarResizeStart,
    sidebarResizeMove,
    sidebarResizeEnd,
  }

  return <todoContext.Provider value={value} {...props} />
}

export function useTodoContext() {
  return useContext(todoContext)
}
