import * as alt from 'alt-server';

const MetaChangeKeyEvent = 'crc-meta-change';
const keyChangeCallbacks: { [key: string]: Array<(entity: alt.Entity, newValue: any, oldValue: any) => void> } = {};

let registeredEvents = false;

function registerEventHandler() {
    registeredEvents = true;
    alt.on(MetaChangeKeyEvent, (key: string, entity: alt.Entity, newValue: any, oldValue: any) => {
        if (!keyChangeCallbacks[key]) {
            return;
        }

        for (let callback of keyChangeCallbacks[key]) {
            callback(entity, newValue, oldValue);
        }
    });
}

/**
 * Listen for a very specific key change on an entity.
 *
 * For example, if I want to know when the `cash` value was updated, I can use this function to listen for it.
 *
 * @export
 * @param {string} key
 * @param {(entity: alt.Entity, newValue: any, oldValue: any) => void} callback
 * @return {*}
 */
export function onKeyChange(key: string, callback: (entity: alt.Entity, newValue: any, oldValue: any) => void) {
    if (!keyChangeCallbacks[key]) {
        keyChangeCallbacks[key] = [];
    }

    keyChangeCallbacks[key].push(callback);

    if (registeredEvents) {
        return;
    }

    registerEventHandler();
}

export function invokeDataChange(key: string, entity: alt.Entity, newValue: any, oldValue: any) {
    alt.emit(MetaChangeKeyEvent, key, entity, newValue, oldValue);
}
