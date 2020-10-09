import { useState } from 'react'
import { useGlobalContext } from '../../context/globalContext'
import { useNotificationContext } from '../../context/notificationContext'
import LocalVideoForm from '../LocalVideo/LocalVideoForm'
import {
  ModalContainer,
  ModalInnerContainer,
  ModalForm,
  ModalHeader,
  ModalInput,
  ModalPrimaryBtn,
} from './Modal'

export default function CreateProjectModal({ toggle: toggleModal, motionKey }) {
  const { updateSettings, createProject } = useGlobalContext()
  const { addAlert } = useNotificationContext()

  const [project, setProject] = useState({
    title: '',
    src: '',
  })
  const [hover, setHover] = useState(false)

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

    const newProject = {title, src: videoSrc}
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
      <ModalHeader>Create Project</ModalHeader>

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
