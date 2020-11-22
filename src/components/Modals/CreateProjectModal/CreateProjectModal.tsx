/**
 * @path /src/components/Modals/CreateProjectModal/CreateProjectModal.tsx
 *
 * @project videonote
 * @file CreateProjectModal.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Sunday, 20th September 2020
 * @modified Sunday, 22nd November 2020 5:10:15 pm
 * @copyright © 2020 - 2020 MU
 */

import { ChangeEvent, useState } from 'react'

import { ModalPrimaryBtn } from '@/components/shared/Modal/ModalBtn'
import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import { LocalVideoForm } from '@/shared/LocalVideoForm/LocalVideoForm'
import { ModalContainer } from '@/shared/Modal/ModalContainer'
import { ModalForm } from '@/shared/Modal/ModalForm'
import { ModalHeader } from '@/shared/Modal/ModalHeader'
import { ModalInnerContainer } from '@/shared/Modal/ModalInnerContainer'
import { ModalInput } from '@/shared/Modal/ModalInput'

export const CreateProjectModal = ({
  toggle: toggleModal,
  motionKey,
}: {
  toggle: () => void
  motionKey: string
}) => {
  const { createProject } = useGlobalContext()
  const { addAlert } = useNotificationContext()

  const [project, setProject] = useState<{ title: string; src: string }>({
    title: '',
    src: '',
  })

  const handleCreate = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const title = project.title.trim()
    const videoSrc = project.src.trim()

    event.preventDefault()
    if (title.length === 0 || videoSrc.length === 0) {
      if (title.length === 0)
        addAlert({
          type: 'error',
          msg: 'Project title required.',
        })
      if (videoSrc.length === 0)
        addAlert({
          type: 'error',
          msg: 'Video source required.',
        })
      return
    }

    const newProject = { title, src: videoSrc }
    await createProject(newProject)
    toggleModal()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setProject({ ...project, [event.target.id]: event.target.value })
  }

  const handleVideoSrc = (url: string): void => {
    console.log(url)
    if (url.length === 0) return
    setProject({ ...project, src: url })
  }

  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>
        Create Project {project.title && `- ${project.title}`}
      </ModalHeader>

      <ModalInnerContainer>
        <ModalForm>
          <ModalInput
            title='Project Title'
            id='title'
            type='text'
            value={project.title}
            onChange={handleChange}
          />

          <ModalInput
            title='Video URL'
            placeholder='Dropbox, Youtube, Vimeo...'
            id='src'
            type='text'
            value={project.src}
            onChange={handleChange}
          />

          <LocalVideoForm handleVideoSrc={handleVideoSrc} />

          <div></div>
          <ModalPrimaryBtn handleClick={handleCreate}>Create</ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
