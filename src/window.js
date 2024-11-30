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
import { DirWatcher } from './file_watcher.js';

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
				"entries_clamp",
					"entries_group",
						"group_new_button",
					"entries_list_box",
					"disabled_group",
						"enable_all_button",
					"disabled_list_box",
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
		const enumerator = SharedVars.autostart_dir.enumerate_children(
			'standard::*',
			Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
			null
		);
		run_async(
			() => {
				const file = enumerator.next_file(null);
				if (file === null) {
					// stop the loop when there are no more files
					return false;
				}
				const path = SharedVars.autostart_path + file.get_name();
				let entry;
				try {
					entry = new AutostartEntry(path);
				} catch (error) {
					print("\n\nError loading autostart entry from file:");
					print("  path:", path);
					print("  error:", error, "\n\n");
					return true; // skip this iteration
				}
				const row = new EntryRow(entry, { title: "Test" });
				row.connect("activated", () => {
					this.properties_dialog.present(entry, this);
				});
				this.enabled_rows.push(row);
				(entry.enabled
					? this._entries_list_box
					: this._disabled_list_box
				).append(row);
				return true; // continue the loop
			},
			() => {
				this.properties_dialog._app_chooser_page.get_host_apps(
					this.on_load_finish.bind(this)
				)
			}
		);
	}

	on_load_finish() {
		if (this.enabled_rows.length > 0 || this.disabled_rows.length > 0) {
			this._stack.set_visible_child(this._entries_clamp);
			this._search_button.sensitive = true;
		} else {
			this._stack.set_visible_child(this._no_entries_status);
		}
	}

	reload() {
		this._search_button.sensitive = false;
		this._search_button.active = false;
		this._entries_list_box.remove_all();
		this._disabled_list_box.remove_all();
		this.enabled_rows.length = 0;
		this.disabled_rows.length = 0;
		this.properties_dialog.close();
		this.setup();
		this._toast_overlay.add_toast(new Adw.Toast({
			title: _("Reloaded due to a change in the folder")
		}));
	}

	on_new_entry() {
		this.properties_dialog.present(new AutostartEntry(""), this);
	}

	settings;
	enabled_rows = [];
	disabled_rows = [];
	properties_dialog = new PropertiesDialog();
	dir_watch = new DirWatcher(SharedVars.autostart_dir, 500);

	constructor(application) {
		super({ application });
		this.settings = Gio.Settings.new("io.github.flattool.Ignition");

		this.dir_watch.event.connect(this.reload.bind(this));

		if (this.settings.get_boolean("first-run")) {
			this.on_first_run();
		} else {
			this.setup();
		}

		this._no_entries_new_button.connect("clicked", this.on_new_entry.bind(this));
		this._group_new_button.connect("clicked", this.on_new_entry.bind(this));
		this._entries_list_box.set_sort_func((row1, row2) => {
			return row1.title.toLowerCase() > row2.title.toLowerCase();
		});
		this._search_entry.connect("search-changed", (entry) => {
			let total_visible = 0;
			const text = entry.text.toLowerCase();
			for (const row of this.enabled_rows) {
				if (
					row.title.toLowerCase().includes(text)
					|| row.subtitle.toLowerCase().includes(text)
				) {
					row.visible = true;
					total_visible += 1;
				} else {
					row.visible = false;
				}
			}
			if (total_visible === 0) {
				this._stack.visible_child = this._no_results_status
			} else if (this.enabled_rows.length === 0 && this.disabled_rows.length === 0) {
				this._stack.visible_child = this._no_entries_status
			} else {
				this._stack.visible_child = this._entries_clamp
			}
		});
	}
});
