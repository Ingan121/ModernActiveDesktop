// libmad-strings.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License

'use strict';

(function () {
    // Non-localizable strings
    const appName = "ModernActiveDesktop";
    const author = "Ingan121";
    const channelViewer = "ChannelViewer";

    // Default English strings
    const fallbackStrings = {
        // #region General UI strings
        "UI_OK": "OK",
        "UI_CANCEL": "Cancel",
        "UI_APPLY": "&Apply",
        "UI_CLOSE": "&Close",
        "UI_OTHER": "&Other...",
        "UI_BROWSE": "&Browse...",
        "UI_COPY": "&Copy",
        "UI_CUT": "Cu&t",
        "UI_PASTE": "&Paste",
        "UI_SELECT_ALL": "Select &All",
        "UI_OPEN": "&Open",
        "UI_PRINT": "&Print",
        "UI_BACK": "&Back",
        "UI_FORWARD": "&Forward",
        "UI_EXIT": "E&xit",
        "UI_CUSTOM": "Custom",
        "UI_VERSION": "Version",
        "UI_NONE": "None",

        // #region Common menu names
        "UI_MENU_FILE": "&File",
        "UI_MENU_EDIT": "&Edit",
        "UI_MENU_VIEW": "&View",
        "UI_MENU_HELP": "&Help",
        "UI_MENUITEM_PROPERTIES": "&Properties",
        "UI_MENUITEM_FULL_SCREEN": "&Full Screen",
        // #endregion

        // #region Common messages
        "UI_MSG_SYSPLUG_REQUIRED": "This feature requires system plugin integration.",
        "UI_MSG_NO_SYSPLUG": "System plugin is not running. Please make sure you have installed it properly.",
        "UI_MSG_SYSPLUG_ERROR": "An error occured!<br>System plugin response: ",
        // #endregion
        // #endregion


        // #region MAD main strings
        "MAD_WINDOW_MENUITEM_CONFIGURE": "C&onfigure",
        "MAD_WINDOW_MENUITEM_DEBUG": "&Debug",
        "MAD_WINDOW_MENUITEM_RESET": "R&eset",
        "MAD_WINDOW_MENUITEM_RELOAD": "&Reload",

        "MAD_CONF_MENUITEM_AD": "&Active Desktop",
        "MAD_CONF_MENUITEM_NONAD": "&Non-ActiveDesktop Channel Bar",
        "MAD_CONF_MENUITEM_WND": "&Window",
        "MAD_CONF_MENUITEM_SCALE": "&Scale contents",
        "MAD_CONF_MENUITEM_AOT": "A&lways on top",
        "MAD_CONF_MENUITEM_RESIZABLE": "Re&sizable",
        "MAD_CONF_MENUITEM_CHANGE_URL": "&Change URL",
        "MAD_CONF_MENUITEM_CHANGE_TITLE": "Change &title",
        "MAD_CONF_MENUITEM_NEW_WINDOW": "&New window",
        "MAD_CONF_MENUITEM_RELOAD_WALLPAPER": "&Reload wallpaper",

        "MAD_MAIN_MENUITEM_NEW": "&New",

        "MAD_ERROR_X_FRAME_OPTIONS": "ModernActiveDesktop cannot load this URL due to a security policy.",
        "MAD_CONFIRM_X_FRAME_OPTIONS": "ModernActiveDesktop cannot load this URL due to a security policy. Do you want to open this page in ChannelViewer instead?",
        "MAD_CONFIRM_RESET": "Are you sure you want to reset this window?",
        "MAD_MSG_TEMP_WINDOW": "This window is temporary, so it cannot be reset. Just close it.",
        "MAD_PROMPT_ENTER_URL": "Enter URL (leave empty to reset)",
        "MAD_PROMPT_ENTER_TITLE": "Enter title (leave empty to reset)",
        "MAD_MSG_LINK_COPY_PROMPT": "Paste this URL in the browser's address bar. Click OK to copy.",
        // #endregion


        // #region MADConf strings
        "MADCONF_TITLE": "%n Properties",
        "MADCONF_PAGE_BACKGROUND": "Background",
        "MADCONF_PAGE_APPEARANCE": "Appearance",
        "MADCONF_PAGE_MISC": "Miscellaneous",
        "MADCONF_PAGE_ABOUT": "About",

        // #region Background tab
        "MADCONF_WALLPAPER_TITLE": "Wallpaper",
        "MADCONF_WPCHOOSER_TITLE": "&Select an HTML Document or a picture",
        "MADCONF_WPCHOOSER_CURRENT_IMG": "Current Image",
        "MADCONF_WPCHOOSER_CURRENT_WEB": "Current Webpage",
        "MADCONF_WPCHOOSER_VIDEO": "Video Wallpaper",
        "MADCONF_WALLPAPER_ENTER_URL": "&Enter URL...",
        "MADCONF_WALLPAPER_DISPLAY": "&Display",
        "MADCONF_WPDISPLAY_CENTER": "Center",
        "MADCONF_WPDISPLAY_TILE": "Tile",
        "MADCONF_WPDISPLAY_FIT": "Fit",
        "MADCONF_WPDISPLAY_FILL": "Fill",
        "MADCONF_WPDISPLAY_STRETCH": "Stretch",
        "MADCONF_WALLPAPER_MUTE": "Mute video",

        // #region Default wallpaper names
        "MADCONF_DEFAULTWP_BLACK_THATCH": "Black Thatch",
        "MADCONF_DEFAULTWP_BLUE_RIVETS": "Blue Rivets",
        "MADCONF_DEFAULTWP_BUBBLES": "Bubbles",
        "MADCONF_DEFAULTWP_CARVED_STONE": "Carved Stone",
        "MADCONF_DEFAULTWP_CIRCLES": "Circles",
        "MADCONF_DEFAULTWP_HOUNDSTOOTH": "Houndstooth",
        "MADCONF_DEFAULTWP_PINSTRIPE": "Pinstripe",
        "MADCONF_DEFAULTWP_SETUP": "Setup",
        "MADCONF_DEFAULTWP_STRAW_MAT": "Straw Mat",
        "MADCONF_DEFAULTWP_TILES": "Tiles",
        "MADCONF_DEFAULTWP_TRIANGLES": "Triangles",
        "MADCONF_DEFAULTWP_WAVES": "Waves",
        "MADCONF_DEFAULTWP_CLOUDS": "Clouds",
        "MADCONF_DEFAULTWP_BLISS": "Bliss",
        "MADCONF_DEFAULTWP_AURORA": "Aurora",
        "MADCONF_DEFAULTWP_HARMONY": "Harmony",
        // #endregion
        // #endregion

        // #region Appearance tab
        // #region Group labels and buttons
        "MADCONF_SCHEME_TITLE": "&Scheme:",
        "MADCONF_SCHEME_SAVE_AS": "Sa&ve As..",
        "MADCONF_SCHEME_DELETE": "&Delete",
        "MADCONF_ITEM_TITLE": "&Item:",
        "MADCONF_ITEM_SIZE_TITLE": "Si&ze:",
        "MADCONF_COLOR_TITLE": "Co&lor:",
        "MADCONF_COLOR2_TITLE": "Color &2:",
        "MADCONF_FONT_TITLE": "&Font:",
        "MADCONF_FONT_SIZE_TITLE": "Siz&e:",
        "MADCONF_TEXT_COLOR_TITLE": "Colo&r:",
        "MADCONF_EFFECTS_BTN": "&Effects",
        // #endregion

        // #region Scheme names
        "MADCONF_CURRENT_SCHEME": "Current Scheme",
        "MADCONF_SCHEME_CLASSIC": "Windows Classic",
        "MADCONF_SCHEME_STANDARD": "Windows Standard",
        "MADCONF_SCHEME_LUNA": "Windows XP style",
        "MADCONF_SCHEME_SYSTEM": "System Scheme",
        "MADCONF_SCHEME_IMPORT": "Browse...",
        "MADCONF_SCHEME_BRICK": "Brick",
        "MADCONF_SCHEME_DESERT": "Desert",
        "MADCONF_SCHEME_EGGPLANT": "Eggplant",
        "MADCONF_SCHEME_LILAC": "Lilac",
        "MADCONF_SCHEME_MAPLE": "Maple",
        "MADCONF_SCHEME_MARINE": "Marine",
        "MADCONF_SCHEME_PLUM": "Plum",
        "MADCONF_SCHEME_PUMPKIN": "Pumpkin",
        "MADCONF_SCHEME_RAINY_DAY": "Rainy Day",
        "MADCONF_SCHEME_RED_WHITE_AND_BLUE": "Red, White, and Blue",
        "MADCONF_SCHEME_ROSE": "Rose",
        "MADCONF_SCHEME_SLATE": "Slate",
        "MADCONF_SCHEME_SPRUCE": "Spruce",
        "MADCONF_SCHEME_STORM": "Storm",
        "MADCONF_SCHEME_TEAL": "Teal",
        "MADCONF_SCHEME_WHEAT": "Wheat",
        "MADCONF_SCHEME_XP_OLIVE": "Olive Green",
        "MADCONF_SCHEME_XP_SILVER": "Silver",
        "MADCONF_SCHEME_XP_ROYALE": "Royale",
        "MADCONF_SCHEME_FALLBACK": "Fallback",
        // #endregion

        // #region Item names
        "MADCONF_ITEM_BUTTON_FACE": "3D Object",
        "MADCONF_ITEM_BUTTON_HILIGHT": "3D Light",
        "MADCONF_ITEM_BUTTON_SHADOW": "3D Shadow",
        "MADCONF_ITEM_ACTIVE_TITLE": "Active Title Bar",
        "MADCONF_ITEM_ACTIVE_BORDER": "Active Window Border",
        "MADCONF_ITEM_APP_WORKSPACE": "Application Background",
        "MADCONF_ITEM_CAPTION_BUTTONS": "Caption Buttons",
        "MADCONF_ITEM_BACKGROUND": "Desktop",
        "MADCONF_ITEM_GRAY_TEXT": "Disabled Item",
        "MADCONF_ITEM_HOT_TRACKING_COLOR": "Hyperlink",
        "MADCONF_ITEM_INACTIVE_TITLE": "Inactive Title Bar",
        "MADCONF_ITEM_INACTIVE_BORDER": "Inactive Window Border",
        "MADCONF_ITEM_MENU": "Menu",
        "MADCONF_ITEM_MENU_BAR": "Menu Bar (Flat)",
        "MADCONF_ITEM_MESSAGE_BOX": "Message Box",
        "MADCONF_ITEM_PALETTE_TITLE": "Palette Title",
        "MADCONF_ITEM_SCROLLBAR": "Scroll Bar",
        "MADCONF_ITEM_HILIGHT": "Selected Item",
        "MADCONF_ITEM_INFO_WINDOW": "Tooltip",
        "MADCONF_ITEM_USER_INTERFACE": "UI Font",
        "MADCONF_ITEM_WINDOW": "Window",
        // #endregion

        // #region Preview texts
        "MADCONF_PREVIEW_INACTIVE_WINDOW": "Inactive Window",
        "MADCONF_PREVIEW_ACTIVE_WINDOW": "Active Window",
        "MADCONF_PREVIEW_MENU_NORMAL": "Normal",
        "MADCONF_PREVIEW_MENU_DISABLED": "Disabled",
        "MADCONF_PREVIEW_MENU_SELECTED": "Selected",
        "MADCONF_PREVIEW_WINDOW_TEXT": "Window Text",
        "MADCONF_PREVIEW_MESSAGE_BOX": "Message Box",
        "MADCONF_PREVIEW_MESSAGE_TEXT": "Message Text",
        // #endregion
        // #endregion

        // #region Effects window
        "MADCONF_EFFECTS_TITLE": "Effects",
        "MADCONF_CM_ANIM_TITLE": "&Use the following transition effect for menus:",
        "MADCONF_CM_ANIM_SLIDE": "Slide effect",
        "MADCONF_CM_ANIM_FADE": "Fade effect",
        "MADCONF_FLAT_MENU_TITLE": "Use &flat menus for:",
        "MADCONF_FLAT_MENU_MB": "Menu bars",
        "MADCONF_FLAT_MENU_CM": "Context menus",
        "MADCONF_FLAT_MENU_MBCM": "Menu bars and context menus",
        "MADCONF_CM_SHADOW": "Show sh&adows under menus",
        "MADCONF_OUTLINE_MODE": "Show &window contents while dragging",
        "MADCONF_NO_UNDERLINE": "&Hide underlined letters for keyboard navigation",
        "MADCONF_AERO_GLASS": "Enable Aero &transparency",
        "MADCONF_WIN_ANIM": "Enable Aero a&nimations",
        // #endregion

        // #region Miscellanous tab
        "MADCONF_DPI_TITLE": "Display scaling",
        "MADCONF_DPI_TITLE_FF_UNSUPPORTED": "Display scaling (not supported in Firefox)",

        "MADCONF_SYSPLUG_INT_TITLE": "System plugin integration",
        "MADCONF_SYSPLUG_CHKBOX": "Enable system plugin integration",
        "MADCONF_SYSPLUG_CONNECTTEST": "Check connectivity",
        "MADCONF_SYSPLUG_GUIDE": "Show setup guide",
        "MADCONF_CONNECTTEST_INITIAL": "Click the above button to begin the connectivity check",
        "MADCONF_OPEN_INETCPL": "Internet Options",

        "MADCONF_SOUND_TITLE": "Sounds",
        "MADCONF_START_SOUND": "Play startup sound",
        "MADCONF_ALERT_SOUND": "Play alert sound",
        "MADCONF_SOUND_SCHEME": "Sound scheme",

        "MADCONF_WIN_MGMT_TITLE": "Window management",
        "MADCONF_NODEACTIVATE": "Do not deactivate windows",
        "MADCONF_MARGIN_TITLE": "Wallpaper margin (icon area)",
        "MADCONF_MARGIN_LEFT": "Left",
        "MADCONF_MARGIN_RIGHT": "Right",
        "MADCONF_MARGIN_TOP": "Top",
        "MADCONF_MARGIN_BOTTOM": "Bottom",

        "MADCONF_CONFIG_TITLE": "Config",
        "MADCONF_CONFIG_EXPORT": "Export",
        "MADCONF_CONFIG_IMPORT": "Import",
        "MADCONF_CONFIG_RESET": "Reset config",

        "MADCONF_LANG_TITLE": "Language",

        // #region Miscellaneous tab - JS strings
        "MADCONF_CONNECTTEST_CHECKING": "Checking system plugin connectivity...",
        "MADCONF_CONNECTTEST_SUCCESS": "System plugin connection successful!",
        "MADCONF_CONNECTTEST_FAIL": "System plugin is not running. Please install the system plugin.",
        "MADCONF_CONNECTTEST_OUTDATED": "System plugin is outdated! Please update the system plugin.",
        "MADCONF_SYSPLUG_UNSUPPORTED": "System plugin requires Windows 10 or higher.",

        "MADCONF_CONF_COPIED": "Configuration copied to clipboard! Paste it to a text file and save it to import it later.",
        "MADCONF_NEWER_CONF_MSG": "This configuration file is for a newer version of %n. Please update %n to import this configuration.",
        "MADCONF_CONF_INVALID": "Invalid configuration file!",
        "MADCONF_CONF_IMPORT_CONFIRM": "Importing this configuration will overwrite your current configuration. Are you sure you want to continue?",
        // #endregion
        // #endregion

        // #region About tab
        "MADCONF_AUTHOR_NOTIFY": "Made by %a",
        "MADCONF_LIC_NOTIFY": "Licensed under the MIT License",
        "MADCONF_CREDITS_TITLE": "Credits",
        "MADCONF_CREDITS_START": "%n uses the following projects:",

        "MADCONF_SHOW_WELCOME": "Show welcome",
        "MADCONF_SHOW_README": "Show readme",
        "MADCONF_SHOW_CHANGELOG": "Changelog",
        // #endregion
        // #endregion


        // #region Visualizer strings
        "VISUALIZER_TITLE": "Visualization",
        "VISUALIZER_MENU_VIS": "Vi&sualizer",
        "VISUALIZER_MENU_OPT": "&Options",

        "VISUALIZER_PAUSED_ALERT": "Update has been paused. Click here to resume.",
        "VISUALIZER_EXTRA_ALERT": "Having problems? Please try the following:<ul><li>1. Make sure 'Audio recording' is enabled in the Wallpaper Engine properties panel.</li><li>2. Try <a href=\"javascript:top.location.reload()\">reloading the wallpaper</a>.</li><li>3. Try restarting Wallpaper Engine.</li></ul>",

        "VISUALIZER_INFO_TITLE": "Title",
        "VISUALIZER_INFO_SUBTITLE": "Subtitle",
        "VISUALIZER_INFO_ARTIST": "Artist",
        "VISUALIZER_INFO_ALBUM": "Album",
        "VISUALIZER_INFO_ALBUM_ARTIST": "Album Artist",
        "VISUALIZER_INFO_GENRE": "Genre",

        "VISUALIZER_STATUS_PLAYING": "Playing",
        "VISUALIZER_STATUS_PAUSED": "Paused",
        "VISUALIZER_STATUS_STOPPED": "Stopped",

        "VISUALIZER_VIS_MENUITEM_ALBUM_ART": "&Album Art",
        "VISUALIZER_VIS_MENUITEM_WMP_BARS": "WMP &Bars",

        "VISUALIZER_VIEW_MENUITEM_AUTOHIDE_MENU_BAR": "&Autohide Menu Bar",
        "VISUALIZER_VIEW_MENUITEM_INFORMATION": "&Information",
        "VISUALIZER_VIEW_MENUITEM_PLAYBACK_STATUS": "&Playback Status",
        "VISUALIZER_VIEW_MENUITEM_ENABLE_MEDIA_CONTROLS": "&Enable Media Controls",

        "VISUALIZER_OPT_MENUITEM_VISCONF": "&Configure Visualization",

        "VISUALIZER_HELP_MENUITEM_ABOUT": "&About Visualizer",

        "VISUALIZER_UNSUPPORTED_MSG": "Sorry, but the visualizer is only available for Wallpaper Engine and Lively Wallpaper.",
        "VISUALIZER_MULTI_INSTANCE_MSG": "Only one instance of the visualizer can be open at a time.",
        "VISUALIZER_NO_AUDIO_MSG": "Audio recording is not enabled. Please enable it in the Wallpaper Engine properties panel.",
        "VISUALIZER_NO_MEDINT_MSG": "Media integration support is disabled. Please enable it in Wallpaper Engine settings -> General -> Media integration support.",
        "VISUALIZER_MEDINT_UNSUPPORTED_MSG": "This feature requires Windows 10 or higher.",
        "VISUALIZER_MEDIA_CONTROL_ERROR": "An error occurred while processing the media control request.",
        // #endregion


        // #region Calculator strings
        "CALC_TITLE": "Calculator",
        "CALC_VIEW_MENUITEM_STANDARD": "S&tandard",
        "CALC_VIEW_MENUITEM_SCIENTIFIC": "&Scientific",
        "CALC_HELP_MENUITEM_ABOUT": "&About Calculator",
        "CALC_ERROR_NEGATIVE_SQRT": "Invalid input for function.",
        "CALC_ERROR_POSITIVE_INFINITY": "Error: Positive Infinity.",
        "CALC_ERROR_NEGATIVE_INFINITY": "Error: Negative Infinity.",
        "CALC_ERROR_NAN": "Result of function is undefined.",
        // #endregion


        // #region ChannelViewer strings
        "CV_MENU_GO": "&Go",
        "CV_MENU_FAVORITES": "&Favorites",

        "CV_TOOLBAR_BACK": "Back",
        "CV_TOOLBAR_FORWARD": "Forward",
        "CV_TOOLBAR_STOP": "Stop",
        "CV_TOOLBAR_REFRESH": "Refresh",
        "CV_TOOLBAR_HOME": "Home",
        "CV_TOOLBAR_FAVORITES": "Favorites",
        "CV_TOOLBAR_CHANNELS": "Channels",
        "CV_TOOLBAR_FULLSCREEN": "Fullscreen",
        "CV_TOOLBAR_PRINT": "Print",
        "CV_TOOLBAR_OPEN": "Open",
        "CV_TOOLBAR_ADDRESS": "Address",
        "CV_TOOLBAR_GO": "Go",

        "CV_SIDEBAR_FAVORITES": "Favorites",
        "CV_SIDEBAR_CHANNELS": "Channels",

        "CV_STATUS_DONE": "Done",
        "CV_STATUS_OPENING": "Opening page %s",
        "CV_ZONE_INTERNET": "Internet zone",
        "CV_ZONE_LOCAL": "My Computer",

        // #region ChannelViewer menu items
        "CV_FILE_MENUITEM_NEW_WINDOW": "&New Window",

        "CV_VIEW_MENUITEM_TOOLBARS": "&Toolbars",
        "CV_VIEW_MENUITEM_STATUS_BAR": "&Status Bar",
        "CV_VIEW_MENUITEM_EXPLORER_BAR": "&Explorer Bar",
        "CV_VIEW_MENUITEM_STOP": "Sto&p",
        "CV_VIEW_MENUITEM_REFRESH": "&Refresh",
        "CV_VIEW_MENUITEM_SOURCE": "Sour&ce",
        "CV_VIEW_MENUITEM_RUNJS": "Run &JavaScript Code",
        "CV_VIEW_MENUITEM_INETCPL": "Internet &Options",

        "CV_GO_MENUITEM_HOME_PAGE": "&Home Page",
        "CV_GO_MENUITEM_SEARCH": "&Search the Web",

        "CV_FAVORITES_MENUITEM_ADDITEM": "&Add to Favorites...",
        "CV_FAVORITES_MENUITEM_EDITITEM": "&Organize Favorites...",

        "CV_HELP_MENUITEM_ABOUT": "&About ChannelViewer",

        "CV_TOOLBARS_MENUITEM_STANDARD": "&Standard Buttons",
        "CV_TOOLBARS_MENUITEM_ADDRESS": "&Address Bar",
        "CV_TOOLBARS_MENUITEM_RIGHT_LABELS": "Labels on the &right",
        "CV_TOOLBARS_MENUITEM_BOTTOM_LABELS": "Labels on the &bottom",
        "CV_TOOLBARS_MENUITEM_NO_LABELS": "&No Labels",
        "CV_TOOLBARS_MENUITEM_LOCK_TOOLBARS": "&Lock the Toolbars",
        "CV_TOOLBARS_MENUITEM_GO_BUTTON": "&Go Button",

        "CV_EXPLORER_BARS_MENUITEM_FAVORITES": "&Favorites",
        "CV_EXPLORER_BARS_MENUITEM_CHANNELS": "&Channels",
        "CV_EXPLORER_BARS_MENUITEM_NONE": "&None",
        // #endregion
        // #endregion


        // #region Clock strings
        "CLOCK_TITLE": "Clock",
        "CLOCK_MENU_SETTINGS": "&Settings",
        "CLOCK_MENUITEM_ANALOG": "&Analog",
        "CLOCK_MENUITEM_DIGITAL": "&Digital",
        "CLOCK_MENUITEM_SET_COLORS": "Set &Colors",
        "CLOCK_MENUITEM_SET_FONT": "Set &Font",
        "CLOCK_MENUITEM_GMT": "&GMT",
        "CLOCK_MENUITEM_NO_TITLE": "&No Title",
        "CLOCK_MENUITEM_SECONDS": "&Seconds",
        "CLOCK_MENUITEM_DATE": "Da&te",
        "CLOCK_MENUITEM_ABOUT": "A&bout Clock",
        // #endregion


        // #region Solitaire strings
        "SOL_TITLE": "Solitaire",
        "SOL_MENU_GAME": "&Game",
        "SOL_GAME_MENUITEM_DEAL": "&Deal",
        "SOL_GAME_MENUITEM_DECK": "De&ck...",
        "SOL_HELP_MENUITEM_ABOUT": "&About Solitaire",
        "SOL_CARD_BACK_TITLE": "Select Card Back",
        // #endregion


        // #region Welcome strings
        "WELCOME_TITLE": "Welcome to %n",
        "WELCOME_WHATS_NEW": "What's New",
        "WELCOME_CUSTOMIZE_DESKTOP": "Customize Desktop",
        "WELCOME_SETUP_SYSPLUG": "Setup System Plugin",
        "WELCOME_GET_SUPPORT": "Get Support",
        "WELCOME_MAIN_TITLE": "Welcome",
        "WELCOME_AUTOSTART_CHKBOX": "Show this screen each time %n starts.",
        // #endregion
    }
    window.madStrings = parent.madStrings || fallbackStrings;

    const supportedLanguages = ["en", "ko"];

    let lang = parent.madLang || localStorage.madesktopLang || navigator.language || navigator.userLanguage;
    lang = lang.split("-")[0];
    window.madLang = lang;

    let localizableElements = [];
    const titleElem = document.querySelector("title");
    const titleLocId = titleElem.dataset.locid;

    if (!supportedLanguages.includes(lang)) {
        lang = "en";
    }

    if (parent === window) {
        // Only for the main MAD page
        window.changeLanguage = (newLang) => {
            if (supportedLanguages.includes(newLang)) {
                lang = newLang;
                window.madLang = lang;
                if (lang !== "en") {
                    fetch(`lang/${lang}.json`)
                        .then(response => response.json())
                        .then(json => {
                            window.madStrings = Object.assign({}, fallbackStrings, json);
                            readyAll();
                            announce("language-ready");
                        })
                        .catch(err => {
                            console.error(`Failed to load language file for ${lang}. Using English strings instead.`);
                            readyAll();
                            announce("language-ready");
                        });
                } else {
                    window.madStrings = fallbackStrings;
                    readyAll();
                    announce("language-ready");
                }
            } else {
                throw new Error(`Language ${newLang} is not supported`);
            }
        }
        if (lang !== "en") {
            changeLanguage(lang);
        }
    } else {
        updateTitle();
        document.documentElement.lang = lang;
        window.addEventListener("message", (event) => {
            if (event.data.type === "language-ready") {
                window.madStrings = parent.madStrings;
                readyAll();
            }
        });
    }

    function processString(str, extraString) {
        // &Apply -> <u>A</u>pply
        // \&Apply -> &Apply
        str = str.replace(/&([^&])/g, "<u>$1</u>").replace(/\\&/g, "&");
        // %n -> appName
        // %a -> author
        // %c -> channelViewer
        str = str.replace(/%n/g, appName).replace(/%a/g, author).replace(/%c/g, channelViewer);
        // %s -> extraString
        if (extraString) {
            str = str.replace(/%s/g, extraString);
        }
        return str;
    }

    function readyAll() {
        for (const element of localizableElements) {
            element.ready();
        }
        updateTitle();
        document.documentElement.lang = lang;
    }

    function updateTitle() {
        if (titleLocId) {
            const locTitle = getString(titleLocId);
            if (titleElem.dataset.noUpdateOnLocChange) {
                if (document.title === fallbackStrings[titleLocId]) {
                    document.title = locTitle;
                }
            } else {
                document.title = locTitle;
            }
        }
    }

    function getString(locId, extraString) {
        if (window.madStrings[locId]) {
            return processString(window.madStrings[locId], extraString);
        } else if (fallbackStrings[locId]) {
            return processString(fallbackStrings[locId], extraString);
        } else {
            return null;
        }
    }
    window.madGetString = getString;

    class MadString extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            this.locId = this.dataset.locid;
            localizableElements.push(this);
            this.ready();
        }

        ready() {
            if (window.madStrings[this.locId]) {
                this.innerHTML = processString(window.madStrings[this.locId]);
            } else if (fallbackStrings[this.locId]) {
                this.innerHTML = processString(fallbackStrings[this.locId]);
            } else {
                throw new Error(`No string found for locId ${this.locId}`);
            }
        }
    }
    customElements.define("mad-string", MadString);
})();