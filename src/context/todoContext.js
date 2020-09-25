import { createContext, useContext, useEffect, useState } from 'react'
import { useGlobalContext } from './globalContext'

const todoContext = createContext({
  todos: [],
  addTodo: () => {},
  updateTodo: () => {},
  removeTodo: () => {},
  updateSearch: () => {},
  sort: a => [],
})

export function TodoProvider(props) {
  const { project, updateProjects } = useGlobalContext()
  const [todos, setTodos] = useState([])
  const [search, setSearch] = useState('')

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

  const value = {
    todos,
    addTodo,
    updateTodo,
    removeTodo,
    search,
    updateSearch,
    sort,
  }

  return <todoContext.Provider value={value} {...props} />
}

export function useTodoContext() {
  return useContext(todoContext)
}
