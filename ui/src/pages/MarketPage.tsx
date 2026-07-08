import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BoardMeta } from '../components/market/BoardMeta'
import { PageHeader } from '../components/PageHeader'
import { SearchBox } from '../components/market/SearchBox'
import { SeriesCard } from '../components/market/SeriesCard'
import { Skeleton } from '../components/StateViews'
import { referenceApi, type ValuationStrip } from '../api/reference'

export function MarketPage() {
  const { t } = useTranslation()
  const [strip, setStrip] = useState<ValuationStrip | null>(null)
  const [stripError, setStripError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    referenceApi.valuation()
      .then((res) => { if (alive) setStrip(res) })
      .catch((err) => { if (alive) setStripError(err instanceof Error ? err.message : 'Failed to load') })
    return () => { alive = false }
  }, [])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader title="マーケット" description="日本株・米国株を検索し、価格推移・ファンダメンタル・指標を確認します。" />
      <div className="flex-1 flex flex-col gap-6 px-4 md:px-8 py-4 min-h-0 overflow-y-auto">
        <SearchBox />

        {/* S&P 500 valuation strip — the market-level regime read. */}
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted/60">
            {t('market.valuationTitle')}
            {strip && <span className="ml-2 normal-case font-normal tracking-normal"><BoardMeta meta={strip.meta} /></span>}
          </h3>
          {stripError && (
            <div className="text-[12px] text-text-muted/70 border border-border rounded-md px-3 py-2">{stripError}</div>
          )}
          {!strip && !stripError && (
            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-border rounded-md bg-bg-secondary/40 px-3 py-2.5 flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-6 w-24 rounded" />
                </div>
              ))}
            </div>
          )}
          {strip && (
            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
              {strip.cards.map((c) => (
                <SeriesCard key={c.id} card={c} label={valuationLabel(c.id, t) ?? c.label} emptyText={t('market.noMatches')} />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
          <div className="text-[14px] text-text-muted">日本株または米国株を選択してください。</div>
          <div className="text-[12px] text-text-muted/60 max-w-md">
            ティッカーまたは会社名で検索できます。日本株は 7203.T / 6758.T のような Yahoo Finance 形式、
            米国株は AAPL / NVDA のようなティッカーを使います。
          </div>
        </div>
      </div>
    </div>
  )
}

function valuationLabel(id: string, t: ReturnType<typeof useTranslation>['t']): string | null {
  switch (id) {
    case 'pe_month': return t('market.valPe')
    case 'shiller_pe_month': return t('market.valCape')
    case 'earnings_yield_month': return t('market.valEarningsYield')
    case 'dividend_yield_month': return t('market.valDividendYield')
    default: return null
  }
}
