/**
 * Contract search normalization rules.
 *
 * If anything below looks arbitrary, read `./contract-search-rules.md`
 * before changing it. The doc has design rationale, the list of cases
 * we deliberately don't handle, and a "when NOT to add a rule" section.
 *
 * The bridge between data-vendor symbols (yfinance / FMP / …) and
 * broker tickers (CcxtBroker / AlpacaBroker / IBKR / …) is heuristic
 * by design; this file is the only place that heuristic lives so AI
 * tool, HTTP route, and UI panel all share one set of rules.
 */

export type AssetClassHint = 'equity' | 'crypto' | 'currency' | 'commodity' | 'unknown'

/** Quote currencies we strip from concatenated crypto/FX symbols.
 *  Order is significant: longer prefixes first so `USDT` matches before `USD`. */
const QUOTE_CURRENCIES = ['USDT', 'USDC', 'BUSD', 'USD', 'EUR', 'JPY', 'GBP', 'CNY'] as const

const QUOTE_SUFFIX_RE = new RegExp(
  `^([A-Z0-9]{2,})(?:${QUOTE_CURRENCIES.join('|')})$`,
  'i',
)

const JP_YAHOO_EQUITY_RE = /^(\d{4}[A-Z]?)\.T$/i

/**
 * Translate a data-vendor symbol into the pattern the broker layer
 * actually understands.
 *
 * - US equity / commodity / unknown → identity (vendor and broker usually agree)
 * - Japanese Yahoo Finance equities (7203.T, 6758.T) → strip the `.T` suffix;
 *   TSE/JPX-capable brokers such as IBKR search by local security code.
 * - crypto / currency → strip a known quote-currency suffix when the remaining
 *   base is at least two characters; otherwise identity.
 *
 * This function is intentionally minimal. See `contract-search-rules.md`
 * for what to add and what to leave alone.
 */
export function normalizeBrokerSearchPattern(
  symbol: string,
  assetClass: AssetClassHint = 'unknown',
): string {
  const trimmed = symbol.trim()
  if (!trimmed) return trimmed

  switch (assetClass) {
    case 'crypto':
    case 'currency': {
      const m = trimmed.match(QUOTE_SUFFIX_RE)
      return m ? m[1].toUpperCase() : trimmed
    }
    case 'equity': {
      const jp = trimmed.match(JP_YAHOO_EQUITY_RE)
      return jp ? jp[1].toUpperCase() : trimmed
    }
    case 'commodity':
    case 'unknown':
    default:
      return trimmed
  }
}
