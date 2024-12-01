import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { IconUtils } from './utils.js';

export const EntryRow = GObject.registerClass({
	GTypeName: 'EntryRow',
	Template: 'resource:///io/github/flattool/Ignition/gtk/entry-row.ui',
	InternalChildren: [
		"prefix_icon",
		"enabled_label",
	],
}, class EntryRow extends Adw.ActionRow {
	load_details(entry) {
		this.entry = entry;
		const icon_key = entry.icon
		// This handles desktop entries that set their icon from a path
		//   Snap applications do this, so it's quite needed
		this._prefix_icon.set_from_paintable(
			IconUtils.get_paintable_for_path(icon_key)
			|| IconUtils.get_paintable_for_name(icon_key)
			|| IconUtils.get_paintable_for_name("ignition:application-x-executable-symbolic")
		);

		this.title = entry.name || "No Name Set";
		this.subtitle = entry.comment || "No comment set.";
		if (entry.enabled) {
			this._enabled_label.label = _("Enabled");
			this._enabled_label.remove_css_class("warning");
			this._prefix_icon.opacity = 1;
		} else {
			this._enabled_label.label = _("Disabled");
			this._enabled_label.add_css_class("warning");
			this._prefix_icon.opacity = 0.4;
		}
	}

	entry; // Autostart Entry

	constructor(entry, ...args) {
		super(...args);

		entry.signals.file_saved.connect(this.load_details.bind(this));
		this.load_details(entry);
	}
});
