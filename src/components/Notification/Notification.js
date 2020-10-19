import { AnimatePresence, motion } from 'framer-motion'
import {
  AiOutlineInfoCircle as InfoIcon,
  AiOutlineVideoCamera as ProjectIcon,
  AiOutlineCheck as SuccessIcon,
  AiOutlineWarning as WarningIcon,
} from 'react-icons/ai'
import { VscError as ErrorIcon } from 'react-icons/vsc'

import { useNotificationContext } from '@/context/notificationContext'
import CancelBtn from '../shared/CancelBtn/CancelBtn'

export default function Notification() {
  const { alerts, removeAlert } = useNotificationContext()
  const closeAlert = id => {
    removeAlert(id)
  }

  return (
    <div className='absolute top-0 left-0 z-50 w-full max-w-md'>
      <AnimatePresence>
        {alerts.length > 0 &&
          alerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{
                ease: [0.6, 0.05, -0.01, 0.9],
              }}
              className='p-2'
            >
              <Alert
                type={alert.type}
                msg={alert.msg}
                cancel={() => closeAlert(alert.id)}
              />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )
}

const Alert = ({ type, msg, cancel }) => (
  <div className='relative flex w-full max-w-md mx-auto overflow-hidden border rounded-sm shadow-md bg-themeBg border-themeText2'>
    <CancelBtn toggle={cancel} />
    {type === 'project' && (
      <div className='flex items-center justify-center w-12 bg-themeAccent'>
        <ProjectIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}
    {type === 'success' && (
      <div className='flex items-center justify-center w-12 bg-green-400'>
        <SuccessIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}
    {type === 'info' && (
      <div className='flex items-center justify-center w-12 bg-blue-400'>
        <InfoIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}
    {type === 'warning' && (
      <div className='flex items-center justify-center w-12 bg-yellow-400'>
        <WarningIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}
    {type === 'error' && (
      <div className='flex items-center justify-center w-12 bg-red-400'>
        <ErrorIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}

    <div className='px-4 py-2 -mx-3'>
      <div className='mx-3'>
        {type === 'project' && (
          <>
            <span className='font-semibold text-themeAccent'>Project</span>
            <p className='text-sm text-themeText'>{msg}</p>
          </>
        )}
        {type === 'success' && (
          <>
            <span className='font-semibold text-green-400'>Success</span>
            <p className='text-sm text-themeText'>{msg}</p>
          </>
        )}
        {type === 'info' && (
          <>
            <span className='font-semibold text-blue-400'>Info</span>
            <p className='text-sm text-themeText'>{msg}</p>
          </>
        )}
        {type === 'warning' && (
          <>
            <span className='font-semibold text-yellow-400'>Warning</span>
            <p className='text-sm text-themeText'>{msg}</p>
          </>
        )}
        {type === 'error' && (
          <>
            <span className='font-semibold text-red-400'>Error</span>
            <p className='text-sm text-themeText'>{msg}</p>
          </>
        )}
      </div>
    </div>
  </div>
)
