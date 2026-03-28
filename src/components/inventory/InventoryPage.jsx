import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useHousehold } from '../../hooks/useHousehold'
import { useInventory } from '../../hooks/useInventory'
import { useTranslation } from '../../i18n/useTranslation'
import { Spinner, EmptyState, Button, Modal } from '../ui'
import { ItemCard } from './ItemCard'
import { AddItemModal } from './AddItemModal'
import { EditItemModal } from './EditItemModal'
import { CategoryModal } from './CategoryModal'
import { MembersPanel } from '../household/MembersPanel'
import HouseholdSetup from '../household/HouseholdSetup'
import { VersionModal } from '../versions/VersionModal'
import { VersionBanner } from '../versions/VersionBanner'
import { useVersions } from '../../hooks/useVersions'
import { useDeveloper } from '../../hooks/useDeveloper'
import { FeedbackButton } from '../ui/FeedbackButton'
import { InstallSection } from '../ui/InstallBanner'

export default function InventoryPage() {
  const { profile, signOut }                                = useAuth()
  const { household, households, members, switchHousehold } = useHousehold()
  const { t, lang, setLang }                               = useTranslation()
  const {
    items, categories, loading, lowItems,
    addItem, updateQuantity, updateItem, deleteItem,
    addCategory, deleteCategory,
  } = useInventory(household?.id)

  const { isDeveloper } = useDeveloper()
  const { versions, hasNew, newVersion, markAsSeen, createVersion, deleteVersion } = useVersions()

  const [tab,          setTab]          = useState('inventory')
  const [showAdd,      setShowAdd]      = useState(false)
  const [editItem,     setEditItem]     = useState(null)
  const [showCats,     setShowCats]     = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSwitch,   setShowSwitch]   = useState(false)
  const [showNewHh,    setShowNewHh]    = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [dismissed,    setDismissed]    = useState(null) // version id dismissed this session
  const [search,       setSearch]       = useState('')
  const [filterCat,    setFilterCat]    = useState('all')

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCat =
      filterCat === 'all' ? true :
      filterCat === 'low' ? (item.min_quantity > 0 && item.quantity <= item.min_quantity) :
      item.category_id === filterCat
    return matchSearch && matchCat
  })

  const grouped = categories.reduce((acc, cat) => {
    const catItems = filtered.filter(i => i.category_id === cat.id)
    if (catItems.length) acc.push({ cat, items: catItems })
    return acc
  }, [])
  const uncategorized = filtered.filter(i => !i.category_id)

  function handleSwitchHousehold(id) {
    setShowSwitch(false); setFilterCat('all'); setSearch('')
    switchHousehold(id)
  }

  const TABS = [
    { id: 'inventory', label: '📦', title: t.inventory },
    { id: 'members',   label: '👥', title: t.members },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <button onClick={() => setShowSwitch(true)}
              className="flex items-center gap-1.5 hover:text-primary-600 transition-colors text-left">
              <h1 className="font-bold text-gray-900 text-lg leading-tight truncate">{household?.name}</h1>
              <span className="text-gray-400 text-sm shrink-0">▾</span>
            </button>
            <p className="text-xs text-gray-400">{profile?.display_name}</p>
          </div>

          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {TABS.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className={`w-9 h-8 rounded-lg text-base transition-all
                  ${tab === tb.id ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title={tb.title}>
                {tb.label}
              </button>
            ))}
          </div>

          <button onClick={() => setShowVersions(true)}
            className="relative w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center">
            🚀
            {hasNew && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full
                flex items-center justify-center text-white text-[9px] font-bold">
                N
              </span>
            )}
          </button>

          <button onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center">
            ⚙️
          </button>
        </div>

        {tab === 'inventory' && (
          <>
            <div className="px-4 pb-2 max-w-2xl mx-auto flex gap-2">
              <input type="search" placeholder={t.searchPlaceholder} value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button onClick={() => setShowCats(true)}
                className="shrink-0 px-3 py-2 rounded-xl border border-gray-200 bg-white
                  text-sm text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1.5">
                🏷️ <span className="hidden sm:inline">{t.categories}</span>
              </button>
            </div>
            <div className="px-4 pb-3 max-w-2xl mx-auto flex gap-2 overflow-x-auto">
              {[
                { id: 'all', name: t.all, color: '#6366f1', icon: '' },
                ...(lowItems.length ? [{ id: 'low', name: t.low, color: '#f97316', icon: '⚠️' }] : []),
                ...categories,
              ].map(c => (
                <button key={c.id} onClick={() => setFilterCat(c.id)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium
                    transition-all border whitespace-nowrap
                    ${filterCat === c.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                  style={filterCat === c.id ? { backgroundColor: c.color } : {}}>
                  {c.icon && <span>{c.icon}</span>}
                  {c.name}
                </button>
              ))}
            </div>
          </>
        )}
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-28">
        {tab === 'inventory' && (
          loading ? <Spinner /> :
          filtered.length === 0 ? (
            <EmptyState icon="📦"
              title={search ? t.noItemsFound : t.noItems}
              description={search ? t.noItemsFoundDesc : t.noItemsDesc}
              action={!search && <Button onClick={() => setShowAdd(true)}>{t.addItem}</Button>}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {grouped.map(({ cat, items: catItems }) => (
                <section key={cat.id}>
                  <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                    {cat.icon && <span>{cat.icon}</span>}
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                    <span className="font-normal text-gray-400">({catItems.length})</span>
                  </h2>
                  <div className="flex flex-col gap-2">
                    {catItems.map(item => (
                      <ItemCard key={item.id} item={item} category={catMap[item.category_id]}
                        onUpdateQty={updateQuantity} onDelete={deleteItem} onEdit={setEditItem} />
                    ))}
                  </div>
                </section>
              ))}
              {uncategorized.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    {t.withoutCategory}
                    <span className="font-normal text-gray-400">({uncategorized.length})</span>
                  </h2>
                  <div className="flex flex-col gap-2">
                    {uncategorized.map(item => (
                      <ItemCard key={item.id} item={item} category={null}
                        onUpdateQty={updateQuantity} onDelete={deleteItem} onEdit={setEditItem} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )
        )}
        {tab === 'members' && <MembersPanel household={household} members={members} />}
      </main>

      {tab === 'inventory' && (
        <div className="fixed bottom-6 right-4 left-4 max-w-2xl mx-auto flex justify-end pointer-events-none">
          <button onClick={() => setShowAdd(true)}
            className="pointer-events-auto w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white
              rounded-2xl shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-105 active:scale-95">
            +
          </button>
        </div>
      )}

      {/* Haushalt wechseln */}
      <Modal open={showSwitch} onClose={() => setShowSwitch(false)} title={t.switchHousehold}>
        <div className="flex flex-col gap-2">
          {households.map(hh => (
            <button key={hh.id} onClick={() => handleSwitchHousehold(hh.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                ${hh.id === household?.id ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0
                ${hh.id === household?.id ? 'bg-primary-100' : 'bg-gray-100'}`}>🏠</div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${hh.id === household?.id ? 'text-primary-700' : 'text-gray-900'}`}>
                  {hh.name}
                </p>
                <p className="text-xs text-gray-400">{hh.role === 'owner' ? t.roleOwner : t.roleMember}</p>
              </div>
              {hh.id === household?.id && <span className="text-primary-500 shrink-0">✓</span>}
            </button>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <button onClick={() => { setShowSwitch(false); setShowNewHh(true) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed
                border-gray-200 text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600
                hover:bg-primary-50 transition-all">
              {t.addHousehold}
            </button>
          </div>
        </div>
      </Modal>

      {/* Neuer Haushalt */}
      <Modal open={showNewHh} onClose={() => setShowNewHh(false)} title={t.addHouseholdTitle}>
        <HouseholdSetup asModal />
      </Modal>

      {/* Einstellungen */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title={t.settings}>
        <div className="flex flex-col gap-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm font-medium text-gray-800 mb-1">{household?.name}</p>
            <p className="text-xs text-gray-400 break-all">{household?.id}</p>
          </div>
          {/* Sprache */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{t.language}</p>
            <div className="flex gap-2">
              {['de', 'en', 'es'].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border
                    ${lang === l ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  {l === 'de' ? '🇩🇪 DE' : l === 'en' ? '🇬🇧 EN' : '🇵🇪 ES'}
                </button>
              ))}
            </div>
          </div>
          <InstallSection />
          <Button variant="danger" onClick={signOut} className="w-full">{t.signOutBtn}</Button>
        </div>
      </Modal>

      <FeedbackButton />

      {newVersion && dismissed !== newVersion.id && (
        <VersionBanner
          version={newVersion}
          onDismiss={(id, installed) => { markAsSeen(id, installed); setDismissed(id) }}
          onSkip={() => setDismissed(newVersion.id)}
        />
      )}

      <VersionModal
        open={showVersions}
        onClose={() => setShowVersions(false)}
        versions={versions}
        isDeveloper={isDeveloper}
        markAsSeen={() => newVersion && markAsSeen(newVersion.id)}
        createVersion={createVersion}
        deleteVersion={deleteVersion}
      />

      <AddItemModal open={showAdd} onClose={() => setShowAdd(false)} categories={categories} onAdd={addItem} />
      <EditItemModal open={!!editItem} onClose={() => setEditItem(null)} item={editItem} categories={categories} onSave={updateItem} />
      <CategoryModal open={showCats} onClose={() => setShowCats(false)} categories={categories} onAdd={addCategory} onDelete={deleteCategory} />
    </div>
  )
}
