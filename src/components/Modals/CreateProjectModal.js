import { useState } from 'react'
import { useGlobalContext } from '../../context/globalContext'
import LocalVideoLoader from '../LocalVideoLoader'
import {
  ModalContainer,
  ModalInnerContainer,
  ModalForm,
  ModalHeader,
  ModalInput,
  ModalPrimaryBtn,
} from './Modal'

export default function CreateProjectModal({ toggle: toggleModal }) {
  const { updateSettings, createProject } = useGlobalContext()

  const [project, setProject] = useState({
    title: '',
    src: '',
  })
  const [hover, setHover] = useState(false)

  const handleCreate = e => {
    e.preventDefault()
    if (project.title.length === 0 || project.src.length === 0) return

    createProject(project)
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
    <ModalContainer toggle={toggleModal}>
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
            title='Video Source'
            placeholder='Paste URL: Dropbox, Youtube, Vimeo...'
            id='src'
            type='text'
            value={project.src}
            onChange={handleChange}
          />
          <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className='h-10 mx-auto'
          >
            <LocalVideoLoader handleVideoSrc={handleVideoSrc} />
          </div>
          <div className='relative'>
            {hover && (
              <span className='absolute text-xs'>
                Local videos cannot be shared with other users. For the best
                experience use web accessible videos.
              </span>
            )}
          </div>
          <div></div>

          <ModalPrimaryBtn onClick={handleCreate}>Create</ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}
