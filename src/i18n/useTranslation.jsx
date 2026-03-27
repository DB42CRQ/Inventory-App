import { createContext, useContext, useState } from 'react'
import { translations } from './translations'

const LangContext = createContext(null)
const LANG_KEY = 'app_language'

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem(LANG_KEY) || 'de'
  )

  function setLang(l) {
    localStorage.setItem(LANG_KEY, l)
    setLangState(l)
  }

  const t = translations[lang] || translations.de

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useTranslation = () => useContext(LangContext)
