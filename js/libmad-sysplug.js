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
        inputStatus: false
    };

    async function request(endpoint, data, headers = {}) {
        if (endpoint !== "connecttest" && !localStorage.sysplugIntegration) {
            return;
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
        const response = await request("begininput");
        if (response === "OK") {
            madSysPlug.inputStatus = true;
        }
        // long polling from /getinput
        const inputEvent = new Event("spinput");
        while (madSysPlug.inputStatus) {
            await new Promise(resolve => {
                const eventSource = new EventSource("http://localhost:3031/getinput");
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
        setTimeout(() => {
            // Wait a bit cuz wallpaper click un-focuses the input panel
            request("focusinput");
        }, 100);
    }

    async function endInput() {
        const response = await request("endinput");
        if (response === "OK") {
            madSysPlug.inputStatus = false;
        }
        return response;
    }
})();