import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ImBin2 as TrashIcon } from 'react-icons/im'

import Select from '@/components/shared/Select/Select'
import { useGlobalContext } from '@/context/globalContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'

export default function ProjectsModal({ toggle: toggleModal, motionKey }) {
  const {
    projects,
    loadProject,
    removeProject,
    modalsOpen,
    prompt,
  } = useGlobalContext()
  const [mousingOver, setMousingOver] = useState(null)

  useEffect(() => {
    if (projects.length === 0 && modalsOpen === 'projects') toggleModal()
  }, [projects, modalsOpen])

  const handleSelection = _id => {
    loadProject(_id)
    toggleModal()
  }

  const handleRemoveProject = ({ title, _id }) => {
    prompt({
      msg: (
        <span>
          Are you sure you want to remove the project:{' '}
          <span className='text-themeAccent'>{title}?</span>
        </span>
      ),
      action: () => {
        removeProject(_id)
      },
    })
  }

  const handleRemoveCompleted = () => {}

  const handleMousePosition = (inside, project) => {
    if (inside) setMousingOver(project._id)
    if (!inside) setMousingOver(null)
  }

  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Projects</ModalHeader>

      <ModalInnerContainer>
        {projects.map(project => (
          <Select
            key={project._id}
            onMouseEnter={() => handleMousePosition(true, project)}
            onMouseLeave={() => handleMousePosition(false, project)}
          >
            <div
              onClick={() => handleSelection(project._id)}
              className='flex-1'
            >
              <span className='text-sm capitalize'>{project.title} </span>
              <span className='ml-2 text-xs text-themeText2'>
                {project.notes.length} notes
              </span>
            </div>
            {mousingOver === project._id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  handleRemoveProject(project)
                }}
                className='transition-colors duration-300 ease-in-out cursor-pointer hover:text-themeAccent text-themeText2'
              >
                <TrashIcon />
              </motion.div>
            )}
          </Select>
        ))}
      </ModalInnerContainer>
    </ModalContainer>
  )
}
