function initDeskMover(num, openDoc, temp, width, height, style) {
    const windowContainer = windowContainers[num];
    const windowTitlebar = windowContainer.getElementsByClassName("windowTitlebar")[0] || windowContainer.getElementsByClassName("title-bar")[0];
    const windowTitleText = windowContainer.getElementsByClassName("title-bar-text")[0];
    const windowFrame = windowContainer.getElementsByClassName("windowFrame")[0];
    const windowElement = windowContainer.getElementsByClassName("windowElement")[0];
    const windowMenuBtn = windowContainer.getElementsByClassName("windowMenuBtn")[0];
    const windowIcon = windowContainer.getElementsByClassName("windowIcon")[0];
    const windowCloseBtn = windowContainer.getElementsByClassName("windowCloseBtn")[0];
    const windowCloseBtnAlt = windowContainer.getElementsByClassName("windowCloseBtnAlt")[0];
    const contextMenuBg = windowContainer.getElementsByClassName("contextMenuBg")[0];
    const contextMenu = windowContainer.getElementsByClassName("contextMenu")[0];
    const contextMenuItems = contextMenu.getElementsByClassName("contextMenuItem");
    const confMenuBg = windowContainer.getElementsByClassName("confMenuBg")[0];
    const confMenu = windowContainer.getElementsByClassName("confMenu")[0];
    const confMenuItems = confMenu.getElementsByClassName("contextMenuItem");
    const numStr = num == 0 ? "" : num;
    let mousePosition, posInWindow, posInContainer;
    let offset = [0, 0];
    let isDown = false, resizingMode = "none", mouseOverWndBtns = false;
    let timeout, timeout2;
    let prevOffsetRight, prevOffsetBottom;
    
    // Check if the deskitem we're trying to initialize is destroyed or not
    // Skip for deskitem 0 (the ChannelBar) - this design is to maintain backwards compatibility with old versions
    // which supported only one deskitem
    if (localStorage.madesktopDestroyedItems && num != 0) {
        if (localStorage.madesktopDestroyedItems.includes(`|${numStr}|`)) {
            windowContainer.style.display = "none";
            windowContainer.innerHTML = "";
            return;
        }
    }

    // Add to destroyed list first for temp items
    // Will be destroyed on the next load
    if (temp) localStorage.madesktopDestroyedItems += `|${numStr}|`;

    windowElement.dataset.num = numStr;
    
    const config = new Proxy({}, {
        get(target, key) {
            return localStorage.getItem("madesktopItem" + key[0].toUpperCase() + key.slice(1) + numStr);
        },
        set(target, key, value) {
            if (value) {
                localStorage.setItem("madesktopItem" + key[0].toUpperCase() + key.slice(1) + numStr, value);
            } else {
                localStorage.removeItem("madesktopItem" + key[0].toUpperCase() + key.slice(1) + numStr);
            }
        }
    });
    
    windowContainer.addEventListener('mousedown', function wcMouseDown(event) {
        windowContainer.style.zIndex = ++lastZIndex; // bring to top
        saveZOrder();
        if ((windowFrame.style.borderColor != "transparent" || config.style !== "ad") && !mouseOverWndBtns) {
            iframeClickEventCtrl(false);
            isDown = true;
            offset = [
                windowContainer.offsetLeft - Math.ceil(event.clientX / scaleFactor), // event.clientXY doesn't work well with css zoom
                windowContainer.offsetTop - Math.ceil(event.clientY / scaleFactor)
            ];
            updatePrevOffset();
            log([posInContainer.x, posInContainer.y]);
            // Decide the resizing mode based on the position of the mouse cursor
            if (posInContainer.x <= 3) resizingMode = "left";
            else if (posInContainer.x >= windowContainer.offsetWidth - 3) resizingMode = "right";
            else if (posInContainer.y <= 3 && config.style !== "ad") resizingMode = "top";
            else if (posInContainer.y <= 9 && posInContainer.y >= 6 && config.style === "ad") resizingMode = "top";
            else if (posInContainer.y >= 30) resizingMode = "bottom";
            else if (posInContainer.y >= 6 || config.style !== "ad") resizingMode = "none";
            else resizingMode = null;
        }
    });

    document.addEventListener('mouseup', function () {
        iframeClickEventCtrl(true);
        isDown = false;
        
        if (windowContainer.style.display == "none") return; // offsets are always 0 when hidden, causing unexpected behaviors
        // Minimum size
        if (windowElement.offsetWidth < 60) windowElement.width = "60px";
        if (windowElement.offsetHeight < 15) windowElement.height = "15px";
        keepInside();
        adjustElements();
        saveConfig();
        
        resizingMode = "none";
        document.body.style.cursor = "auto";
    });

    windowElement.addEventListener('mouseover', function (event) {
        clearTimeout(timeout);
        timeout = setTimeout(updateWindowComponentVisibility, 500);
    });

    windowContainer.addEventListener('mouseleave', function (event) {
        if (!isDown) {
            document.body.style.cursor = "auto";
            clearTimeout(timeout);
            if (config.style !== "ad") return; // never hide the frames in nonAD mode
            timeout = setTimeout(function () {
                windowElement.style.borderColor = "transparent";
                windowFrame.style.borderColor = "transparent";
                windowFrame.style.backgroundColor = "transparent";
                windowTitlebar.style.display = "none";
            }, 2000);
        } else {
            clearTimeout(timeout);
        }
    });

    document.addEventListener('mousemove', function (event) {
        mousePosition = {
            x : Math.ceil(event.clientX / scaleFactor),
            y : Math.ceil(event.clientY / scaleFactor)
        };
        posInContainer = {
            x : Math.ceil(event.clientX / scaleFactor) - windowContainer.offsetLeft,
            y : Math.ceil(event.clientY / scaleFactor) - windowContainer.offsetTop,
        }
        if (isDown) {
            // Window resizing & moving - adjust windowContainer / windowElement first
            switch (resizingMode) {
                case "left":
                    if (windowElement.offsetWidth >= 60) {
                        windowElement.width = prevOffsetRight - mousePosition.x + 'px';
                        windowContainer.style.left = (mousePosition.x + offset[0]) + 'px';
                    }
                    break;

                case "right":
                    if (windowElement.offsetWidth >= 60) windowElement.width = posInContainer.x - 6 + 'px';
                    break;

                case "top":
                    if (windowElement.offsetHeight >= 15) {
                        windowElement.height = prevOffsetBottom - mousePosition.y + 'px';
                        windowContainer.style.top = (mousePosition.y + offset[1]) + 'px';
                    }
                    break;

                case "bottom":
                    if (windowElement.offsetHeight >= 15) windowElement.height = posInContainer.y - 21 + 'px';
                    break;

                case "none":
                    windowContainer.style.left = (mousePosition.x + offset[0]) + 'px';
                    windowContainer.style.top  = (mousePosition.y + offset[1]) + 'px';
                    break;
            }
            if (resizingMode != "none") {
                // Now adjust the others
                adjustElements();
            }
        }
    });

    windowContainer.addEventListener('mousemove', function wcMouseMove(event) {
        log({cx: event.clientX, cy: event.clientY, cxs: event.clientX / scaleFactor, cys: event.clientY / scaleFactor}, "debug");
        posInContainer = {
            x : Math.ceil(event.clientX / scaleFactor) - windowContainer.offsetLeft,
            y : Math.ceil(event.clientY / scaleFactor) - windowContainer.offsetTop,
        }
        // Change the mouse cursor - although this is useless in WE
        if (resizingMode == "none" && (windowElement.style.borderColor != "transparent" || config.style !== "ad")) {
            if (posInContainer.x <= 3) document.body.style.cursor = "ew-resize";
            else if (posInContainer.x >= windowContainer.offsetWidth - 3) document.body.style.cursor = "ew-resize";
            else if (posInContainer.y <= 3 && config.style !== "ad" && windowTitlebar.style.display != "none") document.body.style.cursor = "ns-resize";
            else if (posInContainer.y <= 9 && posInContainer.y >= 6 && config.style === "ad" && windowTitlebar.style.display != "none") document.body.style.cursor = "ns-resize";
            else if (posInContainer.y >= 30) document.body.style.cursor = "ns-resize";
            else document.body.style.cursor = "auto";
        }
        log(posInContainer, "debug");
    })

    windowElement.addEventListener('load', async function () {
        this.contentDocument.addEventListener('mousemove', function (event) {
            posInWindow = {
                x : Math.ceil(event.clientX / scaleFactor),
                y : Math.ceil(event.clientY / scaleFactor)
            };
            clearTimeout(timeout);
            timeout = setTimeout(updateWindowComponentVisibility, 500);
        });

        this.contentDocument.addEventListener('mousedown', function (event) {
            windowContainer.style.zIndex = ++lastZIndex;
            saveZOrder();
        });
        
        if (!config.title) {
            windowTitleText.textContent = this.contentDocument.title || "ModernActiveDesktop";
        }
        windowIcon.src = await getFavicon(this);
        
        if (!config.unscaled) {
			this.contentDocument.body.style.zoom = scaleFactor;
        }
        hookIframeSize(this, numStr);
    });
    
    // Window menu button click & title bar right click
    windowMenuBtn.addEventListener('click', openContextMenu);
    windowIcon.addEventListener('click', openContextMenu);
    windowIcon.addEventListener('dblclick', closeWindow);
    windowTitlebar.addEventListener('contextmenu', openContextMenu);
    
    // Changes the active status correctly
    for (let i = 0; i < contextMenuItems.length; i++) {
        const elem = contextMenuItems[i];
        elem.onmouseover = function () {
            if (elem != contextMenuItems[0]) delete contextMenuItems[0].dataset.active;
        }
    }

    // Context menu button listeners
    contextMenuItems[0].addEventListener('click', openConfMenu); // Configure button
    
    contextMenuItems[0].addEventListener('mouseover', function() { // Configure button mouseover
        timeout2 = setTimeout(function () {
            openConfMenu();
        }, 300);
    });
    
    contextMenuItems[0].addEventListener('mouseleave', function() { // Configure button mouseleave
        clearTimeout(timeout2);
    });
    
    contextMenuItems[1].addEventListener('click', function () { // Debug button
        // Open DevTools first then click this button
        // This allows you to debug current DeskMover
        // Can call its functions in the console
        debugger;
    });
    // Don't hide any menu on debug mouseover because it's better for debugging

    contextMenuItems[2].addEventListener('click', function () { // Reset button
        closeContextMenu();
        if (temp) {
            ding.play();
            madAlert("This window is temporary, so it cannot be reset. Just close it.");
            return;
        }
        chord.play();
        madConfirm("Are you sure you want to reset this window?", function (res) {
            if (res) {
                config.width = null;
                config.height = null;
                config.xPos = null;
                config.yPos = null;
                config.src = null;
                config.style = null;
                config.unscaled = null;
                config.title = null;
                init(true);
            }
        });
    });

    contextMenuItems[3].addEventListener('click', function () { // Reload button
        closeContextMenu();
        location.reload();
    });

    contextMenuItems[4].addEventListener('click', function () { // Close button
        closeContextMenu();
        closeWindow();
    });
    
    // Hide the config menu when hovering other items than Configure and Debug
    contextMenuItems[2].addEventListener('mouseover', delayedCloseConfMenu);
    contextMenuItems[3].addEventListener('mouseover', delayedCloseConfMenu);
    contextMenuItems[4].addEventListener('mouseover', delayedCloseConfMenu);
    
    confMenuItems[0].addEventListener('click', function () { // Active Desktop style button
        closeContextMenu();
        changeWndStyle("ad");
    });
    
    confMenuItems[1].addEventListener('click', function () { // Non-Active Desktop style button
        closeContextMenu();
        changeWndStyle("nonad");
    });
    
    confMenuItems[2].addEventListener('click', function () { // Window style button
        closeContextMenu();
        changeWndStyle("wnd");
    });

    confMenuItems[3].addEventListener('click', function () { // Scale contents button
        closeContextMenu();
        if (config.unscaled) {
            windowElement.contentDocument.body.style.zoom = scaleFactor;
            confMenuItems[3].classList.add("checkedItem");
            config.unscaled = false;
        } else {
            windowElement.contentDocument.body.style.zoom = 1;
            confMenuItems[3].classList.remove("checkedItem");
            config.unscaled = true;
        }
        windowElement.contentWindow.dispatchEvent(new Event("resize"));
    });
    
    confMenuItems[4].addEventListener('click', function () { // Change URL button
        closeContextMenu();
        const urlToShow = config.src.startsWith("data:") ? "" : (config.src || "");
        madPrompt("Enter URL (leave empty to reset)", function (url) {
            if (url === null) return;
            if (url == "!debugmode") {
                activateDebugMode();
                return;
            }
            if (!url) {
                if (num == 0) url = "ChannelBar.html";
                else url = WINDOW_PLACEHOLDER;
            }
            windowElement.src = url;
            config.src = url;
        }, "", urlToShow);
    });
    
    confMenuItems[5].addEventListener('click', function () { // Change title button
        closeContextMenu();
        madPrompt("Enter title (leave empty to reset)", function (title) {
            if (title === null) return;
            if (title) {
                windowTitleText.textContent = title;
                config.title = title;
            } else {
                config.title = null;
                windowTitleText.textContent = windowElement.contentDocument.title || "ModernActiveDesktop";
            }
        });
    }, "", config.title || "");

    windowCloseBtn.addEventListener('click', closeWindow);
    windowCloseBtnAlt.addEventListener('click', closeWindow);
    
    function closeWindow() {
        if (num != 0) {
            windowContainer.style.display = "none";
            windowContainer.innerHTML = "";
            localStorage.madesktopDestroyedItems += `|${numStr}|`;
        } else {
            ding.play();
            let msg = "right click the background and click New.";
            if (runningMode == WE) msg = "click 'Add a new ActiveDesktop item' in the Wallpaper Engine properties panel.";
            else if (runningMode == LW) msg = "click Add in the Lively Wallpaper customize window.";
            madAlert("To show it again, " + msg);
            windowContainer.style.display = 'none';
            localStorage.madesktopItemVisible = false;
        }
    }
    
    // Prevent unintended menu closing when clicking the menu items
    contextMenuBg.addEventListener('click', preventDefault);
    contextMenuBg.addEventListener('mousedown', preventDefault);
    contextMenuBg.addEventListener('mouseup', preventDefault);
    contextMenuBg.addEventListener('mousemove', preventDefault);
    confMenuBg.addEventListener('click', preventDefault);
    confMenuBg.addEventListener('mousedown', preventDefault);
    confMenuBg.addEventListener('mouseup', preventDefault);
    confMenuBg.addEventListener('mousemove', preventDefault);
    
    function preventDefault(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    function openContextMenu(event) {
        contextMenuBg.style.display = "block";
        setTimeout(function () {
            document.addEventListener('click', closeContextMenu);
            iframeClickEventCtrl(false);
        }, 100);
        isContextMenuOpen = true;
        event.preventDefault();
    }

    function closeContextMenu() {
        contextMenuBg.style.display = "none";
        document.removeEventListener('click', closeContextMenu);
        closeConfMenu();
        iframeClickEventCtrl(true);
        isContextMenuOpen = false;
    }
    
    function openConfMenu() {
        contextMenuItems[0].dataset.active = true;
        confMenuBg.style.display = "block";
        setTimeout(function () {
            iframeClickEventCtrl(false);
        }, 100);
    }
    
    function closeConfMenu() {
        delete contextMenuItems[0].dataset.active;
        confMenuBg.style.display = "none";
    }
    
    function delayedCloseConfMenu() { 
        timeout2 = setTimeout(function () {
            closeConfMenu();
        }, 300);
    }

    windowMenuBtn.addEventListener('mouseover', function () {
        mouseOverWndBtns = true;
    });

    windowIcon.addEventListener('mouseover', function () {
        mouseOverWndBtns = true;
    });

    windowCloseBtn.addEventListener('mouseover', function () {
        mouseOverWndBtns = true;
    });
    
    windowCloseBtnAlt.addEventListener('mouseover', function () {
        mouseOverWndBtns = true;
    });

    windowMenuBtn.addEventListener('mouseout', function () {
        mouseOverWndBtns = false;
    });

    windowIcon.addEventListener('mouseout', function () {
        mouseOverWndBtns = false;
    });

    windowCloseBtn.addEventListener('mouseout', function () {
        mouseOverWndBtns = false;
    });
    
    windowCloseBtnAlt.addEventListener('mouseout', function () {
        mouseOverWndBtns = false;
    });
    
    init();
    
    function init(reinit) {
        // Load configs
        if (config.width) windowElement.width = config.width;
        if (config.height) windowElement.height = config.height;
        if (config.xPos) windowContainer.style.left = config.xPos;
        else windowContainer.style.left = vWidth - windowContainer.offsetWidth - 100 + 'px';
        if (config.yPos) windowContainer.style.top = config.yPos;
        changeWndStyle(config.style || style || "ad");
        if (config.unscaled) confMenuItems[3].classList.remove("checkedItem");
        else confMenuItems[3].classList.add("checkedItem");
        if (config.title) windowTitleText.textContent = config.title;
        adjustElements();
        keepInside();
        windowContainer.style.zIndex = config.zIndex || ++lastZIndex;

        if (config.src) {
            windowElement.src = config.src;
        } else {
            if (reinit) {
                changeWndStyle("ad");
            }
            if (num != 0) {
                let url = WINDOW_PLACEHOLDER;
                if ((typeof openDoc === "string" || openDoc instanceof String) && !reinit) {
                    windowElement.width = width || '800px';
                    windowElement.height = height || '600px';
                    windowContainer.style.left = (parseInt(localStorage.madesktopChanViewLeftMargin) || 75) + 250 + 'px';
                    windowContainer.style.top = '150px';
                    url = openDoc.endsWith(".html") ? openDoc : `docs/index.html?src=${openDoc}`;
                } else {
                    windowElement.width = width || '250px';
                    windowElement.height = height || '150px';
                    adjustElements();
                    windowContainer.style.left = vWidth - windowContainer.offsetWidth - (parseInt(localStorage.madesktopChanViewRightMargin) || 0) - 200 + 'px';
                    windowContainer.style.top = '200px';
                }
                adjustElements();
                keepInside();
                saveConfig();
                
                windowElement.src = url;
                config.src = url;
            } else {
                if (reinit) {
                    windowContainer.style.top = '200px';
                    windowElement.width = '84px';
                    windowElement.height = '471px';
                    adjustElements();
                    windowElement.src = "ChannelBar.html";
                }
                if (!localStorage.madesktopItemXPos) windowContainer.style.left = vWidth - windowContainer.offsetWidth - (parseInt(localStorage.madesktopChanViewRightMargin) || 0) - 100 + 'px';
            }
        }
    }   
    
    function changeWndStyle(style) {
        switch (style) {
            case "nonad":
                windowContainer.classList.add("window");
                windowTitlebar.classList.add("windowTitlebar");
                windowTitlebar.classList.remove("title-bar");
                windowTitlebar.style.display = "block";
                windowTitlebar.style.left = "2px";
                windowTitlebar.style.top = "3px";
                contextMenuBg.style.top = "21px";
                confMenuBg.style.top = "21px";
                windowTitlebar.style.width = windowElement.offsetWidth + 'px';
                windowElement.style.borderColor = "transparent";
                windowFrame.style.borderColor = "transparent";
                windowFrame.style.backgroundColor = "transparent";
                confMenuItems[0].classList.remove("activeStyle");
                confMenuItems[1].classList.add("activeStyle");
                confMenuItems[2].classList.remove("activeStyle");
                break;
            case "ad":
                windowContainer.classList.remove("window");
                windowTitlebar.classList.add("windowTitlebar");
                windowTitlebar.classList.remove("title-bar");
                windowTitlebar.style.display = "none";
                windowTitlebar.style.left = "0px";
                windowTitlebar.style.top = "6px";
                contextMenuBg.style.top = "24px";
                confMenuBg.style.top = "24px";
                windowTitlebar.style.width = windowElement.offsetWidth + 4 + 'px';
                confMenuItems[0].classList.add("activeStyle");
                confMenuItems[1].classList.remove("activeStyle");
                confMenuItems[2].classList.remove("activeStyle");
                break;
            case "wnd":
                windowContainer.classList.add("window");
                windowTitlebar.classList.remove("windowTitlebar");
                windowTitlebar.classList.add("title-bar");
                windowTitlebar.style.display = "flex";
                windowTitlebar.style.left = "2px";
                windowTitlebar.style.top = "3px";
                contextMenuBg.style.top = "24px";
                confMenuBg.style.top = "24px";
                windowTitlebar.style.width = windowElement.offsetWidth - 7 + 'px';
                windowElement.style.borderColor = "transparent";
                windowFrame.style.borderColor = "transparent";
                windowFrame.style.backgroundColor = "transparent";
                confMenuItems[0].classList.remove("activeStyle");
                confMenuItems[1].classList.remove("activeStyle");
                confMenuItems[2].classList.add("activeStyle");
        }
        config.style = style;
    }
    
    function updatePrevOffset() {
        prevOffsetRight = windowElement.offsetWidth + windowContainer.offsetLeft;
        prevOffsetBottom = windowElement.offsetHeight + windowContainer.offsetTop;
    }
    
    // Keep the deskitem inside the visible area
    function keepInside() {
        if (windowContainer.offsetLeft < -windowContainer.offsetWidth + 60) windowContainer.style.left = -windowTitlebar.offsetWidth + 60 + 'px';
        if (windowContainer.offsetTop < 0) windowContainer.style.top = 0;
        if (windowContainer.offsetLeft + 60 > vWidth) windowContainer.style.left = vWidth - 60 + 'px';
        if (windowContainer.offsetTop + 50 > vHeight) windowContainer.style.top = vHeight - 50 + 'px';
        updatePrevOffset();
    }
    
    // Adjust all elements to windowElement
    function adjustElements() {
        windowContainer.style.height = windowElement.offsetHeight + 21 + 'px';
        windowFrame.style.height = windowElement.offsetHeight + 'px';
        windowContainer.style.width = windowElement.offsetWidth - 2 + 'px';
        windowFrame.style.width = windowElement.offsetWidth + 'px';
        switch (config.style) {
            case "ad":
                windowTitlebar.style.width = windowElement.offsetWidth + 4 + 'px';
                break;
            case "wnd":
                windowTitlebar.style.width = windowElement.offsetWidth - 7 + 'px';
                break;
            case "nonad":
                windowTitlebar.style.width = windowElement.offsetWidth + 'px';
                break;
        }
        windowTitlebar.style.left = config.style !== "ad" ? '2px' : 0;
        windowTitlebar.style.top = config.style !== "ad" ? '3px' : '6px';
    }
    
    // Save configs
    function saveConfig() {
        config.width = windowElement.width;
        config.height = windowElement.height;
        config.xPos = windowContainer.style.left;
        config.yPos = windowContainer.style.top;
    }
    
    // Update the visibility of window components based on the cursor's position
    // Replicates the original ActiveDesktop behavior
    function updateWindowComponentVisibility() {
        if (config.style === "ad") windowElement.style.borderColor = "var(--button-face)";
        if (typeof posInWindow !== 'undefined') {
            if (posInWindow.x <= 15 || posInWindow.x >= windowElement.offsetWidth - 15 || posInWindow.y <= 50 || posInWindow.y >= windowElement.offsetHeight - 15) {
                if (config.style === "ad") {
                    windowFrame.style.borderColor = "var(--button-face)";
                    windowFrame.style.backgroundColor = "var(--button-face)"; // required to fix some weird artifacts in hidpi/css-zoomed mode
                }
                if (config.style === "wnd") {
                    windowTitlebar.style.display = "flex";
                } else if (posInWindow.y <= 50 || config.style === "nonad") {
                    windowTitlebar.style.display = "block";
                } else {
                    windowTitlebar.style.display = "none";
                }
            } else {
                windowFrame.style.borderColor = "transparent";
                windowFrame.style.backgroundColor = "transparent";
                if (config.style === "ad") windowTitlebar.style.display = "none";
            }
        } else if (config.style === "ad") {
            // Won't happen in WE; but required in normal browsers
            // I use Chrome/Edge for some debugging as mouse hovering doesn't work well in WE with a debugger attached
            // Edit: Well it now works well at the time of writing (MAD 2.4)
            windowFrame.style.borderColor = "var(--button-face)";
            windowFrame.style.backgroundColor = "var(--button-face)";
            windowTitlebar.style.display = config.style === "wnd" ? "flex" : "block";
        }
    }
}

function initSimpleMover(container, titlebar, exclusions) {
    let offset = [0, 0], isDown = false, mouseOverWndBtns = false;
    
    titlebar.addEventListener('mousedown', function() {
        if (!mouseOverWndBtns) {
            isDown = true;
            iframeClickEventCtrl(false);
            offset = [
                container.offsetLeft - Math.ceil(event.clientX / scaleFactor), // event.clientXY doesn't work well with css zoom
                container.offsetTop - Math.ceil(event.clientY / scaleFactor)
            ];
        }
    });
    
    document.addEventListener('mouseup', function() {
        isDown = false;
        iframeClickEventCtrl(true);
        
        // Keep the window inside the visible area
        if (container.offsetLeft < -container.offsetWidth + 60) container.style.left = -titlebar.offsetWidth + 60 + 'px';
        if (container.offsetTop < 0) container.style.top = 0;
        if (container.offsetLeft + 60 > vWidth) container.style.left = vWidth - 60 + 'px';
        if (container.offsetTop + 50 > vHeight) container.style.top = vHeight - 50 + 'px';
    });
    
    document.addEventListener('mousemove', function() {
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
