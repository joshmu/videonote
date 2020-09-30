import { useState } from 'react'
import { useGlobalContext } from '../../context/globalContext'
import Select from '../shared/Select'
import { ModalContainer, ModalHeader } from './Modal'
import { ImBin2 as TrashIcon } from 'react-icons/im'
import { motion } from 'framer-motion'

export default function ProjectsModal({ toggle: toggleModal }) {
  const { projects, switchProject, removeProject } = useGlobalContext()
  const [mousingOver, setMousingOver] = useState(null)

  const handleSelection = id => {
    switchProject(id)
    toggleModal()
  }

  const handleRemoveProject = ({ title, id }) => {
    const answer = window.confirm(
      `Are you sure you want to delete the project: ${title}`
    )
    if (answer) removeProject(id)
  }

  const handleMousePosition = (inside, project) => {
    if (inside) setMousingOver(project.id)
    if (!inside) setMousingOver(null)
  }

  return (
    <ModalContainer toggle={toggleModal}>
      <ModalHeader>Projects</ModalHeader>

      <div>
        {projects.map(project => (
          <Select
            key={project.id}
            onMouseEnter={() => handleMousePosition(true, project)}
            onMouseLeave={() => handleMousePosition(false, project)}
          >
            <div onClick={() => handleSelection(project.id)} className='flex-1'>
              <span className='text-sm capitalize'>{project.title} </span>
              <span className='text-xs'>({project.todos.length} notes)</span>
            </div>
            {mousingOver === project.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  handleRemoveProject(project)
                }}
                className='transition-colors duration-300 ease-in-out cursor-pointer hover:text-highlight-400 text-themeText2'
              >
                <TrashIcon />
              </motion.div>
            )}
          </Select>
        ))}
      </div>
    </ModalContainer>
  )
}
