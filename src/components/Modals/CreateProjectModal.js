import { useState } from 'react'
import { useGlobalContext } from '../../context/globalContext'
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

  const [project, setProject] = useState({
    title: '',
    src: '',
  })
  const [hover, setHover] = useState(false)

  const handleCreate = async e => {
    e.preventDefault()
    if (project.title.length === 0 || project.src.length === 0) return

    await createProject(project)
    toggleModal()
  }

  const handleChange = e => {
    if (e.target.id === 'offset') {
      updateSettings({ playOffset: Number(e.target.value) })
      return
    }
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
