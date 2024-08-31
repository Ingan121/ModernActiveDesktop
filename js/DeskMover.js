// DeskMover.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

(function () {
    class DeskMover {
        // DeskMover creation options:
        // width: The width of the window
        // height: The height of the window
        // style: The style of the window, can be "ad" (Active Desktop), "nonad" (Non-Active Desktop), "wnd" (Window), default is "wnd"
        // centered: Whether the window should be centered
        // top: The top position of the window
        // left: The left position of the window
        // aot: Whether the window should be always on top
        // unresizable: Whether the window should be unresizable
        // noIcon: Whether the window should have an icon
        // If one of the options is not provided, the default value will be used

        // Other arguments:
        // windowContainer: The container of the window; should be a cloned div of the .windowContainer element in index.html
        // numStr: The number of the window, used for saving and loading configs
        // temp: Whether the window is temporary, will not save configs and will be destroyed on next load
        // src: The URL of the window, will be opened with docs viewer if the string does not end with .html
        // reinit: Whether the window is being reinitialized, will not add event listeners. Used for the reset feature; should not be used with temp windows

        constructor(windowContainer, numStr, src, temp, options = {}, reinit) {
            this.numStr = numStr;
            this.temp = temp;

            const width = options.width;
            const height = options.height;
            const style = options.style;
            const centered = options.centered;
            const top = options.top;
            const left = options.left;
            const aot = options.aot;
            const unresizable = options.unresizable;
            const noIcon = options.noIcon;

            this.windowContainer = windowContainer;
            this.windowTitlebar = windowContainer.querySelector(".windowTitlebar") || windowContainer.querySelector(".title-bar");
            this.windowTitleText = windowContainer.querySelector(".title-bar-text");
            this.windowFrame = windowContainer.querySelector(".windowFrame");
            this.windowElement = windowContainer.querySelector(".windowElement");
            this.windowMenuBtn = windowContainer.querySelector(".windowMenuBtn");
            this.windowIcon = windowContainer.querySelector(".windowIcon");
            this.windowCloseBtn = windowContainer.querySelector(".windowCloseBtn");
            this.windowCloseBtnAlt = windowContainer.querySelector(".windowCloseBtnAlt");
            this.contextMenuBg = windowContainer.querySelector(".contextMenuBg");
            this.contextMenu = windowContainer.querySelector(".contextMenu");
            this.contextMenuItems = this.contextMenu.querySelectorAll(".contextMenuItem");
            this.confMenuBg = windowContainer.querySelector(".confMenuBg");
            this.confMenu = windowContainer.querySelector(".confMenu");
            this.confMenuItems = this.confMenu.querySelectorAll(".contextMenuItem");
            this.dropdownBg = windowContainer.querySelector(".dropdownBg");
            this.dropdown = windowContainer.querySelector(".dropdown");
            this.resizeArea = windowContainer.querySelector(".resizeArea");

            this.mousePosition, this.posInWindow, this.posInContainer;
            this.offset = [0, 0];
            this.isDown = false;
            this.isDownOnResizeArea = false;
            this.resizingMode = "none";
            this.mouseOverWndBtns = false;
            this.noFrames = false;
            this.resizeAreaShown = false;

            this.timeout; // for handling ActiveDesktop style window frame hiding
            this.timeout2; // for handling context menu auto opening
            this.timeout3; // for handling context menu auto closing

            // for handling window double click
            this.dblClickPositon = null;
            this.dblClickEvent = null;
            this.dblClickTimer;

            this.firstLoadSuccess = false;
            this.isFullscreen = false;

            this.contextMenuOpening = false;
            this.shouldNotCloseConfMenu = false;

            this.prevOffsetRight, this.prevOffsetBottom;

            const tempConfigStorage = {};
            this.config = new Proxy(tempConfigStorage, {
                get(target, key) {
                    if (temp) { // Do not save configs for temporary windows
                        return target[key];
                    }
                    return localStorage.getItem("madesktopItem" + key[0].toUpperCase() + key.slice(1) + numStr);
                },
                set(target, key, value) {
                    if (temp) {
                        target[key] = value;
                    } else {
                        if (value !== false && value !== null && value !== undefined) {
                            localStorage.setItem("madesktopItem" + key[0].toUpperCase() + key.slice(1) + numStr, value);
                        } else {
                            localStorage.removeItem("madesktopItem" + key[0].toUpperCase() + key.slice(1) + numStr);
                        }
                    }
                    return true;
                },
                deleteProperty(target, key) {
                    if (temp) {
                        delete target[key];
                    } else {
                        localStorage.removeItem("madesktopItem" + key[0].toUpperCase() + key.slice(1) + numStr);
                    }
                    return true;
                }
            });

            if (this.windowContainer.style.display === "none") {
                this.windowContainer.style.display = "block";
            }

            this.windowElement.dataset.num = numStr;
            this.windowContainer.querySelector(".windowNumber").textContent = this.numStr;

            // #region Event listeners
            if (!reinit) {
                // Prevent window from resizing when dragging the dropdown scrollbar
                this.dropdownBg.addEventListener('pointerdown', preventDefault);

                // Prevent unintended menu closing when clicking the menu items
                this.contextMenuBg.addEventListener('click', preventDefault);
                this.contextMenuBg.addEventListener('pointerdown', preventDefault);
                this.contextMenuBg.addEventListener('pointerup', preventDefault);
                this.confMenuBg.addEventListener('click', preventDefault);
                this.confMenuBg.addEventListener('pointerdown', preventDefault);
                this.confMenuBg.addEventListener('pointerup', preventDefault);

                // Cancel animation when moving the cursor over the menu (Windows did this)
                this.contextMenuBg.addEventListener('pointermove', (event) => {
                    if (event.clientX > 0 || event.clientY > 0) {
                        this.contextMenuBg.style.animation = 'none';
                    }
                    event.preventDefault();
                    event.stopPropagation();
                });
                this.confMenuBg.addEventListener('pointermove', (event) => {
                    if (event.clientX > 0 || event.clientY > 0) {
                        this.confMenuBg.style.animation = 'none';
                    }
                    event.preventDefault();
                    event.stopPropagation();
                });

                this.contextMenuBg.addEventListener('focusout', this.closeContextMenu.bind(this));
                this.dropdownBg.addEventListener('focusout', this.closeDropdown.bind(this));

                this.resizeArea.addEventListener('pointerdown', () => {
                    this.isDownOnResizeArea = true;
                });

                this.windowContainer.addEventListener('pointerdown', this.#wcMouseDown.bind(this));
                document.addEventListener('pointerup', this.#docMouseUp.bind(this));
                this.windowElement.addEventListener('pointerover', this.#weMouseOver.bind(this));
                this.windowContainer.addEventListener('pointerleave', this.#wcMouseLeave.bind(this));
                document.addEventListener('pointermove', this.#docMouseMove.bind(this));
                this.windowContainer.addEventListener('pointermove', this.#wcMouseMove.bind(this));
                this.windowElement.addEventListener('load', this.#weLoad.bind(this));

                // Window menu button click & title bar right click
                this.windowMenuBtn.addEventListener('click', this.openContextMenu.bind(this));
                this.windowIcon.addEventListener('click', this.openContextMenu.bind(this));
                this.windowIcon.addEventListener('dblclick', this.closeWindow.bind(this));
                this.windowTitlebar.addEventListener('contextmenu', this.openContextMenuFromRightClick.bind(this));

                // Changes the active status correctly
                for (const elem of this.contextMenuItems) {
                    elem.onmouseover = () => {
                        for (const item of this.contextMenuItems) {
                            delete item.dataset.active;
                        }
                        elem.dataset.active = true;
                    }
                    elem.onmouseleave = () => {
                        if (Array.from(this.contextMenuItems).indexOf(elem) !== 0 ||
                            this.confMenuBg.style.display !== "block")
                        {
                            delete elem.dataset.active;
                        }
                    }
                }
                for (const elem of this.confMenuItems) {
                    elem.onmouseover = () => {
                        for (const item of this.confMenuItems) {
                            delete item.dataset.active;
                        }
                        elem.dataset.active = true;
                    }
                    elem.onmouseleave = () => {
                        delete elem.dataset.active;
                    }
                }

                // Context menu button listeners
                this.contextMenuItems[0].addEventListener('click', this.openConfMenu.bind(this)); // Configure button

                this.contextMenuItems[0].addEventListener('pointerover', () => { // Configure button mouseover
                    this.timeout2 = setTimeout(() => {
                        this.openConfMenu();
                    }, 300);
                });

                this.contextMenuItems[0].addEventListener('pointerleave', () => { // Configure button mouseleave
                    clearTimeout(this.timeout2);
                });

                this.contextMenuItems[1].addEventListener('click', () => { // Debug button
                    // Open DevTools first then click this button
                    // This allows you to debug current DeskMover
                    // Can call its functions in the console
                    debugger;
                });
                // Don't hide any menu on debug mouseover because it's better for debugging

                this.contextMenuItems[2].addEventListener('click', this.#reset.bind(this)); // Reset button

                this.contextMenuItems[3].addEventListener('click', () => { // Reload button
                    this.closeContextMenu();
                    if (this.config.src.startsWith('apps/channelviewer/') && !localStorage.madesktopDebugMode) {
                        this.windowElement.contentDocument.getElementById('refresh-button').click();
                    } else {
                        this.windowElement.src = this.config.src;
                    }
                });

                this.contextMenuItems[4].addEventListener('click', () => { // Close button
                    this.closeContextMenu();
                    this.closeWindow();
                });

                // Hide the config menu when hovering other items than Configure and Debug
                this.contextMenuItems[2].addEventListener('pointerover', this.#delayedCloseConfMenu.bind(this));
                this.contextMenuItems[3].addEventListener('pointerover', this.#delayedCloseConfMenu.bind(this));
                this.contextMenuItems[4].addEventListener('pointerover', this.#delayedCloseConfMenu.bind(this));

                this.contextMenuBg.addEventListener('pointerleave', () => {
                    this.#delayedCloseConfMenu(200);
                });

                this.confMenuBg.addEventListener('pointerover', () => {
                    this.shouldNotCloseConfMenu = true;
                    clearTimeout(this.timeout3);
                    this.contextMenuItems[0].dataset.active = true;
                });
                this.confMenuBg.addEventListener('pointerleave', () => {
                    this.shouldNotCloseConfMenu = false;
                });

                this.confMenuItems[0].addEventListener('click', () => { // Active Desktop style button
                    this.closeContextMenu();
                    this.changeWndStyle("ad");
                });

                this.confMenuItems[1].addEventListener('click', () => { // Non-Active Desktop style button
                    this.closeContextMenu();
                    this.changeWndStyle("nonad");
                });

                this.confMenuItems[2].addEventListener('click', () => { // Window style button
                    this.closeContextMenu();
                    this.changeWndStyle("wnd");
                });

                this.confMenuItems[3].addEventListener('click', this.#toggleScale.bind(this)); // Scale contents button
                this.confMenuItems[4].addEventListener('click', this.#toggleAoT.bind(this)); // Always on top button
                this.confMenuItems[5].addEventListener('click', this.toggleResizable.bind(this)); // Resizable button
                this.confMenuItems[6].addEventListener('click', this.#changeUrl.bind(this)); // Change URL button
                this.confMenuItems[7].addEventListener('click', this.#changeTitle.bind(this)); // Change title button

                this.confMenuItems[8].addEventListener('click', () => { // New window button
                    this.closeContextMenu();
                    openWindow();
                });

                this.confMenuItems[9].addEventListener('click', () => { // Reload wallpaper button
                    this.closeContextMenu();
                    location.reload();
                });

                this.confMenuItems[10].addEventListener('click', () => { // Properties button
                    this.closeContextMenu();
                    openConfig();
                });

                this.windowCloseBtn.addEventListener('click', this.closeWindow.bind(this));
                this.windowCloseBtnAlt.addEventListener('click', this.closeWindow.bind(this));
            
                this.windowMenuBtn.addEventListener('pointerover', () => {
                    this.mouseOverWndBtns = true;
                });

                this.windowIcon.addEventListener('pointerover', () => {
                    this.mouseOverWndBtns = true;
                });

                this.windowCloseBtn.addEventListener('pointerover', () => {
                    this.mouseOverWndBtns = true;
                });

                this.windowCloseBtnAlt.addEventListener('pointerover', () => {
                    this.mouseOverWndBtns = true;
                });

                this.windowMenuBtn.addEventListener('pointerout', () => {
                    this.mouseOverWndBtns = false;
                });

                this.windowIcon.addEventListener('pointerout', () => {
                    this.mouseOverWndBtns = false;
                });

                this.windowCloseBtn.addEventListener('pointerout', () => {
                    this.mouseOverWndBtns = false;
                });

                this.windowCloseBtnAlt.addEventListener('pointerout', () => {
                    this.mouseOverWndBtns = false;
                });
            }
            // #endregion

            // #region Init
            // Load configs
            if (this.config.width) {
                this.windowElement.width = this.config.width;
            }
            if (this.config.height) {
                this.windowElement.height = this.config.height;
            }
            if (this.config.xPos) {
                this.windowContainer.style.left = this.config.xPos;
            } else {
                this.windowContainer.style.left = window.vWidth - this.windowContainer.offsetWidth - 100 + 'px';
            }
            if (this.config.yPos) {
                this.windowContainer.style.top = this.config.yPos;
            }
            this.changeWndStyle(this.config.style || style || "ad", !!this.config.style);
            if (this.config.unscaled) {
                this.confMenuItems[3].classList.remove("checkedItem");
            } else {
                this.confMenuItems[3].classList.add("checkedItem");
            }
            if (this.config.alwaysOnTop) {
                this.windowContainer.style.zIndex = (this.config.zIndex + 50000) || ++lastAoTZIndex;
                this.confMenuItems[4].classList.add("checkedItem");
            } else {
                this.windowContainer.style.zIndex = this.config.zIndex || ++lastZIndex;
                this.confMenuItems[4].classList.remove("checkedItem");
            }
            if (this.config.unresizable) {
                this.confMenuItems[5].classList.remove("checkedItem");
                this.windowContainer.dataset.unresizable = true;
            } else {
                this.confMenuItems[5].classList.add("checkedItem");
                delete this.windowContainer.dataset.unresizable;
            }
            this.windowTitleText.textContent = this.config.title || "ModernActiveDesktop";
            this.adjustElements();
            this.#keepInside();
            this.closeContextMenu();
            this.changeCmAnimation(localStorage.madesktopCmAnimation || "slide");
            if (!this.config.active && !localStorage.madesktopNoDeactivate) {
                this.windowContainer.dataset.inactive = true;
                this.windowTitlebar.classList.add("inactive");
            } else {
                delete this.windowContainer.dataset.inactive;
                this.windowTitlebar.classList.remove("inactive");
            }
            this.noFrames = this.config.noFrames;

            if (this.config.src) {
                this.windowElement.src = this.config.src;
            } else {
                if (this.numStr !== "" || reinit) {
                    // Assign default values
                    this.changeWndStyle(style || "wnd");

                    const winOpenAnim = getComputedStyle(this.windowContainer).getPropertyValue('--win-open-anim');
                    if (winOpenAnim && !localStorage.madesktopNoWinAnim && this.config.style === "wnd" && !reinit) {
                        this.windowContainer.style.animation = `0.22s ${winOpenAnim} linear`;
                        this.windowContainer.addEventListener("animationend", () => {
                            this.windowContainer.style.animation = "";
                        }, {once: true});
                    }

                    let url = "placeholder.html";
                    let defaultLeft = window.vWidth - (parseInt(localStorage.madesktopChanViewRightMargin) || 0) - 600 + 'px';
                    let defaultTop = '200px';
                    if ((typeof src === "string" || src instanceof String) && src != "placeholder.html" && !reinit) {
                        if (src.startsWith("apps/madconf/")) {
                            this.windowElement.width = width || '398px';
                            this.windowElement.height = height || '423px';
                            this.toggleResizable();
                            this.setIcon(false);
                        } else {
                            this.windowElement.width = width || '800px';
                            this.windowElement.height = height || '600px';
                            if (unresizable) {
                                this.toggleResizable();
                            }
                            if (noIcon) {
                                this.setIcon(false);
                            }
                        }
                        defaultLeft = left || (parseInt(localStorage.madesktopChanViewLeftMargin) || 75) + 250 + 'px';
                        defaultTop = top || '150px';
                        url = src.includes(".html") ? src : `docs/index.html?src=${src}`;
                        if (aot) {
                            this.#toggleAoT();
                        }
                    } else {
                        this.windowElement.width = width || '300px';
                        this.windowElement.height = height || '200px';
                        this.adjustElements();
                    }
                    [defaultLeft, defaultTop] = cascadeWindow(defaultLeft, defaultTop);
                    this.windowContainer.style.left = defaultLeft;
                    this.windowContainer.style.top = defaultTop;
                    this.adjustElements();

                    if (centered) {
                        this.windowContainer.style.left = (window.vWidth - this.windowContainer.offsetWidth) / 2 + 'px';
                        this.windowContainer.style.top = (window.vHeight - this.windowContainer.offsetHeight) / 2 + 'px';
                    }

                    this.#keepInside();
                    this.#saveConfig();

                    this.windowElement.src = url;
                    this.config.src = url;
                } else {
                    // The default channel bar window (DeskMover 0) defined in index.html
                    if (!localStorage.madesktopItemXPos) {
                        this.windowContainer.style.left = window.vWidth - this.windowContainer.offsetWidth - (parseInt(localStorage.madesktopChanViewRightMargin) || 0) - 100 + 'px';
                    }
                    // Otherwise the load event is not fired occasionally
                    this.windowElement.src = "ChannelBar.html";
                    this.config.src = "ChannelBar.html";
                }
            }
            this.windowElement.contentWindow.focus();
            // #endregion
        }

        async closeWindow() {
            if (this.beforeClose) {
                try {
                    await this.beforeClose(localStorage, window);
                } catch (error) {
                    console.error(error);
                }
            }
            const winCloseAnim = getComputedStyle(this.windowContainer).getPropertyValue('--win-close-anim');
            if (winCloseAnim && !localStorage.madesktopNoWinAnim && this.config.style === "wnd") {
                this.windowContainer.style.animation = `0.2s ${winCloseAnim} linear`;
                await waitForAnim(this.windowContainer);
            }
            if (this.numStr !== "") {
                this.windowContainer.style.display = "none";
                this.windowContainer.innerHTML = "";
                if (!this.temp) {
                    this.#clearConfig();
                    let openWindows = localStorage.madesktopOpenWindows.split(',');
                    openWindows.splice(openWindows.indexOf(this.numStr), 1);
                    localStorage.madesktopOpenWindows = openWindows;
                }
                if (this.isVisualizer) {
                    window.visDeskMover = null;
                    window.livelyAudioListener = () => {};
                }
                if (this.isConfigurator) {
                    window.confDeskMover = null;
                }
                delete deskMovers[this.numStr];
                this.windowContainer.remove();
                let prevActiveWindow = activeWindowHistory.pop();
                while (prevActiveWindow && !deskMovers[prevActiveWindow] && prevActiveWindow !== parseInt(this.numStr)) {
                    prevActiveWindow = activeWindowHistory.pop();
                }
                activateWindow(prevActiveWindow);
            } else {
                this.#clearConfig();
                this.windowContainer.style.display = 'none';
                localStorage.madesktopItemVisible = false;
            }
        }

        openContextMenu() {
            this.contextMenuBg.style.left = '';
            this.contextMenuBg.style.top = '';

            // Windows without icons aren't designed to look good in different sizes yet
            // So just hide the menus for now
            if (this.windowTitlebar.classList.contains("noIcon")) {
                this.contextMenuItems[0].dataset.hidden = true;
                this.contextMenuItems[2].dataset.hidden = true;
                this.contextMenuItems[3].dataset.hidden = true;
            } else {
                delete this.contextMenuItems[0].dataset.hidden;
                delete this.contextMenuItems[2].dataset.hidden;
                delete this.contextMenuItems[3].dataset.hidden;
            }

            switch (localStorage.madesktopCmAnimation) {
                case 'none':
                    this.contextMenuBg.style.animation = 'none';
                    break;
                case 'fade':
                    this.contextMenuBg.style.animation = 'fade 0.2s';
                    break;
                case 'slide':
                default:
                    this.contextMenuBg.style.animation = 'cmDropdown 0.25s linear';
            }

            for (const item of this.contextMenuItems) {
                delete item.dataset.active;
            }
            this.contextMenuBg.style.display = "block";
            const width = this.calcMenuWidth("window");
            this.contextMenuBg.style.width = width + ")";
            this.contextMenu.style.width = width + " - 2px)";
            this.contextMenuBg.style.height = this.calcMenuHeight("window") + "px";

            // For handling window icon double click
            // Note: dblclick doesn't fire in WPE
            this.contextMenuOpening = this.posInContainer;
            setTimeout(() => {
                this.contextMenuOpening = null;
            }, 500);

            iframeClickEventCtrl(false);
            isContextMenuOpen = true;
            this.contextMenuBg.focus();
            openedMenu = this.contextMenuBg;
            document.addEventListener('keydown', menuNavigationHandler);
        }

        openContextMenuFromRightClick(event) {
            this.bringToTop();
            this.contextMenuBg.style.left = this.posInContainer.x + 'px';
            this.contextMenuBg.style.top = this.posInContainer.y + 'px';

            // Windows without icons aren't designed to look good in different sizes yet
            // So just hide the menus for now
            if (this.windowTitlebar.classList.contains("noIcon")) {
                this.contextMenuItems[0].dataset.hidden = true;
                this.contextMenuItems[2].dataset.hidden = true;
                this.contextMenuItems[3].dataset.hidden = true;
            } else {
                delete this.contextMenuItems[0].dataset.hidden;
                delete this.contextMenuItems[2].dataset.hidden;
                delete this.contextMenuItems[3].dataset.hidden;
            }

            switch (localStorage.madesktopCmAnimation) {
                case 'none':
                    this.contextMenuBg.style.animation = 'none';
                    break;
                case 'fade':
                    this.contextMenuBg.style.animation = 'fade 0.2s';
                    break;
                case 'slide':
                default:
                    this.contextMenuBg.style.animation = 'cmDropdownright 0.25s linear';
                    this.contextMenuBg.style.pointerEvents = 'none';
                    this.contextMenuBg.addEventListener('animationend', () => {
                        this.contextMenuBg.style.pointerEvents = '';
                    }, {once: true});
            }

            for (const item of this.contextMenuItems) {
                delete item.dataset.active;
            }
            this.contextMenuBg.style.display = "block";
            const width = this.calcMenuWidth("window");
            this.contextMenuBg.style.width = width + ")";
            this.contextMenu.style.width = width + " - 2px)";
            this.contextMenuBg.style.height = this.calcMenuHeight("window") + "px";

            iframeClickEventCtrl(false);
            isContextMenuOpen = true;
            this.contextMenuBg.focus();
            openedMenu = this.contextMenuBg;
            document.addEventListener('keydown', menuNavigationHandler);
            event.preventDefault();
        }

        closeContextMenu() {
            if (isContextMenuOpen && this.contextMenuOpening) {
                if (this.contextMenuOpening === this.posInContainer && this.config.style === "wnd")
                {
                    this.closeWindow();
                    return;
                }
            }

            this.shouldNotCloseConfMenu = false;
            this.contextMenuBg.style.display = "none";
            this.closeConfMenu();
            iframeClickEventCtrl(true);
            isContextMenuOpen = false;
            openedMenu = null;
            document.removeEventListener('keydown', menuNavigationHandler);
        }

        openConfMenu() {
            if (this.confMenuBg.style.display === "block" || this.contextMenuBg.style.display !== "block") {
                return;
            }
            switch (localStorage.madesktopCmAnimation) {
                case 'none':
                    this.confMenuBg.style.animation = 'none';
                    break;
                case 'fade':
                    this.confMenuBg.style.animation = 'fade 0.2s';
                    break;
                case 'slide':
                default:
                    this.confMenuBg.style.animation = 'cmDropright 0.25s linear';
            }

            for (const item of this.confMenuItems) {
                delete item.dataset.active;
            }
            if (window.isIframeAutoScaled) {
                this.confMenuItems[3].dataset.hidden = true;
            } else {
                // Normally this variable never reverts to false tho
                delete this.confMenuItems[3].dataset.hidden;
            }
            this.contextMenuItems[0].dataset.active = true;
            this.confMenuBg.style.left = this.contextMenuBg.offsetLeft + this.contextMenuBg.offsetWidth - 6 + 'px';
            this.confMenuBg.style.top = this.contextMenuBg.offsetTop + this.contextMenuItems[0].offsetTop + 'px';
            this.confMenuBg.style.display = "block";
            const width = this.calcMenuWidth("conf");
            this.confMenuBg.style.width = width + ")";
            this.confMenu.style.width = width + " - 2px)";
            this.confMenuBg.style.height = this.calcMenuHeight("conf") + "px";
            iframeClickEventCtrl(false);
            openedMenu = this.confMenuBg;
            openedMenuCloseFunc = this.closeConfMenu.bind(this);
        }

        closeConfMenu(force) {
            if (this.shouldNotCloseConfMenu && !force) {
                return
            }
            delete this.contextMenuItems[0].dataset.active;
            this.confMenuBg.style.display = "none";
            openedMenu = this.contextMenuBg;
            openedMenuCloseFunc = null;
        }

        #delayedCloseConfMenu(delay) { 
            if (typeof delay !== "number") {
                delay = 300;
            }
            this.timeout3 = setTimeout(this.closeConfMenu.bind(this), delay);
        }

        calcMenuWidth(menuName) {
            const menuBg = this.windowContainer.getElementsByClassName(menuName + 'MenuBg')[0];
            let menuItems;
            if (localStorage.madesktopDebugMode) {
                menuItems = menuBg.querySelectorAll('.contextMenuItem:not([data-hidden])');
            } else {
                menuItems = menuBg.querySelectorAll('.contextMenuItem:not([data-hidden]):not(.debug)');
            }
            const width = Array.from(menuItems).reduce((maxWidth, elem) => {
                const text = elem.textContent;
                const width = getTextWidth(text);
                return Math.max(maxWidth, width);
            }, 0);
            return `calc(${width}px + 4.5em`;
        }

        calcMenuHeight(menuName) {
            const menuBg = this.windowContainer.getElementsByClassName(menuName + 'MenuBg')[0];
            let menuItems;
            if (localStorage.madesktopDebugMode) {
                menuItems = menuBg.querySelectorAll('.contextMenuItem:not([data-hidden])');
            } else {
                menuItems = menuBg.querySelectorAll('.contextMenuItem:not([data-hidden]):not(.debug)');
            }
            const separators = menuBg.querySelectorAll('hr');
            const menuItemHeight = menuItems[0].offsetHeight;
            let separatorHeight = 0;
            if (separators.length > 0) {
                const styles = getComputedStyle(separators[0]);
                separatorHeight = separators[0].offsetHeight + parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
            }
            const height = parseInt(menuItems.length * menuItemHeight + separators.length * separatorHeight);
            return height;
        }

        setIcon(icon) {
            if (icon) {
                this.windowTitlebar.classList.remove("noIcon");
                if (typeof icon === "string" || icon instanceof String) {
                    this.windowIcon.src = icon;
                }
            } else if (!localStorage.madesktopDebugMode) {
                this.windowTitlebar.classList.add("noIcon");
            } else {
                this.windowTitlebar.classList.remove("noIcon");
            }
        }

        changeWndStyle(style, temp) {
            if (!temp && !style) {
                style = this.config.style;
            }
            if (style === "noframes") {
                style = "ad";
                if (!temp) {
                    this.config.noFrames = true;
                }
                this.noFrames = true;
                clearTimeout(this.timeout);
            } else {
                if (!temp) {
                    this.config.noFrames = false;
                }
                this.noFrames = false;
            }
            switch (style) {
                case "nonad":
                    this.windowContainer.classList.add("window");
                    this.windowTitlebar.classList.add("windowTitlebar");
                    this.windowTitlebar.classList.remove("title-bar");
                    this.windowTitlebar.style.display = "block";
                    this.windowTitlebar.style.left = "2px";
                    this.windowTitlebar.style.top = "3px";
                    this.windowTitlebar.style.width = this.windowElement.offsetWidth + 'px';
                    this.windowElement.style.borderColor = "transparent";
                    this.windowFrame.style.borderColor = "transparent";
                    this.windowFrame.style.backgroundColor = "transparent";
                    this.confMenuItems[0].classList.remove("activeStyle");
                    this.confMenuItems[1].classList.add("activeStyle");
                    this.confMenuItems[2].classList.remove("activeStyle");
                    break;
                case "ad":
                    this.windowContainer.classList.remove("window");
                    this.windowTitlebar.classList.add("windowTitlebar");
                    this.windowTitlebar.classList.remove("title-bar");
                    this.windowTitlebar.style.display = "none";
                    this.windowTitlebar.style.left = "0px";
                    this.windowTitlebar.style.top = "6px";
                    this.windowTitlebar.style.width = this.windowElement.offsetWidth + 4 + 'px';
                    this.confMenuItems[0].classList.add("activeStyle");
                    this.confMenuItems[1].classList.remove("activeStyle");
                    this.confMenuItems[2].classList.remove("activeStyle");
                    break;
                case "wnd":
                    this.windowContainer.classList.add("window");
                    this.windowTitlebar.classList.remove("windowTitlebar");
                    this.windowTitlebar.classList.add("title-bar");
                    this.windowTitlebar.style.display = "flex";
                    this.windowTitlebar.style.left = "2px";
                    this.windowTitlebar.style.top = "3px";
                    this.windowTitlebar.style.width = 'auto';
                    this.windowElement.style.borderColor = "transparent";
                    this.windowFrame.style.borderColor = "transparent";
                    this.windowFrame.style.backgroundColor = "transparent";
                    this.confMenuItems[0].classList.remove("activeStyle");
                    this.confMenuItems[1].classList.remove("activeStyle");
                    this.confMenuItems[2].classList.add("activeStyle");
            }
            if (!temp) {
                this.config.style = style;
            }
            this.windowContainer.dataset.style = style;
            this.adjustElements();
        }

        changeCmAnimation(type) {
            if (type === "none") {
                this.dropdownBg.style.animation = "none";
            } else {
                this.dropdownBg.style.animation = "cmDropdown 0.25s linear";
            }
        }

        openDropdown(elem, iframe) {
            // Suppress the original dropdown
            elem.blur();
            elem.dataset.open = true;
            this.lastDropdown = elem;

            const label = elem.querySelector(".label");
            const dummy = this.dropdownBg.querySelector(".dropdownItem");
            let options = elem.options || elem.querySelectorAll("option");
            const optionsUnsorted = Array.from(options);
            let optionCnt = 0;
            let selectedIndex = 0;

            if (this.dropdown.childElementCount > 1) {
                for (let i = this.dropdown.childElementCount - 1; i > 0; i--) {
                    this.dropdown.removeChild(this.dropdown.children[i]);
                }
            }

            if (elem.dataset.sorted) {
                options = Array.from(options).sort((a, b) => a.textContent.localeCompare(b.textContent));
            }
            for (const option of options) {
                const origIndex = optionsUnsorted.indexOf(option);
                if (option.hidden) {
                    continue;
                }
                if (option.dataset.condition) {
                    if (!localStorage.getItem(option.dataset.condition)) {
                        continue;
                    }
                }
                if (option.dataset.conditionRunmode) {
                    if (runningMode !== parseInt(option.dataset.conditionRunmode)) {
                        continue;
                    }
                }
                const item = dummy.cloneNode(true);
                item.textContent = option.textContent;
                item.dataset.value = option.value;
                if (elem.selectedIndex === origIndex) {
                    selectedIndex = origIndex;
                    item.dataset.hover = true;
                }
                item.addEventListener('click', () => {
                    elem.selectedIndex = origIndex;
                    elem.dispatchEvent(new Event('change'));
                    if (label) {
                        label.textContent = item.textContent;
                    }
                    this.closeDropdown();
                });
                item.addEventListener('pointerover', () => {
                    for (let i = 1; i < this.dropdown.childElementCount; i++) {
                        delete this.dropdown.children[i].dataset.hover;
                    }
                    item.dataset.hover = true;
                });
                this.dropdown.appendChild(item);
                optionCnt++;
            }

            if (this.dropdownBg.style.animationName !== "none") {
                this.dropdownBg.style.pointerEvents = "none";
                this.dropdownBg.addEventListener("animationend", () => {
                    this.dropdownBg.style.pointerEvents = "";
                }, {once: true});
            }

            // Set these first to ensure the item height is retrieved correctly
            this.dropdownBg.style.display = "block";

            const clientRect = elem.getBoundingClientRect();
            let left = clientRect.left + 1;
            let top = clientRect.top + elem.offsetHeight;
            let width = elem.offsetWidth - 2;
            if (this.config.unscaled) {
                left /= window.scaleFactor;
                top /= window.scaleFactor;
                width /= window.scaleFactor;
            }
            if (iframe) {
                const iframeRect = iframe.getBoundingClientRect();
                const padding = parseInt(getComputedStyle(iframe).padding);
                left += iframeRect.left + padding;
                top += iframeRect.top + padding;
            }
            this.dropdownBg.style.left = left + "px";
            this.dropdownBg.style.top = top + "px";
            this.dropdownBg.style.width = width + "px";
            this.dropdown.style.width = this.dropdownBg.style.width;

            let height = 0;
            for (let i = 1; i <= Math.min(optionCnt, 25); i++) {
                let itemHeight = this.dropdown.children[i].getBoundingClientRect().height;
                if (window.isIframeAutoScaled) {
                    itemHeight /= window.scaleFactor; // somehow the height is also wrongly scaled in recent browsers with iframe auto scaling
                }
                height += itemHeight;
            }
            this.dropdownBg.style.height = height + "px";
            this.dropdown.style.height = this.dropdownBg.style.height;

            if (selectedIndex > 12) {
                this.dropdown.scrollTop = (selectedIndex - 12) * this.dropdown.children[1].getBoundingClientRect().height;
            } else {
                this.dropdown.scrollTop = 0;
            }

            iframeClickEventCtrl(false);
            this.dropdownBg.focus();
        }

        closeDropdown() {
            this.dropdownBg.style.display = "none";
            delete this.lastDropdown.dataset.open;
            iframeClickEventCtrl(true);
        }

        openMiniColorPicker(elem, initialColor, callback, noDithering) {
            const miniPicker = miniPickerBase.cloneNode(true);
            const miniPickerColors = miniPicker.querySelectorAll(".miniPickerColor");
            const openColorPickerBtn = miniPicker.querySelector(".openColorPickerBtn");
            miniPicker.style.display = "block";

            const clientRect = elem.getBoundingClientRect();
            let top = parseInt(this.config.yPos); 
            let left = parseInt(this.config.xPos);
            if (this.config.unscaled) {
                top += (clientRect.top + elem.offsetHeight) / window.scaleFactor;
                left += clientRect.left / window.scaleFactor;
            } else {
                top += clientRect.top + elem.offsetHeight;
                left += clientRect.left;
            }
            top += this.windowFrame.offsetTop + 3;
            left += this.windowFrame.offsetLeft + 3;

            if (left + 78 > window.innerWidth) {
                left = window.innerWidth - 78;
            }
            if (top + 121 > window.innerHeight) {
                top = window.innerHeight - 121;
            }

            miniPicker.style.top = `${top}px`;
            miniPicker.style.left = `${left}px`;
            miniPicker.style.display = "block";

            for (const miniPickerColor of miniPickerColors) {
                miniPickerColor.addEventListener("click", function () {
                    callback(this.style.backgroundColor);
                    miniPicker.blur();
                });
            }

            openColorPickerBtn.addEventListener("click", () => {
                this.openColorPicker(initialColor, true, callback, noDithering);
                miniPicker.blur();
            });

            miniPicker.addEventListener("focusout", function (event) {
                if (event.relatedTarget !== elem && event.relatedTarget !== openColorPickerBtn) {
                    miniPicker.style.display = "none";
                    miniPicker.remove();
                }
            });

            document.body.appendChild(miniPicker);
            miniPicker.focus();
        }

        openColorPicker(initialColor, expand, callback, noDithering) {
            const left = parseInt(this.config.xPos) + 4 + 'px';
            const top = parseInt(this.config.yPos) + 26 + 'px';
            const options = {
                left, top, width: expand ? "447px" : "219px", height: "298px",
                aot: true, unresizable: true, noIcon: true
            }
            const colorPicker = openWindow("apps/colorpicker/index.html", true, options);
            const colorPickerWindow = colorPicker.windowElement.contentWindow;
            colorPickerWindow.addEventListener("load", () => {
                colorPickerWindow.choose_color(initialColor, expand, callback, noDithering);
            });
        }

        locReplace(url) {
            this.windowElement.src = url;
            this.config.src = url;
        }

        moveTo(x, y) {
            [x, y] = cascadeWindow(x, y);
            this.windowContainer.style.left = x;
            this.windowContainer.style.top = y;
            this.#keepInside();
            this.#saveConfig();
        }

        resizeTo(width, height) {
            if (width) {
                this.windowElement.width = width + 'px';
            }
            if (height) {
                this.windowElement.height = height + 'px';
            }
            this.adjustElements();
            this.#keepInside();
            this.#saveConfig();
        }

        extendMoveTarget(isExtended, dblClickEvent) {
            if (isExtended) {
                this.windowElement.style.pointerEvents = "none";
                this.dblClickEvent = (event) => {
                    if (this.dblClickPositon !== null && event.clientX === this.dblClickPositon.x && event.clientY === this.dblClickPositon.y) {
                        this.dblClickPositon = null;
                        dblClickEvent(event);
                        event.preventDefault();
                    }
                    clearTimeout(this.dblClickTimer);
                    this.dblClickPositon = { x: event.clientX, y: event.clientY };
                    this.dblClickTimer = setTimeout(() => {
                        this.dblClickPositon = null;
                    }, 500);
                }
                this.windowFrame.addEventListener("pointerdown", this.dblClickEvent);
                this.#docMouseUp();
            } else {
                this.windowElement.style.pointerEvents = "";
                this.windowFrame.removeEventListener("pointerdown", this.dblClickEvent);
                this.dblClickEvent = null;
            }
        }

        enterFullscreen(withMargins) {
            this.changeWndStyle("noframes", true);
            let marginTop = 0, marginLeft = 0, marginRight = 0, marginBottom = 0;
            if (withMargins) {
                marginTop = parseInt(localStorage.madesktopChanViewTopMargin || "0");
                marginLeft = parseInt(localStorage.madesktopChanViewLeftMargin || "75px");
                marginRight = parseInt(localStorage.madesktopChanViewRightMargin || "0");
                marginBottom = parseInt(localStorage.madesktopChanViewBottomMargin || "48px");
            }
            // This doesn't require user gesture
            // There's no visual difference between this and the real fullscreen in Wallpaper Engine
            const outlineSize = parseInt(getComputedStyle(this.windowElement).getPropertyValue('outline-width'));
            this.windowElement.style.top = -(this.windowFrame.offsetTop + this.windowContainer.offsetTop + outlineSize + 3) + marginTop + "px";
            this.windowElement.style.left = -(this.windowFrame.offsetLeft + this.windowContainer.offsetLeft + outlineSize + 3) + marginLeft + "px";
            this.windowElement.style.width = window.vWidth - marginLeft - marginRight + "px";
            this.windowElement.style.height = window.vHeight - marginTop - marginBottom + "px";
            this.resizeArea.style.display = "none";
            this.isFullscreen = true;
            this.isFullscreenWithMargins = withMargins;
            this.windowElement.contentDocument.body.dataset.fullscreen = true;
            // But try this anyway for browser usage
            if (window.runningMode === BROWSER && this.windowElement.requestFullscreen) {
                document.body.requestFullscreen();
            }
        }

        async exitFullscreen() {
            this.changeWndStyle();
            this.windowElement.style.top = "";
            this.windowElement.style.left = "";
            this.windowElement.style.width = "";
            this.windowElement.style.height = "";
            if (this.resizeAreaShown) {
                this.resizeArea.style.display = "block";
            }
            this.isFullscreen = false;
            this.isFullscreenWithMargins = false;
            delete this.windowElement.contentDocument.body.dataset.fullscreen;
            if (document.fullscreenElement) {
                document.exitFullscreen();
                await asyncTimeout(100);
            }
            this.adjustElements();
        }

        setResizeArea(show) {
            if (show) {
                if (show === 2) {
                    // For resize areas located at the corner of two scroll bars
                    this.resizeArea.classList.add("extraMargin");
                } else {
                    this.resizeArea.classList.remove("extraMargin");
                }
                this.resizeArea.style.display = "block";
                this.resizeAreaShown = true;
            } else {
                this.resizeArea.style.display = "none";
                this.resizeAreaShown = false;
            }
        }

        #wcMouseDown(event) {
            this.bringToTop();
            if (event.button !== 0) return;
            if ((this.windowFrame.style.borderColor !== "transparent" || this.config.style !== "ad" || this.dblClickEvent) && !this.mouseOverWndBtns && !this.isFullscreen) {
                iframeClickEventCtrl(false);
                this.isDown = true;
                this.offset = [
                    this.windowContainer.offsetLeft - Math.ceil(event.clientX / window.scaleFactor), // event.clientXY doesn't work well with css zoom
                    this.windowContainer.offsetTop - Math.ceil(event.clientY / window.scaleFactor)
                ];
                this.posInContainer = {
                    x : Math.ceil(event.clientX / window.scaleFactor) - this.windowContainer.offsetLeft,
                    y : Math.ceil(event.clientY / window.scaleFactor) - this.windowContainer.offsetTop,
                }
                let extraBorderSize = 0;
                if (this.config.style === "wnd" || this.config.style === "nonad") {
                    extraBorderSize = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-border-size'));
                }
                this.#updatePrevOffset();
                log([this.posInContainer.x, this.posInContainer.y]);
                // Decide the resizing mode based on the position of the mouse cursor
                let left = this.posInContainer.x <= 3 + extraBorderSize;
                let right = this.posInContainer.x >= this.windowContainer.offsetWidth - 4 - extraBorderSize;
                let top = this.config.style === "ad" ? this.posInContainer.y <= 9 && this.posInContainer.y >= 6 : this.posInContainer.y <= 3 + extraBorderSize;
                let bottom = this.config.style === "ad" ?
                    (this.posInContainer.y >= this.windowContainer.offsetHeight - 18 && this.posInContainer.y <= this.windowContainer.offsetHeight - 15) :
                    this.posInContainer.y >= this.windowContainer.offsetHeight - 4 - extraBorderSize;
                // More tolerance for diagonal resizing
                if ((left || right) && !top && !bottom) {
                    if (this.config.style === "ad") {
                        if (this.posInContainer.y <= 14 && this.posInContainer.y >= 6) {
                            top = true;
                        }
                        if ((this.posInContainer.y >= this.windowContainer.offsetHeight - 23 && this.posInContainer.y <= this.windowContainer.offsetHeight - 15)) {
                            bottom = true;
                        }
                    } else {
                        if (this.posInContainer.y <= 8 + extraBorderSize) {
                            top = true;
                        }
                        if (this.posInContainer.y >= this.windowContainer.offsetHeight - 11 - extraBorderSize) {
                            bottom = true;
                        }
                    }
                }
                if ((top || bottom) && !left && !right) {
                    if (this.posInContainer.x <= 8 + extraBorderSize) {
                        left = true;
                    }
                    if (this.posInContainer.x >= this.windowContainer.offsetWidth - 9 - extraBorderSize) {
                        right = true;
                    }
                }
                if (this.isDownOnResizeArea) {
                    right = true;
                    bottom = true;
                }
                const move = !left && !right && !top && !bottom && (this.posInContainer.y >= 6 || this.config.style !== "ad");
                log({ left, right, top, bottom, move });
                if (move) {
                    this.resizingMode = "none";
                } else if (!this.config.unresizable) {
                    if (left && top) {
                        this.resizingMode = "lefttop";
                    } else if (right && top) {
                        this.resizingMode = "righttop";
                    } else if (left && bottom) {
                        this.resizingMode = "leftbottom";
                    } else if (right && bottom) {
                        this.resizingMode = "rightbottom";
                    } else if (left) {
                        this.resizingMode = "left";
                    } else if (right) {
                        this.resizingMode = "right";
                    } else if (top) {
                        this.resizingMode = "top";
                    } else if (bottom) {
                        this.resizingMode = "bottom";
                    } else {
                        this.resizingMode = null;
                    }
                } else {
                    this.resizingMode = null;
                }
                log(this.resizingMode);

                if (this.resizingMode === null) {
                    this.isDown = false;
                    return;
                }

                if (localStorage.madesktopOutlineMode && this.config.style !== "ad") {
                    const extraBorderSize = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-border-size'));
                    if (this.config.style === "nonad") {
                        this.borderSize = 3;
                        windowOutline.style.padding = this.borderSize + "px";
                    } else {
                        this.borderSize = extraBorderSize + 3;
                        if (localStorage.madesktopColorScheme === "7css4mad") {
                            this.borderSize -= 0;
                        }
                        if (this.config.unresizable) {
                            windowOutline.style.padding = "1px";
                        } else {
                            windowOutline.style.padding = this.borderSize + "px";
                        }
                    }
                    let extraOffset = +(localStorage.madesktopColorScheme === "7css4mad");
                    windowOutline.style.left = this.windowContainer.offsetLeft + extraOffset + "px";
                    windowOutline.style.top = this.windowContainer.offsetTop + extraOffset + "px";
                    windowOutline.style.width = this.windowContainer.offsetWidth - extraOffset * 2 + "px";
                    windowOutline.style.height = this.windowContainer.offsetHeight - extraOffset * 2 + "px";
                    if (localStorage.madesktopDebugMode) {
                        windowOutline.style.display = "block";
                    }
                }
            }
        }

        #docMouseUp() {
            iframeClickEventCtrl(true);
            if (this.isDown && localStorage.madesktopOutlineMode && this.config.style !== "ad" &&
                this.resizingMode !== null && windowOutline.style.display === "block")
            {
                let extraBorderSize = 0;
                let extraBorderBottom = 0;
                if (this.config.style === "wnd") {
                    extraBorderSize = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-border-size'));
                    extraBorderBottom = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-border-bottom'));
                }
                let extraOffset = +(localStorage.madesktopColorScheme === "7css4mad");
                log({ extraBorderSize, extraBorderBottom, extraOffset });
                this.windowContainer.style.left = parseInt(windowOutline.style.left) - extraOffset + "px";
                this.windowContainer.style.top = parseInt(windowOutline.style.top) - extraOffset + "px";
                this.windowElement.width = windowOutline.offsetWidth - this.borderSize * 2 + "px";
                this.windowElement.height = windowOutline.offsetHeight - this.windowFrame.offsetTop - extraBorderSize - extraBorderBottom - 6 + "px";
                windowOutline.style.display = "none";
            }
            this.isDown = false;
            this.isDownOnResizeArea = false;

            if (this.windowContainer.style.display === "none") return; // offsets are always 0 when hidden, causing unexpected behaviors
            // Minimum size
            if (this.windowElement.offsetWidth < 60) this.windowElement.width = "60px";
            if (this.windowElement.offsetHeight < 15) this.windowElement.height = "15px";
            this.#keepInside();
            this.adjustElements();
            this.#saveConfig();

            this.resizingMode = "none";
            document.body.style.cursor = "auto";
        }

        #weMouseOver() {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(this.#updateWindowComponentVisibility.bind(this), 500);
        }

        #wcMouseLeave() {
            if (!this.isDown) {
                document.body.style.cursor = "auto";
                clearTimeout(this.timeout);
                if (this.config.style !== "ad") return; // never hide the frames in nonAD mode
                this.timeout = setTimeout(() => {   
                    this.windowElement.style.borderColor = "transparent";
                    this.windowFrame.style.borderColor = "transparent";
                    this.windowFrame.style.backgroundColor = "transparent";
                    this.windowTitlebar.style.display = "none";
                }, 2000);
            } else {
                clearTimeout(this.timeout);
            }
        }

        #docMouseMove(event) {
            this.mousePosition = {
                x : Math.ceil(event.clientX / window.scaleFactor),
                y : Math.ceil(event.clientY / window.scaleFactor)
            };
            this.posInContainer = {
                x : Math.ceil(event.clientX / window.scaleFactor) - this.windowContainer.offsetLeft,
                y : Math.ceil(event.clientY / window.scaleFactor) - this.windowContainer.offsetTop,
            }
            if (this.isDown) {
                let target = this.windowElement;
                let target2 = this.windowContainer;
                const isOutlineMode = localStorage.madesktopOutlineMode && this.config.style !== "ad";
                if (isOutlineMode) {
                    target = target2 = windowOutline;
                    windowOutline.style.display = "block";
                }
                const extraTitleHeight = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-title-height')) || 0;
                const extraBorderSize = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-border-size')) || 0;
                // Window resizing & moving - adjust windowContainer / windowElement first
                if (this.resizingMode.includes("left")) {
                    if (target.offsetWidth >= 60) {
                        if (isOutlineMode) {
                            // Well even the exact pixel of border where you click matters here
                            // TODO: calibrate it with initial mouse position
                            let extra = this.borderSize * 2 + 1;
                            if (this.config.style === "nonad") {
                                extra = 6;
                            }
                            windowOutline.style.width = this.prevOffsetRight - this.mousePosition.x + extra + 'px';
                        } else {
                            this.windowElement.width = this.prevOffsetRight - this.mousePosition.x + 'px';
                        }
                        target2.style.left = (this.mousePosition.x + this.offset[0]) + 'px';
                    }
                }
                if (this.resizingMode.includes("right")) {
                    if (target.offsetWidth >= 60) {
                        if (isOutlineMode) {
                            windowOutline.style.width = this.posInContainer.x + 2 + 'px';
                        } else {
                            this.windowElement.width = this.posInContainer.x - 4 - extraBorderSize + 'px';
                        }
                    }
                }
                if (this.resizingMode.includes("top")) {
                    if (target.offsetHeight >= 15) {
                        if (isOutlineMode) {
                            const extraBorderBottom = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-border-bottom'));
                            let extra = this.borderSize * 2 - 3;
                            if (this.config.style === "nonad") {
                                extra = 1;
                            }
                            windowOutline.style.height = this.prevOffsetBottom - this.mousePosition.y + this.windowFrame.offsetTop + extraBorderBottom + extra + 'px';
                        } else {
                            this.windowElement.height = this.prevOffsetBottom - this.mousePosition.y + 'px';
                        }
                        target2.style.top = (this.mousePosition.y + this.offset[1]) + 'px';
                    }
                }
                if (this.resizingMode.includes("bottom")) {
                    if (target.offsetHeight >= 15) {
                        if (isOutlineMode) {
                            windowOutline.style.height = this.posInContainer.y + 2 + 'px';
                        } else {
                            this.windowElement.height = this.posInContainer.y - 26 - extraBorderSize - extraTitleHeight + 'px';
                        }
                    }
                }
                if (this.resizingMode === "none") {
                    target2.style.left = (this.mousePosition.x + this.offset[0]) + 'px';
                    target2.style.top  = (this.mousePosition.y + this.offset[1]) + 'px';
                } else {
                    // Now adjust the others
                    this.adjustElements();
                }
            }
        }

        #wcMouseMove(event) {
            log({cx: event.clientX, cy: event.clientY, cxs: event.clientX / window.scaleFactor, cys: event.clientY / window.scaleFactor}, "debug");
            this.posInContainer = {
                x : Math.ceil(event.clientX / window.scaleFactor) - this.windowContainer.offsetLeft,
                y : Math.ceil(event.clientY / window.scaleFactor) - this.windowContainer.offsetTop,
            }
            let extraBorderSize = 0;
            if (this.config.style === "wnd" || this.config.style === "nonad") {
                extraBorderSize = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-border-size'));
            }
            // Change the mouse cursor - although this is useless in WPE
            let left = this.posInContainer.x <= 3 + extraBorderSize;
            let right = this.posInContainer.x >= this.windowContainer.offsetWidth - 4 - extraBorderSize;
            let top = this.config.style === "ad" ? this.posInContainer.y <= 9 && this.posInContainer.y >= 6 : this.posInContainer.y <= 3 + extraBorderSize;
            let bottom = this.config.style === "ad" ?
                (this.posInContainer.y >= this.windowContainer.offsetHeight - 18 && this.posInContainer.y <= this.windowContainer.offsetHeight - 15) :
                this.posInContainer.y >= this.windowContainer.offsetHeight - 4 - extraBorderSize;
            // More tolerance for diagonal resizing
            if ((left || right) && !top && !bottom) {
                if (this.config.style === "ad") {
                    if (this.posInContainer.y <= 14 && this.posInContainer.y >= 6) {
                        top = true;
                    }
                    if ((this.posInContainer.y >= this.windowContainer.offsetHeight - 23 && this.posInContainer.y <= this.windowContainer.offsetHeight - 15)) {
                        bottom = true;
                    }
                } else {
                    if (this.posInContainer.y <= 8 + extraBorderSize) {
                        top = true;
                    }
                    if (this.posInContainer.y >= this.windowContainer.offsetHeight - 11 - extraBorderSize) {
                        bottom = true;
                    }
                }
            }
            if ((top || bottom) && !left && !right) {
                if (this.posInContainer.x <= 8 + extraBorderSize) {
                    left = true;
                }
                if (this.posInContainer.x >= this.windowContainer.offsetWidth - 9 - extraBorderSize) {
                    right = true;
                }
            }
            if (this.resizingMode === "none" && (this.windowElement.style.borderColor !== "transparent" || this.config.style !== "ad") && !this.config.unresizable) {
                if (left && top) {
                    document.body.style.cursor = "nw-resize";
                } else if (right && top) {
                    document.body.style.cursor = "ne-resize";
                } else if (left && bottom) {
                    document.body.style.cursor = "sw-resize";
                } else if (right && bottom) {
                    document.body.style.cursor = "se-resize";
                } else if (left) {
                    document.body.style.cursor = "ew-resize";
                } else if (right) {
                    document.body.style.cursor = "ew-resize";
                } else if (top) {
                    document.body.style.cursor = "ns-resize";
                } else if (bottom) {
                    document.body.style.cursor = "ns-resize";
                } else {
                    document.body.style.cursor = "auto";
                }
            }
            log(this.posInContainer, "debug");
        }

        async #weLoad () {
            if (!this.windowElement.contentDocument) {
                // Cross-origin iframe
                return;
            }
            if (window.runningMode === WE) {
                if (this.windowElement.contentWindow.location.href === "chrome-error://chromewebdata/") {
                    if (this.firstLoadSuccess) {
                        madAlert(madGetString("MAD_ERROR_X_FRAME_OPTIONS"), () => {
                            this.windowElement.src = this.config.src || "placeholder.html";
                        }, "error");
                    } else {
                        madConfirm(madGetString("MAD_CONFIRM_X_FRAME_OPTIONS"), res => {
                            if (res) {
                                openExternal(this.config.src, false, "", false);
                            }
                            this.closeWindow();
                        });
                    };
                    return;
                }
            }
            this.windowElement.contentDocument.addEventListener('pointermove', this.#weConMouseMove.bind(this));
            this.windowElement.contentDocument.addEventListener('pointerdown', this.bringToTop.bind(this));

            if (!this.config.title) {
                this.windowTitleText.textContent = this.windowElement.contentDocument.title || "ModernActiveDesktop";
            }
            this.windowIcon.src = await getFavicon(this.windowElement);

            if (!this.config.unscaled && !window.isIframeAutoScaled) {
                this.windowElement.contentDocument.body.style.zoom = window.scaleFactor;
            }
            if (window.devicePixelRatio !== this.windowElement.contentWindow.devicePixelRatio) {
                window.isIframeAutoScaled = true;
                this.windowElement.contentDocument.body.style.zoom = 1;
                this.config.unscaled = false;
            }
            hookIframeSize(this.windowElement, this.numStr || 0);
            this.firstLoadSuccess = true;
        }

        #reset() {
            this.closeContextMenu();
            if (this.temp) {
                if (this.config.src === "apps/welcome/index.html") {
                    localStorage.removeItem("madesktopCheckedChanges");
                    localStorage.removeItem("madesktopCheckedConfigs");
                    localStorage.removeItem("madesktopCheckedGithub");
                    this.windowElement.contentWindow.location.reload();
                } else {
                    madAlert(madGetString("MAD_MSG_TEMP_WINDOW"));
                }
                return;
            }
            madConfirm(madGetString("MAD_CONFIRM_WIN_RESET"), res => {
                if (res) {
                    this.#clearConfig();
                    if (this.isVisualizer) {
                        window.visDeskMover = null;
                    }
                    deskMovers[this.numStr || 0] = new DeskMover(this.windowContainer, this.numStr, undefined, false, {}, true);
                }
            });
        }

        #toggleScale() {
            this.closeContextMenu();
            if (window.isIframeAutoScaled || !this.windowElement.contentDocument) {
                return;
            }
            if (this.config.unscaled) {
                this.windowElement.contentDocument.body.style.zoom = window.scaleFactor;
                this.confMenuItems[3].classList.add("checkedItem");
                this.config.unscaled = false;
            } else {
                this.windowElement.contentDocument.body.style.zoom = 1;
                this.confMenuItems[3].classList.remove("checkedItem");
                this.config.unscaled = true;
            }
            this.windowElement.contentWindow.dispatchEvent(new Event("resize"));
        }

        #toggleAoT() {
            this.closeContextMenu();
            if (this.config.alwaysOnTop) {
                this.windowContainer.style.zIndex = ++lastZIndex;
                this.confMenuItems[4].classList.remove("checkedItem");
                this.config.alwaysOnTop = false;
            } else {
                this.windowContainer.style.zIndex = ++lastAoTZIndex;
                this.confMenuItems[4].classList.add("checkedItem");
                this.config.alwaysOnTop = true;
            }
        }

        toggleResizable(resizable) {
            this.closeContextMenu();
            if ((this.config.unresizable || resizable === true) && resizable !== false) {
                delete this.windowContainer.dataset.unresizable;
                this.confMenuItems[5].classList.add("checkedItem");
                this.config.unresizable = false;
            } else {
                this.windowContainer.dataset.unresizable = true;
                this.confMenuItems[5].classList.remove("checkedItem");
                this.config.unresizable = true;
            }
            this.adjustElements();
        }

        #changeUrl() {
            this.closeContextMenu();
            let urlToShow = this.config.src || "";
            if (urlToShow === "placeholder.html") {
                urlToShow = "";
            }

            madPrompt(madGetString("MAD_PROMPT_ENTER_URL"), url => {
                if (url === null) return;
                if (!url) {
                    if (this.numStr === "") url = "ChannelBar.html";
                    else url = "placeholder.html";
                }

                if (this.isVisualizer) {
                    // make sure the visualizer is destroyed properly
                    // required for some cases like an invalid URL being entered
                    this.windowElement.contentWindow.document.write();
                }
                this.setResizeArea(false);
                this.firstLoadSuccess = false;
                this.windowElement.src = url;
                this.config.src = url;

                if (this.isVisualizer && !url.startsWith("apps/visualizer/")) {
                    this.#clearConfig(true);
                    this.isVisualizer = false;
                    window.visDeskMover = null;
                }
            }, "", urlToShow);
        }

        #changeTitle() {
            this.closeContextMenu();
            madPrompt(madGetString("MAD_PROMPT_ENTER_TITLE"), title => {
                if (title === null) return;
                if (title) {
                    this.windowTitleText.textContent = title;
                    this.config.title = title;
                } else {
                    delete this.config.title;
                    this.windowTitleText.textContent = this.windowElement.contentDocument?.title || "ModernActiveDesktop";
                }
            }, "", this.config.title || "");
        }

        #weConMouseMove (event) {
            this.posInWindow = {
                x : Math.ceil(event.clientX / window.scaleFactor),
                y : Math.ceil(event.clientY / window.scaleFactor)
            };
            clearTimeout(this.timeout);
            this.timeout = setTimeout(this.#updateWindowComponentVisibility.bind(this), 500);
        }

        bringToTop () {
            this.windowContainer.style.zIndex = this.config.alwaysOnTop ? ++lastAoTZIndex : ++lastZIndex;
            activateWindow(this.numStr || 0);
            saveZOrder();
            this.windowElement.contentWindow.focus();
        }

        #updatePrevOffset() {
            this.prevOffsetRight = this.windowElement.offsetWidth + this.windowContainer.offsetLeft;
            this.prevOffsetBottom = this.windowElement.offsetHeight + this.windowContainer.offsetTop;
        }

        // Keep the deskitem inside the visible area
        #keepInside() {
            if (this.windowContainer.offsetLeft < -this.windowContainer.offsetWidth + 60) {
                this.windowContainer.style.left = -this.windowTitlebar.offsetWidth + 60 + 'px';
            }
            if (this.windowContainer.offsetTop < 0) {
                this.windowContainer.style.top = 0;
            }
            if (this.windowContainer.offsetLeft + 60 > window.vWidth) {
                this.windowContainer.style.left = window.vWidth - 60 + 'px';
            }
            if (this.windowContainer.offsetTop + 50 > window.vHeight) {
                this.windowContainer.style.top = window.vHeight - 50 + 'px';
            }
            this.#updatePrevOffset();
        }

        // Adjust all elements to windowElement
        adjustElements(extraTitleHeight, extraBorderSize, extraBorderBottom) {
            if (typeof extraTitleHeight === 'undefined') {
                extraTitleHeight = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-title-height'));
            }
            if (typeof extraBorderSize === 'undefined') {
                extraBorderSize = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-border-size'));
            }
            if (typeof extraBorderBottom === 'undefined') {
                extraBorderBottom = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-border-bottom'));
            }
            if (this.config.style === "nonad" && extraBorderSize < 1) {
                extraBorderSize = 1;
            }
            log({extraTitleHeight, extraBorderSize, extraBorderBottom}, 'debug');
            if (localStorage.madesktopColorScheme === 'xpcss4mad' && this.config.style === 'wnd') {
                this.windowContainer.style.height = this.windowElement.offsetHeight + 22 + extraTitleHeight + (extraBorderSize * 2) + extraBorderBottom + 'px';
                this.windowContainer.style.width = this.windowElement.offsetWidth + 4 + extraBorderSize * 2 + 'px';
                this.windowTitlebar.style.width = this.windowElement.offsetWidth - 7 + 'px';
            } else if (this.config.style === 'wnd') {
                this.windowContainer.style.height = this.windowElement.offsetHeight + 19 + extraTitleHeight + (extraBorderSize * 2) + extraBorderBottom + 'px';
                this.windowContainer.style.width = this.windowElement.offsetWidth - 2 + extraBorderSize * 2 + 'px';
            } else if (this.config.style === 'nonad') {
                this.windowContainer.style.height = this.windowElement.offsetHeight + 21 + (extraBorderSize - 1) * 2 + 'px';
                this.windowContainer.style.width = this.windowElement.offsetWidth - 2 + (extraBorderSize - 1) * 2 + 'px';
            } else {
                this.windowContainer.style.height = this.windowElement.offsetHeight + 19 + 'px';
                this.windowContainer.style.width = this.windowElement.offsetWidth - 2 + 'px';
            }
            this.windowFrame.style.height = this.windowElement.offsetHeight - 2 + 'px';
            this.windowFrame.style.width = this.windowElement.offsetWidth + 'px';
            switch (this.config.style) {
                case "ad":
                    this.windowTitlebar.style.width = this.windowElement.offsetWidth + 4 + 'px';
                    break;
                case "wnd":
                    this.windowTitlebar.style.width = 'auto';
                    break;
                case "nonad":
                    this.windowTitlebar.style.width = this.windowElement.offsetWidth + 'px';
                    break;
            }
            this.windowTitlebar.style.left = this.config.style !== "ad" ? '2px' : 0;
            if (this.config.style === "ad") {
                this.windowTitlebar.style.top = '6px';
            } else if (this.config.style === "nonad") {
                this.windowTitlebar.style.top = '4px';
            } else {
                this.windowTitlebar.style.top = '3px';
            }
        }

        // Save configs
        #saveConfig() {
            this.config.width = this.windowElement.width;
            this.config.height = this.windowElement.height;
            this.config.xPos = this.windowContainer.style.left;
            this.config.yPos = this.windowContainer.style.top;
        }

        // Clear configs
        #clearConfig(visOnly) {
            if (!visOnly) {
                delete this.config.width;
                delete this.config.height;
                delete this.config.xPos;
                delete this.config.yPos;
                delete this.config.src;
                delete this.config.style;
                delete this.config.unscaled;
                delete this.config.title;
                delete this.config.zIndex;
                delete this.config.active;
                delete this.config.alwaysOnTop;
                delete this.config.jspaintHash;
                clearTimeout(this.timeout);
            }

            if (this.isVisualizer) {
                delete localStorage.madesktopVisBgColor;
                delete localStorage.madesktopVisBarColor;
                delete localStorage.madesktopVisTopColor;
                delete localStorage.madesktopVisUseSchemeColors;
                delete localStorage.madesktopVisFollowAlbumArt;
                delete localStorage.madesktopVisShowAlbumArt;
                delete localStorage.madesktopVisDimAlbumArt;
                delete localStorage.madesktopVisOnlyAlbumArt;
                delete localStorage.madesktopVisNoClientEdge;
                delete localStorage.madesktopVisMenuAutohide;
                delete localStorage.madesktopVisInfoShown;
                delete localStorage.madesktopVisStatusShown;
                delete localStorage.madesktopVisMediaControls;
                delete localStorage.madesktopVisChannelSeparation;
                delete localStorage.madesktopVisBarWidth;
                delete localStorage.madesktopVisDecSpeed;
                delete localStorage.madesktopVisPrimaryScale;
                delete localStorage.madesktopVisDiffScale;
            }
        }

        // Update the visibility of window components based on the cursor's position
        // Replicates the original ActiveDesktop behavior
        #updateWindowComponentVisibility() {
            if (this.config.style === "ad" && !this.noFrames) {
                this.windowElement.style.borderColor = "var(--button-face)";
            }
            if (typeof this.posInWindow !== 'undefined') {
                if ((this.posInWindow.x <= 15 || 
                    this.posInWindow.x >= this.windowElement.offsetWidth - 15 || 
                    this.posInWindow.y <= 50 || 
                    this.posInWindow.y >= this.windowElement.offsetHeight - 15)
                ) {
                    if (this.config.style === "ad") {
                        this.windowFrame.style.borderColor = "var(--button-face)";
                        this.windowFrame.style.backgroundColor = "var(--button-face)"; // required to fix some weird artifacts in hidpi/css-zoomed mode
                    }
                    if (this.config.style === "wnd" && !this.noFrames) {
                        this.windowTitlebar.style.display = "flex";
                    } else if ((this.posInWindow.y <= 50 && !this.noFrames) || this.config.style === "nonad") {
                        this.windowTitlebar.style.display = "block";
                    } else {
                        this.windowTitlebar.style.display = "none";
                    }
                } else {
                    this.windowFrame.style.borderColor = "transparent";
                    this.windowFrame.style.backgroundColor = "transparent";
                    if (this.config.style === "ad" && !this.noFrames) {
                        this.windowTitlebar.style.display = "none";
                    }
                }
            } else if (this.config.style === "ad" && !this.noFrames) {
                // Cross-origin iframe (no info about the cursor's position)
                this.windowFrame.style.borderColor = "var(--button-face)";
                this.windowFrame.style.backgroundColor = "var(--button-face)";
                this.windowTitlebar.style.display = this.config.style === "wnd" ? "flex" : "block";
            }
        }
    }

    function initSimpleMover(container, titlebar, exclusions) {
        let offset = [0, 0], isDown = false, mouseOverWndBtns = false;

        titlebar.addEventListener('pointerdown', function (event) {
            if (!mouseOverWndBtns) {
                isDown = true;
                iframeClickEventCtrl(false);
                offset = [
                    container.offsetLeft - Math.ceil(event.clientX / scaleFactor), // event.clientXY doesn't work well with css zoom
                    container.offsetTop - Math.ceil(event.clientY / scaleFactor)
                ];

                if (localStorage.madesktopOutlineMode) {
                    windowOutline.style.padding = "1px";
                    windowOutline.style.left = container.offsetLeft + "px";
                    windowOutline.style.top = container.offsetTop + "px";
                    windowOutline.style.width = container.offsetWidth + "px";
                    windowOutline.style.height = container.offsetHeight + "px";
                }
            }
        });

        document.addEventListener('pointerup', function () {
            if (isDown && localStorage.madesktopOutlineMode && windowOutline.style.display !== "none") {
                container.style.left = windowOutline.style.left;
                container.style.top = windowOutline.style.top;
                container.style.right = "auto";
                windowOutline.style.display = "none";
            }
            isDown = false;
            iframeClickEventCtrl(true);

            // Keep the window inside the visible area
            if (container.offsetLeft < -container.offsetWidth + 60) container.style.left = -titlebar.offsetWidth + 60 + 'px';
            if (container.offsetTop < 0) container.style.top = 0;
            if (container.offsetLeft + 60 > window.vWidth) container.style.left = window.vWidth - 60 + 'px';
            if (container.offsetTop + 50 > window.vHeight) container.style.top = window.vHeight - 50 + 'px';
        });

        document.addEventListener('pointermove', function (event) {
            if (isDown) {
                let target = container;
                if (localStorage.madesktopOutlineMode) {
                    target = windowOutline;
                    windowOutline.style.display = "block";
                } else {
                    container.style.right = "auto";
                }
                target.style.left = (Math.ceil(event.clientX / scaleFactor) + offset[0]) + 'px';
                target.style.top  = (Math.ceil(event.clientY / scaleFactor) + offset[1]) + 'px';
            }
        });

        for (let i = 0; i < exclusions.length; i++) {
            exclusions[i].addEventListener('pointerover', function () {
                mouseOverWndBtns = true;
            });

            exclusions[i].addEventListener('pointerout', function () {
                mouseOverWndBtns = false;
            });
        }
    }

    // Attempt to fix Wayback Machine compatibility
    window.DeskMover = DeskMover;
    window.initSimpleMover = initSimpleMover;
})();