import * as alt from 'alt-server';

const callbacks: { [key: string]: Array<(entity: alt.Entity) => void> } = {};

function bindCallback(type: string, callback: (entity: alt.Entity) => void) {
    if (!callbacks[type]) {
        callbacks[type] = [];
    }

    callbacks[type].push(callback);
}

export function invoke(entity: alt.Entity) {
    const type = entity.constructor.name.toLowerCase();
    const availableCallbacks = callbacks[type];
    if (!availableCallbacks) {
        return;
    }

    for (let callback of availableCallbacks) {
        callback(entity);
    }
}

export function onPlayer(callback: (entity: alt.Entity) => void) {
    bindCallback('player', callback);
}

export function onVehicle(callback: (entity: alt.Entity) => void) {
    bindCallback('vehicle', callback);
}

export function onColshape(callback: (entity: alt.Entity) => void) {
    bindCallback('colshape', callback);
}

export function onCheckpoint(callback: (entity: alt.Entity) => void) {
    bindCallback('checkpoint', callback);
}

export function onPed(callback: (entity: alt.Entity) => void) {
    bindCallback('ped', callback);
}

export function onObject(callback: (entity: alt.Entity) => void) {
    bindCallback('object', callback);
}

export function onMarker(callback: (entity: alt.Entity) => void) {
    bindCallback('marker', callback);
}
