import { createContext, useContext, useEffect, useState } from 'react'

import { useGlobalContext } from './globalContext'

const todoContext = createContext({
  todos: [],
  addTodo: a => {},
  updateTodo: a => {},
  removeTodo: a => {},
  updateSearch: a => {},
  sort: a => [],
  search: '',
  removeCompleted: () => {},
})

export function TodoProvider(props) {
  const { project, projects, updateProject } = useGlobalContext()
  const [todos, setTodos] = useState([])
  const [search, setSearch] = useState('')

  // when a project is selected pre-fill the todos
  useEffect(() => {
    if (project !== null) setTodos(project.todos)
  }, [project])

  // when there are no projects present make sure state is reset
  useEffect(() => {
    if (projects.length > 0) return
    setTodos([])
    setSearch('')
  }, [projects])

  // when todos change, update project
  useEffect(() => {
    // we shouldn't need to update todos if there are none.  even remove todos should still be present
    if (todos.length === 0) return
    // if the project.todos matches state todos then this is our initial load from server so don't update
    if (JSON.stringify(project.todos) === JSON.stringify(todos)) return

    const updatedProject = project
    updatedProject.todos = todos
    updateProject(updatedProject)
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

  const removeCompleted = () => {
    setTodos(currentTodos => {
      const updatedTodos = currentTodos.filter(todo => !todo.done)
      return updatedTodos
    })
  }

  const value = {
    todos,
    addTodo,
    updateTodo,
    removeTodo,
    search,
    updateSearch,
    sort,
    removeCompleted,
  }

  return <todoContext.Provider value={value} {...props} />
}

export function useTodoContext() {
  return useContext(todoContext)
}
