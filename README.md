# ModernActiveDesktop
<a href="https://steamcommunity.com/sharedfiles/filedetails/?id=2278898637"><img src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-steam-workshop.jross.me%2F2278898637%2Fsubscriptions-text" alt="Steam Workshop subscribers count"></a>

* ModernActiveDesktop, also known as Windows 98 Desktop Experience, is a highly customizable re-creation of the classic Windows experience.
* Started as a crappy Active Desktop clone, ModernActiveDesktop now features various useful apps that resembles the classic Windows components that will improve your desktop experience.
* Primarily designed for Wallpaper Engine, but now it will work well on other modern browsers as well. Lively Wallpaper is also supported.
<br><br>
[Old Screenshot (circa 2.3)](docs/images/screenshot.png)
<br><br>
* [Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=2278898637)
* [Try in your browser](https://www.ingan121.com/mad/)

## Included Apps
|Icon|Name|Description|Links|
|---|---|---|---|
|![Channel Bar Icon](images/mad16.png)|Channel Bar|The Channel Bar from Windows 98 First Edition or Internet Explorer 4|[Link](https://github.com/Ingan121/ModernActiveDesktop/blob/master/ChannelBar.html)|
|<img src="apps/jspaint/favicon.ico" width="16" alt="JSPaint Icon">|JSPaint|A web-based remake of MS Paint|[Original Repo](https://github.com/1j01/jspaint), [MAD Version](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/jspaint)|
|![Solitaire Icon](apps/solitaire/icon.png)|Solitaire|A web-based remake of MS Solitaire|[Original Repo](https://github.com/rjanjic/js-solitaire), [MAD Version](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/solitaire)|
|<img src="apps/clock/icon.png" width="16" alt="Clock Icon">|Clock|NT4 clock.exe remake|[Link](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/clock)|
|![Visualizer Icon](apps/visualizer/icon.png)|Visualizer|Music visualizer for Wallpaper Engine; WMP6 skin with WMP7+ bar visualization; Lively Wallpaper is partially supported|[Link](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/visualizer)|
|![ChannelViewer Icon](apps/channelviewer/images/icon.png)|ChannelViewer|A IE4 remake with some elements of IE6; supports loading many webpages with classic look and features|[Link](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/channelviewer)|
|![Calculator Icon](apps/calc/icon.png)|Calculator|A web-based remake of Windows 98 calculator|[Link](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/calc)|
||Configurator|Remake of the 'Display Properties' and 'Internet Options' control panel applets; some of them are pretty pixel-perfect to the original|[Main](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/madconf), [Internet](https://github.com/Ingan121/ModernActiveDesktop/tree/master/apps/inetcpl)|

## Included Themes
* XP
    * CSS theme based on XP.css
    * Fallback schemes: Blue, Olive Green, Silver, and Royale
* Aero
    * CSS theme based on 7.css
    * Fallback scheme
* Windose
    * Simple CSS theme based on the looks of Needy Girl Overdose
    * Only title bars are themed; other controls use the generic Classic styling
* Catppuccin Mocha
* Windows 9x schemes
* Plus! 95 and 98 schemes
* Windows 1-3 schemes
* Windows 11 high contrast schemes
* All Classic schemes support window metrics and font metrics

## Todo
* Localization
    * Would be pretty hard as many strings are currently hardcoded in HTML files
    * Maybe just release various localized versions with embedded localized strings, like the pre-MUI Windows? Just kidding :P
* Proper context menu theming
    * It currently uses hardcoded width and height values due to the slide animation effect
    * Windows uses MenuFont for context menus as well, but MAD currently doesn't respect this as it looks awful with big fonts because of the hardcoded sizes
    * Maybe I should use JavaScript for determining the menu size. Width calculation has already been done in the ChannelViewer history and favorites menus
    * Plus the Aero menu styles for the Aero theme
* More themes to add
    * Windows 3.x
        * I think it would be pretty easy, just with flat title bars and buttons with border-radius
    * Windows 8
        * Maybe just modify the Aero theme a bit
    * Windows 10 / 11?
    * Mac OS 7?
    * Also if I implement the Win3 theme, i should make a separate visual style selector in the appearance control panel, like the XP one

## Notes
* ModernActiveDesktop is primarily optimized for Chromium 98 and higher. Some features may not work or look well on other browsers.

## Changelog

### 3.1
* Added a music visualizer
    * Currently supports WMP Bar-like visualizer and a simple album art visualizer
    * Supports customizable colors and media information integration
    * Also supports media controls if the system plugin integration is enabled
* Added a customizable flat menu option, which was previously exclusive to the XP theme
* Background colors can now be changed independently when using system colors
* Added thick frames to resizable windows for a more authentic look
* Added an option to make windows non-resizable
* Added various sound schemes (3.1, 95, NT4, 2000/Me, XP, Vista, 7, 8, 10, 11)
* Improved the XP theme
    * Dialogs will use XP icons when using the XP theme
    * Title bars will always use appropriate fonts, regardless of the no-pixel fonts option
* Changed the default style and size of new windows
* Several visual improvements
* Prevent Windows 7 / 8 from installing the system plugin, as it requires Windows 10 or higher
* Added an additional safeguard to prevent arbitrary web pages from accessing the system plugin APIs
* System plugin is now distributed zipped
* Several bugfixes and optimizations
    * Fixed dark color schemes having invisible checkmarks on checkboxes
    * Fixed dark theme detection not working properly with custom colors
    * Fixed 'Always on top' windows going on top of important UI elements and its own dialogs
    * Fixed the default color scheme having some inaccurate colors
    * Fixed the circle mark in context menus being rendered as broken texts in some cases
* Updated dependencies

### Previous changelog
See [here](docs/Updated.md) for previous changelogs

Copyright (c) 2024 Ingan121  
[Licensed under the MIT license](license.txt)
