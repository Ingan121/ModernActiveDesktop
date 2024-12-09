// postbuild.js for ModernActiveDesktop System Plugin
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

import { copyFileSync, readFileSync, writeFileSync } from 'fs';
import { createSign } from 'crypto';

export default async function () {
    const privateKey = readFileSync('spsigning.pem', 'utf8');

    const batText = readFileSync('../../Install System Plugin.bat', 'utf8');
    const batContent = batText.split('REM sig=')[0] + 'REM sig=';
    const batSign = createSign('RSA-SHA256');
    batSign.update(batContent);
    const batSignature = batSign.sign(privateKey, 'base64');

    const zip = readFileSync('dist/systemplugin.zip');
    const zipSign = createSign('RSA-SHA256');
    zipSign.update(zip);
    const zipSignature = zipSign.sign(privateKey);

    writeFileSync('../../Install System Plugin.bat', batContent + batSignature);
    copyFileSync('dist/systemplugin.zip', '../../systemplugin.zip');
    writeFileSync('../../systemplugin.zip.sig', zipSignature);
}