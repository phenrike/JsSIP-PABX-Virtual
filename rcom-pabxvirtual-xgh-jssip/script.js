var socket = new JsSIP.WebSocketInterface('wss://rcom.rcomtelecom.com.br:8089/ws');
var configuration = {
    sockets: [socket],
    uri: 'sip:0002@rcom.rcomtelecom.com.br',
    password: 'PABWEB*!239607'
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

    currentSession.on('confirmed', function () {
        console.log('Call confirmed');
        callStatusLabel.textContent = 'Call status: Confirmed';
        const remoteStream = currentSession.connection.getRemoteStreams()[0];
        const audioElement = document.createElement('audio');
        audioElement.srcObject = remoteStream;
        audioElement.play();
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
