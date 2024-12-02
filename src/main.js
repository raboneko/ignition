/* main.js
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
import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';

import { IgnitionWindow } from './window.js';
import { SharedVars } from './utils.js';
import { new_error_toast } from './error_toast.js';

pkg.initGettext();
pkg.initFormat();

export const IgnitionApplication = GObject.registerClass(
	class IgnitionApplication extends Adw.Application {
		constructor() {
			super({application_id: 'io.github.flattool.Ignition', flags: Gio.ApplicationFlags.DEFAULT_FLAGS});

			const quit_action = new Gio.SimpleAction({name: 'quit'});
			quit_action.connect('activate', action => {
				this.quit();
			});
			this.add_action(quit_action);
			this.set_accels_for_action('app.quit', ['<primary>q']);

			const open_folder_action = new Gio.SimpleAction({name: 'open-folder'});
			open_folder_action.connect('activate', action => {
				const launcher = new Gtk.FileLauncher({
					file: SharedVars.autostart_dir,
				});
				launcher.launch(this.active_window, null, (lnch, result) => {
					try {
						const did_open = launcher.launch_finish(result);
						this.active_window._toast_overlay.add_toast(
							new Adw.Toast({
								title: _("Opened folder"),
							}),
						);
					} catch (error) {
						this.active_window._toast_overlay.add_toast(
							new_error_toast(
								this.active_window,
								_("Could not open folder"),
								`Path: ${SharedVars.autostart_dir}\n${error}`,
							),
						);
					}
				});
			});
			this.add_action(open_folder_action);
			this.set_accels_for_action('app.open-folder', ['<primary>o']);

			const show_about_action = new Gio.SimpleAction({name: 'about'});
			show_about_action.connect('activate', action => {
				let aboutParams = {
					application_name: 'ignition',
					application_icon: 'io.github.flattool.Ignition',
					developer_name: 'Heliguy',
					version: '0.1.0',
					developers: [
						"Heliguy https://github.com/heliguy4599",
					],
					// Translators: Replace "translator-credits" with your name/username, and optionally an email or URL.
					translator_credits: _("translator-credits"),
					copyright: '© 2024 Heliguy',
					license_type: Gtk.License.GPL_3_0,
					website: "https://github.com/flattool/ignition",
					support_url: "https://matrix.to/#/#warehouse-development:matrix.org",
					issue_url: "https://github.com/flattool/ignition/issues",
				};
				const aboutDialog = new Adw.AboutDialog(aboutParams);
				aboutDialog.add_link(_("Donate"), "https://ko-fi.com/heliguy")
				aboutDialog.present(this.active_window);
			});
			this.add_action(show_about_action);

			const search_action = new Gio.SimpleAction({name: 'search'});
			search_action.connect('activate', action => {
				const dialog = this.active_window.properties_dialog
				if (dialog.is_open && dialog._app_chooser_page._search_button.sensitive) {
					dialog._app_chooser_page._search_button.active = !dialog._app_chooser_page._search_button.active;
				} else if (!dialog.is_open && this.active_window._search_button.sensitive) {
					this.active_window._search_button.active = !this.active_window._search_button.active;
				}
			});
			this.add_action(search_action);
			this.set_accels_for_action('app.search', ['<primary>f']);
		}

		vfunc_activate() {
			let {active_window} = this;

			if (!active_window)
				active_window = new IgnitionWindow(this);

			SharedVars.main_window = active_window;
			active_window.present();
		}
	}
);

export function main(argv) {
	const application = new IgnitionApplication();
	return application.runAsync(argv);
}
