var SerialPort = require("serialport").SerialPort;
var path = require("path");
var Utils = require(path.join(path.dirname(require.main.filename), "/modules/Utils.js"))();
// To-do: use alias of this and reduce number of public methods

module.exports = function (comport, baudrate, callback) {
   //var SerialPort = require("serialport").SerialPort

   var DISPLAY_ON = [0xFE, 0x42]; // - This command turns the display backlight on . The argument is how many minutes to stay on, the command is supported but we don't handle the timeout so that number is ignored
   var DISPLAY_OFF = [0xFE, 0x46]; // - turn the display backlight off
   var BRIGHTNESS = [0xFE, 0x99]; // - set the overall brightness of the backlight (the color component is set separately). Setting is saved to EEPROM
   //Set & Save Brightness - 0xFE 0x98 - same as above
   var CONTRAST = [0xFE, 0x91]; // - set the display contrast. In general, around 180-220 value is what works well. Setting is saved to EEPROM
   //Set & Save Contrast - 0xFE 0x91 - same as above
   var SCROLL_ON = [0xFE, 0x51]; // - this will make it so when text is received and there's no more space on the display, the text will automatically 'scroll' so the second line becomes the first line, etc. and new text is always at the bottom of the display
   var SCROLL_OFF = [0xFE, 0x52]; // - this will make it so when text is received and there's no more space on the display, the text will wrap around to start at the top of the display.
   var CLEAR_SCREEN = [0xFE, 0x58]; // - this will clear the screen of any text
   //Change startup splash screen - 0xFE 0x40 - after sending this command, write up to 32 characters (for 16x2) or up to 80 characters (for 20x4) that will appear as the splash screen during startup. If you don't want a splash screen, write a bunch of spacesMoving and changing the cursor:
   var GOTO = [0xFE, 0x47]; // - set the position of text entry cursor. Column and row numbering starts with 1 so the first position in the very top left is (1, 1)
   var GOTO_HOME = [0xFE, 0x48]; // - place the cursor at location (1, 1)
   //Cursor back - 0xFE 0x4C - move cursor back one space, if at location (1,1) it will 'wrap' to the last position.
   //Cursor forward - 0xFE 0x4D - move cursor back one space, if at the last location location it will 'wrap' to the (1,1) position.
   //Underline cursor on - 0xFE 0x4A - turn on the underline cursor
   //Underline cursor off - 0xFE 0x4B - turn off the underline cursor
   //Block cursor on - 0xFE 0x53 - turn on the blinking block cursor
   //Block cursor off - 0xFE 0x54 - turn off the blinking block cursor



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

   function SetBrightness(brightness) {
      serialPort.write(BRIGHTNESS.concat(parseInt(brightness)));
      console.log(BRIGHTNESS.concat(brightness));
   }

   function SetContrast(contrast) {
      console.log(CONTRAST.concat(contrast));
      //serialPort.write(CONTRAST.concat(parseInt(contrast)));
      serialPort.write([0xFE, 0x50, 0xB4]);
   }


   this.clearScreen = function () {
      ClearScreen();
   }

   function ClearScreen() {
      serialPort.write(CLEAR_SCREEN);
      serialPort.write(SCROLL_OFF);
   }

   function GoTo(x, y) {
      serialPort.write(GOTO.concat(x).concat(y));
   }

   this.setBrightness = function (brightness) {
      SetBrightness(brightness);
   }

   this.setContrast = function (contrast) {
      SetContrast(contrast);
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


      //var currentDisplaycurrentTime = ("0" + currentTime.getHours()).toString().substr(-2) + ":" + ("0" + currentTime.getMinutes()).toString().substr(-2);
      var lines = [];


      ClearScreen();

      // Ensure the events are sorted. Don't rely on natural order from API
      events.sort(function (a, b) {
         var aStart = a.start.datecurrentTime;
         var bStart = b.start.datecurrentTime;
         if (aStart < bStart) {
            return -1
         }
         else if (aStart > bStart) {
            return 1
         } else {
            return 0
         }
      });

      // To-do: Nasty code to be refactored shortly
      var colour = colours.GREEN;
      var event;

      var currentTime = new Date();
      var startDate = new Date();
      var endDate = new Date();

      var days = 0;
      var hours = 0;
      var minutes = 0;

      for (var loop = 0; loop < events.length; loop++) {
         event = events[loop];

         startDate = new Date(event.start.dateTime);
         endDate = new Date(event.end.dateTime);

         if (startDate < currentTime && currentTime >= endDate) {
            // Do nothing. It means the entire event has transpired in the past
         }

         if (startDate < currentTime && currentTime < endDate) {
            // Meeting is in progress
            colour = colours.RED;
            minutes = Utils.DateDiff(endDate, currentTime, "minutes");
            break;
         }

         if (startDate > currentTime) {
            minutes = Utils.DateDiff(currentTime, startDate, "minutes");
            if (minutes < threshold) {
               // Meeting is in less than 'threshold' minutes
               colour = colours.ORANGE;
               break;
            } else {
               // Meeting is in the future beyond our threshold and we defaulted to GREEN earlier
               break;
            }
         }
      }


      days = parseInt(minutes / 1440);
      hours = parseInt((minutes - (days * 1440)) / 60);
      minutes = parseInt(minutes - ((days * 1440) + (hours * 60)));

      // zeropad as strings
      var timeRemaing = ("0" + days).substr(-2) + ":" + ("0" + hours).substr(-2) + ":" + ("0" + minutes).substr(-2);
      var timeDisplay = ("0" + currentTime.getHours()).substr(-2) + ":" + ("0" + currentTime.getMinutes()).substr(-2);

      console.log("x");

      lines[0] = event.creator.displayName.substr(0, 16);
      lines[1] = timeRemaing + "   " + timeDisplay;

      _display.goto(1, 1);
      _display.write(lines[0]);
      _display.goto(1, 2);
      _display.write(lines[1]);
      _display.setColour(colour);
   }

   return this;
}