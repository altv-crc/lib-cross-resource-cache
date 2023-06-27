import * as alt from 'alt-server';

const keyPrefix = 'orchestra-';

/**
 * Set global cross-resource data.
 *
 * @export
 * @template T
 * @template Value
 * @param {T} key
 * @param {Value} value
 */
export function set<T extends string, Value>(key: T, value: Value) {
    alt.setMeta(keyPrefix + String(key), value);
}

/**
 * Get global cross-resource data.
 *
 * @export
 * @template T
 * @template ReturnType
 * @param {T} key
 * @return {ReturnType}
 */
export function get<T extends string, ReturnType = any>(key: T): ReturnType {
    return alt.hasMeta(keyPrefix + String(key)) ? <ReturnType>alt.getMeta(keyPrefix + String(key)) : <ReturnType>{};
}

/**
 * Remove global cross-resource data.
 *
 * @export
 * @template T
 * @param {T} key
 */
export function remove<T extends string>(key: T) {
    alt.deleteMeta(keyPrefix + key);
}
