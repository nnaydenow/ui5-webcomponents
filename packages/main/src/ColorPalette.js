import UI5Element from "@ui5/webcomponents-base/dist/UI5Element.js";
import litRender from "@ui5/webcomponents-base/dist/renderer/LitRenderer.js";
import { fetchI18nBundle, getI18nBundle } from "@ui5/webcomponents-base/dist/i18nBundle.js";
import ItemNavigation from "@ui5/webcomponents-base/dist/delegate/ItemNavigation.js";
import CSSColor from "@ui5/webcomponents-base/dist/types/CSSColor.js";
import ItemNavigationBehavior from "@ui5/webcomponents-base/dist/types/ItemNavigationBehavior.js";
import {
	isSpace,
	isEnter,
} from "@ui5/webcomponents-base/dist/Keys.js";
import { getFeature } from "@ui5/webcomponents-base/dist/FeaturesRegistry.js";
import ColorPaletteTemplate from "./generated/templates/ColorPaletteTemplate.lit.js";
import ColorPaletteDialogTemplate from "./generated/templates/ColorPaletteDialogTemplate.lit.js";
import ColorPaletteItem from "./ColorPaletteItem.js";
import {
	COLORPALETTE_CONTAINER_LABEL,
	COLOR_PALETTE_MORE_COLORS_TEXT,
} from "./generated/i18n/i18n-defaults.js";

// Styles
import ColorPaletteCss from "./generated/themes/ColorPalette.css.js";
import ColorPaletteStaticAreaCss from "./generated/themes/ColorPaletteStaticArea.css.js";

/**
 * @public
 */
const metadata = {
	tag: "ui5-color-palette",
	managedSlots: true,
	properties: /** @lends sap.ui.webcomponents.main.ColorPalette.prototype */ {

		/**
		 * Defines whether the user can see the last used colors in the bottom of the component
		 * @type {boolean}
		 * @public
		 * @since 1.0.0-rc.15
		 */
		showRecentColors: {
			type: Boolean,
		},

		/**
		 * Defines whether the user can choose a custom color from a color picker
		 * <b>Note:</b> In order to use this property you need to import the following module: <code>"@ui5/webcomponents/dist/features/ColorPaletteMoreColors.js"</code>
		 * @type {boolean}
		 * @public
		 * @since 1.0.0-rc.15
		 */
		showMoreColors: {
			type: Boolean,
		},

		/**
		 *
		 * The selected color.
		 * @type {CSSColor}
		 * @public
		 */
		value: {
			type: CSSColor,
		},
	},
	slots: /** @lends sap.ui.webcomponents.main.ColorPalette.prototype */ {
		/**
		 * Defines the <code>ui5-color-palette-item</code> items.
		 * @type {sap.ui.webcomponents.main.IColorPaletteItem[]}
		 * @slot colors
		 * @public
		 */
		"default": {
			propertyName: "colors",
			type: HTMLElement,
			invalidateOnChildChange: true,
			individualSlots: true,
		},
	},
	events: /** @lends sap.ui.webcomponents.main.ColorPalette.prototype */ {
		/**
		 * Fired when the user selects a color.
		 *
		 * @event
		 * @public
		 * @param {String} color the selected color
		 */
		change: {
			details: {
				color: {
					type: String,
				},
			},
		 },
	},
};

/**
 * @class
 *
 * <h3 class="comment-api-title">Overview</h3>
 * The ColorPalette provides the users with a range of predefined colors. The colors are fixed and do not change with the theme.
 * You can set them by using the ColorPaletteItem items as slots.
 *
 * <h3>Usage</h3>
 * The Colorpalette is intended for users that needs to select a color from a predefined set of colors.
 * To allow users select any color from a color picker, enable the <code>show-more-colors</code> property.
 * And, to display the most recent color selection, enable the <code>show-recent-colors</code> property.
 *
 * <h3>ES6 Module Import</h3>
 *
 * <code>import "@ui5/webcomponents/dist/ColorPalette.js";</code>
 *
 * @constructor
 * @author SAP SE
 * @alias sap.ui.webcomponents.main.ColorPalette
 * @extends UI5Element
 * @tagname ui5-color-palette
 * @since 1.0.0-rc.12
 * @appenddocs ColorPaletteItem
 * @public
 */
class ColorPalette extends UI5Element {
	static get metadata() {
		return metadata;
	}

	static get render() {
		return litRender;
	}

	static get styles() {
		return ColorPaletteCss;
	}

	static get staticAreaStyles() {
		return ColorPaletteStaticAreaCss;
	}

	static get template() {
		return ColorPaletteTemplate;
	}

	static get staticAreaTemplate() {
		return ColorPaletteDialogTemplate;
	}

	static get dependencies() {
		const ColorPaletteMoreColors = getFeature("ColorPaletteMoreColors");
		return [ColorPaletteItem].concat(ColorPaletteMoreColors ? ColorPaletteMoreColors.dependencies : []);
	}

	static async onDefine() {
		await fetchI18nBundle("@ui5/webcomponents");
	}

	constructor() {
		super();
		this.i18nBundle = getI18nBundle("@ui5/webcomponents");
		this._itemNavigation = new ItemNavigation(this, {
			getItemsCallback: () => this.displayedColors,
			rowSize: 5,
			behavior: ItemNavigationBehavior.Cyclic,
		});

		this._recentColors = [];
	}

	onBeforeRendering() {
		this.displayedColors.forEach((item, index) => {
			item.index = index + 1;
		});

		if (this.showMoreColors) {
			const ColorPaletteMoreColors = getFeature("ColorPaletteMoreColors");
			if (ColorPaletteMoreColors) {
				this.moreColorsFeature = new ColorPaletteMoreColors();
			} else {
				throw new Error(`You have to import "@ui5/webcomponents/dist/features/ColorPaletteMoreColors.js" module to use the more-colors functionality.`);
			}
		}
	}

	selectColor(item) {
		item.focus();

		if (this.displayedColors.includes(item)) {
			this._itemNavigation.setCurrentItem(item);
		}

		this._setColor(item.value);
	}

	_setColor(color) {
		this.value = color;
		if (this._recentColors[0] !== this.value) {
			if (this._recentColors.includes(this.value)) {
				this._recentColors.unshift(this._recentColors.splice(this._recentColors.indexOf(this.value), 1)[0]);
			} else {
				this._recentColors.unshift(this.value);
			}
		}

		this.fireEvent("change", {
			color: this.value,
		});
	}

	_onclick(event) {
		if (event.target.localName === "ui5-color-palette-item") {
			this.selectColor(event.target);
		}
	}

	_onkeyup(event) {
		if (isSpace(event)) {
			event.preventDefault();
			this.selectColor(event.target);
		}
	}

	_onkeydown(event) {
		if (isEnter(event)) {
			this.selectColor(event.target);
		}
	}

	async _chooseCustomColor() {
		const colorPicker = await this.getColorPicker();
		this._setColor(colorPicker.color);
		this._closeDialog();
	}

	async _closeDialog() {
		const dialog = await this._getDialog();
		dialog.close();
	}

	async _openMoreColorsDialog() {
		const dialog = await this._getDialog();
		dialog.open();
	}

	get displayedColors() {
		return this.colors.filter(item => item.value).slice(0, 15);
	}

	get colorContainerLabel() {
		return this.i18nBundle.getText(COLORPALETTE_CONTAINER_LABEL);
	}

	get colorPaleteMoreColorsText() {
		return this.i18nBundle.getText(COLOR_PALETTE_MORE_COLORS_TEXT);
	}

	get _showMoreColors() {
		return this.showMoreColors && this.moreColorsFeature;
	}

	get recentColors() {
		if (this._recentColors.length > 5) {
			this._recentColors = this._recentColors.slice(0, 5);
		}

		while (this._recentColors.length < 5) {
			this._recentColors.push("");
		}

		return this._recentColors;
	}

	async _getDialog() {
		const staticAreaItem = await this.getStaticAreaItemDomRef();
		return staticAreaItem.querySelector("[ui5-dialog]");
	}

	async getColorPicker() {
		const dialog = await this._getDialog();
		return dialog.content[0].querySelector("[ui5-color-picker]");
	}
}

ColorPalette.define();

export default ColorPalette;
