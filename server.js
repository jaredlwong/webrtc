var socketio = require("socket.io");
var express = require("express");
var http = require("http");

var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

server.listen(80);

app.get("/", function(req, res) {
	res.sendfile(__dirname + '/index.html');
});

app.get("/client.js", function (req, res) {
	res.sendfile(__dirname + '/client.js');
});

var clients = {};

io.sockets.on('connection', function (socket) {
	socket.on("id", function(data) {
		console.log("ID " + data.id);
		clients[data.id] = socket;
	});
	socket.emit("id");
	// data must have rcid, method and args
	// where args[0] is the name of the endpoint being contacted
	socket.on("req", function(data) {
		console.log("REQ " + JSON.stringify(data));
		clients[data.rcid].emit.apply(clients[data.rcid], [data.method, data.args]);
	});
});

