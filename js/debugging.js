// debugging.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

// This script handles debugging features for ModernActiveDesktop
// Such as the debug menu and logging
// Error handling is done by the inline script in html

(function () {
    const errorWnd = document.getElementById("errorWnd");
    const locationLabel = document.getElementById("location");
    const runningModeLabel = document.getElementById("runmode");
    const kbdSupportLabel = document.getElementById("kbdsupport");
    const debugMenu = document.getElementById("debug");
    const jsRunBtn = document.getElementById("jsRunBtn");
    const debugLogBtn = document.getElementById("debugLogBtn");

    let debugLog = false;

    function log(str, level, caller) {
        if (debugLog) {
            if (!caller) {
                caller = getCaller();
            }
            switch (typeof str) {
                case "object":
                    str = JSON.stringify(str);
                    break;
                case "string":
                    str = madProcessString(str.toString(), Array.from(arguments).slice(3));
                    break;
            }
            console[level || 'log'](`${caller}: ${str}`);
        }
    }

    function logTimed(str) {
        const time = performance.now() - window.loadStartTime;
        console.log(`[${time.toFixed(6)}ms] ${str}`);
    }

    // @unexported
    function debug(event) {
        if (!window.madPrompt) {
            // Let the original javascript: url handle it
            return;
        }
        madPrompt(madGetString("UI_PROMPT_RUNJS"), function (res) {
            eval(res);
        });
        event.preventDefault();
    }

    function activateDebugMode() {
        document.body.dataset.debugMode = true;
        debugMenu.style.top = localStorage.madesktopChanViewTopMargin || "0";
        debugMenu.style.right = localStorage.madesktopChanViewRightMargin || "0";
        debugMenu.style.left = "auto";
        for (const i in deskMovers) {
            deskMovers[i].windowTitlebar.classList.remove("noIcon");
        }
        localStorage.madesktopDebugMode = true;
    }

    function deactivateDebugMode() {
        delete document.body.dataset.debugMode;
        delete localStorage.madesktopDebugMode;
        delete localStorage.madesktopDebugLangLoadDelay;
        if (debugLog) toggleDebugLog();
        if (runningMode !== origRunningMode) {
            runningMode = origRunningMode;
            runningModeLabel.textContent = runningModeLabel.textContent.split(",")[0];
        }
    }

    function showDebugInfo() {
        locationLabel.textContent = madGetString("MAD_DEBUG_LOCATION", location.href);

        let runningModeStr = madGetString("MAD_DEBUG_BROWSER");
        switch (runningMode) {
            case 1:
                runningModeStr = "Wallpaper Engine";
                break;
            case 2:
                runningModeStr = "Lively Wallpaper";
                break;
        }
        if (runningMode === origRunningMode) {
            runningModeLabel.textContent = madGetString("MAD_DEBUG_RUNMODE", runningModeStr);
        } else {
            let origRunningModeStr = madGetString("MAD_DEBUG_BROWSER");
            switch (origRunningMode) {
                case 1:
                    origRunningModeStr = "Wallpaper Engine";
                    break;
                case 2:
                    origRunningModeStr = "Lively Wallpaper";
                    break;
            }
            runningModeLabel.textContent = madGetString("MAD_DEBUG_RUNMODE_SIMULATED", origRunningModeStr, runningModeStr);
        }
    }

    function toggleDebugLog() {
        debugLog = !debugLog;
        debugLogBtn.locId = debugLog ? "MAD_DEBUG_DISABLE_LOGGING" : "MAD_DEBUG_ENABLE_LOGGING";
        if (debugLog) {
            localStorage.madesktopDebugLog = true;
        } else {
            delete localStorage.madesktopDebugLog;
        }
    }

    function toggleRunningMode() {
        switch (runningMode) {
            case 0:
                runningMode = 1;
                break;
            case 1:
                runningMode = 2;
                break;
            case 2:
                runningMode = 0;
        }
        showDebugInfo();
    }

    function toggleKbdSupport() {
        kbdSupport = [1, -1, 0][kbdSupport + 1];
        kbdSupportLabel.textContent = kbdSupport;
    }

    function showErrors() {
        errorWnd.style.display = "block";
    }

    window.log = log;
    window.logTimed = logTimed;
    window.activateDebugMode = activateDebugMode;
    window.deactivateDebugMode = deactivateDebugMode;
    window.showDebugInfo = showDebugInfo;
    window.toggleDebugLog = toggleDebugLog;
    window.toggleRunningMode = toggleRunningMode;
    window.toggleKbdSupport = toggleKbdSupport;
    window.showErrors = showErrors;

    jsRunBtn.addEventListener('click', debug);
})();