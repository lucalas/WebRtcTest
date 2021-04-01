const App = () => {

    const mediaConstraints = {
        audio: true, // We want an audio track
        video: true // ...and we want a video track
        };

    let socket = null;
    let localStream = null;
    let remoteConnection = null;

    const connect = () => {
        socket = new WebSocket("ws://localhost:8181");
        socket.onopen = function(e) {
            alert("[open] Connection established");
            alert("Sending to server");
            socket.send({type: "send_webrtc"});
            socket.send({type: "get_webrtc"});
        };

        socket.onmessage = onmessageSocket;
    };

    const onmessageSocket = (event) => {

    };

    const sendMessage = (message) => {
        var msgJSON = JSON.stringify(msg);

        socket.send(msgJSON);
    };

    const peerConnection = () => {
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
            log("*** Outgoing ICE candidate: " + event.candidate.candidate);
            socket.send({ type: "new-ice-candidate", candidate: event.candidate });
        }
    };

    handleTrackEvent = (event) => {
        document.getElementById("received_video").srcObject = event.streams[0];
    };

    handleNegotiationNeededEvent = () => {
        myPeerConnection.createOffer().then(function(offer) {
          return myPeerConnection.setLocalDescription(offer);
        })
        .then(function() {
          socket.send({
            name: "pippo",
            type: "video-offer",
            sdp: myPeerConnection.localDescription
          });
        })
        .catch(reportError);
    }

    connect();
    peerConnection();
};

App();
