// clock.js for ModernActiveDesktop Clock
// Made by Ingan121
// Licensed under the MIT License

'use strict';

const mainArea = document.getElementById('mainArea');
const clockCanvas = document.getElementById('analogClock');
const clockCtx = clockCanvas.getContext('2d');

const menuBar = document.getElementById('menuBar');
const settingsMenuBtn = document.getElementById('settingsMenuBtn');
const settingsMenuBg = document.getElementById('settingsMenuBg');
const settingsMenu = document.getElementById('settingsMenu');
const settingsMenuItems = settingsMenu.querySelectorAll('.contextMenuItem');

let dblClickTimer, dblClickPositon = null, isTitleHidden = false;

if (madDeskMover.config.noFrames) {
    toggleTitle();
}

settingsMenuBtn.addEventListener('pointerdown', (event) => {
    openSettingsMenu();
    event.preventDefault(); // Prevent focusout event
    madDeskMover.bringToTop(); // But keep the window activation working
});

settingsMenuItems[2].addEventListener('click', () => { // Set Font button
    closeSettingsMenu();
    const left = parseInt(madDeskMover.config.xPos) + 25 + 'px';
    const top = parseInt(madDeskMover.config.yPos) + 80 + 'px';
    const configWindow = madOpenWindow('apps/clock/config.html', true, '400px', '260px', 'wnd', false, top, left, true, true);
    configWindow.windowElement.addEventListener('load', () => {
        configWindow.windowElement.contentWindow.targetDeskMover = madDeskMover;
    });
});

settingsMenuItems[3].addEventListener('click', function () { // GMT button
    closeSettingsMenu();
    if (localStorage.madesktopClockGMT) {
        this.classList.remove('checkedItem');
        delete localStorage.madesktopClockGMT;
    } else {
        this.classList.add('checkedItem');
        localStorage.madesktopClockGMT = true;
    }
    drawClock();
});

settingsMenuItems[4].addEventListener('click', () => { // No Title button
    closeSettingsMenu();
    toggleTitle();
});

settingsMenuItems[5].addEventListener('click', function () { // Seconds button
    closeSettingsMenu();
    if (localStorage.madesktopClockHideSeconds) {
        this.classList.add('checkedItem');
        delete localStorage.madesktopClockHideSeconds;
    } else {
        this.classList.remove('checkedItem');
        localStorage.madesktopClockHideSeconds = true;
    }
    drawClock();
});

settingsMenuItems[6].addEventListener('click', function () { // Date button
    closeSettingsMenu();
    if (localStorage.madesktopClockHideDate) {
        this.classList.add('checkedItem');
        delete localStorage.madesktopClockHideDate;
    } else {
        this.classList.remove('checkedItem');
        localStorage.madesktopClockHideDate = true;
    }
    drawClock();
});

settingsMenuItems[7].addEventListener('click', () => { // About Clock button
    closeSettingsMenu();
    madOpenConfig('about');
});

settingsMenuBg.addEventListener('focusout', closeSettingsMenu);

function openSettingsMenu() {
    switch (localStorage.madesktopCmAnimation) {
        case 'none':
            settingsMenuBg.style.animation = 'none';
            break;
        case 'slide':
            settingsMenuBg.style.animation = 'cmDropdown 0.25s linear';
            break;
        case 'fade':
            settingsMenuBg.style.animation = 'fade 0.2s';
    }
    settingsMenuBg.style.left = settingsMenuBtn.offsetLeft + 'px';
    settingsMenuBg.style.display = 'block';
    settingsMenuBtn.dataset.active = true;
    settingsMenuBg.focus();
}

function closeSettingsMenu() {
    settingsMenuBg.style.display = 'none';
    delete settingsMenuBtn.dataset.active;
}

if (localStorage.madesktopClockGMT) {
    settingsMenuItems[3].classList.add('checkedItem');
}

if (localStorage.madesktopClockHideSeconds) {
    settingsMenuItems[5].classList.remove('checkedItem');
}

if (localStorage.madesktopClockHideDate) {
    settingsMenuItems[6].classList.remove('checkedItem');
}

const colors = {
    main: '#008080',
    light: '#00ffff',
    hilight: '#ffffff',
    shadow: '#a0a0a0',
    dkShadow: '#000000',
    background: getComputedStyle(document.documentElement).getPropertyValue('--button-face')
}

updateSize();

function updateSize() {
    if (mainArea.offsetHeight > mainArea.offsetWidth) {
        clockCanvas.style.height = 'auto';
        clockCanvas.style.width = '100%';
    } else {
        clockCanvas.style.height = '100%';
        clockCanvas.style.width = 'auto';
    }
    const clientRect = clockCanvas.getBoundingClientRect();
    clockCanvas.height = Math.round(clientRect.height * madScaleFactor);
    clockCanvas.width = Math.round(clientRect.width * madScaleFactor);
    drawClock();
}

function drawBackground() {
    clockCtx.filter = "url(#remove-alpha)";
    const radius = clockCanvas.width / 2;
    clockCtx.beginPath();
    clockCtx.arc(radius, radius, radius, 0, 2 * Math.PI);
    clockCtx.fillStyle = colors.background;
    clockCtx.fill();
}

function drawSquare(x, y) {
    const size = Math.round(clockCanvas.width / 135);
    x -= Math.round(size / 2);
    y -= Math.round(size / 2);
    clockCtx.fillStyle = colors.light;
    clockCtx.fillRect(x - 1, y - 1, size + 1, size + 2);
    clockCtx.fillStyle = colors.dkShadow;
    clockCtx.fillRect(x, y, size + 1, size + 1);
    clockCtx.fillRect(x + size, y - 1, 1, 1);
    clockCtx.fillStyle = colors.main;
    clockCtx.fillRect(x, y, size, size);
}

function drawSmallSquare(x, y) {
    clockCtx.fillStyle = colors.shadow;
    clockCtx.fillRect(x - 1, y - 1, 2, 2);
    clockCtx.fillStyle = colors.hilight;
    clockCtx.fillRect(x, y, 2, 2);
    clockCtx.fillStyle = colors.background;
    clockCtx.fillRect(x, y, 1, 1);
}

function drawNumbers() {
    const radius = clockCanvas.width / 2;
    clockCtx.translate(radius, radius);
    for(let num = 0; num < 12 * 5; num++){
      let ang = num * Math.PI / 30;
      clockCtx.rotate(ang);
      clockCtx.translate(0, -radius * 0.97);
      clockCtx.rotate(-ang);
      if (num % 5 === 0) {
        drawSquare(0, 0);
      } else {
        drawSmallSquare(0, 0);
      }
      clockCtx.rotate(ang);
      clockCtx.translate(0, radius * 0.97);
      clockCtx.rotate(-ang);
    }
}

function drawHourHand(time) {
    clockCtx.resetTransform();
    const radius = clockCanvas.width / 2;
    let minute = time.getMinutes();
    let hour = time.getHours();
    hour = hour + minute / 60;
    let angle = (Math.PI / 6) * hour - Math.PI / 2;
    clockCtx.beginPath();
    const startPoint = [radius - radius * 0.15 * Math.cos(angle), radius - radius * 0.15 * Math.sin(angle)]
    const narrowSide1 = [radius - radius * 0.07 * Math.cos(angle + Math.PI / 2), radius - radius * 0.07 * Math.sin(angle + Math.PI / 2)];
    const narrowSide2 = [radius - radius * 0.07 * Math.cos(angle - Math.PI / 2), radius - radius * 0.07 * Math.sin(angle - Math.PI / 2)];
    const endPoint = [radius + radius * 0.6 * Math.cos(angle), radius + radius * 0.6 * Math.sin(angle)]
    clockCtx.moveTo(startPoint[0], startPoint[1]);
    clockCtx.lineTo(narrowSide1[0], narrowSide1[1]);
    clockCtx.lineTo(endPoint[0], endPoint[1]);
    clockCtx.lineTo(narrowSide2[0], narrowSide2[1]);
    clockCtx.lineTo(startPoint[0], startPoint[1]);
    clockCtx.lineWidth = 1;
    clockCtx.stroke();
    clockCtx.fillStyle = colors.main;
    clockCtx.fill();
    clockCtx.beginPath();
    clockCtx.moveTo(endPoint[0], endPoint[1]);
    clockCtx.lineTo(narrowSide2[0], narrowSide2[1]);
    clockCtx.lineTo(startPoint[0], startPoint[1]);
    clockCtx.strokeStyle = angle > 1.5 ? colors.hilight : colors.shadow;
    clockCtx.lineWidth = 2;
    clockCtx.stroke();
    clockCtx.beginPath();
    clockCtx.moveTo(startPoint[0], startPoint[1]);
    clockCtx.lineTo(narrowSide1[0], narrowSide1[1]);
    clockCtx.lineTo(endPoint[0], endPoint[1]);
    clockCtx.strokeStyle = angle > 1.5 ? colors.shadow : colors.hilight;
    clockCtx.lineWidth = 2;
    clockCtx.stroke();
}

function drawMinuteHand(time) {
    clockCtx.resetTransform();
    const radius = clockCanvas.width / 2;
    let minute = time.getMinutes();
    let angle = (Math.PI / 30) * minute - Math.PI / 2;
    clockCtx.beginPath();
    const startPoint = [radius - radius * 0.15 * Math.cos(angle), radius - radius * 0.15 * Math.sin(angle)]
    const narrowSide1 = [radius - radius * 0.05 * Math.cos(angle + Math.PI / 2), radius - radius * 0.05 * Math.sin(angle + Math.PI / 2)];
    const narrowSide2 = [radius - radius * 0.05 * Math.cos(angle - Math.PI / 2), radius - radius * 0.05 * Math.sin(angle - Math.PI / 2)];
    const endPoint = [radius + radius * 0.8 * Math.cos(angle), radius + radius * 0.8 * Math.sin(angle)]
    clockCtx.moveTo(startPoint[0], startPoint[1]);
    clockCtx.lineTo(narrowSide1[0], narrowSide1[1]);
    clockCtx.lineTo(endPoint[0], endPoint[1]);
    clockCtx.lineTo(narrowSide2[0], narrowSide2[1]);
    clockCtx.lineTo(startPoint[0], startPoint[1]);
    clockCtx.lineWidth = 1;
    clockCtx.stroke();
    clockCtx.fillStyle = colors.main;
    clockCtx.fill();
    clockCtx.beginPath();
    clockCtx.moveTo(endPoint[0], endPoint[1]);
    clockCtx.lineTo(narrowSide2[0], narrowSide2[1]);
    clockCtx.lineTo(startPoint[0], startPoint[1]);
    clockCtx.strokeStyle = angle > 1.5 ? colors.hilight : colors.shadow;
    clockCtx.lineWidth = 2;
    clockCtx.stroke();
    clockCtx.beginPath();
    clockCtx.moveTo(startPoint[0], startPoint[1]);
    clockCtx.lineTo(narrowSide1[0], narrowSide1[1]);
    clockCtx.lineTo(endPoint[0], endPoint[1]);
    clockCtx.strokeStyle = angle > 1.5 ? colors.shadow : colors.hilight;
    clockCtx.lineWidth = 2;
    clockCtx.stroke();
}


function drawSecondHand(time) {
    clockCtx.resetTransform();
    const radius = clockCanvas.width / 2;
    let second = time.getSeconds();
    let angle = (Math.PI / 30) * second - Math.PI / 2;
    clockCtx.beginPath();
    clockCtx.moveTo(radius, radius);
    const endPoint = [radius + radius * 0.8 * Math.cos(angle), radius + radius * 0.8 * Math.sin(angle)]
    clockCtx.lineTo(endPoint[0], endPoint[1]);
    clockCtx.globalCompositeOperation = 'difference';
    clockCtx.strokeStyle='white';
    clockCtx.lineWidth = 1;
    clockCtx.stroke();
    clockCtx.globalCompositeOperation = 'source-over';
}

function drawClock() {
    clockCtx.clearRect(0, 0, clockCanvas.width, clockCanvas.height);
    drawBackground();
    drawNumbers();
    let time;
    if (localStorage.madesktopClockGMT) {
        const now = new Date();
        const offset = now.getTimezoneOffset() / 60;
        time = new Date(now.getTime() + offset * 60 * 60 * 1000);
    } else {
        time = new Date();
    }
    drawHourHand(time);
    drawMinuteHand(time);
    if (!localStorage.madesktopClockHideSeconds) {
        drawSecondHand(time);
    }
    if (localStorage.madesktopClockHideDate) {
        document.title = "Clock";
    } else {
        document.title = "Clock - " + new Date().toLocaleDateString();
    }
}

setInterval(drawClock, 1000);

window.addEventListener("message", (event) => {
    if (event.data.type === "scheme-updated") {
        if (localStorage.madesktopColorScheme !== 'custom' && localStorage.madesktopColorScheme !== '98') {
            location.reload();
        }
        colors.background = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
        drawClock();
    }
});

window.addEventListener('resize', updateSize);
window.addEventListener('load', function () {
    colors.background = getComputedStyle(document.documentElement).getPropertyValue('--button-face');
    updateSize();
});

document.addEventListener('click', (event) => {
    if (dblClickPositon !== null && event.clientX === dblClickPositon.x && event.clientY === dblClickPositon.y) {
        clearTimeout(dblClickTimer);
        dblClickPositon = null;
        toggleTitle();
    }
    dblClickPositon = { x: event.clientX, y: event.clientY };
    dblClickTimer = setTimeout(() => {
        dblClickPositon = null;
    }, 500);
});

function toggleTitle() {
    if (isTitleHidden) {
        menuBar.style.display = 'flex';
        madChangeWndStyle('wnd');
        isTitleHidden = false;
    } else {
        menuBar.style.display = 'none';
        madChangeWndStyle('noframes');
        isTitleHidden = true;
    }
}

// Listen for scale change
new MutationObserver(function (mutations) {
    updateSize();
}).observe(
    document.body,
    { attributes: true, attributeFilter: ["style"] }
);