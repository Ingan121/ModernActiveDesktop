// patterns.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

(function () {
    // Generate pattern image from pattern
    /* pattern: [
        [first row],
        [second row],
        ...
        [eighth row],
        1: black, 0: transparent
    ] */
    function genPatternImage(pattern, colorRetrievingTarget = document.documentElement) {
        const canvas = genPatternImage.canvas || (genPatternImage.canvas = document.createElement("canvas"));
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext("2d");
        const patternColor = getComputedStyle(colorRetrievingTarget).getPropertyValue('--window-text');
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                ctx.fillStyle = pattern[i][j] ? patternColor : "transparent";
                ctx.fillRect(j, i, 1, 1);
            }
        }
        return canvas.toDataURL();
    }

    // Convert pattern to base64 (direct pattern binary to base64 conversion)
    function patternToBase64(pattern) {
        if (pattern.length !== 8) {
            throw new Error("Pattern must be 8x8");
        }
        const hex = new Uint8Array(8);
        let i = 0;
        for (const row of pattern) {
            for (let j = 0; j < 8; j++) {
                hex[i] = hex[i] | (row[j] << (7 - j));
            }
            i++;
        }
        return btoa(String.fromCharCode(...hex)).replaceAll("=", "");
    }

    // Convert base64 to pattern
    function base64ToPattern(base64) {
        try {
            const hex = atob(base64);
            const pattern = [];
            for (let i = 0; i < 8; i++) {
                pattern.push([]);
                for (let j = 0; j < 8; j++) {
                    pattern[i].push((hex.charCodeAt(i) >> (7 - j)) & 1);
                }
            }
            return pattern;
        } catch (error) {
            // Don't let trivial stuff break the whole thing
            console.error(error);
            return base64ToPattern("AAAAAAAAAAA");
        }
    }

    window.genPatternImage = genPatternImage;
    window.patternToBase64 = patternToBase64;
    window.base64ToPattern = base64ToPattern;
})();