# Translating ModernActiveDesktop
Thank you for your interest in translating ModernActiveDesktop! This guide will help you get started with the translation process.

<!--mad-only>
* Start by <a href="https://github.com/Ingan121/ModernActiveDesktop/blob/master/docs/Translating.md" target="_blank">opening this page in a web browser</a>!
* Also open this project in Explorer. <a href="javascript:madOpenWindow('SysplugSetupGuide.md', true)">Open this guide</a> and follow instructions 1-3.
* If you are using ModernActiveDesktop in a browser, clone the repository to your computer instead.
</mad-only-->

## Project Structure

The localization files are located in the `lang/` directory. Each language is represented by a single JSON file named using the language code (e.g., `en-US.json`, `ko-KR.json`).

## Adding a New Language

1. **Create a New JSON File**: Create a new JSON file in the `lang/` folder with the appropriate language code (e.g., `fr-FR.json` for French). The language code should be identical to `navigator.language` in the browser.

2. **Copy the Base Language File**: Copy the contents of the `en-US.json` file into your new language file. This will serve as the base for your translations.

3. **Translate the Strings**: Open your new language file and replace the English strings with the translated strings. Make sure to preserve the JSON structure.

4. **Add the Language to the Application**: Open the `js/MadStrings.js` file and add the new language code to the `supportedLanguages` object.

    ```js
    const supportedLanguages = {
        'en-US': 'English',
        'ko-KR': '한국어',
        'fr-FR': 'Français',
    };
    ```
5. **Test the Translation**: Load the new language in the application and verify that the strings are correctly translated. Use the `changeLanguage` function in the browser console to quickly switch languages.

    ```js
    changeLanguage('fr-FR');
    ```
* Make sure to test the translation in the application to ensure that all strings are correctly translated and displayed.

## Updating Existing Translations

1. **Open the Language File**: Navigate to the `lang/` directory and open the JSON file of the language you want to update (e.g., `ko-KR.json`).

2. **Edit the JSON File**: Update the strings as needed. Ensure that the JSON structure remains intact.

## Translating the Wallpaper Engine Properties Panel
* Open `project.json` and add the language to the `localization` array.
* Please refer to the [Wallpaper Engine documentation](https://docs.wallpaperengine.io/en/web/customization/localization.html) for more information on translating the properties panel.

## Contributing Your Translations

1. **Fork the Repository**: Fork the ModernActiveDesktop repository on GitHub.

2. **Create a Branch**: Create a new branch for your translations.

    ```sh
    git checkout -b add-french-translation
    ```

3. **Commit Your Changes**: Commit your translated files to the new branch.

    ```sh
    git add lang/fr-FR.json
    git commit -m "Add French translations"
    ```

4. **Open a Pull Request**: Push your branch to GitHub and open a pull request. Provide a clear description of the changes you made.

* Alternatively, you can send the translated JSON file to <a href="mailto:ingan121@ingan121.com">ingan121@ingan121.com</a> if you prefer not to use GitHub.

## Formatting
* Use ampersands (&) for hotkeys. For example, "&File" will be displayed as "<ins>F</ins>ile" in the application.
    * Use `\&` to display an actual ampersand.
* Format characters:
    * `%0v`: Full version number (e.g., 3.4.1 Pre-release)
    * `%1v`: Numbers only (e.g., 3.4.1)
    * `%2v`: Medium version number (e.g., 3.4)
    * `%3v`: Short version number (e.g., 3)
    * `%s`: Extra strings provided by the application; make sure to include them in your translation. (e.g., `Loading page %s...`)
    * `%1s`, `%2s`, etc.: Multiple extra strings. Please consider the order when translating.
    * Non-localizable strings:
    * `%n`: Application name (ModernActiveDesktop)
    * `%a`: Author name (Ingan121)
    * `%c`: ChannelViewer
* See `processString` in `js/MadStrings.js` for more information.
* HTML is supported in most strings. Make sure to keep the structure intact when translating.

## Guidelines

- **Consistency**: Ensure that your translations are consistent with the terminology used in the application. Official terminology from Windows 98 of the language is preferred, if applicable.
- **Accuracy**: Double-check your translations for accuracy and correctness.
- **Completeness**: Make sure to translate all the strings in the JSON files.
- **Clarity**: Use clear and concise language in your translations.
- **Context**: Consider the context in which the strings will be used and provide appropriate translations.
- **Formatting**: Preserve the JSON structure and formatting when editing the language files.

## Notes
* ModernActiveDesktop supports comments in the language JSON files. You don't need to remove them when translating.
* The `STYLESHEET` string in the language file can be used to apply custom CSS styles to the application when the language is selected. You can use this to customize the appearance of the application for specific languages.
    * For example, overridding the CJK font for the Simplified Chinese language:
    ```json
    "STYLESHEET": ":root { --cjk-fontlink: SimSun, PMingLiU, \"MS UI Gothic\", Gulim; }"
    ```
    * (Please don't change the font directly; this affects the font customization feature in the appearance control panel.)
    * If you need to add a complex CSS rule, modify the related CSS file directly to include the `:lang()` selector. The stylesheet string is intended for simple changes only. (It doesn't even support multiline.)
* If you have any questions or need assistance with the translation process, feel free to reach out to the project maintainers.

Thank you for contributing to ModernActiveDesktop! Your translations help make the application accessible to a wider audience.