import { createContext, useContext, useState } from 'react'
import { translations } from './translations'
import { supabase } from '../lib/supabase'

const LangContext = createContext(null)
const LANG_KEY = 'app_language'

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem(LANG_KEY) || 'de'
  )

  async function setLang(l) {
    localStorage.setItem(LANG_KEY, l)
    setLangState(l)
    // Sprache in DB speichern
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ lang: l }).eq('id', user.id)
    }
  }

  const t = translations[lang] || translations.de

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useTranslation = () => useContext(LangContext)
