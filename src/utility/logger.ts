import * as fs from 'fs';

let enabled = true;

function toPadded(value: number) {
    if (value <= 9) {
        return `0${value}`;
    }

    return `${value}`;
}

function getTimeAsString() {
    const time = new Date(Date.now());
    return `${toPadded(time.getHours())}:${toPadded(time.getMinutes())}:${toPadded(time.getSeconds())}`;
}

export function write(message: string) {
    fs.appendFileSync(`cross-resource-cache-logs.txt`, `[${getTimeAsString()}] ${message} \r\n`, 'utf-8');
}

export function enable() {
    enabled = true;
}

export function disable() {
    enabled = false;
}
