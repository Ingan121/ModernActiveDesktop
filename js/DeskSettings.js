// DeskSettings.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

// This script handles configuration and settings of ModernActiveDesktop
// Dependencies (full): functions.js, MadSysPlug.js, patterns.js, debugging.js, main.js
// Dependencies vary depending on the features used

(function () {
    const bgHtmlContainer = document.getElementById("bgHtmlContainer");
    const bgHtmlView = document.getElementById("bgHtmlView");
    const bgVideoView = document.getElementById("bgVideo");
    const schemeElement = document.getElementById("scheme");
    const menuStyleElement = document.getElementById("menuStyle");
    const styleElement = document.getElementById("style");
    const mainMenuBg = document.getElementById("mainMenuBg");

    function loadConfigs() {
        if (localStorage.madesktopBgColor) {
            document.documentElement.style.backgroundColor = localStorage.madesktopBgColor;
        }
        if (localStorage.madesktopBgPattern) {
            document.documentElement.style.backgroundImage = `url('${genPatternImage(base64ToPattern(localStorage.madesktopBgPattern))}')`;
        }
        changeBgType(localStorage.madesktopBgType || "image");
        changeBgImgMode(localStorage.madesktopBgImgMode || "center");
        if (localStorage.madesktopBgVideoMuted) {
            bgVideoView.muted = true;
        }
        if (localStorage.madesktopDebugMode) {
            activateDebugMode();
        }
        changeColorScheme(localStorage.madesktopColorScheme || "98");
        changeAeroColor(localStorage.madesktopAeroColor);
        changeAeroGlass(localStorage.madesktopAeroNoGlass);
        changeWinAnim(localStorage.madesktopNoWinAnim);
        changeScale(localStorage.madesktopScaleFactor);
        changeFont(localStorage.madesktopNoPixelFonts);
        changeCmAnimation(localStorage.madesktopCmAnimation || "slide");
        changeCmShadow(localStorage.madesktopCmShadow);
        changeWinShadow(localStorage.madesktopNoWinShadow);
        changeMenuStyle(localStorage.madesktopMenuStyle);
        changeSoundScheme(localStorage.madesktopSoundScheme || "98");
    }

    function changeBgType(type, loadBgImg = window.madMainWindow) {
        switch(type) {
            case 'image':
                if (loadBgImg) {
                    loadBgImgConf();
                }
                bgHtmlContainer.style.display = "none";
                bgVideoView.style.display = "none";
                bgVideoView.src = "";
                break;
            case 'video':
                document.body.style.backgroundImage = "none";
                bgHtmlContainer.style.display = "none";
                bgVideoView.style.display = "block";
                bgVideoView.src = localStorage.madesktopBgVideo;
                break;
            case 'web':
                document.body.style.backgroundImage = "none";
                bgHtmlContainer.style.display = "block";
                bgVideoView.style.display = "none";
                bgVideoView.src = "";
                if (localStorage.madesktopBgHtmlSrc) {
                    if (localStorage.madesktopBgHtmlUnverified) {
                        bgHtmlView.src = "apps/unverifiedwarning/bghtml/index.html";
                    } else {
                        bgHtmlView.src = localStorage.madesktopBgHtmlSrc;
                    }
                } else {
                    bgHtmlView.src = "bghtml/index.html";
                }
                break;
        }
        // MADConf Wallpaper preview page
        if (!window.madMainWindow) {
            window.bgType = type;
        }
    }

    function changeBgColor(str) {
        log(str);
        document.documentElement.style.backgroundColor = str;
        if (str !== 'var(--background)') {
            localStorage.madesktopBgColor = str;
        } else {
            delete localStorage.madesktopBgColor;
        }
    }

    async function loadBgImgConf() {
        const idbBgImg = await madIdb.bgImg;
        if (idbBgImg) {
            const url = URL.createObjectURL(idbBgImg);
            document.body.style.backgroundImage = `url('${url}')`;
        } else if (localStorage.madesktopBgImg) {
            if (localStorage.madesktopBgImg.startsWith("file:///") || // Set in WPE
                localStorage.madesktopBgImg.startsWith("wallpapers/")) // Built-in wallpapers set in madconf
            {
                document.body.style.backgroundImage = "url('" + localStorage.madesktopBgImg + "')";
            } else { // Custom image set in madconf
                document.body.style.backgroundImage = "url('data:image/png;base64," + localStorage.madesktopBgImg + "')";
                // Migrate to indexedDB
                log("Migrating bgImg to indexedDB");
                await madIdb.setItem("bgImg", new Blob([base64ToArrayBuffer(localStorage.madesktopBgImg)], {type: 'image/png'}));
                delete localStorage.madesktopBgImg;
            }
        } else {
            document.body.style.backgroundImage = "none";
        }
    }

    function changeBgImgMode(value) {
        switch (value) {
            case "center": // Center
                document.body.style.backgroundSize = "auto";
                document.body.style.backgroundRepeat = "no-repeat";
                document.body.style.backgroundPosition = "center center";
                break;
            case "grid": // Tile
                document.body.style.backgroundSize = "auto";
                document.body.style.backgroundRepeat = "repeat";
                document.body.style.backgroundPosition = "left top";
                break;
            case "horizfit": // Fit
                document.body.style.backgroundSize = "contain";
                document.body.style.backgroundRepeat = "no-repeat";
                document.body.style.backgroundPosition = "center center";
                break;
            case "vertfit": // Fill
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundRepeat = "no-repeat";
                document.body.style.backgroundPosition = "center center";
                break;
            case "scale": // Stretch
                document.body.style.backgroundSize = "100% 100%";
                document.body.style.backgroundRepeat = "no-repeat";
                document.body.style.backgroundPosition = "center center";
                break;
        }
        // MADConf Wallpaper preview page
        if (!window.madMainWindow) {
            window.bgImgMode = value;
        }
    }

    function changeColorScheme(scheme) {
        if (scheme === "98") {
            schemeElement.href = "data:text/css,";
            delete localStorage.madesktopCustomColor;
            delete localStorage.madesktopSysColorCache;
            processTheme();
        } else if (scheme === "custom") {
            schemeElement.href = localStorage.madesktopCustomColor;
            delete localStorage.madesktopSysColorCache;
            processTheme();
        } else if (scheme.split('\n').length > 1) {
            const dataURL = `data:text/css,${encodeURIComponent(scheme)}`;
            schemeElement.href = dataURL;
            localStorage.madesktopCustomColor = dataURL;
            delete localStorage.madesktopSysColorCache;
            processTheme();
        } else if (scheme === "sys") {
            if (localStorage.madesktopSysColorCache) {
                schemeElement.href = localStorage.madesktopSysColorCache;
                processTheme();
            }

            madSysPlug.getSystemScheme()
                .then(responseText => {
                    const dataURL = `data:text/css,${encodeURIComponent(responseText)}`;
                    schemeElement.href = dataURL;
                    if (localStorage.madesktopSysColorCache !== dataURL) {
                        log("System color scheme updated", "log", "changeColorScheme");
                        localStorage.madesktopSysColorCache = dataURL; // Cache it as SysPlug startup is slower than high priority WPE startup
                        processTheme();
                        if (window.announce) {
                            announce("scheme-updated");
                        }
                    }
                })
                .catch(error => {
                    // Ignore it as SysPlug startup is slower than high priority WPE startup
                })

            delete localStorage.madesktopCustomColor;
        } else {
            schemeElement.href = `schemes/${scheme}.css`;
            delete localStorage.madesktopCustomColor;
            delete localStorage.madesktopSysColorCache;
        }

        try {
            document.documentElement.style.setProperty('--hilight-inverted', invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
        } catch {
            document.documentElement.style.setProperty('--hilight-inverted', 'var(--hilight-text)');
        }
    }

    function changeAeroColor(color) {
        document.documentElement.style.setProperty('--title-accent', color || '#4580c4');
    }

    function changeAeroGlass(noGlass) {
        if (localStorage.madesktopColorScheme === "7css4mad") {
            if (noGlass) {
                document.body.dataset.noGlass = true;
            } else {
                delete document.body.dataset.noGlass;
            }
        } else {
            delete document.body.dataset.noGlass;
        }
    }

    function changeWinAnim(noAnim) {
        if (getComputedStyle(document.documentElement).getPropertyValue('--win-open-anim') && getComputedStyle(document.documentElement).getPropertyValue('--win-close-anim')) {
            if (noAnim) {
                document.body.dataset.noAnim = true;
            } else {
                delete document.body.dataset.noAnim;
            }
        } else {
            delete document.body.dataset.noAnim;
        }
    }

    // Change the scaling factor
    function changeScale(scale) {
        window.scaleFactor = scale || 1;
        window.vWidth = window.innerWidth / window.scaleFactor;
        window.vHeight = window.innerHeight / window.scaleFactor;

        if ((window.vWidth < 640 || window.vHeight < 480) && window.scaleFactor > 1) {
            changeScale(1);
            delete localStorage.madesktopScaleFactor;
            if (window.madAlert) {
                madAlert("locid:MAD_MSG_SCALE_RESET");
            } else {
                window.addEventListener("load", () => {
                    madAlert("locid:MAD_MSG_SCALE_RESET");
                });
            }
            return;
        }

        document.documentElement.style.backgroundSize = `${8 * window.scaleFactor}px ${8 * window.scaleFactor}px`;
        document.body.style.zoom = scaleFactor;
        updateIframeScale();
        document.dispatchEvent(new Event("pointerup")); // Move all deskMovers inside the visible area
        log({
            scaleFactor: window.scaleFactor,
            vWidth: window.vWidth,
            vHeight: window.vHeight,
            dpi: 96 * window.scaleFactor
        });
    }

    // @unexported
    // Toggle between "Pixelated MS Sans Serif" and just sans-serif (only used with the legacy config localStorage.madesktopNoPixelFonts)
    function changeFont(isPixel) {
        if (isPixel) {
            document.documentElement.style.setProperty('--ui-font', 'sans-serif');
        } else {
            document.documentElement.style.removeProperty('--ui-font');
        }
    }

    // Change context menu animation
    function changeCmAnimation(type) {
        switch(type) {
            case "none":
                mainMenuBg.style.animation = "none";
                break;
            case "fade":
                mainMenuBg.style.animation = "fade 0.2s";
                break;
            case "slide":
                mainMenuBg.style.animation = "cmDropdownright 0.25s linear";
        }
    }

    // Change context menu shadow
    function changeCmShadow(isShadow) {
        if (isShadow) {
            document.body.dataset.cmShadow = true;
        } else {
            delete document.body.dataset.cmShadow;
        }
    }

    // Change window shadow
    function changeWinShadow(isNoShadow) {
        if (isNoShadow) {
            document.body.dataset.noWinShadow = true;
        } else {
            delete document.body.dataset.noWinShadow;
        }
    }

    // Change menu style
    function changeMenuStyle(style) {
        if (!style) {
            menuStyleElement.href = "";
        } else {
            menuStyleElement.href = `css/flatmenu-${style}.css`;
        }
    }

    // Change underline style
    function changeUnderline(show) {
        if (show) {
            delete document.body.dataset.noUnderline;
        } else {
            document.body.dataset.noUnderline = true;
        }
    }

    // Change sound scheme
    function changeSoundScheme(scheme) {
        switch (scheme) {
            case '3':
                soundScheme.startup = new Audio("sounds/95/tada.wav");
                soundScheme.question = new Audio("sounds/95/chord.wav");
                soundScheme.error = new Audio("sounds/95/chord.wav");
                soundScheme.warning = new Audio("sounds/95/chord.wav");
                soundScheme.info = new Audio("sounds/95/ding.wav");
                soundScheme.modal = new Audio("sounds/95/ding.wav");
                soundScheme.navStart = new Audio("sounds/start.wav");
                break;
            case '95':
                soundScheme.startup = new Audio("sounds/95/The Microsoft Sound.wav");
                soundScheme.question = new Audio("sounds/95/chord.wav");
                soundScheme.error = new Audio("sounds/95/chord.wav");
                soundScheme.warning = new Audio("sounds/95/chord.wav");
                soundScheme.info = new Audio("sounds/95/ding.wav");
                soundScheme.modal = new Audio("sounds/95/ding.wav");
                soundScheme.navStart = new Audio("sounds/start.wav");
                break;
            case 'nt4':
                soundScheme.startup = new Audio("sounds/NT4/Windows NT Logon Sound.wav");
                soundScheme.question = new Audio("sounds/95/chord.wav");
                soundScheme.error = new Audio("sounds/95/chord.wav");
                soundScheme.warning = new Audio("sounds/95/chord.wav");
                soundScheme.info = new Audio("sounds/95/ding.wav");
                soundScheme.modal = new Audio("sounds/95/ding.wav");
                soundScheme.navStart = new Audio("sounds/start.wav");
                break;
            case '98':
                soundScheme.startup = new Audio("sounds/The Microsoft Sound.wav");
                soundScheme.question = new Audio("sounds/chord.wav");
                soundScheme.error = new Audio("sounds/chord.wav");
                soundScheme.warning = new Audio("sounds/chord.wav");
                soundScheme.info = new Audio("sounds/ding.wav");
                soundScheme.modal = new Audio("sounds/ding.wav");
                soundScheme.navStart = new Audio("sounds/start.wav");
                break;
            case '2k':
                soundScheme.startup = new Audio("sounds/2000/Windows Logon Sound.wav");
                soundScheme.question = new Audio("sounds/chord.wav");
                soundScheme.error = new Audio("sounds/chord.wav");
                soundScheme.warning = new Audio("sounds/chord.wav");
                soundScheme.info = new Audio("sounds/ding.wav");
                soundScheme.modal = new Audio("sounds/ding.wav");
                soundScheme.navStart = new Audio("sounds/start.wav");
                break;
            case 'xp':
                soundScheme.startup = new Audio("sounds/XP/Windows XP Startup.wav");
                soundScheme.question = new Audio("sounds/XP/Windows XP Exclamation.wav");
                soundScheme.error = new Audio("sounds/XP/Windows XP Critical Stop.wav");
                soundScheme.warning = new Audio("sounds/XP/Windows XP Exclamation.wav");
                soundScheme.info = new Audio("sounds/XP/Windows XP Error.wav");
                soundScheme.modal = new Audio("sounds/XP/Windows XP Ding.wav");
                soundScheme.navStart = new Audio("sounds/XP/Windows XP Start.wav");
                break;
            case 'vista':
                soundScheme.startup = new Audio("sounds/Aero/Windows Logon Sound.wav"); // enable real startup sound :D
                soundScheme.question = new Audio("sounds/Aero/Windows Exclamation.wav");
                soundScheme.error = new Audio("sounds/Aero/Windows Critical Stop.wav");
                soundScheme.warning = new Audio("sounds/Aero/Windows Exclamation.wav");
                soundScheme.info = new Audio("sounds/Aero/Windows Error.wav");
                soundScheme.modal = new Audio("sounds/Aero/Windows Ding.wav");
                soundScheme.navStart = new Audio("sounds/Aero/Windows Navigation Start.wav");
                break;
            case '7':
                soundScheme.startup = new Audio("sounds/Aero/startup.wav");
                soundScheme.question = new Audio("sounds/Aero/Windows Exclamation.wav");
                soundScheme.error = new Audio("sounds/Aero/Windows Critical Stop.wav");
                soundScheme.warning = new Audio("sounds/Aero/Windows Exclamation.wav");
                soundScheme.info = new Audio("sounds/Aero/Windows Error.wav");
                soundScheme.modal = new Audio("sounds/Aero/Windows Ding.wav");
                soundScheme.navStart = new Audio("sounds/Aero/Windows Navigation Start.wav");
                break;
            case '8':
                soundScheme.startup = new Audio("sounds/Aero/startup.wav");
                // idk why but WPE uploader somehow hates these specific files so I converted these to flac
                soundScheme.question = new Audio("sounds/8/Windows Background.flac");
                soundScheme.error = new Audio("sounds/8/Windows Foreground.flac");
                soundScheme.warning = new Audio("sounds/8/Windows Background.flac");
                soundScheme.info = new Audio("sounds/8/Windows Background.flac");
                soundScheme.modal = new Audio("sounds/8/Windows Background.flac");
                soundScheme.navStart = new Audio("sounds/Aero/Windows Navigation Start.wav");
                break;
            case '10':
                soundScheme.startup = new Audio("sounds/Aero/startup.wav");
                soundScheme.question = new Audio("sounds/10/Windows Background.wav");
                soundScheme.error = new Audio("sounds/10/Windows Foreground.wav");
                soundScheme.warning = new Audio("sounds/10/Windows Background.wav");
                soundScheme.info = new Audio("sounds/10/Windows Background.wav");
                soundScheme.modal = new Audio("sounds/10/Windows Background.wav");
                soundScheme.navStart = new Audio("sounds/Aero/Windows Navigation Start.wav");
                break;
            case '11':
                soundScheme.startup = new Audio("sounds/11/startup.wav");
                soundScheme.question = new Audio("sounds/11/Windows Background.wav");
                soundScheme.error = new Audio("sounds/11/Windows Foreground.wav");
                soundScheme.warning = new Audio("sounds/11/Windows Background.wav");
                soundScheme.info = new Audio("sounds/11/Windows Background.wav");
                soundScheme.modal = new Audio("sounds/11/Windows Background.wav");
                soundScheme.navStart = new Audio("sounds/Aero/Windows Navigation Start.wav");
                break;
        }
    }

    function processTheme() {
        styleElement.textContent = generateThemeSvgs();
        if (localStorage.madesktopBgPattern) {
            document.documentElement.style.backgroundImage = `url('${genPatternImage(base64ToPattern(localStorage.madesktopBgPattern))}')`;
        }
    }

    function generateThemeSvgs(targetElement = document.documentElement) {
        const buttonFace = getComputedStyle(targetElement).getPropertyValue('--button-face');
        const buttonDkShadow = getComputedStyle(targetElement).getPropertyValue('--button-dk-shadow');
        const buttonHilight = getComputedStyle(targetElement).getPropertyValue('--button-hilight');
        const buttonLight = getComputedStyle(targetElement).getPropertyValue('--button-light');
        const buttonShadow = getComputedStyle(targetElement).getPropertyValue('--button-shadow');
        const buttonText = getComputedStyle(targetElement).getPropertyValue('--button-text');
        const windowColor = getComputedStyle(targetElement).getPropertyValue('--window');

        const scrollUp = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8 6H7V7H6V8H5V9H4V10H11V9H10V8H9V7H8V6Z" fill="${buttonText}"/></svg>`;
        const scrollDown = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8 6H4V7H5V8H6V9H7V10H8V9H9V8H10V7H11V6Z" fill="${buttonText}"/></svg>`;
        const scrollLeft = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6 4H8V5H7V6H6V7H5V8H6V9H7V10H8V11H9V4Z" fill="${buttonText}"/></svg>`;
        const scrollRight = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M10 4H6V11H7V10H8V9H9V8H10V7H9V6H8V5H7V4Z" fill="${buttonText}"/></svg>`;
        const scrollTrack = `<svg width="2" height="2" viewBox="0 0 2 2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M1 0H0V1H1V2H2V1H1V0Z" fill="${buttonFace}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M2 0H1V1H0V2H1V1H2V0Z" fill="${buttonHilight}"/></svg>`;
        const radioBorder = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8 0H4V1H2V2H1V4H0V8H1V10H2V8H1V4H2V2H4V1H8V2H10V1H8V0Z" fill="${buttonShadow}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1H4V2H2V3V4H1V8H2V9H3V8H2V4H3V3H4V2H8V3H10V2H8V1Z" fill="${buttonDkShadow}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9 3H10V4H9V3ZM10 8V4H11V8H10ZM8 10V9H9V8H10V9V10H8ZM4 10V11H8V10H4ZM4 10V9H2V10H4Z" fill="${buttonLight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11 2H10V4H11V8H10V10H8V11H4V10H2V11H4V12H8V11H10V10H11V8H12V4H11V2Z" fill="${buttonHilight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M4 2H8V3H9V4H10V8H9V9H8V10H4V9H3V8H2V4H3V3H4V2Z" fill="${windowColor}"/></svg>`;
        const radioBorderDisabled = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8 0H4V1H2V2H1V4H0V8H1V10H2V8H1V4H2V2H4V1H8V2H10V1H8V0Z" fill="${buttonShadow}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M8 1H4V2H2V3V4H1V8H2V9H3V8H2V4H3V3H4V2H8V3H10V2H8V1Z" fill="${buttonDkShadow}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9 3H10V4H9V3ZM10 8V4H11V8H10ZM8 10V9H9V8H10V9V10H8ZM4 10V11H8V10H4ZM4 10V9H2V10H4Z" fill="${buttonLight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11 2H10V4H11V8H10V10H8V11H4V10H2V11H4V12H8V11H10V10H11V8H12V4H11V2Z" fill="${buttonHilight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M4 2H8V3H9V4H10V8H9V9H8V10H4V9H3V8H2V4H3V3H4V2Z" fill="${buttonFace}"/></svg>`;
        const radioDot = `<svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3 0H1V1H0V2V3H1V4H3V3H4V2V1H3V0Z" fill="${buttonText}"/></svg>`;
        const radioDotDisabled = `<svg width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3 0H1V1H0V2V3H1V4H3V3H4V2V1H3V0Z" fill="${buttonShadow}"/></svg>`;
        const checkmark = `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7 0H6V1H5V2H4V3H3V4H2V3H1V2H0V5H1V6H2V7H3V6H4V5H5V4H6V3H7V0Z" fill="${buttonText}"/></svg>`;
        const checkmarkDisabled = `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7 0H6V1H5V2H4V3H3V4H2V3H1V2H0V5H1V6H2V7H3V6H4V5H5V4H6V3H7V0Z" fill="${buttonShadow}"/></svg>`;
        const indicatorThumb = `<svg width="11" height="21" viewBox="0 0 11 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0V16H2V18H4V20H5V19H3V17H1V1H10V0Z" fill="${buttonHilight}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M1 1V16H2V17H3V18H4V19H6V18H7V17H8V16H9V1Z" fill="${buttonFace}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M9 1H10V16H8V18H6V20H5V19H7V17H9Z" fill="${buttonShadow}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M10 0H11V16H9V18H7V20H5V21H6V19H8V17H10Z" fill="${buttonDkShadow}"/></svg>`;
        const seekHandle = `<svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 13 15" width="13" height="15">
            <rect fill="${buttonHilight}" x="0" y="0" width="11" height="1"/>
            <rect fill="${buttonHilight}" x="0" y="1" width="1" height="12"/>
            <rect fill="${buttonFace}" x="1" y="1" width="10" height="2"/>
            <rect fill="${buttonFace}" x="1" y="3" width="1" height="8"/>
            <rect fill="${buttonFace}" x="1" y="11" width="10" height="2"/>
            <rect fill="${buttonFace}" x="1" y="3" width="1" height="8"/>
            <rect fill="${buttonFace}" x="10" y="3" width="1" height="8"/>
            <rect fill="${buttonShadow}" x="2" y="3" width="8" height="1"/>
            <rect fill="${buttonShadow}" x="2" y="4" width="1" height="7"/>
            <rect fill="${buttonHilight}" x="3" y="4" width="7" height="1"/>
            <rect fill="${buttonDkShadow}" x="6" y="4" width="1" height="1"/>
            <rect fill="${buttonHilight}" x="3" y="10" width="7" height="1"/>
            <rect fill="${buttonDkShadow}" x="6" y="10" width="1" height="1"/>
            <rect fill="${buttonFace}" x="11" y="0" width="1" height="1"/>
            <rect fill="${buttonShadow}" x="11" y="1" width="1" height="13"/>
            <rect fill="${buttonShadow}" x="0" y="13" width="11" height="1"/>
            <rect fill="${buttonDkShadow}" x="0" y="14" width="13" height="1"/>
            <rect fill="${buttonDkShadow}" x="12" y="0" width="1" height="14"/></svg>`;
        const resizeArea = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 12 12" shape-rendering="crispEdges">
            <path stroke="${buttonHilight}" d="M11 0h1M10 1h1M9 2h1M8 3h1M7 4h1M11 4h1M6 5h1M10 5h1M5 6h1M9 6h1M4 7h1M8 7h1M3 8h1M7 8h1M11 8h1M2 9h1M6 9h1M10 9h1M1 10h1M5 10h1M9 10h1M0 11h1M4 11h1M8 11h1" />
            <path stroke="${buttonShadow}" d="M11 1h1M10 2h2M9 3h2M8 4h2M7 5h2M11 5h1M6 6h2M10 6h2M5 7h2M9 7h2M4 8h2M8 8h2M3 9h2M7 9h2M11 9h1M2 10h2M6 10h2M10 10h2M1 11h2M5 11h2M9 11h2" /></svg>`;
        const checkers = `<svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 2 2" width="2" height="2">
            <rect fill="${buttonHilight}" x="0" y="0" width="1" height="1"/>
            <rect fill="transparent" x="1" y="0" width="1" height="1"/>
            <rect fill="${buttonHilight}" x="1" y="1" width="1" height="1"/>
            <rect fill="transparent" x="0" y="1" width="1" height="1"/></svg>`;

        const css = `
        :root {
            --scroll-up: url("data:image/svg+xml,${encodeURIComponent(scrollUp)}");
            --scroll-down: url("data:image/svg+xml,${encodeURIComponent(scrollDown)}");
            --scroll-left: url("data:image/svg+xml,${encodeURIComponent(scrollLeft)}");
            --scroll-right: url("data:image/svg+xml,${encodeURIComponent(scrollRight)}");
            --scroll-track: url("data:image/svg+xml,${encodeURIComponent(scrollTrack)}");
            --radio-border: url("data:image/svg+xml,${encodeURIComponent(radioBorder)}");
            --radio-border-disabled: url("data:image/svg+xml,${encodeURIComponent(radioBorderDisabled)}");
            --radio-dot: url("data:image/svg+xml,${encodeURIComponent(radioDot)}");
            --radio-dot-disabled: url("data:image/svg+xml,${encodeURIComponent(radioDotDisabled)}");
            --checkmark: url("data:image/svg+xml,${encodeURIComponent(checkmark)}");
            --checkmark-disabled: url("data:image/svg+xml,${encodeURIComponent(checkmarkDisabled)}");
            --indicator-thumb: url("data:image/svg+xml,${encodeURIComponent(indicatorThumb)}");
            --seek-handle: url("data:image/svg+xml,${encodeURIComponent(seekHandle)}");
            --resize-area: url("data:image/svg+xml,${encodeURIComponent(resizeArea)}");
            --checkers: url("data:image/svg+xml,${encodeURIComponent(checkers)}");
        }`;
        return css;
    }

    // Detect WPE config change
    window.wallpaperPropertyListener = {
        applyUserProperties: function(properties) {
            log(properties);

            let isStartup = false;
            if (properties.schemecolor) {
                // Proper startup detection for Wallpaper Engine
                startup();

                // Only apply limited values on startup
                isStartup = true;
            }

            if (properties.bgcolor && !isStartup && localStorage.madesktopBgWeColor !== properties.bgcolor.value) {
                changeBgColor(parseWallEngColorProp(properties.bgcolor.value));
                localStorage.madesktopBgWeColor = properties.bgcolor.value;
            }
            if (properties.bgimg) {
                if (properties.bgimg.value) {
                    const path = "file:///" + properties.bgimg.value;
                    localStorage.madesktopBgWeImg = path;
                    if (!isStartup) {
                        document.body.style.backgroundImage = "url('" + path + "')";
                        delete madIdb.bgImg;
                        localStorage.madesktopBgImg = path;
                        localStorage.madesktopBgType = "image";
                        changeBgType("image");
                    }
                } else {
                    if (localStorage.madesktopBgWeImg === localStorage.madesktopBgImg && localStorage.madesktopBgWeImg !== undefined) {
                        document.body.style.backgroundImage = 'none';
                        delete localStorage.madesktopBgImg;
                    }
                    delete localStorage.madesktopBgWeImg;
                }
                if (window.confDeskMover) {
                    if (window.confDeskMover.config.src === "apps/madconf/background.html") {
                        window.confDeskMover.locReplace("apps/madconf/background.html");
                    }
                }
            }
            if (properties.bgvideo) {
                if (properties.bgvideo.value) {
                    const path = "file:///" + properties.bgvideo.value;
                    localStorage.madesktopBgVideo = path;
                    if (!isStartup) {
                        changeBgType("video");
                        bgVideoView.src = path;
                        document.body.style.backgroundImage = "none";
                        delete localStorage.madesktopBgImg;
                        localStorage.madesktopBgType = "video";
                    }
                } else {
                    if (localStorage.madesktopBgType === "video") {
                        changeBgType("image");
                        localStorage.madesktopBgType = "image";
                    }
                    bgVideoView.src = "";
                    delete localStorage.madesktopBgVideo;
                }
                if (window.confDeskMover) {
                    if (window.confDeskMover.config.src === "apps/madconf/background.html") {
                        window.confDeskMover.locReplace("apps/madconf/background.html");
                    }
                }
            }
            if (properties.additem && !isStartup) {
                openWindow();
            }
            if (properties.openproperties && !isStartup) {
                openConfig();
            }
            if (properties.audioprocessing) {
                if (properties.audioprocessing.value) {
                    delete localStorage.madesktopVisUnavailable;
                    if (!visDeskMover && !isStartup) {
                        openWindow("apps/visualizer/index.html", false, {
                            width: "725px",
                            height: "380px",
                            top: "200px",
                            left: "500px"
                        });
                    }
                } else {
                    localStorage.madesktopVisUnavailable = true;
                    if (visDeskMover) {
                        visDeskMover.closeWindow();
                    }
                }
            }
            if (properties.inputpanel && !isStartup) {
                if (msgboxBg.style.display === "block" && msgboxInput.style.display === "block") {
                    msgboxInput.focus();
                    const inputEvent = new Event("madinput");
                    if (properties.inputpanel.value.length > 1) { // Pasting
                        inputEvent.key = "/past " + properties.inputpanel.value;
                    } else {
                        inputEvent.key = properties.inputpanel.value;
                    }
                    document.dispatchEvent(inputEvent);
                }
            }
            if (properties.preseteditmode && !isStartup) {
                if (properties.preseteditmode.value) {
                    openWindow("PresetEditing.md", true);
                }
            }
            if (properties.copypreset && !isStartup) {
                copyPreset();
            }
            if (properties.preseturl) {
                if (properties.preseturl.value &&
                    properties.preseturl.value.startsWith("http") &&
                    properties.preseturl.value !== localStorage.madesktopLastPresetUrl
                ) {
                    const url = "apps/configdownloader/index.html?url=" + encodeURIComponent(properties.preseturl.value);
                    if (window.importDeskMover && !window.importDeskMover.destroyed) {
                        window.importDeskMover.locReplace(url);
                    } else {
                        const options = {
                            width: "435px",
                            height: "297px",
                            centered: true,
                            unresizable: true,
                            aot: true,
                            noIcon: true
                        };
                        window.importDeskMover = openWindow(url, true, options);
                    }
                }
                localStorage.madesktopLastPresetUrl = properties.preseturl.value;
            }
        }
    };

    // @unexported
    function copyPreset() {
        const keysToIgnore = [
            // Configs to be overwritten after the import is done
            'madesktopMigrationProgress',
            'madesktopForceRunStartup',
            // Configs used for tracking the WPE properties panel
            'madesktopVisUnavailable',
            'madesktopBgWeColor',
            'madesktopBgWeImg',
            'madesktopBgVideo',
            'madesktopLastPresetUrl',
            // Sensitive account information
            'madesktopVisSpotifyInfo',
            // Device specific configs
            'madesktopSysColorCache',
            // Legacy configs that existed before config export was introduced
            'madesktopLastCustomScale',
            'madesktopPrevOWConfigRequest',
            'madesktopDestroyedItems',
            'madesktopNonADStyle',
            'madesktopNoPixelFonts',
            // Debug configs without an exposed config UI (prevent troll configs)
            'madesktopDebugLangLoadDelay',
            // Temporary configs
            'madesktopFailCount',
            'madesktopConfigToImport',
            // Prevent security feature bypass
            'madesktopBgHtmlUnverified',
            // Configs specific to the user's environment
            'madesktopScaleFactor',
            'madesktopChanViewTopMargin',
            'madesktopChanViewBottomMargin',
            'madesktopChanViewLeftMargin',
            'madesktopChanViewRightMargin',
            'madesktopLang',
            'jspaint language',
            'sysplugIntegration',
            'madesktopVisMediaControls',
            'madesktopVisSpotifyEnabled',
            'madesktopCorsProxy',
            'madesktopVisLyricsSyncDelay',
            // Aggregated configs
            'madesktopSavedSchemes',
            'madesktopUserPatterns',
            // Miscellanous user preferences that doesn't affect the appearance
            'madesktopLinkOpenMode',
            'madesktopChanViewHome',
            'madesktopChanViewNoJs',
            'madesktopChanViewNoAutoFullscrn',
            'madesktopChanViewNoForceLoad',
            'madesktopHideWelcome',
            'madesktopCheckedChanges',
            'madesktopCheckedConfigs',
            'madesktopCheckedGitHub',
            'madesktopVisGuessTimeline',
            'madesktopVisLyricsForceUnsynced',
            'madesktopVisLyricsRanOnce',
            'madesktopVisLyricsNoCache',
            'madesktopVisLyricsCacheMax',
            'madesktopVisLyricsCacheExpiry',
            'madesktopVisLyricsLastCacheClean',
            'madesktopVisUseSpotifyAlbumArt',
            // Debug configs
            'madesktopDebugMode',
            'madesktopDebugLog',
        ];

        const madConfig = {};

        // Export MAD localStorage config
        for (const key in localStorage) {
            if ((key.startsWith("madesktop") || key === "sysplugIntegration" ||
                key.startsWith('image#') || key.startsWith('jspaint '))
                && !keysToIgnore.includes(key)
            ) {
                if (key === "madesktopBgImg") {
                    if (localStorage.madesktopBgImg === localStorage.madesktopBgWeImg) {
                        // Don't export the WPE image path; normalize it
                        madConfig[key] = "!wpewall";
                    }
                    continue;
                } else if (key === "madesktopBgHtmlSrc" && localStorage.madesktopBgHtmlSrc.startsWith("file:///")) {
                    // Don't export the local HTML file path
                    continue;
                }
                madConfig[key] = localStorage[key];
            }
        }
        // Don't export IDB configs
        // - bgImg: Don't include the image data in presets; just use the WPE properties panel and upload it as a preset
        //     Path references are still included as localStorage.madesktopBgImg
        // - cvFavorites: It's a aggregated user preference

        copyText(JSON.stringify(madConfig));
        madAlert(madGetString("MADCONF_CONF_COPIED"));
    }

    window.loadConfigs = loadConfigs;
    window.changeBgType = changeBgType;
    window.changeBgColor = changeBgColor;
    window.changeBgImgMode = changeBgImgMode;
    window.changeColorScheme = changeColorScheme;
    window.changeAeroColor = changeAeroColor;
    window.changeAeroGlass = changeAeroGlass;
    window.changeWinAnim = changeWinAnim;
    window.changeScale = changeScale;
    window.changeCmAnimation = changeCmAnimation;
    window.changeCmShadow = changeCmShadow;
    window.changeWinShadow = changeWinShadow;
    window.changeMenuStyle = changeMenuStyle;
    window.changeUnderline = changeUnderline;
    window.changeSoundScheme = changeSoundScheme;
    window.processTheme = processTheme;
    window.generateThemeSvgs = generateThemeSvgs;
})();