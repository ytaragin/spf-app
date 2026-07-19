import { describe, it, expect } from 'vitest'
import { toWebSocketUrl } from '@/game/gameSocketUrl.js'

describe('toWebSocketUrl', () => {
  describe('protocol derivation', () => {
    it('derives ws:// from an http:// base URL', () => {
      expect(toWebSocketUrl('http://localhost:8000')).toBe('ws://localhost:8000/game/ws')
    })

    it('derives wss:// from an https:// base URL', () => {
      expect(toWebSocketUrl('https://api.example.com')).toBe('wss://api.example.com/game/ws')
    })
  })

  describe('host and port preservation', () => {
    it('preserves host and port while replacing any existing path', () => {
      expect(toWebSocketUrl('http://host:1234/some/existing/path')).toBe('ws://host:1234/game/ws')
    })
  })

  describe('trailing slash handling', () => {
    it('tolerates a trailing slash in the base URL', () => {
      expect(toWebSocketUrl('http://host:8000/')).toBe('ws://host:8000/game/ws')
    })
  })

  describe('fail-loud on invalid input (D-05)', () => {
    it('throws on an empty string', () => {
      expect(() => toWebSocketUrl('')).toThrow()
    })

    it('throws on a non-URL string', () => {
      expect(() => toWebSocketUrl('not a url')).toThrow()
    })

    it('throws on undefined input', () => {
      expect(() => toWebSocketUrl(undefined)).toThrow()
    })

    it('throws on null input', () => {
      expect(() => toWebSocketUrl(null)).toThrow()
    })

    it('throws on a non-http(s) protocol', () => {
      expect(() => toWebSocketUrl('ftp://host:8000')).toThrow()
    })
  })
})
