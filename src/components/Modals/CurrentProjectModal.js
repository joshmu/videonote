import { useState, useEffect } from 'react'
import { useGlobalContext } from '../../context/globalContext'
import LocalVideoForm from '../LocalVideo/LocalVideoForm'
import { motion } from 'framer-motion'
import {
  ModalContainer,
  ModalForm,
  ModalHeader,
  ModalInnerContainer,
  ModalInput,
  ModalPrimaryBtn,
} from './Modal'
import { ToggleInput } from '../shared/Toggle'
import { useNotificationContext } from '../../context/notificationContext'
import Export from '../Export/Export'

export default function CurrentProjectModal({
  toggle: toggleModal,
  motionKey,
}) {
  const { updateProject, project, copyToClipboard } = useGlobalContext()
  const { addAlert } = useNotificationContext()
  const [state, setState] = useState(null)

  useEffect(() => {
    setState(project)
  }, [project])

  const handleUpdate = e => {
    e.preventDefault()
    if (state.title.length === 0 || state.src.length === 0) return
    if (state.title === project.title && state.src === project.src) return

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

  const handleShare = () => {
    // toggle
    const updated = !state.isPrivate
    // create new project state
    const updatedState = { ...state, isPrivate: updated }
    setState(updatedState)
    // as this is important we will send to the server rather than wait for user to update manually
    updateProject(updatedState)
    // if we are sharing
    if (!updated) {
      // auto copy to clipboard
      copyToClipboard()
    }
  }

  const handleShareUrlClick = () => {
    if (state.isPrivate) return
    copyToClipboard()
  }

  return (
    <>
      {state && (
        <ModalContainer toggle={toggleModal} motionKey={motionKey}>
          <ModalHeader>{state.title}</ModalHeader>

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
                title='Video URL'
                placeholder='Dropbox, Youtube, Vimeo...'
                id='src'
                type='text'
                value={state.src}
                onChange={handleChange}
              />

              <LocalVideoForm handleVideoSrc={handleVideoSrc} />

              <div className='relative mt-2'>
                <ToggleInput
                  title={
                    state.isPrivate
                      ? 'Share this project?'
                      : 'Sharing this project!'
                  }
                  state={!state.isPrivate}
                  onClick={handleShare}
                />
                {!state.isPrivate && (
                  <motion.a
                    href={`https://videonote.app/vn/${project._id}`}
                    target='_blank'
                    whileHover={{ scale: 0.95 }}
                    onClick={handleShareUrlClick}
                    className='absolute italic cursor-pointer -bottom-full text-highlight-400'
                  >
                    videonote.app/vn/{project._id}
                  </motion.a>
                )}
              </div>

              <div className='mt-2'>
                <Export />
              </div>

              <ModalPrimaryBtn onClick={handleUpdate}>Update</ModalPrimaryBtn>
            </ModalForm>
          </ModalInnerContainer>
        </ModalContainer>
      )}
    </>
  )
}
