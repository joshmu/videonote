import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import ModalPrimaryBtn from '@/components/shared/Modal/ModalBtn'
import { ToggleInput } from '@/components/shared/Toggle/Toggle'
import { useGlobalContext } from '@/context/globalContext'
import { useNotificationContext } from '@/context/notificationContext'
import ModalContainer from '@/shared/Modal/ModalContainer'
import ModalForm from '@/shared/Modal/ModalForm'
import ModalHeader from '@/shared/Modal/ModalHeader'
import ModalInnerContainer from '@/shared/Modal/ModalInnerContainer'
import ModalInput from '@/shared/Modal/ModalInput'

// todo: remove bad characters from url path entry
const formatUrl = txt => txt.replace(' ', '-')

const ShareProjectModal = ({ toggle: toggleModal, motionKey }) => {
  const {
    updateProject,
    project,
    copyToClipboard,
    shareProject,
    removeShareProject,
  } = useGlobalContext()
  const { addAlert } = useNotificationContext()
  const defaults = {
    url: `${formatUrl(project.title)}`,
    password: '',
    canEdit: true,
  }
  const initialState = project.share ? { ...project.share } : defaults
  const [state, setState] = useState(initialState)

  // update state if project.share state is updated
  useEffect(() => {
    if (project.share) setState({ ...project.share })
  }, [project])

  const handleSubmit = async e => {
    e.preventDefault()

    if (state.url.length === 0)
      return addAlert({
        type: 'error',
        msg: 'Unique Share Url required.',
      })

    const shareData = { ...state }
    // if password hasn't been altered then don't provide it as we currently have a hashed version
    if (shareData.password === project.share.password) delete shareData.password

    const apiSuccess = await shareProject(state)
    if (apiSuccess) {
      addAlert({ type: 'success', msg: 'Shared project updated.' })
      copyToClipboard(`https://videonote.app/vn/${state.url}`)
    } else {
      addAlert({ type: 'error', msg: 'An error occurred...' })
    }
  }
  const handleRemoveShare = async e => {
    e.preventDefault()
    const apiSuccess = await removeShareProject()

    if (apiSuccess) {
      addAlert({ type: 'success', msg: 'Project is now private.' })
      toggleModal()
    } else {
      addAlert({ type: 'error', msg: 'An error occurred...' })
    }
  }

  const handleChange = e => {
    let data = {}
    if (e.target.id === 'url') {
      data.url = formatUrl(e.target.value)
    } else {
      data[e.target.id] = e.target.value
    }

    const updatedState = { ...state, ...data }
    setState(updatedState)
  }
  const handleCanEditToggle = () => {
    setState(current => {
      const updatedState = { ...current, canEdit: !state.canEdit }
      return updatedState
    })
  }

  return (
    <ModalContainer toggle={toggleModal} motionKey={motionKey}>
      <ModalHeader>Share Project - {project.title}</ModalHeader>

      <ModalInnerContainer>
        <ModalForm>
          <ModalInput
            title={`Unique share url link`}
            placeholder='Your-unique-link'
            id='url'
            type='text'
            value={state.url}
            onChange={handleChange}
          />
          <ModalInput
            title='Password protect?'
            placeholder='Empty for no password'
            id='password'
            type='password'
            value={state.password}
            onChange={handleChange}
          />

          <div className='relative mt-2'>
            <ToggleInput
              title={`Users can edit notes${state.canEdit ? '.' : '?'}`}
              state={state.canEdit}
              onClick={handleCanEditToggle}
            />
          </div>

          {project.share && (
            <>
              <div>
                <p>Your project link is:</p>
                <motion.a
                  href={`https://videonote.app/vn/${project.share.url}`}
                  target='_blank'
                  whileHover={{ scale: 0.95 }}
                  onClick={() =>
                    copyToClipboard(
                      `https://videonote.app/vn/${project.share.url}`
                    )
                  }
                  className='italic cursor-pointer top-8 text-themeAccent'
                >
                  videonote.app/vn/{project.share.url}
                </motion.a>
              </div>
            </>
          )}

          {project.share && (
            <div className='flex items-center'>
              <ModalPrimaryBtn
                handleClick={handleRemoveShare}
                type='button'
                color='bg-red-400'
              >
                <span className='italic'>Remove Share Access</span>
              </ModalPrimaryBtn>
            </div>
          )}

          <ModalPrimaryBtn handleClick={handleSubmit}>
            {project.share ? 'Update' : 'Share'}
          </ModalPrimaryBtn>
        </ModalForm>
      </ModalInnerContainer>
    </ModalContainer>
  )
}

export default ShareProjectModal
