const fs = require('fs');
const themeText = fs.readFileSync(process.argv[2], 'utf8');

const scheme = {
    'active-border': getColorValue('ActiveBorder'),
    'active-title': getColorValue('ActiveTitle'),
    'app-workspace': getColorValue('AppWorkspace'),
    'background': getColorValue('Background'),
    'button-alternate-face': getColorValue('ButtonAlternateFace'),
    'button-dk-shadow': getColorValue('ButtonDkShadow'),
    'button-face': getColorValue('ButtonFace'),
    'button-hilight': getColorValue('ButtonHilight'),
    'button-light': getColorValue('ButtonLight'),
    'button-shadow': getColorValue('ButtonShadow'),
    'button-text': getColorValue('ButtonText'),
    'gradient-active-title': getColorValue('GradientActiveTitle'),
    'gradient-inactive-title': getColorValue('GradientInactiveTitle'),
    'gray-text': getColorValue('GrayText'),
    'hilight': getColorValue('Hilight'),
    'hilight-text': getColorValue('HilightText'),
    'hot-tracking-color': getColorValue('HotTrackingColor'),
    'inactive-border': getColorValue('InactiveBorder'),
    'inactive-title': getColorValue('InactiveTitle'),
    'inactive-title-text': getColorValue('InactiveTitleText'),
    'info-text': getColorValue('InfoText'),
    'info-window': getColorValue('InfoWindow'),
    'menu': getColorValue('Menu'),
    'menu-bar': getColorValue('MenuBar'),
    'menu-hilight': getColorValue('MenuHilight'),
    'menu-text': getColorValue('MenuText'),
    'scrollbar': getColorValue('Scrollbar'),
    'title-text': getColorValue('TitleText'),
    'window': getColorValue('Window'),
    'window-frame': getColorValue('WindowFrame'),
    'window-text': getColorValue('WindowText'),
    'flat-menus': process.argv[3],
    'menu-animation': process.argv[4],
    'menu-shadow': process.argv[5],
    'scrollbar-size': process.argv[6] + 'px',
    'menu-height': process.argv[7] + 'px',
    'palette-title-height': process.argv[8] + 'px',
    'extra-border-size': process.argv[9] + 'px',
    'extra-title-height': process.argv[10] + 'px'
}

function getColorValue(name) {
    let rgb = themeText.match(`${name}=(.*)\r\n`);
    if (!rgb) {
        switch (name) {
            case 'ButtonAlternateFace':
                return '#B5B5B5';
            case 'GradientActiveTitle':
                return getColorValue('ActiveTitle');
            case 'GradientInactiveTitle':
                return getColorValue('InactiveTitle');
            case 'MenuBar':
                return getColorValue('Menu');
            case 'MenuHilight':
                return getColorValue('Hilight');
            case 'HotTrackingColor':
                return '#008080';
            default:
                throw new Error(`Color not found for ${name}`);
        }
    }
    return '#' + rgb[1].split(' ').map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

function generateCssScheme(scheme) {
    const belongsInWindow = [
        'extra-title-height',
        'extra-border-size',
    ];
    const shouldBeDeleted = [
    ];

    let cssScheme = `:root {\n`;
    for (const key in scheme) {
        if (belongsInWindow.includes(key) || shouldBeDeleted.includes(key)) {
            continue;
        }
        cssScheme += `    --${key}: ${scheme[key]};\n`;
    }
    cssScheme += "}\n.window {\n";
    for (const key of belongsInWindow) {
        if (scheme[key]) {
            cssScheme += `    --${key}: ${scheme[key]};\n`;
        }
    }
    cssScheme += "}";
    return cssScheme;
}

console.log(generateCssScheme(scheme));