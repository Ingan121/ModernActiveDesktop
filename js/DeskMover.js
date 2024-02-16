// DeskMover.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

class DeskMover {
    constructor(windowContainer, numStr, openDoc, temp, width, height, style, reinit, centered, top, left, aot, unresizable, noIcon) {
        this.numStr = numStr;
        this.temp = temp;

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

        this.mousePosition, this.posInWindow, this.posInContainer;
        this.offset = [0, 0];
        this.isDown = false;
        this.resizingMode = "none";
        this.mouseOverWndBtns = false;
        this.noFrames = false;

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

        let tempConfigStorage = {};
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
        
        /* Event listeners */
        if (!reinit) {
            // Prevent window from resizing when dragging the dropdown scrollbar
            this.dropdownBg.addEventListener('mousedown', preventDefault);

            // Prevent unintended menu closing when clicking the menu items
            this.contextMenuBg.addEventListener('click', preventDefault);
            this.contextMenuBg.addEventListener('mousedown', preventDefault);
            this.contextMenuBg.addEventListener('mouseup', preventDefault);
            this.contextMenuBg.addEventListener('mousemove', preventDefault);
            this.confMenuBg.addEventListener('click', preventDefault);
            this.confMenuBg.addEventListener('mousedown', preventDefault);
            this.confMenuBg.addEventListener('mouseup', preventDefault);
            this.confMenuBg.addEventListener('mousemove', preventDefault);

            this.contextMenuBg.addEventListener('focusout', this.closeContextMenu.bind(this));
            this.dropdownBg.addEventListener('focusout', this.closeDropdown.bind(this));

            this.windowContainer.addEventListener('mousedown', this.#wcMouseDown.bind(this));
            document.addEventListener('mouseup', this.#docMouseUp.bind(this));
            this.windowElement.addEventListener('mouseover', this.#weMouseOver.bind(this));
            this.windowContainer.addEventListener('mouseleave', this.#wcMouseLeave.bind(this));
            document.addEventListener('mousemove', this.#docMouseMove.bind(this));
            this.windowContainer.addEventListener('mousemove', this.#wcMouseMove.bind(this));
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
                    delete elem.dataset.active;
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
            
            this.contextMenuItems[0].addEventListener('mouseover', () => { // Configure button mouseover
                this.timeout2 = setTimeout(() => {
                    this.openConfMenu();
                }, 300);
            });
            
            this.contextMenuItems[0].addEventListener('mouseleave', () => { // Configure button mouseleave
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
                this.windowElement.contentWindow.location.reload();
            });
            
            this.contextMenuItems[4].addEventListener('click', () => { // Close button
                this.closeContextMenu();
                this.closeWindow();
            });
            
            // Hide the config menu when hovering other items than Configure and Debug
            this.contextMenuItems[2].addEventListener('mouseover', this.#delayedCloseConfMenu.bind(this));
            this.contextMenuItems[3].addEventListener('mouseover', this.#delayedCloseConfMenu.bind(this));
            this.contextMenuItems[4].addEventListener('mouseover', this.#delayedCloseConfMenu.bind(this));
            
            this.contextMenuBg.addEventListener('mouseleave', () => {
                this.#delayedCloseConfMenu(200);
            });

            this.confMenuBg.addEventListener('mouseover', () => {
                this.shouldNotCloseConfMenu = true;
                clearTimeout(this.timeout3);
                this.contextMenuItems[0].dataset.active = true;
            });
            this.confMenuBg.addEventListener('mouseleave', () => {
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
            this.confMenuItems[5].addEventListener('click', this.#toggleResizable.bind(this)); // Resizable button
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
        
            this.windowMenuBtn.addEventListener('mouseover', () => {
                this.mouseOverWndBtns = true;
            });
        
            this.windowIcon.addEventListener('mouseover', () => {
                this.mouseOverWndBtns = true;
            });
        
            this.windowCloseBtn.addEventListener('mouseover', () => {
                this.mouseOverWndBtns = true;
            });
            
            this.windowCloseBtnAlt.addEventListener('mouseover', () => {
                this.mouseOverWndBtns = true;
            });
        
            this.windowMenuBtn.addEventListener('mouseout', () => {
                this.mouseOverWndBtns = false;
            });
        
            this.windowIcon.addEventListener('mouseout', () => {
                this.mouseOverWndBtns = false;
            });
        
            this.windowCloseBtn.addEventListener('mouseout', () => {
                this.mouseOverWndBtns = false;
            });
            
            this.windowCloseBtnAlt.addEventListener('mouseout', () => {
                this.mouseOverWndBtns = false;
            });
        }
        /* End of event listeners */
        
        /* Init */
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
                if (reinit) {
                    this.changeWndStyle("wnd");
                }
                let url = "placeholder.html";
                let defaultLeft = window.vWidth - (parseInt(localStorage.madesktopChanViewRightMargin) || 0) - 600 + 'px';
                let defaultTop = '200px';
                if ((typeof openDoc === "string" || openDoc instanceof String) && openDoc != "placeholder.html" && !reinit) {
                    if (openDoc.startsWith("apps/madconf/")) {
                        this.windowElement.width = width || '398px';
                        this.windowElement.height = height || '423px';
                        this.#toggleResizable();
                        this.setIcon(false);
                    } else {
                        this.windowElement.width = width || '800px';
                        this.windowElement.height = height || '600px';
                        if (unresizable) {
                            this.#toggleResizable();
                        }
                        if (noIcon) {
                            this.setIcon(false);
                        }
                    }
                    defaultLeft = left || (parseInt(localStorage.madesktopChanViewLeftMargin) || 75) + 250 + 'px';
                    defaultTop = top || '150px';
                    url = openDoc.includes(".html") ? openDoc : `docs/index.html?src=${openDoc}`;
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
                if (!localStorage.madesktopItemXPos) {
                    this.windowContainer.style.left = window.vWidth - this.windowContainer.offsetWidth - (parseInt(localStorage.madesktopChanViewRightMargin) || 0) - 100 + 'px';
                }
            }
        }
        this.windowElement.contentWindow.focus();
        /* Init complete */
    }

    closeWindow() {
        if (this.numStr !== "") {
            this.windowContainer.style.display = "none";
            this.windowContainer.innerHTML = "";
            if (this.beforeClose) {
                this.beforeClose(localStorage, window);
            }
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
            activateWindow(prevActiveWindow);
        } else {
            this.#clearConfig();
            this.windowContainer.style.display = 'none';
            localStorage.madesktopItemVisible = false;
        }
    }

    openContextMenu() {
        this.contextMenuBg.style.removeProperty('--context-menu-left');
        this.contextMenuBg.style.removeProperty('--context-menu-top');
        this.confMenuBg.style.removeProperty('--context-menu-left');
        this.confMenuBg.style.removeProperty('--context-menu-top');
        // Windows without icons aren't designed to look good in different sizes yet
        // So just hide the menus for now
        if (this.windowTitlebar.classList.contains("noIcon")) {
            this.contextMenuBg.style.height = "17px";
            this.contextMenuItems[3].style.pointerEvents = "none";
            this.contextMenuItems[3].style.opacity = "0";
        } else {
            this.contextMenuBg.style.height = "";
            this.contextMenuItems[3].style.pointerEvents = "";
            this.contextMenuItems[3].style.opacity = "";
        }
        for (const item of this.contextMenuItems) {
            delete item.dataset.active;
        }
        this.contextMenuBg.style.display = "block";

        // For handling window icon double click
        // Note: dblclick doesn't fire in WE
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
        this.contextMenuBg.style.setProperty('--context-menu-left', this.posInContainer.x + 'px');
        this.contextMenuBg.style.setProperty('--context-menu-top', this.posInContainer.y + 'px');
        this.confMenuBg.style.setProperty('--context-menu-left', this.posInContainer.x + 'px');
        this.confMenuBg.style.setProperty('--context-menu-top', this.posInContainer.y + 'px');
        // Windows without icons aren't designed to look good in different sizes yet
        // So just hide the menus for now
        if (this.windowTitlebar.classList.contains("noIcon")) {
            this.contextMenuBg.style.height = "17px";
            this.contextMenuItems[3].style.pointerEvents = "none";
            this.contextMenuItems[3].style.opacity = "0";
        } else {
            this.contextMenuBg.style.height = "";
            this.contextMenuItems[3].style.pointerEvents = "";
            this.contextMenuItems[3].style.opacity = "";
        }
        for (const item of this.contextMenuItems) {
            delete item.dataset.active;
        }
        this.contextMenuBg.style.display = "block";
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
        for (const item of this.confMenuItems) {
            delete item.dataset.active;
        }
        this.contextMenuItems[0].dataset.active = true;
        this.confMenuBg.style.display = "block";
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
        switch(type) {
            case "none":
                this.contextMenuBg.style.animation = "none";
                this.confMenuBg.style.animation = "none";
                this.dropdownBg.style.animation = "none";
                break;
            case "fade":
                this.contextMenuBg.style.animation = "fade 0.2s";
                this.confMenuBg.style.animation = "fade 0.2s";
                this.dropdownBg.style.animation = "cmDropdown 0.25s linear";
                break;
            case "slide":
                this.contextMenuBg.style.animation = "cmDropdown 0.25s linear";
                this.confMenuBg.style.animation = "cmDropright 0.25s linear";
                this.dropdownBg.style.animation = "cmDropdown 0.25s linear";
                break;
        }
    }

    openDropdown(elem) {
        // Suppress the original dropdown
        elem.blur();
        elem.dataset.open = true;
        this.lastDropdown = elem;

        const label = elem.querySelector(".label");
        const dummy = this.dropdownBg.querySelector(".dropdownItem");
        const options = elem.options || elem.querySelectorAll("option");
        let optionCnt = 0;
        let selectedIndex = 0;

        if (this.dropdown.childElementCount > 1) {
            for (let i = this.dropdown.childElementCount - 1; i > 0; i--) {
                this.dropdown.removeChild(this.dropdown.children[i]);
            }
        }

        for (const option of options) {
            if (option.hidden) {
                continue;
            }
            if (option.dataset.condition) {
                if (!localStorage.getItem(option.dataset.condition)) {
                    continue;
                }
            }
            const item = dummy.cloneNode(true);
            item.textContent = option.textContent;
            item.dataset.value = option.value;
            if (option.value === elem.value) {
                selectedIndex = optionCnt;
                item.dataset.hover = true;
            }
            item.addEventListener('click', () => {
                elem.value = item.dataset.value;
                elem.dispatchEvent(new Event('change'));
                if (label) {
                    label.textContent = item.textContent;
                }
                this.closeDropdown();
            });
            item.addEventListener('mouseover', () => {
                for (let i = 1; i < this.dropdown.childElementCount; i++) {
                    delete this.dropdown.children[i].dataset.hover;
                }
                item.dataset.hover = true;
            });
            this.dropdown.appendChild(item);
            optionCnt++;
        }
        
        // Set these first to ensure the item height is retrieved correctly
        this.dropdownBg.style.display = "block";
        
        const clientRect = elem.getBoundingClientRect();
        if (this.config.unscaled) {
            this.dropdownBg.style.left = clientRect.left / window.scaleFactor + "px";
            this.dropdownBg.style.top = (clientRect.top + elem.offsetHeight) / window.scaleFactor + "px";
            this.dropdownBg.style.width = elem.offsetWidth / window.scaleFactor + "px";
        } else {
            this.dropdownBg.style.left = clientRect.left + "px";
            this.dropdownBg.style.top = clientRect.top + elem.offsetHeight + "px";
            this.dropdownBg.style.width = elem.offsetWidth + "px";
        }
        this.dropdown.style.width = this.dropdownBg.style.width;

        this.dropdown.children[0].style.display = "block";
        const itemHeight = this.dropdown.children[0].getBoundingClientRect().height;
        this.dropdown.children[0].style.display = "";
        if (optionCnt >= 25) {
            this.dropdownBg.style.height = itemHeight * 25 + "px";
        } else {
            this.dropdownBg.style.height = itemHeight * optionCnt + "px";
        }
        this.dropdown.style.height = this.dropdownBg.style.height;

        if (selectedIndex > 12) {
            this.dropdown.scrollTop = (selectedIndex - 12) * itemHeight;
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

    openMiniColorPicker(elem, initialColor, callback) {
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
            this.openColorPicker(initialColor, true, callback);
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

    openColorPicker(initialColor, expand, callback) {
        const left = parseInt(this.config.xPos) + 4 + 'px';
        const top = parseInt(this.config.yPos) + 26 + 'px';
        const colorPicker = openWindow("apps/colorpicker/index.html", true, expand ? "447px" : "219px", "298px", "wnd", false, top, left, true, true, true);
        const colorPickerWindow = colorPicker.windowElement.contentWindow;
        colorPickerWindow.addEventListener("load", () => {
            colorPickerWindow.choose_color(initialColor, expand, callback);
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
            marginTop = parseInt(localStorage.madesktopChanViewTopMargin) || 0;
            marginLeft = parseInt(localStorage.madesktopChanViewLeftMargin) || 75;
            marginRight = parseInt(localStorage.madesktopChanViewRightMargin) || 0;
            marginBottom = parseInt(localStorage.madesktopChanViewBottomMargin) || 48;
        }
        // This doesn't require user gesture
        // There's no visual difference between this and the real fullscreen in Wallpaper Engine
        const outlineSize = parseInt(getComputedStyle(this.windowElement).getPropertyValue('outline-width'));
        this.windowElement.style.top = -(this.windowFrame.offsetTop + this.windowContainer.offsetTop + outlineSize + 3) + marginTop + "px";
        this.windowElement.style.left = -(this.windowFrame.offsetLeft + this.windowContainer.offsetLeft + outlineSize + 3) + marginLeft + "px";
        this.windowElement.style.width = window.vWidth - marginLeft - marginRight + "px";
        this.windowElement.style.height = window.vHeight - marginTop - marginBottom + "px";
        this.isFullscreen = true;
        this.windowElement.contentDocument.body.dataset.fullscreen = true;
        // But try this anyway for browser usage
        if (window.runningMode === BROWSER) {
            this.windowElement.requestFullscreen();
        }
    }

    async exitFullscreen() {
        this.changeWndStyle();
        this.windowElement.style.top = "";
        this.windowElement.style.left = "";
        this.windowElement.style.width = "";
        this.windowElement.style.height = "";
        this.isFullscreen = false;
        delete this.windowElement.contentDocument.body.dataset.fullscreen;
        if (document.fullscreenElement) {
            document.exitFullscreen();
            await asyncTimeout(100);
        }
        this.adjustElements();
    }

    #wcMouseDown(event) {
        this.bringToTop();
        if (event.button !== 0) return;
        if ((this.windowFrame.style.borderColor !== "transparent" || this.config.style !== "ad" || this.dblClickEvent) && !this.mouseOverWndBtns) {
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
            if (this.config.style === "wnd") {
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
        if (this.config.style === "wnd") {
            extraBorderSize = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-border-size'));
        }
        // Change the mouse cursor - although this is useless in WE
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
                madAlert("ModernActiveDesktop cannot load this URL due to a security policy. Please try another URL.", () => {
                    if (this.firstLoadSuccess) {
                        this.windowElement.src = this.config.src || "placeholder.html";
                    } else {
                        this.closeWindow();
                    }
                }, "error");
                return;
            }
        }
        this.windowElement.contentDocument.addEventListener('mousemove', this.#weConMouseMove.bind(this));
        this.windowElement.contentDocument.addEventListener('mousedown', this.bringToTop.bind(this));
        
        if (!this.config.title) {
            this.windowTitleText.textContent = this.windowElement.contentDocument.title || "ModernActiveDesktop";
        }
        this.windowIcon.src = await getFavicon(this.windowElement);
        
        if (!this.config.unscaled) {
            this.windowElement.contentDocument.body.style.zoom = window.scaleFactor;
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
                madAlert("This window is temporary, so it cannot be reset. Just close it.");
            }
            return;
        }
        madConfirm("Are you sure you want to reset this window?", res => {
            if (res) {
                this.#clearConfig();
                if (this.isVisualizer) {
                    window.visDeskMover = null;
                }
                deskMovers[this.numStr || 0] = new DeskMover(this.windowContainer, this.numStr, false, undefined, undefined, undefined, undefined, true);
            }
        });
    }

    #toggleScale() {
        this.closeContextMenu();
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

    #toggleResizable() {
        this.closeContextMenu();
        if (this.config.unresizable) {
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

        madPrompt("Enter URL (leave empty to reset)", url => {
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
            this.firstLoadSuccess = false;
            this.windowElement.src = url;
            this.config.src = url;

            if (!url.startsWith("apps/visualizer/")) {
                this.#clearConfig(true);
                this.isVisualizer = false;
                window.visDeskMover = null;
            }
        }, "", urlToShow);
    }

    #changeTitle() {
        this.closeContextMenu();
        madPrompt("Enter title (leave empty to reset)", title => {
            if (title === null) return;
            if (title) {
                this.windowTitleText.textContent = title;
                this.config.title = title;
            } else {
                delete this.config.title;
                this.windowTitleText.textContent = this.windowElement.contentDocument.title || "ModernActiveDesktop";
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
        log({extraTitleHeight, extraBorderSize, extraBorderBottom}, 'debug');
        if (localStorage.madesktopColorScheme === 'xpcss4mad' && this.config.style === 'wnd') {
            this.windowContainer.style.height = this.windowElement.offsetHeight + 22 + extraTitleHeight + (extraBorderSize * 2) + extraBorderBottom + 'px';
            this.windowContainer.style.width = this.windowElement.offsetWidth + 4 + extraBorderSize * 2 + 'px';
            this.windowTitlebar.style.width = this.windowElement.offsetWidth - 7 + 'px';
        } else if (this.config.style === 'wnd') {
            this.windowContainer.style.height = this.windowElement.offsetHeight + 19 + extraTitleHeight + (extraBorderSize * 2) + extraBorderBottom + 'px';
            this.windowContainer.style.width = this.windowElement.offsetWidth - 2 + extraBorderSize * 2 + 'px';
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
        this.windowTitlebar.style.top = this.config.style !== "ad" ? '3px' : '6px';
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
            delete localStorage.madesktopVisMenuAutohide;
            delete localStorage.madesktopVisInfoShown;
            delete localStorage.madesktopVisStatusShown;
            delete localStorage.madesktopVisMediaControls;
            delete localStorage.madesktopVisChannelSeparation;
            delete localStorage.madesktopVisBarWidth;
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
                if (this.config.style === "wnd") {
                    this.windowTitlebar.style.display = "flex";
                } else if ((this.posInWindow.y <= 50 && !this.noFrames) || this.config.style === "nonad") {
                    this.windowTitlebar.style.display = "block";
                } else {
                    this.windowTitlebar.style.display = "none";
                }
            } else {
                this.windowFrame.style.borderColor = "transparent";
                this.windowFrame.style.backgroundColor = "transparent";
                if (this.config.style === "ad") {
                    this.windowTitlebar.style.display = "none";
                }
            }
        } else if (this.config.style === "ad") {
            // Won't happen in WE; but required in normal browsers
            // I use Chrome/Edge for some debugging as mouse hovering doesn't work well in WE with a debugger attached
            // Edit: Well it now works well at the time of writing (MAD 3.0)
            // if you use chrome://inspect instead of going directly to localhost:port
            this.windowFrame.style.borderColor = "var(--button-face)";
            this.windowFrame.style.backgroundColor = "var(--button-face)";
            this.windowTitlebar.style.display = this.config.style === "wnd" ? "flex" : "block";
        }
    }
}

function initSimpleMover(container, titlebar, exclusions) {
    let offset = [0, 0], isDown = false, mouseOverWndBtns = false;
    
    titlebar.addEventListener('mousedown', function (event) {
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
    
    document.addEventListener('mouseup', function () {
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
    
    document.addEventListener('mousemove', function (event) {
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
        exclusions[i].addEventListener('mouseover', function () {
            mouseOverWndBtns = true;
        });

        exclusions[i].addEventListener('mouseout', function () {
            mouseOverWndBtns = false;
        });
    }
}
