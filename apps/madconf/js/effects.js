const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const checkboxes = document.getElementsByTagName("input");
const dropdowns = document.getElementsByTagName("select");
const enableAnimationsChkBox = document.getElementById("enableAnimationsChkBox");
const animationSelector = document.getElementById("animationSelector");
const flatMenuChkBox = document.getElementById("flatMenuChkBox");
const flatMenuSelector = document.getElementById("flatMenuSelector");

for (const dropdown of dropdowns) {
    dropdown.addEventListener("click", function () {
        madOpenDropdown(this);
    });
}

enableAnimationsChkBox.addEventListener("change", function () {
    if (enableAnimationsChkBox.checked) {
        animationSelector.disabled = false;
    } else {
        animationSelector.disabled = true;
    }
});

flatMenuChkBox.addEventListener("change", function () {
    if (flatMenuChkBox.checked) {
        flatMenuSelector.disabled = false;
    } else {
        flatMenuSelector.disabled = true;
    }
});

cancelBtn.addEventListener("click", madCloseWindow);

function init(targetDocument) {
    for (const checkbox of checkboxes) {
        checkbox.checked = targetDocument.getElementById(checkbox.id).checked;
        checkbox.dispatchEvent(new Event('change'));
    }
    for (const dropdown of dropdowns) {
        dropdown.selectedIndex = targetDocument.getElementById(dropdown.id).selectedIndex;
    }

    okBtn.addEventListener("click", () => {
        for (const checkbox of checkboxes) {
            const targetElement = targetDocument.getElementById(checkbox.id);
            targetElement.checked = checkbox.checked;
            targetElement.dispatchEvent(new Event('change'));
        }
        for (const dropdown of dropdowns) {
            const targetElement = targetDocument.getElementById(dropdown.id);
            targetElement.selectedIndex = dropdown.selectedIndex;
            targetElement.dispatchEvent(new Event('change'));
        }
        madCloseWindow();
    });
}