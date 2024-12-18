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
import { Config } from './const.js';

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
				"entries_scrolled_window",
					"entries_group",
						"group_new_button",
					"entries_list_box",
	],
}, class IgnitionWindow extends Adw.ApplicationWindow {
	on_first_run() {
		this.settings.set_boolean("first-run", false);
		this._stack.visible_child = this._first_run_status;
		this._stack.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
		this._get_started_button.connect("clicked", this.setup(true).bind(this));
	}

	setup(should_load_host_apps) {
		this._stack.visible_child = this._loading_status;
		this._stack.transition_type = Gtk.StackTransitionType.NONE;
		this.load_autostart_entries(should_load_host_apps);
	}

	load_autostart_entries(should_load_host_apps) {
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
				if (!path.endsWith(".desktop")) {
					// skip this iteration if a file that isn't a desktop entry is found
					return true;
				}
				let entry;
				try {
					entry = new AutostartEntry(path);
				} catch (error) {
					print("\n\nError loading autostart entry from file:");
					print("  path:", path);
					print("  error:", error, "\n\n");
					return true; // skip this iteration
				}
				const row = new EntryRow(entry, true);
				row.connect("activated", () => {
					this.properties_dialog.present(row.entry, this);
				});
				this.entry_rows.push(row);
				this._entries_list_box.append(row);
				return true; // continue the loop
			},
			(
				should_load_host_apps
				? () => { this.properties_dialog._app_chooser_page.get_host_apps(this.on_load_finish.bind(this)) }
				: this.on_load_finish.bind(this)
			),
		);
	}

	on_load_finish() {
		if (this.entry_rows.length > 0) {
			this._stack.set_visible_child(this._entries_scrolled_window);
			this._search_button.sensitive = true;
		} else {
			this._stack.set_visible_child(this._no_entries_status);
		}
	}

	reload() {
		this._search_button.sensitive = false;
		this._search_button.active = false;
		this._entries_list_box.remove_all();
		this.entry_rows.length = 0;
		this.properties_dialog.close();
		this.setup(false);
	}

	on_new_entry() {
		const current_page = this._stack.get_visible_child();
		if (
			current_page === this._loading_status
			|| current_page === this._first_run_status
		) return;
		this.properties_dialog.present(null, this);
	}

	settings;
	entry_rows = [];
	properties_dialog = new PropertiesDialog();
	dir_watch = new DirWatcher(SharedVars.autostart_dir, 500);

	constructor(application) {
		super({ application });
		this.settings = Gio.Settings.new("io.github.flattool.Ignition");

		if (Config.PROFILE === "development") {
			this.add_css_class("devel");
		}

		this.dir_watch.event.connect(this.reload.bind(this));

		if (this.settings.get_boolean("first-run")) {
			this.on_first_run();
		} else {
			this.setup(true);
		}

		this._no_entries_new_button.connect("clicked", this.on_new_entry.bind(this));
		this._group_new_button.connect("clicked", this.on_new_entry.bind(this));
		this._entries_list_box.set_sort_func((row1, row2) => {
			if (
				(row1.entry.enabled && row2.entry.enabled)
				|| ((!row1.entry.enabled) && (!row2.entry.enabled)) 
			) {
				return row1.title.toLowerCase() > row2.title.toLowerCase();
			} else {
				return row2.entry.enabled;
			}
		});
		this._search_entry.connect("search-changed", (entry) => {
			let total_visible = 0;
			const text = entry.text.toLowerCase();
			for (const row of this.entry_rows) {
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
				this._stack.visible_child = this._no_results_status;
			} else if (this.entry_rows.length === 0) {
				this._stack.visible_child = this._no_entries_status;
			} else {
				this._stack.visible_child = this._entries_scrolled_window;
			}
		});
	}
});
