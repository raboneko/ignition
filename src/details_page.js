import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import { Signal } from './utils.js';

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
		"trash_group",
			"trash_row",
		"choose_menu",
			"choose_list_box",
				"choose_app",
				"choose_script",
	],
}, class DetailsPage extends Adw.NavigationPage {
	load_details(auto_entry) {
		const is_new = auto_entry === null;
		this.can_pop = is_new;
		this._cancel_button.visible = !is_new;
	}

	signals = {
		cancel_pressed: new Signal(),
	}

	is_new = false;
	auto_entry;

	constructor(...args) {
		super(...args);

		this._cancel_button.connect("clicked", () => {
			this.signals.cancel_pressed.emit(null);
		});
	}
});
