import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { IconUtils, run_async } from './utils.js';

export const AppChooserPage = GObject.registerClass({
	GTypeName: 'AppChooserPage',
	Template: 'resource:///io/github/flattool/Ignition/gtk/app-chooser-page.ui',
	InternalChildren: [
		"search_button",
		"search_bar",
			"search_entry",
		"apps_list_box",
	],
}, class AppChooserPage extends Adw.NavigationPage {
	get_host_apps(callback) {
		const host_app_dirs = [
			Gio.File.new_for_path( // distro apps 1
				"/run/host/usr/local/share/applications"
			),
			Gio.File.new_for_path( // distro apps 2
				"/run/host/usr/share/applications",
			),
			Gio.File.new_for_path( //snaps
				"/var/lib/snapd/desktop/applications"
			),
			Gio.File.new_for_path( // system flatpaks
				"/var/lib/flatpak/exports/share/applications"
			),
			Gio.File.new_for_path(( // user flatpaks
				GLib.getenv("HOST_XDG_DATA_HOME")
				|| GLib.get_home_dir()
			) + "/.local/share/flatpak/exports/share/applications"),
		];
		const dirs_with_enumerators = [];
		for (const file of host_app_dirs) {
			if (!file.query_exists(null)) {
				continue;
			}
			dirs_with_enumerators.push(
				{
					path: file.get_path(),
					enumerator: file.enumerate_children(
						'standard::*', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null
					),
				}
			);
		}
		const apps = [];
		if (dirs_with_enumerators.length === 0) {
			callback(apps);
			return;
		}
		let index = 0;
		let dir_with_enumerator = dirs_with_enumerators[index];
		const iteration = () => {
			const path = dir_with_enumerator.path;
			const enumerator = dir_with_enumerator.enumerator;
			const info = enumerator.next_file(null);
			if (info === null) {
				index += 1;

				// Stop the loop when there are no more dirs left
				if (index >= dirs_with_enumerators.length) {
					return false;
				}

				// Skip this iteration so the next one gets the next enumerator
				dir_with_enumerator = dirs_with_enumerators[index];
				return true;
			}
			if (!info.get_name().endsWith(".desktop")) {
				// Skip this iteration if the file is not a .desktop file
				return true;
			}
			const kf = new GLib.KeyFile();
			kf.load_from_file(
				`${path}/${info.get_name()}`,
				GLib.KeyFileFlags.KEEP_TRANSLATIONS,
			)
			apps.push(kf);
			return true;
		}
		run_async(iteration, () => {
			callback(apps);
		});
	}

	constructor(...args) {
		super(...args);
	}
});
