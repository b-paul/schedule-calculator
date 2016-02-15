var fs = require('fs');
var path = require('path');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var pg = require('pg');

var keyLocation = path.resolve(__dirname, '../private/server.key');
var certLocation = path.resolve(__dirname, '../private/server.crt');
var credentials = {
  key: fs.readFileSync(keyLocation, 'utf-8').trim(),
  cert: fs.readFileSync(certLocation, 'utf-8').trim()
};

var dbPassLocation = path.resolve(__dirname, '../private/database.pass');
var dbPassword = fs.readFileSync(dbPassLocation, 'utf-8').trim();
var conString
  = `postgres://schedule_calculator:${dbPassword}`
  + '@localhost/schedule_calculator';

var app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: [
    /https?:\/\/localhost:8080/,
    /https?:\/\/127\.0\.0\.1:8080/
  ]
}));

var send400 = function (res, message, details) {
  console.error('Returning 400', details);
  res.status(400).send(message);
};

var sendNotification = function (subscription, message) {
  console.log(subscription);
  console.log(message);
};

app.post('/subscribe', function (req, res) {
  console.log('received subscribe', req.body);
  // save the information necessary to send notifications to the device
  var subscription = req.body.subscriptionId;

  pg.connect(conString, function(err, client, done) {
    if (err) {
      return send400(res, 'could not connect to database', err);
    }
    client.query(
      'INSERT INTO subscriptions (subscription_id) VALUES ($1)',
      [subscription],
      function(err, result) {
        // call `done()` to release the client back to the pool
        done();

        if (err) {
          return send400(res, 'could not insert subscription', err);
        }
        res.end();
      }
    );
  });
});

app.post('/schedule', function (req, res) {
  console.log('received schedule', req.body);
  var scheduleId = req.body.id;
  var data = JSON.stringify(req.body.data);

  pg.connect(conString, function(err, client, done) {
    if (err) {
      return send400(res, 'could not connect to database', err);
    }

    // save the schedule to the database
    var savedSchedule = new Promise(function (resolve, reject) {
      client.query(
        'DELETE FROM schedules WHERE id = $1',
        [scheduleId],
        function (err, result) {
          client.query(
            'INSERT INTO schedules (id, data) VALUES ($1, $2)',
            [scheduleId, data],
            function(err, result) {
              if (err) {
                reject('could not insert schedule');
                return send400(res, 'could not insert schedule', err);
              }
              res.end();
              resolve();
            }
          );
        }
      );
    });

    // notify subscribed devices
    client.query(
      'SELECT subscription_id FROM subscriptions',
      [],
      function (err, result) {
        savedSchedule // wait for the schedule to be saved
          .then(function () {
            // call `done()` to release the client back to the pool
            done();

            result.rows.forEach(function (row) {
              var subscription = row.subscription_id;

              sendNotification(
                subscription, 'new data for schedule ' + scheduleId);
            });
          })
          .catch(function () {
            done();
          });
      });
  });
});

app.get('/schedule/:id', function (req, res) {
  console.log('getting schedule for', req.params.id);
  // get the schedule as JSON
  var scheduleId = req.params.id;

  pg.connect(conString, function (err, client, done) {
    if (err) {
      return send400(res, 'could not connect to database', err);
    }
    client.query(
      'SELECT data FROM schedules WHERE id = $1',
      [scheduleId],
      function (err, result) {
        // call `done()` to release the client back to the pool
        done();

        if (err) {
          return send400(res, 'could not get schedule', err);
        } else if (!result.rows.length) {
          return res.end();
        }
        var data = result.rows[0].data;
        res.json(JSON.parse(data));
      }
    );
  });
});

https.createServer(credentials, app).listen(8081);
