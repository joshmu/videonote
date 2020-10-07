import { useState, useEffect } from 'react'
import { useGlobalContext } from '../../context/globalContext'
import LocalVideoLoader from '../LocalVideoLoader'
import {
  ModalContainer,
  ModalForm,
  ModalHeader,
  ModalInnerContainer,
  ModalInput,
  ModalPrimaryBtn,
} from './Modal'

export default function CurrentProjectModal({ toggle: toggleModal }) {
  const { updateSettings, updateProject, project } = useGlobalContext()
  const [state, setState] = useState(null)

  useEffect(() => {
    setState(project)
  }, [project])

  const handleUpdate = e => {
    e.preventDefault()
    if (state.title.length === 0 || state.src.length === 0) return

    updateProject(state)
    toggleModal()
  }

  const handleChange = e => {
    const updated = { ...state, [e.target.id]: e.target.value }
    setState(updated)
  }

  const handleVideoSrc = url => {
    console.log(url)
    if (typeof url !== 'string' || url.length === 0) return
    const updated = { ...state, src: url }
    setState(updated)
  }

  return (
    <>
      {state && (
        <ModalContainer toggle={toggleModal}>
          <ModalHeader>Project: {state.title}</ModalHeader>

          <ModalInnerContainer>
            <ModalForm>
              <ModalInput
                title='Project Title'
                id='title'
                type='text'
                value={state.title}
                onChange={handleChange}
              />

              <ModalInput
                title='Video Source'
                placeholder='Paste URL: Dropbox, Youtube, Vimeo...'
                id='src'
                type='text'
                value={state.src}
                onChange={handleChange}
              />
              <LocalVideoLoader handleVideoSrc={handleVideoSrc} />

              <ModalPrimaryBtn onClick={handleUpdate}>Update</ModalPrimaryBtn>
            </ModalForm>
          </ModalInnerContainer>
        </ModalContainer>
      )}
    </>
  )
}
