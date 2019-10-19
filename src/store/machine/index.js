'use strict'

import { mapConnectorActions } from './connector'

import BaseConnector from './connector/BaseConnector.js'
import cache from './cache.js'
import model from './model.js'
import settings from './settings.js'

import i18n from '../../i18n'

import { displayTime } from '../../plugins/display.js'
import { log, logCode } from '../../plugins/logging.js'
import { makeFileTransferNotification, showMessage } from '../../plugins/toast.js'

import beep from '../../utils/beep.js'
import { DisconnectedError, CodeBufferError, OperationCancelledError } from '../../utils/errors.js'
import Path from '../../utils/path.js'

export const defaultMachine = '[default]'			// must not be a valid hostname

export function getModifiedDirectories(action, state) {
	const segments = action.type.split('/');
	if (segments.length === 3 && segments[1] === state.selectedMachine) {
		if (segments[2] === 'onDirectoryCreated' || segments[2] === 'onFileOrDirectoryDeleted') {
			return [Path.extractFilePath(action.payload)];
		}
		if (segments[2] === 'onFileUploaded') {
			return [Path.extractFilePath(action.payload.filename)];
		}
		if (segments[2] === 'onFileOrDirectoryMoved') {
			return [Path.extractFilePath(action.payload.from), Path.extractFilePath(action.payload.to)];
		}
	}
	return undefined;
}

export default function(hostname, connector) {
	return {
		namespaced: true,
		state: {
			events: [],								// provides machine events in the form of { date, type, title, message }
			isReconnecting: false
		},
		getters: {
			client: () => connector.axios,
			hasTemperaturesToDisplay: state => state.model.heat.heaters.length || state.settings.displayedExtraTemperatures.length,
			connector: () => connector ? connector.type : null
		},
		actions: {
			...mapConnectorActions(connector, ['disconnect', 'delete', 'move', 'makeDirectory', 'getFileList', 'getFileInfo']),

			// Reconnect after a connection error
			async reconnect({ commit }) {
				commit('setReconnecting', true);
				await connector.reconnect();
			},

			// Send a code and log the result (if applicable)
			// Parameter can be either a string or an object { code, (fromInput = false, log = true) }
			async sendCode(context, payload) {
				const code = (payload instanceof Object) ? payload.code : payload;
				const fromInput = (payload instanceof Object) ? !!payload.fromInput : false;
				const doLog = (payload instanceof Object) ? !!payload.log : true;
				try {
					const response = await connector.sendCode(code);
					if (fromInput || response != '') {
						logCode(code, response, hostname, fromInput);
					}
					return response;
				} catch (e) {
					if (!(e instanceof DisconnectedError) && doLog) {
						const type = (e instanceof CodeBufferError) ? 'warning' : 'error';
						log(type, code, e.message, hostname);
					}
					throw e;
				}
			},

			// Upload a file and show progress
			async upload(context, { filename, content, showProgress = true, showSuccess = true, showError = true, num, count }) {
				const cancelSource = BaseConnector.getCancelSource();
				const notification = showProgress && makeFileTransferNotification('upload', filename, cancelSource, num, count);
				try {
					// Check if config.g needs to be backed up
					if (filename === Path.configFile) {
						try {
							await connector.move({ from: Path.configFile, to: Path.configBackupFile, force: true, silent: true });
						} catch (e) {
							console.warn(e);
							log('error', i18n.t('notification.upload.error', [Path.extractFileName(filename)]), e.message, hostname);
							return;
						}
					}

					// Perform upload
					const startTime = new Date();
					const response = await connector.upload({ filename, content, cancelSource, onProgress: notification && notification.onProgress });

					// Show success message
					if (showSuccess && num === count) {
						if (count) {
							log('success', i18n.t('notification.upload.successMulti', [count]), undefined, hostname);
						} else {
							const secondsPassed = Math.round((new Date() - startTime) / 1000);
							log('success', i18n.t('notification.upload.success', [Path.extractFileName(filename), displayTime(secondsPassed)]), undefined, hostname);
						}
					}

					// Return the response
					if (showProgress) {
						notification.hide();
					}
					return response;
				} catch (e) {
					// Show and report error message
					if (showProgress) {
						notification.hide();
					}
					if (showError && !(e instanceof OperationCancelledError)) {
						console.warn(e);
						log('error', i18n.t('notification.upload.error', [Path.extractFileName(filename)]), e.message, hostname);
					}
					throw e;
				}
			},

			// Download a file and show progress
			// Parameter can be either the filename or an object { filename, (type, showProgress, showSuccess, showError, num, count) }
			async download(context, payload) {
				const filename = (payload instanceof Object) ? payload.filename : payload;
				const type = (payload instanceof Object) ? payload.type : 'auto';
				const showProgress = (payload instanceof Object) ? !!payload.showProgress : true;
				const showSuccess = (payload instanceof Object) ? !!payload.showSuccess : true;
				const showError = (payload instanceof Object) ? !!payload.showError : true;
				const num = (payload instanceof Object) ? payload.num : undefined;
				const count = (payload instanceof Object) ? payload.count : undefined;

				const cancelSource = BaseConnector.getCancelSource();
				const notification = showProgress && makeFileTransferNotification('download', filename, cancelSource, num, count);
				try {
					const startTime = new Date();
					const response = await connector.download({ filename, type, cancelSource, onProgress: notification && notification.onProgress });

					// Show success message
					if (showSuccess && num === count) {
						if (count) {
							log('success', i18n.t('notification.download.successMulti', [count]), undefined, hostname);
						} else {
							const secondsPassed = Math.round((new Date() - startTime) / 1000);
							log('success', i18n.t('notification.download.success', [Path.extractFileName(filename), displayTime(secondsPassed)]), undefined, hostname);
						}
					}

					// Return the downloaded data
					if (showProgress) {
						notification.hide();
					}
					return response;
				} catch (e) {
					// Show and report error message
					if (showProgress) {
						notification.hide();
					}
					if (showError && !(e instanceof OperationCancelledError)) {
						console.warn(e);
						log('error', i18n.t('notification.download.error', [Path.extractFileName(filename)]), e.message, hostname);
					}
					throw e;
				}
			},

			// Update machine mode. Reserved for the machine connector!
			async update({ state, getters, commit }, payload) {
				const wasPrinting = getters.isPrinting, lastJobFile = state.model.job.file.fileName;
				const beepFrequency = state.model.state.beep.frequency, beepDuration = state.model.state.beep.duration;
				const displayMessage = state.model.state.displayMessage;

				// Merge updates into the object model
				//console.log(JSON.stringify(payload));
				commit('model/update', payload);

				// Is a beep requested?
				if (state.model.state.beep.frequency != 0 && state.model.state.beep.duration != 0 &&
					(state.model.state.beep.frequency != beepFrequency || state.model.state.beep.duration != beepDuration))
				{
					beep(state.model.state.beep.frequency, state.model.state.beep.duration);
				}

				// Is a message supposed to be shown?
				if (state.model.state.displayMessage && state.model.state.displayMessage != displayMessage) {
					showMessage(state.model.state.displayMessage);
				}

				// Is an update or emergency reset in progress?
				const reconnect = ['updating', 'halted'].includes(state.model.state.status)
				if (reconnect) {
					if (!state.isReconnecting) {
						if (state.model.state.status === 'halted') {
							log('warning', i18n.t('events.emergencyStop'));
						} else {
							log('warning', i18n.t('events.reconnecting'));
						}
						commit('setReconnecting', true);
					}
				} else {
					if (state.isReconnecting) {
						log('success', i18n.t('events.reconnected'));
						commit('setReconnecting', false);
					}

					// Have we just finished a job?
					if (wasPrinting && !getters.isPrinting) {
						// Clear the cache of the last file
						commit('cache/clearFileInfo', lastJobFile);
					}
				}
			},

			// Actions for specific events triggered by the machine connector
			async onConnectionError({ dispatch }, error) {
				await dispatch('onConnectionError', { hostname, error }, { root: true });
			},
			onCodeCompleted(context, { code, reply }) {
				if (code === undefined) {
					logCode(undefined, reply, hostname);
				}
			},
			/* eslint-disable no-unused-vars */
			onDirectoryCreated: (context, directory) => null,
			onFileUploaded: (context, { filename, content }) => null,
			onFileDownloaded: (context, { filename, content }) => null,
			onFileOrDirectoryMoved: (context, { from, to, force }) => null,
			onFileOrDirectoryDeleted: (context, filename) => null
			/* eslint-enable no-unused-vars */
		},
		mutations: {
			clearLog: state => state.events = [],
			log: (state, payload) => state.events.push(payload),

			unregister: () => connector.unregister(),

			setReconnecting: (state, reconnecting) => state.isReconnecting = reconnecting,
			setHighVerbosity() { if (connector) { connector.verbose = true; } },
			setNormalVerbosity() { if (connector) { connector.verbose = false; } }
		},
		modules: {
			cache: cache(hostname),
			model: model(connector),
			settings: settings(hostname)
		}
	}
}
