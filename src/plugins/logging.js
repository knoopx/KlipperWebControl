'use strict'

import { makeNotification } from './toast.js'

import i18n from '../i18n'
import { defaultMachine } from '../store/machine'

let store

export function log(type, title, message, hostname = store.state.selectedMachine) {
	makeNotification(type, title, message);
	store.commit(`machines/${hostname}/log`, { date: new Date(), type, title, message });
}

// eslint-disable-next-line
export function logCode(code = '', response, hostname = store.state.selectedMachine, fromInput = false) {
	if (!code && !response) {
		// Make sure there is something to log...
		return;
	}

	const ERROR_PREFIX = '!! '
	const INFO_PREFIX = '// '

	// Determine type
	let type = 'success', toLog = response;
	if (response.startsWith(ERROR_PREFIX)) {
		type = 'error';
		toLog = response.substr(ERROR_PREFIX.length);
	} else if (response.startsWith(INFO_PREFIX)) {
		type = 'info';
		toLog = response.substr(INFO_PREFIX.length);
	}

	// Log it
	const responseLines = toLog.split("\n")
	if (hostname === store.state.selectedMachine) {
		let title = code, message = responseLines.reduce((a, b) => `${a}<br>${b}`);
		if (responseLines.length > 3) {
			title = (code === '') ? i18n.t('notification.responseTooLong') : code;
			message = (code === '') ? '' : i18n.t('notification.responseTooLong');
		} else if (code === '') {
			title = responseLines[0];
			message = (responseLines.length > 1) ? responseLines.slice(1).reduce((a, b) => `${a}<br>${b}`) : '';
		}

		makeNotification(type, title, message);
	}
	store.commit(`machines/${hostname}/log`, { date: new Date(), type, title: code, message: response });
}

export function logGlobal(type, title, message) {
	if (store.state.selectedMachine !== defaultMachine) {
		log(type, title, message);
	} else {
		makeNotification(type, title, message);
	}
	store.commit(`machines/${defaultMachine}/log`, { date: new Date(), type, title, message });
}

export default {
	install(Vue) {
		Vue.prototype.$log = log;
		Vue.prototype.$logCode = logCode;
		Vue.prototype.$logGlobal = logGlobal;
	},

	installStore(storeInstance) {
		store = storeInstance;
	}
}
