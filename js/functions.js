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
    window.getTextWidth = getTextWidth;
})();