import { useGlobalContext } from '../../context/globalContext'
import Animate from '../shared/Animate'

export default function ProjectsModal({ toggle: toggleModal }) {
  const { projects, switchProject, removeProject } = useGlobalContext()

  const handleSelection = id => {
    switchProject(id)
    toggleModal()
  }

  const handleRightClick = (e, id) => {
    e.preventDefault()
    removeProject(id)
    toggleModal()
  }

  return (
    <Animate motionKey='projectsModal'>
      <div className='absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2'>
        <div className='max-w-4xl p-6 mx-auto bg-white rounded-sm shadow-md'>
          <h2 className='mb-4 text-lg font-semibold text-gray-700 capitalize'>
            Projects
          </h2>
          <ul>
            {projects.map(project => (
              <li
                key={project.id}
                onClick={() => handleSelection(project.id)}
                onContextMenu={e => handleRightClick(e, project.id)}
                className='block px-4 py-2 text-gray-700 cursor-pointer hover:bg-blue-500 hover:text-white'
              >
                <span className='text-sm capitalize'>{project.title} </span>
                <span className='text-xs'>({project.todos.length} notes)</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Animate>
  )
}
