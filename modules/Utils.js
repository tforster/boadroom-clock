module.exports = function () {



   this.GetCurrentIPAddress = function (ignoreLoopback) {
      var currentIpAddress = "0.0.0.0";
      var ifaces = require("os").networkInterfaces();
      for (var dev in ifaces) {
         var alias = 0;
         ifaces[dev].forEach(function (details) {
            if (details.family == "IPv4") {
               if (ignoreLoopback) {
                  if (dev.toLowerCase().indexOf("loopback") === -1) {
                     currentIpAddress = details.address;
                  }
                  ++alias;
               }
               else {
                  // To-do: rationalize multiple IP addresses (return an array perhaps?)             
               }
            }
         });
      }
      return currentIpAddress;
   }


   this.DateDiff = function (date1, date2, interval) {
      var second = 1000, minute = second * 60, hour = minute * 60, day = hour * 24, week = day * 7;

      date1 = new Date(date1);
      date2 = new Date(date2);

      var timediff = date2 - date1;
      if (isNaN(timediff)) {
         return NaN;
      }

      switch (interval) {
         case "years":
            return date2.getFullYear() - date1.getFullYear();
            break;

         case "months":
            return ((date2.getFullYear() * 12 + date2.getMonth()) - (date1.getFullYear() * 12 + date1.getMonth()));
            break;

         case "weeks":
            return Math.floor(timediff / week);
            break;

         case "days":
            return Math.floor(timediff / day);
            break;

         case "hours":
            return Math.floor(timediff / hour);
            break;

         case "minutes":
            return Math.floor(timediff / minute);
            break;

         case "seconds":
            return Math.floor(timediff / second);
            break;

         default:
            return undefined;
            break;
      }
   }



   return this;
}