import GLib from 'gi://GLib';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

export const new_error_toast = (window, _title, message) => {
	const label = new Gtk.Label({
		selectable: true,
		wrap: true,
	});
	label.set_markup(`<tt>${GLib.markup_escape_text(`${message}`, -1)}</tt>`)
	const error_dialog = new Adw.AlertDialog({
		heading: _title,
		extra_child: label,
	});
	error_dialog.add_response("copy", _("Copy"));
	error_dialog.add_response("ok", _("OK"));
	error_dialog.connect("response", (_, response) => {
		if (response !== "copy") {
			return;
		}
		const clipboard = Gdk.Display.get_default().get_clipboard();
		clipboard.set(message);
	})
	const toast = new Adw.Toast({
		title: _title,
		button_label: _("Details"),
	});
	toast.connect("button-clicked", () => {
		error_dialog.present(window);
	});
	return toast;
}
