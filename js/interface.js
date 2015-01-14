/* Interface logic for the Duet Web Control */

/* Constant values */

var maxTemperatureSamples = 1000;

var sessionPassword = "reprap";

var updateFrequency = 250;			// in ms
var haltedReconnectDelay = 5000;	// in ms
var extendedStatusInterval = 10;	// get extended status response every n requests

// Probe highlighting
var probeSlowDownColor = "#FFFFE0", probeTriggerColor = "#FFF0F0";

// Charts
var tempChart;
var tempChartOptions = 	{
							colors: ["#0000FF", "#FF0000", "#00DD00", "#FFA000", "#FF00FF"],
							grid: {
								borderWidth: 0
							},
							xaxis: {
								show: false
							},
							yaxis: {
								min: 0,
								max: 280
							}
						};
var tempChartPadding = 15;

/* Variables */

var isConnected = false, isDelta, isPrinting, isPaused;
var extendedStatusCounter;
var lastStatusResponse, lastSendGCode;

var probeSlowDownValue, probeTriggerValue;

var heatedBed, numHeads, numExtruderDrives, toolMapping;
var recordedBedTemperatures, recordedHeadTemperatures;

var currentPage = "control", drawTempChart = false, waitingForPrintStart;

var currentGCodeDirectory, knownGCodeFiles, gcodeUpdateIndex, gcodeLastDirectory;
var knownMacroFiles, macroUpdateIndex;

var fanSliderActive, speedSliderActive, extrSliderActive;

function resetGuiData() {
	setPauseStatus(false);
	setPrintStatus(false);
	setDeltaMode(false);
	
	lastStatusResponse = undefined;
	lastSendGCode = "";
	probeSlowDownValue = probeTriggerValue = undefined;
	
	heatedBed = 1;
	numHeads = 4;			// 4 Heads max
	numExtruderDrives = 5;	// 5 Extruder Drives max
	
	recordedBedTemperatures = [];
	recordedHeadTemperatures = [[], [], [], []];
	
	toolMapping = undefined;
	
	knownGCodeFiles = knownMacroFiles = [];
	gcodeUpdateIndex = macroUpdateIndex = -1;
	currentGCodeDirectory = "/gcodes";
	
	waitingForPrintStart = fanSliderActive = speedSliderActive = extrSliderActive = false;
}

/* Connect / Disconnect */

function connect(password, firstConnect) {
	$(".btn-connect").removeClass("btn-info").addClass("btn-warning disabled").find("span:not(.glyphicon)").text("Connecting...");
	$(".btn-connect span.glyphicon").removeClass("glyphicon-log-in").addClass("glyphicon-transfer");
	$.ajax("rr_connect?password=" + password, {
		async: true,
		dataType: "json",
		error: function() {
 			showMessage("exclamation-sign", "Error", "Could not establish connection to the Duet firmware!<br/><br/>Please check your settings and try again.", "md");
			$("#modal_message").one("hide.bs.modal", function() {
				$(".btn-connect").removeClass("btn-warning disabled").addClass("btn-info").find("span:not(.glyphicon)").text("Connect");
				$(".btn-connect span.glyphicon").removeClass("glyphicon-transfer").addClass("glyphicon-log-in");
			});
		},
		success: function(data) {
			if (data.err == 2) {		// Looks like the firmware ran out of HTTP sessions
				showMessage("exclamation-sign", "Error", "Could not connect to Duet, because there are no more HTTP sessions available.", "md");
				$("#modal_message").one("hide.bs.modal", function() {
					$(".btn-connect").removeClass("btn-warning disabled").addClass("btn-info").find("span:not(.glyphicon)").text("Connect");
					$(".btn-connect span.glyphicon").removeClass("glyphicon-transfer").addClass("glyphicon-log-in");
				});
			}
			else if (firstConnect)
			{
				if (data.err == 0) {	// No password authentication required
					sessionPassword = password;
					postConnect();
				}
				else {					// We can connect, but we need a password first
					showPasswordPrompt();
				}
			}
			else {
				if (data.err == 0) {	// Connect successful
					sessionPassword = password;
					postConnect();
				} else {
					showMessage("exclamation-sign", "Error", "Invalid password!", "sm");
					$("#modal_message").one("hide.bs.modal", function() {
						$(".btn-connect").removeClass("btn-warning disabled").addClass("btn-info").find("span:not(.glyphicon)").text("Connect");
						$(".btn-connect span.glyphicon").removeClass("glyphicon-transfer").addClass("glyphicon-log-in");
					});
				}
			}
		}
	});
}

function postConnect() {
	log("success", "<strong>Connection established!</strong>");
	
	isConnected = true;
	extendedStatusCounter = extendedStatusInterval; // ask for extended status on first poll
	
	updateStatus();
	if (currentPage == "files") {
		updateGCodeFiles();
	} else if (currentPage == "macros") {
		updateMacroFiles();
	}
	
	$(".btn-connect").removeClass("btn-warning disabled").addClass("btn-success").find("span:not(.glyphicon)").text("Disconnect");
	$(".btn-connect span.glyphicon").removeClass("glyphicon-transfer").addClass("glyphicon-log-out");
	
	enableControls();
}

function disconnect() {
	if (isConnected) {
		log("danger", "<strong>Disconnected.</strong>");
	}
	isConnected = false;
	$.ajax("rr_disconnect", { async: true, dataType: "json" });
	
	$(".btn-connect").removeClass("btn-success").addClass("btn-info").find("span:not(.glyphicon)").text("Connect");
	$(".btn-connect span.glyphicon").removeClass("glyphicon-log-out").addClass("glyphicon-log-in");
	
	resetGuiData();
	resetGui();
	updateGui();
	
	disableControls();
}

/* AJAX */

function updateStatus() {
	var ajaxRequest = "rr_status";
	if (extendedStatusCounter >= extendedStatusInterval) {
		extendedStatusCounter = 0;
		ajaxRequest += "?type=2";
	} else {
		ajaxRequest += "?type=1";
	}
	extendedStatusCounter++;
	
	$.ajax(ajaxRequest, {
		async: true,
		dataType: "json",
		error: ajaxError,
		success: function(status) {
			// Don't process this one if we're no longer connected
			if (!isConnected) {
				return;
			}
			var needGuiUpdate = false;
			
			/*** Extended status response ***/
			
			// TODO: Cold Extrusion parameters
			
			// Delta Configuration
			if (status.hasOwnProperty("isDelta")) {
				setDeltaMode(status.isDelta);
			}
			
			// Machine Name
			if (status.hasOwnProperty("name")) {
				$(".navbar-brand").html(status.name);
			}
			
			// Probe Parameters (maybe hide probe info for type 0 someday?)
			if (status.hasOwnProperty("probe")) {
				probeTriggerValue = status.probe.threshold;
				probeSlowDownValue = probeTriggerValue * 0.9;	// see Platform::Stopped in dc42/zpl firmware forks
			}
			
			// Tool Mapping
			if (status.hasOwnProperty("tools")) {
				toolMapping = status.tools;
			}
			
			/*** Ordinary status response ***/
			
			// Status
			var printing = false, paused = false;
			switch (status.status) {
				case 'H':	// Halted
					setStatusLabel("Halted", "danger");
					break;
					
				case 'D':	// Pausing / Decelerating
					setStatusLabel("Pausing", "warning");
					printing = true;
					paused = true;
					break;
				
				case 'S':	// Paused / Stopped
					setStatusLabel("Paused", "info");
					printing = true;
					paused = true;
					break;
					
				case 'R':	// Resuming
					setStatusLabel("Resuming", "warning");
					printing = true;
					break;
					
				case 'P':	// Printing
					setStatusLabel("Printing", "success");
					printing = true;
					break;
					
				case 'B':	// Busy
					setStatusLabel("Busy", "warning");
					break;
					
				case 'I':	// Idle
					setStatusLabel("Idle", "default");
					break;
			}
			setPrintStatus(printing);
			setPauseStatus(paused);
			
			// Set homed axes
			setAxesHomed(status.coords.axesHomed);
			
			// Update extruder drives
			if (status.coords.extr.length != numExtruderDrives) {
				numExtruderDrives = status.coords.extr.length;
				needGuiUpdate = true;
			}
			for(var i=1; i<=numExtruderDrives; i++) {
				$("#td_extr_" + i).html(status.coords.extr[i - 1].toFixed(1));
			}
			$("#td_extr_total").html(status.coords.extr.reduce(function(a, b) { return a + b; }));
			
			// XYZ coordinates
			if (isDelta && !status.coords.axesHomed[0]) {
				$("#td_x, #td_y, #td_z").hmtl("n/a");
			} else {
				$("#td_x").html(status.coords.xyz[0].toFixed(2));
				$("#td_y").html(status.coords.xyz[1].toFixed(2));
				$("#td_z").html(status.coords.xyz[2].toFixed(2));
			}
			
			// TODO: process currentTool here
			
			// Output
			if (status.hasOwnProperty("output")) {
				if (status.output.hasOwnProperty("beepDuration") && status.output.hasOwnProperty("beepFrequency")) {
					beep(status.output.beepFrequency, status.output.beepDuration);
				}
				if (status.output.hasOwnProperty("message")) {
					showMessage("envelope", "Message from Duet firmware", status.output.message, "md");
				}
			}
			
			// ATX Power
			setATXPower(status.params.atxPower);
			
			// Fan Control
			if (!fanSliderActive && (lastStatusResponse == undefined || $("#slider_fan_print").slider("getValue") != status.params.fanPercent)) {
				if ($("#override_fan").is(":checked")) {
					sendGCode("M106 S" + ($("#slider_fan_print").slider("getValue") / 100.0));
				} else {
					$("#slider_fan_control").slider("setValue", status.params.fanPercent);
					$("#slider_fan_print").slider("setValue", status.params.fanPercent);
				}
			}
			
			// Speed Factor
			if (!speedSliderActive && (lastStatusResponse == undefined || $("#slider_speed").slider("getValue") != status.params.speedFactor)) {
				$("#slider_speed").slider("setValue", status.params.speedFactor);
			}
			if (!extrSliderActive) {
				for(var i=0; i<status.params.extrFactors.length; i++) {
					var extrSlider = $("#slider_extr_" + (i + 1));
					if (lastStatusResponse == undefined || extrSlider.slider("getValue") != status.params.extrFactors) {
						extrSlider.slider("setValue", status.params.extrFactors[i]);
					}
				}
			}
			
			// Fetch the latest G-Code response from the server
			if (lastStatusResponse == undefined || lastStatusResponse.seq != status.seq) {
				$.ajax("rr_reply", {
					async: true,
					dataType: "html",
					error: ajaxError,
					success: function(response) {
						response = response.trim();
						if (response != "" || lastSendGCode != "") {
							var style = (response == "") ? "success" : "info";
							var content = (lastSendGCode != "") ? "<strong>" + lastSendGCode + "</strong><br/>" : "";
							if (response.match("^Error: ") != null) {
								style = "warning";
								content = "<strong>Error:</strong>" + response.substring(6);
							} else {
								content += response.replace(/\n/g, "<br/>")
							}
							log(style, content);
							
							lastSendGCode = "";
						}
					}
				});
			}
			
			// Sensors
			setProbeValue(status.sensors.probeValue, status.sensors.probeSecondary);
			$("#td_fanrpm").html(status.sensors.fanRPM);
			
			// Heated bed
			if (status.temps.hasOwnProperty("bed")) {
				setCurrentTemperature("bed", status.temps.bed.current);
				setTemperatureInput("bed", status.temps.bed.active, 1);
				setHeaterState("bed", status.temps.bed.state);
			} else if (heatedBed) {
				heatedBed = 0;
				needGuiUpdate = true;
			}
			
			// Heads
			if (status.temps.heads.current.length != numHeads) {
				numHeads = status.temps.heads.current.length;
				needGuiUpdate = true;
			}
			for(var i=0; i<status.temps.heads.current.length; i++) {
				setCurrentTemperature(i + 1, status.temps.heads.current[i]);
				setTemperatureInput(i + 1, status.temps.heads.active[i], 1);
				setTemperatureInput(i + 1, status.temps.heads.standby[i], 0);
				setHeaterState(i + 1, status.temps.heads.state[i]);
			}
			recordHeaterTemperatures(status.temps.bed.current, status.temps.heads.current);
			
			/*** Print status response ***/
			
			// TODO: currentLayer, extrRaw, fractionPrinted, firstLayerDuration, firstLayerHeight, printDuration, warmUpTime
			// TODO: timesLeft: file, filament, layer
			
			// Update the GUI when we have processed the whole status response
			if (needGuiUpdate) {
				updateGui();
			}
			drawTemperatureChart();
			
			// Set timer for next status update
			if (status.status != 'H') {
				setTimeout(updateStatus, updateFrequency);
			} else {
				log("danger", "<strong>Emergency Stop!</strong>");
				setTimeout(function() {
					connect(sessionPassword, false);
				}, haltedReconnectDelay);
			}
			
			// Save the last status response
			lastStatusResponse = status;
		}
	});
}

function updateGCodeFiles() {
	if (!isConnected) {
		gcodeUpdateIndex = -1;
		$(".span-refresh-files").addClass("hidden");
		clearGCodeDirectory();
		clearGCodeFiles();
		return;
	}
	
	if (gcodeUpdateIndex == -1) {
		gcodeUpdateIndex = 0;
		gcodeLastDirectory = undefined;
		clearGCodeFiles();
		
		$.ajax("rr_files?dir=" + currentGCodeDirectory, {
			async: true,
			dataType: "json",
			error: ajaxError,
			success: function(response) {
				if (isConnected) {
					knownGCodeFiles = response.files.sort();
					for(var i=0; i<knownGCodeFiles.length; i++) {
						addGCodeFile(knownGCodeFiles[i]);
					}
					
					if (knownGCodeFiles.length == 0) {
						$(".span-refresh-files").removeClass("hidden");
					} else {
						updateGCodeFiles();
					}
				}
			}
		});
	} else {
		var row = $("#table_gcode_files tr[data-item='" + knownGCodeFiles[gcodeUpdateIndex] + "']");
		$.ajax("rr_fileinfo?name=" + currentGCodeDirectory + "/" + encodeURIComponent(knownGCodeFiles[gcodeUpdateIndex]), {
			async: true,
			dataType: "json",
			error: ajaxError,
			row: row,
			success: function(response) {
				if (!isConnected || this.row == undefined) {
					return;
				}
				gcodeUpdateIndex++;
				
				if (response.err == 0) {	// File
					setGCodeFileItem(this.row, response.size, response.height, response.layerHeight, response.filament, response.generatedBy);
				} else {					// Directory
					setGCodeDirectoryItem(this.row);
				}
				
				if (gcodeUpdateIndex >= knownGCodeFiles.length) {
					$(".span-refresh-files").removeClass("hidden");
				} else if (currentPage == "files") {
					updateGCodeFiles();
				}
			}
		});
	}
}
function updateMacroFiles() {
	if (!isConnected) {
		macroUpdateIndex = -1;
		$(".span-refresh-macros").addClass("hidden");
		clearMacroFiles();
		return;
	}
	
	if (macroUpdateIndex == -1) {
		macroUpdateIndex = invalidMacros = 0;
		clearMacroFiles();
		
		$.ajax("rr_files?dir=/macros", {
			async: true,
			dataType: "json",
			error: ajaxError,
			success: function(response) {
				if (isConnected) {
					knownMacroFiles = response.files.sort();
					for(var i=0; i<knownMacroFiles.length; i++) {
						addMacroFile(knownMacroFiles[i]);
					}
					
					if (knownMacroFiles.length == 0) {
						$(".span-refresh-macros").removeClass("hidden");
					} else {
						updateMacroFiles();
					}
				}
			}
		});
	} else {
		var row = $("#table_macro_files tr[data-macro='" + knownMacroFiles[macroUpdateIndex] + "']");
		$.ajax("rr_fileinfo?name=/macros/" + encodeURIComponent(knownMacroFiles[macroUpdateIndex]), {
			async: true,
			dataType: "json",
			error: ajaxError,
			row: row,
			success: function(response) {
				if (!isConnected || this.row == undefined) {
					return;
				}
				macroUpdateIndex++;
				
				if (response.err == 0) {	// File
					setMacroFileItem(this.row, response.size);
				} else {
					row.remove();			// Not a file, purge it
					invalidMacros++;
				}
				
				if (macroUpdateIndex >= knownMacroFiles.length) {
					$(".span-refresh-macros").removeClass("hidden");
					if (macroUpdateIndex - invalidMacros == 0) {
						clearMacroFiles();
					}
				} else if (currentPage == "macros") {
					updateMacroFiles();
				}
			}
		});
	}
}

function sendGCode(gcode) {
	lastSendGCode = gcode;
	
	// Although rr_gcode gives us a JSON response, it doesn't provide any results.
	// We only need to worry about an AJAX error event.
	$.ajax("rr_gcode?gcode=" + encodeURIComponent(gcode), {
		async: true,
		dataType: "json",
		error: ajaxError
	});
}

function ajaxError() {
	if (isConnected) {
		showMessage("warning-sign", "Communication Error", "An AJAX error was reported, so the current session has been terminated.<br/><br/>Please check if your printer is still on and try to connect again.", "md");
		disconnect();
	}
}

/* Cookies */

function loadValues() {
	
}

function saveValues() {
	
}

/* GUI */

$(document).ready(function() {
	resetGuiData();
	updateGui();
	
	log("info", "<strong>Page Load complete!</strong>");
});

function enableControls() {
	$("nav input, #div_heaters input, #main_content input").prop("disabled", false);			// Generic inputs
	
	$(".btn-emergency-stop, .gcode-input button[type=submit], .gcode").removeClass("disabled");	// Navbar
	$(".bed-temp, .gcode, .head-temp").removeClass("disabled");									// List items
	
	$("#mobile_home_buttons button, #btn_homeall, #table_move_head a").removeClass("disabled");	// Move buttons
	$("#panel_extrude label.btn, #panel_extrude button").removeClass("disabled");				// Extruder Control
	$("#panel_control_misc label.btn").removeClass("disabled");									// ATX Power
	$("#slider_fan_control").slider("enable");													// Fan Control
	
	$("#page_print .checkbox").removeClass("disabled");											// Print Control
	$("#slider_fan_print").slider("enable");													// Fan Control
	$("#slider_speed").slider("enable");														// Speed Factor
	for(var extr=1; extr<=5; extr++) {
		$("#slider_extr_" + extr).slider("enable");												// Extrusion Factors
	}
	
	$(".row-actions").removeClass("hidden");													// G-Code/Macro Files
}

function disableControls() {
	$("nav input, #div_heaters input, #main_content input").prop("disabled", true);				// Generic inputs
	
	$(".btn-emergency-stop, .gcode-input button[type=submit], .gcode").addClass("disabled");	// Navbar
	$(".bed-temp, .gcode, .head-temp").addClass("disabled");									// List items
	
	$("#mobile_home_buttons button, #btn_homeall, #table_move_head a").addClass("disabled");	// Move buttons
	$("#panel_extrude label.btn, #panel_extrude button").addClass("disabled");					// Extruder Control
	$("#panel_control_misc label.btn").addClass("disabled");									// ATX Power
	$("#slider_fan_control").slider("disable");													// Fan Control
	
	$("#btn_pause, #page_print .checkbox").addClass("disabled");								// Print Control
	$("#slider_fan_print").slider("disable");													// Fan Control
	$("#slider_speed").slider("disable");														// Speed Factor
	for(var extr=1; extr<=5; extr++) {
		$("#slider_extr_" + extr).slider("disable");											// Extrusion Factors
	}
	
	$(".row-actions").addClass("hidden");														// G-Code/Macro Files
}

function updateGui() {
	// Visibility for Heater Temperatures
	
	if (heatedBed) {	// Heated Bed
		$("#tr_bed").removeClass("hidden");
	} else {
		$("#tr_bed").addClass("hidden");
	}
	for(var i=1; i<=4; i++) {
		if (i <= numHeads) {
			$("#tr_head_" + i).removeClass("hidden");
		} else {
			$("#tr_head_" + i).addClass("hidden");
		}
	}
	
	// Visibility for Extruder Drive columns
	
	for(var i=1; i<=5; i++) {
		if (i <= numExtruderDrives) {
			$(".extr-" + i).removeClass("hidden");
			$("#slider_extr_" + i).slider("relayout");
		} else {
			$(".extr-" + i).addClass("hidden");
		}
	}
	if (numExtruderDrives > 0) {
		$("#row_status_2").removeClass("hidden");
	} else {
		$("#row_status_2").addClass("hidden");
	}
	
	// Do some rearrangement for the panels if we have less than or exactly three extruder drives
	
	if (numExtruderDrives <= 3) {
		$(".div-head-temp").removeClass("hidden-sm");
		$("#col_extr_totals, #td_extr_total").addClass("hidden");
		for(var i=1; i<=3; i++) {
			$("th.extr-" + i).html("Drive " + i);
			$("#row_status_2 .extr-" + i).removeClass("hidden-md");
		}
		$("#div_heaters").removeClass("col-sm-5").addClass("col-sm-6");
		$("#div_temp_chart").removeClass("col-lg-3").addClass("col-lg-5");
		$("#div_status").removeClass("col-sm-7 col-lg-5").addClass("col-sm-6 col-lg-3");
	} else {
		$(".div-head-temp").addClass("hidden-sm");
		$("#col_extr_totals, #td_extr_total").removeClass("hidden");
		for(var i=1; i<=3; i++) {
			$("th.extr-" + i).html("D" + i);
			$("#row_status_2 .extr-" + i).addClass("hidden-md");
		}
		$("#div_heaters").removeClass("col-sm-6").addClass("col-sm-5");
		$("#div_temp_chart").removeClass("col-lg-5").addClass("col-lg-3");
		$("#div_status").removeClass("col-sm-6 col-lg-3").addClass("col-sm-7 col-lg-5");
	}
	
	// Charts
	
	resizeCharts();
	drawTemperatureChart();
}

function resetGui() {
	// Auto-Complete items
	clearDefaultGCodes();
	clearHeadTemperatures();
	clearBedTemperatures();
	
	// Navbar
	$(".navbar-brand").html("Duet Web Control");
	setStatusLabel("Disconnected", "default");
	
	// Heater Temperatures
	$("#table_heaters tr > th:first-child > a").css("text-decoration", "");
	$("#table_heaters tr > th:first-child > span").text("");
	setCurrentTemperature("bed",  undefined);
	setTemperatureInput("bed", 0, 1);
	for(var i=1; i<=4; i++) {
		setCurrentTemperature(i, undefined);
		setTemperatureInput(i, 0, 1);
		setTemperatureInput(i, 0, 0);
	}
	
	// Status fields
	$("#td_x, #td_y, #td_z").text("n/a");
	for(var i=1; i<=numExtruderDrives; i++) {
		$("#td_extr_" + i).text("n/a");
	}
	$("#td_extr_total").text("n/a");
	setProbeValue(-1, undefined);
	$("#td_fanrpm").text("n/a");
	
	// Control page
	setAxesHomed([1,1,1]);
	setATXPower(false);
	$('#slider_fan_control').slider("setValue", 35);
	
	// Print Status
	$("#override_fan, #auto_sleep").prop("checked", false);
	$('#slider_fan_print').slider("setValue", 35);
	$("#page_print dd, #table_estimations td").html("n/a");
	$('#slider_speed').slider("setValue", 100);
	for(var extr=1; extr<=5; extr++) {
		$("#slider_extr_" + extr).slider("setValue", 100);
	}
	
	// G-Code Console is not cleared automatically
	
	// G-Code Files
	updateGCodeFiles();
	
	// Macro Files
	updateMacroFiles();
}

/* Dynamic GUI Events */

$("body").on("click", ".bed-temp", function(e) {
	sendGCode("M140 S" + $(this).data("temp"));
	e.preventDefault();
});

$("body").on("click", ".btn-macro", function(e) {
	sendGCode("M98 P" + $(this).data("macro"));
	e.preventDefault();
});

$("body").on("click", ".btn-print-file, .gcode-file", function(e) {
	var file = $(this).parents("tr").data("file");
	showConfirmationDialog("Start Print", "Do you want to print <strong>" + file + "</strong>?", function() {
		sendGCode("M32 " + file);
		waitingForPrintStart = true;
	});
	e.preventDefault();
});

$("body").on("click", ".btn-delete-file", function(e) {
	var row = $(this).parents("tr");
	var file = row.data("file");
	showConfirmationDialog("Delete File", "Are you sure you want to delete <strong>" + file + "</strong>?", function() {
		$.ajax("rr_delete?name=" + encodeURIComponent(currentGCodeDirectory + "/" + file), {
			async: true,
			dataType: "json",
			error: ajaxError,
			row: row,
			file: file,
			success: function(response) {
				if (response.err == 0) {
					this.row.remove();
					if ($("#table_gcode_files tbody").children().length == 0) {
						gcodeUpdateIndex = -1;
						updateGCodeFiles();
					}
				} else {
					showMessage("warning-sign", "Deletion failed", "<strong>Warning:</strong> Could not delete file <strong>" + this.file + "</strong>!", "md");
				}
			}
		});
	});
	e.preventDefault();
});

$("body").on("click", ".btn-delete-directory", function(e) {
	$.ajax("rr_delete?name=" + encodeURIComponent(currentGCodeDirectory + "/" + $(this).parents("tr").data("directory")), {
		async: true,
		dataType: "json",
		error: ajaxError,
		row: $(this).parents("tr"),
		directory: $(this).parents("tr").data("directory"),
		success: function(response) {
			if (response.err == 0) {
				this.row.remove();
				if ($("#table_gcode_files tbody").children().length == 0) {
					gcodeUpdateIndex = -1;
					updateGCodeFiles();
				}
			} else {
				showMessage("warning-sign", "Deletion failed", "<strong>Warning:</strong> Could not delete directory <strong>" + this.directory + "</strong>!<br/><br/>Perhaps it isn't empty?", "md");
			}
		}
	});
	e.preventDefault();
});

$("body").on("click", ".btn-delete-macro", function(e) {
	$.ajax("rr_delete?name=/macros/" + $(this).parents("tr").data("macro"), {
		async: true,
		dataType: "json",
		error: ajaxError,
		macro: $(this).parents("tr").data("macro"),
		row: $(this).parents("tr"),
		success: function(response) {
			if (response.err == 0) {
				this.row.remove();
				if ($("#table_macro_files tbody").children().length == 0) {
					macroUpdateIndex = -1;
					updateMacroFiles();
				}
			} else {
				showMessage("warning-sign", "Deletion failed", "<strong>Warning:</strong> Could not delete macro <strong>" + this.macro + "</strong>!", "md");
			}
		}
	});
	e.preventDefault();
});

$("body").on("click", ".btn-run-macro", function(e) {
	sendGCode("M98 P/macros/" + $(this).parents("tr").data("macro"));
	e.preventDefault();
});

$("body").on("click", ".gcode", function(e) {
	if (isConnected) {
		sendGCode($(this).data("gcode"));
	}
	e.preventDefault();
});

$("body").on("click", ".gcode-directory", function(e) {
	setGCodeDirectory(currentGCodeDirectory + "/" + $(this).parents("tr").data("directory"));
	gcodeUpdateIndex = -1;
	updateGCodeFiles();
	e.preventDefault();
});

$("body").on("click", ".head-temp", function(e) {
	var inputElement = $(this).parents("div.input-group").find("input");
	var activeOrStandby = (inputElement.prop("id").match("active$")) ? "S" : "R";
	var heater = inputElement.prop("id").match("_h(.)_")[1];
	
	sendGCode("G10 P" + getToolByHeater(heater) + " " + activeOrStandby + " " + $(this).data("temp"));
	e.preventDefault();
});

$("body").on("click", "#ol_gcode_directory a", function(e) {
	setGCodeDirectory($(this).data("directory"));
	gcodeUpdateIndex = -1;
	updateGCodeFiles();
	e.preventDefault();
});

/* Static GUI Events */

$("#btn_cancel").click(function() {
	sendGCode("M0");	// Stop / Cancel Print
});

$(".btn-connect").click(function() {
	if (!isConnected) {
		// Attempt to connect with the last-known password first
		connect(sessionPassword, true);
	} else {
		disconnect();
	}
});

$(".btn-emergency-stop").click(function() {
	sendGCode("M112\nM999");
});

$("#btn_clear_log").click(function(e) {
	$("#console_log").html("");
	log("info", "<strong>Message Log cleared!</strong>");
	e.preventDefault();
});

$("#btn_extrude").click(function(e) {
	var feedrate = $("#panel_extrude input[name=feedrate]:checked").val() * 60;
	var amount = $("#panel_extrude input[name=feed]").val();
	sendGCode("G1 E" + amount + " F" + feedrate);
});
$("#btn_retract").click(function(e) {
	var feedrate = $("#panel_extrude input[name=feedrate]:checked").val() * 60;
	var amount = $("#panel_extrude input[name=feed]").val();
	sendGCode("G1 E-" + amount + " F" + feedrate);
});

$(".btn-home-x").resize(function() {
	if (!$(this).hasClass("hidden")) {
		var width = $(this).parent().width();
		if (width > 0) {
			$("#btn_homeall").css("width", width);
		}
	}
}).resize();

$("#mobile_home_buttons button, #btn_homeall, #table_move_head a").click(function(e) {
	$this = $(this);
	if ($this.data("home") != undefined) {
		if ($this.data("home") == "all") {
			sendGCode("G28");
		} else {
			sendGCode("G28 " + $this.data("home"));
		}
	} else {
		var moveString = "M120\nG91\nG1";
		if ($this.data("x") != undefined) {
			moveString += " X" + $this.data("x");
		}
		if ($this.data("y") != undefined) {
			moveString += " Y" + $this.data("y");
		}
		if ($this.data("z") != undefined) {
			moveString += " Z" + $this.data("z");
		}
		moveString += "\nM121";
		sendGCode(moveString);
	}
	e.preventDefault();
});

$("#btn_new_directory").click(function() {
	showTextInput("New directory", "Please enter a name:", function(value) {
		$.ajax("rr_mkdir?dir=" + currentGCodeDirectory + "/" + value, {
			async: true,
			dataType: "json",
			error: ajaxError,
			success: function(response) {
				if (response.err == 0) {
					gcodeUpdateIndex = -1;
					updateGCodeFiles();
				} else {
					showMessage("warning-sign", "Error", "Could not create directory!", "sm");
				}
			}
		});
	});
});

$("#btn_pause").click(function() {
	if (isPrinting) {
		sendGCode("M25");	// Pause
	} else if (isPaused) {
		sendGCode("M24");	// Resume
	}
});

$(".gcode-input").submit(function(e) {
	if (isConnected) {
		sendGCode($(this).find("input").val());
		$(this).find("input").select();
	}
	e.preventDefault();
});

// Make the auto-complete dropdown items look proper.
// This should be replaced by proper CSS someday, but
// for now we only check which elements may float around.
$(".div-gcodes").bind("shown.bs.dropdown", function() {
	var maxWidth = 0;
	$(this).find("ul > li > a").each(function() {
		var rowWidth = 0;
		$(this).find("span").each(function() {
			rowWidth += $(this).width();
		});
		
		if (rowWidth > maxWidth) {
			maxWidth = rowWidth;
		}
	});
	
	if (maxWidth > 0) {
		$(this).find("ul > li > a").each(function() {
			var rowWidth = 0;
			$(this).find("span").each(function() {
				rowWidth += $(this).width();
			});
			
			if (rowWidth < maxWidth) {
				$(this).addClass("gcode-float");
			}
		});
	}
});

$("input[type='number']").focus(function() {
	var input = $(this);
	setTimeout(function() {
		input.select();
	}, 10);
});

$("#input_temp_bed").keydown(function(e) {
	var enterKeyPressed = (e.which == 13);
	enterKeyPressed |= (e.which == 9 && window.matchMedia('(max-width: 991px)').matches); // need this for Android
	if (isConnected && enterKeyPressed) {
		sendGCode("M140 S" + $(this).val());
		$(this).select();
		
		e.preventDefault();
	}
});

$("input[id^='input_temp_h']").keydown(function(e) {
	var enterKeyPressed = (e.which == 13);
	enterKeyPressed |= (e.which == 9 && window.matchMedia('(max-width: 991px)').matches); // need this for Android
	if (isConnected && enterKeyPressed) {
		var activeOrStandby = ($(this).prop("id").match("active$")) ? "S" : "R";
		var heater = $(this).prop("id").match("_h(.)_")[1];
		
		sendGCode("G10 P" + getToolByHeater(heater) + " " + activeOrStandby + $(this).val());
		$(this).select();
		
		e.preventDefault();
	}
});

$(".navbar-brand").click(function(e) { e.preventDefault(); });

$(".navlink").click(function(e) {
	var target = $(this).data("target");
	showPage(target);
	e.preventDefault();
});

$("#panel_control_misc label.btn").click(function() {
	if ($(this).find("input").val() == 1) {		// ATX on
		sendGCode("M80");
	} else {									// ATX off
		showConfirmationDialog("ATX Power", "Do you really want to turn off ATX power?<br/><br/>This will turn off all drives, heaters and fans.", function() {
			sendGCode("M81");
		});
	}
});

$("#panel_control_misc label.btn").click(function() {
	$(this).parent().find("label.btn").removeClass("btn-primary").addClass("btn-default");
	$(this).removeClass("btn-default").addClass("btn-primary");
});

$(".span-collapse").click(function() {
	var $this = $(this);
	if(!$this.hasClass("panel-collapsed")) {
		$this.parents(".panel").find(".panel-collapse").slideUp();
		$this.addClass("panel-collapsed");
		$this.removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
	} else {
		$this.parents(".panel").find(".panel-collapse").slideDown();
		$this.removeClass("panel-collapsed");
		$this.removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
	}
});

$(".span-refresh-files").click(function() {
	gcodeUpdateIndex = -1;
	updateGCodeFiles();
	$(".span-refresh-files").addClass("hidden");
});

$(".span-refresh-macros").click(function() {
	macroUpdateIndex = -1;
	updateMacroFiles();
	$(".span-refresh-macros").addClass("hidden");
});

$("#row_info").resize(function() {
	resizeCharts();
});

$("#table_heaters tr > th:first-child > a").click(function(e) {
	if (isConnected) {
		var heater = $(this).parents("tr").index();
		var heaterState = lastStatusResponse.temps.heads.state[heater - 1];
		if (heaterState == 3) {
			showMessage("exclamation-sign", "Heater Fault", "<strong>Error:</strong> A heater fault has occured on this particular heater.<br/><br/>Please turn off your machine and check your wiring for loose connections.", "md");
		} else {
			var toolId = getToolByHeater(heater);
			if (toolId != 0) {
				if (heaterState == 2) {
					sendGCode("T0");
				} else {
					sendGCode("T" + toolId);
				}
			}
		}
	}
	$(this).blur();
	e.preventDefault();
});

/* Temperature charts */

function drawTemperatureChart()
{
	// Only draw the chart if it's possible
	if ($("#chart_temp").width() === 0) {
		drawTempChart = true;
		return;
	}
	
	// Prepare the data
	var preparedBedTemps = [];
	for(var i=0; i<recordedBedTemperatures.length; i++) {
		preparedBedTemps.push([i, recordedBedTemperatures[i]]);
	}
	var preparedHeadTemps = [[], [], [], []], heaterSamples;
	for(var head=0; head<recordedHeadTemperatures.length; head++) {
		heaterSamples = recordedHeadTemperatures[head];
		for(var k=0; k<heaterSamples.length; k++) {
			preparedHeadTemps[head].push([k, heaterSamples[k]]);
		}
	}
	
	// Draw it
	if (tempChart == undefined) {
		tempChart = $.plot("#chart_temp", [preparedBedTemps, preparedHeadTemps[0], preparedHeadTemps[1], preparedHeadTemps[2], preparedHeadTemps[3]], tempChartOptions);
	} else {
		tempChart.setData([preparedBedTemps, preparedHeadTemps[0], preparedHeadTemps[1], preparedHeadTemps[2], preparedHeadTemps[3]]);
		tempChart.setupGrid();
		tempChart.draw();
	}
	
	drawTempChart = false;
}

function resizeCharts() {
	var headsHeight = $("#table_heaters").height();
	var statusHeight = $("#div_status_table").height() - 2; /* 2px border */
	
	var max = (headsHeight > statusHeight) ? headsHeight : statusHeight;
	max -= tempChartPadding;
	
	if (max > 0) {
		$("#chart_temp").css("height", max);
	}
	
	if (drawTempChart) {
		drawTemperatureChart();
	}
}


/* Sliders */

$('#slider_fan_control').slider({
	enabled: false,
	id: "fan_control",
	min: 0,
	max: 100,
	step: 1,
	value: 35,
	tooltip: "always",
	
	formatter: function(value) {
		return value + " %";
	}
}).on("slideStart", function() {
	fanSliderActive = true;
}).on("slideStop", function(slideEvt) {
	if (isConnected && !isNaN(slideEvt.value)) {
		sendGCode("M106 S" + (slideEvt.value / 100.0));
		$("#slider_fan_print").slider("setValue", slideEvt.value);
	}
	fanSliderActive = false;
});

$('#slider_fan_print').slider({
	enabled: false,
	id: "fan_print",
	min: 0,
	max: 100,
	step: 1,
	value: 35,
	tooltip: "always",
	
	formatter: function(value) {
		return value + " %";
	}
}).on("slideStart", function() {
	fanSliderActive = true;
}).on("slideStop", function(slideEvt) {
	if (isConnected && !isNaN(slideEvt.value)) {
		sendGCode("M106 S" + (slideEvt.value / 100.0));
		$("#slider_fan_control").slider("setValue", slideEvt.value);
	}
	fanSliderActive = false;
});

for(var extr=1; extr<=5; extr++) {
	$('#slider_extr_' + extr).slider({
		enabled: false,
		id: "extr-" + extr,
		min: 50,
		max: 150,
		step: 1,
		value: 100,
		tooltip: "always",
		
		formatter: function(value) {
			return value + " %";
		}
	}).on("slideStart", function() {
		extrSliderActive = true;
	}).on("slideStop", function(slideEvt) {
		if (isConnected && !isNaN(slideEvt.value)) {
			sendGCode("M221 D" + $(this).data("drive") + " S" + slideEvt.value);
		}
		extrSliderActive = false;
	});
}

$('#slider_speed').slider({
	enabled: false,
	id: "speed",
	min: 50,
	max: 250,
	step: 1,
	value: 100,
	tooltip: "always",
	
	formatter: function(value) {
		return value + " %";
	}
}).on("slideStart", function() {
	speedSliderActive = true;
}).on("slideStop", function(slideEvt) {
	if (isConnected && !isNaN(slideEvt.value)) {
		sendGCode("M220 S" + slideEvt.value);
	}
	speedSliderActive = false;
});

/* Modals */

function showConfirmationDialog(title, message, action) {
	$("#modal_confirmation h4").html('<span class="glyphicon glyphicon-question-sign"></span> ' + title);
	$("#modal_confirmation p").html(message);
	$("#modal_confirmation button:first-child").off().one("click", action);
	$("#modal_confirmation").modal("show");
}

function showTextInput(title, message, action) {
	$("#modal_textinput h4").html(title);
	$("#modal_textinput p").html(message);
	$("#modal_textinput input").val("");
	$("#modal_textinput form").off().submit(function(e) {
		$("#modal_textinput").modal("hide");
		var value = $("#modal_textinput input").val();
		if (value.trim() != "") {
			action(value);
		}
		e.preventDefault();
	});
	$("#modal_textinput").modal("show");
}

function showMessage(icon, title, message, size) {
	$("#modal_message h4").html((icon == "") ? "" :  '<span class="glyphicon glyphicon-' + icon + '"></span> ');
	$("#modal_message h4").append(title);
	$("#modal_message p").html(message);
	$("#modal_message .modal-dialog").removeClass("modal-sm modal-lg");
	if (size != "md") {
		$("#modal_message .modal-dialog").addClass("modal-" + size);
	}
	$("#modal_message").modal("show");
}

function showPasswordPrompt() {
	$('#input_password').val("");
	$("#modal_pass_input").modal("show");
	$("#modal_pass_input").one("hide.bs.modal", function() {
		$(".btn-connect").removeClass("btn-warning disabled").addClass("btn-info").html("Connect");
	});
}

$("#modal_pass_input, #modal_textinput").on('shown.bs.modal', function() {
	$(this).find("input").focus()
});

$("#modal_message").on('shown.bs.modal', function() {
	$('#modal_message button').focus()
});

$("#form_password").submit(function(e) {
	$("#modal_pass_input").off("hide.bs.modal").modal("hide");
	connect($("#input_password").val(), false);
	e.preventDefault();
});

/* GUI Helpers */

function addBedTemperature(label, temperature) {
	$(".ul-bed-temp").append('<li><a href="#" class="bed-temp" data-temp="' + temperature + '">' + label + '</a></li>');
	$(".btn-bed-temp").removeClass("disabled");
}

function addControlMacro(label, filename) {
	var macroButton =	'<div class="btn-group">';
	macroButton +=		'<button class="btn btn-default btn-macro" data-macro="' + filename + '">' + label + '</button>';
	macroButton +=		'</div>';
	
	$("#panel_macro_buttons h4").addClass("hidden");
	$("#panel_macro_buttons .btn-group-vertical").append(macroButton);
}

function addDefaultGCode(label, gcode) {
	var item =	'<li><a href="#" class="gcode" data-gcode="' + gcode + '">';
 	item +=		'<span>' + label + '</span>';
	item +=		'<span class="label label-primary">' + gcode + '</span>';
	item +=		'</a></li>';
	
	$(".ul-gcodes").append(item);
	$(".btn-gcodes").removeClass("disabled");
}

function addGCodeFile(filename) {
	$("#page_files h1").addClass("hidden");

	var row =	'<tr data-item="' + filename + '"><td class="col-actions"></td>';
	row +=		'<td><span class="glyphicon glyphicon-asterisk"></span>' + filename + '</td>';
	row +=		'<td class="hidden-xs">loading</td>';
	row +=		'<td>loading</td>';
	row +=		'<td>loading</td>';
	row +=		'<td>loading</td>';
	row +=		'<td class="hidden-xs hidden-sm">loading</td></tr>';
	
	$("#table_gcode_files").append(row).removeClass("hidden");
}

function addMacroFile(filename) {
	$("#page_macros h1").addClass("hidden");

	var row =	'<tr data-macro="' + filename + '"><td class="col-actions"></td>';
	row +=		'<td><span class="glyphicon glyphicon-asterisk"></span>' + filename + '</td>';
	row +=		'<td>loading</td></tr>';
	
	$("#table_macro_files").append(row).removeClass("hidden");
}

function beep(frequency, duration) {
	var context = new webkitAudioContext();
	oscillator = context.createOscillator();
	
	oscillator.type = 0; // sine wave
	oscillator.frequency.value = frequency;
	oscillator.connect(context.destination);
	oscillator.noteOn && oscillator.noteOn(0);
	
	setTimeout(function() {
		oscillator.disconnect();
	}, duration);
}

function addHeadTemperature(label, temperature) {
	$(".ul-head-temp").append('<li><a href="#" class="head-temp" data-temp="' + temperature + '">' + label + '</a></li>');
	$(".btn-head-temp").removeClass("disabled");
}

function clearBedTemperatures() {
	$(".ul-bed-temp").html("");
	$(".btn-bed-temp").addClass("disabled");
}

function clearControlMacros() {
	$("#panel_macro_buttons .btn-group-vertical").html("");
	$("#panel_macro_buttons h4").removeClass("hidden");
}

function clearGCodeDirectory() {
	$("#ol_gcode_directory").children(":not(:last-child)").remove();
	$("#ol_gcode_directory").prepend('<li class="active">G-Codes Directory</li>');
}

function clearGCodeFiles() {
	$("#table_gcode_files > tbody").remove();
	$("#table_gcode_files").addClass("hidden");
	$("#page_files h1").removeClass("hidden");
	if (isConnected) {
		$("#page_files h1").text("No Files or Directories found");
	} else {
		$("#page_files h1").text("Connnect to your Duet to display G-Code files");
	}
}

function clearDefaultGCodes() {
	$(".ul-gcodes").html("");
	$(".btn-gcodes").addClass("disabled");
}

function clearHeadTemperatures() {
	$(".ul-heat-temp").html("");
	$(".btn-head-temp").addClass("disabled");
}

function clearMacroFiles() {
	$("#table_macro_files > tbody").remove();
	$("#table_macro_files").addClass("hidden");
	$("#page_macros h1").removeClass("hidden");
	if (isConnected) {
		$("#page_macros h1").text("No Macro Files found");
	} else {
		$("#page_macros h1").text("Connnect to your Duet to display Macro files");
	}
}

function formatSize(bytes) {
	// TODO: Implement KiB as option here
	
	if (bytes > 1000000) { // MB
		return (bytes / 1000000).toFixed(1) + " MB";
	}
	if (bytes > 1000) { // KB
		return (bytes / 1000).toFixed(1) + " KB";
	}
	return bytes + " B";
}

function log(style, message) {
	var entry =		'<div class="row alert-' + style + '">';
	entry +=		'<div class="col-xs-2 col-sm-2 col-md-2 col-lg-1 text-center"><strong>' + (new Date()).toLocaleTimeString() + '</strong></div>';
	entry +=		'<div class="col-xs-10 col-sm-10 col-md-10 col-lg-11">' + message + '</div></div>';
	$("#console_log").prepend(entry);
}

function recordHeaterTemperatures(bedTemp, headTemps) {
	// Add bed temperature
	if (heatedBed) {
		recordedBedTemperatures.push(bedTemp);
	} else {
		recordedBedTemperatures = [];
	}
	
	if (recordedBedTemperatures.length > maxTemperatureSamples) {
		recordedBedTemperatures.shift();
	}
	
	// Add heater temperatures
	for(var i=0; i<headTemps.length; i++) {
		recordedHeadTemperatures[i].push(headTemps[i]);
		if (recordedHeadTemperatures[i].length > maxTemperatureSamples) {
			recordedHeadTemperatures[i].shift();
		}
	}
	
	// Remove invalid data (in case the number of heads has changed)
	for(var i=headTemps.length; i<4; i++) {
		recordedHeadTemperatures[i] = [];
	}
}

function setAxesHomed(axes) {
	// Set button colors
	var unhomedAxes = "";
	if (axes[0]) {
		$(".btn-home-x").removeClass("btn-warning").addClass("btn-primary");
	} else {
		unhomedAxes = (isDelta) ? ", A" : ", X";
		$(".btn-home-x").removeClass("btn-primary").addClass("btn-warning");
	}
	if (axes[1]) {
		$(".btn-home-y").removeClass("btn-warning").addClass("btn-primary");
	} else {
		unhomedAxes += (isDelta) ? ", B" : ", Y";
		$(".btn-home-y").removeClass("btn-primary").addClass("btn-warning");
	}
	if (axes[2]) {
		$(".btn-home-z").removeClass("btn-warning").addClass("btn-primary");
	} else {
		unhomedAxes += (isDelta) ? ", C" : ", Z";
		$(".btn-home-z").removeClass("btn-primary").addClass("btn-warning");
	}
	
	// Set home alert visibility
	if (unhomedAxes == "") {
		$("#home_warning").addClass("hidden");
	} else {
		if (unhomedAxes.length > 3) {
			$("#unhomed_warning").html("The following axes are not homed: <strong>" + unhomedAxes.substring(2) + "</strong>");
		} else {
			$("#unhomed_warning").html("The following axis is not homed: <strong>" + unhomedAxes.substring(2) + "</strong>");
		}
		$("#home_warning").removeClass("hidden");
	}
}

function setATXPower(value) {
	$("input[name='atxPower']").prop("checked", false).parent().removeClass("active");
	$("input[name='atxPower'][value='" + (value ? "1" : "0") + "']").prop("checked", true).parent().addClass("active");
}

function setCurrentTemperature(heater, temperature) {
	var field = (heater == "bed") ? "#tr_bed td" : "#tr_head_" + heater + " td";
	if (temperature == undefined) {
		$(field).first().html("n/a");
	} else if (temperature == -273.15 /*ABS_ZERO*/) {
		$(field).first().html("error");
	} else {
		$(field).first().html(temperature.toFixed(1) + " °C");
	}
}

function setDeltaMode(deltaOn) {
	if (deltaOn) {
		$(".home-buttons div, div.home-buttons").addClass("hidden");
		$("td.home-buttons").css("padding-right", "0px");
		$("#btn_homeall").css("width", "");
	} else {
		$(".home-buttons div, div.home-buttons").removeClass("hidden");
		$("td.home-buttons").css("padding-right", "");
		$("#btn_homeall").resize();
	}
	isDelta = deltaOn;
}

function setGCodeFileItem(row, size, height, layerHeight, filamentUsage, generatedBy) {
	row.data("file", row.data("item"));
	row.removeData("item");
	
	var buttons =	'<button class="btn btn-success btn-print-file btn-sm"><span class="glyphicon glyphicon-print"></span></button>';
	buttons +=		'<button class="btn btn-danger btn-delete-file btn-sm"><span class="glyphicon glyphicon-trash"></span></button>';
	row.children().eq(0).html(buttons);
	
	var linkCell = row.children().eq(1);
	linkCell.find("span").removeClass("glyphicon-asterisk").addClass("glyphicon-file");
	linkCell.html('<a href="#" class="gcode-file">' + linkCell.html() + '</a>');
	
	row.children().eq(2).html(formatSize(size));
	
	if (height > 0) {
		row.children().eq(3).html(height + " mm");
	} else {
		row.children().eq(3).html("n/a");
	}
	
	if (layerHeight > 0) {
		row.children().eq(4).html(layerHeight + " mm");
	} else {
		row.children().eq(4).html("n/a");
	}
	
	if (filamentUsage.length > 0) {
		row.children().eq(5).html(filamentUsage.reduce(function(a, b) { return a + b; }).toFixed(1) + " mm");
	} else {
		row.children().eq(5).html("n/a");
	}
	
	if (generatedBy != "") {
		row.children().eq(6).html(generatedBy);
	} else {
		row.children().eq(6).html("n/a");
	}
}

function setGCodeDirectoryItem(row) {
	row.data("directory", row.data("item"));
	row.removeData("item");
	
	row.children().eq(0).html('<button class="btn btn-danger btn-delete-directory btn-sm pull-right"><span class="glyphicon glyphicon-trash"></span></button>');
	
	var linkCell = row.children().eq(1);
	linkCell.find("span").removeClass("glyphicon-asterisk").addClass("glyphicon-folder-open");
	linkCell.html('<a href="#" class="gcode-directory">' + linkCell.html() + '</a>').prop("colspan", 6);
	
	for(var i=6; i>=2; i--) {
		row.children().eq(i).remove();
	}
	
	if (gcodeLastDirectory == undefined) {
		var firstRow = $("#table_gcode_files tbody > tr:first-child");
		if (firstRow != row) {
			row.insertBefore(firstRow);
		}
	} else {
		row.insertAfter(gcodeLastDirectory);
	}
	gcodeLastDirectory = row;
}

function setGCodeDirectory(directory) {
	currentGCodeDirectory = directory;
	
	$("#ol_gcode_directory").children(":not(:last-child)").remove();
	if (directory == "/gcodes") {
		$("#ol_gcode_directory").prepend('<li class="active">G-Codes Directory</li>');
		$("#ol_gcode_directory li:last-child").html("Go Up");
	} else {
		var listContent = '<li><a href="#" data-directory="/gcodes">G-Codes Directory</a></li>';
		var directoryItems = directory.split("/"), directoryPath = "/gcodes";
		for(var i=2; i<directoryItems.length -1; i++) {
			directoryPath += "/" + directoryItems[i];
			listContent += '<li class="active"><a href="#" data-directory="' + directoryPath + '">' + directoryItems[i] + '</a></li>';
		}
		listContent += '<li class="active">' + directoryItems[directoryItems.length -1] + '</li>';
		$("#ol_gcode_directory").prepend(listContent);
		$("#ol_gcode_directory li:last-child").html('<a href="#" data-directory="' + directoryPath + '">Go Up</a>');
	}
}

function setHeaterState(heater, status) {
	var statusText = "n/a", underline = "";
	switch (status) {
		case 0:
			statusText = "off";
			break;
			
		case 1:
			statusText = "standby";
			break;
			
		case 2:
			statusText = "active";
			underline = "underline";
			break;
			
		case 3:
			statusText = "fault";
			break;
	}
	
	if (heater != "bed") {
		// TODO: make this optional vvv
		var tool = getToolByHeater(heater);
		if (tool != 0) {
			statusText += " (T" + tool + ")";
		}
		$("#table_heaters tr > th:first-child").eq(heater).children("a").css("text-decoration", underline);
		$("#table_heaters tr > th:first-child").eq(heater).children("span").text(statusText);
	} else {
		$("#table_heaters tr:last-child > th:first-child > span").text(statusText);
	}
	
}

function setMacroFileItem(row, size) {
	row.data("file", row.data("item"));
	row.removeData("item");
	
	var buttons =	'<button class="btn btn-success btn-run-macro btn-sm"><span class="glyphicon glyphicon-play"></span></button>';
	buttons +=		'<button class="btn btn-danger btn-delete-macro btn-sm"><span class="glyphicon glyphicon-trash"></span></button>';
	row.children().eq(0).html(buttons);
	
	var linkCell = row.children().eq(1);
	linkCell.find("span").removeClass("glyphicon-asterisk").addClass("glyphicon-file"); // TODO: bookmark icon if label set
	
	row.children().eq(2).html(formatSize(size));
}

function setPauseStatus(paused) {
	if (paused == isPaused) {
		return;
	}
	
	if (paused) {
		$("#btn_cancel").parents("div.btn-group").removeClass("hidden");
		$("#btn_pause").removeClass("btn-warning").addClass("btn-success").text("Resume");
	} else {
		$("#btn_cancel").parents("div.btn-group").addClass("hidden");
		$("#btn_pause").removeClass("btn-success").addClass("btn-warning").text("Pause Print");
	}
	isPaused = paused;
}

function setPrintStatus(printing) {
	if (printing == isPrinting) {
		return;
	}
	
	if (printing) {
		$("#btn_pause").removeClass("disabled");
	} else {
		$("#btn_pause").addClass("disabled");
		
		if (isConnected && $("#auto_sleep").is(":checked")) {
			sendGCode("M1");
			$("#auto_sleep").prop("checked", false);
		}
	}
	
	if (waitingForPrintStart) {
		showPage("print");
		waitingForPrintStart = false;
	}
}

function setProbeValue(value, secondaryValue) {
	if (value < 0) {
		$("#td_probe").html("n/a");
	} else if (secondaryValue == undefined) {
		$("#td_probe").html(value);
	} else {
		$("#td_probe").html(value + " (" + secondaryValue.reduce(function(a, b) { return a + b; }) + ")");
	}
	
	if (probeTriggerValue != undefined && value > probeTriggerValue && !isPrinting) {
		$("#td_probe").css("background-color", probeTriggerColor);
	} else if (probeSlowDownValue != undefined && value > probeSlowDownValue && !isPrinting) {
		$("#td_probe").css("background-color", probeSlowDownColor);
	} else {
		$("#td_probe").css("background-color", "");
	}
}

function setStatusLabel(text, style) {
	$(".label-status").removeClass("label-default label-danger label-info label-warning label-success").addClass("label-" + style).text(text);
}

function setTemperatureInput(head, value, active) {
	var tempInput;
	
	if (head == "bed") {
		tempInput = "#input_temp_bed";
	} else {
		tempInput = "#input_temp_h" + head + "_";
		tempInput += (active) ? "active": "standby";
	}
	
	if (!$(tempInput).is(":focus")) {
		$(tempInput).val((value < 0) ? 0 : value);
	}
}

function showPage(name) {
	$(".navitem, .page").removeClass("active");
	$(".navitem-" + name + ", #page_" + name).addClass("active");
	
	if (name != currentPage) {
		if (name == "control") {
			$("#slider_fan_control").slider("relayout")
		}
		
		if (name == "print") {
			$("#slider_speed").slider("relayout");
			$("#slider_fan_print").slider("relayout");
			for(var extr=1; extr<=5; extr++) {
				$("#slider_extr_" + extr).slider("relayout");
			}
			waitingForPrintStart = false;
		}
		
		if (name == "files") {
			if (gcodeUpdateIndex == knownGCodeFiles.length) {
				$(".span-refresh-files").removeClass("hidden");
			} else {
				updateGCodeFiles();
			}
		} else {
			$(".span-refresh-files").addClass("hidden");
		}
		
		if (name == "macros") {
			if (macroUpdateIndex == knownMacroFiles.length) {
				$(".span-refresh-macros").removeClass("hidden");
			} else {
				updateMacroFiles();
			}
		} else {
			$(".span-refresh-macros").addClass("hidden");
		}
	}
	currentPage = name;
}

/* Data helpers */

function getToolByHeater(heater) {
	if (toolMapping == undefined) {
		return 0;
	}
	
	for(var i=0; i<toolMapping.length; i++) {
		for(var k=0; k<toolMapping[i].heaters.length; k++) {
			if (toolMapping[i].heaters[k] == heater) {
				return i + 1;
			}
		}
	}
	return 0;
}