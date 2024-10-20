((exports) => {

	const eachFont = async (callback, afterAllCallback) => {
		function localFontAccessUnavailable() {
			FontDetective.each(callback);
			FontDetective.all(afterAllCallback);
		}
		if (window.queryLocalFonts && madRunningMode === 0) {
			let availableFonts;
			try {
				availableFonts = await window.queryLocalFonts();
			} catch (error) {
				console.log("queryLocalFonts failed:", error, "\nFalling back to FontDetective.");
				localFontAccessUnavailable();
				return;
			}
			if (availableFonts.length === 0) {
				console.log("queryLocalFonts returned no fonts; falling back to FontDetective.");
				localFontAccessUnavailable();
				return;
			}
			const familyNames = new Set();
			for (const font of availableFonts) {
				if (familyNames.has(font.family)) {
					continue;
				}
				familyNames.add(font.family);
				callback({
					name: font.family,
					toString() {
						return '"' + this.name.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"';
					},
				});
				// This class is not exported by FontDetective.
				// That said, this queryLocalFonts functionality should be moved into FontDetective.
				// callback(new FontDetective.Font(font.family));
			}
			afterAllCallback();
		} else {
			console.log("queryLocalFonts unavailable; falling back to FontDetective.");
			localFontAccessUnavailable();
		}
	};

	function $FontBox() {
		const $fb = $(E("div")).addClass("font-box");

		const $family = $(E("select")).addClass("inset-deep").attr({
			"aria-label": "Font Family",
			"aria-description": localize("Selects the font used by the text."),
		});
		$family[0].addEventListener("click", () => {
			madOpenDropdown($family[0]);
		});

		const $size = $(E("input")).addClass("inset-deep").attr({
			type: "number",
			min: 8,
			max: 72,
			value: text_tool_font.size,
			"aria-label": "Font Size",
			"aria-description": localize("Selects the point size of the text."),
		}).css({
			maxWidth: 50,
		});
		const $button_group = $(E("span")).addClass("text-toolbar-button-group");
		// @TODO: localized labels
		const $bold = $Toggle(0, "bold", "Bold", localize("Sets or clears the text bold attribute."));
		const $italic = $Toggle(1, "italic", "Italic", localize("Sets or clears the text italic attribute."));
		const $underline = $Toggle(2, "underline", "Underline", localize("Sets or clears the text underline attribute."));
		const $vertical = $Toggle(3, "vertical", "Vertical Writing Mode", localize("Only a Far East font can be used for vertical editing."));
		$vertical.attr("disabled", true);

		$button_group.append($bold, $italic, $underline, $vertical);
		$fb.append($family, $size, $button_group);

		$size.on("click", async () => {
			if (madKbdSupport !== 1) {
				if (madSysPlug.inputStatus) {
					madSysPlug.focusInput();
				} else if (!await madSysPlug.beginInput()) {
					madPrompt(madGetString("UI_PROMPT_ENTER_VALUE"), function (res) {
						if (res === null) return;
						$size.val(res);
						$size.trigger("change");
					}, '', $size.val(), true);
				}
			}
		});

		const update_font = () => {
			text_tool_font.size = Number($size.val());
			text_tool_font.family = $family.val();
			$G.trigger("option-changed");
		};

		const originalFamily = text_tool_font.family;
		eachFont(font => {
			const $option = $(E("option"));
			$option.val(font).text(font.name);
			// Insert in alphabetical order
			const $options = $family.children("option");
			let i = 0;
			for (; i < $options.length; i++) {
				if ($options.eq(i).text().localeCompare(font.name) > 0) {
					break;
				}
			}
			if ($options.eq(i).length) {
				$options.eq(i).before($option);
			} else {
				$family.append($option);
			}
			// Select the first known-available font, just in case FontDetective.each is slow.
			if (!text_tool_font.family) {
				update_font();
			}
		}, () => {
			// All fonts have been added to the list. Now we can select the default font.
			$family.val(originalFamily);
			// Liberation Sans is designed to be metrically compatible with Arial,
			// and is available in free operating systems like Ubuntu.
			if (!$family.val()) {
				$family.val('"Liberation Sans"');
			}
			// Fallback to the first font in the list. At least it's something.
			if (!$family.val()) {
				$family.val($family.children("option").eq(0).val());
			}
			update_font();
		});

		if (text_tool_font.family) {
			$family.val(text_tool_font.family);
		}

		$family.on("change", update_font);
		$size.on("change", update_font);

		const $w = $ToolWindow();
		$w.title(localize("Fonts"));
		$w.$content.append($fb);
		$w.center();
		return $w;


		function $Toggle(xi, thing, label, description) {
			const $button = $(E("button")).addClass("toggle").attr({
				"aria-pressed": false,
				"aria-label": label,
				"aria-description": description,
			});
			const $icon = $(E("span")).addClass("icon").appendTo($button);
			$button.css({
				width: 23,
				height: 22,
				padding: 0,
				display: "inline-flex",
				alignContent: "center",
				alignItems: "center",
				justifyContent: "center",
			});
			$icon.css({
				flex: "0 0 auto",
				display: "block",
				width: 16,
				height: 16,
				"--icon-index": xi,
			});
			$button.on("click", () => {
				$button.toggleClass("selected");
				text_tool_font[thing] = $button.hasClass("selected");
				$button.attr("aria-pressed", $button.hasClass("selected"));
				update_font();
			});
			if (text_tool_font[thing]) {
				$button.addClass("selected").attr("aria-pressed", true);
			}
			return $button;
		}
	}

	exports.$FontBox = $FontBox;

})(window);