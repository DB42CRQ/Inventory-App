import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useHousehold } from './hooks/useHousehold'
import AuthPage from './components/auth/AuthPage'
import ResetPasswordPage from './components/auth/ResetPasswordPage'
import HouseholdSetup from './components/household/HouseholdSetup'
import InventoryPage from './components/inventory/InventoryPage'
import { Spinner } from './components/ui'

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { household, loading: hhLoading } = useHousehold()
  const [isReset, setIsReset] = useState(false)

  useEffect(() => {
    // Prüfen ob wir auf der Reset-Seite sind
    if (window.location.pathname === '/reset-password') {
      setIsReset(true)
    }
  }, [])

  if (isReset) {
    return <ResetPasswordPage onDone={() => {
      setIsReset(false)
      window.history.replaceState({}, '', '/')
    }} />
  }

  if (authLoading || (user && hhLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user)       return <AuthPage />
  if (!household)  return <HouseholdSetup />
  return <InventoryPage />
}
