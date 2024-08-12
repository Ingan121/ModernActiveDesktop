// libmad-input.js for ModernActiveDesktop
// Made by Ingan121
// Licensed under the MIT License
// SPDX-License-Identifier: MIT

'use strict';

document.addEventListener('madinput', async (event) => {
    const textbox = document.activeElement;
    if (textbox.tagName !== "INPUT" && textbox.tagName !== "TEXTAREA") {
        return;
    }
    if (textbox.readOnly) {
        return;
    }
    if (textbox.tagName === "INPUT" && textbox.type !== "text") {
        // number is unsupported cuz number.value doesn't accept incomplete numbers (e.g. "1.", "-", etc.)
        // just use madPrompt for number inputs
        return;
    }

    const origCursorPos = textbox.selectionStart;
    let changed = false;
    switch (event.key) {
        case "Enter":
            if (textbox.tagName === "TEXTAREA") {
                textbox.value = textbox.value.slice(0, textbox.selectionStart) + "\n" + textbox.value.slice(textbox.selectionEnd);
                textbox.selectionStart = textbox.selectionEnd = origCursorPos + 1;
            } else {
                const keyEvent = new KeyboardEvent("keypress", { key: "Enter" });
                document.dispatchEvent(keyEvent);
            }
            break;
        case "Escape":
            const keyEvent = new KeyboardEvent("keyup", { key: "Escape" });
            document.dispatchEvent(keyEvent);
            break;
        case "Backspace":
            if (textbox.selectionStart === textbox.value.length) {
                textbox.value = textbox.value.slice(0, -1);
            } else if (textbox.selectionStart !== textbox.selectionEnd) {
                textbox.value = textbox.value.slice(0, textbox.selectionStart) + textbox.value.slice(textbox.selectionEnd);
            } else {
                textbox.value = textbox.value.slice(0, textbox.selectionStart - 1) + textbox.value.slice(textbox.selectionStart);
            }
            textbox.selectionStart = textbox.selectionEnd = origCursorPos - 1;
            changed = true;
            break;
        case "Delete":
            if (textbox.selectionStart === textbox.value.length) {
                textbox.value = textbox.value.slice(0, -1);
            } else if (textbox.selectionStart !== textbox.selectionEnd) {
                textbox.value = textbox.value.slice(0, textbox.selectionStart) + textbox.value.slice(textbox.selectionEnd);
            } else {
                textbox.value = textbox.value.slice(0, textbox.selectionStart) + textbox.value.slice(textbox.selectionStart + 1);
            }
            textbox.selectionStart = textbox.selectionEnd = origCursorPos;
            changed = true;
            break;
        case "ArrowLeft":
            textbox.selectionStart = textbox.selectionEnd = Math.max(0, origCursorPos - 1);
            break;
        case "ArrowRight":
            textbox.selectionStart = textbox.selectionEnd = Math.min(textbox.value.length, origCursorPos + 1);
            break;
        case "^a":
            textbox.select();
            break;
        case "^c":
            textbox.select();
            document.execCommand('copy');
            break;
        case "^x":
            textbox.select();
            document.execCommand('cut');
            changed = true;
            break;
        case "^v":
            const clipboard = await madSysPlug.getClipboard();
            if (textbox.selectionStart === textbox.value.length) {
                textbox.value += clipboard;
            } else if (textbox.selectionStart !== textbox.selectionEnd) {
                textbox.value = textbox.value.slice(0, textbox.selectionStart) + clipboard + textbox.value.slice(textbox.selectionEnd);
            } else {
                textbox.value = textbox.value.slice(0, textbox.selectionStart) + clipboard + textbox.value.slice(textbox.selectionStart);
            }
            textbox.selectionStart = textbox.selectionEnd = origCursorPos + clipboard.length;
            changed = true;
            break;
        default:
            if (event.key.length === 1) {
                if (textbox.selectionStart === textbox.value.length) {
                    textbox.value = textbox.value.toString() + event.key;
                } else if (textbox.selectionStart !== textbox.selectionEnd) {
                    textbox.value = textbox.value.slice(0, textbox.selectionStart) + event.key + textbox.value.slice(textbox.selectionEnd);
                } else {
                    textbox.value = textbox.value.slice(0, textbox.selectionStart) + event.key + textbox.value.slice(textbox.selectionStart);
                }
                textbox.selectionStart = textbox.selectionEnd = origCursorPos + 1;
            } else if (event.key.startsWith("/comp ")) {
                const compositedInput = event.key.slice(6);
                if (textbox.selectionStart === textbox.value.length) {
                    textbox.value = textbox.value.toString() + compositedInput;
                } else if (textbox.selectionStart !== textbox.selectionEnd) {
                    textbox.value = textbox.value.slice(0, textbox.selectionStart) + compositedInput + textbox.value.slice(textbox.selectionEnd);
                } else {
                    textbox.value = textbox.value.slice(0, textbox.selectionStart) + compositedInput + textbox.value.slice(textbox.selectionStart);
                }
                textbox.selectionStart = textbox.selectionEnd = origCursorPos + compositedInput.length;
                const keyEvent = new KeyboardEvent("keypress", { key: "Enter" });
                document.dispatchEvent(keyEvent);
                madSysPlug.inputStatus = false;
            }
            changed = true;
    }
    if (changed) {
        const inputEvent = new Event("input", { bubbles: true });
        textbox.dispatchEvent(inputEvent);
    }
});