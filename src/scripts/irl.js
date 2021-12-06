var main_object = {
	one: {
		short: 1,
		stream: null,
		audioCtx: null,
		meter: null,
		mediaStreamSource: null,
		mediaRecorder: null,
		chunks: [],
		selector: document.getElementById('devices_list_1'),
		meter_div: document.getElementById('audioMeter_1'),
		ended: false
	},
	two: {
		short: 2,
		stream: null,
		audioCtx: null,
		meter: null,
		mediaStreamSource: null,
		mediaRecorder: null,
		chunks: [],
		selector: document.getElementById('devices_list_2'),
		meter_div: document.getElementById('audioMeter_2'),
		ended: false
	},
	three: {
		short: 3,
		stream: null,
		audioCtx: null,
		meter: null,
		mediaStreamSource: null,
		mediaRecorder: null,
		chunks: [],
		selector: document.getElementById('devices_list_3'),
		meter_div: document.getElementById('audioMeter_3'),
		ended: false
	}
}

window.onload = async () => {
	try {
		await navigator.mediaDevices.getUserMedia({ audio: true }, () => { }, () => { });
	} catch (e) {
		new Toast({
			message: 'There was an error connecting with your audio devices. Save this error: ' + e,
			type: 'danger'
		});
	}

	for (var i in main_object) {
		main_object[i].audioCtx = new AudioContext();
		var tt = await navigator.mediaDevices.enumerateDevices()

		var innerAudioDevices = ``
		for (var j in tt) {
			if (tt[j].kind != "audioinput") continue;
			if (tt[j].label == "") {
				new Toast({
					message: "It seems that WebRTC did not load properly. We'll keep refreshing until it clicks. Bear with us.",
					type: 'danger'
				});
				window.location.reload()
			}
			innerAudioDevices += `<option value="${tt[j].deviceId}">${tt[j].label}</option>`
		}
		main_object[i].selector.innerHTML += innerAudioDevices
	}
}

var changedDevice = async (val) => {
	if (main_object[val].selector.value == "") {
		main_object[val].meter_div.innerHTML = `Waiting for input...`;
		if (currentStream) {
			const tracks = main_object[val].stream.getTracks();
			for (var l in tracks) {
				tracks[l].stop()
			}
		}
		return;
	}

	try {
		if (main_object[val].stream) {
			const tracks = main_object[val].stream.getTracks();
			console.log(tracks)
			for (var l in tracks) {
				tracks[l].stop()
			}
		}
		var stream = await navigator.mediaDevices.getUserMedia(
			{
				"audio": {
					"deviceId": {
						"exact": main_object[val].selector.value
					},
				},
			});
		main_object[val].stream = stream;
        document.getElementById(`listenIn_${val}`).style.opacity = "1";
		main_object[val].mediaRecorder = new MediaRecorder(stream);
		main_object[val].mediaRecorder.ondataavailable = function(e) {
			main_object[val].chunks.push(e.data);
		}

		main_object[val].mediaRecorder.onstop = (e) => {
			main_object[val].ended = true;
			endRecordingForAll();
		}
	} catch (e) {
		new Toast({
			message: `There was an issue connecting to that microphone. Try again, or try another input device. (ERR: ${e})`,
			type: 'danger'
		});
		return;
	}

	main_object[val].mediaStreamSource = main_object[val].audioCtx.createMediaStreamSource(main_object[val].stream);

	console.log(main_object[val])

	main_object[val].meter = createAudioMeter(main_object[val].audioCtx);
	main_object[val].mediaStreamSource.connect(main_object[val].meter);
	processAudioMeter(val)
}

var processAudioMeter = (val) => {
	// console.log(meter.volume)

	// Create a new volume meter and connect it.

	main_object[val].meter_div.innerHTML = `Audio Level`;

	if (main_object[val].meter.checkClipping()) {
		main_object[val].meter_div.style.cssText += `background:linear-gradient(90deg, #d60f0f ${main_object[val].meter.volume * 100}%, #e0e7ff 0%);`
	} else {
		main_object[val].meter_div.style.cssText += `background:linear-gradient(90deg, green ${main_object[val].meter.volume * 100}%, #e0e7ff 0%);`;
	}

	var t = val;

	rafID = window.requestAnimationFrame(() => {
		processAudioMeter(t);
	})
}

var listenIn = (val) => {
    if(val == "stop"){
        document.getElementById('liveAudio').srcObject = null;
        return;
    }
    if(!main_object[val].stream) return;
    document.getElementById('liveAudio').srcObject = main_object[val].stream;
}

var hr = 0;
var min = 0;
var sec = 0;
var stoptime = true;

function startTimer() {
	if (stoptime == true) {
		stoptime = false;
		timerCycle();
	}
}
function stopTimer() {
	if (stoptime == false) {
		stoptime = true;
	}
}

function timerCycle() {
	if (stoptime == false) {
		sec = parseInt(sec);
		min = parseInt(min);
		hr = parseInt(hr);

		sec = sec + 1;

		if (sec == 60) {
			min = min + 1;
			sec = 0;
		}
		if (min == 60) {
			hr = hr + 1;
			min = 0;
			sec = 0;
		}

		if (sec < 10 || sec == 0) {
			sec = '0' + sec;
		}
		if (min < 10 || min == 0) {
			min = '0' + min;
		}
		if (hr < 10 || hr == 0) {
			hr = '0' + hr;
		}

		document.getElementById('innerStopwatch').innerHTML = hr + ':' + min + ':' + sec;

		setTimeout("timerCycle()", 1000);
	}
}

function resetTimer() {
	document.getElementById('innerStopwatch').innerHTML = '00:00:00';
}

var changeRecordStatus = (v) => {
	if (v == "start") {
		if (main_object.one.mediaRecorder.state == "inactive") {
			startRecording()
		}
	} else if (v == "stop") {
		if (main_object.one.mediaRecorder.state == "recording") {
			stopRecording()
		}
	} else if (v == "restart") {
		window.location.reload()
	}
}

var startRecording = () => {
	if (!main_object.one.stream || main_object.one.stream == "") {
		new Toast({
			message: "Recording tried to start, however it seems there was an error starting it on your side. Let the hosts know.",
			type: 'danger'
		});
		return;
	}

	for (var i in main_object) {
		try {
			main_object[i].mediaRecorder.start()
		} catch (e) {
			main_object[i].selector.style.display = "none";
			main_object[i].meter_div.style.display = "none";
		}
	}

	if (document.getElementById('recStop')) {
		document.getElementById('recStop').style.opacity = 1
		document.getElementById('recStart').style.opacity = 0.5
	}

	// document.getElementById('recStatus').innerHTML = `<span class="text-green-500">STARTED</span>.`
	// document.getElementById('recordingControls').style.display = "grid"
	// document.getElementById('stopwatch').style.display = "revert"
	startTimer()
}

var stopRecording = () => {
	for (var i in main_object) {
		try {
			main_object[i].mediaRecorder.stop()
		} catch (e) { }
	}
	stopTimer()
}

var endRecordingForAll = async () => {
	for (var i in main_object) {
		if (main_object[i].mediaRecorder && main_object[i].ended === false) {
			return;
		}
	}
	if (document.getElementById('recStop')) {
		document.getElementById('recStop').style.opacity = 0.5
		document.getElementById('recStart').style.opacity = 0.5
	}
    document.getElementById('audioFiles').style.display = "block"
    document.getElementById('uploadStatus').style.display = "block"
	for (var i in main_object) {
		if(!main_object[i].ended) continue;
		var blob = new Blob(main_object[i].chunks, { 'type': 'audio/mp3' });
		main_object[i].chunks = []
		const audioURL = URL.createObjectURL(blob);
		document.getElementById('audioFiles').innerHTML += `<audio controls autoplay style="width:100%;"><source src="${audioURL}" type="audio/mp3"></audio>`
		var ref = firebase.storage().ref()
		var task = await ref.child(`Channel-${i}-${dayjs().format('MM_DD_YY--hh_mm')}`).put(blob)
        if(task){
            document.getElementById('uploadStatus').innerHTML += `<p><i><b>Channel ${i.toUpperCase()} uploaded!</b> (${dayjs().format('MM/DD/YY hh:mm A')})</i></p>`     
        }
	}
}

