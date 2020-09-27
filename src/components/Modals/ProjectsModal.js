import { useGlobalContext } from '../../context/globalContext'
import Select from '../shared/Select'
import { ModalContainer, ModalHeader } from './Modal'

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
    <ModalContainer toggle={toggleModal}>
      <ModalHeader>Projects</ModalHeader>

      <div>
        {projects.map(project => (
          <Select
            key={project.id}
            onClick={() => handleSelection(project.id)}
            onContextMenu={e => handleRightClick(e, project.id)}
          >
            <span className='text-sm capitalize'>{project.title} </span>
            <span className='text-xs'>({project.todos.length} notes)</span>
          </Select>
        ))}
      </div>
    </ModalContainer>
  )
}
