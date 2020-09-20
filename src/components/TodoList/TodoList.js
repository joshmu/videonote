import TodoItem from './TodoItem'
import { useTodoContext } from '../../context/todoContext'

export default function TodoList() {
  const { todos, sort } = useTodoContext()

  return (
    <div className='w-full bg-white'>
      {sort(todos).map(todo => (
        <TodoItem todo={todo} key={todo.id} />
      ))}
    </div>
  )
}
