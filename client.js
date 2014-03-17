function s4() {
	return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16).substring(1);
};

function guid() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}

var cid = guid();
var socket = io.connect("http://" + window.location.hostname);

// relay back our guid
socket.on("id", function() {
	socket.emit("id", { id: cid });
});

var pcs = {};
socket.on("create_peer_connection", function(data) {
	if (data.cid === cid) return;
	console.log("create_peer_connection:" + JSON.stringify(data));
	createPeerConnection(data.cid, false, data.pcid, data.sdp);
});

socket.on("ack_create_peer_connection", function(data) {
	if (data.cid === cid) return;
	console.log("ack_create_peer_connection:" + JSON.stringify(data));
	pcs[data.pcid].setRemoteDescription(new RTCSessionDescription(data.sdp));
});

// if !isCallee then id and remoteSdp must be defined
function createPeerConnection(rcid, isCallee, pcid, remoteSdp) {
	console.log("creating new peer connection: " + JSON.stringify(arguments));
	var pc = new webkitRTCPeerConnection(null);
	if (isCallee) {
		pc.id = guid();
	} else {
		pc.id = pcid;
	}
	pcs[pc.id] = pc;

	if (isCallee) {
		pc.createOffer(function(sdp) {
			pc.setLocalDescription(sdp);
			socket.emit("req", {
				rcid: rcid,
				method: "create_peer_connection",
				args: {
					sdp: sdp,
					pcid: pc.id,
					cid: cid
				}
			});
		});
	} else {
		pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));
		pc.createAnswer(function(sdp) {
			pc.setLocalDescription(sdp);
			socket.emit("req", {
				rcid: rcid,
				method: "ack_create_peer_connection",
				args: {
					sdp: sdp,
					pcid: pc.id,
					cid: cid
				}
			});
		});
	}

	return pc;
}

$(document).ready(function() {
	$("#body").append($("<p>" + cid + "</p>"));
	$("#body").append($("<button id='bbb'>start</button>"));
	$("#body").append($("<input id='iii' type='text'></input>"));
	$("#bbb").click(function() {
		createPeerConnection($("#iii")[0].value, true);
	});
});
