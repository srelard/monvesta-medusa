import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Cache for the public product-content endpoint.
 *
 * Uses the Caching Module (Redis-backed in production, see medusa-config.ts)
 * when it is registered, so invalidation works across processes/instances.
 * Falls back to a per-process TTL map in local dev where no caching module
 * is configured.
 *
 * Values are wrapped in an envelope ({ content }) so a cached `null` content
 * (product without marketing content) is distinguishable from a cache miss.
 */

const CACHE_TTL_SECONDS = 86_400 // 24 hours — invalidated eagerly on admin save
const KEY_PREFIX = "product-content:"

type Envelope = { content: unknown }

// ─── In-process fallback (dev without Redis) ───

class TtlCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>()

  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }

  delete(key: string): void {
    this.store.delete(key)
  }
}

const fallbackCache = new TtlCache<Envelope>(CACHE_TTL_SECONDS * 1000)

// ─── Public API ───

type CachingModuleService = {
  get(input: { key: string }): Promise<unknown | null>
  set(input: { key: string; data: unknown; ttl?: number }): Promise<void>
  clear(input: { key: string }): Promise<void>
}

function resolveCachingModule(
  scope: MedusaContainer
): CachingModuleService | null {
  try {
    return scope.resolve<CachingModuleService>(Modules.CACHING)
  } catch {
    return null
  }
}

/** Returns the cached envelope, or undefined on miss. */
export async function getCachedProductContent(
  scope: MedusaContainer,
  productId: string
): Promise<Envelope | undefined> {
  const caching = resolveCachingModule(scope)
  if (caching) {
    const hit = (await caching.get({ key: `${KEY_PREFIX}${productId}` })) as
      | Envelope
      | null
    return hit ?? undefined
  }
  return fallbackCache.get(productId)
}

export async function setCachedProductContent(
  scope: MedusaContainer,
  productId: string,
  content: unknown
): Promise<void> {
  const envelope: Envelope = { content }
  const caching = resolveCachingModule(scope)
  if (caching) {
    await caching.set({
      key: `${KEY_PREFIX}${productId}`,
      data: envelope,
      ttl: CACHE_TTL_SECONDS,
    })
    return
  }
  fallbackCache.set(productId, envelope)
}

export async function invalidateCachedProductContent(
  scope: MedusaContainer,
  productId: string
): Promise<void> {
  const caching = resolveCachingModule(scope)
  if (caching) {
    await caching.clear({ key: `${KEY_PREFIX}${productId}` })
    return
  }
  fallbackCache.delete(productId)
}
