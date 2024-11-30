import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import { KeyFileUtils, Signal, SharedVars } from './utils.js';

export class AutostartEntry {
	get name() {
		return KeyFileUtils.get_string_safe(this.keyfile, true, "Desktop Entry", "Name", "");
	}

	get comment() {
		return KeyFileUtils.get_string_safe(this.keyfile, true, "Desktop Entry", "Comment", "");
	}

	get exec() {
		return KeyFileUtils.get_string_safe(this.keyfile, false, "Desktop Entry", "Exec", "");
	}

	get terminal() {
		return KeyFileUtils.get_boolean_safe(this.keyfile, "Desktop Entry", "Terminal", false);
	}

	get enabled() {
		return ! KeyFileUtils.get_boolean_safe(this.keyfile, "Desktop Entry", "Hidden", false);
	}

	get icon() {
		return KeyFileUtils.get_string_safe(this.keyfile, false, "Desktop Entry", "Icon", "");
	}

	set name(value) {
		this.keyfile.set_locale_string("Desktop Entry", "Name", this.locale, value);
	}

	set comment(value) {
		this.keyfile.set_locale_string("Desktop Entry", "Comment", this.locale, value);
	}

	set exec(value) {
		this.keyfile.set_string("Desktop Entry", "Exec", value);
	}

	set terminal(value) {
		this.keyfile.set_boolean("Desktop Entry", "Terminal", value);
	}

	set enabled(value) {
		this.keyfile.set_boolean("Desktop Entry", "Hidden", ! value);
	}

	set icon(value) {
		this.keyfile.set_string("Desktop Entry", "Icon", value);
	}

	save() {
		if (!Gio.File.new_for_path(this.path).query_exists(null)) {
			this.path = SharedVars.autostart_path + this.name + ".desktop";
		}
		try {
			// Add key values that might be missing, but won't be edited
			this.keyfile.set_int64("Desktop Entry", "X-GNOME-Autostart-Delay", 60);
			this.keyfile.set_string("Desktop Entry", "Type", "Application");

			this.keyfile.save_to_file(this.path);
			this.signals.file_saved.emit();
		} catch (error) {
			this.signals.file_save_failed.emit(error);
		}
	}

	trash() {
		Gio.File.new_for_path(this.path).trash_async(
			GLib.PRIORITY_DEFAULT_IDLE, null,
			(file, result) => {try {
				const did_trash = file.trash_finish(result);
				this.signals.file_trashed.emit(null);
			} catch (error) {
				this.signals.file_trash_failed.emit(error);
			}},
		);
	}

	path;
	keyfile = new GLib.KeyFile({});
	locale = "en_US";
	signals = {
		file_saved: new Signal(),
		file_save_failed: new Signal(),
		file_trashed: new Signal(),
		file_trash_failed: new Signal(),
	};

	constructor(path) {
		this.path = path;
		if (Gio.File.new_for_path(path).query_exists(null)) {
			try {
				this.keyfile.load_from_file(this.path, GLib.KeyFileFlags.KEEP_TRANSLATIONS);

				// This will error if the Type key isn't found,
				//    and will raise a new error if the type
				//    isn't "Application" (needed for executing)
				if (this.keyfile.get_string("Desktop Entry", "Type") !== "Application") {
					throw new Error("Desktop Entry is not of type Application");
				}
				try {
					this.locale = this.keyfile.get_locale_for_key("Desktop Entry", "Name", null) || "en_US";
				} catch (error) {
					print(error);
				}
			} catch (error) {
				print("\nERROR! loading keyfile file:");
				print(error);
			}
		}
	}
}
