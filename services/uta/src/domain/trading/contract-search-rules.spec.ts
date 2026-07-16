import { describe, expect, it } from 'vitest'
import { normalizeBrokerSearchPattern } from './contract-search-rules.js'

describe('normalizeBrokerSearchPattern', () => {
  describe('crypto / currency: strip known quote currency suffix', () => {
    it('strips USD from crypto pair', () => {
      expect(normalizeBrokerSearchPattern('BTCUSD', 'crypto')).toBe('BTC')
    })

    it('strips USDT (longer match wins over USD)', () => {
      expect(normalizeBrokerSearchPattern('SOLUSDT', 'crypto')).toBe('SOL')
    })

    it('strips USDC', () => {
      expect(normalizeBrokerSearchPattern('ETHUSDC', 'crypto')).toBe('ETH')
    })

    it('strips USD from currency pair', () => {
      expect(normalizeBrokerSearchPattern('EURUSD', 'currency')).toBe('EUR')
    })

    it('lowercases input still produces uppercase base', () => {
      expect(normalizeBrokerSearchPattern('btcusd', 'crypto')).toBe('BTC')
    })

    it('leaves a symbol unchanged when no known quote suffix matches', () => {
      // BTC is not in the strip list, so ETHBTC must NOT lose its tail.
      expect(normalizeBrokerSearchPattern('ETHBTC', 'crypto')).toBe('ETHBTC')
    })

    it('leaves a too-short base alone (LUSD is the Liquity stablecoin)', () => {
      // Stripping USD would leave just "L" — clearly worse than passing through.
      expect(normalizeBrokerSearchPattern('LUSD', 'crypto')).toBe('LUSD')
    })

    it('leaves bare base symbols alone', () => {
      expect(normalizeBrokerSearchPattern('BTC', 'crypto')).toBe('BTC')
    })
  })

  describe('equity: normalize Japanese Yahoo symbols', () => {
    it('strips .T from a numeric JPX code', () => {
      expect(normalizeBrokerSearchPattern('7203.T', 'equity')).toBe('7203')
    })

    it('strips .T from an alphanumeric JPX code', () => {
      expect(normalizeBrokerSearchPattern('130a.t', 'equity')).toBe('130A')
    })

    it('passes a US ticker through unchanged', () => {
      expect(normalizeBrokerSearchPattern('AAPL', 'equity')).toBe('AAPL')
    })

    it('does not rewrite a non-JPX dotted ticker', () => {
      expect(normalizeBrokerSearchPattern('BRK.B', 'equity')).toBe('BRK.B')
      expect(normalizeBrokerSearchPattern('ABCD.T', 'equity')).toBe('ABCD.T')
    })

    it('does not strip from equity even when it looks like a pair', () => {
      // Some real tickers happen to look like FX pairs (rare, but defend).
      expect(normalizeBrokerSearchPattern('EURUSD', 'equity')).toBe('EURUSD')
    })
  })

  describe('commodity: identity', () => {
    it('passes commodity id unchanged', () => {
      expect(normalizeBrokerSearchPattern('gold', 'commodity')).toBe('gold')
    })
  })

  describe('unknown / default', () => {
    it('passes through when asset class is omitted', () => {
      expect(normalizeBrokerSearchPattern('BTCUSD')).toBe('BTCUSD')
    })

    it('passes through when asset class is unknown', () => {
      expect(normalizeBrokerSearchPattern('BTCUSD', 'unknown')).toBe('BTCUSD')
    })
  })

  describe('edge cases', () => {
    it('returns empty string unchanged', () => {
      expect(normalizeBrokerSearchPattern('', 'crypto')).toBe('')
    })

    it('trims surrounding whitespace', () => {
      expect(normalizeBrokerSearchPattern('  BTCUSD  ', 'crypto')).toBe('BTC')
    })
  })
})
