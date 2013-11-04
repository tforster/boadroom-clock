var express = require("express");
var http = require("http");
var path = require("path");
var fs = require("fs");
var nconf = require("nconf");
var ejs = require("ejs");
var Winston = require("winston");
var WinstonMongoDB = require("winston-mongodb").MongoDB;

var appPath = path.dirname(require.main.filename);
var User = require(path.join(appPath, "/modules/User.js"))();
var Calendar = require(path.join(appPath, "/modules/calendar.js"));

var app = express();
require("./routes/routes.js")(app);

init();

function init() {
   nconf.file({ file: path.join(__dirname, "config.json") }).argv();
   Winston.add(WinstonMongoDB, nconf.get("winston"));

   var currentIpAddress = GetCurrentIPAddress(true);
   var currentPort = nconf.get("port");

   Winston.info("Initializing clock on IP %s:%s", currentIpAddress, currentPort);

   User.setSecrets(nconf.get("oAuth:secrets"));
   if (nconf.get("debug")) {
      app.use(express.errorHandler());
   }

   var serialDisplay = nconf.get("serialDisplay");
   var Display = require(path.join(appPath, "/modules/SerialDisplay.js"))(
      serialDisplay.comport,
      serialDisplay.baudrate, function () {
         // Init the display
         Display.clearScreen();
         Display.setColour(Display.colours.GREEN);
         Display.write("Clock admin on\r" + currentIpAddress + ":" + currentPort);
      });
   
   // Configure for EJS templating
   app.set("views", __dirname + "/views");
   app.engine(".html", require("ejs").__express);
   app.set("view options", { layout: false });
   app.set("view engine", "html");

   // to-do: create a favicon!
   app.use(express.favicon(path.join(__dirname, "/public/images/favicon.ico")));

   app.use(express.logger("dev"));
   app.use(express.bodyParser());
   app.use(express.methodOverride());
   app.use(app.router);
   app.use(express.static(path.join(__dirname, "public")));

   // async call to get/check currentUser
   User.getCurrentUserFromCache(function (currentUser) {
      http.createServer(app).listen(currentPort, function () {
         console.log("Express server listening on port " + currentPort);

         var calendar = new Calendar(
            nconf.get("oAuth:tokens"),
            "mytbwa.com_2d37383035363533332d393434@resource.calendar.google.com",            
            nconf.get("cronPattern")
         );

         calendar.startFetches(function (err, events) {
            if (!err) {
               // 10 = threshold to show orange
               Display.show(events, 10);
            }
            else {
               console.log("app.startFetches err: ", err);
            }
         });

      });
   });
}

// To-do: refactor to a utils module
function GetCurrentIPAddress(ignoreLoopback) {
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