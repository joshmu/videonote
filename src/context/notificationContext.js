import { nanoid } from 'nanoid'
import React, { createContext, useContext, useState } from 'react'

const notificationContext = createContext({
  alerts: [],
  addAlert: ({}) => {},
  removeAlert: id => {},
})

export const NotificationProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([])

  const addAlert = ({
    msg,
    type = 'info',
    duration = 8000,
    persistent = false,
  }) => {
    const id = nanoid(12)
    const newAlert = {
      msg,
      type,
      id,
    }

    // don't add if duplicate message
    if (alerts.some(alert => alert.msg === newAlert.msg)) {
      console.log('duplicate alert:', newAlert.msg)
      return
    }

    setAlerts(currentAlerts => [...currentAlerts, newAlert])

    // if we won't close manually then use timer
    if (!persistent) {
      setTimeout(() => {
        setAlerts(currentAlerts =>
          currentAlerts.filter(alert => alert.id !== newAlert.id)
        )
      }, duration)
    }

    return id
  }

  const removeAlert = id => {
    const updatedAlerts = alerts.filter(alert => alert.id !== id)
    setAlerts(updatedAlerts)
  }

  const value = {
    alerts,
    addAlert,
    removeAlert,
  }

  return (
    <notificationContext.Provider value={value}>
      {children}
    </notificationContext.Provider>
  )
}

export const useNotificationContext = () => useContext(notificationContext)
