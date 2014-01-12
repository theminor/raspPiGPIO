var util = require('util');
var stream = require('stream');
var exec = require('child_process').exec;

util.inherits(Driver,stream);
util.inherits(Device,stream);

var updateInterval = 10000; // interval in milliseconds to check the state of the pins

function Driver(opts, app) {
  var self = this;
  app.on('client::up',function(){
    self.emit('register', new Device(app));
  });
};

function Device(app) {
	var self = this;
	this._app = app;
	this.writeable = true;
	this.readable = false;
	this.V = 0;
	this.D = 244;  // Device ID 244 is generic state device
	this.G = "raspPiGPIO";
	this.name = "raspPiGPIO";
	process.nextTick(function() {        // Once all set up, establish a single update process that updates every "updateInterval" seconds
		setInterval(function() {
			updateDevice(self);
		}, updateInterval);
	});
};

/*
pins:
	GPIO7 - BCMGPIO4 - pin 7
	GPIO0 - BCMGPIO17 - pin 11
	GPIO2 - BCMGPIO21 (rev 1) or BCMGPIO22 (rev 2) - pin 13
	GPIO3 - BCMGPIO22 - pin 15
	GPIO1 - BCMGPIO18 - pin 12
	GPIO4 - BCMGPIO23 - pin 16
	GPIO5 - BCMGPIO24 - pin 18
	GPIO6 - BCMGPIO25 - pin 22
secondary GPIO connector (rev 2 only):
	GPIO8 - BCMGPIO28 - header pin 3
	GPIO10 - BCMGPIO30 - header pin 5
	GPIO9 - BCMGPIO29 - header pin 4
	GPIO11 - BCMGPIO31 - header pin 6	
*/

// states are in the form: "pin 11 high" or "gpio 0 high" or "bcmgpio 17 high" (all of these turn pin 11 high)
// or "low" to set the pin low
Device.prototype.write = function(dataRcvd) {
	app.log.info("raspPiGPIO received the following data : " + dataRcvd);
	var app = this._app;
	var parts = dataRcvd.split(' ');
	var cmdType = "";
	if (parts[0] == "pin") { cmdType = "gpio -1 "; }
	else if (parts[0] == "gpio") { cmdType = "gpio "; }
	else if (parts[0] == "bcmgpio") { cmdType = "gpio -g "; }
	else { app.log.warn("raspPiGPIO received improper data - initial part of the command must be 'pin', 'gpio', or 'bcmgpio'."); return undefined; };;
	if (isNan(parts[1])) { app.log.warn("raspPiGPIO received improper data - second part of the command must be a number."); return undefined; };;
	var highOrLowNum = "";
	if (parts[2] == "high") { highOrLowNum = " 1"; }
	else if (parts[2] == "low") { highOrLowNum = " 0"; }
	else { app.log.warn("raspPiGPIO received improper data - final part of the command must be 'high' or 'low'."); return undefined; };;
	var cmdToExecute = cmdType + "mode " + parts[1] + " out && " cmdType + "write " + parts[1] + highOrLowNum;
	app.log.info("raspPiGPIO data received appears valid. Executing command: " + cmdToExecute);
	exec(cmdToExecute, function(error, stdout, stderr) {
		app.log.info("raspPiGPIO result of executed command : " + stdout);
	};
};

module.exports = Driver;
