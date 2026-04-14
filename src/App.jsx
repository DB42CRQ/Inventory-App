import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useHousehold } from './hooks/useHousehold'
import AuthPage from './components/auth/AuthPage'
import ResetPasswordPage from './components/auth/ResetPasswordPage'
import HouseholdSetup from './components/household/HouseholdSetup'
import InventoryPage from './components/inventory/InventoryPage'
import { Spinner } from './components/ui'
import { lazy, Suspense } from 'react'
const RecipeSharePage = lazy(() => import('./components/recipes/RecipeSharePage'))

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { household, loading: hhLoading } = useHousehold()
  const [isReset, setIsReset] = useState(false)

  const [shareToken, setShareToken] = useState(() => {
    const match = window.location.pathname.match(/^\/recipe\/([\w-]+)$/)
    return match ? match[1] : null
  })

  useEffect(() => {
    if (window.location.pathname === '/reset-password') {
      setIsReset(true)
    }
  }, [])

  if (shareToken) {
    return (
      <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <RecipeSharePage token={shareToken} onClose={() => {
          setShareToken(null)
          window.history.replaceState({}, '', '/')
        }} />
      </Suspense>
    )
  }

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
