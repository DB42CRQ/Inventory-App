import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-all text-left">
        <span className="font-semibold text-gray-900">{title}</span>
        <span className="text-gray-400 text-sm">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  )
}

function Step({ number, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center
        justify-center text-xs font-bold shrink-0 mt-0.5">
        {number}
      </span>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  )
}

function Tip({ text }) {
  return (
    <div className="flex items-start gap-2 bg-primary-50 border border-primary-100 rounded-xl px-3 py-2">
      <span className="text-base shrink-0">💡</span>
      <p className="text-xs text-primary-700 leading-relaxed">{text}</p>
    </div>
  )
}

const WIKI_CONTENT = {
  de: [
    {
      title: '🏠 Haushalt einrichten',
      defaultOpen: true,
      content: [
        { type: 'step', n: 1, text: 'Nach der Registrierung wirst du aufgefordert einen Haushalt zu erstellen oder einem beizutreten.' },
        { type: 'step', n: 2, text: 'Erstelle einen neuen Haushalt indem du einen Namen eingibst (z.B. "Wohnung Musterstraße").' },
        { type: 'step', n: 3, text: 'Um einem bestehenden Haushalt beizutreten, gib die Haushalt-ID ein die dir der Inhaber mitteilt.' },
        { type: 'tip', text: 'Du kannst Mitglied mehrerer Haushalte sein und jederzeit wechseln — tippe auf den Haushalt-Namen im Header.' },
      ]
    },
    {
      title: '📦 Artikel verwalten',
      content: [
        { type: 'step', n: 1, text: 'Tippe auf den + Button unten rechts um einen neuen Artikel hinzuzufügen.' },
        { type: 'step', n: 2, text: 'Gib Name, Menge und Einheit ein. Optional: Kategorie und Mindestmenge.' },
        { type: 'step', n: 3, text: 'Die Menge kannst du direkt mit − und + anpassen, oder auf die Zahl tippen um einen genauen Wert einzugeben.' },
        { type: 'step', n: 4, text: 'Zum Bearbeiten tippe auf das ✏️-Symbol. Zum Löschen auf das ×-Symbol.' },
        { type: 'tip', text: 'Artikel mit Mindestmenge werden orange markiert wenn der Bestand zur Neige geht.' },
      ]
    },
    {
      title: '🏷️ Kategorien',
      content: [
        { type: 'step', n: 1, text: 'Tippe auf "Kategorien" neben der Suchleiste um Kategorien zu verwalten.' },
        { type: 'step', n: 2, text: 'Erstelle neue Kategorien mit eigenem Namen, Icon und Farbe.' },
        { type: 'step', n: 3, text: 'Kategorien sind pro Haushalt — jeder Haushalt hat seine eigenen.' },
        { type: 'step', n: 4, text: 'Filtere die Artikelliste nach Kategorie über die Pills unter der Suchleiste.' },
        { type: 'tip', text: 'Der Filter "Niedrig" zeigt alle Artikel bei denen der Bestand unter der Mindestmenge liegt.' },
      ]
    },
    {
      title: '👥 Mitglieder',
      content: [
        { type: 'step', n: 1, text: 'Tippe auf das 👥-Symbol oben rechts um die Mitgliederliste zu sehen.' },
        { type: 'step', n: 2, text: 'Teile die Haushalt-ID mit anderen Personen damit sie beitreten können.' },
        { type: 'step', n: 3, text: 'Als Inhaber kannst du Mitglieder entfernen (× neben dem Namen).' },
        { type: 'tip', text: 'Änderungen von einem Mitglied sind für alle anderen sofort sichtbar — in Echtzeit.' },
      ]
    },
    {
      title: '🔄 Haushalt wechseln',
      content: [
        { type: 'step', n: 1, text: 'Tippe auf den Haushalt-Namen oben links im Header.' },
        { type: 'step', n: 2, text: 'Wähle einen anderen Haushalt aus der Liste.' },
        { type: 'step', n: 3, text: 'Über "+ Neuen Haushalt erstellen oder beitreten" kannst du weitere Haushalte hinzufügen.' },
        { type: 'tip', text: 'Der zuletzt geöffnete Haushalt wird beim nächsten Start automatisch geladen.' },
      ]
    },
    {
      title: '🌐 Sprache',
      content: [
        { type: 'step', n: 1, text: 'Tippe auf ⚙️ oben rechts um die Einstellungen zu öffnen.' },
        { type: 'step', n: 2, text: 'Wähle zwischen 🇩🇪 Deutsch, 🇬🇧 Englisch und 🇵🇪 Spanisch.' },
        { type: 'tip', text: 'Die Spracheinstellung wird pro Gerät gespeichert.' },
      ]
    },
    {
      title: '📲 App installieren',
      content: [
        { type: 'step', n: 1, text: 'Öffne ⚙️ Einstellungen — dort findest du eine Installationsanleitung für dein Gerät.' },
        { type: 'step', n: 2, text: 'iPhone: Öffne inventory42.com in Safari → Teilen → "Zum Home-Bildschirm".' },
        { type: 'step', n: 3, text: 'Android: Öffne in Chrome → Drei Punkte → "Zum Startbildschirm hinzufügen".' },
        { type: 'tip', text: 'Als installierte App startet Inventory42 schneller und fühlt sich wie eine native App an.' },
      ]
    },
    {
      title: '💡 Feedback & Ideen',
      content: [
        { type: 'step', n: 1, text: 'Tippe auf den 💡-Button unten rechts um Feedback zu geben.' },
        { type: 'step', n: 2, text: 'Wähle zwischen "Idee" (neue Funktion) und "Bug" (Fehler melden).' },
        { type: 'step', n: 3, text: 'Über "Meine Vorschläge ansehen" siehst du den Status deiner Einreichungen.' },
        { type: 'tip', text: 'Status: Eingereicht → In Prüfung → In Umsetzung → Deployed (oder Abgelehnt).' },
      ]
    },
    {
      title: '🚀 Versionen & Updates',
      content: [
        { type: 'step', n: 1, text: 'Tippe auf 🚀 oben rechts um die Versionshistorie zu sehen.' },
        { type: 'step', n: 2, text: 'Bei neuen Updates erscheint ein rotes Badge auf dem 🚀-Button.' },
        { type: 'step', n: 3, text: 'Das Update-Banner erscheint automatisch beim nächsten Login nach einem neuen Release.' },
        { type: 'tip', text: 'Bestätige Updates mit "Ich habe die App installiert" damit der Entwickler weiß dass du up to date bist.' },
      ]
    },
  ],
  en: [
    {
      title: '🏠 Setting up a household',
      defaultOpen: true,
      content: [
        { type: 'step', n: 1, text: 'After registration, you\'ll be prompted to create a household or join one.' },
        { type: 'step', n: 2, text: 'Create a new household by entering a name (e.g. "Main Street Apartment").' },
        { type: 'step', n: 3, text: 'To join an existing household, enter the household ID shared by the owner.' },
        { type: 'tip', text: 'You can be a member of multiple households and switch anytime — tap the household name in the header.' },
      ]
    },
    {
      title: '📦 Managing items',
      content: [
        { type: 'step', n: 1, text: 'Tap the + button in the bottom right to add a new item.' },
        { type: 'step', n: 2, text: 'Enter name, quantity and unit. Optionally: category and minimum quantity.' },
        { type: 'step', n: 3, text: 'Adjust quantity directly with − and +, or tap the number to enter an exact value.' },
        { type: 'step', n: 4, text: 'To edit, tap ✏️. To delete, tap ×.' },
        { type: 'tip', text: 'Items with a minimum quantity are highlighted in orange when stock runs low.' },
      ]
    },
    {
      title: '🏷️ Categories',
      content: [
        { type: 'step', n: 1, text: 'Tap "Categories" next to the search bar to manage categories.' },
        { type: 'step', n: 2, text: 'Create new categories with a custom name, icon and color.' },
        { type: 'step', n: 3, text: 'Categories are per household — each household has its own.' },
        { type: 'step', n: 4, text: 'Filter the item list by category using the pills below the search bar.' },
        { type: 'tip', text: 'The "Low" filter shows all items where stock is below the minimum quantity.' },
      ]
    },
    {
      title: '👥 Members',
      content: [
        { type: 'step', n: 1, text: 'Tap the 👥 icon in the top right to see the member list.' },
        { type: 'step', n: 2, text: 'Share the household ID with others so they can join.' },
        { type: 'step', n: 3, text: 'As owner, you can remove members (× next to their name).' },
        { type: 'tip', text: 'Changes by one member are immediately visible to all others — in real time.' },
      ]
    },
    {
      title: '🔄 Switching households',
      content: [
        { type: 'step', n: 1, text: 'Tap the household name in the top left of the header.' },
        { type: 'step', n: 2, text: 'Select a different household from the list.' },
        { type: 'step', n: 3, text: 'Use "+ Create or join a household" to add more households.' },
        { type: 'tip', text: 'The last opened household is automatically loaded on next start.' },
      ]
    },
    {
      title: '🌐 Language',
      content: [
        { type: 'step', n: 1, text: 'Tap ⚙️ in the top right to open settings.' },
        { type: 'step', n: 2, text: 'Choose between 🇩🇪 German, 🇬🇧 English and 🇵🇪 Spanish.' },
        { type: 'tip', text: 'The language setting is saved per device.' },
      ]
    },
    {
      title: '📲 Installing the app',
      content: [
        { type: 'step', n: 1, text: 'Open ⚙️ Settings — you\'ll find installation instructions for your device.' },
        { type: 'step', n: 2, text: 'iPhone: Open inventory42.com in Safari → Share → "Add to Home Screen".' },
        { type: 'step', n: 3, text: 'Android: Open in Chrome → Three dots → "Add to Home Screen".' },
        { type: 'tip', text: 'As an installed app, Inventory42 starts faster and feels like a native app.' },
      ]
    },
    {
      title: '💡 Feedback & Ideas',
      content: [
        { type: 'step', n: 1, text: 'Tap the 💡 button in the bottom right to give feedback.' },
        { type: 'step', n: 2, text: 'Choose between "Idea" (new feature) and "Bug" (report an error).' },
        { type: 'step', n: 3, text: 'Via "View my suggestions" you can see the status of your submissions.' },
        { type: 'tip', text: 'Status: Submitted → Under Review → In Progress → Deployed (or Rejected).' },
      ]
    },
    {
      title: '🚀 Versions & Updates',
      content: [
        { type: 'step', n: 1, text: 'Tap 🚀 in the top right to see the version history.' },
        { type: 'step', n: 2, text: 'A red badge appears on the 🚀 button when there are new updates.' },
        { type: 'step', n: 3, text: 'The update banner appears automatically on next login after a new release.' },
        { type: 'tip', text: 'Confirm updates with "I have installed the app" so the developer knows you\'re up to date.' },
      ]
    },
  ],
  es: [
    {
      title: '🏠 Configurar un hogar',
      defaultOpen: true,
      content: [
        { type: 'step', n: 1, text: 'Tras el registro, se te pedirá que crees un hogar o te unas a uno.' },
        { type: 'step', n: 2, text: 'Crea un nuevo hogar introduciendo un nombre (p.ej. "Apartamento Calle Mayor").' },
        { type: 'step', n: 3, text: 'Para unirte a un hogar existente, introduce el ID de hogar que te comparta el propietario.' },
        { type: 'tip', text: 'Puedes ser miembro de varios hogares y cambiar en cualquier momento — toca el nombre del hogar en el encabezado.' },
      ]
    },
    {
      title: '📦 Gestionar artículos',
      content: [
        { type: 'step', n: 1, text: 'Toca el botón + abajo a la derecha para añadir un nuevo artículo.' },
        { type: 'step', n: 2, text: 'Introduce nombre, cantidad y unidad. Opcionalmente: categoría y cantidad mínima.' },
        { type: 'step', n: 3, text: 'Ajusta la cantidad directamente con − y +, o toca el número para introducir un valor exacto.' },
        { type: 'step', n: 4, text: 'Para editar, toca ✏️. Para eliminar, toca ×.' },
        { type: 'tip', text: 'Los artículos con cantidad mínima se resaltan en naranja cuando el stock es bajo.' },
      ]
    },
    {
      title: '🏷️ Categorías',
      content: [
        { type: 'step', n: 1, text: 'Toca "Categorías" junto a la barra de búsqueda para gestionarlas.' },
        { type: 'step', n: 2, text: 'Crea nuevas categorías con nombre, icono y color personalizados.' },
        { type: 'step', n: 3, text: 'Las categorías son por hogar — cada hogar tiene las suyas.' },
        { type: 'step', n: 4, text: 'Filtra la lista de artículos por categoría usando los botones bajo la barra de búsqueda.' },
        { type: 'tip', text: 'El filtro "Bajo" muestra todos los artículos con stock por debajo de la cantidad mínima.' },
      ]
    },
    {
      title: '👥 Miembros',
      content: [
        { type: 'step', n: 1, text: 'Toca el icono 👥 arriba a la derecha para ver la lista de miembros.' },
        { type: 'step', n: 2, text: 'Comparte el ID del hogar con otros para que puedan unirse.' },
        { type: 'step', n: 3, text: 'Como propietario, puedes eliminar miembros (× junto a su nombre).' },
        { type: 'tip', text: 'Los cambios de un miembro son inmediatamente visibles para todos los demás — en tiempo real.' },
      ]
    },
    {
      title: '🔄 Cambiar de hogar',
      content: [
        { type: 'step', n: 1, text: 'Toca el nombre del hogar arriba a la izquierda en el encabezado.' },
        { type: 'step', n: 2, text: 'Selecciona otro hogar de la lista.' },
        { type: 'step', n: 3, text: 'Usa "+ Crear o unirse a un hogar" para añadir más hogares.' },
        { type: 'tip', text: 'El último hogar abierto se carga automáticamente al siguiente inicio.' },
      ]
    },
    {
      title: '🌐 Idioma',
      content: [
        { type: 'step', n: 1, text: 'Toca ⚙️ arriba a la derecha para abrir ajustes.' },
        { type: 'step', n: 2, text: 'Elige entre 🇩🇪 Alemán, 🇬🇧 Inglés y 🇵🇪 Español.' },
        { type: 'tip', text: 'La configuración de idioma se guarda por dispositivo.' },
      ]
    },
    {
      title: '📲 Instalar la app',
      content: [
        { type: 'step', n: 1, text: 'Abre ⚙️ Ajustes — encontrarás instrucciones de instalación para tu dispositivo.' },
        { type: 'step', n: 2, text: 'iPhone: Abre inventory42.com en Safari → Compartir → "Añadir a inicio".' },
        { type: 'step', n: 3, text: 'Android: Abre en Chrome → Tres puntos → "Añadir a pantalla de inicio".' },
        { type: 'tip', text: 'Como app instalada, Inventory42 arranca más rápido y se siente como una app nativa.' },
      ]
    },
    {
      title: '💡 Comentarios e ideas',
      content: [
        { type: 'step', n: 1, text: 'Toca el botón 💡 abajo a la derecha para dar feedback.' },
        { type: 'step', n: 2, text: 'Elige entre "Idea" (nueva función) y "Error" (reportar un fallo).' },
        { type: 'step', n: 3, text: 'Con "Ver mis sugerencias" puedes ver el estado de tus envíos.' },
        { type: 'tip', text: 'Estado: Enviado → En revisión → En progreso → Implementado (o Rechazado).' },
      ]
    },
    {
      title: '🚀 Versiones y actualizaciones',
      content: [
        { type: 'step', n: 1, text: 'Toca 🚀 arriba a la derecha para ver el historial de versiones.' },
        { type: 'step', n: 2, text: 'Aparece un badge rojo en el botón 🚀 cuando hay nuevas actualizaciones.' },
        { type: 'step', n: 3, text: 'El banner de actualización aparece automáticamente en el próximo inicio de sesión.' },
        { type: 'tip', text: 'Confirma las actualizaciones con "He instalado la app" para que el desarrollador sepa que estás al día.' },
      ]
    },
  ]
}

export default function WikiPage({ onClose }) {
  const { t, lang } = useTranslation()
  const sections = WIKI_CONTENT[lang] ?? WIKI_CONTENT.de

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all
            flex items-center justify-center text-gray-600 text-lg">
          ←
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900 text-lg">
            {t.wikiTitle ?? 'Hilfe & Wiki'}
          </h1>
          <p className="text-xs text-gray-400">Inventory42</p>
        </div>
        <span className="text-2xl">📖</span>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto px-4 py-4 pb-8">
        <p className="text-sm text-gray-500 mb-4">
          {t.wikiIntro ?? 'Hier findest du Erklärungen zu allen Funktionen der App.'}
        </p>
        <div className="flex flex-col gap-2">
          {sections.map((section, i) => (
            <Section key={i} title={section.title} defaultOpen={section.defaultOpen}>
              {section.content.map((item, j) =>
                item.type === 'step'
                  ? <Step key={j} number={item.n} text={item.text} />
                  : <Tip key={j} text={item.text} />
              )}
            </Section>
          ))}
        </div>
      </main>
    </div>
  )
}
