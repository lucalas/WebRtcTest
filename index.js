var WebSocketServer = require('websocket').server;
var http = require('http');

var wsServer = new WebSocketServer({ httpServer: http.createServer().listen(8180) });
var connectionList = [];
var rooms = {};

console.log("ciao");
wsServer.on('request', request => {
    let connection = request.accept(undefined, request.origin);
    let currentKey = Date.now();
    console.log("current session " + currentKey);
    //console.log(connection.socket);
    let currentSession = { key: currentKey, con: connection };
    connectionList.push(currentSession);

    connection.on("message", data => {
        let parsedData = JSON.parse(data.utf8Data);
        if (parsedData.type === "create-room") {
            if (!rooms[parsedData.room]) {
                rooms[parsedData.room] = { users: {} };
                console.log("Room " + parsedData.room + " created");
            }

            connection.send(JSON.stringify({ type: "room-ok", room: parsedData.room }));

        } else if (parsedData.type === "join-room") {
            if (!rooms[parsedData.room].users[parsedData.user]) {
                rooms[parsedData.room].users[parsedData.user] = {};
                currentSession.user = parsedData.user;
                rooms[parsedData.room].users[parsedData.user].session = currentSession;
                console.log("User " + parsedData.user + " joined");
            }
            connection.send(JSON.stringify({ type: "user-joined" }));

        } else if (parsedData.type === "video-offer") {
            Object.entries(rooms[parsedData.room].users).forEach(([key, value]) => {
                if (key !== parsedData.user) {
                    console.log("Sending data to: " + key + " data: " + JSON.parse(data.utf8Data).type);
                    value.session.con.send(data.utf8Data);
                }
            });
        } else if (parsedData.type === "video-answer") {
            Object.entries(rooms[parsedData.room].users).forEach(([key, value]) => {
                if (key !== parsedData.user) {
                    console.log("Sending data to: " + key + " data: " + JSON.parse(data.utf8Data).type);
                    value.session.con.send(data.utf8Data);
                }
            });
        } else {
            console.log(parsedData);
            Object.entries(rooms[parsedData.room].users).forEach(([key, value]) => {
                if (key !== parsedData.user) {
                    console.log("Sending data to: " + key + " data: " + JSON.parse(data.utf8Data).type);
                    value.session.con.send(data.utf8Data);
                }
            });
        }
        /*connectionList.forEach(list => {
            if (list.key !== currentKey) {
                console.log("Sending data to: " + list.key + " data: " + JSON.parse(data.utf8Data).type);
                list.con.send(data.utf8Data);
            }
        });*/
    });
});