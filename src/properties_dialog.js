import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { AppChooserPage } from './app_chooser_page.js';
import { new_error_toast } from './error_toast.js';
import { SharedVars } from './utils.js';

export const PropertiesDialog = GObject.registerClass({
	GTypeName: 'PropertiesDialog',
	Template: 'resource:///io/github/flattool/Ignition/gtk/properties-dialog.ui',
	InternalChildren: [
		"toast_overlay",
			"navigation_view",
				"details_page",
					"cancel_button",
					"apply_button",
					"enabled_row",
					"name_row",
					"comment_row",
					"icon_row",
					"exec_row",
					"terminal_row",
					"trash_row",
				"app_chooser_page",
		"choose_menu",
			"choose_list_box",
				"choose_app",
				"choose_script",
	],
}, class PropertiesDialog extends Adw.Dialog {
	load_properties(entry) {
		if (entry && this.entry) {
			this.entry.signals.file_saved.disconnect(this.on_file_saved);
			this.entry.signals.file_save_failed.disconnect(this.on_file_save_failed);
		}
		this.entry = entry;
		this.on_file_save_failed = (error) => {
			this._toast_overlay.add_toast(
				new_error_toast(this, _("Could not apply details"), `${error}`)
			);
		};
		this.on_file_saved = () => {
			SharedVars.main_window._toast_overlay.add_toast(
				new Adw.Toast({
					title: _(`Details applied for ${this._name_row.text}`)
				})
			);
			this.close();
		};

		this.entry.signals.file_saved.connect(this.on_file_saved);
		this.entry.signals.file_save_failed.connect(this.on_file_save_failed);

		this._enabled_row.active = entry.enabled;
		this._name_row.text = entry.name;
		this._comment_row.text = entry.comment;
		this._icon_row.text = entry.icon;
		this._exec_row.text = entry.exec;
		this._terminal_row.active = entry.terminal;
	}

	on_apply() {
		if (this.entry === undefined) {
			return;
		}
		if (this.invalid_entries.size > 0) {
			this._toast_overlay.add_toast(new Adw.Toast({
				title: _("Please fill in all details"),
			}));
			return;
		}
		this.entry.enabled = this._enabled_row.active;
		this.entry.name = this._name_row.text;
		this.entry.comment = this._comment_row.text;
		this.entry.icon = this._icon_row.text;
		this.entry.exec = this._exec_row.text;
		this.entry.terminal = this._terminal_row.active;
		SharedVars.main_window.dir_watch.sleep();
		this.entry.save();
	}

	validate_text(row) {
		if (row.text.length > 0) {
			this.invalid_entries.delete(row, 1);
		} else {
			this.invalid_entries.add(row);
		}
		if (this.invalid_entries.size === 0) {
			this._apply_button.sensitive = true;
			this._apply_button.tooltip_text = "";
		} else {
			this._apply_button.sensitive = false;
			this._apply_button.tooltip_text = _("Please fill in all details");
		}
		
	}

	present(keyfile, parent_window) {
		this.is_open = true;
		this.load_properties(keyfile);
		super.present(parent_window);
	}

	entry; // AutostartEntry
	on_file_saved;
	on_file_save_failed;
	invalid_entries = new Set();
	is_open = false;

	constructor(...args) {
		super(...args);

		this._name_row.connect("changed", this.validate_text.bind(this));
		this._comment_row.connect("changed", this.validate_text.bind(this));
		this._icon_row.connect("changed", this.validate_text.bind(this));
		this._exec_row.connect("changed", this.validate_text.bind(this));
		this.connect("closed", () => {
			this._navigation_view.pop_to_page(this._details_page);
			this.is_open = false;
		})

		this._cancel_button.connect("clicked", () => { this.close() });
		this._apply_button.connect("clicked", this.on_apply.bind(this));
		this._choose_list_box.connect("row-activated", (_, row) => {
			this._choose_menu.popdown();
			switch (row) {
				case this._choose_app: {
					this._navigation_view.push(this._app_chooser_page);
				} break;
				case this._choose_script: {
					print("choose script");
				} break;
			}
		});
	}
});
