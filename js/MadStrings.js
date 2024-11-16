// MadStrings.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

// Dependencies: functions.js (getMadBase, escapeHTML), MadVersion.js if using %v

'use strict';

(function () {
    const supportedLanguages = {
        "en-US": "English",
        "ko-KR": "한국어"
    };

    window.madLang = (!!frameElement ? top.madLang : null) || localStorage.madesktopLang || navigator.language || navigator.userLanguage;

    const madStrings = {
        loaded: false,
        supportedLanguages: supportedLanguages,
        strings: {},
        fallbackStrings: null
    };
    window.madStrings = madStrings;

    const localizableElements = [];
    const titleElem = document.querySelector("title");
    const titleLocId = titleElem.dataset.locid;
    const langStyleElement = document.getElementById("langStyle");

    // Non-localizable strings
    const appName = "ModernActiveDesktop";
    const author = "Ingan121";
    const channelViewer = "ChannelViewer";

    if (!(window.madLang in supportedLanguages)) {
        if (window.madLang.length === 2) {
            for (const supportedLang in supportedLanguages) {
                if (window.madLang.slice(0, 2) === supportedLang.slice(0, 2)) {
                    window.madLang = supportedLang;
                    break;
                }
            }
        }
        if (!(window.madLang in supportedLanguages)) {
            window.madLang = "en-US";
        }
    }

    if (top === window) {
        // Only for the main MAD page
        window.changeLanguage = async (newLang, isInit) => {
            if (!(newLang in supportedLanguages) && !isInit) {
                for (const supportedLang in supportedLanguages) {
                    if (newLang.slice(0, 2) === supportedLang.slice(0, 2)) {
                        newLang = supportedLang;
                        break;
                    }
                }
                if (!(newLang in supportedLanguages)) {
                    throw new Error(`Language ${newLang} is not supported`);
                }
            }
            if (!isInit) {
                window.madLang = newLang;
            }
            try {
                const strings = await loadLanguageFile(newLang);
                madStrings.strings = strings;
                readyAll();
                madStrings.loaded = true;
                const announceFunc = window.announce || window.madAnnounce;
                if (announceFunc) {
                    announceFunc("language-ready");
                }

                const logFunc = (isInit && window.logTimed) ? window.logTimed : console.log;
                logFunc(`MADStrings: Language ${window.madLang} loaded successfully`);

                if (isInit) {
                    if (window.madLang === "en-US") {
                        madStrings.fallbackStrings = strings;
                    } else {
                        try {
                            madStrings.fallbackStrings = await loadLanguageFile("en-US");
                            logFunc(`MADStrings: Fallback language en-US loaded successfully`);
                        } catch (err) {
                            console.error(`Failed to load fallback language file for en-US.\n`, err);
                        }
                    }
                }
            } catch (err) {
                if (window.madLang === "en-US") {
                    console.error(`Failed to load language file for en-US.\n`, err);
                    // This is a critical error, so we need to show an alert
                    // Unless we're in a file:// context (main.js will show the alert in that case)
                    window.addEventListener("load", () => {
                        // Wait for window.madAlert to be defined (in main.js)
                        if (!madStrings.loaded && !window.madFileUriRestricted) {
                            // Avoid window.alert when running MAD normally, as it softlocks WPE 2.5+
                            const alertFunc = window.madMainWindow ? window.madAlert : window.alert;
                            alertFunc("ModernActiveDesktop failed to load the language file for en-US. Expect things to be broken. Check the console for more information.", null, "error");
                        }
                    });
                } else if (isInit) {
                    console.error(`Failed to load language file for ${window.madLang}. Trying to load English instead.`);
                    changeLanguage("en-US");
                } else {
                    console.error(`Failed to load language file for ${window.madLang}.`);
                }
            }
        }
        changeLanguage(window.madLang, true);
    } else {
        if (frameElement && top.madStrings) {
            madStrings.strings = top.madStrings.strings;
            madStrings.fallbackStrings = top.madStrings.fallbackStrings;
            madStrings.loaded = top.madStrings.loaded;
        }

        document.documentElement.lang = window.madLang;
        if (madStrings.loaded) {
            updateTitle(true);
            updateStyle();
        }
        window.addEventListener("message", (event) => {
            if (event.data.type === "language-ready") {
                madStrings.strings = top.madStrings.strings;
                madStrings.fallbackStrings = top.madStrings.fallbackStrings;
                window.madLang = top.madLang;
                document.documentElement.lang = window.madLang;
                readyAll();
                madStrings.loaded = true;
            }
        });
    }

    async function loadLanguageFile(lang) {
        const url = getMadBase() + `lang/${lang}.json`;
        const response = await fetch(url);
        const text = await response.text();
        if (localStorage.madesktopDebugMode && localStorage.madesktopDebugLangLoadDelay && window.asyncTimeout) {
            await window.asyncTimeout(parseInt(localStorage.madesktopDebugLangLoadDelay));
        }
        return JSON.parse(stripComments(text));
    }

    function stripComments(str) {
        return str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
    }

    function processString(str) {
        // locid:LOC_ID -> getString("LOC_ID")
        if (str.startsWith("locid:")) {
            return getString(escapeHTML(str.slice(6)));
        }
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
        // %[n]s -> arguments[n]
        if (arguments.length > 1) {
            for (let i = 1; i < arguments.length; i++) {
                str = str.replace(/%s/, arguments[i]);
                str = str.replace(`%${i}s`, arguments[i]);
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
        document.documentElement.lang = window.madLang;
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
            } else if (titleLocId !== locTitle) {
                document.title = locTitle;
            }
        }
    }

    function updateStyle() {
        if (langStyleElement) {
            if (madStrings.strings["STYLESHEET"]) {
                langStyleElement.textContent = madStrings.strings["STYLESHEET"];
            } else {
                langStyleElement.textContent = "";
            }
        }
    }

    function getString(locId) {
        if (madStrings.strings[locId]) {
            return processString(madStrings.strings[locId], ...Array.from(arguments).slice(1));
        } else if (madStrings.fallbackStrings?.[locId]) {
            console.info(`Fallback string used for locId ${locId}`);
            return processString(madStrings.fallbackStrings?.[locId], ...Array.from(arguments).slice(1));
        } else {
            if (madStrings.loaded) {
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
                        this.ready(true);
                    }
                }
            });
        }

        connectedCallback() {
            localizableElements.push(this);
            this.ready();
        }

        ready(isLocIdChange) {
            if (madStrings.strings[this.locId]) {
                this.innerHTML = processString(madStrings.strings[this.locId]);
            } else if (madStrings.fallbackStrings?.[this.locId]) {
                console.info(`Fallback string used for locId ${this.locId}`);
                this.innerHTML = processString(madStrings.fallbackStrings?.[this.locId]);
            } else {
                if (madStrings.loaded) {
                    console.error(`No string found for locId ${this.locId}`);
                }
                if (isLocIdChange || !this.innerHTML) {
                    this.innerHTML = escapeHTML(this.locId);
                }
            }
        }
    }
    customElements.define("mad-string", MadString);
})();