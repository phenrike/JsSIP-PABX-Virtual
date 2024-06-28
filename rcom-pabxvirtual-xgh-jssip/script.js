var socket = new JsSIP.WebSocketInterface('wss://sip.rcomtelecom.com.br:8089/ws');
var configuration = {
    sockets: [socket],
    uri: 'sip:0101@sip.rcomtelecom.com.br',
    password: 'PABWEB*!515186'
    // uri: 'sip:0102@sip.rcomtelecom.com.br',
    // password: 'PABWEB*!851055'
};

var coolPhone = new JsSIP.UA(configuration);
var currentSession = null;

var sipUserLabel = document.getElementById('sipUser');
var registerStatusLabel = document.getElementById('registerStatus');
var callStatusLabel = document.getElementById('callStatus');
var callButton = document.getElementById('callButton');
var acceptButton = document.getElementById('acceptButton');
var endButton = document.getElementById('endButton');
var phoneNumberInput = document.getElementById('phoneNumber');

coolPhone.on('connected', function (e) {
    console.log('Connected');
    callStatusLabel.textContent = 'Call status: Connected';
});

coolPhone.on('disconnected', function (e) {
    console.log('Disconnected');
    callStatusLabel.textContent = 'Call status: Disconnected';
});

coolPhone.on('newRTCSession', function (e) {
    var session = e.session;
    currentSession = session;
    if (session.direction === 'incoming') {
        console.log('Incoming call from ' + session.remote_identity.uri.toString());
        callStatusLabel.textContent = 'Call status: Incoming call from ' + session.remote_identity.uri.toString();
        acceptButton.disabled = false;
        endButton.disabled = false;

        acceptButton.classList.add('green-button');
        endButton.classList.add('red-button');

        session.on('progress', function (e) {
            console.log('Call is in progress, incoming call from ' + session.remote_identity.uri.toString());
            callStatusLabel.textContent = 'Call status: Call is in progress, incoming call from ' + session.remote_identity.uri.toString();
        });

        session.on('accepted', function (e) {
            console.log('Call accepted');
            callStatusLabel.textContent = 'Call status: Accepted';
            acceptButton.classList.remove('green-button');
            endButton.classList.remove('red-button');
        });

        session.on('failed', function (e) {
            console.log('Call failed with cause: ' + e.cause);
            callStatusLabel.textContent = 'Call status: Failed with cause: ' + e.cause;
            acceptButton.disabled = true;
            endButton.disabled = true;
            acceptButton.classList.remove('green-button');
            endButton.classList.remove('red-button');
        });

        session.on('ended', function (e) {
            console.log('Call ended with cause: ' + e.cause);
            callStatusLabel.textContent = 'Call status: Ended with cause: ' + e.cause;
            acceptButton.disabled = true;
            endButton.disabled = true;
            acceptButton.classList.remove('green-button');
            endButton.classList.remove('red-button');
        });

        session.on('confirmed', function () {
            console.log('Call confirmed');
            callStatusLabel.textContent = 'Call status: Confirmed';
            const remoteStream = session.connection.getRemoteStreams()[0];
            const audioElement = document.createElement('audio');
            audioElement.srcObject = remoteStream;
            audioElement.play();
        });
    }
});

navigator.mediaDevices.getUserMedia({ audio: true })
.then(function (stream) {
    console.log('getUserMedia: ' + (stream ? JSON.stringify(stream) : 'no event data'));
})
.catch(function (err) {
    console.error('Error accessing media devices.', err);
});

coolPhone.on('registered', function (e) {
    console.log('Registered');
    sipUserLabel.textContent = `SIP User: ${configuration.uri}`;
    registerStatusLabel.textContent = 'Register status: Registered';
});

coolPhone.on('unregistered', function (e) {
    console.log('Unregistered');
    registerStatusLabel.textContent = 'Register status: Unregistered';
});

coolPhone.on('registrationFailed', function (e) {
    console.log('Registration failed with cause: ' + e.cause);
    registerStatusLabel.textContent = 'Register status: Registration failed';
});

coolPhone.start();

callButton.addEventListener('click', function () {
    var inputNumber = phoneNumberInput.value;

    if (!inputNumber) {
        alert("Please enter a number to make a call!");
        return;
    }

    var options = {
        'mediaConstraints': { 'audio': true, 'video': false },
        'rtcOfferConstraints': {
            'offerToReceiveAudio': 1,
            'offerToReceiveVideo': 0
        }
    };

    currentSession = coolPhone.call(`sip:${inputNumber}@rcom.rcomtelecom.com.br`, options);
    callStatusLabel.textContent = 'Call status: Calling';
    endButton.disabled = false;
    endButton.classList.add('red-button');

    currentSession.on('progress', function (e) {
        console.log('Call is in progress');
        callStatusLabel.textContent = 'Call status: In progress';
        var remoteAudioStream = new MediaStream();        
        remoteAudioStream.addTrack(currentSession.connection.getTransceivers()[0].receiver.track);
        const audioElement = document.createElement('audio');
        audioElement.srcObject = remoteAudioStream;
        audioElement.play();
    });

    currentSession.on('accepted', function (e) {
        console.log('Call accepted');
        callStatusLabel.textContent = 'Call status: Accepted';
    });

    currentSession.on('failed', function (e) {
        console.log('Call failed with cause: ' + e.cause);
        callStatusLabel.textContent = 'Call status: Failed with cause: ' + e.cause;
        endButton.disabled = true;
        endButton.classList.remove('red-button');
    });

    currentSession.on('ended', function (e) {
        console.log('Call ended with cause: ' + e.cause);
        callStatusLabel.textContent = 'Call status: Ended with cause: ' + e.cause;
        endButton.disabled = true;
        endButton.classList.remove('red-button');
    });

    currentSession.on('confirmed', function (e) {
        console.log('Call confirmed');
        callStatusLabel.textContent = 'Call status: Confirmed';
    });
});

acceptButton.addEventListener('click', function () {
    if (currentSession) {
        currentSession.answer({
            mediaConstraints: {
                audio: true,
                video: false
            }
        });
        acceptButton.disabled = true;
        endButton.disabled = false;
        acceptButton.classList.remove('green-button');
        endButton.classList.remove('red-button');
    }
});

endButton.addEventListener('click', function () {
    if (currentSession) {
        currentSession.terminate();
        callStatusLabel.textContent = 'Call status: Call ended';
        endButton.disabled = true;
        acceptButton.disabled = true;
        acceptButton.classList.remove('green-button');
        endButton.classList.remove('red-button');
    }
});

function AudioCall(lineObj, dialledNumber, extraHeaders) {
    if (userAgent == null) return;
    if (userAgent.isRegistered() == false) return;
    if (lineObj == null) return;

    if (HasAudioDevice == false) {
        alert(lang.alert_no_microphone);
        return;
    }

    var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();

    var spdOptions = {
        mediaConstraints: {
            audio: { deviceId: "default" },
            video: false
        },
        rtcOfferConstraints: {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 0
        }
    }

    var currentAudioDevice = getAudioSrcID();
    if (currentAudioDevice != "default") {
        var confirmedAudioDevice = false;
        for (var i = 0; i < AudioinputDevices.length; ++i) {
            if (currentAudioDevice == AudioinputDevices[i].deviceId) {
                confirmedAudioDevice = true;
                break;
            }
        }
        if (confirmedAudioDevice) {
            spdOptions.mediaConstraints.audio.deviceId = { exact: currentAudioDevice };
        } else {
            console.warn("The audio device you used before is no longer available, default settings applied.");
            localDB.setItem("AudioSrcId", "default");
        }
    }

    if (supportedConstraints.autoGainControl) {
        spdOptions.mediaConstraints.audio.autoGainControl = AutoGainControl;
    }
    if (supportedConstraints.echoCancellation) {
        spdOptions.mediaConstraints.audio.echoCancellation = EchoCancellation;
    }
    if (supportedConstraints.noiseSuppression) {
        spdOptions.mediaConstraints.audio.noiseSuppression = NoiseSuppression;
    }

    if (extraHeaders) {
        spdOptions.extraHeaders = extraHeaders;
    }

    $("#line-" + lineObj.LineNumber + "-msg").html(lang.starting_audio_call);
    $("#line-" + lineObj.LineNumber + "-timer").show();

    var startTime = moment.utc();

    var targetURI = 'sip:' + dialledNumber + '@' + wssServer;
    var session = userAgent.call(targetURI, spdOptions);

    session.data = {};
    session.data.line = lineObj.LineNumber;
    session.data.buddyId = lineObj.BuddyObj.identity;
    session.data.calldirection = "outbound";
    session.data.dst = dialledNumber;
    session.data.callstart = startTime.format("YYYY-MM-DD HH:mm:ss UTC");
    session.data.callTimer = window.setInterval(function () {
        var now = moment.utc();
        var duration = moment.duration(now.diff(startTime));
        var timeStr = formatShortDuration(duration.asSeconds());
        $("#line-" + lineObj.LineNumber + "-timer").html(timeStr);
        $("#line-" + lineObj.LineNumber + "-datetime").html(timeStr);
    }, 1000);

    session.data.VideoSourceDevice = null;
    session.data.AudioSourceDevice = getAudioSrcID();
    session.data.AudioOutputDevice = getAudioOutputID();
    session.data.terminateby = "them";
    session.data.withvideo = false;
    session.data.earlyReject = false;
    session.isOnHold = false;

    session.on('bye', function () {
        onSessionRecievedBye(lineObj);
    });
    session.on('message', function (request) {
        onSessionRecievedMessage(lineObj, request);
    });
    session.on('reinvite', function (request) {
        onSessionReinvited(lineObj, request);
    });
    session.on('sdp', function (sdp) {
        onSessionDescriptionHandlerCreated(lineObj, sdp, false);
    });
    session.on('progress', function (response) {
        onInviteProgress(lineObj, response);
    });
    session.on('accepted', function (response) {
        onInviteAccepted(lineObj, false, response);
    });
    session.on('failed', function (response, cause) {
        onInviteRejected(lineObj, response, cause);
    });

    $("#line-" + lineObj.LineNumber + "-btn-settings").removeAttr('disabled');
    $("#line-" + lineObj.LineNumber + "-btn-audioCall").prop('disabled', 'disabled');
    $("#line-" + lineObj.LineNumber + "-btn-videoCall").prop('disabled', 'disabled');
    $("#line-" + lineObj.LineNumber + "-btn-search").removeAttr('disabled');
    $("#line-" + lineObj.LineNumber + "-btn-remove").prop('disabled', 'disabled');

    $("#line-" + lineObj.LineNumber + "-progress").show();
    $("#line-" + lineObj.LineNumber + "-msg").show();

    UpdateUI();
    UpdateBuddyList();
    updateLineScroll(lineObj.LineNumber);

    if (typeof web_hook_on_invite !== 'undefined') web_hook_on_invite(session);
}

function MuteSession(lineNum) {
    var lineObj = FindLineByNumber(lineNum);
    if (lineObj == null || lineObj.SipSession == null) return;

    $("#line-" + lineNum + "-btn-Unmute").show();
    $("#line-" + lineNum + "-btn-Mute").hide();

    var session = lineObj.SipSession;
    var pc = session.connection;
    pc.getSenders().forEach(function (RTCRtpSender) {
        if (RTCRtpSender.track && RTCRtpSender.track.kind == "audio") {
            if (RTCRtpSender.track.IsMixedTrack == true) {
                if (session.data.AudioSourceTrack && session.data.AudioSourceTrack.kind == "audio") {
                    console.log("Muting Mixed Audio Track : " + session.data.AudioSourceTrack.label);
                    session.data.AudioSourceTrack.enabled = false;
                }
            }
            console.log("Muting Audio Track : " + RTCRtpSender.track.label);
            RTCRtpSender.track.enabled = false;
        }
    });

    if (!session.data.mute) session.data.mute = [];
    session.data.mute.push({ event: "mute", eventTime: utcDateNow() });
    session.data.ismute = true;

    $("#line-" + lineNum + "-msg").html(lang.call_on_mute);

    updateLineScroll(lineNum);

    // Custom Web hook
    if (typeof web_hook_on_modify !== 'undefined') web_hook_on_modify("mute", session);
}

function UnmuteSession(lineNum) {
    var lineObj = FindLineByNumber(lineNum);
    if (lineObj == null || lineObj.SipSession == null) return;

    $("#line-" + lineNum + "-btn-Unmute").hide();
    $("#line-" + lineNum + "-btn-Mute").show();

    var session = lineObj.SipSession;
    var pc = session.connection;
    pc.getSenders().forEach(function (RTCRtpSender) {
        if (RTCRtpSender.track && RTCRtpSender.track.kind == "audio") {
            if (RTCRtpSender.track.IsMixedTrack == true) {
                if (session.data.AudioSourceTrack && session.data.AudioSourceTrack.kind == "audio") {
                    console.log("Unmuting Mixed Audio Track : " + session.data.AudioSourceTrack.label);
                    session.data.AudioSourceTrack.enabled = true;
                }
            }
            console.log("Unmuting Audio Track : " + RTCRtpSender.track.label);
            RTCRtpSender.track.enabled = true;
        }
    });

    if (!session.data.mute) session.data.mute = [];
    session.data.mute.push({ event: "unmute", eventTime: utcDateNow() });
    session.data.ismute = false;

    $("#line-" + lineNum + "-msg").html(lang.call_off_mute);

    updateLineScroll(lineNum);

    // Custom Web hook
    if (typeof web_hook_on_modify !== 'undefined') web_hook_on_modify("unmute", session);
}
