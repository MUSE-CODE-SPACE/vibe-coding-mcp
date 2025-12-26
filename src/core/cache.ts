/**
 * Simple LRU Cache implementation for performance optimization
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(options: { maxSize?: number; ttl?: number } = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize ?? 1000;
    this.ttl = options.ttl ?? 5 * 60 * 1000; // 5 minutes default
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    // Delete if exists to update order
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Pre-compiled regex cache for pattern matching
 */
class RegexCache {
  private cache = new Map<string, RegExp>();

  get(pattern: string, flags: string = ''): RegExp {
    const key = `${pattern}::${flags}`;
    let regex = this.cache.get(key);

    if (!regex) {
      regex = new RegExp(pattern, flags);
      this.cache.set(key, regex);
    }

    return regex;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton instances
export const regexCache = new RegexCache();

// Language detection cache
export const languageDetectionCache = new LRUCache<string, string>({
  maxSize: 500,
  ttl: 10 * 60 * 1000 // 10 minutes
});

// AST analysis cache
export const astAnalysisCache = new LRUCache<string, unknown>({
  maxSize: 100,
  ttl: 5 * 60 * 1000 // 5 minutes
});

/**
 * Creates a hash for cache keys
 */
export function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Memoization decorator for functions
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new LRUCache<string, ReturnType<T>>({ maxSize: 100, ttl: 5 * 60 * 1000 });

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}
