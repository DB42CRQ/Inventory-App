import { useAuth } from './hooks/useAuth'
import { useHousehold } from './hooks/useHousehold'
import AuthPage from './components/auth/AuthPage'
import HouseholdSetup from './components/household/HouseholdSetup'
import InventoryPage from './components/inventory/InventoryPage'
import { Spinner } from './components/ui'

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { household, loading: hhLoading } = useHousehold()

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
