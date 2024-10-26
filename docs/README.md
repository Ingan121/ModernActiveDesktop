# Welcome to ModernActiveDesktop!
* ModernActiveDesktop, also known as Windows 98 Desktop Experience, is a highly customizable re-creation of the classic Windows desktop.
* Started as a crappy Active Desktop clone, ModernActiveDesktop now features various useful apps that resemble the classic Windows components that will improve your desktop experience.
* Primarily designed for Wallpaper Engine, but now it should work well on other modern browsers as well. Lively Wallpaper is also supported.
<br><br>
![Screenshot](images/screenshotnew.png)

## Included Apps
|Icon|Name|Description|
|---|---|---|
|![Channel Bar Icon](../images/mad16.png)|Channel Bar|The Channel Bar from Windows 98 First Edition or IE4|
|<img src="../apps/jspaint/favicon.ico" width="16" alt="JSPaint Icon">|JSPaint|A web-based remake of MS Paint|
|![Solitaire Icon](../apps/solitaire/icon.png)|Solitaire|A web-based remake of MS Solitaire|
|<img src="../apps/clock/icon.png" width="16" alt="Clock Icon">|Clock|A web-based remake of NT4 clock.exe|
|![Visualizer Icon](../apps/visualizer/icon.png)|Visualizer|A music visualizer for Wallpaper Engine<br>WMP6 style controls with WMP7+ bar visualization<br>Lively Wallpaper is partially supported|
|![ChannelViewer Icon](../apps/channelviewer/images/icon.png)|ChannelViewer|An IE4 remake with some elements of IE6<br>Supports loading webpages with a classic look and features|
|![Calculator Icon](../apps/calc/icon.png)|Calculator|A web-based remake of Windows calculator|
||Configurator|Remake of the 'Display Properties' and 'Internet Options' control panel applets<br>Some of them are pretty pixel-perfect to the original|

## Included Themes
* XP
    * A CSS theme based on XP.css
    * Fallback schemes: Blue, Olive Green, Silver, and Royale
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
* Windows 1-3 schemes
* Windows 11 high contrast schemes
* Three schemes found in the JSPaint source files
* All Classic schemes feature unique window metrics and font settings
* Can fetch system color schemes if the system plugin is being used
* Also supports loading Windows *.theme files and an exported file of the "HKCU\Control Panel\Colors" registry key

## Todo
* ChannelViewer
    * Hook fetch / XHR with fetchProxy to get AJAX sites working when force-loaded
    * Also deal with the origin header - Google, YT, etc. checks for it and returns 403. This also affects Wallpaper Engine or other environments with the same origin policy disabled.
* WindowMetrics (`extra-border-size`) support for Active Desktop style DeskMovers
* Refactor the dialog system
    * Support being modal only to the parent window
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

## Notes
* ModernActiveDesktop is primarily optimized for Chromium 124 and higher. Some features may not work or look well on other browsers.
    * The display scaling feature is currently buggy on Firefox (which is only supported on FF 126 and newer)

## Contributing
* Please read [Translating.md](?src=Translating.md&showbackbtn=1) for information on translating ModernActiveDesktop.

## Changelog

## 3.4
* **Wallpaper Engine 2.4 and below, and Chromium 123 and below are no longer officially supported since this release**
    * While it may still work, not all features are guaranteed to work properly in these environments
    * Please update Wallpaper Engine to the latest version to get the best experience
    * Windows 7/8 users: why not update to Windows 10 LTSC and apply a Windows Classic / Aero / XP theme? Visit [WinClassic](https://winclassic.boards.net/) to learn more!
* Added new themes: Windows Basic and Windows Classic (16 colors)
* Added a preset system for Wallpaper Engine
    * Click the 'Preset edit mode' in the Wallpaper Engine properties panel to learn more
* Improved the configuration saving mechanism
    * Configurations that can be large are now saved in bigger storage (IndexedDB)
    * Can apply a large background image without a problem
    * Exported configuration data is now compressed if it's large
    * No longer loses information about the Wallpaper Engine properties panel when resetting configurations
    * Handles cases when the storage is full
* Visualizer improvements
    * Several options are now accessible in the menu bar
    * Added an option to change the size of the album art
    * Added an option to change how the window title is displayed
    * Support displaying the visualization as a background
    * Added an option to ignore the wallpaper margins in the fullscreen or background mode
    * Fixed the difference scale being affected by the window height
* Localization improvements
    * Now supports the language code with a region code (e.g., `en-US`)
    * Added a guide document for translating ModernActiveDesktop
* Miscellaneous improvements
    * Clock configurations are now per-window
    * Dropdown lists will be displayed reversed if it's too close to the bottom of the screen
    * Default window placement no longer assumes 1920x1080 or similar resolution; they will be placed relative to the screen size
    * Also new windows will be prevented from being placed off-screen. After these changes, ModernActiveDesktop should now run decently on any resolution higher than 640x480
* Security improvements
    * Prevent displaying arbitrary HTML (XSS) through imported configuration files
    * Show a warning about loading an unverified page after importing a configuration file
* Fixed several bugs
    * The 'Add custom colors' button in the color picker showing in a weird position with the Aero theme
    * Custom pattern saving not working properly
    * On-screen keyboard window having weird frame height in XP and Aero themes
    * Background image set in the Wallpaper Engine properties panel being applied on every startup
    * Some windows behaving weirdly after being reset
* Refactored the codebase
    * Minimize the usage of global variables, and export only necessary functions
    * Split the main script into multiple files for better maintainability
    * Renamed some scripts to a shorter name
* Updated Electron

(2024/11/1)

### Previous changelog
Please see [here](?src=Updated.md&showbackbtn=1) for the previous changes

Copyright (c) 2024 Ingan121  
<a href="https://github.com/Ingan121/ModernActiveDesktop" target="_blank">https://github.com/Ingan121/ModernActiveDesktop</a>  
[Licensed under the MIT license](?src=../license.txt&showbackbtn=1)