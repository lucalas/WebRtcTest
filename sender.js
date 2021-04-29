function sender() {
  let remoteConnection = null;
  let localStream = null;
  let user = null;
  let room = null;

  const createRoom = (newRoom) => {
    room = newRoom;
    sendMessage({type: "create-room", room: room});
  }
  
  const userJoin = (newUser) => {
    user = newUser;
    sendMessage({type: "join-room", user: user, room: room});
  }

  const handleVideoAnswerMsg = (msg) => {
    console.log("*** Call recipient has accepted our call");

    // Configure the remote description, which is the SDP payload
    // in our "video-answer" message.

    var desc = new RTCSessionDescription(msg.sdp);
    remoteConnection.setRemoteDescription(desc).catch(console.log);
  }

  const invite = () => {
    createPeerConnection();
    navigator.mediaDevices.getUserMedia(mediaConstraints)
      .then(mediaStream => {
        document.getElementById("local_video").srcObject = mediaStream;
        localStream = mediaStream;
        localStream.getTracks().forEach(track => remoteConnection.addTransceiver(track, { streams: [localStream] }));
      });
  };

  const createPeerConnection = () => {
    remoteConnection = new RTCPeerConnection({
      iceServers: [     // Information about ICE servers - Use your own!
        {
          urls: "stun:stun.l.google.com:19302"
        }
      ]
    });

    remoteConnection.onicecandidate = handleICECandidateEvent;
    remoteConnection.ontrack = handleTrackEvent;
    remoteConnection.onnegotiationneeded = handleNegotiationNeededEvent;
  };


  const handleICECandidateEvent = (event) => {
    if (event.candidate) {
      //console.log("*** Outgoing ICE candidate: " + event.candidate.candidate);
      sendMessage({ type: "new-ice-candidate", candidate: event.candidate, room: room, user: user });
    }
  };

  const handleTrackEvent = (event) => {
    console.log("New Stream track received");
    console.log(event);
    document.getElementById("received_video").srcObject = event.streams[0];
    document.getElementById("hangup-button").disabled = false;
  };

  const handleNegotiationNeededEvent = () => {
    console.log("Sending Video-Offer");
    remoteConnection.createOffer().then(function (offer) {
      return remoteConnection.setLocalDescription(offer);
    })
      .then(function () {
        sendMessage({
          room: room,
          user: user,
          type: "video-offer",
          sdp: remoteConnection.localDescription
        });
      })
      .catch(console.log);
  }

  const handleNewICECandidateMsg = (msg) => {
    //console.log("received new ice candidate");
    var candidate = new RTCIceCandidate(msg.candidate);
    //console.log(candidate);

    remoteConnection.addIceCandidate(candidate)
      .catch(console.log);
  }

  const handleVideoOfferMsg = (msg) => {
    var localStream = null;

    targetUsername = msg.name;

    if (!remoteConnection) {
      console.log("video-offer receiver create peerconnection");
      createPeerConnection();
    }

    var desc = new RTCSessionDescription(msg.sdp);

    if (!document.getElementById("local_video").srcObject) {
      console.log("local vidoe non disponibile");
      remoteConnection.setRemoteDescription(desc).then(function () {
        return navigator.mediaDevices.getUserMedia(mediaConstraints);
      })
        .then(function (stream) {
          localStream = stream;
          document.getElementById("local_video").srcObject = localStream;

          localStream.getTracks().forEach(track => {
            //console.log("questa e' una bellissima track");
            //console.log(track);
            remoteConnection.addTransceiver(track, { streams: [localStream] })
          });
        })
        .then(function () {
          return remoteConnection.createAnswer();
        })
        .then(function (answer) {
          return remoteConnection.setLocalDescription(answer);
        })
        .then(function () {
          var msg = {
            type: "video-answer",
            sdp: remoteConnection.localDescription, room: room, user: user
          };
          console.log("Send video-answer to server");
          sendMessage(msg);
        })
        .catch(console.log);
    } else {
      console.log("local video disponibile");
      remoteConnection.setRemoteDescription(desc)
        .then(() =>
          remoteConnection.setLocalDescription(remoteConnection.createAnswer()))
        .then(() => {
          var msg = {
            type: "video-answer",
            sdp: remoteConnection.localDescription,
            room: room,
            user: user
          };
          console.log("Send video-answer to server");
          sendMessage(msg);
        })
        .catch(console.log);
    }
  }

  return ({
    createRoom,
    userJoin,
    invite,
    createPeerConnection,
    handleVideoAnswerMsg,
    handleICECandidateEvent,
    handleTrackEvent,
    handleNegotiationNeededEvent,
    handleNewICECandidateMsg,
    handleVideoOfferMsg
  });
};