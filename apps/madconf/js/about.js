const icon = document.querySelector("img");
let debugReady = false;

icon.addEventListener("click", () => {
    debugReady = true;
});

window.apply = function () {
    if (debugReady && !localStorage.madesktopDebugMode) {
        madConfirm("Enable debug mode?", function(res) {
            if (res) {
                parent.activateDebugMode();
            }
        });
        debugReady = false;
    }
}