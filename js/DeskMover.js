function initDeskMover(num, openDoc, temp, width, height) {
    const windowContainer = windowContainers[num];
    const windowTitlebar = windowContainer.getElementsByClassName("windowTitlebar")[0];
    const windowFrame = windowContainer.getElementsByClassName("windowFrame")[0];
    const windowElement = windowContainer.getElementsByClassName("windowElement")[0];
    const windowMenuBtn = windowContainer.getElementsByClassName("windowMenuBtn")[0];
    const windowCloseBtn = windowContainer.getElementsByClassName("windowCloseBtn")[0];
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
    
    let useNonADStyle = false; // non-ActiveDesktop styling
    changeWndStyle(localStorage.getItem("madesktopItemStyle" + numStr));
    
    windowContainer.addEventListener('mousedown', function (event) {
        windowContainer.style.zIndex = ++lastZIndex; // bring to top
        if ((windowFrame.style.borderColor != "transparent" || useNonADStyle) && !mouseOverWndBtns) {
            iframeClickEventCtrl(false);
            isDown = true;
            offset = [
                windowContainer.offsetLeft - Math.ceil(event.clientX / scaleFactor), // event.clientXY doesn't work well with css zoom
                windowContainer.offsetTop - Math.ceil(event.clientY / scaleFactor)
            ];
            prevOffsetRight = windowElement.offsetWidth + windowContainer.offsetLeft;
            prevOffsetBottom = windowElement.offsetHeight + windowContainer.offsetTop;
            console.log(["mousedown", posInContainer.x, posInContainer.y]);
            // Decide the resizing mode based on the position of the mouse cursor
            if (posInContainer.x <= 3) resizingMode = "left";
            else if (posInContainer.x >= windowContainer.offsetWidth - 3) resizingMode = "right";
            else if (posInContainer.y <= 3 && useNonADStyle) resizingMode = "top";
            else if (posInContainer.y <= 9 && posInContainer.y >= 6 && !useNonADStyle) resizingMode = "top";
            else if (posInContainer.y >= 30) resizingMode = "bottom";
            else if (posInContainer.y >= 6 || useNonADStyle) resizingMode = "none";
            else resizingMode = null;
        }
    });

    document.addEventListener('mouseup', function () {
        iframeClickEventCtrl(true);
        isDown = false;
        // Minimum size
        if (parseInt(windowElement.width) < 60) windowElement.width = "60px";
        if (parseInt(windowElement.height) < 15) windowElement.height = "15px";
        prevOffsetRight = windowElement.offsetWidth + windowContainer.offsetLeft;
        prevOffsetBottom = windowElement.offsetHeight + windowContainer.offsetTop;
        
        // Keep the deskitem inside the visible area
        if (parseInt(windowContainer.style.left) < 0) windowContainer.style.left = "0px";
        if (parseInt(windowContainer.style.top) < 21) windowContainer.style.top = "21px";
        if (prevOffsetRight > vWidth) windowContainer.style.left = vWidth - windowContainer.offsetWidth + 'px';
        if (prevOffsetBottom > vHeight) windowContainer.style.top = vHeight - windowContainer.offsetHeight + 'px';
        prevOffsetRight = windowElement.offsetWidth + windowContainer.offsetLeft;
        prevOffsetBottom = windowElement.offsetHeight + windowContainer.offsetTop;
        
        // Final element size adjustment
        windowContainer.style.height = parseInt(windowElement.height) + 21 + 'px';
        windowFrame.style.height = windowElement.height;
        windowContainer.style.width = windowElement.offsetWidth - 2 + 'px';
        windowFrame.style.width = windowElement.offsetWidth + 'px';
        windowTitlebar.style.width = windowElement.offsetWidth + (useNonADStyle ? 0 : 4) + 'px';
        windowTitlebar.style.left = useNonADStyle ? '2px' : 0;
        windowTitlebar.style.top = useNonADStyle ? '3px' : '6px';
        
        resizingMode = "none";
        document.body.style.cursor = "auto";
        
        // Save config
        localStorage.setItem("madesktopItemWidth" + numStr, windowElement.width);
        localStorage.setItem("madesktopItemHeight" + numStr, windowElement.height);
        localStorage.setItem("madesktopItemXPos" + numStr, windowContainer.style.left);
        localStorage.setItem("madesktopItemYPos" + numStr, windowContainer.style.top);
        console.log("mouseup");
    });

    windowElement.addEventListener('mouseover', function (event) {
        clearTimeout(timeout); // replicate the original ActiveDesktop behavior
        timeout = setTimeout(function () {
            if (!useNonADStyle) windowElement.style.borderColor = "var(--button-face)";
            if (typeof posInWindow !== 'undefined') {
                if (posInWindow.x <= 15 || posInWindow.x >= parseInt(windowElement.width) - 15 || posInWindow.y <= 50 || posInWindow.y >= parseInt(windowElement.height) - 15) {
                    if (!useNonADStyle) {
                        windowFrame.style.borderColor = "var(--button-face)";
                        windowFrame.style.backgroundColor = "var(--button-face)"; // required to fix some wierd artifacts in hidpi/css-zoomed mode
                    }
                    if (posInWindow.y <= 50 || useNonADStyle) windowTitlebar.style.display = "block";
                }
            } else if (!useNonADStyle) {
                // Won't happen in WE; but required in normal browsers
                // I use Chrome/Edge for some debugging as mouse hovering doesn't work well in WE with a debugger attached
                windowFrame.style.borderColor = "var(--button-face)";
                windowFrame.style.backgroundColor = "var(--button-face)";
                windowTitlebar.style.display = "block";
            }
        }, 500);
    });

    windowContainer.addEventListener('mouseleave', function (event) {
        if (!isDown) {
            document.body.style.cursor = "auto";
            clearTimeout(timeout);
            if (useNonADStyle) return; // never hide the frames in nonAD mode
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
                    if (parseInt(windowElement.width) >= 60) {
                        windowElement.width = prevOffsetRight - mousePosition.x + 'px';
                        windowContainer.style.left = (mousePosition.x + offset[0]) + 'px';
                    }
                    break;

                case "right":
                    if (parseInt(windowElement.width) >= 60) windowElement.width = posInContainer.x - 6 + 'px';
                    break;

                case "top":
                    if (parseInt(windowElement.height) >= 15) {
                        windowElement.height = prevOffsetBottom - mousePosition.y + 'px';
                        windowContainer.style.top = (mousePosition.y + offset[1]) + 'px';
                    }
                    break;

                case "bottom":
                    if (parseInt(windowElement.height) >= 15) windowElement.height = posInContainer.y - 21 + 'px';
                    break;

                case "none":
                    windowContainer.style.left = (mousePosition.x + offset[0]) + 'px';
                    windowContainer.style.top  = (mousePosition.y + offset[1]) + 'px';
                    break;
            }
            if (resizingMode != "none") {
                // Now adjust the others
                windowContainer.style.height = parseInt(windowElement.height) + 21 + 'px';
                windowFrame.style.height = windowElement.height;
                windowContainer.style.width = windowElement.offsetWidth - 2 + 'px';
                windowFrame.style.width = windowElement.offsetWidth + 'px';
                windowTitlebar.style.width = windowElement.offsetWidth + (useNonADStyle ? 0 : 4) + 'px';
                windowTitlebar.style.left = useNonADStyle ? '2px' : 0;
                windowTitlebar.style.top = useNonADStyle ? '3px' : '6px';
            }
        }
    });

    windowContainer.addEventListener('mousemove', function (event) {
        //console.log({cx: event.clientX, cy: event.clientY, cxs: event.clientX / scaleFactor, cys: event.clientY / scaleFactor});
        posInContainer = {
            x : Math.ceil(event.clientX / scaleFactor) - windowContainer.offsetLeft,
            y : Math.ceil(event.clientY / scaleFactor) - windowContainer.offsetTop,
        }
        // Change the mouse cursor - although this is useless in WE
        if (resizingMode == "none" && (windowElement.style.borderColor != "transparent" || useNonADStyle)) {
            if (posInContainer.x <= 3) document.body.style.cursor = "ew-resize";
            else if (posInContainer.x >= windowContainer.offsetWidth - 3) document.body.style.cursor = "ew-resize";
            else if (posInContainer.y <= 3 && useNonADStyle && windowTitlebar.style.display != "none") document.body.style.cursor = "ns-resize";
            else if (posInContainer.y <= 9 && posInContainer.y >= 6 && !useNonADStyle && windowTitlebar.style.display != "none") document.body.style.cursor = "ns-resize";
            else if (posInContainer.y >= 30) document.body.style.cursor = "ns-resize";
            else document.body.style.cursor = "auto";
        }
        console.log(posInContainer);
        console.log(windowContainer.offsetWidth);
    })

    windowElement.addEventListener('load', function () {
        this.contentDocument.addEventListener('mousemove', function (event) {
            posInWindow = {
                x : Math.ceil(event.clientX / scaleFactor),
                y : Math.ceil(event.clientY / scaleFactor)
            };
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                if (!useNonADStyle) windowElement.style.borderColor = "var(--button-face)";
                if (posInWindow.x <= 15 || posInWindow.x >= parseInt(windowElement.width) - 15 || posInWindow.y <= 50 || posInWindow.y >= parseInt(windowElement.height) - 15) {
                    if (!useNonADStyle) {
                        windowFrame.style.borderColor = "var(--button-face)";
                        windowFrame.style.backgroundColor = "var(--button-face)";
                    }
                    if (posInWindow.y <= 50 || useNonADStyle) windowTitlebar.style.display = "block";
                    else windowTitlebar.style.display = "none";
                } else {
                    windowFrame.style.borderColor = "transparent";
                    windowFrame.style.backgroundColor = "transparent";
                    if (!useNonADStyle) windowTitlebar.style.display = "none";
                }
            }, 500);
        });

        this.contentDocument.addEventListener('mousedown', function (event) {
            windowContainer.style.zIndex = ++lastZIndex;
        });
        
        this.contentDocument.body.style.zoom = scaleFactor;
    });

    windowMenuBtn.addEventListener('click', function () {
        contextMenuBg.style.display = "block";
        setTimeout(function () {
            document.addEventListener('click', closeContextMenu);
            iframeClickEventCtrl(false);
        }, 100);
        isContextMenuOpen = true;
    });
    
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
    
    for (let i = 0; i < contextMenuItems.length; i++) {
        const elem = contextMenuItems[i];
        elem.onmouseover = function () {
            elem.getElementsByTagName('u')[0].style.borderBottomColor = 'var(--hilight-text)';
        }
        elem.onmouseout = function () {
            elem.getElementsByTagName('u')[0].style.borderBottomColor = 'var(--window-text)';
        }
    }
    
    for (let i = 0; i < confMenuItems.length; i++) {
        const elem = confMenuItems[i];
        elem.onmouseover = function () {
            elem.getElementsByTagName('u')[0].style.borderBottomColor = 'var(--hilight-text)';
        }
        elem.onmouseout = function () {
            elem.getElementsByTagName('u')[0].style.borderBottomColor = 'var(--window-text)';
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

    contextMenuItems[1].addEventListener('click', function () { // Reset button
        closeContextMenu();
        if (temp) {
            ding.play();
            setTimeout(function() {
                alert("This window is temporary, so it cannot be reset. Just close it.")
            }, 100);
            return;
        }
        chord.play();
        setTimeout(function () {
            if (confirm("Are you sure you want to reset this window?")) {
                localStorage.removeItem("madesktopItemWidth" + numStr);
                localStorage.removeItem("madesktopItemHeight" + numStr);
                localStorage.removeItem("madesktopItemXPos" + numStr);
                localStorage.removeItem("madesktopItemYPos" + numStr);
                localStorage.removeItem("madesktopItemSrc" + numStr);
                location.reload();
            };
        }, 100);
    });
    
    contextMenuItems[1].addEventListener('mouseover', function() { // Reset button mouseover
        timeout2 = setTimeout(function () {
            closeConfMenu();
        }, 300);
    });

    contextMenuItems[2].addEventListener('click', function () { // Reload button
        closeContextMenu();
        location.reload();
    });
    
    contextMenuItems[2].addEventListener('mouseover', function() { // Reload button mouseover
        timeout2 = setTimeout(function () {
            closeConfMenu();
        }, 300);
    });

    contextMenuItems[3].addEventListener('click', function () { // Close button
        closeContextMenu();
        windowCloseBtn.click();
    });
    
    contextMenuItems[3].addEventListener('mouseover', function() { // Close button mouseover
        timeout2 = setTimeout(function () {
            closeConfMenu();
        }, 300);
    });
    
    confMenuItems[0].addEventListener('click', function () { // Active Desktop style button
        closeContextMenu();
        changeWndStyle("ad");
        localStorage.setItem("madesktopItemStyle" + numStr, "ad");
    });
    
    confMenuItems[1].addEventListener('click', function () { // Non-Active Desktop style button
        closeContextMenu();
        changeWndStyle("nonad");
        localStorage.setItem("madesktopItemStyle" + numStr, "nonad");
    });
    
    confMenuItems[2].addEventListener('click', function () { // Set URL button
        closeContextMenu();
        let url = prompt("Enter URL (leave empty to reset)");
        if (url === null) return;
        if (!url) {
            if (num == 0) url = "ChannelBar.html";
            else url = WINDOW_PLACEHOLDER;
        }
        windowElement.src = url;
        localStorage.setItem("madesktopItemSrc" + numStr, url);
    });

    windowCloseBtn.addEventListener('click', function () {
        if (num != 0) {
            windowContainer.style.display = "none";
            windowContainer.innerHTML = "";
            localStorage.madesktopDestroyedItems += `|${numStr}|`;
        } else {
            ding.play();
            setTimeout(function () {
                alert("To show it again, click 'Add a new ActiveDesktop item' in the Wallpaper Engine properties panel.");
                windowContainer.style.display = 'none';
                localStorage.madesktopItemVisible = false;
            }, 100);
        }
    });

    function closeContextMenu() {
        contextMenuBg.style.display = "none";
        document.removeEventListener('click', closeContextMenu);
        closeConfMenu();
        iframeClickEventCtrl(true);
        isContextMenuOpen = false;
    }
    
    function openConfMenu() {
        confMenuBg.style.display = "block";
        setTimeout(function () {
            iframeClickEventCtrl(false);
        }, 100);
    }
    
    function closeConfMenu() {
        confMenuBg.style.display = "none";
    }

    windowMenuBtn.addEventListener('mouseover', function () {
        mouseOverWndBtns = true;
    });

    windowCloseBtn.addEventListener('mouseover', function () {
        mouseOverWndBtns = true;
    });

    windowMenuBtn.addEventListener('mouseout', function () {
        mouseOverWndBtns = false;
    });

    windowCloseBtn.addEventListener('mouseout', function () {
        mouseOverWndBtns = false;
    });

    if (localStorage.getItem("madesktopItemWidth" + numStr)) windowElement.width = localStorage.getItem("madesktopItemWidth" + numStr);
    if (localStorage.getItem("madesktopItemHeight" + numStr)) windowElement.height = localStorage.getItem("madesktopItemHeight" + numStr);
    if (localStorage.getItem("madesktopItemXPos" + numStr)) windowContainer.style.left = localStorage.getItem("madesktopItemXPos" + numStr);
    else windowContainer.style.left = vWidth - windowContainer.offsetWidth - 100 + 'px';
    if (localStorage.getItem("madesktopItemYPos" + numStr)) windowContainer.style.top = localStorage.getItem("madesktopItemYPos" + numStr);
    windowContainer.style.height = parseInt(windowElement.height) + 21 + 'px';
    windowFrame.style.height = windowElement.height;
    windowContainer.style.width = windowElement.offsetWidth - 2 + 'px';
    windowFrame.style.width = windowElement.offsetWidth + 'px';
    windowTitlebar.style.width = windowElement.offsetWidth + (useNonADStyle ? 0 : 4) + 'px';
    windowTitlebar.style.left = useNonADStyle ? '2px' : 0;
    windowTitlebar.style.top = useNonADStyle ? '3px' : '6px';
    prevOffsetRight = windowElement.offsetWidth + windowContainer.offsetLeft;
    prevOffsetBottom = windowElement.offsetHeight + windowContainer.offsetTop;
    if (prevOffsetRight > vWidth) windowContainer.style.left = vWidth - windowContainer.offsetWidth + 'px';
    if (prevOffsetBottom > vHeight) windowContainer.style.top = vHeight - windowContainer.offsetHeight + 'px';

    if (localStorage.getItem("madesktopItemSrc" + numStr)) {
        windowElement.src = localStorage.getItem("madesktopItemSrc" + numStr);
    } else {
        if (num != 0) {
            let url = WINDOW_PLACEHOLDER;
            if (typeof openDoc === "string" || openDoc instanceof String) {
                windowElement.width = width || '800px';
                windowElement.height = height || '600px';
                windowContainer.style.left = parseInt(localStorage.madesktopChanViewLeftMargin) || 75 + 250 + 'px';
                windowContainer.style.top = '150px';
                url = openDoc.endsWith(".html") ? openDoc : `docs/index.html?src=${openDoc}`;
            } else {
                windowElement.width = width || '250px';
                windowElement.height = height || '150px';
                windowContainer.style.left = vWidth - windowContainer.offsetWidth - (parseInt(localStorage.madesktopChanViewRightMargin) || 0) - 200 + 'px';
                windowContainer.style.top = '200px';
            }
            windowContainer.style.height = parseInt(windowElement.height) + 21 + 'px';
            windowContainer.style.width = windowElement.offsetWidth - 2 + 'px';
            windowFrame.style.height = windowElement.height;
            windowFrame.style.width = windowElement.offsetWidth + 'px';
            windowTitlebar.style.width = windowElement.offsetWidth + (useNonADStyle ? 0 : 4) + 'px';
            windowTitlebar.style.left = useNonADStyle ? '2px' : 0;
            windowTitlebar.style.top = useNonADStyle ? '3px' : '6px';
            prevOffsetRight = windowElement.offsetWidth + windowContainer.offsetLeft;
            prevOffsetBottom = windowElement.offsetHeight + windowContainer.offsetTop;
            if (prevOffsetRight > vWidth) windowContainer.style.left = vWidth - windowContainer.offsetWidth + 'px';
            if (prevOffsetBottom > vHeight) windowContainer.style.top = vHeight - windowContainer.offsetHeight + 'px';
            localStorage.setItem("madesktopItemWidth" + numStr, windowElement.width);
            localStorage.setItem("madesktopItemHeight" + numStr, windowElement.height);
            localStorage.setItem("madesktopItemXPos" + numStr, windowContainer.style.left);
            localStorage.setItem("madesktopItemYPos" + numStr, windowContainer.style.top);
            
            windowElement.src = url;
            localStorage.setItem("madesktopItemSrc" + numStr, url);
        } else {
            if (!localStorage.madesktopItemXPos) windowContainer.style.left = vWidth - windowContainer.offsetWidth - parseInt(localStorage.madesktopChanViewRightMargin) - 100 + 'px';
        }
    }

    if (num != 0) {
        windowContainer.style.zIndex = ++lastZIndex;
    }
    
    function changeWndStyle(style) {
        if (style == "nonad") {
            useNonADStyle = true;
            windowContainer.classList.add("window");
            windowTitlebar.style.display = "block";
            contextMenuBg.style.top = "21px";
            confMenuBg.style.top = "21px";
            windowElement.style.borderColor = "transparent";
            windowFrame.style.borderColor = "transparent";
            windowFrame.style.backgroundColor = "transparent";
        } else {
            useNonADStyle = false;
            windowContainer.classList.remove("window");
            windowTitlebar.style.display = "none";
            contextMenuBg.style.top = "24px";
            confMenuBg.style.top = "24px";
        }
        windowTitlebar.style.width = windowElement.offsetWidth + (useNonADStyle ? 0 : 4) + 'px';
        windowTitlebar.style.left = useNonADStyle ? '2px' : 0;
        windowTitlebar.style.top = useNonADStyle ? '3px' : '6px';
    }
}