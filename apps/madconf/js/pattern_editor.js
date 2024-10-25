// pattern_editor.js for ModernActiveDesktop Configurator
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

const doneBtn = document.getElementById("doneBtn");
const addBtn = document.getElementById("addBtn");
const changeBtn = document.getElementById("changeBtn");
const removeBtn = document.getElementById("removeBtn");

const patternChooser = document.getElementById("patternChooser");
const checkboxes = document.getElementsByTagName("input");
const patternSample = document.getElementById("patternSample");
const base64Output = document.getElementById("base64Output");

const pattern = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
];

const userPatterns = JSON.parse(localStorage.madesktopUserPatterns);
for (const pattern in userPatterns) {
    const option = document.createElement("option");
    option.innerHTML = `<span>${madProcessString(pattern)}</span>`;
    option.value = userPatterns[pattern];
    patternChooser.appendChild(option);
}

if (localStorage.madesktopBgColor) {
    patternEditor.style.backgroundColor = localStorage.madesktopBgColor;
    patternSample.style.backgroundColor = localStorage.madesktopBgColor;
}

let dragging = 0;
let changed = false;

for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener("change", function () {
        const x = i % 8;
        const y = Math.floor(i / 8);
        pattern[y][x] = checkboxes[i].checked ? 1 : 0;
        updatePattern();
        changed = true;
        changeBtn.disabled = false;
        removeBtn.disabled = true;
    });
    checkboxes[i].addEventListener("pointerdown", function () {
        checkboxes[i].checked = !checkboxes[i].checked;
        if (checkboxes[i].checked) {
            dragging = 1;
        } else {
            dragging = -1;
        }
        checkboxes[i].dispatchEvent(new Event('change'));
    });
    checkboxes[i].addEventListener("click", function (event) {
        event.preventDefault();
    });
    checkboxes[i].addEventListener("pointerenter", function () {
        if (dragging) {
            checkboxes[i].checked = dragging === 1;
            checkboxes[i].dispatchEvent(new Event('change'));
        }
    });
}

document.addEventListener("pointerup", function () {
    dragging = 0;
});

patternChooser.addEventListener("change", function () {
    setPattern(base64ToPattern(patternChooser.value));
});

function updatePattern() {
    patternSample.style.backgroundImage = `url(${genPatternImage(pattern)})`;
    base64Output.textContent = patternToBase64(pattern);
}

function setPattern(newPattern) {
    if (typeof newPattern === "string") {
        patternChooser.value = newPattern;
        newPattern = base64ToPattern(newPattern);
    } else if (typeof newPattern === "number") {
        patternChooser.selectedIndex = newPattern + 1;
        newPattern = base64ToPattern(patternChooser.value);
    }
    for (let i = 0; i < 64; i++) {
        checkboxes[i].checked = newPattern[Math.floor(i / 8)][i % 8];
        checkboxes[i].dispatchEvent(new Event('change'));
    }
    changed = false;
    changeBtn.disabled = true;
    removeBtn.disabled = false;
}

doneBtn.addEventListener("click", madCloseWindow);

addBtn.addEventListener("click", async function () {
    const result = await madPrompt(madGetString("MADCONF_PATTERN_ENTER_NAME"));
    if (result !== null) {
        if (result in userPatterns) {
            madAlert(madGetString("MADCONF_PATTERN_NAME_EXISTS"), null, "error");
            return;
        }
        if (result === "") {
            madAlert(madGetString("MADCONF_PATTERN_NAME_EMPTY"), null, "error");
            return;
        }
        userPatterns[result] = base64Output.textContent;
        localStorage.madesktopUserPatterns = JSON.stringify(userPatterns);
        const option = document.createElement("option");
        option.innerHTML = `<span>${escapeHTML(result)}</span>`;
        option.value = base64Output.textContent;
        patternChooser.appendChild(option);
        patternChooser.selectedIndex = patternChooser.options.length - 1;
        changed = false;
        changeBtn.disabled = true;
        removeBtn.disabled = false;
    }
});

changeBtn.addEventListener("click", function () {
    const selectedOption = patternChooser.options[patternChooser.selectedIndex];
    let patternName = selectedOption.textContent;
    const patternNameLocElem = selectedOption.querySelector("mad-string");
    if (patternNameLocElem) {
        patternName = 'locid:' + patternNameLocElem.getAttribute("data-locid");
    }
    userPatterns[patternName] = base64Output.textContent;
    localStorage.madesktopUserPatterns = JSON.stringify(userPatterns);
    patternChooser.options[patternChooser.selectedIndex].value = base64Output.textContent;
    changed = false;
    changeBtn.disabled = true;
    removeBtn.disabled = false;
});

removeBtn.addEventListener("click", async function () {
    if (await madConfirm(madGetString("MADCONF_CONFIRM_PATTERN_REMOVE", patternChooser.options[patternChooser.selectedIndex].textContent))) {
        const selectedOption = patternChooser.options[patternChooser.selectedIndex];
        let patternName = selectedOption.textContent;
        const patternNameLocElem = selectedOption.querySelector("mad-string");
        if (patternNameLocElem) {
            patternName = 'locid:' + patternNameLocElem.getAttribute("data-locid");
        }
        delete userPatterns[patternName];
        localStorage.madesktopUserPatterns = JSON.stringify(userPatterns);
        patternChooser.options[patternChooser.selectedIndex].remove();
        patternChooser.selectedIndex = 0;
        setPattern(0);
    }
});

base64Output.addEventListener("click", async function () {
    const result = await madPrompt(madGetString("MADCONF_PATTERN_ENTER_B64"), null, "", base64Output.textContent);
    if (result !== null) {
        setPattern(base64ToPattern(result));
    }
});

madDeskMover.beforeClose = async function () {
    if (!window.callback) {
        return;
    }
    if (changed) {
        const res = await madConfirm(
            madGetString("MADCONF_PATTERN_UNSAVED", escapeHTML(patternChooser.options[patternChooser.selectedIndex].textContent)),
            null,
            {
                icon: "question",
                title: "locid:MADCONF_PATTERN_UNSAVED_TITLE",
                btn1: "locid:UI_YES",
                btn2: "locid:UI_NO",
                btn3: "locid:UI_CANCEL",
                defaultBtn: 1,
                cancelBtn: 3
            }
        );

        if (res === null) {
            return false;
        } else if (res === false) {
            callback();
        } else {
            if (changed) {
                changeBtn.dispatchEvent(new Event("click"));
            }
            callback(base64Output.textContent);
        }
    } else {
        callback(base64Output.textContent);
    }
}