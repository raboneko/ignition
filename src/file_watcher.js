import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { Signal } from './utils.js';

// This class exists purely because the regular FileMonitor sends many events when
//   a file's contents are changed, instead of just one.
export class DirWatcher {
	monitor;
	event = new Signal();
	last_event = 0; // This will become the new Date.now upon event
	rate_limit_ms;

	sleep() {
		this.last_event = Date.now();
	}

	constructor(file, rate_limit_ms) {
		this.rate_limit_ms = rate_limit_ms;
		this.monitor = file.monitor_directory(Gio.FileMonitorFlags.NONE, null);
		this.monitor.connect("changed", () => {
			const now = Date.now();
			if (Date.now() - this.last_event > rate_limit_ms) {
				this.last_event = now;
				this.event.emit(null);
			}
		});
	}
}
