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
		"switch",
	],
}, class EntryRow extends Adw.ActionRow {
	entry; // AutostartEntry

	load_details() {
		const icon_key = this.entry.icon
		// This handles desktop entries that set their icon from a path
		//   Snap applications do this, so it's quite needed
		this._prefix_icon.set_from_paintable(
			IconUtils.get_paintable_for_path(icon_key)
			|| IconUtils.get_paintable_for_name(icon_key)
			|| IconUtils.get_paintable_for_name("ignition:application-x-executable-symbolic")
		);

		this.title = this.entry.name || "No Name Set";
		this.subtitle = this.entry.comment || "No comment set.";
		this._switch.active = this.entry.enabled;
	}

	constructor(entry, ...args) {
		super(...args);

		this.entry = entry;
		this.entry.signals.file_saved.connect(this.load_details.bind(this));

		this.load_details();
	}
});
