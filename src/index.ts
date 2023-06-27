export * as data from './cache/index.js';
export * as database from './database/index.js';
export * as events from './events/index.js';
export * as utility from './utility/index.js';

declare global {
    interface onCEvent {
        example: string;
    }

    interface onClientCEvent {
        example: string;
    }

    type CEventClient = keyof onClientCEvent;
    type CEventServer = keyof onCEvent;
}
