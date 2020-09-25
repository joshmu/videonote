import React, { createContext, useContext, useState, useRef } from 'react'
import { TiTickOutline as SuccessIcon } from 'react-icons/ti'
import {
  AiOutlineInfoCircle as InfoIcon,
  AiOutlineWarning as WarningIcon,
} from 'react-icons/ai'
import { VscError as ErrorIcon } from 'react-icons/vsc'

const notificationContext = createContext({
  alerts: [],
  TYPES: {},
  addAlert: ({}) => {},
  removeAlert: id => {},
})

const TYPES = {
  success: {
    style: 'bg-green-700 text-green-200',
    icon: () => <SuccessIcon />,
  },
  info: {
    style: 'bg-blue-700 text-blue-200',
    icon: () => <InfoIcon />,
  },
  warning: {
    style: 'bg-orange-600 text-orange-200',
    icon: () => <WarningIcon />,
  },
  error: {
    style: 'bg-red-700 text-red-200',
    icon: () => <ErrorIcon />,
  },
}

export const NotificationProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([])
  // utilise useRef to avoid the setTimeout closure
  // @see https://github.com/facebook/react/issues/14010
  const alertsRef = useRef(alerts)
  alertsRef.current = alerts

  const addAlert = ({
    msg,
    type = 'info',
    duration = 4000,
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
    TYPES,
  }

  return (
    <notificationContext.Provider value={value}>
      {children}
    </notificationContext.Provider>
  )
}

export const useNotificationContext = () => useContext(notificationContext)
