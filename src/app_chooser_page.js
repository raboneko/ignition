import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { IconUtils } from './utils.js';

export const AppChooserPage = GObject.registerClass({
	GTypeName: 'AppChooserPage',
	Template: 'resource:///io/github/flattool/Ignition/gtk/app-chooser-page.ui',
	InternalChildren: [
	],
}, class AppChooserPage extends Adw.NavigationPage {
	constructor(...args) {
		super(...args);
	}
});
