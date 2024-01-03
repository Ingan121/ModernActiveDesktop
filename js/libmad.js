(function() {
    const parentSchemeElement = parent.document.getElementById("scheme");
    const schemeElement = document.getElementById("scheme");
    const styleElement = document.getElementById("style");
    const numStr = frameElement.dataset.num;

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

    applyScheme();

    window.addEventListener("message", (event) => {
        if (event.data.type === "scheme-updated") {
            applyScheme();
        }
    });

    function applyScheme() {
        if (styleElement && window.osguiCompatRequired) {
            if (parentSchemeElement.href !== "data:text/css,") {
                // OS-GUI Compatibility
                styleElement.textContent = `:root {
                    --ActiveBorder: var(--active-border);
                    --ActiveTitle: var(--active-title);
                    --AppWorkspace: var(--app-workspace);
                    --Background: var(--background);
                    --ButtonAlternateFace: var(--button-alternate-face);
                    --ButtonDkShadow: var(--button-dk-shadow);
                    --ButtonFace: var(--button-face);
                    --ButtonHilight: var(--button-hilight);
                    --ButtonLight: var(--button-light);
                    --ButtonShadow: var(--button-shadow);
                    --ButtonText: var(--button-text);
                    --GradientActiveTitle: var(--gradient-active-title);
                    --GradientInactiveTitle: var(--gradient-inactive-title);
                    --GrayText: var(--gray-text);
                    --Hilight: var(--hilight);
                    --HilightText: var(--hilight-text);
                    --HotTrackingColor: var(--hot-tracking-color);
                    --InactiveBorder: var(--inactive-border);
                    --InactiveTitle: var(--inactive-title);
                    --InactiveTitleText: var(--inactive-title-text);
                    --InfoText: var(--info-text);
                    --InfoWindow: var(--info-window);
                    --Menu: var(--menu);
                    --MenuText: var(--menu-text);
                    --Scrollbar: var(--scrollbar);
                    --TitleText: var(--title-text);
                    --Window: var(--window);
                    --WindowFrame: var(--window-frame);
                    --WindowText: var(--window-text);
                }`;
            } else {
                styleElement.textContent = "";
            }
        }
        schemeElement.href = parentSchemeElement.href;
    }

    window.madOpenWindow = parent.openWindow;

    window.madLocReplace = function(url) {
        config.src = url;
        location.href = url;
    }

    window.madResizeTo = function(width, height) {
        frameElement.width = width;
        frameElement.height = height;
        parent.document.dispatchEvent(new Event("mouseup")); // Trigger adjustElements()
    }

    window.madMoveTo = function(x, y) {
        frameElement.parentElement.parentElement.style.left = x + "px";
        frameElement.parentElement.parentElement.style.top = y + "px";
        config.xPos = x + "px";
        config.yPos = y + "px";
    }
})();