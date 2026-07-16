/**
 * Market Search AI Tool
 *
 * marketSearchForResearch:
 *   日本株・米国株・ETF・暗号資産・為替・商品を横断する統合検索入口。
 *   実際の集約ロジックは domain/market-data/aggregate-search にあり、
 *   HTTP 層（/api/market/search）も同じ関数を使うため、AI と UI の結果は一致する。
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
      description: `日本株、米国株、ETF、暗号資産、為替、商品を横断して市場データ用のシンボルを検索します。

結果には assetClass（"equity"、"etf"、"crypto"、"currency"、"commodity"）が付きます。
日本株は東証コードをそのまま入力できます。例: 7203 / 7203.T / 130A。
米国株は AAPL、MSFT など、ETFは SPY、QQQ、1306 / 1306.T などを検索できます。
ETFはYahoo Financeの quoteType=ETF 判定を使い、同一シンボルの株式候補と重複しないよう分類します。
暗号資産と為替はYahoo Finance検索、商品は標準カタログを使います。為替はXXXUSDペアに絞ります。

商品では gold、crude_oil、copper などの標準IDを calculateIndicator 等へ渡してください。
これは市場データ調査用であり、実際に売買可能なブローカー契約は searchContracts で検索します。`,
      inputSchema: z.object({
        query: z.string().describe('検索語。例: "7203", "AAPL", "SPY", "1306", "bitcoin", "EUR"'),
        limit: z.number().int().positive().optional().describe('資産種別ごとの最大件数（既定: 20）'),
      }).meta({ examples: [{ query: '7203' }, { query: 'SPY' }] }),
      execute: async ({ query, limit }) => {
        const results = await aggregateSymbolSearch(deps, query, limit ?? 20)
        if (results.length === 0) {
          return { results: [], message: `「${query}」に一致するシンボルがありません。別の銘柄コードまたは名称を試してください。` }
        }
        return { results, count: results.length }
      },
    }),
  }
}
