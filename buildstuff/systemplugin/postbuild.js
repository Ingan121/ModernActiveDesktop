exports.default = async function () {
    const fs = require('fs');
    fs.copyFileSync('dist/systemplugin.zip', '../../systemplugin.zip');
}