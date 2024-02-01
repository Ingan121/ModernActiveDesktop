// DeskMover.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

class DeskMover {
    constructor(windowContainer, numStr, openDoc, temp, width, height, style, reinit, centered, top, left, aot, unresizable) {
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
        this.isDown = false, this.resizingMode = "none", this.mouseOverWndBtns = false;

        this.timeout; // for handling ActiveDesktop style window frame hiding
        this.timeout2; // for handling context menu auto opening
        this.timeout3; // for handling context menu auto closing

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
            for (let i = 0; i < this.contextMenuItems.length; i++) {
                const elem = this.contextMenuItems[i];
                elem.onmouseover = () => {
                    if (elem !== this.contextMenuItems[0]) {
                        delete this.contextMenuItems[0].dataset.active;
                    }
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
        this.changeWndStyle(this.config.style || style || "ad");
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
        
        if (this.config.src) {
            this.windowElement.src = this.config.src;
        } else {
            if (this.numStr !== "") {
                // Assign default values
                if (reinit) {
                    this.changeWndStyle("wnd");
                }
                let url = "placeholder.html";
                let defaultLeft = window.vWidth - this.windowContainer.offsetWidth - (parseInt(localStorage.madesktopChanViewRightMargin) || 0) - 500 + 'px';
                let defaultTop = '200px';
                if ((typeof openDoc === "string" || openDoc instanceof String) && openDoc != "placeholder.html" && !reinit) {
                    if (openDoc.startsWith("apps/madconf/")) {
                        this.windowElement.width = width || '398px';
                        this.windowElement.height = height || '423px';
                        this.#toggleResizable();
                    } else {
                        this.windowElement.width = width || '800px';
                        this.windowElement.height = height || '600px';
                        if (unresizable) {
                            this.#toggleResizable();
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
                if (reinit) {
                    this.windowContainer.style.top = '200px';
                    this.windowElement.width = '84px';
                    this.windowElement.height = '471px';
                    this.changeWndStyle("ad");
                    this.adjustElements();
                    this.windowElement.src = "ChannelBar.html";
                }
                if (!localStorage.madesktopItemXPos) {
                    this.windowContainer.style.left = window.vWidth - this.windowContainer.offsetWidth - (parseInt(localStorage.madesktopChanViewRightMargin) || 0) - 100 + 'px';
                }
            }
        }
        /* Init complete */
    }

    closeWindow() {
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
            }
            if (this.isConfigurator) {
                window.confDeskMover = null;
            }
            delete deskMovers[this.numStr];
            this.windowContainer.remove();
            activateWindow(prevActiveWindow);
        } else {
            let msg = "";
            switch (window.runningMode) {
                case WE:
                    msg = "click 'Add a new ActiveDesktop item' in the Wallpaper Engine properties panel.";
                    break;
                case LW:
                    msg = "click Add in the Lively Wallpaper customize window.";
                    break;
                case BROWSER:
                    msg = "right click the background and click New.";
                    break;
            }
            madAlert("To show it again, " + msg);
            this.windowContainer.style.display = 'none';
            localStorage.madesktopItemVisible = false;
        }
    }

    openContextMenu() {
        this.windowContainer.style.setProperty('--context-menu-left', '');
        this.windowContainer.style.setProperty('--context-menu-top', '');
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
    }

    openContextMenuFromRightClick(event) {
        this.windowContainer.style.setProperty('--context-menu-left', this.posInContainer.x + 'px');
        this.windowContainer.style.setProperty('--context-menu-top', this.posInContainer.y + 'px');
        this.contextMenuBg.style.display = "block";
        iframeClickEventCtrl(false);
        isContextMenuOpen = true;
        this.contextMenuBg.focus();
        event.preventDefault();
    }

    closeContextMenu() {
        log(`contextMenuOpening: ${this.contextMenuOpening}`);
        if (this.contextMenuOpening) {
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
    }

    openConfMenu() {
        this.contextMenuItems[0].dataset.active = true;
        this.confMenuBg.style.display = "block";
        iframeClickEventCtrl(false);
    }

    closeConfMenu() {
        if (this.shouldNotCloseConfMenu) {
            return
        }
        delete this.contextMenuItems[0].dataset.active;
        this.confMenuBg.style.display = "none";
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

    changeWndStyle(style) {
        if (style === "noframes") {
            style = "ad";
            this.config.noFrames = true;
        } else {
            this.config.noFrames = false;
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
        this.config.style = style;
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
            const item = dummy.cloneNode(dummy, true);
            item.textContent = option.textContent;
            item.dataset.value = option.value;
            item.addEventListener('click', () => {
                elem.value = item.dataset.value;
                elem.dispatchEvent(new Event('change'));
                if (label) {
                    label.textContent = item.textContent;
                }
                this.closeDropdown();
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

        const itemHeight = this.dropdown.children[1].getBoundingClientRect().height;
        if (optionCnt >= 25) {
            this.dropdownBg.style.height = itemHeight * 25 + "px";
        } else {
            this.dropdownBg.style.height = itemHeight * optionCnt + "px";
        }
        this.dropdown.style.height = this.dropdownBg.style.height;

        iframeClickEventCtrl(false);
        this.dropdownBg.focus();
    }

    closeDropdown() {
        this.dropdownBg.style.display = "none";
        delete this.lastDropdown.dataset.open;
        iframeClickEventCtrl(true);
    }

    openColorPicker(initialColor, expand, callback) {
        const left = parseInt(this.config.xPos) + 4 + 'px';
        const top = parseInt(this.config.yPos) + 26 + 'px';
        const colorPicker = openWindow("apps/colorpicker/index.html", true, expand ? "447px" : "219px", "298px", "wnd", false, top, left, true, true);
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

    #wcMouseDown(event) {
        this.bringToTop();
        if ((this.windowFrame.style.borderColor !== "transparent" || this.config.style !== "ad") && !this.mouseOverWndBtns) {
            iframeClickEventCtrl(false);
            this.isDown = true;
            this.offset = [
                this.windowContainer.offsetLeft - Math.ceil(event.clientX / window.scaleFactor), // event.clientXY doesn't work well with css zoom
                this.windowContainer.offsetTop - Math.ceil(event.clientY / window.scaleFactor)
            ];
            let extraBorderSize = 0;
            if (this.config.style === "wnd") {
                extraBorderSize = parseInt(getComputedStyle(this.windowContainer).getPropertyValue('--extra-border-size'));
            }
            this.#updatePrevOffset();
            log([this.posInContainer.x, this.posInContainer.y]);
            // Decide the resizing mode based on the position of the mouse cursor
            if (this.posInContainer.x <= 3 + extraBorderSize) {
                this.resizingMode = this.config.unresizable ? null : "left";
            } else if (this.posInContainer.x >= this.windowContainer.offsetWidth - 4 - extraBorderSize) {
                this.resizingMode = this.config.unresizable ? null : "right";
            } else if (this.posInContainer.y <= 3 + extraBorderSize && this.config.style !== "ad") {
                this.resizingMode = this.config.unresizable ? null : "top";
            } else if (this.posInContainer.y <= 9 && this.posInContainer.y >= 6 && this.config.style === "ad") {
                this.resizingMode = this.config.unresizable ? null : "top";
            } else if (this.posInContainer.y >= 30) {
                this.resizingMode = this.config.unresizable ? null : "bottom";
            } else if (this.posInContainer.y >= 6 || this.config.style !== "ad") {
                this.resizingMode = "none";
            } else {
                this.resizingMode = null;
            }
        }
    }

    #docMouseUp() {
        iframeClickEventCtrl(true);
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
            // Window resizing & moving - adjust windowContainer / windowElement first
            switch (this.resizingMode) {
                case "left":
                    if (this.windowElement.offsetWidth >= 60) {
                        this.windowElement.width = this.prevOffsetRight - this.mousePosition.x + 'px';
                        this.windowContainer.style.left = (this.mousePosition.x + this.offset[0]) + 'px';
                    }
                    break;

                case "right":
                    if (this.windowElement.offsetWidth >= 60) {
                        this.windowElement.width = this.posInContainer.x - 6 + 'px';
                    }
                    break;

                case "top":
                    if (this.windowElement.offsetHeight >= 15) {
                        this.windowElement.height = this.prevOffsetBottom - this.mousePosition.y + 'px';
                        this.windowContainer.style.top = (this.mousePosition.y + this.offset[1]) + 'px';
                    }
                    break;

                case "bottom":
                    if (this.windowElement.offsetHeight >= 15) {
                        this.windowElement.height = this.posInContainer.y - 21 + 'px';
                    }
                    break;

                case "none":
                    this.windowContainer.style.left = (this.mousePosition.x + this.offset[0]) + 'px';
                    this.windowContainer.style.top  = (this.mousePosition.y + this.offset[1]) + 'px';
                    break;
            }
            if (this.resizingMode !== "none") {
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
        if (this.resizingMode === "none" && (this.windowElement.style.borderColor !== "transparent" || this.config.style !== "ad") && !this.config.unresizable) {
            if (this.posInContainer.x <= 3 + extraBorderSize) {
                document.body.style.cursor = "ew-resize";
            } else if (this.posInContainer.x >= this.windowContainer.offsetWidth - 4 - extraBorderSize) {
                document.body.style.cursor = "ew-resize";
            } else if (this.posInContainer.y <= 3 + extraBorderSize && this.config.style !== "ad" && this.windowTitlebar.style.display !== "none") {
                document.body.style.cursor = "ns-resize";
            } else if (this.posInContainer.y <= 9 && this.posInContainer.y >= 6 && this.config.style === "ad" && this.windowTitlebar.style.display !== "none") {
                document.body.style.cursor = "ns-resize";
            } else if (this.posInContainer.y >= 30) {
                document.body.style.cursor = "ns-resize";
            } else {
                document.body.style.cursor = "auto";
            }
        }
        log(this.posInContainer, "debug");
    }
    
    async #weLoad () {
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
                this.config.title = null;
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
            this.config.width = null;
            this.config.height = null;
            this.config.xPos = null;
            this.config.yPos = null;
            this.config.src = null;
            this.config.style = null;
            this.config.unscaled = null;
            this.config.title = null;
            this.config.zIndex = null;
            this.config.active = null;
            this.config.alwaysOnTop = null;
            this.config.jspaintHash = null;
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
        }
    }
    
    // Update the visibility of window components based on the cursor's position
    // Replicates the original ActiveDesktop behavior
    #updateWindowComponentVisibility() {
        if (this.config.style === "ad" && !this.config.noFrames) {
            this.windowElement.style.borderColor = "var(--button-face)";
        }
        if (typeof this.posInWindow !== 'undefined') {
            if ((this.posInWindow.x <= 15 || 
                this.posInWindow.x >= this.windowElement.offsetWidth - 15 || 
                this.posInWindow.y <= 50 || 
                this.posInWindow.y >= this.windowElement.offsetHeight - 15) &&
                !this.config.noFrames
            ) {
                if (this.config.style === "ad") {
                    this.windowFrame.style.borderColor = "var(--button-face)";
                    this.windowFrame.style.backgroundColor = "var(--button-face)"; // required to fix some weird artifacts in hidpi/css-zoomed mode
                }
                if (this.config.style === "wnd") {
                    this.windowTitlebar.style.display = "flex";
                } else if (this.posInWindow.y <= 50 || this.config.style === "nonad") {
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
        }
    });
    
    document.addEventListener('mouseup', function () {
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
            container.style.left = (Math.ceil(event.clientX / scaleFactor) + offset[0]) + 'px';
            container.style.top  = (Math.ceil(event.clientY / scaleFactor) + offset[1]) + 'px';
            container.style.right = "auto";
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
