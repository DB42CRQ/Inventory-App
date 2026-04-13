import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from '../../i18n/useTranslation'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui'

export function MembersPanel({ household, members }) {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const [copied,  setCopied]  = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [loading, setLoading] = useState(false)

  const isOwner = household?.role === 'owner'

  function handleCopy() {
    navigator.clipboard.writeText(household.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function removeMember(profileId) {
    setLoading(true)
    await supabase.from('household_members').delete()
      .eq('household_id', household.id).eq('profile_id', profileId)
    setConfirm(null)
    setLoading(false)
    window.location.reload()
  }

  const ROLE_LABEL = { owner: t.roleOwner, member: t.roleMember }
  const ROLE_COLOR = { owner: '#6366f1', member: '#64748b' }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {t.membersTitle} ({members.length})
        </p>
        <div className="flex flex-col gap-2">
          {members.map(m => (
            <div key={m.id}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-3 py-2.5">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center
                text-primary-600 font-semibold text-sm shrink-0">
                {m.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {m.display_name}
                  {m.id === profile?.id && (
                    <span className="ml-1 text-xs text-gray-400">({t.you})</span>
                  )}
                </p>
                {m.email && <p className="text-xs text-gray-400 truncate">{m.email}</p>}
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                style={{ backgroundColor: ROLE_COLOR[m.role] + '22', color: ROLE_COLOR[m.role] }}>
                {ROLE_LABEL[m.role]}
              </span>
              {isOwner && m.id !== profile?.id && m.role !== 'owner' && (
                confirm === m.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => removeMember(m.id)} disabled={loading}
                      className="text-xs text-red-500 font-medium hover:text-red-700">
                      {t.remove}
                    </button>
                    <button onClick={() => setConfirm(null)}
                      className="text-xs text-gray-400 hover:text-gray-600">
                      {t.abort}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirm(m.id)}
                    className="w-7 h-7 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50
                      transition-all flex items-center justify-center text-lg leading-none shrink-0">
                    ×
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {t.inviteMember}
        </p>
        <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2">
          <p className="text-xs text-gray-500">{t.inviteHint}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-2
              text-gray-700 break-all select-all">
              {household?.id}
            </code>
            <Button variant="secondary" size="sm" onClick={handleCopy} className="shrink-0">
              {copied ? t.copied : t.copy}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
