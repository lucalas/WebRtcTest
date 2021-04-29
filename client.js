const mediaConstraints = {
  audio: false, // We want an audio track
  video: true // ...and we want a video track
};
let caller = false;
let socket = null;
let client = null;


/**
 * Connect to websocket server to exchange data.
 */
connect = () => {
  socket = new WebSocket("ws://localhost:8180");
  socket.onopen = function (e) {
    alert("[open] Connection established");
    alert("Sending to server");
  };

  socket.onmessage = onmessageSocket;
};

/**
 * Handler to retrieve socket messages.
 */
onmessageSocket = (event) => {
  /*if (!caller && !client) {
    client = sender("pipporoom", "user2");
  }*/
  //console.log(event);
  let data = JSON.parse(event.data);
  if (data.type === "video-offer") {
    console.log("video-offer received");
    client.handleVideoOfferMsg(data);
  } else if (data.type === "video-answer") {
    client.handleVideoAnswerMsg(data);
  } else if (data.type === "new-ice-candidate") {
    //console.log("new-ice-candidate received");
    client.handleNewICECandidateMsg(data);
  } else if (data.type === "room-ok") {
    console.log("Room created");
    client.userJoin(document.getElementById("user").value);
  } else if (data.type === "user-joined") {
    console.log("User joined");
    client.invite();
  }
};

/**
 * Send websocket messages.
 */
sendMessage = (msg) => {
  var msgJSON = JSON.stringify(msg);

  socket.send(msgJSON);
};

connect();

function hangUpCall() {
  caller = true;
  client = sender();
  client.createRoom("pipporoom");
}
