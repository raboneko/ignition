import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { IconUtils, KeyFileUtils } from './utils.js';

export const AppRow = GObject.registerClass({
	GTypeName: 'AppRow',
	Template: 'resource:///io/github/flattool/Ignition/gtk/app-row.ui',
	InternalChildren: [
		"prefix_icon",
	],
}, class AppRow extends Adw.ActionRow {
	load_details() {
		const icon_key = KeyFileUtils.get_string_safe(this.keyfile, false, "Desktop Entry", "Icon", " ");
		// This handles desktop entries that set their icon from a path
		//   Snap applications do this, so it's quite needed
		this._prefix_icon.set_from_paintable(
			IconUtils.get_paintable_for_path(icon_key)
			|| IconUtils.get_paintable_for_name(icon_key)
			|| IconUtils.get_paintable_for_name("ignition:application-x-executable-symbolic")
		);

		this.title = KeyFileUtils.get_string_safe(
			this.keyfile, true, "Desktop Entry", "Name", "",
		);
		this.subtitle = KeyFileUtils.get_string_safe(
			this.keyfile, true, "Desktop Entry", "Comment", "",
		)
	}

	keyfile;

	constructor(keyfile, ...args) {
		super(...args);
		this.keyfile = keyfile;

		// Skip apps that are hidden or otherwise not shown
		if (
			KeyFileUtils.get_boolean_safe(this.keyfile, "Desktop Entry", "Hidden", false)
			|| KeyFileUtils.get_boolean_safe(this.keyfile, "Desktop Entry", "NoDisplay", false)
		) {
			throw new Error("App is hidden");
		}

		this.load_details();
	}
});
