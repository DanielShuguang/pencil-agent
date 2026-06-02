import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '../i18n'

describe('i18n configuration', () => {
  beforeEach(() => {
    i18n.changeLanguage('zh')
  })

  it('should have zh and en resources', () => {
    expect(i18n.hasResourceBundle('zh', 'translation')).toBe(true)
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true)
  })

  it('should default to zh language', () => {
    expect(i18n.language).toBe('zh')
  })

  it('should translate chat.inputPlaceholder', () => {
    expect(i18n.t('chat.inputPlaceholder')).toBe('输入消息...')
    i18n.changeLanguage('en')
    expect(i18n.t('chat.inputPlaceholder')).toBe('Type a message...')
  })

  it('should translate chat.send', () => {
    expect(i18n.t('chat.send')).toBe('发送')
    i18n.changeLanguage('en')
    expect(i18n.t('chat.send')).toBe('Send')
  })

  it('should translate chat.stop', () => {
    expect(i18n.t('chat.stop')).toBe('停止')
    i18n.changeLanguage('en')
    expect(i18n.t('chat.stop')).toBe('Stop')
  })

  it('should translate sidebar.sessions', () => {
    expect(i18n.t('sidebar.sessions')).toBe('会话')
    i18n.changeLanguage('en')
    expect(i18n.t('sidebar.sessions')).toBe('Sessions')
  })

  it('should translate settings.title', () => {
    expect(i18n.t('settings.title')).toBe('设置')
    i18n.changeLanguage('en')
    expect(i18n.t('settings.title')).toBe('Settings')
  })

  it('should translate settings.apiKeys', () => {
    expect(i18n.t('settings.apiKeys')).toBe('API 密钥')
    i18n.changeLanguage('en')
    expect(i18n.t('settings.apiKeys')).toBe('API Keys')
  })

  it('should translate settings.models', () => {
    expect(i18n.t('settings.models')).toBe('模型')
    i18n.changeLanguage('en')
    expect(i18n.t('settings.models')).toBe('Models')
  })

  it('should translate settings.language', () => {
    expect(i18n.t('settings.language')).toBe('语言')
    i18n.changeLanguage('en')
    expect(i18n.t('settings.language')).toBe('Language')
  })

  it('should fallback to key when translation missing', () => {
    expect(i18n.t('nonexistent.key')).toBe('nonexistent.key')
  })
})
