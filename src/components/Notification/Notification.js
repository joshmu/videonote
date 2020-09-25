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
    <div
      className='absolute top-0 right-0 w-full sm:m-4 sm:w-1/2 md:w-1/3 lg:w-1/4'
      style={{ zIndex: 99 }}
    >
      <AnimatePresence exitBeforeEnter>
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
              style={{ zIndex: 99 }}
              className={`w-full 
              ${alert.type === 'success' && ' bg-green-700 text-green-200 '} 
              ${alert.type === 'info' && ' bg-blue-700 text-blue-200 '} 
              ${alert.type === 'warning' && ' bg-orange-600 text-orange-200 '} 
              ${alert.type === 'error' && ' bg-red-700 text-red-200 '} 
                px-4 py-3 rounded-sm mb-2 shadow`}
            >
              <p>
                <span className='inline-block h-4 text-xl'>
                  {alert.type === 'success' && <SuccessIcon />}
                  {alert.type === 'info' && <InfoIcon />}
                  {alert.type === 'warning' && <WarningIcon />}
                  {alert.type === 'error' && <ErrorIcon />}
                </span>{' '}
                {alert.msg}
              </p>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )
}
