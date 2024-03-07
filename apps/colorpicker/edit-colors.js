((exports) => {

	// Obviously taken from jspaint

	const basic_colors = [
		"#FF8080", "#FFFF80", "#80FF80", "#00FF80", "#80FFFF", "#0080FF", "#FF80C0", "#FF80FF",
		"#FF0000", "#FFFF00", "#80FF00", "#00FF40", "#00FFFF", "#0080C0", "#8080C0", "#FF00FF",
		"#804040", "#FF8040", "#00FF00", "#008080", "#004080", "#8080FF", "#800040", "#FF0080",
		"#800000", "#FF8000", "#008000", "#008040", "#0000FF", "#0000A0", "#800080", "#8000FF",
		"#400000", "#804000", "#004000", "#004040", "#000080", "#000040", "#400040", "#400080",
		"#000000", "#808000", "#808040", "#808080", "#408080", "#C0C0C0", "#400040", "#FFFFFF",
	];
	let custom_colors = [
		"#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
		"#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF",
	];

	// Repurposable color picker modeled after the Windows system color picker
	function choose_color(initial_color, expand, callback) {
		const $w = new $DialogWindow();
		$w.addClass("edit-colors-window");

		let hue_degrees = 0;
		let sat_percent = 50;
		let lum_percent = 50;

		let custom_colors_index = 0;

		const get_current_color = () => `hsl(${hue_degrees}deg, ${sat_percent}%, ${lum_percent}%)`;
		const set_color_from_rgb = (r, g, b) => {
			const [h, s, l] = rgb_to_hsl(r, g, b);
			hue_degrees = h * 360;
			sat_percent = s * 100;
			lum_percent = l * 100;
		};
		const set_color = (color) => {
			const [r, g, b] = get_rgba_from_color(color);
			set_color_from_rgb(r, g, b);
		};
		const select = ($swatch) => {
			$w.$content.find(".swatch").removeClass("selected");
			$swatch.addClass("selected");
			set_color($swatch[0].dataset.color);
			if ($swatch.closest("#custom-colors")) {
				custom_colors_index = Math.max(0, custom_colors_swatches_list_order.indexOf(
					$custom_colors_grid.find(".swatch.selected")[0]
				));
			}
			update_inputs("hslrgb");
		};

		const make_color_grid = (colors, id) => {
			const $color_grid = $(`<div class="color-grid" tabindex="0">`).attr({ id });
			for (const color of colors) {
				const $swatch = $Swatch(color);
				$swatch.appendTo($color_grid).addClass("inset-deep");
				$swatch.attr("tabindex", -1); // can be focused by clicking or calling focus() but not by tabbing
			}
			let $local_last_focus = $color_grid.find(".swatch:first-child");
			const num_colors_per_row = 8;
			const navigate = (relative_index) => {
				const $focused = $color_grid.find(".swatch:focus");
				if (!$focused.length) { return; }
				const $swatches = $color_grid.find(".swatch");
				const from_index = $swatches.toArray().indexOf($focused[0]);
				if (relative_index === -1 && (from_index % num_colors_per_row) === 0) { return; }
				if (relative_index === +1 && (from_index % num_colors_per_row) === num_colors_per_row - 1) { return; }
				const to_index = from_index + relative_index;
				const $to_focus = $($swatches.toArray()[to_index]);
				// console.log({from_index, to_index, $focused, $to_focus});
				if (!$to_focus.length) { return; }
				$to_focus.focus();
			};
			$color_grid.on("keydown", (event) => {
				// console.log(event.code);
				if (event.code === "ArrowRight") { navigate(+1); }
				if (event.code === "ArrowLeft") { navigate(-1); }
				if (event.code === "ArrowDown") { navigate(+num_colors_per_row); }
				if (event.code === "ArrowUp") { navigate(-num_colors_per_row); }
				if (event.code === "Home") { $color_grid.find(".swatch:first-child").focus(); }
				if (event.code === "End") { $color_grid.find(".swatch:last-child").focus(); }
				if (event.code === "Space" || event.code === "Enter") {
					select($color_grid.find(".swatch:focus"));
					draw();
				}
			});
			$color_grid.on("pointerdown", (event) => {
				const $swatch = $(event.target).closest(".swatch");
				if ($swatch.length) {
					select($swatch);
					draw();
				}
			});
			$color_grid.on("dragstart", (event) => {
				event.preventDefault();
			});
			$color_grid.on("focusin", (event) => {
				if (event.target.closest(".swatch")) {
					$local_last_focus = $(event.target.closest(".swatch"));
				} else {
					if (!$local_last_focus.is(":focus")) { // prevent infinite recursion
						$local_last_focus.focus();
					}
				}
				// allow shift+tabbing out of the control
				// otherwise it keeps setting focus back to the color cell,
				// since the parent grid is previous in the tab order
				$color_grid.attr("tabindex", -1);
			});
			$color_grid.on("focusout", (event) => {
				$color_grid.attr("tabindex", 0);
			});
			return $color_grid;
		};
		const $left_right_split = $(`<div class="left-right-split">`).appendTo($w.$main);
		const $left = $(`<div class="left-side">`).appendTo($left_right_split);
		const $right = $(`<div class="right-side">`).appendTo($left_right_split).hide();
		$left.append(`<label for="basic-colors">${madGetString("COLORPICKER_BASIC_COLORS")}</label>`);
		const $basic_colors_grid = make_color_grid(basic_colors, "basic-colors").appendTo($left);
		$left.append(`<label for="custom-colors">${madGetString("COLORPICKER_CUSTOM_COLORS")}</label>`);
		const custom_colors_dom_order = []; // (wanting) horizontal top to bottom
		for (let list_index = 0; list_index < custom_colors.length; list_index++) {
			const row = list_index % 2;
			const column = Math.floor(list_index / 2);
			const dom_index = row * 8 + column;
			custom_colors_dom_order[dom_index] = custom_colors[list_index];
		}
		const $custom_colors_grid = make_color_grid(custom_colors_dom_order, "custom-colors").appendTo($left);
		const custom_colors_swatches_dom_order = $custom_colors_grid.find(".swatch").toArray(); // horizontal top to bottom
		const custom_colors_swatches_list_order = []; // (wanting) vertical left to right
		for (let dom_index = 0; dom_index < custom_colors_swatches_dom_order.length; dom_index++) {
			const row = Math.floor(dom_index / 8);
			const column = dom_index % 8;
			const list_index = column * 2 + row;
			custom_colors_swatches_list_order[list_index] = custom_colors_swatches_dom_order[dom_index];
			// custom_colors_swatches_list_order[list_index].textContent = list_index; // visualization
		}

		const $define_custom_colors_button = $(`<button class="define-custom-colors-button" type="button">`)
			.html(madGetString("COLORPICKER_DEFINE_CUSTOM"))
			.appendTo($left)
			.on("click", (e) => {
				// prevent the form from submitting
				// @TODO: instead, prevent the form's submit event in $Window.js in os-gui (or don't have a form? idk)
				e.preventDefault();

				$right.show();
				$w.addClass("defining-custom-colors"); // for mobile layout
				$define_custom_colors_button.attr("disabled", "disabled");

				madResizeTo(447, 298);
			});

		const $color_solid_label = $(`<label for="color-solid-canvas">${madGetString("COLORPICKER_COLOR_SOLID")}</label>`);
		$color_solid_label.css({
			position: "absolute",
			left: 10,
			top: 244,
		});

		const rainbow_canvas = make_canvas(175, 187);
		const luminosity_canvas = make_canvas(10, 187);
		const result_canvas = make_canvas(58, 40);
		const lum_arrow_canvas = make_canvas(5, 9);

		$(result_canvas).css({
			position: "absolute",
			left: 10,
			top: 198,
		});

		$(result_canvas).on("click", () => {
			madPrompt("Enter CSS color", function (res) {
				if (res === null) return;
				set_color(res);
				update_inputs("hslrgb");
				draw();
			}, '', '');
		});

		let mouse_down_on_rainbow_canvas = false;
		let crosshair_shown_on_rainbow_canvas = false;
		const draw = () => {
			if (!mouse_down_on_rainbow_canvas || crosshair_shown_on_rainbow_canvas) {
				// rainbow
				for (let y = 0; y < rainbow_canvas.height; y += 6) {
					for (let x = -1; x < rainbow_canvas.width; x += 3) {
						rainbow_canvas.ctx.fillStyle = `hsl(${x / rainbow_canvas.width * 360}deg, ${(1 - y / rainbow_canvas.height) * 100}%, 50%)`;
						rainbow_canvas.ctx.fillRect(x, y, 3, 6);
					}
				}
				// crosshair
				if (!mouse_down_on_rainbow_canvas) {
					const x = ~~(hue_degrees / 360 * rainbow_canvas.width);
					const y = ~~((1 - sat_percent / 100) * rainbow_canvas.height);
					rainbow_canvas.ctx.fillStyle = "black";
					rainbow_canvas.ctx.fillRect(x - 1, y - 9, 3, 5);
					rainbow_canvas.ctx.fillRect(x - 1, y + 5, 3, 5);
					rainbow_canvas.ctx.fillRect(x - 9, y - 1, 5, 3);
					rainbow_canvas.ctx.fillRect(x + 5, y - 1, 5, 3);
				}
				crosshair_shown_on_rainbow_canvas = !mouse_down_on_rainbow_canvas;
			}

			for (let y = -2; y < luminosity_canvas.height; y += 6) {
				luminosity_canvas.ctx.fillStyle = `hsl(${hue_degrees}deg, ${sat_percent}%, ${(1 - y / luminosity_canvas.height) * 100}%)`;
				luminosity_canvas.ctx.fillRect(0, y, luminosity_canvas.width, 6);
			}

			lum_arrow_canvas.ctx.fillStyle = getComputedStyle($w[0]).getPropertyValue("--button-text");
			for (let x = 0; x < lum_arrow_canvas.width; x++) {
				lum_arrow_canvas.ctx.fillRect(x, lum_arrow_canvas.width - x - 1, 1, 1 + x * 2);
			}
			lum_arrow_canvas.style.position = "absolute";
			lum_arrow_canvas.style.left = "215px";
			lum_arrow_canvas.style.top = `${3 + ~~((1 - lum_percent / 100) * luminosity_canvas.height)}px`;

			result_canvas.ctx.fillStyle = get_current_color();
			result_canvas.ctx.fillRect(0, 0, result_canvas.width, result_canvas.height);
		};
		draw();
		$(rainbow_canvas).addClass("rainbow-canvas inset-shallow");
		$(luminosity_canvas).addClass("luminosity-canvas inset-shallow");
		$(result_canvas).addClass("result-color-canvas inset-shallow").attr("id", "color-solid-canvas");

		const select_hue_sat = (event) => {
			hue_degrees = Math.min(1, Math.max(0, event.offsetX / madScaleFactor / rainbow_canvas.width)) * 360;
			sat_percent = Math.min(1, Math.max(0, (1 - event.offsetY / madScaleFactor / rainbow_canvas.height))) * 100;
			update_inputs("hsrgb");
			draw();
			event.preventDefault();
		};
		$(rainbow_canvas).on("pointerdown", (event) => {
			mouse_down_on_rainbow_canvas = true;
			select_hue_sat(event);

			$(rainbow_canvas).on("pointermove", select_hue_sat);
			if (event.pointerId !== 1234567890) { // for Eye Gaze Mode simulated clicks
				rainbow_canvas.setPointerCapture(event.pointerId);
			}
		});
		$G.on("pointerup pointercancel", (event) => {
			$(rainbow_canvas).off("pointermove", select_hue_sat);
			// rainbow_canvas.releasePointerCapture(event.pointerId);
			mouse_down_on_rainbow_canvas = false;
			draw();
		});

		const select_lum = (event) => {
			lum_percent = Math.min(1, Math.max(0, (1 - event.offsetY / madScaleFactor / luminosity_canvas.height))) * 100;
			update_inputs("lrgb");
			draw();
			event.preventDefault();
		};
		$(luminosity_canvas).on("pointerdown", (event) => {
			select_lum(event);

			$(luminosity_canvas).on("pointermove", select_lum);
			if (event.pointerId !== 1234567890) { // for Eye Gaze Mode simulated clicks
				luminosity_canvas.setPointerCapture(event.pointerId);
			}
		});
		$G.on("pointerup pointercancel", (event) => {
			$(luminosity_canvas).off("pointermove", select_lum);
			// luminosity_canvas.releasePointerCapture(event.pointerId);
		});

		const inputs_by_component_letter = {};

		["hsl", "rgb"].forEach((color_model, color_model_index) => {
			[...color_model].forEach((component_letter, component_index) => {
				const locId = {
					h: "COLORPICKER_HUE",
					s: "COLORPICKER_SAT",
					l: "COLORPICKER_LUM",
					r: "COLORPICKER_RED",
					g: "COLORPICKER_GREEN",
					b: "COLORPICKER_BLUE",
				}[component_letter];
				const input = document.createElement("input");
				// not doing type="number" because the inputs have no up/down buttons and they have special behavior with validation
				input.type = "text";
				input.classList.add("inset-deep");
				input.dataset.componentLetter = component_letter;
				input.dataset.min = 0;
				input.dataset.max = {
					h: 360,
					s: 100,
					l: 100,
					r: 255,
					g: 255,
					b: 255,
				}[component_letter];
				const label = document.createElement("label");
				label.innerHTML = madGetString(locId);
				const input_y_spacing = 22;
				$(label).css({
					position: "absolute",
					left: 70 + color_model_index * 75,
					top: 198 + component_index * input_y_spacing,
					textAlign: "right",
					display: "inline-block",
					width: 40,
					height: 20,
					lineHeight: "20px",
				});
				$(input).css({
					position: "absolute",
					left: 113 + color_model_index * 75,
					top: 202 + component_index * input_y_spacing + (component_index > 1), // spacing of rows is uneven by a pixel
					width: 21,
					height: 14,
				});
				$right.append(label, input);

				input.addEventListener("click", function () {
					if (madRunningMode === 1) {
						madPrompt(madGetString("UI_PROMPT_ENTER_VALUE"), function (res) {
							if (res === null) return;
							input.value = res;
							handle_input(input);
						}, '', input.value);
					}
				});

				inputs_by_component_letter[component_letter] = input;
			});
		});

		// listening for input events on input elements using event delegation (looks a little weird)
		$right.on("input", "input", (event) => {
			handle_input(event.target);
		});
		const handle_input = function (input) {
			const component_letter = input.dataset.componentLetter;
			if (component_letter) {
				// In Windows, it actually only updates if the numerical value changes, not just the text.
				// That is, you can add leading zeros, and they'll stay, then add them in the other color model
				// and it won't remove the ones in the fields of the first color model.
				// This is not important, so I don't know if I'll do that.

				if (input.value.match(/^\d+$/)) {
					let n = Number(input.value);
					if (n < input.dataset.min) {
						n = input.dataset.min;
						input.value = n;
					} else if (n > input.dataset.max) {
						n = input.dataset.max;
						input.value = n;
					}
					if ("hsl".indexOf(component_letter) > -1) {
						switch (component_letter) {
							case "h":
								hue_degrees = n;
								break;
							case "s":
								sat_percent = n;
								break;
							case "l":
								lum_percent = n;
								break;
						}
						update_inputs("rgb");
					} else {
						let [r, g, b] = get_rgba_from_color(get_current_color());
						const rgb = { r, g, b };
						rgb[component_letter] = n;
						set_color_from_rgb(rgb.r, rgb.g, rgb.b);
						update_inputs("hsl");
					}
					draw();
				} else if (input.value.length) {
					update_inputs(component_letter);
					input.select();
				}
			}
		}
		$right.on("focusout", "input", (event) => {
			const input = event.target;
			const component_letter = input.dataset.componentLetter;
			if (component_letter) {
				// Handle empty input when focus moves away
				if (!input.value.match(/^\d+$/)) {
					update_inputs(component_letter);
					input.select();
				}
			}
		});

		$w.on("keydown", (event) => {
			// For some reason Enter isn't working to submit the form. (Am I preventing it somewhere?)
			// It's understandable that it wouldn't work for my custom grid controls,
			// but it's not submitting even when regular inputs are focused.
			if (event.code === "Enter" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
				// There are no controls in this dialog that need to handle Enter like a multi-line textarea,
				// other than buttons, which should trigger the specific button,
				// and color cells, which should select the color and submit the dialog.
				// The color should be already selected, by the more specific event handler, as the event bubbles up.
				if (!event.target.closest("button")) {
					callback(get_current_color());
					event.preventDefault();
					event.stopPropagation();
					return;
				}
			}

			if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
				switch (event.key) {
					case "o":
						set_color(get_current_color());
						update_inputs("hslrgb");
						draw();
						break;
					case "b":
						$basic_colors_grid.find(".swatch.selected, .swatch").focus();
						break;
					case "c":
						$basic_colors_grid.find(".swatch.selected, .swatch").focus();
						break;
					case "e":
						inputs_by_component_letter.h.focus();
						break;
					case "s":
						inputs_by_component_letter.s.focus();
						break;
					case "l":
						inputs_by_component_letter.l.focus();
						break;
					case "r":
						inputs_by_component_letter.r.focus();
						break;
					case "g":
						inputs_by_component_letter.g.focus();
						break;
					case "u":
						inputs_by_component_letter.b.focus();
						break;
					case "a":
						if ($add_to_custom_colors_button.is(":visible")) {
							$add_to_custom_colors_button.click();
						}
						break;
					case "d":
						$define_custom_colors_button.click();
						break;
					default:
						return; // don't prevent default by default
				}
			} else {
				return; // don't prevent default by default
			}
			event.preventDefault();
			event.stopPropagation();
		});

		const update_inputs = (components) => {
			for (const component_letter of components) {
				const input = inputs_by_component_letter[component_letter];
				const [r, g, b] = get_rgba_from_color(get_current_color());
				input.value = Math.floor({
					h: hue_degrees,
					s: sat_percent,
					l: lum_percent,
					r,
					g,
					b,
				}[component_letter]);
			}
		};

		$right.append(rainbow_canvas, luminosity_canvas, result_canvas, $color_solid_label, lum_arrow_canvas);

		const $add_to_custom_colors_button = $(`<button class="add-to-custom-colors-button" type="button">`)
			.html(madGetString("COLORPICKER_ADD_TO_CUSTOM"))
			.appendTo($right)
			.on("click", (event) => {
				// prevent the form from submitting
				// @TODO: instead, prevent the form's submit event in $Window.js in os-gui (or don't have a form? idk)
				event.preventDefault();

				const color = get_current_color();
				custom_colors[custom_colors_index] = color;
				// console.log(custom_colors_swatches_reordered, custom_colors_index, custom_colors_swatches_reordered[custom_colors_index]));
				update_$swatch($(custom_colors_swatches_list_order[custom_colors_index]), color);
				custom_colors_index = (custom_colors_index + 1) % custom_colors.length;

				$w.removeClass("defining-custom-colors"); // for mobile layout
			});

		$w.$Button(madGetString("UI_OK"), () => {
			callback(get_current_color());
			$w.close();
		}, { type: "submit" });
		$w.$Button(madGetString("UI_CANCEL"), () => {
			$w.close();
		});

		$left.append($w.$buttons);

		// Initially select the first color cell that matches the color to edit, if any
		// (first in the basic colors, then in the custom colors otherwise.
		// This works implicitly, since basic colors come before custom colors in the DOM.)
		for (const swatch_el of $left.find(".swatch").toArray()) {
			if (get_rgba_from_color(swatch_el.dataset.color).join(",") === get_rgba_from_color(initial_color).join(",")) {
				select($(swatch_el));
				swatch_el.focus();
				break;
			}
		}
		custom_colors_index = Math.max(0, custom_colors_swatches_list_order.indexOf(
			$custom_colors_grid.find(".swatch.selected")[0]
		));
		// If no color cell matches the color to edit,
		// focus the first color cell, without changing the selected color value as displayed if you expand the dialog.
		// This supports workflows:
		// 1. Make a custom color, without saving it to the custom colors list, hit OK, then edit this new color.
		// 2. Use the eye dropper tool to select a color in an image, then edit it or see the RGB/HSL values.
		// (Also test adding to custom colors, without editing, a color not already in the custom colors list.
		// I swear it added the wrong color once...)
		if ($w.find(".swatch:focus").length === 0) {
			$w.find(".swatch").first().focus();
		}

		set_color(initial_color);
		update_inputs("hslrgb");

		if (expand) {
			$define_custom_colors_button.click();
			$w.trigger("pointerup"); // to force the custom colors to render
		}
	}
	exports.choose_color = choose_color;

})(window);

madSetIcon(false);

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        madCloseWindow();
    }
});