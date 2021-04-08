var WebSocketServer = require('websocket').server;
var http = require('http');

var wsServer = new WebSocketServer({ httpServer: http.createServer().listen(8180) });
var connectionList = [];
var i = 0;
console.log("ciao");
wsServer.on('request', request => {
    let connection = request.accept(undefined, request.origin);
    let currentKey = i;
    console.log("current session " + currentKey);
    connectionList.push({key: currentKey, con: connection});
    i++;
    connection.on("message", data => {
        connectionList.forEach(list => {
            if (list.key !== currentKey) {
                console.log("Sending data to: " + list.key + " data: " + JSON.parse(data.utf8Data).type);
                list.con.send(data.utf8Data);
            }
        });
    });
});