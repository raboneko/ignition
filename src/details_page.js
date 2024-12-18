import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import { IconUtils, Signal } from './utils.js';

export const DetailsPage = GObject.registerClass({
	GTypeName: 'DetailsPage',
	Template: 'resource:///io/github/flattool/Ignition/gtk/details-page.ui',
	InternalChildren: [
		"cancel_button",
		"apply_button",
		"icon",
		"title_group",
		"enabled_row",
		"list_box",
			"name_row",
			"comment_row",
			"exec_row",
				"choose_button",
			"terminal_row",
		"action_group",
			"create_row",
			"trash_row",
	],
}, class DetailsPage extends Adw.NavigationPage {
	load_details(auto_entry, is_new_file) {
		this.auto_entry = auto_entry;
		this.can_pop = is_new_file;

		if (auto_entry) {
			IconUtils.set_icon(this._icon, auto_entry.icon);
			this._title_group.title = auto_entry.name;
			this._enabled_row.active = auto_entry.enabled;
			this._name_row.text = auto_entry.name;
			this._comment_row.text = auto_entry.comment;
			this._exec_row.text = auto_entry.exec;
			this._terminal_row.active = auto_entry.terminal;
		} else {
			this._icon.icon_name = "ignition:application-x-executable-symbolic";
			this._title_group.title = _("New Entry");
			this._enabled_row.active = true;
			this._name_row.text = "";
			this._comment_row.text = "";
			this._exec_row.text = "";
			this._terminal_row.active = false;
		}
	}

	validate_row(row) {
		if (row.text.trim().length > 0) {
			row.remove_css_class("error");
			this.invalid_rows.delete(row);
		} else {
			row.add_css_class("error");
			this.invalid_rows.add(row);
		}
		this._apply_button.sensitive = this.invalid_rows.size === 0;
		this._create_row.sensitive = this.invalid_rows.size === 0;
	}

	on_apply() {
		if (this._apply_button.sensitive) {
			print("can apply!");
		} else {
			print("cannot apply");
		}
	}

	on_trash() {
		if (this._trash_row.visible && this._trash_row.sensitive) {
			print("can trash!");
		} else {
			print("cannot trash");
		}
	}

	auto_entry;
	invalid_rows = new Set();
	signals = {
		cancel_pressed: new Signal(),
		apply_pressed: new Signal(),
		trash_pressed: new Signal(),
	}

	constructor(...args) {
		super(...args);

		// Extra item creation
		const event_controller = new Gtk.EventControllerKey();

		// Connections
		this._cancel_button.connect("clicked", this.signals.cancel_pressed.emit.bind(this.signals.cancel_pressed, null));
		this._apply_button.connect("clicked", this.on_apply.bind(this));
		this._create_row.connect("activated", this.on_apply.bind(this));
		this._name_row.connect("changed", this.validate_row.bind(this));
		this._name_row.connect("entry-activated", this.on_apply.bind(this));
		this._comment_row.connect("entry-activated", this.on_apply.bind(this));
		this._exec_row.connect("changed", this.validate_row.bind(this));
		this._exec_row.connect("entry-activated", this.on_apply.bind(this));
		// Allow pressing Escape to close the dialog, when we are
		//   presented as the first page, instead of a subpage
		event_controller.connect("key-pressed", (__, keyval) => {
			if (keyval === Gdk.KEY_Escape && !this.can_pop) {
				this.signals.cancel_pressed.emit(null);
			}
		});

		// Apply
		this.add_controller(event_controller);

	}
});
