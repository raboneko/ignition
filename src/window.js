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
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { SharedVars } from './utils.js';

export const IgnitionWindow = GObject.registerClass({
	GTypeName: 'IgnitionWindow',
	Template: 'resource:///io/github/flattool/Ignition/gtk/window.ui',
	InternalChildren: [
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
		this._stack.visible_child = this._first_run_status;
		this._get_started_button.connect("clicked", () => {
			this.setup();
		})
	}

	setup() {
		print(SharedVars.autostart_dir);
		this._stack.visible_child = this._loading_status;
		this._stack.transition_type = Gtk.StackTransitionType.NONE;
	}

	settings;
	entries = [];

	constructor(application) {
		super({ application });
		this.settings = Gio.Settings.new("io.github.flattool.Ignition");
		if (this.settings.get_boolean("first-run")) {
			this._stack.transition_type = Gtk.StackTransitionType.SLIDE_LEFT;
			this.on_first_run();
		} else {
			this.setup();
		}
	}
});

