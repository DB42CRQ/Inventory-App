import { useFeedback } from '../../hooks/useFeedback'
import { useDeveloper } from '../../hooks/useDeveloper'
import { useTranslation } from '../../i18n/useTranslation'
import { Spinner } from '../ui'

const STATUSES = ['submitted', 'reviewing', 'implementing', 'deployed', 'rejected']

const STATUS_COLORS = {
  submitted:    { bg: '#e0e7ff', text: '#4338ca' },
  reviewing:    { bg: '#fef9c3', text: '#854d0e' },
  implementing: { bg: '#dbeafe', text: '#1d4ed8' },
  deployed:     { bg: '#dcfce7', text: '#166534' },
  rejected:     { bg: '#fee2e2', text: '#991b1b' },
}

export default function FeedbackPage({ onClose }) {
  const { t } = useTranslation()
  const { isDeveloper } = useDeveloper()
  const { feedback, loading, updateStatus } = useFeedback(isDeveloper)

  const STATUS_LABELS = {
    submitted:    t.statusSubmitted    ?? 'Eingereicht',
    reviewing:    t.statusReviewing    ?? 'In Prüfung',
    implementing: t.statusImplementing ?? 'In Umsetzung',
    deployed:     t.statusDeployed     ?? 'Deployed',
    rejected:     t.statusRejected     ?? 'Abgelehnt',
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all
            flex items-center justify-center text-gray-600 text-lg">
          ←
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">{t.feedbackTitle}</h1>
        {isDeveloper && (
          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-lg font-medium">
            Developer
          </span>
        )}
      </header>

      <main className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto px-4 py-4">
        {loading ? <Spinner /> : feedback.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">💡</div>
            <p className="font-semibold text-gray-900">{t.feedbackEmpty ?? 'Noch keine Vorschläge'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {feedback.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    {isDeveloper && (
                      <p className="text-xs text-gray-400 mb-1">
                        {item.profiles?.display_name} · {item.profiles?.email}
                      </p>
                    )}
                    <p className="text-sm text-gray-900">{item.message}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[item.status]?.bg, color: STATUS_COLORS[item.status]?.text }}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>

                <p className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString('de-DE', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>

                {isDeveloper && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => updateStatus(item.id, s)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all border
                          ${item.status === s
                            ? 'text-white border-transparent'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                        style={item.status === s ? { backgroundColor: STATUS_COLORS[s]?.text } : {}}>
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
