import { describe, expect, it, vi } from 'vitest'
import {
  aggregateSymbolSearch,
  normalizeJapaneseMarketTicker,
  type MarketSearchDeps,
} from './aggregate-search.js'

function makeDeps(overrides: Partial<MarketSearchDeps> = {}): MarketSearchDeps {
  return {
    symbolIndex: {
      search: vi.fn(() => []),
    } as unknown as MarketSearchDeps['symbolIndex'],
    equityVendors: ['yfinance'],
    equityClient: {
      search: vi.fn(async () => []),
    } as unknown as MarketSearchDeps['equityClient'],
    etfClient: {
      search: vi.fn(async () => []),
    } as unknown as NonNullable<MarketSearchDeps['etfClient']>,
    cryptoClient: {
      search: vi.fn(async () => []),
    } as unknown as MarketSearchDeps['cryptoClient'],
    currencyClient: {
      search: vi.fn(async () => []),
    } as unknown as MarketSearchDeps['currencyClient'],
    commodityCatalog: {
      search: vi.fn(() => []),
    } as unknown as MarketSearchDeps['commodityCatalog'],
    ...overrides,
  }
}

describe('normalizeJapaneseMarketTicker', () => {
  it('adds .T to a numeric JPX code', () => {
    expect(normalizeJapaneseMarketTicker('7203')).toBe('7203.T')
  })

  it('adds .T to an alphanumeric JPX code and uppercases it', () => {
    expect(normalizeJapaneseMarketTicker('130a')).toBe('130A.T')
  })

  it('accepts an existing Yahoo Japan symbol', () => {
    expect(normalizeJapaneseMarketTicker(' 7203.t ')).toBe('7203.T')
  })

  it('does not rewrite ordinary US symbols', () => {
    expect(normalizeJapaneseMarketTicker('AAPL')).toBeNull()
    expect(normalizeJapaneseMarketTicker('BRK.B')).toBeNull()
  })
})

describe('aggregateSymbolSearch — Japan / US / ETF coverage', () => {
  it('surfaces a Yahoo-compatible Japanese stock symbol from a bare JPX code', async () => {
    const out = await aggregateSymbolSearch(makeDeps(), '7203')

    expect(out).toContainEqual(expect.objectContaining({
      symbol: '7203.T',
      assetClass: 'equity',
      sourceId: 'yfinance',
      exchange: 'JPX/TSE',
    }))
  })

  it('supports new alphanumeric JPX codes', async () => {
    const out = await aggregateSymbolSearch(makeDeps(), '130a')

    expect(out).toContainEqual(expect.objectContaining({
      symbol: '130A.T',
      assetClass: 'equity',
    }))
  })

  it('keeps a US stock as equity', async () => {
    const deps = makeDeps({
      symbolIndex: {
        search: vi.fn(() => [{ symbol: 'AAPL', name: 'Apple Inc.' }]),
      } as unknown as MarketSearchDeps['symbolIndex'],
    })

    const out = await aggregateSymbolSearch(deps, 'AAPL')
    expect(out[0]).toMatchObject({ symbol: 'AAPL', assetClass: 'equity', sourceId: 'yfinance' })
  })

  it('classifies a US ETF separately and removes an identical equity duplicate', async () => {
    const deps = makeDeps({
      symbolIndex: {
        search: vi.fn(() => [{ symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' }]),
      } as unknown as MarketSearchDeps['symbolIndex'],
      equityClient: {
        search: vi.fn(async () => [{ symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' }]),
      } as unknown as MarketSearchDeps['equityClient'],
      etfClient: {
        search: vi.fn(async () => [{ symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' }]),
      } as unknown as NonNullable<MarketSearchDeps['etfClient']>,
    })

    const out = await aggregateSymbolSearch(deps, 'SPY')
    const spy = out.filter((r) => r.symbol === 'SPY' && r.sourceId === 'yfinance')

    expect(spy).toHaveLength(1)
    expect(spy[0]).toMatchObject({ assetClass: 'etf', sourceId: 'yfinance' })
  })

  it('classifies a Tokyo-listed ETF and replaces the generic JPX hint', async () => {
    const deps = makeDeps({
      etfClient: {
        search: vi.fn(async () => [{ symbol: '1306.T', name: 'NEXT FUNDS TOPIX ETF' }]),
      } as unknown as NonNullable<MarketSearchDeps['etfClient']>,
    })

    const out = await aggregateSymbolSearch(deps, '1306')
    const matches = out.filter((r) => r.symbol === '1306.T' && r.sourceId === 'yfinance')

    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject({ assetClass: 'etf', name: 'NEXT FUNDS TOPIX ETF' })
  })

  it('uses the embedded SDK model capability when no dedicated ETF client is injected', async () => {
    const executeModel = vi.fn(async (model: string) =>
      model === 'EtfSearch'
        ? [{ symbol: 'QQQ', name: 'Invesco QQQ Trust' }]
        : [],
    )
    const deps = makeDeps({
      equityClient: {
        search: vi.fn(async () => []),
        executeModel,
      } as unknown as MarketSearchDeps['equityClient'],
    })
    delete deps.etfClient

    const out = await aggregateSymbolSearch(deps, 'QQQ')

    expect(executeModel).toHaveBeenCalledWith('EtfSearch', {
      query: 'QQQ',
      provider: 'yfinance',
    })
    expect(out).toContainEqual(expect.objectContaining({
      symbol: 'QQQ',
      assetClass: 'etf',
      sourceId: 'yfinance',
    }))
  })

  it('degrades gracefully when neither ETF client nor SDK capability is available', async () => {
    const deps = makeDeps()
    delete deps.etfClient

    await expect(aggregateSymbolSearch(deps, 'AAPL')).resolves.toEqual(expect.any(Array))
  })
})
