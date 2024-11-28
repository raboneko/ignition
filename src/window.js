/* window.js
 *
 * Copyright 2024 Heliguy
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { SharedVars, run_async } from './utils.js';
import { AutostartEntry } from './autostart_entry.js';
import { EntryRow } from './entry_row.js';
import { PropertiesDialog } from './properties_dialog.js';

export const IgnitionWindow = GObject.registerClass({
	GTypeName: 'IgnitionWindow',
	Template: 'resource:///io/github/flattool/Ignition/gtk/window.ui',
	InternalChildren: [
		"search_button",
		"search_bar",
			"search_entry",
		"toast_overlay",
			"stack",
				"first_run_status",
					"get_started_button",
				"loading_status",
				"no_entries_status",
					"no_entries_new_button",
				"no_results_status",
				"entries_page",
					"entries_group",
						"group_new_button",
	],
}, class IgnitionWindow extends Adw.ApplicationWindow {
	on_first_run() {
		this.settings.set_boolean("first-run", false);
		this._stack.visible_child = this._first_run_status;
		this._stack.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
		this._get_started_button.connect("clicked", () => {
			this.setup();
		})
	}

	setup() {
		this._stack.visible_child = this._loading_status;
		this._stack.transition_type = Gtk.StackTransitionType.NONE;
		this.load_autostart_entries();
	}

	load_autostart_entries() {
		const enumerator = SharedVars.autostart_dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
		run_async(
			() => {
				const file = enumerator.next_file(null);
				if (file === null) {
					// stop the loop when there are no more files
					return false;
				}
				const path = SharedVars.autostart_path + file.get_name();
				const entry = new AutostartEntry(path);
				const row = new EntryRow(entry, { title: "Test" });
				row.connect("activated", () => {
					this.properties_dialog.load_properties(entry);
					this.properties_dialog.present(this);
				});
				this.rows.push(row);
				this._entries_group.add(row);
				return true; // continue the loop
			},
			this.on_load_finish.bind(this),
		);
	}

	on_load_finish() {
		if (this.rows.length > 0 ) {
			this._stack.set_visible_child(this._entries_page);
			this._search_button.sensitive = true;
		} else {
			this._stack.set_visible_child(this._no_entries_status);
		}
	}

	on_new_entry() {
		this.properties_dialog.load_properties(new AutostartEntry(""));
		this.properties_dialog.present(this);
	}

	settings;
	rows = [];
	properties_dialog = new PropertiesDialog();

	constructor(application) {
		super({ application });
		this.settings = Gio.Settings.new("io.github.flattool.Ignition");

		if (this.settings.get_boolean("first-run")) {
			this.on_first_run();
		} else {
			this.setup();
		}

		this._no_entries_new_button.connect("clicked", this.on_new_entry.bind(this));
		this._group_new_button.connect("clicked", this.on_new_entry.bind(this));
	}
});

