import { useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

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
        { type: 'step', n: 4, text: 'Tippe auf ✏️ um einen Artikel zu bearbeiten. Im Bearbeitungsfenster kannst du ihn unten auch löschen — mit Rückfrage.' },
        { type: 'tip', text: 'Artikel mit Mindestmenge werden orange markiert wenn der Bestand zur Neige geht.' },
      ]
    },
    {
      title: '🏷️ Kategorien',
      content: [
        { type: 'step', n: 1, text: 'Tippe auf "Kategorien" neben der Suchleiste um Kategorien zu verwalten.' },
        { type: 'step', n: 2, text: 'Erstelle neue Kategorien mit eigenem Namen, Icon und Farbe.' },
        { type: 'step', n: 3, text: 'Tippe auf ✏️ neben einer Kategorie um sie zu bearbeiten oder zu löschen.' },
        { type: 'step', n: 4, text: 'Filtere die Artikelliste nach Kategorie über die Pills unter der Suchleiste.' },
        { type: 'tip', text: 'Der Filter "Niedrig" zeigt alle Artikel bei denen der Bestand unter der Mindestmenge liegt.' },
        { type: 'tip', text: 'Kategorienamen werden beim Anlegen automatisch in alle drei Sprachen übersetzt.' },
      ]
    },
    {
      title: '🛒 Einkaufsliste',
      content: [
        { type: 'step', n: 1, text: 'Tippe auf das 🛒-Symbol oben rechts um die Einkaufsliste zu öffnen.' },
        { type: 'step', n: 2, text: 'Mit "⚠️ Alle niedrigen" werden alle Artikel mit niedrigem Bestand auf einmal hinzugefügt. Mit dem Dropdown darunter nur eine bestimmte Kategorie.' },
        { type: 'step', n: 3, text: 'Mit "+ Aus Inventar" kannst du Artikel suchen und hinzufügen. Wenn ein Artikel nicht im Inventar ist, erscheint ein grüner "+ Hinzufügen" Button — damit landet er direkt auf der Liste.' },
        { type: 'step', n: 4, text: 'Tippe einen Artikel an um ihn abzuhaken — gib die gekaufte Menge ein und bestätige. Der Bestand im Inventar wird sofort aktualisiert.' },
        { type: 'step', n: 5, text: 'Bei Einmalkäufen wird nach dem Abhaken gefragt ob der Artikel dauerhaft ins Inventar aufgenommen werden soll.' },
        { type: 'step', n: 6, text: 'Abgehakte Artikel erscheinen durchgestrichen unten. Mit "🗑 Leeren" kannst du erledigte oder alle Artikel löschen.' },
        { type: 'tip', text: 'Die Einkaufsliste ist für alle Haushaltsmitglieder geteilt — Änderungen sind in Echtzeit sichtbar.' },
        { type: 'tip-ios', text: 'Mit dem 📷 Button kannst du ein Foto eines Produkts aufnehmen — die KI erkennt es automatisch und sucht den passenden Artikel im Inventar.' },
        { type: 'tip-android', text: 'Mit dem 📷 Button öffnet sich der Scanner. Wähle zwischen Barcode scannen (EAN-Code) für schnelle Erkennung oder KI-Produkterkennung (Foto) für unbekannte Produkte.' }, es und sucht den passenden Artikel.' },
        { type: 'tip', text: 'Wird ein Artikel nicht erkannt, kannst du ihn direkt als Einmalkauf hinzufügen.' },
      ]
    },
    {
      title: '👥 Mitglieder',
      content: [
        { type: 'step', n: 1, text: 'Tippe auf ⚙️ oben rechts und dann auf "Mitglieder".' },
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
        { type: 'step', n: 1, text: 'Öffne ⚙️ Einstellungen — dort findest du eine smarte Installationsanleitung die deinen Browser erkennt.' },
        { type: 'tip-ios', text: 'Tippe auf das Teilen-Symbol ⬆️ in Safari → "Zum Home-Bildschirm" → "Hinzufügen".' },
        { type: 'tip-ios', text: 'Wichtig: Die Installation funktioniert nur über Safari — nicht über WhatsApp-, Instagram- oder Chrome-Browser. Falls du einen anderen Browser nutzt, öffne erst "In Safari öffnen".' },
        { type: 'tip-android', text: 'Tippe in Chrome auf die drei Punkte ⋮ oben rechts → "Zum Startbildschirm hinzufügen" → "Hinzufügen".' },
        { type: 'tip', text: 'Als installierte App startet Inventory42 schneller und fühlt sich wie eine native App an.' },
      ]
    },
    {
      title: '💡 Feedback & Ideen',
      content: [
        { type: 'step', n: 1, text: 'Tippe auf ⚙️ oben rechts und dann auf "Feedback & Ideen".' },
        { type: 'step', n: 2, text: 'Wähle zwischen "Idee" (neue Funktion) und "Bug" (Fehler melden).' },
        { type: 'step', n: 3, text: 'Bei Bugs kannst du optional einen Screenshot anhängen.' },
        { type: 'step', n: 4, text: 'Über "Meine Vorschläge ansehen" siehst du den Status deiner Einreichungen.' },
        { type: 'tip', text: 'Bei Status "Deployed" wird die zugehörige Version angezeigt.' },
      ]
    },
    {
      title: '🔔 Benachrichtigungen',
      content: [
        { type: 'step', n: 1, text: 'Öffne ⚙️ Einstellungen → Benachrichtigungen um Push-Benachrichtigungen zu verwalten.' },
        { type: 'step', n: 2, text: 'Aktiviere den Hauptschalter — der Browser fragt einmalig nach der Berechtigung.' },
        { type: 'step', n: 3, text: 'Wähle für welche Ereignisse du Benachrichtigungen erhalten möchtest: niedriger Bestand, Einkaufsliste oder neue Version.' },
        { type: 'tip', text: 'Die Einstellungen (welche Kategorien aktiv sind) gelten pro Account — Änderungen wirken sich auf alle deine Geräte aus.' },
        { type: 'tip-ios', text: 'Die App muss als PWA installiert sein (Zum Home-Bildschirm hinzufügen) damit Push-Benachrichtigungen funktionieren.' },
        { type: 'tip-android', text: 'Chrome wird empfohlen. Die Benachrichtigungen kommen auch wenn die App geschlossen ist.' },
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
        { type: 'step', n: 4, text: 'Tap ✏️ to edit an item. In the edit screen you can also delete it at the bottom — with a confirmation prompt.' },
        { type: 'tip', text: 'Items with a minimum quantity are highlighted in orange when stock runs low.' },
      ]
    },
    {
      title: '🏷️ Categories',
      content: [
        { type: 'step', n: 1, text: 'Tap "Categories" next to the search bar to manage categories.' },
        { type: 'step', n: 2, text: 'Create new categories with a custom name, icon and color.' },
        { type: 'step', n: 3, text: 'Tap ✏️ next to a category to edit or delete it.' },
        { type: 'step', n: 4, text: 'Filter the item list by category using the pills below the search bar.' },
        { type: 'tip', text: 'The "Low" filter shows all items where stock is below the minimum quantity.' },
        { type: 'tip', text: 'Category names are automatically translated into all three languages when created.' },
      ]
    },
    {
      title: '🛒 Shopping List',
      content: [
        { type: 'step', n: 1, text: 'Tap the 🛒 icon in the top right to open the shopping list.' },
        { type: 'step', n: 2, text: '"⚠️ All low stock" adds all low-stock items at once. Use the dropdown to add only a specific category.' },
        { type: 'step', n: 3, text: '"+ From inventory" lets you search and add items. If an item is not in your inventory, a green "+ Add" button appears — this adds it directly to the list.' },
        { type: 'step', n: 4, text: 'Tap an item to check it off — enter the purchased quantity and confirm. The inventory stock is updated immediately.' },
        { type: 'step', n: 5, text: 'For one-time purchases you will be asked after checking off whether to permanently add the item to your inventory.' },
        { type: 'step', n: 6, text: 'Checked items appear crossed out at the bottom. Use "🗑 Clear" to delete done or all items.' },
        { type: 'tip', text: 'The shopping list is shared with all household members — changes are visible in real time.' },
        { type: 'tip-ios', text: 'Use the 📷 button to take a photo of a product — the AI recognizes it automatically and finds the matching item in your inventory.' },
        { type: 'tip-android', text: 'The 📷 button opens the scanner. Choose between barcode scanning (EAN code) for quick recognition or AI product recognition (photo) for unknown products.' },
    },
    {
      title: '👥 Members',
      content: [
        { type: 'step', n: 1, text: 'Tap ⚙️ in the top right, then tap "Members".' },
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
        { type: 'step', n: 1, text: 'Tap ⚙️ in the top right, then tap "Feedback & Ideas".' },
        { type: 'step', n: 2, text: 'Choose between "Idea" (new feature) and "Bug" (report an error).' },
        { type: 'step', n: 3, text: 'For bugs, you can optionally attach a screenshot.' },
        { type: 'step', n: 4, text: 'Via "View my suggestions" you can see the status of your submissions.' },
        { type: 'tip', text: 'When status is "Deployed", the related version is shown.' },
      ]
    },
    {
      title: '🔔 Notifications',
      content: [
        { type: 'step', n: 1, text: 'Open ⚙️ Settings → Notifications to manage push notifications.' },
        { type: 'step', n: 2, text: 'Enable the main toggle — the browser will ask for permission once.' },
        { type: 'step', n: 3, text: 'Choose which events you want to be notified about: low stock, shopping list or new version.' },
        { type: 'tip', text: 'Settings (which categories are active) apply per account — changes affect all your devices.' },
        { type: 'tip-ios', text: 'The app must be installed as a PWA (Add to Home Screen) for push notifications to work.' },
        { type: 'tip-android', text: 'Chrome is recommended. Notifications arrive even when the app is closed.' },
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
        { type: 'step', n: 4, text: 'Toca ✏️ para editar un artículo. En la pantalla de edición también puedes eliminarlo abajo — con confirmación.' },
        { type: 'tip', text: 'Los artículos con cantidad mínima se resaltan en naranja cuando el stock es bajo.' },
      ]
    },
    {
      title: '🏷️ Categorías',
      content: [
        { type: 'step', n: 1, text: 'Toca "Categorías" junto a la barra de búsqueda para gestionarlas.' },
        { type: 'step', n: 2, text: 'Crea nuevas categorías con nombre, icono y color personalizados.' },
        { type: 'step', n: 3, text: 'Toca ✏️ junto a una categoría para editarla o eliminarla.' },
        { type: 'step', n: 4, text: 'Filtra la lista de artículos por categoría usando los botones bajo la barra de búsqueda.' },
        { type: 'tip', text: 'El filtro "Bajo" muestra todos los artículos con stock por debajo de la cantidad mínima.' },
        { type: 'tip', text: 'Los nombres de categorías se traducen automáticamente a los tres idiomas al crearlos.' },
      ]
    },
    {
      title: '🛒 Lista de compras',
      content: [
        { type: 'step', n: 1, text: 'Toca el icono 🛒 arriba a la derecha para abrir la lista de compras.' },
        { type: 'step', n: 2, text: '"⚠️ Todos los bajos" añade todos los artículos con stock bajo de una vez. Usa el desplegable para añadir solo una categoría.' },
        { type: 'step', n: 3, text: '"+ Del inventario" te permite buscar y añadir artículos. Si un artículo no está en tu inventario, aparece un botón verde "+ Añadir" — esto lo añade directamente a la lista.' },
        { type: 'step', n: 4, text: 'Toca un artículo para marcarlo — introduce la cantidad comprada y confirma. El stock del inventario se actualiza inmediatamente.' },
        { type: 'step', n: 5, text: 'Para compras únicas se preguntará después de marcar si deseas añadir el artículo permanentemente al inventario.' },
        { type: 'step', n: 6, text: 'Los artículos marcados aparecen tachados abajo. Usa "🗑 Vaciar" para eliminar los completados o todos.' },
        { type: 'tip', text: 'La lista de compras es compartida con todos los miembros del hogar — los cambios son visibles en tiempo real.' },
        { type: 'tip-ios', text: 'Con el botón 📷 puedes fotografiar un producto — la IA lo reconoce automáticamente y busca el artículo en tu inventario.' },
        { type: 'tip-android', text: 'El botón 📷 abre el escáner. Elige entre escanear código de barras (código EAN) para reconocimiento rápido o reconocimiento IA (foto) para productos desconocidos.' },
    },
    {
      title: '👥 Miembros',
      content: [
        { type: 'step', n: 1, text: 'Toca ⚙️ arriba a la derecha y luego "Miembros".' },
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
        { type: 'step', n: 1, text: 'Abre ⚙️ Ajustes — encontrarás una guía de instalación inteligente que detecta tu navegador.' },
        { type: 'step', n: 2, text: 'iPhone con Safari: Toca el icono de compartir ⬆️ → "Añadir a inicio" → "Añadir".' },
        { type: 'step', n: 3, text: 'iPhone con enlace de WhatsApp: Toca ··· abajo a la derecha → "Abrir en Safari" → luego instala como arriba.' },
        { type: 'step', n: 4, text: 'Android con Chrome: Toca los tres puntos ⋮ → "Añadir a pantalla de inicio" → "Añadir".' },
        { type: 'tip', text: 'Importante para iPhone: La instalación solo funciona desde Safari — no desde WhatsApp, Instagram o Chrome.' },
        { type: 'tip', text: 'Como app instalada, Inventory42 arranca más rápido y se siente como una app nativa.' },
      ]
    },
    {
      title: '💡 Comentarios e ideas',
      content: [
        { type: 'step', n: 1, text: 'Toca ⚙️ arriba a la derecha y luego "Comentarios e ideas".' },
        { type: 'step', n: 2, text: 'Elige entre "Idea" (nueva función) y "Error" (reportar un fallo).' },
        { type: 'step', n: 3, text: 'Para errores, puedes adjuntar opcionalmente una captura de pantalla.' },
        { type: 'step', n: 4, text: 'Con "Ver mis sugerencias" puedes ver el estado de tus envíos.' },
        { type: 'tip', text: 'Cuando el estado es "Implementado", se muestra la versión correspondiente.' },
      ]
    },
    {
      title: '🔔 Notificaciones',
      content: [
        { type: 'step', n: 1, text: 'Abre ⚙️ Ajustes → Notificaciones para gestionar las notificaciones push.' },
        { type: 'step', n: 2, text: 'Activa el interruptor principal — el navegador pedirá permiso una vez.' },
        { type: 'step', n: 3, text: 'Elige para qué eventos quieres recibir notificaciones: stock bajo, lista de compras o nueva versión.' },
        { type: 'tip', text: 'Los ajustes (qué categorías están activas) se aplican por cuenta — los cambios afectan a todos tus dispositivos.' },
        { type: 'tip-ios', text: 'La app debe estar instalada como PWA (Añadir a inicio) para que funcionen las notificaciones push.' },
        { type: 'tip-android', text: 'Se recomienda Chrome. Las notificaciones llegan aunque la app esté cerrada.' },
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
              {section.content
                .filter(item => {
                  if (item.type === 'tip-ios') return isIOS
                  if (item.type === 'tip-android') return !isIOS
                  return true
                })
                .map((item, j) =>
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
