/**
 * @path /src/components/Modals/ProjectsModal/ProjectsModal.tsx
 *
 * @project videonote
 * @file ProjectsModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Sunday, 22nd November 2020 5:28:32 pm
 * @copyright © 2020 - 2020 MU
 */

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ImBin2 as TrashIcon } from 'react-icons/im'

import { Select } from '@/components/shared/Select/Select'
import { useGlobalContext } from '@/context/globalContext'
import { ModalContainer } from '@/shared/Modal/ModalContainer'
import { ModalHeader } from '@/shared/Modal/ModalHeader'
import { ModalInnerContainer } from '@/shared/Modal/ModalInnerContainer'

import { ProjectInterface } from '../../shared/types'

export const ProjectsModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void
  motionKey: string
}) => {
  const {
    projects,
    project: currentProject,
    loadProject,
    removeProject,
    createPrompt,
  } = useGlobalContext()
  const [mousingOverProjectItem, setMousingOverProjectItem] = useState<string>(
    null
  )

  const handleSelection = (_id: string): void => {
    // if we are on the current project do nothing
    if (_id === currentProject._id) return

    loadProject(_id)
    toggleModal()
  }

  const handleRemoveProject = ({ title, _id }: ProjectInterface): void => {
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

  const handleMousePosition = (
    inside: boolean,
    project: ProjectInterface
  ): void => {
    if (inside) setMousingOverProjectItem(project._id)
    if (!inside) setMousingOverProjectItem(null)
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
              {mousingOverProjectItem === project._id && (
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
