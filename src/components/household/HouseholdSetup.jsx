import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useHousehold } from '../../hooks/useHousehold'
import { useTranslation } from '../../i18n/useTranslation'
import { Button, Input, Card } from '../ui'

export default function HouseholdSetup({ asModal = false }) {
  const { profile, signOut } = useAuth()
  const { createHousehold, joinHousehold } = useHousehold()
  const { t } = useTranslation()

  const [tab,     setTab]     = useState('create')
  const [name,    setName]    = useState('')
  const [joinId,  setJoinId]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true); setError('')
    const { error } = await createHousehold(name.trim())
    if (error) { setError(error.message); setLoading(false) }
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (!joinId.trim()) return
    setLoading(true); setError('')
    const { error } = await joinHousehold(joinId.trim())
    if (error) { setError(t.householdNotFound); setLoading(false) }
  }

  const inner = (
    <>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {[
          { key: 'create', label: t.createNew },
          { key: 'join',   label: t.join },
        ].map(tab_ => (
          <button key={tab_.key} onClick={() => { setTab(tab_.key); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === tab_.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab_.label}
          </button>
        ))}
      </div>

      {tab === 'create' ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label={t.householdName} placeholder={t.householdNamePlaceholder}
            value={name} onChange={e => setName(e.target.value)} required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? t.creating : t.createHousehold}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <Input label={t.householdId} placeholder={t.householdIdPlaceholder}
            value={joinId} onChange={e => setJoinId(e.target.value)} required />
          <p className="text-xs text-gray-500">{t.householdIdHint}</p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? t.joining : t.joinBtn}
          </Button>
        </form>
      )}
    </>
  )

  if (asModal) return inner

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-gray-600">{t.welcome}, <strong>{profile?.display_name}</strong>!</p>
          <h2 className="text-xl font-bold text-gray-900 mt-1">{t.setupHousehold}</h2>
        </div>
        <Card className="p-6">{inner}</Card>
        <button onClick={signOut} className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600">
          {t.signOut}
        </button>
      </div>
    </div>
  )
}
