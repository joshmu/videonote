import { useState } from 'react'

import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalForm from '@/shared/Modal/ModalForm'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'
import ModalInput from '@/shared/Modal/ModalInput'
import ModalPrimaryBtn from '@/shared/Modal/ModalPrimaryBtn'

import LocalVideoForm from '../../shared/LocalVideoForm/LocalVideoForm'

export default function CreateProjectModal({ toggle: toggleModal, motionKey }) {
  const { updateSettings, createProject } = useGlobalContext()
  const { addAlert } = useNotificationContext()

  const [project, setProject] = useState({
    title: '',
    src: '',
  })

  const handleCreate = async e => {
    const title = project.title.trim()
    const videoSrc = project.src.trim()

    e.preventDefault()
    if (title.length === 0 || videoSrc.length === 0) {
      if (title.length === 0)
        addAlert({
          type: 'error',
          msg: 'Project title required.',
          duration: 1000,
        })
      if (videoSrc.length === 0)
        addAlert({
          type: 'error',
          msg: 'Video source required.',
          duration: 1000,
        })
      return
    }

    const newProject = { title, src: videoSrc }
    await createProject(newProject)
    toggleModal()
  }

  const handleChange = e => {
    setProject({ ...project, [e.target.id]: e.target.value })
  }

  const handleVideoSrc = url => {
    console.log(url)
    if (typeof url !== 'string' || url.length === 0) return
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
          <ModalPrimaryBtn onClick={handleCreate}>Create</ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
