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
* More themes to add
    * Windows 3.x
        * I think it would be pretty easy, just give it flat title bars and buttons with border-radius
    * Windows Vista/7 Basic
    * Windows 8
        * Maybe just modifying the Aero theme a bit would work
    * Aero Lite
    * Windows 10/11?
    * Mac OS 7?
    * Also if I implement the Win3 theme, I should make a separate visual style selector in the appearance control panel, like the one in XP
* Split the main scripts into multiple JS files
    * Current main JS structure (DeskMover + DeskSettings) hasn't really changed since 1.0 lol
* Support multi-display background wallpaper configuration?

## Notes
* ModernActiveDesktop is primarily optimized for Chromium 98 and higher. Some features may not work or look well on other browsers.
    * The display scaling feature is currently buggy on Firefox (which is only supported on FF 126 and newer)

## Changelog

## 3.3
* Added support for desktop patterns
    * Available in the background settings page
<br><img src="images/patterns.png" title="Patterns screenshot">
* Reduced the volume of the welcome music
* Fixed various bugs and improved the codebase
    * Clock's second hand being invisible when it's 0, 15, 30, or 45 seconds
    * Multiple instances of Visualizers being allowed under some conditions
    * Background image set in the Wallpaper Engine properties panel not being applied immediately
* Updated Electron

Changes for Wallpaper Engine:
* Fixed the broken keyboard input in Wallpaper Engine 2.5 and newer
    * Tries to use the system plugin for directly receiving keyboard inputs (even in lower WPE versions)
    * If the system plugin is unavailable, an on-screen keyboard will be shown as an alternative
    * An input box in the Wallpaper Engine properties panel can also be used for typing and pasting things without the system plugin. Note that this doesn't support backspaces, ctrl key shortcuts, and arrow keys
* Added a token verification to the system plugin to stop random wallpapers from accessing your system without your consent

Changes for browsers:
* Moved the official page to its own subdomain
* Dialog icons are now preloaded to prevent the slow icon change
* Added support for display scaling on Firefox 126 and newer
* Fixed the display scaling feature broken on recent Chromium update

(2024/9/1)

### Previous changelog
Please see [here](?src=Updated.md&showbackbtn=1) for the previous changes

Copyright (c) 2024 Ingan121  
<a href="https://github.com/Ingan121/ModernActiveDesktop" target="_blank">https://github.com/Ingan121/ModernActiveDesktop</a>  
[Licensed under the MIT license](?src=../license.txt&showbackbtn=1)