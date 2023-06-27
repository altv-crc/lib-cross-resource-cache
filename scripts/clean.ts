import * as fs from 'fs';

const foldersToRemove = ['./lib', './lib-es'];

for (let folder of foldersToRemove) {
    if (fs.existsSync(folder)) {
        fs.rmSync(folder, { recursive: true, force: true });
    }
}
