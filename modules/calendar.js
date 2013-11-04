var googleapis = require("googleapis");
var path = require("path");
var cronJob = require("cron").CronJob;
var User = require(path.join(path.dirname(require.main.filename), "/modules/User.js"))();

// to-do: consider removing User altogether and passing oauth2Client in as a param

module.exports = function (tokens, calendarId, cronPattern) {
   this.calendarItems = function () {

   }

   // Set a cron job to fetch updates on a regular basis
   this.startFetches = function (callback) {
      var job = new cronJob({
         cronTime: cronPattern,
         onTick: function () {
            fetchCalendarItems(callback);
         },
         start: true
         //timeZone: "America/Toronto"
      });
      job.start();
   }


   function fetchCalendarItems(callback) {
      console.log("fetchCalendarItems: ", calendarId);

      var that = this;

      User.oauth2Client.credentials = tokens;
      
      googleapis.discover("calendar", "v3").execute(function (err, client) {
         if (!err) {
            var params = {
               "calendarId": calendarId,
               "maxResults": 20,
               "timeMin": new Date(new Date().setHours(new Date().getHours() - 2)).toISOString()
            };
            client.calendar.events.list(params).withAuthClient(User.oauth2Client).execute(function (err, response) {
               if (!err) {
                  callback(null, response.items);
                  console.log("success");
               }
               else {
                  callback(err, {});
                  //console.log("Err:", err, "\n\nResponse:", response);
                  //response.items.forEach(function (item, index) {
                  //   console.log(index);
                  //   //console.log(
                  //   //   item.creator.email || "no email",
                  //   //   item.creator.displayName,
                  //   //   item.start.dateTime,
                  //   //   item.end.dateTime,
                  //   //   item.summary,
                  //   //   item.description);
                  //});
                  //that.pending = response;
                  
               }
            });
         }
         else {
            console.log("error getCurrentUser() :", err);
            callback(err, {});            
         }
      });
   }

   return this;
}