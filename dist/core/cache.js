/**
 * Simple LRU Cache implementation for performance optimization
 */
export class LRUCache {
    cache;
    maxSize;
    ttl; // Time to live in milliseconds
    constructor(options = {}) {
        this.cache = new Map();
        this.maxSize = options.maxSize ?? 1000;
        this.ttl = options.ttl ?? 5 * 60 * 1000; // 5 minutes default
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
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
    set(key, value) {
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
    has(key) {
        return this.get(key) !== undefined;
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    get size() {
        return this.cache.size;
    }
}
/**
 * Pre-compiled regex cache for pattern matching
 */
class RegexCache {
    cache = new Map();
    get(pattern, flags = '') {
        const key = `${pattern}::${flags}`;
        let regex = this.cache.get(key);
        if (!regex) {
            regex = new RegExp(pattern, flags);
            this.cache.set(key, regex);
        }
        return regex;
    }
    clear() {
        this.cache.clear();
    }
}
// Singleton instances
export const regexCache = new RegexCache();
// Language detection cache
export const languageDetectionCache = new LRUCache({
    maxSize: 500,
    ttl: 10 * 60 * 1000 // 10 minutes
});
// AST analysis cache
export const astAnalysisCache = new LRUCache({
    maxSize: 100,
    ttl: 5 * 60 * 1000 // 5 minutes
});
/**
 * Creates a hash for cache keys
 */
export function hashCode(str) {
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
export function memoize(fn, keyFn) {
    const cache = new LRUCache({ maxSize: 100, ttl: 5 * 60 * 1000 });
    return ((...args) => {
        const key = keyFn ? keyFn(...args) : JSON.stringify(args);
        const cached = cache.get(key);
        if (cached !== undefined) {
            return cached;
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    });
}
//# sourceMappingURL=cache.js.map