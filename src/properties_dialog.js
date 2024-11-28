import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

export const PropertiesDialog = GObject.registerClass({
	GTypeName: 'PropertiesDialog',
	Template: 'resource:///io/github/flattool/Ignition/gtk/properties-dialog.ui',
	InternalChildren: [
		"toast_overlay",
			"navigation_view",
				"details_page",
					"cancel_button",
					"apply_button",
					"name_row",
					"comment_row",
					"exec_row",
					"terminal_row",
					"enabled_row",
					"trash_row",
				// "app_chooser_page",
	],
}, class PropertiesDialog extends Adw.Dialog {
	load_properties(entry) {
		this.entry = entry;
		this._name_row.text = entry.name;
		this._comment_row.text = entry.comment;
		this._exec_row.text = entry.exec;
		this._terminal_row.active = entry.terminal;
		this._enabled_row.active = entry.enabled;
	}

	entry; // AutostartEntry

	constructor(...args) {
		super(...args);
	}
});
