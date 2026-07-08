/**
 * Market Search AI Tool
 *
 * marketSearchForResearch:
 *   Unified symbol search across equity / crypto / currency / commodity.
 *   The aggregate logic lives in domain/market-data/aggregate-search, and the
 *   HTTP layer (/api/market/search) reuses the same function — AI and UI see the
 *   same results.
 */

import { tool } from 'ai'
import { z } from 'zod'
import {
  aggregateSymbolSearch,
  type MarketSearchDeps,
} from '@/domain/market-data/aggregate-search.js'

export function createMarketSearchTools(deps: MarketSearchDeps) {
  return {
    marketSearchForResearch: tool({
      description: `Search for symbols across all asset classes (equities, crypto, currencies, commodities) for market data research.

Returns matching symbols with assetClass attribution ("equity", "crypto", "currency", or "commodity").
Equity search is tuned for US stocks and Japanese stocks: US tickers use plain symbols such as AAPL/NVDA; Japanese stocks use Yahoo Finance's TSE suffix such as 7203.T/6758.T, and a bare 4-character JPX/TSE code such as 7203 is normalized to 7203.T. Crypto and currency results come from Yahoo Finance fuzzy search; commodity results come from a canonical catalog (~25 items). Currency results are filtered to XXXUSD pairs only.

For commodities, use the canonical id (e.g. "gold", "crude_oil", "copper") with calculateIndicator
and other tools — provider-specific tickers (GC=F, GCUSD) are resolved automatically.

If unsure about the symbol, use this to find the correct one for market data tools
(equityGetProfile, equityGetFinancials, calculateIndicator, etc.).
This is NOT for trading — use searchContracts to find broker-tradeable contracts; Japanese vendor symbols such as 7203.T are normalized to broker search pattern 7203 there.`,
      inputSchema: z.object({
        query: z.string().describe('Keyword to search, e.g. "AAPL", "NVDA", "7203", "7203.T", "bitcoin", "EUR"'),
        limit: z.number().int().positive().optional().describe('Max results per asset class (default: 20)'),
      }).meta({ examples: [{ query: '7203' }, { query: 'AAPL' }] }),
      execute: async ({ query, limit }) => {
        const results = await aggregateSymbolSearch(deps, query, limit ?? 20)
        if (results.length === 0) {
          return { results: [], message: `No symbols matching "${query}". Try a different keyword.` }
        }
        return { results, count: results.length }
      },
    }),
  }
}
