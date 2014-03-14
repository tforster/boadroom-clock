var googleapis = require("googleapis");
var nconf = require("nconf");
var OAuth2Client = googleapis.OAuth2Client;

/*
From: https://developers.google.com/+/web/api/javascript#gapiauthchecksessionstatesessionparams_callback

gapi.auth.checkSessionState(sessionParams, callback)
sessionParams - type: object
An object, which must include the following parameters.
client_id - type: string
The client ID of the app. Required.
session_state - type: string
The session_state from the OAuth 2.0 token or null if you want to only determine if the user is signed in to Google.






*/

module.exports = function () {
   this.oauth2Client = new OAuth2Client();
   this.tokens = {};
   this.secrets = {};
   this.oauth2Client = {};
   this.currentUser = {};

   this.getCurrentUserFromCache = function (callback) {
      var that = this;

      that.oauth2Client.credentials = nconf.get("oAuth:tokens");

      googleapis.discover("oauth2", "v2").execute(function (err, client) {
         if (!err) {
            client.oauth2.userinfo.get({ userId: "me" }).withAuthClient(that.oauth2Client).execute(function (err, data) {
               if (err) {
                  if (err.code === 401) {
                     nconf.set("currentUser", {});
                     nconf.save();
                     that.currentUser = {};
                     console.log("write to serial port: 'authentication required. use your browser to go to ip address'");
                     callback(currentUser);
                  }
                  else {
                     console.log("getCurrentUser(): ", err);
                     nconf.set("currentUser", {});
                     nconf.save();
                     that.currentUser = {};
                     console.log("write to serial port: 'authentication required. use your browser to go to ip address'");
                     callback(currentUser);
                  }
               }
               else {
                  nconf.set("currentUser", data);
                  nconf.save();
                  that.currentUser = data;
                  callback(that.currentUser);
               }
            });
         }
         else {
            console.log("error getCurrentUser() :", err);
         }
      });
   },


   this.setSecrets = function (secrets) {
      // when we refactor, flip to this to set values
      this.oauth2Client = new OAuth2Client(secrets.clientId, secrets.clientSecret, secrets.redirectUrl);
      //this.clientId = clientId;
      //this.clientSecret = clientSecret;
      //this.redirectUrl = redirectUrl;
   };

   this.logout = function () {
      this.currentUser = {};
      nconf.set("currentUser", {});
      nconf.save();
   };

   this.login = function (code, success_callback, error_callback) {
      var authClient = this.oauth2Client;
      var that = this;

      authClient.getToken(code, function (err, tokens) {
         nconf.set("oAuth:tokens", tokens);
         nconf.save();
         authClient.credentials = tokens;

         googleapis.discover("oauth2", "v2").discover("calendar", "v3").execute(function (err, client) {
            if (!err) {
               client.oauth2.userinfo.get({ userId: "me" }).withAuthClient(authClient).execute(function (err, data) {
                  if (err) {
                     console.log("error: ", err);
                     that.logout();
                     error_callback();
                  }
                  else {
                     console.log("\n***\nlogin callback: ", data);
                     nconf.set("currentUser", data);
                     that.currentUser = data;
                     nconf.save();
                     success_callback();
                  }
               });
            }
            else {
               console.log("error: ", err);
               that.logout();
               error_callback();
            }
         });
      });
   };

   this.redirectUrl = function () {
      return this.oauth2Client.generateAuthUrl({
         access_type: "offline",
         prompt: "consent",
         scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly"
      });
   };

   return this;
}