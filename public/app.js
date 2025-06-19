const log = (msg) => {
  console.log(msg);
  document.getElementById('log').innerHTML += `<p>${msg}</p>`;
};

const ws = new WebSocket(`ws://${location.host}`);
let pc, dataChannel;
let isInitiator = false;
let channelReady = false;
let pendingOffer = null;

ws.onopen = () => {
  log('WebSocket connected');
};

ws.onmessage = async (msg) => {
  const data = JSON.parse(msg.data);

  if (data.type === 'role') {
    isInitiator = data.role === 'initiator';
    log(`Assigned role: ${data.role}`);
    if (!isInitiator) {
      log('Receiver: calling startConnection() after role assignment');
      startConnection(); // Receiver starts immediately
      // If there was a pending offer, process it now
      if (pendingOffer) {
        log('Receiver: processing pending offer after startConnection()');
        await handleOffer(pendingOffer);
        pendingOffer = null;
      }
    }
    // Initiator waits for 'ready'
  }

  if (data.type === 'ready') {
    if (isInitiator) {
      log('Initiator: Receiver connected, ready to send offer');
      log('Initiator: calling startConnection() after ready');
      startConnection(); // Now initiator can start
    }
  }

  if (data.type === 'offer') {
    log('Receiver: offer message received');
    if (!pc) {
      log('Receiver: pc not ready, buffering offer');
      pendingOffer = data;
      return;
    }
    log('Receiver: handling offer');
    await handleOffer(data);
  } else if (data.type === 'answer') {
    if (!pc) return;
    log('Initiator: Received answer');
    await pc.setRemoteDescription(new RTCSessionDescription(data));
  } else if (data.type === 'candidate') {
    if (!pc) return;
    try {
      log('Received ICE candidate');
      await pc.addIceCandidate(data.candidate);
    } catch (e) {
      log('Error adding ICE candidate: ' + e);
    }
  }
};

async function handleOffer(data) {
  log('Receiver: handleOffer() called');
  await pc.setRemoteDescription(new RTCSessionDescription(data));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  ws.send(JSON.stringify(pc.localDescription));
  log('Receiver: Sent answer');
}

function startConnection() {
  log(`startConnection() called. isInitiator: ${isInitiator}`);
  pc = new RTCPeerConnection();

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      log('Sending ICE candidate');
      ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    }
  };

  pc.ondatachannel = (event) => {
    log('Received data channel');
    dataChannel = event.channel;
    setupDataChannel();
  };

  if (isInitiator) {
    dataChannel = pc.createDataChannel("file");
    log("Created data channel as initiator");
    setupDataChannel();

    pc.createOffer().then((offer) => {
      pc.setLocalDescription(offer);
      log("Initiator: Sent offer");
      ws.send(JSON.stringify(offer));
    });
  }
}

function setupDataChannel() {
  dataChannel.binaryType = 'arraybuffer';

  dataChannel.onopen = () => {
    log("Data channel is open");
    channelReady = true;
  };

  dataChannel.onclose = () => {
    log("Data channel closed");
    channelReady = false;
  };

  dataChannel.onerror = (e) => {
    log("Data channel error: " + e.message);
  };

  let buffer = [], received = 0, fileSize = 0;

  dataChannel.onmessage = (event) => {
    if (typeof event.data === "string" && event.data.startsWith("FILE_META:")) {
      fileSize = parseInt(event.data.split(":")[1]);
      buffer = [];
      received = 0;
      log("Receiving file of size " + fileSize);
    } else {
      buffer.push(event.data);
      received += event.data.byteLength;
      log(`Received ${received}/${fileSize}`);
      if (received >= fileSize) {
        const blob = new Blob(buffer);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "received_file";
        a.textContent = "Download received file";
        document.body.appendChild(a);
        log("File transfer complete");
      }
    }
  };
}

function sendFile() {
  if (!channelReady) {
    log("Data channel is not open yet. Please wait.");
    return;
  }

  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    log("No file selected");
    return;
  }

  dataChannel.send(`FILE_META:${file.size}`);
  log(`Sending file of size ${file.size}`);

  const chunkSize = 16384;
  let offset = 0;
  const reader = new FileReader();

  reader.onload = () => {
    dataChannel.send(reader.result);
    offset += reader.result.byteLength;
    if (offset < file.size) readSlice(offset);
  };

  function readSlice(o) {
    const slice = file.slice(o, o + chunkSize);
    reader.readAsArrayBuffer(slice);
  }

  readSlice(0);
}

