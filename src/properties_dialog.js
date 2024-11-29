import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { AppChooserPage } from './app_chooser_page.js';

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
		this.on_file_saved = () => {
			this.close();
		};
		this.on_file_save_failed = (error) => {
			print(error);
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
		this.entry.enabled = this._enabled_row.active;
		this.entry.name = this._name_row.text;
		this.entry.comment = this._comment_row.text;
		this.entry.icon = this._icon_row.text;
		this.entry.exec = this._exec_row.text;
		this.entry.terminal = this._terminal_row.active;
		this.entry.save();
	}

	validate_text(row) {
		if (row.text.length > 0) {
			this.invalid_entries.remove_by_value(row);
		} else {
			this.invalid_entries.push(row);
			this._apply_button.set_sensitive(false);
		}
		if (this.invalid_entries.length === 0) {
			this._apply_button.sensitive = true;
			this._apply_button.tooltip_text = "";
		} else {
			this._apply_button.sensitive = false;
			this._apply_button.tooltip_text = _("Please fill in all details.");
		}
		
	}

	entry; // AutostartEntry
	on_file_saved;
	on_file_save_failed;
	invalid_entries = [];

	constructor(...args) {
		super(...args);

		this.invalid_entries.remove_by_value = function(val) {
			for (let i = 0; i < this.length; i += 1) {
				if (this[i] === val) {
					this.splice(i, 1);
					i -= 1;
				}
			}
		}

		this._name_row.connect("changed", this.validate_text.bind(this));
		this._comment_row.connect("changed", this.validate_text.bind(this));
		this._icon_row.connect("changed", this.validate_text.bind(this));
		this._exec_row.connect("changed", this.validate_text.bind(this));

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
