// calc.js for ModernActiveDesktop Calculator
// Made by Ingan121
// Licensed under the MIT License

'use strict';

const menuBar = document.getElementById('menuBar');
const editMenuItem = document.querySelector('#editMenu .contextMenuItem');
const helpMenuItem = document.querySelector('#helpMenu .contextMenuItem');

const calcDisplay = document.getElementById('calcDisplay');

madDeskMover.menu = new MadMenu(menuBar, ['edit', 'view', 'help']);

editMenuItem.addEventListener('click', function () { // Copy button
    calcDisplay.select();
    document.execCommand('copy');
    calcDisplay.selectionStart = calcDisplay.selectionEnd;
});

helpMenuItem.addEventListener('click', function () { // About Calculator button
    madOpenConfig('about');
});