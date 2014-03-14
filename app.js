var express = require("express");
var http = require("http");
var path = require("path");
var fs = require("fs");
var nconf = require("nconf");
var ejs = require("ejs");

var appPath = path.dirname(require.main.filename);
var User = require(path.join(appPath, "/modules/User.js"))();
var Calendar = require(path.join(appPath, "/modules/calendar.js"));

var app = express();
app.use(express.bodyParser());

require("./routes/routes.js")(app);

init();

function init() {
   nconf.file({ file: path.join(__dirname, "config.json") }).argv();

   var currentIpAddress = require(path.join(appPath, "/modules/Utils.js"))().GetCurrentIPAddress(true)
   var currentPort = nconf.get("port");

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
   
   // Temporarily moved here
   app.post("/", function (req, res) {
      var contrast = req.body.contrast;
      var brightness = req.body.brightness;
      //Display.setBrightness(parseInt(brightness));
      //Display.setContrast(parseInt(contrast));

      var t = User.currentUser;

      var pageObj = { "title": "my title", "key": "val", "currentUser": User.currentUser, "googleUrl": User.redirectUrl(), "boardrooms": app.get("boardrooms") }
      res.render("index", pageObj);
   });


   app.set("boardrooms", nconf.get("boardrooms"));

   // Configure for EJS templating
   app.set("views", __dirname + "/views");
   app.engine(".html", require("ejs").__express);
   app.set("view options", { layout: false });
   app.set("view engine", "html");

   // to-do: create a favicon!
   app.use(express.favicon(path.join(__dirname, "/public/images/favicon.ico")));

   app.use(express.logger("dev"));
//   app.use(express.bodyParser());
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