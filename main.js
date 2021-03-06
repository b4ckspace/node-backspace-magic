var Udpio = require('./Udpio')
   ,Door  = require('./components/Door')
   ,DoorBell = require('./components/DoorBell')
   ,Heater = require('./components/Heater')
   ,DatabaseLog = require('./components/DatabaseLog')
   ,winston = require('winston')
   ,settings = require('./settings')
   ,StatusAPI = require('bckspc-status')
   ,Ledboard = require('./Ledboard.js');

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            timestamp: true,
            colorize: true
        })
    ]
});

var status_api = new StatusAPI(settings.status_api, 120);

var doorcontrol = new Door(logger);
var doorbell = new DoorBell(logger);

var heater = new Heater(logger);
var dblog = new DatabaseLog(logger);

var ledboard = new Ledboard(settings.ledboard_api);

var udp_events = new Udpio('AIO0', settings.udpio.port, settings.udpio.ip, logger);
var common_events = new Udpio('COMMON', settings.udpio.port, settings.udpio.ip, logger);

// Request packages on init
udp_events.init();

// Doorcontrol
udp_events.on('doorlock', function(val) {
    doorcontrol.lock(val);
    dblog.logEvent('SCHLOSS', val);
});

udp_events.on('doorframe', function(val){
    doorcontrol.frame(val);
    dblog.logEvent('RAHMEN', val);
});

udp_events.on('doorbutton', function(val){
    doorcontrol.button(val);
    dblog.logEvent('TASTER', val);
});

udp_events.on('doorbell', function(val){
    doorbell.ring(val);
    dblog.logEvent('DOORBELL', val);
});

common_events.on('irc_alarm', function(val) {
    ledboard.send_text('irc: '+val);
});

// Heater
status_api.on('space_closed', function() {
    doorbell.space_status(false);
    heater.switch_off();
});

status_api.on('space_opened', function() {
    doorbell.space_status(true);
    heater.switch_on();
});
