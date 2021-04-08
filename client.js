    const mediaConstraints = {
        audio: false, // We want an audio track
        video: true // ...and we want a video track
        };

    let socket = null;
    let localStream = null;
    let remoteConnection = null;

    const connect = () => {
        socket = new WebSocket("ws://localhost:8180");
        socket.onopen = function(e) {
            alert("[open] Connection established");
            alert("Sending to server");
            sendMessage({type: "send_webrtc"});
            sendMessage({type: "get_webrtc"});
        };

        socket.onmessage = onmessageSocket;
    };

    const onmessageSocket = (event) => {
        console.log(event);
        let data = JSON.parse(event.data);
        if (data.type === "video-offer") {
          console.log("video-offer received");
            handleVideoOfferMsg(data);
        } else if (data.type === "new-ice-candidate") {
          handleNewICECandidateMsg(data);
        }
    };

    const sendMessage = (msg) => {
        var msgJSON = JSON.stringify(msg);

        socket.send(msgJSON);
    };

    const invite = () => {
        createPeerConnection();
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(mediaStream => {
                document.getElementById("local_video").srcObject = mediaStream;
                localStream = mediaStream;
                localStream.getTracks().forEach(track => remoteConnection.addTrack(track, localStream));
            });
    };

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

    handleICECandidateEvent = (event) => {
        if (event.candidate) {
            console.log("*** Outgoing ICE candidate: " + event.candidate.candidate);
            sendMessage({ type: "new-ice-candidate", candidate: event.candidate });
        }
    };

    handleTrackEvent = (event) => {
        console.log("New Stream received");
        document.getElementById("received_video").srcObject = event.streams[0];
        document.getElementById("hangup-button").disabled = false;
    };

    handleNegotiationNeededEvent = () => {
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

    handleVideoOfferMsg = (msg) => {
        var localStream = null;
      
        targetUsername = msg.name;
        createPeerConnection();
      
        var desc = new RTCSessionDescription(msg.sdp);
      
        remoteConnection.setRemoteDescription(desc).then(function () {
          return navigator.mediaDevices.getUserMedia(mediaConstraints);
        })
        .then(function(stream) {
          localStream = stream;
          document.getElementById("local_video").srcObject = localStream;
      
          localStream.getTracks().forEach(track => remoteConnection.addTrack(track, localStream));
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
      }

    const handleNewICECandidateMsg = (msg) => {
      console.log(msg);
      var candidate = new RTCIceCandidate(msg.candidate);
      console.log(candidate);
    
      remoteConnection.addIceCandidate(candidate)
        .catch(console.log);
    }

    connect();

function hangUpCall() {
  invite();
}
