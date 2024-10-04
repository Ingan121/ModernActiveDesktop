// MadStrings.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

(function () {
    // Non-localizable strings
    const appName = "ModernActiveDesktop";
    const author = "Ingan121";
    const channelViewer = "ChannelViewer";

    // Default English strings (en-US)
    window.madStrings = top.madStrings || {};

    const supportedLanguages = ["en-US", "ko-KR"];

    let lang = top.madLang || localStorage.madesktopLang || navigator.language || navigator.userLanguage;
    window.madLang = lang;

    const localizableElements = [];
    const titleElem = document.querySelector("title");
    const titleLocId = titleElem.dataset.locid;
    const langStyleElement = document.getElementById("langStyle");

    let languageReady = false;

    if (!supportedLanguages.includes(lang)) {
        if (lang.length === 2) {
            for (const supportedLang of supportedLanguages) {
                if (lang.slice(0, 2) === supportedLang.slice(0, 2)) {
                    lang = supportedLang;
                    break;
                }
            }
        }
        if (!supportedLanguages.includes(lang)) {
            lang = "en-US";
        }
    }

    if (top === window) {
        // Only for the main MAD page
        window.changeLanguage = (newLang, isInit) => {
            if (!supportedLanguages.includes(newLang) && !isInit) {
                for (const supportedLang of supportedLanguages) {
                    if (newLang.slice(0, 2) === supportedLang.slice(0, 2)) {
                        newLang = supportedLang;
                        break;
                    }
                }
                if (!supportedLanguages.includes(newLang)) {
                    throw new Error(`Language ${newLang} is not supported`);
                }
            }
            lang = newLang;
            window.madLang = lang;
            let url = `lang/${lang}.json`;
            if (!window.madMainWindow) {
                url = `../../${url}`;
            }
            fetch(url)
                .then(response => response.text())
                .then(text => {
                    window.madStrings = JSON.parse(stripComments(text));
                    readyAll();
                    if (window.announce) {
                        announce("language-ready");
                    }
                    languageReady = true;
                })
                .catch(err => {
                    if (isInit) {
                        console.error(`Failed to load language file for ${lang}. Trying to load English instead.`);
                        changeLanguage("en-US", isInit);
                    } else {
                        console.error(`Failed to load language file for ${lang}.`);
                    }
                });
        }
        changeLanguage(lang, true);
    } else {
        updateTitle(true);
        updateStyle();
        document.documentElement.lang = lang;
        window.addEventListener("message", (event) => {
            if (event.data.type === "language-ready") {
                window.madStrings = top.madStrings;
                lang = top.madLang;
                window.madLang = lang;
                document.documentElement.lang = lang;
                readyAll();
            }
        });
    }

    function stripComments(str) {
        return str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
    }

    function processString(str) {
        // &Apply -> <u>A</u>pply
        // \&Apply -> &Apply
        str = str.replace(/&([^&])/g, "<u>$1</u>").replace(/\\&/g, "&");
        // %([0-3])v -> madVersion.toString($1)
        str = str.replace(/%([0-3])v/g, (_, p1) => top.madVersion.toString(p1));
        // %n -> appName
        // %a -> author
        // %c -> channelViewer
        str = str.replace(/%n/g, appName).replace(/%a/g, author).replace(/%c/g, channelViewer);
        // %s -> extraString
        if (arguments.length > 1) {
            for (let i = 1; i < arguments.length; i++) {
                str = str.replace(/%s/, arguments[i]);
            }
        }
        return str;
    }
    window.madProcessString = processString;

    function readyAll() {
        for (const element of localizableElements) {
            element.ready();
        }
        updateTitle();
        updateStyle();
        document.documentElement.lang = lang;
        if (window.madMainWindow && window.showDebugInfo) {
            showDebugInfo();
        }
    }

    function updateTitle(isInit) {
        if (titleLocId) {
            const locTitle = getString(titleLocId);
            if (titleElem.dataset.noUpdateOnLocChange) {
                // Don't update the title on language change
                if (isInit) {
                    document.title = locTitle;
                }
            } else {
                document.title = locTitle;
            }
        }
    }

    function updateStyle() {
        if (langStyleElement) {
            if (window.madStrings["STYLESHEET"]) {
                langStyleElement.textContent = window.madStrings["STYLESHEET"];
            } else {
                langStyleElement.textContent = "";
            }
        }
    }

    function getString(locId) {
        if (window.madStrings[locId]) {
            return processString(window.madStrings[locId], ...Array.from(arguments).slice(1));
        } else {
            if (languageReady) {
                console.error(`No string found for locId ${locId}`);
            }
            return locId;
        }
    }
    window.madGetString = getString;

    class MadString extends HTMLElement {
        constructor() {
            super();
            Object.defineProperties(this, {
                locId: {
                    get() {
                        return this.dataset.locid
                    },
                    set(value) {
                        this.dataset.locid = value;
                        this.ready();
                    }
                }
            });
        }

        connectedCallback() {
            localizableElements.push(this);
            this.ready();
        }

        ready() {
            if (window.madStrings[this.locId]) {
                this.innerHTML = processString(window.madStrings[this.locId]);
            } else if (languageReady) {
                console.error(`No string found for locId ${this.locId}`);
            }
        }
    }
    customElements.define("mad-string", MadString);
})();