import { KlinePanel } from '../../components/market/KlinePanel'
import { TradeableContractsPanel } from '../../components/market/TradeableContractsPanel'
import type { AssetClass } from '../../api/market'

interface Props {
  symbol: string
  assetClass: AssetClass
}

const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  equity: '株式',
  etf: 'ETF',
  crypto: '暗号資産',
  currency: '為替',
  commodity: '商品',
}

/**
 * Fallback layout for asset classes that haven't earned a bespoke page yet.
 * Shows the K-line and broker-contract bridge without forcing equity-only
 * fundamentals onto ETFs, crypto, currencies, or commodities.
 */
export function GenericDetail({ symbol, assetClass }: Props) {
  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1">
      <div className="flex items-end gap-2 px-1">
        <span className="text-[20px] font-semibold text-text tracking-tight">{symbol}</span>
        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted font-medium">
          {ASSET_CLASS_LABELS[assetClass]}
        </span>
        <span className="text-[11px] text-text-muted/70">
          価格履歴と、設定済みブローカー上の売買可能銘柄を表示します。
        </span>
      </div>
      <div className="flex-1 min-h-[420px]">
        <KlinePanel selection={{ symbol, assetClass }} />
      </div>

      <TradeableContractsPanel symbol={symbol} assetClass={assetClass} />
    </div>
  )
}
