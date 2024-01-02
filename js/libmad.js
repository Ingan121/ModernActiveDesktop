const parentSchemeElement = parent.document.getElementById("scheme");
const schemeElement = document.getElementById("scheme");
const styleElement = document.getElementById("style");

applyScheme();

window.addEventListener("message", (event) => {
    if (event.data.type === "scheme-updated") {
        applyScheme();
    }
});

function applyScheme() {
    if (styleElement) {
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