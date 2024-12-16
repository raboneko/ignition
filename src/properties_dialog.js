import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { AppChooserPage } from './app_chooser_page.js';
import { new_error_toast } from './error_toast.js';
import { IconUtils, SharedVars } from './utils.js';

export const PropertiesDialog = GObject.registerClass({
	GTypeName: 'PropertiesDialog',
	Template: 'resource:///io/github/flattool/Ignition/gtk/properties-dialog.ui',
	InternalChildren: [
		"toast_overlay",
			"navigation_view",
				"details_page",
					"cancel_button",
					"apply_button",
					"icon",
					"title_group",
					"enabled_row",
					"list_box",
						"name_row",
						"comment_row",
						"exec_row",
						"terminal_row",
						"clear_icon_group",
							"clear_icon_row",
						"trash_group",
							"trash_row",
				"app_chooser_page",
		"choose_menu",
			"choose_list_box",
				"choose_app",
				"choose_script",
	],
}, class PropertiesDialog extends Adw.Dialog {
	load_properties(entry) {
		this.icon_cleared = false;
		this._clear_icon_row.sensitive = true;
		this.is_new_file = Gio.File.new_for_path(entry.path).query_exists(null);
		if (this.is_new_file) {
			this._trash_group.visible = true;
			this._trash_row.tooltip_text = "";
		} else {
			this._trash_group.visible = false;
			this._trash_row.tooltip_text = _("This is a new file")
		}
		if (entry && this.entry) {
			this.entry.signals.file_saved.disconnect(this.on_file_saved);
			this.entry.signals.file_save_failed.disconnect(this.on_file_save_failed);
			this.entry.signals.file_trashed.disconnect(this.on_file_trashed);
			this.entry.signals.file_trash_failed.disconnect(this.on_file_trash_failed);
		}
		this.entry = entry;
		this.on_file_saved = () => {
			SharedVars.main_window._toast_overlay.add_toast(new Adw.Toast({
				title: _(`Details applied for ${this._name_row.text}`)
			}));
			SharedVars.main_window._entries_list_box.invalidate_sort();
			this.close();
		};
		this.on_file_save_failed = (error) => {
			this.last_toast = new_error_toast(this, _("Could not apply details"), `${error}`);
			this._toast_overlay.add_toast(this.last_toast);
		};
		this.on_file_trashed = () => {
			this.close();
		};
		this.on_file_trash_failed = (error) => {
			this.last_toast = new_error_toast(this, _("Could not trash entry"), `${error}`);
			this._toast_overlay.add_toast(this.last_toast);
		};

		this.entry.signals.file_saved.connect(this.on_file_saved);
		this.entry.signals.file_save_failed.connect(this.on_file_save_failed);
		this.entry.signals.file_trashed.connect(this.on_file_trashed);
		this.entry.signals.file_trash_failed.connect(this.on_file_trash_failed);

		this._enabled_row.active = entry.enabled;
		this._name_row.text = entry.name;
		this._comment_row.text = entry.comment;
		this._exec_row.text = entry.exec;
		this._terminal_row.active = entry.terminal;
		this.icon_value = this.entry.icon;

		this._title_group.title = this._name_row.text || _("Details");
		const paintable = (
			IconUtils.get_paintable_for_name(entry.icon, 45)
			|| IconUtils.get_paintable_for_path(entry.icon, 45)
		);
		if (paintable !== null) {
			this._icon.set_from_paintable(paintable);
			this._clear_icon_group.visible = true;
		} else {
			this._icon.icon_name = "ignition:application-x-executable-symbolic";
			this._clear_icon_group.visible = false;
		}

		this._details_page.title = (
			entry.name !== ""
			? _("%s Details").format(entry.name)
			: _("Details")
		);

		for (const row of this._list_box) {
			if (row.constructor !== Adw.EntryRow) {
				continue;
			}
			this.validate_text(row);
		}
	}

	on_apply() {
		if (this.entry === undefined) {
			return;
		}
		if (this.invalid_entries.size > 0) {
			this.last_toast = new Adw.Toast({
				title: _("Please fill in all details"),
			});
			this._toast_overlay.add_toast(this.last_toast);
			return;
		}
		this.entry.enabled = this._enabled_row.active;
		this.entry.name = this._name_row.text;
		this.entry.comment = this._comment_row.text;
		this.entry.icon = this.icon_value;
		this.entry.exec = this._exec_row.text;
		this.entry.terminal = this._terminal_row.active;
		print(this.icon_value)
		if (this.is_new_file) {
			SharedVars.main_window.dir_watch.sleep();
		}
		if (this.icon_cleared) {
			this.entry.icon = "";
		}
		this.entry.save();
	}

	validate_text(row) {
		if (row.text.length > 0) {
			this.invalid_entries.delete(row, 1);
		} else {
			this.invalid_entries.add(row);
		}
		if (this.invalid_entries.size === 0) {
			this._apply_button.sensitive = true;
			this._apply_button.tooltip_text = "";
		} else {
			this._apply_button.sensitive = false;
			this._apply_button.tooltip_text = _("Please fill in all details");
		}
		
	}

	present(entry, parent_window) {
		this.is_open = true;
		this.load_properties(entry);
		super.present(parent_window);
		this._enabled_row.grab_focus();
	}

	clear_icon() {
		this.icon_cleared = true;
		this._clear_icon_row.sensitive = false;
		this._icon.icon_name = "ignition:application-x-executable-symbolic";
		this._enabled_row.grab_focus();
	}

	entry; // AutostartEntry
	on_file_saved;
	on_file_save_failed;
	on_file_trashed;
	on_file_trash_failed;
	invalid_entries = new Set();
	is_open = false;
	is_new_file = false;
	icon_cleared = false;
	icon_value = "";

	// Last error toast, if any. This will be dismissed on close
	//   to prevent it from showing again on a new open event
	last_toast = null;

	constructor(...args) {
		super(...args);

		this._name_row.connect("changed", () => {
			this._title_group.title = this._name_row.text || _("Details");
			this.validate_text(this._name_row);
		});
		this._name_row.connect("entry-activated", this.on_apply.bind(this));
		this._comment_row.connect("changed", this.validate_text.bind(this));
		this._comment_row.connect("entry-activated", this.on_apply.bind(this));
		this._exec_row.connect("changed", this.validate_text.bind(this));
		this._exec_row.connect("entry-activated", this.on_apply.bind(this));

		this.connect("closed", () => {
			this._navigation_view.pop_to_page(this._details_page);
			this.invalid_entries.clear();
			if (this.last_toast !== null) {
				this.last_toast.dismiss();
			}
			this.is_open = false;
		});

		this._app_chooser_page.signals.app_chosen.connect((entry) => {
			entry.path = this.entry.path;
			entry.signals.file_saved.connections = this.entry.signals.file_saved.connections;
			this.entry.signals.file_saved.connections = [];
			this.entry = entry;
			this.load_properties(entry);
			this._enabled_row.active = true;
			this._terminal_row.active = false;
			this._navigation_view.pop_to_page(this._details_page);
		});

		this._app_chooser_page.signals.loading_finished.connect((success) => {
			this._choose_app.visible = success;
		});

		this._cancel_button.connect("clicked", () => { this.close() });
		this._apply_button.connect("clicked", this.on_apply.bind(this));
		this._clear_icon_row.connect("activated", this.clear_icon.bind(this));
		this._trash_row.connect("activated", () => {
			this.entry.trash();
		});
		this._choose_list_box.connect("row-activated", (wdiget, row) => {
			this._choose_menu.popdown();
			switch (row) {
				case this._choose_app: {
					this._navigation_view.push(this._app_chooser_page);
				} break;
				case this._choose_script: {
					const accept_button = new Gtk.Button({ label: _("Open") });
					accept_button.add_css_class("suggested-action")
					const cancel_button = new Gtk.Button({ label: _("Cancel") });
					const filter = new Gtk.FileFilter({
						name: _("Executable Files"),
						mime_types: ['application/x-executable'],
					});
					const fcd = new Gtk.FileChooserDialog({
						select_multiple: false,
						modal: true,
						transient_for: SharedVars.main_window,
					});
					fcd.set_current_folder(SharedVars.home_dir);
					fcd.add_filter(filter);
					fcd.add_action_widget(accept_button, Gtk.ResponseType.ACCEPT);
					fcd.add_action_widget(cancel_button, Gtk.ResponseType.CANCEL);
					fcd.connect("response", (dialog, response) => {
						fcd.close();
						if (response === Gtk.ResponseType.ACCEPT) {
							const file = fcd.get_file();
							if (!file.query_info(
								"standard::is-executable",
								Gio.FileQueryInfoFlags.NONE,
								null,
							)) {
								return;
							}
							this._enabled_row.active = true;
							this._name_row.text = file.get_basename().replace(/\.[^/.]+$/, "");
							this._comment_row.text = "";
							this._exec_row.text = file.get_path();
							this._terminal_row.active = false;
							this.clear_icon();
						}
					});
					fcd.present();
				} break;
			}
		});
	}
});
