# Boardroom Booking Clock #
An Internet enabled clock that shows the next event scheduled for Google Calendar resources like meeting rooms. Intended to run on a headless Raspberry Pi with a serial connected LCD character display. 

The LCD character display shows the current time, the name of the person that has the resource booked next and the minutes remaining until the resource is in use. 

- If the resource is free the LCD backlight is set to green
- If the next event is less than a threshold number of minutes then the backlight is orange
- If the event is currently happening the backlight is red

The application exposes a web based administrative page that can be used to log the application into Google Calendar via oAuth2 as well as set some simple display parameters.