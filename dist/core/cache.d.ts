/**
 * Simple LRU Cache implementation for performance optimization
 */
export declare class LRUCache<K, V> {
    private cache;
    private maxSize;
    private ttl;
    constructor(options?: {
        maxSize?: number;
        ttl?: number;
    });
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    has(key: K): boolean;
    delete(key: K): boolean;
    clear(): void;
    get size(): number;
}
/**
 * Pre-compiled regex cache for pattern matching
 */
declare class RegexCache {
    private cache;
    get(pattern: string, flags?: string): RegExp;
    clear(): void;
}
export declare const regexCache: RegexCache;
export declare const languageDetectionCache: LRUCache<string, string>;
export declare const astAnalysisCache: LRUCache<string, unknown>;
/**
 * Creates a hash for cache keys
 */
export declare function hashCode(str: string): string;
/**
 * Memoization decorator for functions
 */
export declare function memoize<T extends (...args: unknown[]) => unknown>(fn: T, keyFn?: (...args: Parameters<T>) => string): T;
export {};
//# sourceMappingURL=cache.d.ts.map