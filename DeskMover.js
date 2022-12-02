function initDeskMover(num, openDoc, temp) {
    const windowContainer = windowContainers[num];
    const windowTitlebar = windowContainer.getElementsByClassName("windowTitlebar")[0];
    const windowFrame = windowContainer.getElementsByClassName("windowFrame")[0];
    const windowElement = windowContainer.getElementsByClassName("windowElement")[0];
    const windowMenuBtn = windowContainer.getElementsByClassName("windowMenuBtn")[0];
    const windowCloseBtn = windowContainer.getElementsByClassName("windowCloseBtn")[0];
    const contextMenuBg = windowContainer.getElementsByClassName("contextMenuBg")[0];
    const contextMenu = windowContainer.getElementsByClassName("contextMenu")[0];
    const contextMenuItems = contextMenu.getElementsByClassName("contextMenuItem");
    const numStr = num == 0 ? "" : num;
    let mousePosition, posInWindow, posInContainer;
    let offset = [0, 0];
    let isDown = false, resizingMode = "none", mouseOverWndBtns = false;
    let timeout;
    let prevOffsetRight, prevOffsetBottom;
    
    if (localStorage.madesktopDestroyedItems && num != 0) {
        if (localStorage.madesktopDestroyedItems.includes(`|${numStr}|`)) {
            windowContainer.style.display = "none";
            windowContainer.innerHTML = "";
            return;
        }
    }

    if (temp) localStorage.madesktopDestroyedItems += `|${numStr}|`;

    useNonADStyle = localStorage.madesktopNonADStyle;

    if (useNonADStyle) {
        windowContainer.classList.add("window");
        windowTitlebar.style.display = "block";
        contextMenuBg.style.top = "21px";
    }

    windowContainer.addEventListener('mousedown', function (event) {
        windowContainer.style.zIndex = ++lastZIndex;
        if ((windowFrame.style.borderColor != "transparent" || useNonADStyle) && !mouseOverWndBtns) {
            iframeClickEventCtrl(false);
            isDown = true;
            offset = [
                windowContainer.offsetLeft - event.clientX,
                windowContainer.offsetTop - event.clientY
            ];
            prevOffsetRight = windowElement.offsetWidth + windowContainer.offsetLeft;
            prevOffsetBottom = windowElement.offsetHeight + windowContainer.offsetTop;
            if (posInContainer.x <= 3) resizingMode = "left";
            else if (posInContainer.x >= windowContainer.offsetWidth - 3) resizingMode = "right";
            else if (posInContainer.y <= 3 && useNonADStyle) resizingMode = "top";
            else if (posInContainer.y <= 9 && posInContainer.y >= 6 && !useNonADStyle) resizingMode = "top";
            else if (posInContainer.y >= windowContainer.offsetTop - 3) resizingMode = "bottom";
            else if (posInContainer.y >= 6 || useNonADStyle) resizingMode = "none";
            else resizingMode = null;
        }
    });

    document.addEventListener('mouseup', function () {
        iframeClickEventCtrl(true);
        isDown = false;
        if (parseInt(windowElement.width) < 60) windowElement.width = "60px";
        if (parseInt(windowElement.height) < 15) windowElement.height = "15px";
        prevOffsetRight = windowElement.offsetWidth + windowContainer.offsetLeft;
        prevOffsetBottom = windowElement.offsetHeight + windowContainer.offsetTop;
        if (parseInt(windowContainer.style.left) < 0) windowContainer.style.left = "0px";
        if (parseInt(windowContainer.style.top) < 21) windowContainer.style.top = "21px";
        if (prevOffsetRight > window.innerWidth) windowContainer.style.left = window.innerWidth - windowContainer.offsetWidth + 'px';
        if (prevOffsetBottom > window.innerHeight) windowContainer.style.top = window.innerHeight - windowContainer.offsetHeight + 'px';
        prevOffsetRight = windowElement.offsetWidth + windowContainer.offsetLeft;
        prevOffsetBottom = windowElement.offsetHeight + windowContainer.offsetTop;
        windowContainer.style.height = parseInt(windowElement.height) + 21 + 'px';
        windowFrame.style.height = windowElement.height;
        windowContainer.style.width = windowElement.offsetWidth - 2 + 'px';
        windowFrame.style.width = windowElement.offsetWidth + 'px';
        windowTitlebar.style.width = windowElement.offsetWidth + (useNonADStyle ? 0 : 4) + 'px';
        windowTitlebar.style.left = useNonADStyle ? '2px' : 0;
        windowTitlebar.style.top = useNonADStyle ? '3px' : '6px';
        resizingMode = "none";
        document.body.style.cursor = "auto";
        localStorage.setItem("madesktopItemWidth" + numStr, windowElement.width);
        localStorage.setItem("madesktopItemHeight" + numStr, windowElement.height);
        localStorage.setItem("madesktopItemXPos" + numStr, windowContainer.style.left);
        localStorage.setItem("madesktopItemYPos" + numStr, windowContainer.style.top);
        console.log("mouseup");
    });

    windowElement.addEventListener('mouseover', function (event) {
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            if (!useNonADStyle) windowElement.style.borderColor = "var(--button-face)";
            if (posInWindow.x <= 15 || posInWindow.x >= parseInt(windowElement.width) - 15 || posInWindow.y <= 50 || posInWindow.y >= parseInt(windowElement.height) - 15 || typeof posInWindow === 'undefined') {
                if (!useNonADStyle) windowFrame.style.borderColor = "var(--button-face)";
                if (posInWindow.y <= 50 || typeof posInWindow === 'undefined' || useNonADStyle) windowTitlebar.style.display = "block";
            }
        }, 500);
    });

    windowContainer.addEventListener('mouseleave', function (event) {
        if (useNonADStyle) return;
        if (!isDown) {
            document.body.style.cursor = "auto";
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                windowElement.style.borderColor = "transparent";
                windowFrame.style.borderColor = "transparent";
                windowTitlebar.style.display = "none";
            }, 2000);
        } else {
            clearTimeout(timeout);
        }
    });

    document.addEventListener('mousemove', function (event) {
        mousePosition = {
            x : event.clientX,
            y : event.clientY
        };
        posInContainer = {
            x : event.clientX - windowContainer.offsetLeft,
            y : event.clientY - windowContainer.offsetTop
        }
        if (isDown) {
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
        posInContainer = {
            x : event.clientX - windowContainer.offsetLeft,
            y : event.clientY - windowContainer.offsetTop
        }
        if (resizingMode == "none" && (windowElement.style.borderColor != "transparent" || useNonADStyle)) {
            if (posInContainer.x <= 3) document.body.style.cursor = "ew-resize";
            else if (posInContainer.x >= windowContainer.offsetWidth - 3) document.body.style.cursor = "ew-resize";
            else if (posInContainer.y <= 3 && windowTitlebar.style.display != "none") document.body.style.cursor = "ns-resize"; 
            else if (posInContainer.y >= windowContainer.offsetTop - 3) document.body.style.cursor = "ns-resize"; 
            else document.body.style.cursor = "auto";
        }
        console.log(posInContainer);
        console.log(windowContainer.offsetWidth);
    })

    windowElement.addEventListener('load', function () {
        this.contentDocument.addEventListener('mousemove', function (event) {
            posInWindow = {
                x : event.clientX,
                y : event.clientY
            };
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                if (!useNonADStyle) windowElement.style.borderColor = "var(--button-face)";
                if (posInWindow.x <= 15 || posInWindow.x >= parseInt(windowElement.width) - 15 || posInWindow.y <= 50 || posInWindow.y >= parseInt(windowElement.height) - 15) {
                    if (!useNonADStyle) windowFrame.style.borderColor = "var(--button-face)";
                    if (posInWindow.y <= 50 || useNonADStyle) windowTitlebar.style.display = "block";
                    else windowTitlebar.style.display = "none";
                } else {
                    windowFrame.style.borderColor = "transparent";
                    if (!useNonADStyle) windowTitlebar.style.display = "none";
                }
            }, 500);
        });

        this.contentDocument.addEventListener('mousedown', function (event) {
            windowContainer.style.zIndex = ++lastZIndex;
        })
    });

    /* Disabled this as WE seems to have changed the cross-origin iframe policy
    if (num == 0) {
        window.addEventListener('message', function (event) {
            posInWindow = {
                x : event.data.x,
                y : event.data.y
            };
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                windowElement.style.borderColor = "rgb(192, 192, 192)";
                if (posInWindow.x <= 15 || posInWindow.x >= parseInt(windowElement.width) - 15 || posInWindow.y <= 50 || posInWindow.y >= parseInt(windowElement.height) - 15) {
                    windowFrame.style.borderColor = "rgb(192, 192, 192)";
                    if (posInWindow.y <= 50) windowTitlebar.style.display = "block";
                    else windowTitlebar.style.display = "none";
                } else {
                    windowFrame.style.borderColor = "transparent";
                    windowTitlebar.style.display = "none";
                }
            }, 500);
        });
    }
    */

    /*
    window.addEventListener('resize', function () {
        if (prevOffsetRight > window.innerWidth) windowContainer.style.left = window.innerWidth - windowContainer.offsetWidth + 'px';
        if (prevOffsetBottom > window.innerHeight) windowContainer.style.top = window.innerHeight - windowContainer.offsetHeight + 'px';
        prevOffsetRight = windowElement.offsetWidth + windowContainer.offsetLeft;
        prevOffsetBottom = windowElement.offsetHeight + windowContainer.offsetTop;
    });*/

    windowMenuBtn.addEventListener('click', function () {
        contextMenuBg.style.display = "block";
        var interval = setInterval(function () {
            contextMenuBg.style.height = parseInt(contextMenuBg.style.height) + 1 + 'px';
            contextMenu.style.top = parseInt(contextMenu.style.top) + 1 + 'px';
            if (parseInt(contextMenuBg.style.height) >= 68 && parseInt(contextMenu.style.top) >= 0) {
                clearInterval(interval);
                bgHtmlContainer.addEventListener('click', closeContextMenu);
                iframeClickEventCtrl(false);
            }
        }, 1);
    });

    contextMenu.addEventListener('mousedown', function (event) {
        event.preventDefault();
        event.stopPropagation();
    });

    contextMenu.addEventListener('mousemove', function (event) {
        event.preventDefault();
        event.stopPropagation();
    });

    contextMenuItems[0].addEventListener('click', debug); // Debug button (hidden with wall.css by default)

    contextMenuItems[1].addEventListener('click', function () { // Configure button
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

    contextMenuItems[2].addEventListener('click', function () { // Reset button
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

    contextMenuItems[3].addEventListener('click', function () { // Reload button
        closeContextMenu();
        location.reload();
    });

    contextMenuItems[4].addEventListener('click', function () { // Close button
        closeContextMenu();
        windowCloseBtn.click();
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
        contextMenuBg.style.height = '0px';
        contextMenu.style.top = '-68px';
        bgHtmlContainer.removeEventListener('click', closeContextMenu);
        iframeClickEventCtrl(true);
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
    else windowContainer.style.left = window.innerWidth - windowContainer.offsetWidth - 100 + 'px';
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
    if (prevOffsetRight > window.innerWidth) windowContainer.style.left = window.innerWidth - windowContainer.offsetWidth + 'px';
    if (prevOffsetBottom > window.innerHeight) windowContainer.style.top = window.innerHeight - windowContainer.offsetHeight + 'px';

    if (localStorage.getItem("madesktopItemSrc" + numStr)) {
        windowElement.src = localStorage.getItem("madesktopItemSrc" + numStr);
    } else {
        if (num != 0) {
            if (openDoc) {
                windowElement.width = '800px';
                windowElement.height = '600px';
                windowContainer.style.height = parseInt(windowElement.height) + 21 + 'px';
                windowContainer.style.width = windowElement.offsetWidth - 2 + 'px';
                windowContainer.style.left = (localStorage.madesktopChanViewLeftMargin ? parseInt(localStorage.madesktopChanViewLeftMargin) : 75) + 250 + 'px';
                windowContainer.style.top = '150px';
            } else {
                windowElement.width = '250px';
                windowElement.height = '150px';
                windowContainer.style.height = parseInt(windowElement.height) + 21 + 'px';
                windowContainer.style.width = windowElement.offsetWidth - 2 + 'px';
                windowContainer.style.left = window.innerWidth - windowContainer.offsetWidth - parseInt(localStorage.madesktopChanViewRightMargin) - 200 + 'px';
                windowContainer.style.top = '200px';
            }
            windowFrame.style.height = windowElement.height;
            windowFrame.style.width = windowElement.offsetWidth + 'px';
            windowTitlebar.style.width = windowElement.offsetWidth + (useNonADStyle ? 0 : 4) + 'px';
            windowTitlebar.style.left = useNonADStyle ? '2px' : 0;
            windowTitlebar.style.top = useNonADStyle ? '3px' : '6px';
            prevOffsetRight = windowElement.offsetWidth + windowContainer.offsetLeft;
            prevOffsetBottom = windowElement.offsetHeight + windowContainer.offsetTop;
            if (prevOffsetRight > window.innerWidth) windowContainer.style.left = window.innerWidth - windowContainer.offsetWidth + 'px';
            if (prevOffsetBottom > window.innerHeight) windowContainer.style.top = window.innerHeight - windowContainer.offsetHeight + 'px';
            localStorage.setItem("madesktopItemWidth" + numStr, windowElement.width);
            localStorage.setItem("madesktopItemHeight" + numStr, windowElement.height);
            localStorage.setItem("madesktopItemXPos" + numStr, windowContainer.style.left);
            localStorage.setItem("madesktopItemYPos" + numStr, windowContainer.style.top);

            const url = openDoc ? `docs/index.html?src=${openDoc}` : WINDOW_PLACEHOLDER;
            windowElement.src = url;
            localStorage.setItem("madesktopItemSrc" + numStr, url);
        } else {
            if (!localStorage.madesktopItemXPos) windowContainer.style.left = window.innerWidth - windowContainer.offsetWidth - parseInt(localStorage.madesktopChanViewRightMargin) - 100 + 'px';
        }
    }

    if (num != 0) {
        windowContainer.style.zIndex = ++lastZIndex;
    }
}

function iframeClickEventCtrl(clickable) {
    const value = clickable ? "auto" : "none";
    bgHtmlView.style.pointerEvents = value;
    for (let i = 0; i < windowContainers.length; i++)
        windowContainers[i].style.pointerEvents = value;
}