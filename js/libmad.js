(function() {
    const parentSchemeElement = parent.document.getElementById("scheme");
    const parentFontElement = parent.document.getElementById("font");
    const schemeElement = document.getElementById("scheme");
    const fontElement = document.getElementById("font");
    const styleElement = document.getElementById("style");
    const deskMoverNum = frameElement.dataset.num || 0;
    const deskMover = parent.deskMovers[deskMoverNum];
    const windowContainer = deskMover.windowContainer;
    const dropdownBg = deskMover.dropdownBg;
    const dropdown = deskMover.dropdown;
    const config = deskMover.config;

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

        if (fontElement) {
            fontElement.href = parentFontElement.href;
        }

        try {
            document.documentElement.style.setProperty('--hilight-inverted', invertColor(getComputedStyle(document.documentElement).getPropertyValue('--hilight')));
        } catch {
            document.documentElement.style.setProperty('--hilight-inverted', 'var(--hilight-text)');
        }
    }
    
    function invertColor(hex) {
        if (hex.indexOf(' ') === 0) {
            hex = hex.slice(1);
        }
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            throw new Error('Invalid HEX color.');
        }
        // invert color components
        var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
            g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
            b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
        // pad each with zeros and return
        return '#' + padZero(r) + padZero(g) + padZero(b);
    }

    function padZero(str, len) {
        len = len || 2;
        var zeros = new Array(len).join('0');
        return (zeros + str).slice(-len);
    }

    Object.defineProperty(window, "madScaleFactor", {
        get: function() {
            if (config.unscaled) {
                return 1;
            } else {
                return parent.scaleFactor;
            }
        }
    });

    // jspaint stuff
    window.systemHooks = {
        setWallpaperTiled: (canvas) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onload = function () {
                    parent.changeBgImgMode("grid");
                    localStorage.madesktopBgImgMode = "grid";
                    const b64str = reader.result.split(";base64,")[1];
                    parent.document.body.style.backgroundImage = "url('data:image/png;base64," + b64str + "')";
                    localStorage.madesktopBgImg = b64str;
                };
                reader.readAsDataURL(blob);
            });
        },
        setWallpaperCentered: (canvas) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onload = function () {
                    parent.changeBgImgMode("center");
                    localStorage.madesktopBgImgMode = "center";
                    const b64str = reader.result.split(";base64,")[1];
                    parent.document.body.style.backgroundImage = "url('data:image/png;base64," + b64str + "')";
                    localStorage.madesktopBgImg = b64str;
                };
                reader.readAsDataURL(blob);
            });
        }
    };

    window.madDeskMover = deskMover;

    window.madOpenDropdown = function(elem) {
        const dummy = dropdownBg.querySelector(".dropdownItem");
        const options = elem.options;

        if (dropdown.childElementCount > 1) {
            for (let i = dropdown.childElementCount - 1; i > 0; i--) {
                dropdown.removeChild(dropdown.children[i]);
            }
        }

        for (const option of options) {
            if (option.hidden) {
                delete option;
                continue;
            }
            const item = dummy.cloneNode(dummy, true);
            item.textContent = option.textContent;
            item.dataset.value = option.value;
            item.addEventListener('click', function() {
                elem.value = this.dataset.value;
                elem.dispatchEvent(new Event('change'));
                closeDropdown();
            });
            dropdown.appendChild(item);
        }
        
        // Set these first to ensure the item height is retrieved correctly
        dropdownBg.style.display = "block";
        
        if (config.unscaled) {
            dropdownBg.style.left = elem.getBoundingClientRect().left / parent.scaleFactor + "px";
            dropdownBg.style.top = (elem.getBoundingClientRect().top + elem.offsetHeight) / parent.scaleFactor + "px";
            dropdownBg.style.width = elem.offsetWidth / parent.scaleFactor + "px";
        } else {
            dropdownBg.style.left = elem.getBoundingClientRect().left + "px";
            dropdownBg.style.top = elem.getBoundingClientRect().top + elem.offsetHeight + "px";
            dropdownBg.style.width = elem.offsetWidth + "px";
        }
        dropdown.style.width = dropdownBg.style.width;

        if (options.length >= 35) {
            dropdownBg.style.height = "490px";
        } else {
            const itemHeight = dropdown.children[1].getBoundingClientRect().height;
            dropdownBg.style.height = itemHeight * options.length + "px";
        }
        dropdown.style.height = dropdownBg.style.height;

        parent.addEventListener('click', closeDropdown);
        parent.iframeClickEventCtrl(false);

        // Suppress the original dropdown
        elem.blur();
        elem.focus();
    }

    function closeDropdown() {
        dropdownBg.style.display = "none";
        parent.document.removeEventListener('click', closeDropdown);
        parent.iframeClickEventCtrl(true);
    }

    window.madOpenWindow = parent.openWindow;
    window.madLocReplace = deskMover.locReplace.bind(deskMover);
    window.madResizeTo = deskMover.resizeTo.bind(deskMover);
    window.madMoveTo = deskMover.moveTo.bind(deskMover);
    window.madChangeWndStyle = deskMover.changeWndStyle.bind(deskMover);
    window.madCloseWindow = deskMover.closeWindow.bind(deskMover);

    window.madAlert = parent.madAlert;
    window.madConfirm = parent.madConfirm;
    window.madPrompt = parent.madPrompt;
    window.madPlaySound = parent.playSound;
})();