var SerialPort = require("serialport").SerialPort;
// To-do: use alias of this and reduce number of public methods

module.exports = function (comport, baudrate, callback) {
   //var SerialPort = require("serialport").SerialPort
   console.log("constructor");
   var _display = this;

   var _callback = callback;
   this.colours = {
      "GREEN": [0, 255, 0],
      "ORANGE": [255, 165, 0],
      "RED": [255, 0, 0]
   }

   var serialPort = new SerialPort(comport, {
      baudrate: baudrate
   }, true); 

   var isOpen = false;

   serialPort.on("open", function () {
      console.log("port opened");
      isOpen = true;
      _callback();
   });



   this.clearScreen = function () {
      ClearScreen();
   }

   function ClearScreen() {
      serialPort.write([0xFE, 0x58]);
   }

   function GoTo(x, y) {
      serialPort.write([0xFE, 0x47, x.toString(16), y.toString(16)]);

   }
   this.goto = function (x, y) {
      GoTo(x, y);
   }

   function SetColour(colour) {
      serialPort.write([0xFE, 0xD0].concat(colour));
   }

   this.setColour = function (colour) {
      SetColour(colour);
   }

   function write(str) {
      console.log("write ", isOpen);
      if (!isOpen) {
         console.log("here");
         serialPort.open(function () {

            console.log('port opened');

            serialPort.write(str, function (err, results) {
               console.log('err ' + err);
               console.log('results ' + results);
            });
         });
      }
      else {
         serialPort.write(str);
      }

   }

   this.write = function (str) {
      write(str);
   }


   this.show = function (events, threshold) {
      // Currently hardcoded to a 2x16 display. 
      // To-do: Allow for different format LCD displays

      var time = new Date();
      var timestr = ("0" + time.getHours()).toString().substr(-2) + ":" + ("0" + time.getMinutes()).toString().substr(-2);
      var line1 = "           " + timestr;

      ClearScreen();

      // Ensure the events are sorted. Don't rely on natural order from API
      events.sort(function (a, b) {
         var aStart = a.start.dateTime;
         var bStart = b.start.dateTime;
         if (aStart < bStart)
            return -1
         if (aStart > bStart)
            return 1
         return 0 
      });

      // To-do: Nasty code to be refactored shortly
      var exit = false;
      var colour = colours.GREEN;
      var event;
      var startDate;
      var endDate;
      events.forEach(function (obj, index) {

         startDate = new Date(obj.start.dateTime);
         endDate = new Date(obj.end.dateTime);

         if (startDate < time && time < endDate && !exit) {
            // Meeting is in progress
            colour = colours.RED;
            event = obj;
            exit = true;
         }
         else if (startDate > time && !exit) {
            // Meeting is in less than 'threshold' minutes
            if (new Date(startDate.getMinutes() - threshold) < time) {
               colour = colours.ORANGE;
            }
            event = obj;
            exit = true;
         }

      });
      _display.write(event.creator.displayName.substr(0, 8) + "..." + timestr);
      _display.goto(1, 2);
      _display.write(parseInt((new Date(event.start.dateTime).getTime() - time.getTime()) / 1000 / 60) + ("0" + new Date(event.start.dateTime).getHours()).toString().substr(-2) + ":" + ("0" + new Date(event.start.dateTime).getMinutes()).toString().substr(-2));
      _display.setColour(colour);
   }

   return this;
}