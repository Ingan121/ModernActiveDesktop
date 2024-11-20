# ModernActiveDesktop
<a href="https://steamcommunity.com/sharedfiles/filedetails/?id=2278898637"><img src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-steam-workshop.jross.me%2F2278898637%2Fsubscriptions-text" alt="Steam Workshop subscribers count"></a>

* ModernActiveDesktop, also known as Windows 98 Desktop Experience, is a highly customizable re-creation of the classic Windows desktop.
* Started as a crappy Active Desktop clone, ModernActiveDesktop now features various useful apps that resemble the classic Windows components that will improve your desktop experience.
* Primarily designed for Wallpaper Engine, but now it should work well on other modern browsers as well. Lively Wallpaper is also supported.
<br><br>
![Screenshot](docs/images/screenshotnew.png)
[Video Screenshot](buildstuff/screenshotview.md)  
[Old Screenshot (circa 2.3)](docs/images/screenshot.png)
<br><br>
* [Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=2278898637)
* [Try in your browser](https://madesktop.ingan121.com/)

## Included Apps
|Icon|Name|Description|Links|
|---|---|---|---|
|![Channel Bar Icon](images/mad16.png)|Channel Bar|The Channel Bar from Windows 98 First Edition or IE4|[Link](https://github.com/Ingan121/ModernActiveDesktop/blob/master/ChannelBar.html)|
|<img src="apps/jspaint/favicon.ico" width="16" alt="JSPaint Icon">|JSPaint|A web-based remake of MS Paint|[Original](https://github.com/1j01/jspaint)<br>[MAD Version](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/jspaint)|
|![Solitaire Icon](apps/solitaire/icon.png)|Solitaire|A web-based remake of MS Solitaire|[Original](https://github.com/rjanjic/js-solitaire)<br>[MAD Version](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/solitaire)|
|<img src="apps/clock/icon.png" width="16" alt="Clock Icon">|Clock|A web-based remake of NT4 clock.exe|[Link](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/clock)|
|![Visualizer Icon](apps/visualizer/icon.png)|Visualizer|A music visualizer for Wallpaper Engine<br>WMP6 style controls with WMP7+ bar visualization<br>Lively Wallpaper is partially supported|[Link](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/visualizer)|
|![Visualizer Lyrics Icon](apps/visualizer/lyrics/icon.png)|Visualizer Lyrics|A lyrics viewer for the Visualizer app, using lyrics from LRCLIB|[Link](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/visualizer/lyrics)|
|![ChannelViewer Icon](apps/channelviewer/images/icon.png)|ChannelViewer|An IE4 remake with some elements of IE6<br>Supports loading webpages with a classic look and features|[Link](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/channelviewer)|
|![Calculator Icon](apps/calc/icon.png)|Calculator|A web-based remake of Windows calculator|[Link](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/calc)|
||Configurator|Remake of the 'Display Properties' and 'Internet Options' control panel applets<br>Some of them are pretty pixel-perfect to the original|[Main](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/madconf), [Internet](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/inetcpl)|

## Included Themes
* XP
    * A CSS theme based on XP.css
    * Fallback schemes: Blue, Olive Green, Silver, Royale, Royale Noir, Zune, Embedded, and Watercolor
* Aero
    * A CSS theme based on 7.css
* Aero Basic
    * A CSS theme based on 7.css with Aero Basic title bars
* Windows 9x / 2000 Classic schemes
* Plus! 95 and 98 schemes
* Windose
    * Simple CSS theme based on the looks of Needy Girl Overdose
    * Only the title bars are themed; other controls will use the generic Classic styles
* Catppuccin Mocha
* Windows 93 and 96 schemes
* Arc-Dark
* Blur
    * My own experimental customization of the Windows Classic theme with a blur effect
* Windows 1-3 schemes
* Windows 11 high contrast schemes
* Three schemes found in the JSPaint source files
* All Classic schemes feature unique window metrics and font settings
* Can fetch system color schemes if the system plugin is being used
* Also supports loading Windows *.theme files and an exported file of the "HKCU\Control Panel\Colors" registry key

## Todo
* ChannelViewer
    * Hook fetch/XHR with fetchProxy to get AJAX sites working when force-loaded
    * Also deal with the origin header - Google, YT, etc. checks for it and returns 403. This also affects Wallpaper Engine or other environments with the same origin policy disabled.
    * Isolate/sandbox the iframe to prevent the site from breaking the desktop - it seems using a non-same origin iframe prevents the loaded site from crashing the whole MAD as they run in separate threads
* WindowMetrics (`extra-border-size`) support for Active Desktop style DeskMovers
* Refactor the dialog system
    * Support being modal only to the parent window
* Add customizable icon pack system
    * Preload some icon packs such as 95, Plus!, 98, 2000, XP, Aero, 7, 10, and 11
    * Allow users to add their own (and save in IndexedDB)
    * Maybe resembling the Effects tab in the Display Properties control panel (and move the current Effects window to the bottom of the tab)
* Add customizable sound system
    * Also add more default sounds: Plus!, Win7 theme sounds, etc.
    * Resemble the Sounds control panel
* Show menus outside the iframe
* Add a storage manager for IndexedDB and LocalStorage
    * Categorize the data by type (configs, schemes, images, cache, etc.)
    * Show used storage space and estimated remaining space
    * Move export/import functions here
* More themes to add
    * Windows 3.x
        * I think it would be pretty easy, just give it flat title bars and buttons with border-radius
    * More XP Visual Styles
    * Windows 8
        * Maybe just modifying the Aero theme a bit would work
    * Aero Lite
    * Windows 10/11?
    * Mac OS 7?
    * Also if I implement the Win3 theme, I should make a separate visual style selector in the appearance control panel, like the one in XP
* Support multi-display background wallpaper configuration?
* Split some large scripts of MAD apps into separate files for better maintainability
    * Especially the Visualizer, ChannelViewer, and Appearance MADConf
* Convert some of the scripts to ES6 modules

## Setup
* Running locally
    * Run Chrome or Edge with `--allow-file-access-from-files`, then run index.html with it
    * You can also run a local web server
* Running on a server
    * Install any web server like Apache or Nginx, then unzip or git clone MAD under the webroot
    * It doesn't have to be in the root; MAD is designed to run well in any directories
* Development setup
    * I'm just using the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) VSCode extension for the development
    * Wallpaper Engine is also used for testing. For debugging, follow [this guide](https://docs.wallpaperengine.io/en/web/debug/debug.html) but instead of going to `localhost:[port]` directly, go to `chrome://inspect`, add `localhost:[port]` in the target discovery settings, wait a bit, and click inspect in the remote target list. It works better for me

## Notes
* ModernActiveDesktop is primarily optimized for Chromium 124 and higher. Some features may not work or look well on other browsers.
    * The display scaling feature is currently buggy on Firefox (which is only supported on FF 126 and newer)

## Hidden Features
* In the About tab of the properties window, click the ModernActiveDesktop logo and click Apply to enable the debug mode.
* In the scheme save dialog, type `!copycss`, `!copyjson`, `!copyreg`, or `!copytheme` to export the scheme as a CSS file, JSON file, a registry file for HKCU\Control Panel\Colors, or a Windows *.theme file, respectively.
* In a color picker window, click the big color preview box to enter a CSS color value. Also, prepend `!` to the color value to bypass additional processing and just apply it directly. This will allow transparent colors and other CSS color values that are not supported by the color picker. Examples: `#ff0000`, `rgb(128, 128, 128)`, `teal`, `!transparent`

## Contributing
* Please read [Translating.md](docs/Translating.md) for information on translating ModernActiveDesktop.

## Security
* ModernActiveDesktop did take some security measures to prevent unwanted access to the running environment. However, it's not perfect, and there may be some vulnerabilities that I'm not aware of. If you find any security issues, please report them to * ModernActiveDesktop did take some security measures to prevent unwanted access to the running environment. However, it's not perfect, and there may be some vulnerabilities that I'm not aware of. If you find any security issues, please report them to the [GitHub Issues page](https://github.com/Ingan121/ModernActiveDesktop/issues), or the email address in my GitHub profile or [www.ingan121.com](https://www.ingan121.com/).
* The following are examples of a security issue:
    * Bypassing the security checks when importing configuration files and loading unwanted pages and scripts on behalf of the user
    * Unwanted access to the system plugin, bypassing the security measures (token verification, CORS/origin checks, etc.)
    * Arbitrary code execution in the system plugin through network requests
* The following are not considered security issues (yet):
    * Pages loaded (by user) in DeskMovers (WPE) and ChannelViewer having access to the top window - the former is because Wallpaper Engine disables the same-origin policy, and for the latter, sandboxing the ChannelViewer iframe is not implemented yet (see the todo list)
    * The system plugin being accessed by external software that is not a web page in a normal browser environment with web security
* ModernActiveDesktop is not responsible for any security issues caused by unverified pages not part of the official distribution. Please be cautious when importing configuration files/presets and loading external pages.

## License
* ModernActiveDesktop is licensed under the MIT license. Please read the [license file](?src=../license.txt&showbackbtn=1) for more information.

`Copyright (c) 2024 Ingan121. Licensed under the MIT license.`
* Some Microsoft assets are used in ModernActiveDesktop. MIT license does not apply to these assets.

### Credits
* [98.css](https://jdan.github.io/98.css/) - A CSS library for building Windows 98-like interfaces
* [XP.css](https://botoxparty.github.io/XP.css/) - Used for the Windows XP style
* [7.css](https://khang-nd.github.io/7.css/) - Used for the Windows Aero and Basic style
* [JS Paint](https://jspaint.app/about) - A web-based remake of MS Paint
* [js-solitaire](https://github.com/rjanjic/js-solitaire) - A web-based remake of MS Solitaire
* [X-Frame-Bypass](https://github.com/niutech/x-frame-bypass) - Allows ChannelViewer to load more webpages
* [marked](https://marked.js.org/) - A JavaScript library for parsing markdown docs
* [Electron](https://www.electronjs.org/) - Used for the system plugin
* [minimist](https://github.com/minimistjs/minimist) - A Node.js library for parsing command line arguments
* [WindowsMediaController](https://github.com/DubyaDude/WindowsMediaController) - Used by [MediaControlCLI](https://github.com/Ingan121/MediaControlCLI) for media controls
* And many assets from Microsoft Windows
* And various codes snippets from Stack Overflow
* Some color schemes are from various sources. See comments in the CSS files for more information

## Changelog

## 3.4
* **Wallpaper Engine 2.4 and below, and Chromium 123 and below are no longer officially supported since this release**
    * While it may still work, not all features are guaranteed to work properly in these environments
    * Please update Wallpaper Engine to the latest version to get the best experience
    * Windows 7/8 users: why not update to Windows 10 LTSC and apply a Windows Classic / Aero / XP theme? Visit [WinClassic](https://winclassic.boards.net/) to learn more!
* Added new themes
    * Windows Basic
    * Windows Classic (16 colors)
    * 93
    * 96
    * Arc-Dark
    * Blur (beta)
    * VGUI
    * Various XP fallback schemes: Royale Noir, Zune, Embedded, and Watercolor
* Visualizer improvements
    * Added a lyrics viewer! Click View -> Lyrics to open it
    * Supports secondary visualizers that can be opened multiple times. These don't support visualization but can be used to display other media information. A secondary visualizer will be opened when trying to open the visualizer when it's already running
    * Several options are now accessible in the menu bar
    * Added an option to change the size of the album art
    * Added an option to change how the window title is displayed
    * Added an option to estimate the current position of the song
    * Support displaying the visualization as a background
    * Added an option to ignore the wallpaper margins in the fullscreen or background mode
    * Will use the accent color as a bar color in 'Follow color scheme' mode if the current theme supports accent colors (Aero and Blur)
    * Fixed the difference scale being affected by the window height
* Added a preset system for Wallpaper Engine
    * Click the 'Preset edit mode' in the Wallpaper Engine properties panel to learn more
* Improved the configuration saving mechanism
    * Configurations that can be large are now saved in bigger storage (IndexedDB)
    * Can apply a large background image without a problem
    * Exported configuration data is now compressed if it's large
    * No longer loses information about the Wallpaper Engine properties panel when resetting configurations
    * Handles cases when the storage is full
* Localization improvements
    * Now supports the language code with a region code (e.g., `en-US`)
    * Added a guide document for translating ModernActiveDesktop
* Miscellaneous improvements
    * Clock configurations are now per-window
    * Support importing WinClassicThemeConfig registry files
    * Support exporting schemes as an HKCU\Control Panel\Colors registry file or a Windows *.theme file. Type `!copyreg` or `!copytheme` to the scheme save dialog to do this
    * Dropdown lists will be displayed reversed if it's too close to the bottom of the screen
    * Default window placement no longer assumes 1920x1080 or similar resolution; they will be placed relative to the screen size
    * Also, new windows will no longer be placed off-screen. After these changes, ModernActiveDesktop should now run decently on any resolution higher than 640x480
    * Adjusted some font sizes to look better with the default pixelated font
    * Automatically reset the display scaling factor if the effective screen resolution is smaller than 640x480
    * Added a language selector in the welcome window
* Security improvements
    * Prevent displaying arbitrary HTML (XSS) through imported configuration files
    * Show a warning about loading an unverified page after importing a configuration file
* Fixed several bugs
    * The 'Add custom colors' button in the color picker showing in a weird position with the Aero theme
    * Custom pattern saving not working properly
    * On-screen keyboard window having incorrect frame height in XP and Aero themes
    * Background image set in the Wallpaper Engine properties panel being applied on every startup
    * Some windows behaving weirdly after being reset
    * System colors not being applied to window contents when the system color scheme is changed on startup
    * Textboxes not automatically scrolling when using the arrow keys with the system plugin input or the on-screen keyboard
    * Background right-click menu (browser only) not being clickable when context menu animations are disabled
    * Fallback text input not working properly when the system plugin is enabled, but it's not running
    * Pressing backspace when the cursor is on before the first character with the system plugin input duplicating the whole text
* Refactored the codebase
    * Minimize the usage of global variables and export only necessary functions
    * Split the main script into multiple files for better maintainability
    * Renamed some scripts to a shorter name
* Updated Electron

(2024/11/21)

### Previous changelog
Please see [here](docs/Updated.md) for the previous changes