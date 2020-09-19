import { createContext, useContext, useEffect, useState } from 'react'

// todo: global data could be
// [{ user: {}, projects: [{ src: '', todos: [], created: '', updated: '', deleted: '' }] }]

const globalContext = createContext({ todos: [] })

export function GlobalProvider(props) {
  const [todos, setTodos] = useState([])
  const [search, setSearch] = useState('')

  // initial load, check for localStorage
  useEffect(() => {
    const data = window.localStorage.getItem('todos')
    if (data) setTodos(JSON.parse(data))
  }, [])

  // update local storage whenever our todos change
  useEffect(() => {
    updateLocalStorage()
  }, [todos])

  const updateLocalStorage = () => {
    window.localStorage.setItem('todos', JSON.stringify(todos))
  }

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

  const handleSearch = e => {
    const value = e.target.value
    // disable empty space for start of search
    setSearch(value === ' ' ? '' : value)
  }

  const listSort = todos => {
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
    handleSearch,
    listSort,
  }

  return <globalContext.Provider value={value} {...props} />
}

export function useGlobalContext() {
  return useContext(globalContext)
}
