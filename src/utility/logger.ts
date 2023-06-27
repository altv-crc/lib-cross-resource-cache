import * as fs from 'fs';

let enabled = true;

function getTimeAsString() {
    const time = new Date(Date.now());
    const timeframe = [time.getHours(), time.getMinutes(), time.getSeconds()];

    let data = [];

    for (let value of timeframe) {
        data.push(value <= 9 ? `0${value}` : `${value}`);
        data.push(':');
    }

    data.pop();
    return data.join();
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
