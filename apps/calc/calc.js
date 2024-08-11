// calc.js for ModernActiveDesktop Calculator
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const menuBar = document.getElementById('menuBar');
const editMenuItems = document.querySelectorAll('#editMenu .contextMenuItem');
const helpMenuItem = document.querySelector('#helpMenu .contextMenuItem');

const calcDisplay = document.getElementById('calcDisplay');
const memStatus = document.getElementById('memStatus');

const buttons = document.querySelectorAll('button');

const backspace = document.getElementById('bksp');
const ce = document.getElementById('ce');
const c = document.getElementById('c');

const mc = document.getElementById('mc');
const mr = document.getElementById('mr');
const ms = document.getElementById('ms');
const mplus = document.getElementById('mplus');

const numButtons = document.querySelectorAll('.numButton');

const divide = document.getElementById('divide');
const multiply = document.getElementById('multiply');
const subtract = document.getElementById('subtract');
const add = document.getElementById('add');
const equals = document.getElementById('equals');

const plusMinus = document.getElementById('plusMinus');
const decimal = document.getElementById('decimal');

const sqrt = document.getElementById('sqrt');
const percent = document.getElementById('percent');
const reciproc = document.getElementById('reciproc');

let firstNum = 0;
let displayNum = '';
let lastOper = '';
let lastOperNum = 0;
let preCeNum = '';
let memNum = 0;
let copying = false;

madDeskMover.menu = new MadMenu(menuBar, ['edit', 'view', 'help']);

editMenuItems[0].addEventListener('click', function () { // Copy button
    copying = true;
    calcDisplay.select();
    if (calcDisplay.value.endsWith('.')) {
        calcDisplay.selectionEnd = calcDisplay.value.length - 1;
    }
    document.execCommand('copy');
    calcDisplay.selectionStart = calcDisplay.selectionEnd;
    copying = false;
    calcDisplay.blur();
});

editMenuItems[1].addEventListener('click', async function () { // Paste button
    let clipboard = '';
    if (localStorage.sysplugIntegration) {
        clipboard = await madSysPlug.getClipboard();
    } else if (madRunningMode === 0) {
        clipboard = await navigator.clipboard.readText();
    }
    if (clipboard) {
        handlePaste(clipboard);
    }
});

helpMenuItem.addEventListener('click', function () { // About Calculator button
    madOpenConfig('about');
});

// Prevent focus
for (const button of buttons) {
    button.addEventListener('pointerdown', function (event) {
        event.preventDefault();
    });
}

calcDisplay.addEventListener('focus', function () {
    if (!copying) {
        calcDisplay.blur();
    }
});

backspace.addEventListener('click', function () {
    if (isNaN(calcDisplay.value) || (!displayNum && calcDisplay.value !== '0.')) {
        madPlaySound("modal");
        return;
    }
    displayNum = displayNum.slice(0, -1);
    updateDisplay();
});

ce.addEventListener('click', function () {
    preCeNum = calcDisplay.value;
    displayNum = '';
    updateDisplay();
});

c.addEventListener('click', function () {
    firstNum = 0;
    displayNum = '';
    preCeNum = '';
    lastOperNum = 0;
    lastOper = '';
    updateDisplay();
});

mc.addEventListener('click', function () {
    memNum = 0;
    memStatus.style.display = 'none';
});

mr.addEventListener('click', function () {
    displayNum = memNum.toString();
    updateDisplay();
    displayNum = '';
});

ms.addEventListener('click', function () {
    memNum = parseFloat(displayNum || 0);
    memStatus.style.display = 'block';
});

mplus.addEventListener('click', function () {
    memNum += parseFloat(displayNum || 0);
});

for (const numButton of numButtons) {
    numButton.addEventListener('click', function () {
        if (isNaN(calcDisplay.value)) { // If the display is showing an error message
            madPlaySound("modal");
            return;
        }
        if (displayNum === '0') {
            displayNum = '';
        }
        displayNum += numButton.textContent;
        updateDisplay();
    });
}

decimal.addEventListener('click', function () {
    if (isNaN(calcDisplay.value)) {
        madPlaySound("modal");
        return;
    }
    if (!displayNum.includes('.')) {
        displayNum += '.';
    }
});

plusMinus.addEventListener('click', function () {
    if (isNaN(calcDisplay.value)) {
        madPlaySound("modal");
        return;
    }
    if (calcDisplay.value !== '0.') {
        displayNum = (parseFloat(calcDisplay.value) * -1).toString();
        updateDisplay();
    }
});

sqrt.addEventListener('click', function () {
    if (isNaN(calcDisplay.value)) {
        madPlaySound("modal");
        return;
    }
    if (parseFloat(calcDisplay.value) < 0) {
        calcDisplay.value = madGetString("CALC_ERROR_NEGATIVE_SQRT");
        displayNum = '';
        return;
    }
    displayNum = Math.sqrt(parseFloat(calcDisplay.value)).toString();
    updateDisplay();
});

percent.addEventListener('click', function () {
    if (isNaN(calcDisplay.value)) {
        madPlaySound("modal");
        return;
    }
    if (displayNum) {
        if (firstNum) {
            displayNum = (parseFloat(displayNum) * parseFloat(firstNum) / 100).toString();
        } else {
            displayNum = '0';
        }
        updateDisplay();
    }
});

reciproc.addEventListener('click', function () {
    if (isNaN(calcDisplay.value)) {
        madPlaySound("modal");
        return;
    }
    displayNum = (1 / parseFloat(displayNum || 0)).toString();
    updateDisplay();
});

divide.addEventListener('click', function () {
    if (isNaN(calcDisplay.value)) {
        madPlaySound("modal");
        return;
    }
    if (firstNum && displayNum) {
        calc();
    }
    firstNum = parseFloat(displayNum || calcDisplay.value || 0);
    displayNum = '';
    lastOper = 'divide';
    lastOperNum = 0;
    preCeNum = '';
});

multiply.addEventListener('click', function () {
    if (isNaN(calcDisplay.value)) {
        madPlaySound("modal");
        return;
    }
    if (firstNum && displayNum) {
        calc();
    }
    firstNum = parseFloat(displayNum || calcDisplay.value || 0);
    displayNum = '';
    lastOper = 'multiply';
    lastOperNum = 0;
    preCeNum = '';
});

subtract.addEventListener('click', function () {
    if (isNaN(calcDisplay.value)) {
        madPlaySound("modal");
        return;
    }
    if (firstNum && displayNum) {
        calc();
    }
    firstNum = parseFloat(displayNum || calcDisplay.value || 0);
    displayNum = '';
    lastOper = 'subtract';
    lastOperNum = 0;
    preCeNum = '';
});

add.addEventListener('click', function () {
    if (isNaN(calcDisplay.value)) {
        madPlaySound("modal");
        return;
    }
    if (firstNum && displayNum) {
        calc();
    }
    firstNum = parseFloat(displayNum || calcDisplay.value || 0);
    displayNum = '';
    lastOper = 'add';
    lastOperNum = 0;
    preCeNum = '';
});

equals.addEventListener('click', function () {
    calc(true);
});

function calc(repeat) {
    if ((lastOperNum !== 0 || preCeNum) && repeat) {
        if (isNaN(preCeNum)) {
            calcDisplay.value = preCeNum;
            return;
        }
        firstNum = parseFloat(preCeNum || calcDisplay.value || 0);
        switch (lastOper) {
            case 'add':
                displayNum = (firstNum + lastOperNum).toString();
                break;
            case 'subtract':
                displayNum = (firstNum - lastOperNum).toString();
                break;
            case 'multiply':
                displayNum = (firstNum * lastOperNum).toString();
                break;
            case 'divide':
                displayNum = (firstNum / lastOperNum).toString();
                break;
            default:
                return;
        }
    } else {
        lastOperNum = parseFloat(displayNum || firstNum);
        switch (lastOper) {
            case 'add':
                displayNum = (firstNum + lastOperNum).toString();
                break;
            case 'subtract':
                displayNum = (firstNum - lastOperNum).toString();
                break;
            case 'multiply':
                displayNum = (firstNum * lastOperNum).toString();
                break;
            case 'divide':
                displayNum = (firstNum / lastOperNum).toString();
                break;
            default:
                return;
        }
    }
    updateDisplay();
    displayNum = '';
    preCeNum = '';
    firstNum = 0;
}

function updateDisplay() {
    if (displayNum === '') {
        calcDisplay.value = '0.';
    } else {
        if (displayNum === 'Infinity') {
            calcDisplay.value = madGetString("CALC_ERROR_POSITIVE_INFINITY");
        } else if (displayNum === '-Infinity') {
            calcDisplay.value = madGetString("CALC_ERROR_NEGATIVE_INFINITY");
        } else if (displayNum === 'NaN') {
            calcDisplay.value = madGetString("CALC_ERROR_NAN");
        } else if (displayNum.includes('.')) {
            calcDisplay.value = displayNum;
        } else {
            calcDisplay.value = displayNum + '.';
        }
    }
}

function clickButton(elem) {
    if (localStorage.madesktopColorScheme !== 'xpcss4mad') {
        elem.dataset.active = true;
    }
    elem.click();
    setTimeout(() => {
        delete elem.dataset.active;
    }, 100);
}

function handleInput(event) {
    if (event.key === 'Escape') {
        clickButton(c);
    } else if (event.key === 'Delete') {
        clickButton(ce);
    } else if (event.key === 'Backspace') {
        clickButton(backspace);
    } else if (event.key === 'Enter' || event.key === '=' || event.key === '\n') {
        clickButton(equals);
    } else if (event.key === '0') {
        clickButton(numButtons[9]);
    } else if (event.key === '1') {
        clickButton(numButtons[6]);
    } else if (event.key === '2') {
        clickButton(numButtons[7]);
    } else if (event.key === '3') {
        clickButton(numButtons[8]);
    } else if (event.key === '4') {
        clickButton(numButtons[3]);
    } else if (event.key === '5') {
        clickButton(numButtons[4]);
    } else if (event.key === '6') {
        clickButton(numButtons[5]);
    } else if (event.key === '7') {
        clickButton(numButtons[0]);
    } else if (event.key === '8') {
        clickButton(numButtons[1]);
    } else if (event.key === '9') {
        clickButton(numButtons[2]);
    } else if (event.key === '.' || event.key === ',') {
        clickButton(decimal);
    } else if (event.key === '+') {
        clickButton(add);
    } else if (event.key === '-') {
        clickButton(subtract);
    } else if (event.key === '*') {
        clickButton(multiply);
    } else if (event.key === '/') {
        clickButton(divide);
    } else if (event.key === 'F9') {
        clickButton(plusMinus);
    } else if (event.key === '@') {
        clickButton(sqrt);
    } else if (event.key === '%') {
        clickButton(percent);
    } else if (event.key === 'r') {
        clickButton(reciproc);
    } else if (event.key === 'p' && event.ctrlKey) {
        clickButton(mplus);
    } else if (event.key === 'r' && event.ctrlKey) {
        clickButton(mr);
    } else if (event.key === 'm' && event.ctrlKey) {
        clickButton(ms);
    } else if (event.key === 'l' && event.ctrlKey) {
        clickButton(mc);
    } else if (event.key === 'c' && event.ctrlKey) {
        editMenuItems[0].click();
    } else if (event.key === 'v' && event.ctrlKey) {
        editMenuItems[1].click();
    }
}

function handlePaste(string) {
    for (const char of string) {
        // This is how the old Windows Calculator handles pasting
        handleInput({ key: char });
    }
}

document.addEventListener('keydown', handleInput);