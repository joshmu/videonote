import React, { createContext, useContext, useState, useRef } from 'react'
const notificationContext = createContext({
  alerts: [],
  addAlert: ({}) => {},
  removeAlert: id => {},
})

export const NotificationProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([])
  // utilise useRef to avoid the setTimeout closure
  // @see https://github.com/facebook/react/issues/14010
  const alertsRef = useRef(alerts)
  alertsRef.current = alerts

  const addAlert = ({
    msg,
    type = 'info',
    duration = 8000,
    persistent = false,
  }) => {
    const id = Date.now()
    const newAlert = {
      msg,
      type,
      id,
    }
    setAlerts([...alertsRef.current, newAlert])

    // if we won't close manually then use timer
    if (!persistent) {
      setTimeout(() => {
        setAlerts(alertsRef.current.filter(alert => alert.id !== newAlert.id))
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
