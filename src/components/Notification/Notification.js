import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNotificationContext } from '../../context/notificationContext'

export default function Notification() {
  const { alerts, TYPES } = useNotificationContext()

  return (
    <div
      className='absolute top-0 right-0 w-full sm:m-4 sm:w-1/2 md:w-1/3 lg:w-1/4'
      style={{ zIndex: 99 }}
    >
      <AnimatePresence exitBeforeEnter>
        {alerts.length > 0 &&
          alerts.map((alert, idx) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{
                ease: [0.6, 0.05, -0.01, 0.9],
              }}
              style={{ zIndex: 99 }}
              className={`w-full ${
                TYPES[alert.type].style
              } px-4 py-3 rounded-sm mb-2 shadow`}
            >
              <p>
                <span className='inline-block h-4 text-xl'>
                  {TYPES[alert.type].icon()}
                </span>{' '}
                {alert.msg}
              </p>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )
}
