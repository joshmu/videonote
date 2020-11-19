import { motion } from 'framer-motion'
import { useState } from 'react'
import { ImBin2 as TrashIcon } from 'react-icons/im'

import Select from '@/components/shared/Select/Select'
import { useGlobalContext } from '@/context/globalContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'

export default function ProjectsModal({ toggle: toggleModal, motionKey }) {
  const {
    projects,
    project: currentProject,
    loadProject,
    removeProject,
    createPrompt,
  } = useGlobalContext()
  const [mousingOver, setMousingOver] = useState(null)

  const handleSelection = _id => {
    // if we are on the current project do nothing
    if (_id === currentProject._id) return

    loadProject(_id)
    toggleModal()
  }

  const handleRemoveProject = ({ title, _id }) => {
    createPrompt({
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
          <div
            key={project._id}
            onMouseEnter={() => handleMousePosition(true, project)}
            onMouseLeave={() => handleMousePosition(false, project)}
            className={`${
              currentProject._id === project._id
                ? 'bg-opacity-25'
                : ' bg-opacity-0 cursor-pointer'
            } relative bg-themeSelectOpacity transition-colors duration-200 ease-out`}
          >
            <Select
              cursor={
                currentProject._id === project._id
                  ? 'cursor-default'
                  : 'cursor-pointer'
              }
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
          </div>
        ))}
      </ModalInnerContainer>
    </ModalContainer>
  )
}
