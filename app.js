/**
 * Created by tal on 10/2/16.
 */

// [START app]
var express = require('express');
var path = require('path');
var fs = require('fs');
let whitelist = require('./whitelist.js');
var app = express();
var DEFAULT_HEADERS = {
	"Strict-Transport-Security": "max-age=1800; includeSubDomains"
}

const PORT = process.env.PORT || 8080;

app.get('/', function (req, res) {
	let file = './index.html';

	res.statusCode = 200;
	// res.write("Working");

	var options = {
		root: __dirname,
		dotfiles: 'deny',
		headers: Object.assign({
			"Content-Type": "text/html",
			'x-timestamp': Date.now(),
			'x-sent': true
		}, DEFAULT_HEADERS)
	};

	res.sendFile(file, options, function (err) {
		if (err) {
			// console.log(err);
			res.status(err.status).end();
		}
		else {
			console.log('Sent:', file);
			res.end();
		}
	});

	// sendSMS("4435591587", "Hi")
	console.log("main");
});

// app.get('/datadog', function (req, res) {});

app.get('/*', function(req, res) {
	if (req.url == "/_ah/health" || req.url == "/app/_ah/health" || req.url.split("/")[1] == "datadog") {
		return;		// Lets see if just ignoring the request allows it to be served
	}

	// TODO: This in theory should only allow relevant files to be served, based on the whitelist
	let url = req.url;
	let strippedURL = url.split('?')[0];
	for (elem in whitelist) {
		// TODO: Doubled code here, testing stripped, which happens again in `allowServeFromDir`
		if ("/" + whitelist[elem] == url || "/" + whitelist[elem] == strippedURL) {
			allowServeFromDir(req, res);
			return;	// This stops resending responses in event of a duplicate in whitelist
		}
	}
	return404(req, res);
	console.log("Non-whitelisted file " + req.url + " requested, server refused to serve");
});

// app.get('/logo.png', function(req, res) {

// 	const FILE = path.join(__dirname + "/logo.png");

// 	res.statusCode = 200;

// 	var options = {
// 		root: __dirname,
// 		dotfiles: 'deny',
// 		headers: {
// 			"Content-Type": "image/png",
// 			'x-timestamp': Date.now(),
// 			'x-sent': true
// 		}
// 	};

// 	res.sendFile(FILE, options, function (err) {
// 		if (err) {
// 			console.log("An error occurred while attempting to serve " + FILE);
// 			// console.log(err);
// 			res.status(err.status).end();
// 		}
// 		else {
// 			console.log('Sent:' + FILE);
// 			res.end();
// 		}
// 	});
// });

// app.get('/images/*', function (req, res) {
// 	allowServeFromDir(req, res, 'jpg');
// });

// app.get('/js/*', function (req, res) {
// 	allowServeFromDir(req, res, 'js');
// });

// app.get('/css/*', function (req, res) {
// 	allowServeFromDir(req, res, 'css');
// });

// app.get('/fonts/*', function (req, res) {
// 	allowServeFromDir(req, res, 'font');
// });

// app.get('/icon/*', function(req, res) {
// 	allowServeFromDir(req, res, '');
// });

// app.get('/favicon.ico', function(req, res) {
// 	allowServeFromDir(req, res, '')
// });

app.listen(PORT, function () {
	console.log('Web app listening on port ' + PORT + '!');
});

function allowServeFromDir(req, res, type) {
	var headerMIME = "text/html";     // This is a dangerous case, as it leaves html default
	if (type == 'jpg') {
		headerMIME = "image/jpeg";
	} else if (type == 'js') {
		headerMIME = "application/javascript";
	} else if (type == 'css') {
		headerMIME = "text/css";
	} else if (type == 'font') {
		headerMIME = "application/font-woff";
	} else if (type == '') {
		headerMIME = "";
	}

	let file = req.url;

	res.statusCode = 200;

	if (headerMIME) {
		var options = {
			root: __dirname,
			dotfiles: 'deny',
			headers: Object.assign({
				// "Content-Type": headerMIME,
				'x-timestamp': Date.now(),
				'x-sent': true
			}, DEFAULT_HEADERS)
		};
	} else {
		var options = {
			root: __dirname,
			dotfiles: 'deny',
			headers: Object.assign({
				'x-timestamp': Date.now(),
				'x-sent': true
			}, DEFAULT_HEADERS)
		};
	}

	fs.stat(file, (err, data) => {
		if (err !== null && err.errno == -2) {
			// Remove trailing question mark and everything that follows...
			//... it (OR THE FIRST QUESTION MARK IN `FILE` AND EVERYTHING...
			//... AFTER IT) that could result from GET data in the request
			file = file.split('?')[0];

			fs.stat(file, (err, data) => {
				if (err === null && err.errno == -2) {
					console.error("File " + file + " could not be served as it doesn't exist");
					return;
				}

				res.sendFile(file, options, function (err) {
					if (err) {

						console.log("An error occurred while attempting to serve " + file);
						console.error(err);
						// console.log(err);
						res.status(err.status).end();
					}
					else {
						console.log('Sent:' + file);
						res.end();
					}
				});
			});
		}
	});
}

function doIfFile(file, cb) {
	fs.stat(file, function fsStat(err, stats) {
		if (err) {
			if (err.code === 'ENOENT') {
				return cb(null, false);
			} else {
				return cb(err);
			}
		}
		return cb(null, stats.isFile());
	});
}

function return404(req, res) {
	res.status(404).end();
	// Not using custom headers at the moment
	// var options = {
	// 		root: __dirname,
	// 		dotfiles: 'deny',
	// 		headers: Object.assign({
	// 			'x-timestamp': Date.now(),
	// 			'x-sent': true
	// 		}, DEFAULT_HEADERS)
	// 	};
}

// [END app]