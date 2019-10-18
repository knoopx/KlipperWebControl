export default {
	language: 'English',
	'$vuetify': {
		dataIterator: {
			rowsPerPageText: 'Items per page:',
			rowsPerPageAll: 'All',
			pageText: '{0}-{1} of {2}',
			noResultsText: 'No matching records found',
			nextPage: 'Next page',
			prevPage: 'Previous page'
		},
		dataTable: {
			rowsPerPageText: 'Rows per page:'
		},
		noDataText: 'No data available'
	},
	button: {
		add: {
			caption: 'Add'
		},
		connect: {
			connect: 'Connect',
			connecting: 'Connecting...',
			disconnect: 'Disconnect',
			disconnecting: 'Disconnecting...'
		},
		emergencyStop: {
			caption: 'Emergency Stop',
			title: 'Enforce an immediate software reset (M112+M999)'
		},
		home: {
			caption: 'Home {0}',
			captionAll: 'Home All',
			title: 'Home the {0} axis (G28 {0})',
			titleAll: 'Home all axes (G28)'
		},
		newDirectory: {
			caption: 'New Directory'
		},
		newFilament: {
			caption: 'New Filament'
		},
		newFile: {
			caption: 'New File'
		},
		refresh: {
			caption: 'Refresh'
		},
		upload: {
			gcodes: {
				caption: 'Upload G-Code File(s)',
				title: 'Upload one or more G-Code files (drag&drop is supported as well)'
			},
			start: {
				caption: 'Upload & Start',
				title: 'Upload & Start one or more G-Code files (drag&drop is supported as well)'
			},
			macros: {
				caption: 'Upload Macro File(s)',
				title: 'Upload one or more macro files (drag&drop is supported as well)'
			},
			filaments: {
				caption: 'Upload Filament Configs',
				title: 'Upload one or more filament configurations (drag&drop is supported as well)'
			},
			sys: {
				caption: 'Upload System Files',
				title: 'Upload one or more system files (drag&drop is supported as well)'
			},
			www: {
				caption: 'Upload Web Files',
				title: 'Upload one or more web files (drag&drop is supported as well)'
			},
			update: {
				caption: 'Upload Update',
				title: 'Upload an update package (drag&drop is supported as well)'
			}
		}
	},
	chart: {
		layer: {
			caption: 'Layer Chart',
			layerTime: 'Layer Time',

			showLastLayers: 'Show Last {0} Layers',
			showAllLayers: 'Show All Layers',

			layer: 'Layer {0}',
			layerDuration: 'Duration: {0}',
			layerHeight: 'Layer Height: {0}',
			filamentUsage: 'Filament Usage: {0}',
			fractionPrinted: 'File Progress: {0}'
		},
		temperature: {
			caption: 'Temperature Chart',
			heater: 'Heater {0}',
			noData: 'No Data'
		}
	},
	dialog: {
		changeMoveStep: {
			title: 'Change move step',
			prompt: 'Please enter a new value for the clicked move button:'
		},
		configUpdated: {
			title: 'Reset board?',
			prompt: 'Would you like to restart your board to apply the updated configuration?'
		},
		connect: {
			title: 'Connect to Machine',
			prompt: 'Please enter the hostname and password of the machine that you would like to connect to:',
			hostPlaceholder: 'Hostname',
			hostRequired: 'Hostname is required',
			passwordPlaceholderOptional: 'Password (optional)',
			passwordPlaceholder: 'Password',
			passwordRequired: 'Password is required',
			connect: 'Connect'
		},
		connection: {
			connecting: 'Connecting...',
			disconnecting: 'Disconnecting...',
			reconnecting: 'Connection lost, attempting to reconnect...',
			standBy: 'Please stand by...'
		},
		editExtrusionAmount: {
			title: 'Edit extrusion amount',
			prompt: 'Please enter a new amount for the clicked button:'
		},
		editExtrusionFeedrate: {
			title: 'Edit extrusion feedrate',
			prompt: 'Please enter a new feedrate for the clicked button:'
		},
		factoryReset: {
			title: 'Perform factory reset?',
			prompt: 'Are you sure you wish to perform a factory reset? All saved settings will be lost.'
		},
		filament: {
			titleChange: 'Change Filament',
			titleLoad: 'Load Filament',
			prompt: 'Please choose a filament:'
		},
		fileEdit: {
			gcodeReference: 'G-Code Reference',
			menuReference: 'Menu Reference',
			save: 'Save',
			confirmClose: 'The file has been changed. If you proceed, your changes will be lost.'
		},
		meshEdit: {
			title: 'Set Mesh Parameters',
			radius: 'Probe Radius',
			spacing: 'Spacing',
			startCoordinate: 'Start coordinate in {0} direction',
			endCoordinate: 'End coordinate in {0} direction',
			spacingDirection: 'Spacing in {0} direction'
		},
		newDirectory: {
			title: 'New Directory',
			prompt: 'Please enter a new directory name:'
		},
		newFilament: {
			title: 'New Filament',
			prompt: 'Please enter a name for the new filament:'
		},
		newFile: {
			title: 'New File',
			prompt: 'Please enter a new file name:'
		},
		renameFile: {
			title: 'Rename File or Directory',
			prompt: 'Please enter a new name:'
		},
		resetHeaterFault: {
			title: 'Reset Heater Fault',
			prompt: 'A heater fault has occurred on heater {0}. It is strongly advised to turn off your machine now and to check your wiring before you continue. If you are absolutely sure that this is not a phsical problem, you can reset the heater fault ON YOUR OWN RISK. Be aware that this is NOT RECOMMENDED and can lead to further problems. How would you like to proceed?',
			resetFault: 'Reset Fault'
		},
		runMacro: {
			title: 'Run {0}',
			prompt: 'Do you want to run {0}?'
		},
		startJob: {
			title: 'Start {0}',
			prompt: 'Do you want to start {0}?'
		},
		update: {
			title: 'Install updates?',
			prompt: 'You have uploaded at least one firmware update. Would you like to install them now?'
		},
		inputRequired: 'Please enter a value',
		numberRequired: 'Please enter a valid number'
	},
	directory: {
		filaments: 'Filaments Directory',
		gcodes: 'G-Codes Directory',
		macros: 'Macros Directory',
		sys: 'System Directory',
		www: 'WWW Directory'
	},
	error: {
		notImplemented: '{0} is not implemented',
		invalidPassword: 'Invalid password!',
		noFreeSession: 'No more free sessions!',
		connect: 'Failed to connect to {0}',
		disconnect: 'Could not disconnect cleanly from {0}',
		disconnected: 'Could not complete action because the connection has been terminated',
		cancelled: 'Operation has been cancelled',
		network: 'Network error',
		timeout: 'HTTP request timed out',
		driveUnmounted: 'Target drive is unmounted',
		directoryNotFound: 'Directory {0} not found',
		fileNotFound: 'File {0} not found',
		invalidHeightmap: 'Invalid Height Map',
		operationFailed: 'Operation failed (Reason: {0})',
		uploadStartWrongFileCount: 'Only a single file can be uploaded & started',
		uploadNoSingleZIP: 'Only a single ZIP file can be uploaded at once',
		uploadNoFiles: 'This ZIP does not contain any usable fiels',
		uploadDecompressionFailed: 'Failed to decompress ZIP file',
		codeResponse: 'Could not run code because a bad response has been received',
		codeBuffer: 'Could run code because the buffer space has been exhausted',
		enterValidNumber: 'Please enter a valid number',
		turnOffEverythingFailed: 'Failed to turn everything off',
		filelistRequestFailed: 'Failed to get file list',
		fileinfoRequestFailed: 'Failed to get file info for {0}',
		filamentsLoadFailed: 'Failed to load filaments',
		move: 'Failed to move {0} to {1}'
	},
	events: {
		connected: 'Connected to {0}',
		connectionLost: 'Failed to maintain connection to {0}',
		emergencyStop: 'Emergency stop, attemping to reconnect...',
		reconnecting: 'Connection interrupted, attempting to reconnect...',
		reconnected: 'Connection established',
		disconnected: 'Disconnected from {0}'
	},
	generic: {
		ok: 'OK',
		cancel: 'Cancel',
		yes: 'Yes',
		no: 'No',
		close: 'Close',
		reset: 'Reset',
		noValue: 'n/a',
		loading: 'loading',
		error: 'Error',
		info: 'Info',
		warning: 'Warning',
		success: 'Success',
		heaterStates: [
			'off',
			'active',
		],
		status: {
			updating: 'Updating',
			off: 'Off',
			halted: 'Halted',
			pausing: 'Pausing',
			paused: 'Paused',
			resuming: 'Resuming',
			printing: 'Printing',
			processing: 'Processing',
			busy: 'Busy',
			changingTool: 'Changing Tool',
			idle: 'Idle',
			unknown: 'Unknown'
		},
		rpm: 'RPM',
		sdCard: 'SD Card {0}',
		mounted: 'mounted',
		notMounted: 'not mounted',
		extracting: 'Extracting',
		uploading: 'Uploading',
		active: 'Active',
		standby: 'Standby'
	},
	input: {
		code: {
			send: 'Send',
			placeholder: 'Send code...'
		},
		addTemperature: 'Value of new temperature',
		addRPM: 'Value of new preset'
	},
	jobProgress: {
		processing: 'Processing {0}, {1} complete',
		processed: 'Processed {0}, 100 % complete',
		printing: 'Printing {0}, {1} complete',
		printed: 'Printed {0}, 100 % complete',
		noJob: 'No Job running.',
		layer: 'Layer {0} of {1}',
		filament: 'Filament Usage: {0}',
		filamentRemaining: '{0} remaining'
	},
	list: {
		baseFileList: {
			fileName: 'Filename',
			size: 'Size',
			lastModified: 'Last modified',
			download: 'Download File',
			edit: 'Edit File',
			rename: 'Rename',
			delete: 'Delete',
			downloadZIP: 'Download as ZIP',
			noFiles: 'No Files or Directories',
			driveUnmounted: 'Drive is unmounted',
			goUp: 'Go up'
		},
		eventLog: {
			date: 'Date',
			type: 'Type',
			message: 'Event',
			noEvents: 'No Events',
			clear: 'Clear',
			downloadText: 'Download as Text',
			downloadCSV: 'Download as CSV'
		},
		filament: {
			noFilaments: 'No Filaments'
		},
		macro: {
			caption: 'Macros',
			noMacros: 'No Macros',
			run: 'Run Macro',
			root: 'Root'
		},
		jobs: {
			height: 'Object Height',
			layerHeight: 'Layer Height',
			filament: 'Filament Usage',
			printTime: 'Print Time',
			generatedBy: 'Generated by',
			noJobs: 'No Jobs',
			start: 'Start File',
		},
		sys: {
			noFiles: 'No System Files'
		}
	},
	menu: {
		control: {
			caption: 'Machine Control',
			dashboard: 'Dashboard',
			console: 'Console',
			heightmap: 'Height Map'
		},
		job: {
			caption: 'Current Job',
			status: 'Status',
			webcam: 'Webcam',
			visualiser: 'Visualiser'
		},
		files: {
			caption: 'File Management',
			jobs: 'Jobs',
			filaments: 'Filaments',
			macros: 'Macros',
			system: 'System',
			web: 'Web'
		},
		settings: {
			caption: 'Settings',
			general: 'General',
			machine: 'Machine-Specific',
			update: 'Update'
		}
	},
	notification: {
		compress: {
			title: 'Compressing files...',
			message: 'Please stand by while your files are being compressed...',
			errorTitle: 'Failed to compress files'
		},
		delete: {
			errorTitle: 'Failed to delete {0}',
			errorMessageDirectory: 'Please make sure that this directory is empty',
			success: 'Successfully deleted {0}',
			successMultiple: 'Successfully deleted {0} items'
		},
		deleteFilament: {
			errorTitle: 'Failed to delete filament(s)',
			errorStillLoaded: 'At least one of the selected filaments is still loaded. Please unload them before you proceed',
			errorSubDirectories: 'The filament {0} contains sub-directories. Please delete them manually and try again.'
		},
		download: {
			title: 'Downloading {0} @ {1}, {2}% complete',
			message: 'Please stand by while the file is being downloaded...',
			success: 'Download of {0} successful after {1}',
			successMulti: 'Successfully downloaded {0} files',
			error: 'Failed to download {0}'
		},
		loadingFile: {
			title: 'Loading file...',
			message: 'This file is relatively big so it may take a while before it is displayed.'
		},
		message: 'Message',
		mount: {
			successTitle: 'SD card mounted',
			errorTitle: 'Failed to mount SD card'
		},
		newDirectory: {
			errorTitle: 'Failed to create directory',
			successTitle: 'Directory created',
			successMessage: 'Successfully created directory {0}'
		},
		newFilament: {
			errorTitle: 'Failed to create filament',
			errorTitleMacros: 'Failed to create filament macros',
			successTitle: 'Filament created',
			successMessage: 'Successfully created filament {0}'
		},
		rename: {
			success: 'Successfully renamed {0} to {1}',
			error: 'Failed to rename {0} to {1}',
		},
		renameFilament: {
			errorTitle: 'Failed to rename filament',
			errorStillLoaded: 'This filament is still loaded. Please unload it before you proceed'
		},
		responseTooLong: 'Response too long, see Console',
		upload: {
			title: 'Uploading {0} @ {1}, {2}% complete',
			message: 'Please stand by while the file is being uploaded...',
			success: 'Upload of {0} successful after {1}',
			successMulti: 'Successfully uploaded {0} files',
			error: 'Failed to upload {0}'
		}
	},
	panel: {
		atx: {
			caption: 'ATX Power',
			on: 'On',
			off: 'Off'
		},
		babystepping: {
			caption: 'Z Babystepping',
			current: 'Current Offset: {0}'
		},
		extrude: {
			caption: 'Extrusion Control',
			mix: 'Mix',
			mixRatio: 'Mix Ratio:',
			amount: 'Feed amount in {0}:',
			feedrate: 'Feedrate in {0}:',
			retract: 'Retract',
			extrude: 'Extrude'
		},
		extrusionFactors: {
			caption: 'Extrusion Factors',
			changeVisibility: 'Change Visibility',
			extruder: 'Extruder {0}',
			noExtruders: 'No Extruders'
		},
		fan: {
			caption: 'Fan Control',
			selection: 'Fan Selection:',
			toolFan: 'Tool Fan',
			fan: 'Fan {0}'
		},
		fans: {
			caption: 'Fans',
			changeVisibility: 'Change Visibility',
			toolFan: 'Tool Fan',
			fan: 'Fan {0}',
			noFans: 'No Fans'
		},
		heightmap: {
			scale: 'Scale:',
			orMore: 'or more',
			orLess: 'or less',
			axes: 'Axes:',
			notAvailable: 'height map not available',
			numPoints: 'Number of points: {0}',
			radius: 'Probing radius: {0}',
			area: 'Probe area: {0}',
			maxDeviations: 'Maximum deviations: {0} / {1}',
			meanError: 'Mean error: {0}',
			rmsError: 'RMS error: {0}',
			topView: 'Top view',
			colorScheme: 'Color scheme:',
			terrain: 'Terrain',
			heat: 'Heat',
			reload: 'Reload Height Map'
		},
		jobControl: {
			caption: 'Job Control',
			cancelJob: 'Cancel Job',
			cancelPrint: 'Cancel Print',
			pauseJob: 'Pause Job',
			pausePrint: 'Pause Print',
			resumeJob: 'Resume Job',
			resumePrint: 'Resume Print',
			repeatJob: 'Start Again',
			repeatPrint: 'Print Again',
		},
		jobData: {
			caption: 'Collected Data',
			warmUpDuration: 'Warm-Up Time',
			currentLayerTime: 'Current Layer Time',
			lastLayerTime: 'Last Layer Time',
			jobDuration: 'Job Duration'
		},
		jobEstimations: {
			caption: 'Estimations based on',
			filament: 'Filament Usage',
			file: 'File Progress',
			layer: 'Layer Time',
			slicer: 'Slicer',
		},
		jobInfo: {
			caption: 'Job Information',
			height: 'Height:',
			layerHeight: 'Layer Height:',
			filament: 'Filament Usage:',
			generatedBy: 'Generated by:'
		},
		movement: {
			caption: 'Machine Movement',
			compensation: 'Compensation & Calibration',
			runBed: 'True Bed Levelling (G32)',
			runDelta: 'Delta Calibration (G32)',
			compensationInUse: 'Compensation in use: {0}',
			disableBedCompensation: 'Disable Bed Compensation (M561)',
			disableMeshCompensation: 'Disable Mesh Compensation (G29 S2)',
			editMesh: 'Define Area for Mesh Compensation (M557)',
			runMesh: 'Run Mesh Compensation (G29)',
			loadMesh: 'Load Saved Height Map from SD Card (G29 S1)',
			axesNotHomed: 'The following axis is not homed:|The following axes are not homed:',
			noAxes: 'No Axes'
		},
		settingsAppearance: {
			caption: 'Appearance',
			darkTheme: 'Dark theme',
			language: 'Language',
			binaryFileSizes: 'Use binary file sizes',
			binaryFileSizesTitle: 'File sizes are displayed with a basis of 1024 (IEC) instead of 1000 (SI)'
		},
		settingsCommunication: {
			caption: 'Communication',
			pingInterval: 'PING interval when idle (ms)',
			ajaxRetries: 'Number of maximum AJAX retries',
			updateInterval: 'Update interval ({0})',
			extendedUpdateEvery: 'Extended status update interval',
			fileTransferRetryThreshold: 'Retry threshold for file transfers ({0})',
			crcUploads: 'Use CRC32 checksums for uploads',
			unavailable: 'No settings available'
		},
		settingsElectronics: {
			caption: 'Electronics',
			diagnostics: 'Diagnostics',
			board: 'Board: {0}',
			firmware: 'Firmware: {0} ({1})',
			dwsFirmware: 'Duet WiFi Server Version: {0}',
			updateNote: 'Note: You can install updates on the System page.'
		},
		settingsEndstops: {
			caption: 'Endstops',
			index: 'Index',
			triggered: 'Triggered'
		},
		settingsGeneral: {
			caption: 'General',
			factoryReset: 'Revert to factory defaults',
			settingsStorageLocal: 'Save settings in local storage',
			settingsSaveDelay: 'Update delay for settings changes ({0})',
			cacheStorageLocal: 'Save cache in local storage',
			cacheSaveDelay: 'Update delay for cache changes ({0})'
		},
		settingsListItems: {
			caption: 'List Items',
			toolTemperatures: 'Tool Temperatures',
			bedTemperatures: 'Bed Temperatures',
		},
		settingsMachine: {
			caption: 'Machine-Specific',
			revertDWC: 'Revert to DWC1',
			babystepAmount: 'Babystep amount ({0})',
			moveFeedrate: 'Feedrate for move buttons ({0})'
		},
		settingsNotifications: {
			caption: 'Notifications',
			notificationErrorsPersistent: 'Do not close error messages automatically',
			notificationTimeout: 'Default notification timeout ({0})'
		},
		settingsWebcam: {
			caption: 'Webcam',
			webcamURL: 'Webcam URL (optional)',
			webcamUpdateInterval: 'Webcam update interval ({0})',
			webcamFix: 'Do not append extra HTTP qualifier when reloading images',
			webcamEmbedded: 'Embed webcam image in an iframe',
			webcamRotation: 'Rotate webcam image',
			webcamFlip: 'Flip webcam image',
			flipNone: 'None',
			flipX: 'Flip X',
			flipY: 'Flip Y',
			flipBoth: 'Flip both'
		},
		speedFactor: {
			caption: 'Speed Factor'
		},
		status: {
			caption: 'Status',
			mode: 'Mode: {0}',
			toolPosition: 'Tool Position',
			machinePosition: 'Machine Position',
			extruders: 'Extruder Drives',
			extruderDrive: 'Drive {0}',
			speeds: 'Speeds',
			requestedSpeed: 'Requested Speed',
			topSpeed: 'Top Speed',
			sensors: 'Sensors',
			mcuTemp: 'MCU Temperature',
			mcuTempTitle: 'Minimum: {0}, Maximum: {1}',
			vIn: 'Vin',
			vInTitle: 'Minimum: {0}, Maximum {1}',
			fanRPM: 'Fan RPM',
			probe: 'Z-Probe|Z-Probes',
			noStatus: 'No Status'
		},
		tools: {
			caption: 'Tools',
			controlAll: 'Control All',
			turnEverythingOff: 'Turn Everything Off',
			allActiveTemperatures: 'Set all active temperatures',
			allStandbyTemperatures: 'Set all standby temperatures',
			tool: 'Tool {0}',
			loadFilament: 'Load Filament',
			changeFilament: 'Change Filament',
			unloadFilament: 'Unload Filament',
			heater: 'Heater {0}',
			current: 'Current',
			active: 'Active',
			standby: 'Standby',
			bed: 'Bed {0}',
			extra: {
				caption: 'Extra',
				sensor: 'Sensor',
				value: 'Value',
				showInChart: 'Show in Chart',
				noItems: 'No Extra Heaters'
			},
			noTools: 'No Tools'
		},
		webcam: {
			caption: 'Webcam Surveillance',
			alt: '(webcam image)'
		}
	}
}
