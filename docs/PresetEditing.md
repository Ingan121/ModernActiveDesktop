# Making presets for ModernActiveDesktop
1. Cuztomize ModernActiveDesktop to your liking. Please use the BG image option in the Wallpaper Engine properties panel to set your wallpaper, instead of the Browse button in the ModernActiveDesktop background properties.
2. Once you finish customizing, click the "Copy preset" button in the Wallpaper Engine properties panel.
3. Paste the preset in a text editor and save it as a .json file.
4. Upload it somewhere on the internet. Text hosting services are good options. You can optionally compress the .json file with gzip to save bandwidth.
5. Copy the direct link to the .json file.
6. Paste the link in the "Preset URL" field in the Wallpaper Engine properties panel.
7. Publish your preset by clicking the "Publish Preset" button in the Wallpaper Engine properties panel.

* Note that the exported preset data does not contain all configuration data, unlike the config file exported from the miscellaneous tab of ModernActiveDesktop properties.
* Notably, the background image data is not included in the preset data. This is why you should set the wallpaper using the Wallpaper Engine properties panel instead of the ModernActiveDesktop background properties. Background images chosen from one of the default wallpapers provided will be included in the preset data.
* Other settings not included in the preset data include:
    * Display scaling factor
    * Wallpaper margins
    * Language
    * System plugin integration option
    * Saved color schemes and patterns
    * ChannelViewer favorites, home page, and some other settings
    * Whether to show the welcome screen
    * Debug settings