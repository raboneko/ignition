import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';



const keyfile_tryer = (func) => {
	try {
		return func() || null;
	} catch (error) {
		print(error);
		return null;
	}
}
export class KeyFileUtils {
	static get_string_safe(keyfile, use_locale, group, key, fallback) {
		const func = (use_locale
			? keyfile.get_locale_string.bind(keyfile, group, key, null)
			: keyfile.get_string.bind(keyfile, group, key)
		)
		return keyfile_tryer(func) || fallback;
	}

	static get_boolean_safe(keyfile, group, key, fallback) {
		const func = keyfile.get_boolean.bind(keyfile, group, key);
		return keyfile_tryer(func) || fallback;
	}

	static get_int64_safe(keyfile, group, key, fallback) {
		const func = keyfile.get_int64.bind(keyfile, group, key);
		return keyfile_tryer(func) || fallback;
	}
}



const home_path = GLib.get_home_dir();
const autostart_path = (GLib.getenv("HOST_XDG_CONFIG_HOME") || `${home_path}/.config`) + "/autostart/";
const autostart_dir = Gio.File.new_for_path(autostart_path);
export class SharedVars {
	static get autostart_path() {
		return autostart_path;
	}

	static get autostart_dir() {
		return autostart_dir;
	}

	static main_window = null; // set in main
}



let host_icon_theme = null; // set in the get host_icon_theme func
export class IconUtils {
	static get host_icon_theme() {
		if(host_icon_theme === null) {
			host_icon_theme = Gtk.IconTheme.get_for_display(SharedVars.main_window.get_display());
			host_icon_theme.add_search_path("/run/host/usr/share/icons");
			host_icon_theme.add_search_path("/run/host/usr/share/pixmaps");
			host_icon_theme.add_search_path((GLib.getenv("HOST_XDG_DATA_HOME") || home_path) + "/.local/share/flatpak/exports/share/applications");
			host_icon_theme.add_search_path("/var/lib/flatpak/exports/share/icons");
		}
		return host_icon_theme;
	}

	static get_paintable_for_path(path) {
		const file = Gio.File.new_for_path(path);
		if (file.query_exists(null)) {
			return Gtk.IconPaintable.new_for_file(image_file, 512, 1);
		}
		return null;
	}

	static get_paintable_for_name(name) {
		return this.host_icon_theme.lookup_icon(name, null, 512, 1, null, 0);
	}
}



export class Signal {
	emit() {
		for (const func of this.connections) {
			func(this.object);
		}
	}

	connect(func) {
		this.connections.push(func);
	}

	object;
	connections = [];

	constructor(object) {
		this.object = object;
	}
}



export const run_async = (to_run, when_done) => {
	GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
		const should_continue = to_run();
		if (should_continue) {
			return GLib.SOURCE_CONTINUE;
		}

		when_done();
		return GLib.SOURCE_REMOVE;
	});
};
