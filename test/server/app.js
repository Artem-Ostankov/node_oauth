var TYPE = 'memory'; // Pg, redis, mongodb also available for example

var
    query           = require('querystring'),
    express         = require('express'),
    cookieParser    = require('cookie-parser'),
    session         = require('express-session'),
    bodyParser      = require('body-parser');

var path = require('path');

var
    config      = require('./config.js'),
    server      = express(),
    oauth20     = require('./oauth20.js')(TYPE),
    model       = require('./model/' + TYPE);

// Middleware
server.use(cookieParser());
server.use(session({ secret: 'oauth20-provider-test-server', resave: false, saveUninitialized: false }));
server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());
server.use(oauth20.inject());
server.use(express.static(path.join(__dirname, 'public')));

// CORS (Cross-Origin Resource Sharing) headers to support Cross-site HTTP requests

server.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Headers', 'Authorization');
    next();
});

// View
server.set('views', './view');
server.set('view engine', 'jade');

// Middleware. User authorization
function isUserAuthorized(req, res, next) {
    if (req.session.authorized) next();
    else {
        var params = req.query;
        params.backUrl = req.path;
        res.redirect('/login?' + query.stringify(params));
    }
};

// Define OAuth2 Authorization Endpoint
server.get('/authorization', isUserAuthorized, oauth20.controller.authorization, function(req, res) {
    res.render('authorization', { layout: false });
});
server.post('/authorization', isUserAuthorized, oauth20.controller.authorization);

// Define OAuth2 Token Endpoint
server.post('/token', oauth20.controller.token);

// Define user login routes
server.get('/login', function(req, res) {
    res.render('login', {layout: false});
});

server.get('/reg', function(req, res) {
    res.render('registration2', { title: 'Reg me' });
});

// dummy db
var dummyDb = [
    {username: 'john', email: 'john@email.com'},
    {username: 'jack', email: 'jack@email.com'},
    {username: 'jim', email: 'jim@email.com'},
];

server.post('/signup/check/username', function(req, res) {
    var username = req.body.username;
    // check if username contains non-url-safe characters
    if (username !== encodeURIComponent(username)) {
        res.json(403, {
            invalidChars: true
        });
        return;
    }
    // check if username is already taken - query your db here
    var usernameTaken = false;
    model.oauth2.user.fetchByUsername(req.body.username, function(err, user) {
        if (user) {
            usernameTaken = true;
        }
    });
    //for (var i = 0; i < dummyDb.length; i++) {
    //    if (dummyDb[i].username === username) {
    //        usernameTaken = true;
    //        break;
    //    }
    //}
    if (usernameTaken) {
        res.json(403, {
            isTaken: true
        });
        return
    }
    // looks like everything is fine
    res.send(200);
});


// Define user login routes
//server.get('/test', function(req, res) {
//    res.sendFile('/client.html');
//});

server.post('/login', function(req, res, next) {
    var backUrl = req.query.backUrl ? req.query.backUrl : '/';
    delete(req.query.backUrl);
    backUrl += backUrl.indexOf('?') > -1 ? '&' : '?';
    backUrl += query.stringify(req.query);

    // Already logged in
    if (req.session.authorized) res.redirect(backUrl);
    // Trying to log in
    else if (req.body.username && req.body.password) {
        model.oauth2.user.fetchByUsername(req.body.username, function(err, user) {
            if (err) next(err);
            else if (!user || !model.oauth2.user.checkPassword(user, req.body.password)) res.redirect(req.url);
            else {
                req.session.user = user;
                req.session.authorized = true;
                res.redirect(backUrl);
            }
        });
    }
    // Please login
    else res.redirect(req.url);
});

// Some secure method
server.get('/secure', oauth20.middleware.bearer, function(req, res) {
    if (!req.oauth2.accessToken) return res.status(403).send('Forbidden');
    if (!req.oauth2.accessToken.userId) return res.status(403).send('Forbidden');
    res.send('Hi! Dear user ' + req.oauth2.accessToken.note + '!');
});

// Some secure client method
server.get('/client', oauth20.middleware.bearer, function(req, res) {
    if (!req.oauth2.accessToken) return res.status(403).send('Forbidden');
    res.send('Hi! Dear client ' + req.oauth2.accessToken.clientId + '!');
});

// Expose functions
var start = module.exports.start = function() {
    server.listen(config.server.port, config.server.host, function(err) {
        if (err) console.error(err);
        else console.log('Server started at ' + config.server.host + ':' + config.server.port);
    });
};

module.exports = server;

if (require.main == module) {
    start();
}