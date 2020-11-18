import { nanoid } from 'nanoid'
import React, { ReactNode, createContext, useContext, useState } from 'react'

type AddAlertType = (alert: AlertInterface) => string
type RemoveAlertType = (id: string) => void
interface NotificationContextInterface {
  alerts: AlertInterface[]
  addAlert: AddAlertType
  removeAlert: RemoveAlertType
}
interface AlertInterface {
  id?: string
  msg: string
  type?: 'info' | 'warning' | 'error' | 'success'
  duration?: number
  persistent?: boolean
}

const notificationContext = createContext<NotificationContextInterface>(null!)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertInterface[]>([])

  const addAlert: AddAlertType = ({
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

  const removeAlert: RemoveAlertType = id => {
    const updatedAlerts = alerts.filter(alert => alert.id !== id)
    setAlerts(updatedAlerts)
  }

  const value: NotificationContextInterface = {
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

export const useNotificationContext = (): NotificationContextInterface =>
  useContext(notificationContext)
