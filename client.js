    const mediaConstraints = {
        audio: false, // We want an audio track
        video: true // ...and we want a video track
        };

    let socket = null;
    let localStream = null;
    let remoteConnection = null;

    /**
     * Connect to websocket server to exchange data.
     */
    connect = () => {
        socket = new WebSocket("ws://localhost:8180");
        socket.onopen = function(e) {
            alert("[open] Connection established");
            alert("Sending to server");
            sendMessage({type: "send_webrtc"});
            sendMessage({type: "get_webrtc"});
        };

        socket.onmessage = onmessageSocket;
    };

    /**
     * Handler to retrieve socket messages.
     */
    onmessageSocket = (event) => {
        //console.log(event);
        let data = JSON.parse(event.data);
        if (data.type === "video-offer") {
          console.log("video-offer received");
            handleVideoOfferMsg(data);
        } else if (data.type === "video-answer") {
          handleVideoAnswerMsg(data);
        } else if (data.type === "new-ice-candidate") {
          //console.log("new-ice-candidate received");
          handleNewICECandidateMsg(data);
        }
    };

    handleVideoAnswerMsg = (msg) => {
      console.log("*** Call recipient has accepted our call");
    
      // Configure the remote description, which is the SDP payload
      // in our "video-answer" message.
    
      var desc = new RTCSessionDescription(msg.sdp);
      remoteConnection.setRemoteDescription(desc).catch(reportError);
    }

    /**
     * Send websocket messages.
     */
    sendMessage = (msg) => {
        var msgJSON = JSON.stringify(msg);

        socket.send(msgJSON);
    };

    /**
     * SENDER - Method to call when you want to start a videocall.
     */
    invite = () => {
        createPeerConnection();
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(mediaStream => {
                document.getElementById("local_video").srcObject = mediaStream;
                localStream = mediaStream;
                localStream.getTracks().forEach(track => remoteConnection.addTransceiver(track, {streams: [localStream]}));
            });
    };

    /**
     * SENDER/RECEIVER - Create object to store data to connect to the peer.
     */
    createPeerConnection = () => {
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

    /**
     * SENDER/RECEIVER - Handler for exchange of streaming protocol informations.
     */
    handleICECandidateEvent = (event) => {
        if (event.candidate) {
            //console.log("*** Outgoing ICE candidate: " + event.candidate.candidate);
            sendMessage({ type: "new-ice-candidate", candidate: event.candidate });
        }
    };

    /**
     * SENDER/RECEIVER - Handler to retrieve remote stream.
     */
    handleTrackEvent = (event) => {
        console.log("New Stream track received");
        console.log(event.streams[0]);
        document.getElementById("received_video").srcObject = event.streams[0];
        document.getElementById("hangup-button").disabled = false;
    };

    /**
     * SENDER - Handler to create a video-offer negotiation.
     */
    handleNegotiationNeededEvent = () => {
      console.log("Sending Video-Offer");
        remoteConnection.createOffer().then(function(offer) {
          return remoteConnection.setLocalDescription(offer);
        })
        .then(function() {
          sendMessage({
            name: "pippo",
            type: "video-offer",
            sdp: remoteConnection.localDescription
          });
        })
        .catch(console.log);
    }

    /**
     * RECEIVER - Handler to receive video-offer and create a new local stream to send to remote peer.
     */
    handleVideoOfferMsg = (msg) => {
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
          .then(function(stream) {
            localStream = stream;
            document.getElementById("local_video").srcObject = localStream;
        
            localStream.getTracks().forEach(track =>{
              //console.log("questa e' una bellissima track");
              //console.log(track);
              remoteConnection.addTransceiver(track, {streams: [localStream]})
            });
          })
          .then(function() {
            return remoteConnection.createAnswer();
          })
          .then(function(answer) {
            return remoteConnection.setLocalDescription(answer);
          })
          .then(function() {
            var msg = {
              type: "video-answer",
              sdp: remoteConnection.localDescription
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
              sdp: remoteConnection.localDescription
            };
            console.log("Send video-answer to server");
            sendMessage(msg);
          })
          .catch(console.log);
        }
      }

    /**
     * SENDER/RECEIVER - Handler to retrieve ICE candidate from peer.
     */
    handleNewICECandidateMsg = (msg) => {
      //console.log("received new ice candidate");
      var candidate = new RTCIceCandidate(msg.candidate);
      //console.log(candidate);
    
      remoteConnection.addIceCandidate(candidate)
        .catch(console.log);
    }

    connect();

function hangUpCall() {
  invite();
}
