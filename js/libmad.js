(function() {
    const parentSchemeElement = parent.document.getElementById("scheme");
    const schemeElement = document.getElementById("scheme");
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
    }

    window.madOpenWindow = parent.openWindow;

    window.madLocReplace = function(url) {
        config.src = url;
        location.href = url;
    }

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

        if (options.length >= 35) {
            dropdownBg.style.height = "490px";
        } else {
            dropdownBg.style.height = 14 * options.length + "px";
        }
        dropdown.style.height = dropdownBg.style.height;
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
        dropdownBg.style.display = "block";

        parent.addEventListener('click', closeDropdown);
        parent.iframeClickEventCtrl(false);

        elem.blur();
        elem.focus();
    }

    function closeDropdown() {
        dropdownBg.style.display = "none";
        parent.document.removeEventListener('click', closeDropdown);
        parent.iframeClickEventCtrl(true);
    }

    window.madResizeTo = deskMover.resizeTo;
    window.madMoveTo = deskMover.moveTo;
    window.madCloseWindow = deskMover.closeWindow;
})();