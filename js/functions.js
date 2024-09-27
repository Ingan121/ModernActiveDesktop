// functions.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

// Common shared functions go here

(function() {
    /**
      * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
      * 
      * @param {String} text The text to be rendered.
      * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
      * 
      * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
      */
    function getTextWidth(text, font = getComputedStyle(document.documentElement).getPropertyValue("--menu-font")) {
        // re-use canvas object for better performance
        const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
        const context = canvas.getContext("2d");
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
    }

    function scrollIntoView(elem) {
        const top = elem.getBoundingClientRect().top;
        const height = elem.getBoundingClientRect().height;
        const parentTop = elem.parentElement.getBoundingClientRect().top;
        const parentHeight = elem.parentElement.getBoundingClientRect().height;
        elem.parentElement.scrollBy(0, top - parentTop + height - parentHeight + 26);
    }

    
    // Convert rgb(red, green, blue) to #rrggbb
    function rgbToHex(rgbType) {
        const rgb = rgbType.replace(/[^%,.\d]/g, "").split(",");

        for (let x = 0; x < 3; x++) {
            if (rgb[x].indexOf("%") > -1) rgb[x] = Math.round(parseFloat(rgb[x]) * 2.55); 
        }

        const toHex = function(string) {
            string = parseInt(string, 10).toString(16);
            string = (string.length === 1) ? "0" + string : string;

            return string;
        };

        const r = toHex(rgb[0]);
        const g = toHex(rgb[1]);
        const b = toHex(rgb[2]);

        const hexType = "#" + r + g + b;

        return hexType;
    }

    // https://stackoverflow.com/a/44134328
    function hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    // Convert rgb, rgba, hsl, 3/4/8 digit hex to 6 digit hex
    function normalizeColor(color) {
        color = color.trim(color).replace("#", "");
        if (color === "silver") {
            color = "#c0c0c0";
        } else if (color === "navy") {
            color = "#000080";
        } else if (color.startsWith("hsl")) {
            color = hslToHex(...color.substring(4, color.length - 1).split(",").map(function(c) {
                return parseFloat(c);
            }));
        } else if (color.startsWith("rgb")) {
            color = rgbToHex(color);
        } else if (color.length === 6 || color.length === 8) {
            color = "#" + color.slice(0, 6);
        } else if (color.length === 3 || color.length === 4) {
            color = "#" + color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
        } else {
            // css color names other than those in minified 98.css are not supported yet
            throw new Error("Invalid color");
        }
        log(color);
        return color;
    }

    // http://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
    function isDarkColor(color) {
        if (!color.startsWith("#") || color.length !== 7) {
            color = parent.normalizeColor(color);
        }

        const c = color.substring(2);  // strip " #"
        const rgb = parseInt(c, 16);   // convert rrggbb to decimal
        const r = (rgb >> 16) & 0xff;  // extract red
        const g = (rgb >>  8) & 0xff;  // extract green
        const b = (rgb >>  0) & 0xff;  // extract blue

        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

        if (luma < 50) {
            return true;
        }
        return false;
    }

    // Convert WPE color format to #rrggbb
    function parseWallEngColorProp(value) {
        let customColor = value.split(' ');
        customColor = customColor.map(function(c) {
            return Math.ceil(c * 255);
        });
        return rgbToHex('rgb(' + customColor + ')');
    }

    // https://stackoverflow.com/a/35970186
    function invertColor(hex) {
        log(hex);
        if (!hex.includes('#') || hex.length !== 7) {
            hex = normalizeColor(hex);
        }
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            throw new Error('Invalid HEX color.');
        }
        // invert color components
        const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
            g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
            b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
        // pad each with zeros and return
        return '#' + padZero(r) + padZero(g) + padZero(b);

        function padZero(str, len) {
            len = len || 2;
            var zeros = new Array(len).join('0');
            return (zeros + str).slice(-len);
        }
    }

    async function flashElement(elem, isContextMenu) {
        if (isContextMenu) {
            elem.dataset.active = true;
            await asyncTimeout(100);
            delete elem.dataset.active;
            await asyncTimeout(100);
            elem.dataset.active = true;
            await asyncTimeout(100);
            delete elem.dataset.active;
        } else {
            elem.style.animation = "flash 0.5s linear";
            await asyncTimeout(500);
            elem.style.animation = "";
        }
        return;
    }

    async function waitForAnim(elem) {
        if (elem.style.animationName === "none") return;
        return new Promise(resolve => {
            elem.addEventListener('animationend', function () {
                resolve();
            });
        });
    }

    async function asyncTimeout(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    function getCaller() {
        const stack = new Error().stack;
        if (stack.includes("at ")) {
            return stack.split('\n')[3].trim().slice(3).split(' ')[0];
        } else {
            // Safari is weird
            return stack.split('\n')[2].split('@')[0];
        }
    }

    function preventDefault(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    window.getTextWidth = getTextWidth;
    window.scrollIntoView = scrollIntoView;
    window.rgbToHex = rgbToHex;
    window.hslToHex = hslToHex;
    window.normalizeColor = normalizeColor;
    window.isDarkColor = isDarkColor;
    window.parseWallEngColorProp = parseWallEngColorProp;
    window.invertColor = invertColor;
    window.flashElement = flashElement;
    window.waitForAnim = waitForAnim;
    window.asyncTimeout = asyncTimeout;
    window.getCaller = getCaller;
    window.preventDefault = preventDefault;
})();