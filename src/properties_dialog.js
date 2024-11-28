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

	entry; // AutostartEntry
	on_file_saved;
	on_file_save_failed;

	constructor(...args) {
		super(...args);

		this._cancel_button.connect("clicked", () => { this.close() });
		this._apply_button.connect("clicked", this.on_apply.bind(this));
	}
});
