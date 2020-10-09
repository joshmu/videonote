import { TiTickOutline as SuccessIcon } from 'react-icons/ti'
import {
  AiOutlineInfoCircle as InfoIcon,
  AiOutlineWarning as WarningIcon,
} from 'react-icons/ai'
import { VscError as ErrorIcon } from 'react-icons/vsc'

import { AnimatePresence, motion } from 'framer-motion'
import { useNotificationContext } from '../../context/notificationContext'

export default function Notification() {
  const { alerts } = useNotificationContext()

  return (
    <div className='absolute top-0 left-0 z-50 w-full max-w-sm'>
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
              <Alert type={alert.type} msg={alert.msg} />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )
}

const Alert = ({ type, msg }) => (
  <div className='flex w-full max-w-sm mx-auto overflow-hidden border rounded-sm shadow-md bg-themeBg border-themeText2'>
    {type === 'success' && (
      <div className='flex items-center justify-center w-12 bg-green-500'>
        <SuccessIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}
    {type === 'info' && (
      <div className='flex items-center justify-center w-12 bg-blue-500'>
        <InfoIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}
    {type === 'warning' && (
      <div className='flex items-center justify-center w-12 bg-yellow-500'>
        <WarningIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}
    {type === 'error' && (
      <div className='flex items-center justify-center w-12 bg-red-500'>
        <ErrorIcon className='w-6 h-6 text-white fill-current' />
      </div>
    )}

    <div className='px-4 py-2 -mx-3'>
      <div className='mx-3'>
        {type === 'success' && (
          <>
            <span className='font-semibold text-green-500'>Success</span>
            <p className='text-sm text-themeText'>{msg}</p>
          </>
        )}
        {type === 'info' && (
          <>
            <span className='font-semibold text-blue-500'>Info</span>
            <p className='text-sm text-themeText'>{msg}</p>
          </>
        )}
        {type === 'warning' && (
          <>
            <span className='font-semibold text-yellow-500'>Warning</span>
            <p className='text-sm text-themeText'>{msg}</p>
          </>
        )}
        {type === 'error' && (
          <>
            <span className='font-semibold text-red-500'>Error</span>
            <p className='text-sm text-themeText'>{msg}</p>
          </>
        )}
      </div>
    </div>
  </div>
)
