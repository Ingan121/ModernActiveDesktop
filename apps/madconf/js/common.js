const tabs = document.querySelectorAll(".tab");
const generalBtn = document.getElementById("generalBtn");
const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
const applyBtn = document.getElementById("applyBtn");

const dropdowns = document.querySelectorAll("select");
const textboxes = document.querySelectorAll("input[type=text]");

for (const tab of tabs) {
    tab.addEventListener("click", function() {
        if (this.dataset.pagename === "background" && parent.runningMode === 1) {
            madPlaySound("ding");
            madAlert("Please use the Wallpaper Engine properties panel to configure the background.");
        } else {
            madLocReplace(`apps/madconf/${this.dataset.pagename}.html`);
        }
    });
}

for (const dropdown of dropdowns) {
    dropdown.addEventListener("click", function() {
        madOpenDropdown(this);
    });
}

for (const textbox of textboxes) {
    textbox.addEventListener("click", function() {
        if (parent.runningMode === 1) {
            madPrompt("Enter value :", function (res) {
                if (res === null) return;
                textbox.value = res;
                textbox.dispatchEvent(new Event('change'));
            }, '', textbox.value);
        }
    });
}

if (okBtn) {
    okBtn.addEventListener("click", function() {
        if (window.apply && !location.href.includes("about.html")) {
            window.apply();
        }
        madCloseWindow();
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener("click", function() {
        madCloseWindow();
    });
}

if (applyBtn) {
    applyBtn.addEventListener("click", function() {
        if (window.apply) {
            window.apply();
        }
    });
}

okBtn.focus();