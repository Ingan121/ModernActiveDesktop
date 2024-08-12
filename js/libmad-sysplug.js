// libmad-sysplug.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

// This script handles all the communication between MAD and the system plugin

(function() {
    window.madSysPlug = {
        checkConnectivity,
        getSystemScheme,
        openExternal,
        mediaControl,
        beginInput,
        focusInput,
        endInput,
        getClipboard,
        inputStatus: false
    };

    let eventSource;
    let waitingForBeginInput = false;
    let token = top.spToken || null;

    if (window.madMainWindow) {
        fetchToken();
    }

    async function fetchToken() {
        try {
            token = (await fetch("madsp-token.txt").then(res => res.text())).split("\r\n")[0];
            window.spToken = token;
        } catch (error) {
            console.error("Failed to get the token: ", error);
        }
    }

    async function request(endpoint, data, headers = {}) {
        if (endpoint !== "connecttest" && !localStorage.sysplugIntegration) {
            return;
        }

        if (token) {
            headers["X-MADSP-Token"] = token;
        }
        if (data) {
            if (typeof data !== "string") {
                data = JSON.stringify(data);
                headers["Content-Type"] = "application/json";
            }

            return await fetch(`http://localhost:3031/${endpoint}`, {
                method: "POST", headers, body: data
            }).then(res => res.text());
        } else {
            return await fetch(`http://localhost:3031/${endpoint}`, {
                headers
            }).then(res => res.text());
        }
    }

    async function checkConnectivity() {
        try {
            const response = await request("connecttest");
            if (response === localStorage.madesktopLastVer) {
                // The system plugin is up to date
                return 1;
            } else if (response === "403 Forbidden") {
                // The system plugin has denied the connection
                return -2;
            } else {
                // The system plugin is outdated
                return -1;
            }
        } catch (error) {
            // The system plugin is not running or something went wrong
            return 0;
        }
    }

    async function getSystemScheme() {
        return await request("systemscheme");
    }

    async function openExternal(url, headers) {
        return await request("open", url, headers);
    }

    async function mediaControl(action, title = "") {
        return await request(action, title);
    }

    async function beginInput() {
        if (madSysPlug.inputStatus || waitingForBeginInput) {
            return false;
        }

        try {
            waitingForBeginInput = true; // Prevent multiple beginInput calls
            const response = await request("begininput");
            waitingForBeginInput = false;
            if (response !== "OK") {
                return false;
            }
        } catch (error) {
            waitingForBeginInput = false;
            return false;
        }

        madSysPlug.inputStatus = true;
        getInput();            
        return true;
    }

    // long polling from /getinput
    async function getInput() {
        const inputEvent = new Event("madinput");
        while (madSysPlug.inputStatus) {
            await new Promise(resolve => {
                eventSource = new EventSource("http://localhost:3031/getinput");
                eventSource.onmessage = function(event) {
                    inputEvent.key = event.data;
                    document.dispatchEvent(inputEvent);
                    if (event.data === "Escape") {
                        madSysPlug.inputStatus = false;
                    }
                    eventSource.close();
                    resolve();
                };
                eventSource.onerror = function (error) {
                    console.error("EventSource failed:", error);
                    eventSource.close();
                    madSysPlug.inputStatus = false;
                    resolve();
                };
            });
        }
    }

    function focusInput() {
        if (!madSysPlug.inputStatus) {
            beginInput();
            return;
        }
        setTimeout(() => {
            // Wait a bit cuz wallpaper click un-focuses the input panel
            request("focusinput");
        }, 100);
    }

    async function endInput(abrupt = false) {
        if (abrupt) {
            madSysPlug.inputStatus = false;
            if (eventSource) {
                eventSource.close();
            }
            return -1;
        }
        const response = await request("endinput");
        if (response === "OK") {
            madSysPlug.inputStatus = false;
            if (eventSource) {
                eventSource.close();
            }
        }
        return response;
    }

    async function getClipboard() {
        return await request("clipboard") || "[Pasting requires the system plugin]";
    }

    window.addEventListener("beforeunload", () => {
        if (madSysPlug.inputStatus) {
            endInput();
        }
    });

    window.addEventListener("message", (event) => {
        if (event.data.type === "sysplug-option-changed") {
            if (!localStorage.sysplugIntegration && madSysPlug.inputStatus) {
                endInput(true);
            }
        }
    });
})();