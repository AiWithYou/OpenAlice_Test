/**
 * SDK Base Client
 *
 * Replaces HTTP fetch with in-process executor.execute() calls.
 * All domain-specific SDK clients extend this class and expose the same method
 * signatures as their HTTP counterparts.
 *
 * Data flow:
 *   client.getQuote(params) → this.request('/price/quote', params)
 *     → resolve model via routeMap: '/equity/price/quote' → 'EquityQuote'
 *     → executor.execute('fmp', 'EquityQuote', params, credentials)
 */

import type { QueryExecutor } from '@traderalice/opentypebb'

export class SDKBaseClient {
  constructor(
    protected executor: QueryExecutor,
    protected routePrefix: string,
    protected defaultProvider: string | undefined,
    protected credentials: Record<string, string>,
    protected routeMap: Map<string, string>,
  ) {}

  /**
   * Execute a registered OpenTypeBB model directly while retaining this
   * client's provider and credential wiring. This optional capability is used
   * by cross-domain aggregators (for example, equity search adding EtfSearch)
   * without forcing application bootstrap code to grow another dependency.
   */
  async executeModel<T = Record<string, unknown>>(
    model: string,
    params: Record<string, unknown> = {},
  ): Promise<T[]> {
    const provider = (params.provider as string) ?? this.defaultProvider
    if (!provider) {
      throw new Error(`No provider specified for model: ${model}`)
    }

    const { provider: _, ...cleanParams } = params
    return this.executor.execute(provider, model, cleanParams, this.credentials) as Promise<T[]>
  }

  protected async request<T = Record<string, unknown>>(
    path: string,
    params: Record<string, unknown> = {},
  ): Promise<T[]> {
    const fullPath = `/${this.routePrefix}${path}`
    const model = this.routeMap.get(fullPath)
    if (!model) {
      throw new Error(`No SDK route for: ${fullPath}`)
    }
    return this.executeModel<T>(model, params)
  }
}
