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
	show_apps() {
		this._navigation_view.push(this._app_chooser_page);
	}

	show_details(auto_entry, is_new) {
		try {
			this._details_page.load_details(auto_entry);
			if (is_new) {
				this._navigation_view.push(this._details_page);
			} else if(this._navigation_view.get_visible_page() !== this._details_page) {
				this._navigation_view.animate_transitions = false;
				this._navigation_view.push(this._details_page);
				this._navigation_view.animate_transitions = true;
			}

			// this._details_page.load_details(auto_entry);
			
			// if ((!is_new) && this._navigation_view.get_visible_page() !== this._details_page) {
			// 	this._navigation_view.animate_transitions = false;
			// 	this._navigation_view.push(this._details_page);
			// 	this._navigation_view.animate_transitions = true;
			// } else if (is_new) {
			// 	this._navigation_view.push(this._details_page);
			// }
		} catch (error) {
			this._toast_overlay.add_toast(new_error_toast(
				SharedVars.main_window,
				_("Could not load details"),
				error,
			));
		}
	}

	present(auto_entry=null, ...args) {
		super.present(...args);
		if (auto_entry) {
			// Showing an existing entry
			this.show_details(auto_entry, false);
		} else {
			// Showing a new entry
			this._navigation_view.animate_transitions = false;
			this._navigation_view.pop_to_page(this._choice_page);
			this._navigation_view.animate_transitions = true;
		}
	}

	constructor(...args) {
		super(...args);

		this._new_app_button.connect(`clicked`, this.show_apps.bind(this));
		this._new_script_button.connect(`clicked`, this.show_details.bind(this, null));
		this._details_page.signals.cancel_pressed.connect(() => this.close());
	}
});
