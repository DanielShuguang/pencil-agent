import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getStorageItem } from './lib/storage'
import zh from './locales/zh.json'
import en from './locales/en.json'

// 启动时读取上次选择的语言，否则刷新后会回退到默认中文
const savedLanguage = getStorageItem<'zh' | 'en'>('language', 'zh')

void i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: savedLanguage,
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
