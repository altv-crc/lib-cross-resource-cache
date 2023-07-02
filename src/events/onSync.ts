import * as alt from 'alt-server';

const callbacks: Array<(entity: alt.Entity) => void> = [];

export function invoke(entity: alt.Entity) {
    for (let callback of callbacks) {
        callback(entity);
    }
}

/**
 * Calls when an entity has `crc.data.sync` invoked on it.
 *
 * @export
 * @param {(entity: alt.Entity) => void} callback
 */
export function onSync(callback: (entity: alt.Entity) => void) {
    callbacks.push(callback);
}
