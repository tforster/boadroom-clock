var path = require("path");
var User = require(path.join(path.dirname(require.main.filename), "/modules/User.js"))();

module.exports = function (app) {
   app.get("/", function (req, res) {
      var t = User.currentUser;

      var pageObj = { "title": "my title", "key": "val", "currentUser": User.currentUser, "googleUrl": User.redirectUrl(), "boardrooms": app.get("boardrooms") }
      res.render("index", pageObj);
   });
   
   app.get("/about", function (req, res) {
      var pageObj = { "title": "about", "key": "val", "currentUser": User.currentUser, "googleUrl": User.redirectUrl() }
      res.render("index", pageObj);
   });

   app.get("/contact", function (req, res) {
      var pageObj = { "title": "contact", "key": "val", "currentUser": User.currentUser, "googleUrl": User.redirectUrl() }
      res.render("index", pageObj);
   });

   // Callback from Google oAuth
   app.get("/login/google/redirect", function (req, res) {
      User.login(req.query.code,
         function () { res.redirect("/") },
         function () { res.redirect("/?error") }
         );
   });

};