// main.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

// This is the main MAD JavaScript file

(function () {
    // #region Constants and variables
    const windowContainerBase = document.getElementsByClassName("windowContainer")[0];
    const bgHtmlView = document.getElementById("bgHtmlView");
    const msgboxBg = document.getElementById("msgboxBg");
    const msgbox = document.getElementById("msgbox");
    const msgboxTitlebar = msgbox.getElementsByClassName("title-bar")[0];
    const msgboxTitlebarText = msgboxTitlebar.getElementsByClassName("title-bar-text")[0];
    const msgboxMessage = document.getElementById("msgbox-msg");
    const msgboxIcon = document.getElementById("msgbox-icon");
    const msgboxCloseBtn = document.getElementById("msgbox-close");
    const msgboxBtn1 = document.getElementById("msgbox-btn1");
    const msgboxBtn2 = document.getElementById("msgbox-btn2");
    const msgboxBtn3 = document.getElementById("msgbox-btn3");
    const osk = document.getElementById("osk");
    const oskTitlebar = osk.getElementsByClassName("title-bar")[0];
    const oskWindow = document.getElementById("oskWindow");
    const mainMenuBg = document.getElementById("mainMenuBg");
    const mainMenu = document.getElementById("mainMenu");
    const mainMenuItems = mainMenu.getElementsByClassName("contextMenuItem");
    const kbdSupportLabel = document.getElementById("kbdsupport");
    const debugMenu = document.getElementById("debug");

    const isWin10 = navigator.userAgent.includes('Windows NT 10.0');

    let startupRan = false;
    let flashInterval;
    let msgboxLoopDetector = null;
    let msgboxMsgChangeDetector = null;
    let msgboxLoopCount = 0;
    let showedStorageFullAlert = false;
    let lastTempDeskMoverNum = -1;

    window.soundScheme = {};

    window.msgboxInput = document.getElementById("msgbox-input");

    window.isContextMenuOpen = false;
    window.openedMenu = null;
    window.openedMenuCloseFunc = null;

    window.activeWindow = 0;
    window.activeWindowHistory = [0];

    // Running modes:
    // 1 = Wallpaper Engine
    // 2 = Lively Wallpaper
    // 0 = Browser (None of the above)
    window.runningMode = 0;
    window.origRunningMode = 0;

    // Keyboard support levels:
    // 1 = Keyboard supported (normal browsers, Lively Wallpaper - keyboard must be enabled in LW settings)
    // 0 = Keyboard supported with prompt() (WPE 2.4 and below; uses either MadInput or prompt())
    // -1 = Keyboard not supported (WPE 2.5 and above; uses either MadInput or OSK)
    window.kbdSupport = 1;

    // Display scaling related variables
    window.scaleFactor = "1";
    window.vWidth = window.innerWidth;
    window.vHeight = window.innerHeight;
    window.isIframeAutoScaled = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)?.[2] >= 128;

    // Every DeskMover instance is stored in this object
    window.deskMovers = {};
    // DeskMovers of apps with single-instance enforcement
    window.visDeskMover = null;
    window.confDeskMover = null;

    // #region Early function exports
    window.activateWindow = activateWindow;
    window.iframeClickEventCtrl = iframeClickEventCtrl;
    window.updateIframeScale = updateIframeScale;
    window.hookIframeSize = hookIframeSize;
    window.menuNavigationHandler = menuNavigationHandler;
    // #endregion
    // #endregion

    // #region Initialization
    if (parent !== window) {
        // Running MAD inside MAD will cause unexpected behavior
        throw new Error("Refusing to load inside an iframe");
    }
    logTimed(`ModernActiveDesktop ${madVersion.toString(0)} load started`);

    // Data migration from www.ingan121.com to madesktop.ingan121.com
    if (location.href.startsWith("https://madesktop.ingan121.com/") && !localStorage.madesktopMigrationProgress) {
        localStorage.madesktopMigrationProgress = 0;
        bgHtmlView.src = "https://www.ingan121.com/mad/migrator.html";
        window.addEventListener('message', function (event) {
            if (event.origin !== 'https://www.ingan121.com') {
                return;
            }
            const data = event.data;
            if (data.type === 'migrate') {
                for (const key in data.config) {
                    localStorage.setItem(key, data.config[key]);
                }
                if (localStorage.madesktopLastVer) {
                    localStorage.madesktopMigrationProgress++;
                } else {
                    // No data to migrate, so no need to run stage 2 to clear configs at www.ingan121.com
                    localStorage.madesktopMigrationProgress = 2;
                }
                location.reload();
            }
        });
        throw new Error("Data migration check in progress... (Retrying will abort the migration process.)");
    }

    // Load configs
    if (!localStorage.madesktopItemCount) {
        localStorage.madesktopItemCount = 1;
        localStorage.madesktopOpenWindows = "0";
    }

    if (!isWin10) {
        delete localStorage.sysplugIntegration;
    }

    loadConfigs();

    if (localStorage.madesktopItemVisible === "false") {
        windowContainerBase.style.display = "none";
    } else {
        deskMovers[0] = new DeskMover(windowContainerBase, "");
    }
    initSimpleMover(msgbox, msgboxTitlebar, [msgboxCloseBtn]);
    initSimpleMover(osk, oskTitlebar, []);
    if (localStorage.madesktopChanViewTopMargin || localStorage.madesktopChanViewRightMargin) {
        debugMenu.style.top = localStorage.madesktopChanViewTopMargin || "0";
        debugMenu.style.right = localStorage.madesktopChanViewRightMargin || "0";
    }
    initSimpleMover(debugMenu, debugMenu, debugMenu.querySelectorAll("a"));

    if (typeof wallpaperOnVideoEnded === "function") { // Check if running in Wallpaper Engine
        runningMode = 1;
        if (parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]) >= 100) {
            kbdSupport = -1;
            window.alert = window.confirm = window.prompt = () => null;
        } else {
            kbdSupport = 0;
        }
    } else if (location.href.startsWith("localfolder://")) { // Check if running in Lively Wallpaper
        runningMode = 2;
    }
    kbdSupportLabel.textContent = kbdSupport;

    // Migrate old configs
    if (localStorage.madesktopNonADStyle) {
        for (let i = 0; i < localStorage.madesktopItemCount; i++) localStorage.setItem("madesktopItemStyle" + (i || ""), "nonad");
        delete localStorage.madesktopNonADStyle;
        location.reload();
        throw new Error("Refreshing...");
    }
    // Convert destryoedItems to openWindows
    // Only save open windows instead of all destroyed windows
    if (localStorage.madesktopDestroyedItems) {
        let openWindows = [0];
        for (let i = 1; i < localStorage.madesktopItemCount; i++) {
            if (!localStorage.madesktopDestroyedItems.includes(`|${i}|`)) {
                openWindows.push(i);
            } else {
                // Clean up configs of destroyed deskMovers
                localStorage.removeItem(`madesktopItemWidth${i}`);
                localStorage.removeItem(`madesktopItemHeight${i}`);
                localStorage.removeItem(`madesktopItemXPos${i}`);
                localStorage.removeItem(`madesktopItemYPos${i}`);
                localStorage.removeItem(`madesktopItemSrc${i}`);
                localStorage.removeItem(`madesktopItemStyle${i}`);
                localStorage.removeItem(`madesktopItemUnscaled${i}`);
                localStorage.removeItem(`madesktopItemTitle${i}`);
                localStorage.removeItem(`madesktopItemZIndex${i}`);
                localStorage.removeItem(`madesktopItemActive${i}`);
            }
        }
        localStorage.madesktopOpenWindows = openWindows;
        delete localStorage.madesktopDestroyedItems;
    } else if (!localStorage.madesktopOpenWindows) {
        let openWindows = [0];
        for (let i = 1; i < localStorage.madesktopItemCount; i++) {
            openWindows.push(i);
        }
        localStorage.madesktopOpenWindows = openWindows;
    }
    delete localStorage.madesktopLastCustomScale;
    delete localStorage.madesktopPrevOWConfigRequest;
    if (localStorage.madesktopBgImg) {
        if (localStorage.madesktopBgImg.startsWith("wallpapers/") && localStorage.madesktopBgImg.endsWith(".bmp")) {
            localStorage.madesktopBgImg = localStorage.madesktopBgImg.replace(".bmp", ".png");
            changeBgType("image");
        }
    }
    // Mistake that I made in previous versions
    if (localStorage.madesktopCustomColor) {
        if (localStorage.madesktopCustomColor.includes("--menu-highlight")) {
            localStorage.madesktopCustomColor = localStorage.madesktopCustomColor.replace("--menu-highlight", "--menu-hilight");
            changeColorScheme("custom");
        }
    }

    if (localStorage.madesktopItemCount > 1) {
        // Check if the deskMover we're trying to initialize is open or not
        // Skip for deskMover 0 (the ChannelBar) - this design is to maintain backwards compatibility with old versions
        // which supported only one deskMover
        for (const i of localStorage.madesktopOpenWindows.split(',').slice(1)) {
            createNewDeskItem(i.toString());
        }
    }

    if (localStorage.madesktopLastVer) {
        if (!localStorage.madesktopLastVer.startsWith(madVersion.toString(2))) { // Update from 3.2 and below
            delete localStorage.madesktopHideWelcome;
            delete localStorage.madesktopCheckedChanges;
            delete localStorage.madesktopCheckedConfigs;
            if (!localStorage.madesktopLastVer.startsWith("3.2") && !localStorage.madesktopLastVer.startsWith("3.3")) { // Update from 3.1 and below - no new apps in 3.3 / 3.4
                openWindow("placeholder.html");
            }

            if (localStorage.madesktopColorScheme === "xpcss4mad" && localStorage.madesktopLastVer.startsWith("3.0")) {
                // 3.0 didn't have the menu style option but the XP theme had a hardcoded menu style
                localStorage.madesktopMenuStyle = "mbcm";
                changeMenuStyle("mbcm");
            }
            startup();
        }

        if (localStorage.madesktopLastVer !== madVersion.toString() && localStorage.sysplugIntegration) { // Update from 3.2.1 and below
            madAlert("locid:MAD_MSG_SYSPLUG_UPDATED", function () {
                openWindow("SysplugSetupGuide.md", true);
            });
            delete localStorage.sysplugIntegration;
        }
    } else { // First run
        openWindow("placeholder.html");
        startup();

        if (runningMode === 0) {
            localStorage.madesktopChanViewLeftMargin = "0";
            localStorage.madesktopChanViewBottomMargin = "0";
        }

        if (madVersion.extra) {
            // Enable debug mode for pre-release versions by default
            activateDebugMode();
        }
    }
    localStorage.madesktopLastVer = madVersion.toString();

    switch (localStorage.madesktopMigrationProgress) {
        case "0":
            // Migration check failed, ask the user to retry migration
            madConfirm("locid:MAD_MSG_MIGRATION_INCOMPLETE", function (res) {
                if (res) {
                    // Migration needs to be done without any configs here
                    location.replace("confmgr.html?action=reset");
                } else {
                    localStorage.madesktopMigrationProgress = 2;
                }
            });
            break;
        case "1":
            // Migration succeeded, clear configs at www.ingan121.com
            const migratorWindow = openWindow("https://www.ingan121.com/mad/migrator_stage2.html", true, {
                width: "300px",
                height: "52px",
                centered: true,
                unresizable: true,
                noIcon: true
            });
            window.addEventListener('message', function (event) {
                if (event.origin !== 'https://www.ingan121.com') {
                    return;
                }
                const data = event.data;
                if (data.type === 'migrateSuccess') {
                    localStorage.madesktopMigrationProgress++;
                    migratorWindow.closeWindow();
                }
            });
    }
    // #endregion

    // #region Event listeners
    // Change the scale on load
    bgHtmlView.addEventListener('load', function () {
        if (!isIframeAutoScaled && this.contentDocument) {
            this.contentDocument.body.style.zoom = scaleFactor;
        }
        hookIframeSize(bgHtmlView);
        bgHtmlView.contentDocument?.addEventListener("contextmenu", openMainMenu, false);
    });
    oskWindow.addEventListener('load', function () {
        if (!isIframeAutoScaled) {
            this.contentDocument.body.style.zoom = scaleFactor;
        }
        hookIframeSize(oskWindow);
    });

    // #region Main context menu things (only for browser use)
    window.addEventListener('contextmenu', openMainMenu, false);

    for (const elem of mainMenuItems) {
        elem.onmouseover = () => {
            for (const item of mainMenuItems) {
                delete item.dataset.active;
            }
            elem.dataset.active = true;
        }
        elem.onmouseleave = () => {
            delete elem.dataset.active;
        }
    }

    mainMenuBg.addEventListener('focusout', closeMainMenu);

    mainMenuBg.addEventListener('animationend', function () {
        this.style.pointerEvents = "";
    });

    mainMenuItems[0].addEventListener('click', () => { // New button
        closeMainMenu();
        openWindow();
    });

    mainMenuItems[1].addEventListener('click', () => { // Properties button
        closeMainMenu();
        openConfig();
    });

    function openMainMenu (event) {
        if (isContextMenuOpen) return;
        if (localStorage.madesktopCmAnimation !== "none") {
            mainMenuBg.style.pointerEvents = "none";
        }
        mainMenuBg.style.left = event.clientX / window.scaleFactor + "px";
        mainMenuBg.style.top = event.clientY / window.scaleFactor + "px";
        mainMenuBg.style.display = "block";
        const width0 = getTextWidth(mainMenuItems[0].textContent);
        const width1 = getTextWidth(mainMenuItems[1].textContent);
        const width = Math.max(width0, width1);
        mainMenuBg.style.width = `calc(${width}px + 4em)`;
        mainMenu.style.width = `calc(${width}px + 4em - 2px)`;
        mainMenuBg.style.height = mainMenuItems[0].offsetHeight * 2 + "px";

        iframeClickEventCtrl(false);
        isContextMenuOpen = true;
        event.preventDefault();
        mainMenuBg.focus();
        openedMenu = mainMenuBg;
        document.addEventListener("keydown", menuNavigationHandler);
    }

    function closeMainMenu(event) {
        if (event?.type === "focusout" && window.ignoreFocusLoss) {
            // Debug feature; set window.ignoreMenuFocusLoss to true to prevent closing the menu on focusout
            return;
        }
        mainMenuBg.style.display = "none";
        isContextMenuOpen = false;
        openedMenu = null;
        document.removeEventListener("keydown", menuNavigationHandler);
    }
    // #endregion

    msgboxBg.addEventListener('click', flashDialog);

    msgbox.addEventListener('click', preventDefault);
    osk.addEventListener('click', preventDefault);

    window.addEventListener('resize', function () {
        changeScale(scaleFactor);
    });

    // Handle localStorage full error
    // (Other error events are handled in the inline script of index.html)
    window.addEventListener('error', function (event) {
        if (event.error.name === "QuotaExceededError") {
            handleStorageFull();
        }
    })

    // #region Lively Wallpaper function-style listeners
    function livelyPropertyListener(name, val) {
        wallpaperPropertyListener.applyUserProperties({ [name]: { value: val } });
    }

    function livelyCurrentTrack(data) {
        if (window.visDeskMover) {
            const visWindow = window.visDeskMover.windowElement.contentWindow;
            const obj = JSON.parse(data);
            //when no track is playing its null
            if (obj !== null) {
                visWindow.wallpaperMediaPropertiesListener({
                    title: obj["Title"],
                    subTitle: obj["Subtitle"],
                    artist: obj["Artist"],
                    albumTitle: obj["AlbumTitle"],
                    albumArtist: obj["AlbumArtist"],
                    genres: obj["Genres"].join(",")
                });
                visWindow.wallpaperMediaThumbnailListener({
                    thumbnail: "data:image/png;base64," + obj["Thumbnail"] ?? ""
                });
            } else {
                visWindow.wallpaperMediaPropertiesListener({
                    title: null
                });
                visWindow.wallpaperMediaThumbnailListener({
                    thumbnail: "data:image/png;base64,"
                });
            }
        }
    }
    // #endregion

    // Prevent scrolling when a partly off-screen deskMover gets focus, its iframe loads, etc.
    document.addEventListener('scroll', function () {
        document.documentElement.scrollTo(0, 0);
    });
    // #endregion

    // #region Functions
    // #region Global API functions (Exposed to DeskMovers by libmad.js)
    // Create a new window and initialize it
    function createNewDeskItem(numStr, openDoc, temp, options, isResetting) {
        try {
            const newContainer = windowContainerBase.cloneNode(true);
            document.body.appendChild(newContainer);
            const deskMover = new DeskMover(newContainer, numStr, openDoc, temp, options, isResetting);
            deskMovers[numStr] = deskMover;
            return deskMover;
        } catch (error) {
            // errors here interrupt the whole initialization process
            if (error.name === "QuotaExceededError") {
                // localStorage is full; let MAD finish initialization and handle it
                handleStorageFull();
            } else {
                // something else went wrong?
                throw error;
            }
        }
    }

    // Create a new window, initialize, and increase the saved window count
    function openWindow(openDoc, temp, optionsOrWidth, height, style, centered, top, left, aot, unresizable, noIcon) {
        if (!temp) {
            localStorage.madesktopOpenWindows += `,${localStorage.madesktopItemCount}`;
        }
        let options = optionsOrWidth;
        if (typeof optionsOrWidth === "string") {
            // Old way of calling openWindow
            options = {
                width: optionsOrWidth,
                height,
                style,
                centered,
                top,
                left,
                aot,
                unresizable,
                noIcon
            };
        }
        const num = temp ? lastTempDeskMoverNum-- : localStorage.madesktopItemCount++;
        const deskMover = createNewDeskItem(num, openDoc, temp, options);
        activateWindow(num);
        return deskMover;
    }

    function openConfig(page) {
        if (window.confDeskMover) {
            if (page && window.confDeskMover.config.src !== `apps/madconf/${page}.html`) {
                window.confDeskMover.locReplace(`apps/madconf/${page}.html`);
            }
            window.confDeskMover.bringToTop();
        } else {
            openWindow(`apps/madconf/${page || 'background'}.html`, true);
        }
    }

    // Open external links
    function openExternal(url, fullscreen, specs = "", temp = true, noExternal = false) {
        // Don't use in-MAD ChannelViewer for data URLs, non-temporary windows, or if the link open mode not set to ChannelViewer
        if ((localStorage.madesktopLinkOpenMode || "1") !== "1" && temp && !specs && !url.startsWith("data:") && !noExternal) {
            openExternalExternally(url, fullscreen && !localStorage.madesktopChanViewNoAutoFullscrn);
            return null;
        }
        // GitHub doesn't work well in ChannelViewer unless running in Wallpaper Engine
        if (runningMode === 0 && url.includes("github.com/") && temp && !noExternal) {
            openExternalExternally(url);
            return null;
        }

        if (specs) {
            specs = "&" + specs.replaceAll(" ", "").replaceAll(",", "&");
        }
        let deskMover = openWindow('apps/channelviewer/index.html?page=' + encodeURIComponent(url) + specs, temp, "1024px", "768px");
        if (deskMover && fullscreen && !localStorage.madesktopChanViewNoAutoFullscrn) {
            deskMover.windowElement.contentWindow.addEventListener("load", function () {
                deskMover.enterFullscreen(true);
            });
        }
        return deskMover;
    }

    // Open external links externally (system browser or SysPlug ChannelViewer, or just a new tab when running in a browser)
    // If none of the above are available, fall back to in-MAD ChannelViewer, or copy the link to the clipboard if noInternal is true
    async function openExternalExternally(url, fullscreen, noInternal = false) {
        if (runningMode === 0 && (!localStorage.madesktopLinkOpenMode || localStorage.madesktopLinkOpenMode === "0")) {
            window.open(url, "_blank");
        } else if (localStorage.sysplugIntegration) {
            const headers = {};
            if (fullscreen) {
                headers["X-Fullscreen"] = "true";
            }
            if (localStorage.madesktopLinkOpenMode === "2") {
                headers["X-Use-ChannelViewer"] = "true";
            }
            try {
                const response = await madSysPlug.openExternal(url, headers);
                if (response !== "OK") {
                    await madAlert(madGetString("UI_MSG_SYSPLUG_ERROR", response), null, "error");
                    copyPrompt(url);
                }
            } catch {
                await madAlert(madGetString("UI_MSG_NO_SYSPLUG"), null, "warning");
                copyPrompt(url);
            }
        } else {
            copyPrompt(url);
        }

        function copyPrompt(url) {
            if (!noInternal) {
                openExternal(url, fullscreen, "", true, true);
            } else if (kbdSupport === -1 || prompt(madGetString("MAD_MSG_LINK_COPY_PROMPT"), url)) {
                const tmp = document.createElement("textarea");
                document.body.appendChild(tmp);
                tmp.value = url;
                tmp.select();
                document.execCommand('copy');
                document.body.removeChild(tmp);
                if (kbdSupport === -1) {
                    madAlert(madGetString("MAD_MSG_LINK_COPIED"), null, "info");
                }
            }
        }
    }

    function announce(type) {
        try {
            bgHtmlView.contentWindow.postMessage({ type }, "*");
            oskWindow.contentWindow.postMessage({ type }, "*");
        } catch {
            // page did not load yet
        }
        for (const i in deskMovers) {
            try {
                deskMovers[i].windowElement.contentWindow.postMessage({ type }, "*");
            } catch {
                // page did not load yet
            }
        }
    }

    function playSound(sound) {
        if ((sound !== "navStart" && !localStorage.madesktopAlertSndMuted) ||
            (sound === "navStart" && !localStorage.madesktopChanViewNoSound))
        {
            soundScheme[sound].currentTime = 0;
            soundScheme[sound].play();
        }
    }
    // #endregion

    // #region Window management functions
    // Change the scaleFactor of all iframes
    function updateIframeScale() {
        let scaleFactor = window.scaleFactor;
        // Latest browsers auto-scale iframes according to the new spec
        // https://github.com/w3c/csswg-drafts/issues/9644
        // So don't scale iframes ourselves if the browser supports it
        if (isIframeAutoScaled) {
            scaleFactor = 1;
        }
        try {
            bgHtmlView.contentDocument.body.style.zoom = scaleFactor;
            bgHtmlView.contentWindow.dispatchEvent(new Event("resize"));
        } catch {
            // page did not load yet
            // or is a cross-origin iframe
        }
        for (const i in deskMovers) {
            let stopLoop = false;
            if (stopLoop) {
                break;
            }
            try {
                if (!deskMovers[i].config.unscaled) {
                    const iframe = deskMovers[i].windowElement;
                    iframe.contentDocument.body.style.zoom = scaleFactor;
                    // Check if the iframe is auto-scaled
                    iframe.contentWindow.dispatchEvent(new Event("resize"));
                    setTimeout(() => {
                        if (parseFloat(scaleFactor) !== 1 && window.devicePixelRatio !== iframe.contentWindow.devicePixelRatio) {
                            isIframeAutoScaled = true;
                            updateIframeScale();
                            stopLoop = true;
                        }
                    }, 1); // Apparently CSS changes are not applied immediately
                } else if (isIframeAutoScaled) {
                    // Delete the unscaled flag if the browser supports auto-scaling
                    // Otherwise unexpected behavior may occur
                    deskMovers[i].config.unscaled = false;
                }
                if (deskMovers[i].isFullscreen) {
                    if (deskMovers[i].isFullscreenWithMargins) {
                        deskMovers[i].windowElement.style.width = window.vWidth - parseInt(localStorage.madesktopChanViewLeftMargin || "75px") - parseInt(localStorage.madesktopChanViewRightMargin || "0") + "px";
                        deskMovers[i].windowElement.style.height = window.vHeight - parseInt(localStorage.madesktopChanViewTopMargin || "0") - parseInt(localStorage.madesktopChanViewBottomMargin || "48px") + "px";
                    } else {
                        deskMovers[i].windowElement.style.width = window.vWidth + "px";
                        deskMovers[i].windowElement.style.height = window.vHeight + "px";
                    }
                }
            } catch {
                // page did not load yet
                // it works on external webpages thanks to the new WPE iframe policy
            }
        }
    }

    // Initialize general iframe hooks for all iframes
    function hookIframeSize(iframe, num) {
        if (!iframe.contentDocument) {
            // Window was closed (Firefox specific, doesn't happen in Chromium)
            // Or the iframe is cross-origin
            return;
        }

        // innerWidth/Height hook
        // Fixes some sites that are broken when scaled, such as YT
        Object.defineProperties(iframe.contentWindow, {
            innerWidth: {
                get: function () {
                    if (typeof num !== "undefined" && deskMovers[num].config.unscaled) {
                        return iframe.clientWidth * scaleFactor;
                    }
                    return iframe.clientWidth;
                }
            },
            innerHeight: {
                get: function () {
                    if (typeof num !== "undefined" && deskMovers[num].config.unscaled) {
                        return iframe.clientHeight * scaleFactor;
                    }
                    return iframe.clientHeight;
                }
            }
        });

        // Also hook window.open as this doesn't work in WPE
        if (localStorage.madesktopLinkOpenMode !== "0" || runningMode !== 0) {
            iframe.contentWindow.open = function (url, name, specs) {
                const deskMover = openExternal(url, false, specs);
                if (deskMover) {
                    return deskMover.windowElement.contentWindow;
                }
            }
        }

        iframe.contentWindow.close = function () {
            deskMovers[num].closeWindow();
        }

        if (typeof num !== "undefined") {
            // Listen for title changes
            new MutationObserver(function (mutations) {
                if (!deskMovers[num].config.title) {
                    deskMovers[num].windowTitleText.textContent = mutations[0].target.innerText;
                }
            }).observe(
                iframe.contentDocument.querySelector('title'),
                { subtree: true, characterData: true, childList: true }
            );
        }

        iframe.contentDocument.addEventListener('click', (event) => {
            if (!iframe.contentDocument) {
                // Window was closed (Firefox specific, doesn't happen in Chromium)
                return;
            }
            const hoverElement = iframe.contentDocument.elementFromPoint(event.clientX, event.clientY);
            if (iframe.contentDocument.activeElement && iframe.contentDocument.activeElement.href &&
                (iframe.contentDocument.activeElement.target === "_blank" && hoverElement === iframe.contentDocument.activeElement) ||
                iframe.contentDocument.activeElement.target === "_cv")
            {
                openExternal(iframe.contentDocument.activeElement.href);
                event.preventDefault();
            }
        });
    }

    function activateWindow(num = activeWindow || 0) {
        log(num);
        if (!deskMovers[num]) {
            activeWindow = 0; // Prevent errors
            return;
        }
        num = parseInt(num);

        delete deskMovers[num].windowContainer.dataset.inactive;
        deskMovers[num].windowTitlebar.classList.remove("inactive");

        if (num !== activeWindow) {
            activeWindowHistory.push(activeWindow);
            activeWindow = num;
        }

        if (!localStorage.madesktopNoDeactivate && deskMovers[num]) {
            deskMovers[num].config.active = true;
        }

        for (const i in deskMovers) {
            if (parseInt(i) !== num) {
                if (localStorage.madesktopNoDeactivate) {
                    delete deskMovers[i].windowContainer.dataset.inactive;
                    deskMovers[i].windowTitlebar.classList.remove("inactive");
                } else {
                    deskMovers[i].windowContainer.dataset.inactive = true;
                    deskMovers[i].windowTitlebar.classList.add("inactive");
                    deskMovers[i].config.active = false;
                }
            }
        }
    }

    function adjustAllElements(extraTitleHeight, extraBorderSize, extraBorderBottom) {
        log({extraTitleHeight, extraBorderSize, extraBorderBottom});
        for (const i in deskMovers) {
            deskMovers[i].adjustElements(extraTitleHeight, extraBorderSize, extraBorderBottom);
        }
    }

    // Required as mouse movements over iframes are not detectable in the parent document
    function iframeClickEventCtrl(clickable) {
        const caller = getCaller();
        log(clickable ? "clickable" : "unclickable", "debug", caller + " -> iframeClickEventCtrl");
        const value = clickable ? "auto" : "none";
        bgHtmlView.style.pointerEvents = value;
        oskWindow.style.pointerEvents = value;
        for (const i in deskMovers) {
            deskMovers[i].windowContainer.style.pointerEvents = value;
        }
        debugMenu.style.pointerEvents = value; // Also apply to debug menu cuz otherwise it will be clickable over windows
    }
    // #endregion

    // #region Dialog functions
    // TODO: Refactor these - its pretty messy, especially regarding the event listeners
    // Also its modal for everything, which is not good
    // Finish buildstuff/MadDialog.js and use that instead
    // Probably in 3.5
    function madAlert(msg, callback, icon = "info", options = {}) {
        return new Promise(resolve => {
            // Close the previous dialog if it's open
            if (msgbox.style.display === "block") {
                msgboxCloseBtn.click();
            }

            playSound(icon);

            if (msg.startsWith("locid:")) {
                msg = `<mad-string data-locid="${msg.slice(6)}"></mad-string>`;
            }
            msgboxMessage.innerHTML = msg;
            msgboxIcon.style.display = "block";
            msgboxIcon.src = `images/${icon}.png`;
            msgboxBtn2.style.display = "none";
            msgboxBtn3.style.display = "none";
            msgboxInput.style.display = "none";
            osk.style.display = "none";

            msgboxTitlebarText.innerHTML = madProcessString(options.title || "%n");

            if (options.btn1) {
                msgboxBtn1.innerHTML = madProcessString(options.btn1);
            } else {
                msgboxBtn1.innerHTML = '<mad-string data-locid="UI_OK">OK</mad-string>';
            }

            document.addEventListener('keypress', keypress);
            document.addEventListener('keyup', keyup);
            msgboxBtn1.addEventListener('click', close);
            msgboxCloseBtn.addEventListener('click', close);

            showDialog(1);

            function keypress(event) {
                if (event.key === "Enter") {
                    close();
                }
                const accessKeys = msgbox.querySelectorAll("u");
                for (const key of accessKeys) {
                    if (event.key === key.textContent.toLowerCase()) {
                        key.parentElement.click();
                    }
                }
            }
            function keyup(event) {
                if (event.key === "Escape") {
                    close();
                }
            }
            function close() {
                hideDialog();
                document.removeEventListener('keypress', keypress);
                document.removeEventListener('keyup', keyup);
                msgboxBtn1.removeEventListener('click', close);
                msgboxCloseBtn.removeEventListener('click', close);
                deskMovers[activeWindow]?.windowTitlebar.classList.remove("inactive");
                delete deskMovers[activeWindow]?.windowContainer.dataset.inactive;
                if (callback) callback();
                resolve();
            }
        });
    }

    function madConfirm(msg, callback, options = {}) {
        return new Promise(resolve => {
            // Close the previous dialog if it's open
            if (msgboxBg.style.display === "block") {
                msgboxCloseBtn.click();
            }

            const icon = options.icon || "question";
            playSound(icon);

            if (msg.startsWith("locid:")) {
                msg = `<mad-string data-locid="${msg.slice(6)}"></mad-string>`;
            }
            msgboxMessage.innerHTML = msg;
            msgboxIcon.style.display = "block";
            msgboxIcon.src = `images/${icon}.png`;
            msgboxBtn2.style.display = "block";
            msgboxInput.style.display = "none";
            osk.style.display = "none";

            msgboxTitlebarText.innerHTML = madProcessString(options.title || "%n");

            if (options.btn1) {
                msgboxBtn1.innerHTML = madProcessString(options.btn1);
            } else {
                msgboxBtn1.innerHTML = '<mad-string data-locid="UI_OK">OK</mad-string>';
            }
            if (options.btn2) {
                msgboxBtn2.innerHTML = madProcessString(options.btn2);
            } else {
                msgboxBtn2.innerHTML = '<mad-string data-locid="UI_CANCEL">Cancel</mad-string>';
            }
            if (options.btn3) {
                msgboxBtn3.style.display = "block";
                msgboxBtn3.innerHTML = madProcessString(options.btn3);
            } else {
                msgboxBtn3.style.display = "none";
            }

            let cancelBtn = btn2;
            switch (options.cancelBtn) {
                case 1:
                    cancelBtn = btn1;
                    break;
                case 2:
                    cancelBtn = btn2;
                    break;
                case 3:
                    cancelBtn = btn3;
                    break;
                default:
                    if (options.btn3) {
                        cancelBtn = btn3;
                    }
            }

            let defaultBtn = btn1;
            switch (options.defaultBtn) {
                case 2:
                    defaultBtn = btn2;
                    break;
                case 3:
                    defaultBtn = btn3;
                    break;
            }

            document.addEventListener('keypress', keypress);
            document.addEventListener('keyup', keyup);
            msgboxBtn1.addEventListener('click', btn1);
            msgboxBtn2.addEventListener('click', btn2);
            msgboxBtn3.addEventListener('click', btn3);
            msgboxCloseBtn.addEventListener('click', cancelBtn);

            showDialog(options.defaultBtn);

            function keypress(event) {
                // Handle enter in keypress to prevent this from being triggered along with the context menu enter key
                if (event.key === "Enter") {
                    defaultBtn();
                }
                const accessKeys = msgbox.querySelectorAll("u");
                for (const key of accessKeys) {
                    if (event.key === key.textContent.toLowerCase()) {
                        key.parentElement.click();
                    }
                }
            }
            function keyup(event) {
                // Aaand escape cannot be handled in keypress so it's here
                if (event.key === "Escape") {
                    cancelBtn();
                }
            }
            function btn1() {
                removeEvents();
                if (callback) callback(true);
                resolve(true);
            }
            function btn2() {
                removeEvents();
                if (callback) callback(false);
                resolve(false);
            }
            function btn3() {
                removeEvents();
                if (callback) callback(null);
                resolve(null);
            }
            function removeEvents() {
                hideDialog();
                document.removeEventListener('keypress', keypress);
                document.removeEventListener('keyup', keyup);
                msgboxBtn1.removeEventListener('click', btn1);
                msgboxBtn2.removeEventListener('click', btn2);
                msgboxBtn3.removeEventListener('click', btn3);
                msgboxCloseBtn.removeEventListener('click', cancelBtn);
                deskMovers[activeWindow]?.windowTitlebar.classList.remove("inactive");
                delete deskMovers[activeWindow]?.windowContainer.dataset.inactive;
            }
        });
    }

    function madPrompt(msg, callback, hint = "", text = "", spAlrFailed = false) {
        return new Promise(async resolve => {
            if (kbdSupport === 0 && (!localStorage.sysplugIntegration || spAlrFailed)) {
                // Only call prompt if the system plugin integration is disabled or already failed before calling madPrompt
                const res = prompt(msg, text);
                if (callback) callback(res);
                resolve(res);
                return;
            }

            msgboxMessage.innerHTML = msg;
            msgboxIcon.style.display = "none";
            msgboxBtn2.style.display = "block";
            msgboxBtn3.style.display = "none";
            msgboxBtn1.innerHTML = '<mad-string data-locid="UI_OK">OK</mad-string>';
            msgboxBtn2.innerHTML = '<mad-string data-locid="UI_CANCEL">Cancel</mad-string>';
            msgboxTitlebarText.textContent = "ModernActiveDesktop";
            msgboxInput.style.display = "block";
            msgboxInput.placeholder = hint;
            msgboxInput.value = text;

            if (hint.length > 50 || text.length > 50) {
                msgboxInput.style.width = "500px";
            } else {
                msgboxInput.style.width = "100%";
            }

            document.addEventListener('keypress', keypress);
            document.addEventListener('keyup', keyup);
            msgboxInput.addEventListener('click', focus);
            msgboxBtn1.addEventListener('click', ok);
            msgboxBtn2.addEventListener('click', close);
            msgboxCloseBtn.addEventListener('click', close);

            showDialog(1);
            msgboxInput.focus();
            if (kbdSupport !== 1) {
                // WPE 2.5 broke the native JS alert/confirm/prompt,
                // locking the wallpaper until the user reloads the wallpaper from the WPE UI
                // (can't even close the dialog)
                // If the system plugin is available, use that for receiving input
                // Otherwise, use the on-screen keyboard
                if (!madSysPlug.inputStatus && !await madSysPlug.beginInput(true)) {
                    if (kbdSupport === -1) {
                        if (!oskWindow.src) {
                            oskWindow.src = "apps/osk/index.html";
                        }
                        if (!isIframeAutoScaled) {
                            oskWindow.contentDocument.body.style.zoom = scaleFactor;
                        }
                        osk.style.display = "block";
                        osk.style.left = (vWidth - osk.offsetWidth - parseInt(localStorage.madesktopChanViewRightMargin || "0") - 100) + "px";
                        osk.style.top = (vHeight - osk.offsetHeight - parseInt(localStorage.madesktopChanViewBottomMargin || "48px") - 50) + "px";
                    } else {
                        // Use prompt() if kbdSupport === 0
                        removeEvents();
                        return await madPrompt(msg, callback, hint, text, true);
                    }
                }
            }

            function keypress(event) {
                if (event.key === "Enter") {
                    ok();
                }
            }
            function keyup(event) {
                if (event.key === "Escape") {
                    close();
                }
            }
            function focus() {
                if (kbdSupport === -1) {
                    madSysPlug.focusInput();
                }
            }
            async function ok() {
                await removeEvents();
                if (callback) callback(msgboxInput.value);
                resolve(msgboxInput.value);
            }
            async function close() {
                await removeEvents();
                if (callback) callback(null);
                resolve(null);
            }
            async function removeEvents() {
                hideDialog();
                document.removeEventListener('keypress', keypress);
                document.removeEventListener('keyup', keyup);
                await madSysPlug.endInput();
                msgboxInput.removeEventListener('click', focus);
                msgboxBtn1.removeEventListener('click', ok);
                msgboxBtn2.removeEventListener('click', close);
                msgboxCloseBtn.removeEventListener('click', close);
                deskMovers[activeWindow]?.windowTitlebar.classList.remove("inactive");
                delete deskMovers[activeWindow]?.windowContainer.dataset.inactive;
            }
        });
    }

    // @unexported
    function showDialog(focus = 1) {
        if (msgboxLoopCount++ > 5) {
            return;
        }
        msgboxLoopDetector = setTimeout(function () {
            clearTimeout(msgboxLoopDetector);
            msgboxLoopCount = 0;
        }, 5000);

        const winOpenAnim = getComputedStyle(msgbox).getPropertyValue('--win-open-anim');
        if (winOpenAnim && !localStorage.madesktopNoWinAnim) {
            msgbox.style.animation = winOpenAnim;
            msgbox.addEventListener('animationend', function () {
                msgbox.style.animation = "";
            }, { once: true });
        }

        const activeDeskMover = deskMovers[activeWindow];
        if (!localStorage.madesktopNoDeactivate && activeDeskMover) {
            activeDeskMover.windowTitlebar.classList.add("inactive");
            activeDeskMover.windowContainer.dataset.inactive = true;
        }
        msgboxBg.style.display = "block";
        msgbox.style.top = (vHeight - msgbox.offsetHeight) / 2 + "px";
        msgbox.style.left = (vWidth - msgbox.offsetWidth) / 2 + "px";
        switch (focus) {
            case 1:
                msgboxBtn1.focus();
                break;
            case 2:
                msgboxBtn2.focus();
                break;
            case 3:
                msgboxBtn3.focus();
                break;
            default:
                msgboxInput.focus();
        }

        // Detect changes in the message content
        // For centering the dialog when MadString is loaded lately
        msgboxMsgChangeDetector = new MutationObserver(function (mutations) {
            msgbox.style.top = (vHeight - msgbox.offsetHeight) / 2 + "px";
            msgbox.style.left = (vWidth - msgbox.offsetWidth) / 2 + "px";
        });
        msgboxMsgChangeDetector.observe(msgboxMessage, { childList: true, subtree: true });
    }

    // @unexported
    function hideDialog() {
        msgboxMsgChangeDetector.disconnect();
        const winCloseAnim = getComputedStyle(msgbox).getPropertyValue('--win-close-anim');
        if (winCloseAnim && !localStorage.madesktopNoWinAnim) {
            msgbox.style.animation = winCloseAnim;
            msgbox.addEventListener('animationend', function () {
                const tester = document.createElement("div");
                tester.style.animation = winCloseAnim;
                const animationName = tester.style.animationName;
                if (msgbox.style.animationName !== animationName) {
                    return;
                }
                msgbox.style.animation = "";
                msgboxBg.style.display = "none";
            }, { once: true });
        } else {
            msgboxBg.style.display = "none";
        }
        osk.style.display = "none";
    }

    // @unexported
    function flashDialog() {
        playSound("modal");
        clearInterval(flashInterval);
        let cnt = 1;
        flashInterval = setInterval(function () {
            if (cnt === 18) {
                clearInterval(flashInterval);
            }
            if (cnt % 2) {
                msgbox.dataset.inactive = true;
                msgboxTitlebar.classList.add("inactive");
            } else {
                delete msgbox.dataset.inactive;
                msgboxTitlebar.classList.remove("inactive");
            }
            cnt++;
        }, 60);
    }
    // #endregion

    // #region Global helper functions (Expects the top window so not suitable for functions.js)
    function menuNavigationHandler(event) {
        if (!openedMenu) {
            return;
        }
        let menuItems;
        if (localStorage.madesktopDebugMode) {
            menuItems = openedMenu.querySelectorAll('.contextMenuItem:not([data-hidden])');
        } else {
            menuItems = openedMenu.querySelectorAll('.contextMenuItem:not([data-hidden]):not(.debug)');
        }
        const activeItem = openedMenu.querySelector('.contextMenuItem[data-active]');
        const activeItemIndex = Array.from(menuItems).indexOf(activeItem);
        switch (event.key) {
            case "Escape":
                isContextMenuOpen = false;
                if (openedMenuCloseFunc) {
                    openedMenuCloseFunc(true);
                    openedMenu.querySelector('.contextMenuItem').dataset.active = true;
                } else {
                    openedMenu.blur();
                }
                break;
            case "ArrowUp":
                if (activeItem) {
                    delete activeItem.dataset.active;
                    if (activeItemIndex > 0) {
                        menuItems[activeItemIndex - 1].dataset.active = true;
                    } else {
                        menuItems[menuItems.length - 1].dataset.active = true;
                    }
                } else {
                    menuItems[menuItems.length - 1].dataset.active = true;
                }
                break;
            case "ArrowDown":
                if (activeItem) {
                    delete activeItem.dataset.active;
                    if (activeItemIndex < menuItems.length - 1) {
                        menuItems[activeItemIndex + 1].dataset.active = true;
                    } else {
                        menuItems[0].dataset.active = true;
                    }
                } else {
                    menuItems[0].dataset.active = true;
                }
                break;
            case "ArrowLeft":
                if (openedMenu.classList.contains('confMenuBg')) {
                    openedMenuCloseFunc(true);
                    openedMenu.querySelector('.contextMenuItem').dataset.active = true;
                }
                break;
            case "ArrowRight":
                if (activeItem && activeItem.querySelector('.submenuMark')) {
                    activeItem.click();
                    openedMenu.querySelector('.contextMenuItem').dataset.active = true;
                }
                break;
            case "Enter":
                if (activeItem) {
                    activeItem.click();
                    if (openedMenu) {
                        openedMenu.querySelector('.contextMenuItem').dataset.active = true;
                    }
                } else {
                    isContextMenuOpen = false;
                    if (openedMenuCloseFunc) {
                        openedMenuCloseFunc(true);
                    } else {
                        openedMenu.blur();
                    }
                }
                break;
            default:
                const shortcutsKeys = openedMenu.getElementsByTagName('u');
                for (const shortcutKey of shortcutsKeys) {
                    if (event.key === shortcutKey.textContent.toLowerCase()) {
                        for (const item of menuItems) {
                            delete item.dataset.active;
                        }
                        shortcutKey.parentElement.click();
                        if (openedMenu) {
                            openedMenu.querySelector('.contextMenuItem').dataset.active = true;
                        }
                        return;
                    }
                }
        }
        event.preventDefault();
        event.stopPropagation();
    }
    // #endregion

    function startup() {
        if (startupRan) {
            return;
        }

        if (!localStorage.madesktopStartSndMuted) {
            playSound("startup");

            if (!localStorage.madesktopHideWelcome) {
                setTimeout(showWelcome, 5000);
            }
        } else {
            if (!localStorage.madesktopHideWelcome) {
                showWelcome();
            }
        }
        startupRan = true;
        delete localStorage.madesktopForceRunStartup;
    }

    // @unexported
    function showWelcome() {
        const options = {
            width: "476px",
            height: "322px",
            centered: true,
            unresizable: true
        };
        openWindow("apps/welcome/index.html", true, options);
    }

    // @unexported
    async function handleStorageFull() {
        // Ask the user to fix the issue by deleting some images
        if (!showedStorageFullAlert && await madConfirm("locid:MAD_MSG_LOCALSTORAGE_FULL", null, {
            icon: "error",
            btn1: "locid:UI_YES",
            btn2: "locid:UI_NO"
        })) {
            // Temp windows still work to some extent even if localStorage is completely full
            openWindow("apps/jspaint/index.html", true);
            openConfig("background");
            showedStorageFullAlert = true;
        }
    }

    // @unexported
    function openApp(app) {
        switch(app) {
            case "channelbar":
                openWindow("ChannelBar.html", true, {
                    width: 84,
                    height: 471,
                    centered: true,
                    unresizable: true,
                    style: "ad"
                });
                break;
            case "jspaint":
                openWindow("apps/jspaint/index.html", true, {
                    width: 268,
                    height: 355,
                    centered: true,
                    style: "wnd"
                });
                break;
            case "sol":
                openWindow("apps/solitaire/index.html", true, {
                    width: 660,
                    height: 440,
                    centered: true,
                    style: "wnd"
                });
                break;
            case "vis":
                if (runningMode === 0) {
                    return;
                }
                if (visDeskMover) {
                    if (visDeskMover.visStatus.mediaIntegrationAvailable) {
                        openWindow("apps/visualizer/secondary.html", true, {
                            width: 600,
                            height: 400,
                            centered: true,
                            style: "wnd"
                        });
                    } else {
                        return;
                    }
                } else if (localStorage.madesktopVisUnavailable) {
                    return;
                } else {
                    openWindow("apps/visualizer/index.html", true, {
                        width: 725,
                        height: 380,
                        centered: true,
                        style: "wnd"
                    });
                }
                break;
            case "cv":
                openWindow("apps/channelviewer/index.html", true, {
                    width: 1024,
                    height: 768,
                    centered: true,
                    style: "wnd"
                });
                break;
            case "clock":
                openWindow("apps/clock/index.html", true, {
                    width: 398,
                    height: 417,
                    centered: true,
                    style: "wnd"
                });
                break;
            case "calc":
                openWindow("apps/calc/index.html", true, {
                    width: 254,
                    height: 227,
                    centered: true,
                    unresizable: true,
                    style: "wnd"
                });
                break;
            case "lyrics":
                openWindow("apps/visualizer/lyrics/index.html", true, {
                    width: 400,
                    height: 502,
                    centered: true,
                    style: "wnd"
                });
                break;
        }
    }

    // #region Late function exports
    window.createNewDeskItem = createNewDeskItem;
    window.openWindow = openWindow;
    window.openConfig = openConfig;
    window.openExternal = openExternal;
    window.openExternalExternally = openExternalExternally;
    window.openApp = openApp; // For DevTools access
    window.announce = announce;
    window.playSound = playSound;
    window.adjustAllElements = adjustAllElements;

    window.madAlert = madAlert;
    window.madConfirm = madConfirm;
    window.madPrompt = madPrompt;
    window.startup = startup;
    // #endregion
    // #endregion

    // #region Final initialization
    if (runningMode === 1) {
        // Dummy listener to make Wallpaper Engine recognize MAD supporting audio visualization
        window.wallpaperRegisterAudioListener(() => {});
        window.wallpaperRegisterMediaPropertiesListener(() => {});
        if (localStorage.madesktopForceRunStartup) {
            startup();
        }
    } else {
        if (runningMode === 0) {
            // Konami code easter egg
            // Obviously a 98.js / jspaint reference
            const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a", "Enter"];
            let konamiStack = 0;
            document.addEventListener('keydown', function (event) {
                if (event.key === konamiCode[konamiStack++]) {
                    if (event.key === "Enter") {
                        openExternal("https://youareanidiot.cc/lol.html", false, "resizable=no,width=357,height=330,forceLoad=yes", true, true);
                    }
                } else {
                    konamiStack = 0;
                }
            });
        } else if (runningMode === 2) {
            window.livelyPropertyListener = livelyPropertyListener;
            window.livelyAudioListener = () => {};
            window.livelyCurrentTrack = livelyCurrentTrack;
        }
        startup();
        if (location.href.startsWith("file:///") && runningMode === 0) {
            fetch("js/DeskSettings.js").catch(() => {
                // Not really localizable cuz AJAX fails when running as a local file due to CORS
                let localCorsMsg = "restart your browser with the --allow-file-access-from-files argument.";
                if (navigator.userAgent.includes("Firefox")) {
                    localCorsMsg = "go to about:config and set security.fileuri.strict_origin_policy to false.";
                }
                madAlert("You are running ModernActiveDesktop as a local file. For the full functionality, please use a web server to host it or " + localCorsMsg, null, "warning");
                window.madFileUriRestricted = true;
            });
        }
    }
    origRunningMode = runningMode;

    window.addEventListener('load', function () {
        processTheme();
        try {
            document.documentElement.style.setProperty('--hilight-inverted', invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
        } catch {
            document.documentElement.style.setProperty('--hilight-inverted', 'var(--hilight-text)');
        }
        adjustAllElements();

        if (runningMode === 1) {
            setTimeout(function () {
                if (visDeskMover) {
                    visDeskMover.windowElement.contentWindow.setupListeners();
                }
            }, 1000);
        }
        logTimed("ModernActiveDesktop load complete");
    });

    switch (location.hash) {
        case "#cmfail_oldver":
            madAlert("locid:MADCONF_NEWER_CONF_MSG", null, "error");
            break;
        case "#cmfail_invconf":
            madAlert("locid:MADCONF_CONF_INVALID", null, "error");
            break;
        case "#cmfail_full":
            const msg = runningMode === 1 ? "locid:MAD_MSG_LOCALSTORAGE_FULL_ON_IMPORT_WPE" : "locid:MAD_MSG_LOCALSTORAGE_FULL_ON_IMPORT";
            madConfirm(msg, (res) => {
                if (res) {
                    location.replace("confmgr.html?action=resethard");
                }
            }, {
                icon: "error",
                btn1: "locid:UI_YES",
                btn2: "locid:UI_NO"
            });
            break;
        default:
            if (location.hash.startsWith("#openapp:")) {
                openApp(location.hash.slice(9));
            }
    }
    // Clear hash
    history.pushState("", document.title, window.location.pathname + window.location.search);

    if (location.href.startsWith("https://madesktop.ingan121.com/index.html")) {
        // Remove index.html from the URL cuz it looks ugly
        history.replaceState("", document.title, location.href.replace("index.html", ""));
    }

    // Initialization complete
    document.body.dataset.initComplete = true;

    // Crash detection
    localStorage.madesktopFailCount = ++localStorage.madesktopFailCount || 1;
    setTimeout(function () {
        delete localStorage.madesktopFailCount;
    }, 10000);

    logTimed("ModernActiveDesktop initialization complete");
    // #endregion
})();