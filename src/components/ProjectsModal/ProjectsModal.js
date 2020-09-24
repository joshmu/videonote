import { useGlobalContext } from '../../context/globalContext'
import Animate from '../shared/Animate'

export default function ProjectsModal({ open, toggle }) {
  const { projects, switchProject } = useGlobalContext()

  const handleSelection = id => {
    switchProject(id)
    toggle()
  }

  return (
    <>
      {open && (
        <Animate motionKey='projectsModal'>
          <div className='absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2'>
            <div className='max-w-4xl p-6 mx-auto bg-white rounded-sm shadow-md'>
              <h2 className='mb-4 ml-2 text-lg font-semibold text-gray-700 capitalize'>
                Projects
              </h2>
              <ul className='text-md'>
                {projects.map(project => (
                  <li
                    key={project.id}
                    onClick={() => handleSelection(project.id)}
                    className='px-2 py-1 capitalize transition-colors duration-200 ease-in-out cursor-pointer hover:bg-highlight-100'
                  >
                    {project.title || project.src} ({project.todos.length}{' '}
                    notes)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Animate>
      )}
    </>
  )
}
