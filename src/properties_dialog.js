import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { AppChooserPage } from './app_chooser_page.js';
import { DetailsPage } from './details_page.js';
import { new_error_toast } from './error_toast.js';
import { IconUtils, SharedVars } from './utils.js';

export const PropertiesDialog = GObject.registerClass({
	GTypeName: 'PropertiesDialog',
	Template: 'resource:///io/github/flattool/Ignition/gtk/properties-dialog.ui',
	InternalChildren: [
		"toast_overlay",
			"navigation_view",
				"choice_page",
					"new_app_button",
					"new_script_button",
				"details_page",
				"app_chooser_page",
	],
}, class PropertiesDialog extends Adw.Dialog {
	show_details(auto_entry, is_new_file) {
		try {
			this._details_page.load_details(auto_entry, is_new_file);
			if (this._navigation_view.get_visible_page() !== this._details_page) {
				this._navigation_view.push(this._details_page);
			}
		} catch(error) {
			this._toast_overlay.add_toast(
				new_error_toast(this, _("Error loading details"), error)
			)
		}
	}

	present(auto_entry, ...args) {
		if (auto_entry) {
			this._navigation_view.animate_transitions = false;
			this.show_details(auto_entry, false);
			this._navigation_view.animate_transitions = true;
		} else {
			this._navigation_view.animate_transitions = false;
			this._navigation_view.pop_to_page(this._choice_page);
			this._navigation_view.animate_transitions = true;
		}
		super.present(...args);
	}

	constructor(...args) {
		super(...args);

		this._new_app_button.connect(`clicked`, () => this._navigation_view.push(this._app_chooser_page));
		this._new_script_button.connect(`clicked`, this.show_details.bind(this, null, true));
		this._app_chooser_page.signals.app_chosen.connect((auto_entry) => this.show_details(auto_entry, true));
		this._details_page.signals.cancel_pressed.connect(() => this.close());
	}
});
