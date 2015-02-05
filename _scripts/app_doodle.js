


var useBuffer = false; //to get around safari webkit bug


SC.initialize({client_id:'1b82c1758c84d15c6c2feffcf0ef0f59'});


window.onload = function(){
	///////	var readout = document.getElementById('readout');
	/////// readout.value = 33;
console.log("streamable:",SC.streamable);


	var scPlaylist;
	function setPlaylistToSoundCloudSearch(searchString) {
		SC.get('/tracks', { limit:200,streamable:true,q:searchString }, function(tracks) {
			scPlaylist = tracks;
			songPlaylistIndex = 0;
			console.log(tracks);
			loadPlaylistSong();
			if(!useBuffer)
				playMusic();
		});
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	var eqCtx = document.getElementById("eqVis").getContext("2d");
/**/	var audioPlayer = document.getElementById('audio');
		console.log(audioPlayer);
		
	var source;
	if(useBuffer)	source = audioCtx.createBufferSource();
	else			source = audioCtx.createMediaElementSource(audioPlayer);
	console.log("speaker:");console.log(document.getElementById('speaker'));
	var gifspkr = new GifSpeaker(document.getElementById('speaker'),source);
	var gifspkr1 = new GifSpeaker(document.getElementById('speaker1'),source);
	var gifspkr2 = new GifSpeaker(document.getElementById('speaker2'),source);
	var gifspkr3 = new GifSpeaker(document.getElementById('speaker3'),source);
	var gifspkr4 = new GifSpeaker(document.getElementById('speaker4'),source);
	var gifspkr5 = new GifSpeaker(document.getElementById('speaker5'),source);
	var gifspkr6 = new GifSpeaker(document.getElementById('speaker6'),source);
	var gifspkr7 = new GifSpeaker(document.getElementById('speaker7'),source);
	var gifspkr8 = new GifSpeaker(document.getElementById('speaker8'),source);
	var gifspkr9 = new GifSpeaker(document.getElementById('speaker9'),source);
	var gifspkr10 = new GifSpeaker(document.getElementById('speaker10'),source);
	var gifspkr11 = new GifSpeaker(document.getElementById('speaker11'),source);
	gifspkr.audioOptions.frequency   =  0/12.0;
	gifspkr1.audioOptions.frequency  =  1/12.0;
	gifspkr2.audioOptions.frequency  =  2/12.0;
	gifspkr3.audioOptions.frequency  =  3/12.0;
	gifspkr4.audioOptions.frequency  =  4/12.0;
	gifspkr5.audioOptions.frequency  =  5/12.0;
	gifspkr6.audioOptions.frequency  =  6/12.0;
	gifspkr7.audioOptions.frequency  =  7/12.0;
	gifspkr8.audioOptions.frequency  =  8/12.0;
	gifspkr9.audioOptions.frequency  =  9/12.0;
	gifspkr10.audioOptions.frequency = 10/12.0;
	gifspkr11.audioOptions.frequency = 11/12.0;
	gifspkr.gifOptions.loop = true;
	gifspkr1.gifOptions.loop = true;
	gifspkr2.gifOptions.loop = true;
	gifspkr3.gifOptions.loop = true;
	gifspkr4.gifOptions.loop = true;
	gifspkr5.gifOptions.loop = true;
	gifspkr6.gifOptions.loop = true;
	gifspkr7.gifOptions.loop = true;
	gifspkr8.gifOptions.loop = true;
	gifspkr9.gifOptions.loop = true;
	gifspkr10.gifOptions.loop = true;
	gifspkr11.gifOptions.loop = true;
	
	
	function loadSongURL(url) {
		if(!useBuffer) {
			audioPlayer.src = url;
			audioPlayer.load();
			return;
		}
		
		var axhr = new XMLHttpRequest();
		axhr.open("GET", url, true);
		axhr.responseType = "arraybuffer";

		axhr.onload = function() { 
			audioCtx.decodeAudioData(
				axhr.response,
				function(b) {source.buffer = b;/*playMusic()*/},
				function(buffer) {console.log("Error loading music");}
			);
		}

		axhr.send();
	}

	
	
	
	
	
	
	
	
	
	

	document.getElementById("gifSmooth").oninput	= function(e){gifspkr.gifOptions.smooth  =e.target.value;};
	document.getElementById("gifIn").oninput		= function(e){gifspkr.gifOptions.start   =e.target.value;};
	document.getElementById("gifOut").oninput		= function(e){gifspkr.gifOptions.end     =e.target.value;};
	document.getElementById("gifReverse").oninput	= function(e){gifspkr.gifOptions.reverse =e.target.value;};
	document.getElementById("gifLoop").oninput		= function(e){gifspkr.gifOptions.loop    =e.target.value;};

	document.getElementById("audioFreq").oninput	= function(e){gifspkr.audioOptions.frequency =e.target.value;};
	document.getElementById("audioLow").oninput		= function(e){gifspkr.audioOptions.low       =e.target.value;};
	document.getElementById("audioHigh").oninput	= function(e){gifspkr.audioOptions.high      =e.target.value;};
	document.getElementById("audioSmooth").oninput	= function(e){gifspkr.analyser.smoothingTimeConstant = e.target.value;};
	document.getElementById("audioWidth").oninput	= function(e){gifspkr.analyser.fftSize = Math.pow(2,e.target.value);};
	
	var songInputField		= document.getElementById("song_input");
	songInputField.onchange = function(e) {	setPlaylistToSoundCloudSearch(e.target.value); }
	
	function beginGifAdjust(e)	{gifspkr.gifAdjustValue = e.target.value;}
	function endGifAdjust(e)	{gifspkr.gifAdjustValue = -1;}
	endGifAdjust();
	//////gifInControl.oninput = beginGifAdjust;
	//////gifOutControl.oninput = beginGifAdjust;
	//////gifInControl.onmouseup = endGifAdjust;
	//////gifOutControl.onmouseup = endGifAdjust;
	//////gifInControl.onmousedown = beginGifAdjust;
	//////gifOutControl.onmousedown = beginGifAdjust;
	
	
		

	
	
	var audioPlayer = document.getElementById('audio');
	source.connect(audioCtx.destination);
	
	console.log(source);

	if(!useBuffer)
	{
		audioPlayer.addEventListener('ended', function(){nextSong();});
	}
	
	if(useBuffer) {
		//empty wav file
		audioPlayer.src="data:audio/wave;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==";
		audioPlayer.load();
	}

	var playMusic = function() {
		console.log("Play Music Triggered");
		togglePlayback = pauseMusic;
//		audioPlayer.play();
		if(useBuffer) { // what a hack job.  This bug is two years old and P2
			var buf = source.buffer;
			source.disconnect(0);
			source=audioCtx.createBufferSource();
			source.buffer=buf;
			source.connect(analyser);
			source.start(0);
		}
//		else {
			audioPlayer.play();
//		}
		hideUI();
	};
	var pauseMusic = function() {
		togglePlayback = playMusic;
		if(useBuffer)	source.stop(0);
		else			audioPlayer.pause();																		
		showUI();
	};
	var togglePlayback = playMusic;

	document.querySelector('.jsgif canvas').addEventListener('click', function(){togglePlayback();});
	
						
						

	(function setupIdle(){
		var timeoutID;
		var idleTime = 6000;
		var doCheckIdle = true;

		


		 
		var startTimer = function() {
			timeoutID = window.setTimeout(onIdle, idleTime);
		}
		 
		var resetTimer = function(e) {
			window.clearTimeout(timeoutID);
			onActive();
		}
		 
		var onIdle = function() {
			//if(isPlaying)
			hideUI();
			document.querySelector("body").style.cursor="none";
		}
		 
		var onActive = function() {
			showUI();
			startTimer();
			document.querySelector("body").style.cursor="default";
		}

	


 
		addEventListener("mousemove", resetTimer, false);
		addEventListener("mousedown", resetTimer, false);
		addEventListener("keypress", resetTimer, false);
		addEventListener("DOMMouseScroll", resetTimer, false);
		addEventListener("mousewheel", resetTimer, false);
		addEventListener("touchmove", resetTimer, false);
		addEventListener("MSPointerMove", resetTimer, false);
 
		startTimer();	
	})();
	function addClass( classname, element ) {
		var cn = element.className;
		//test for existance
		if( cn.indexOf( classname ) != -1 ) {
			return;
		}
		//add a space if the element already has class
		if( cn != '' ) {
			classname = ' '+classname;
		}
		element.className = cn+classname;
	}
	function removeClass( classname, element ) {
		var cn = element.className;
		var rxp = new RegExp( "\\s?\\b"+classname+"\\b", "g" );
		cn = cn.replace( rxp, '' );
		element.className = cn;
	}
	function hideUI()
	{
		var elems = document.querySelectorAll('.hideable');
		for(var i=0;i<elems.length;i++){
			addClass ("hidden",elems[i]);
		}
	}
	function showUI()
	{
		var elems = document.querySelectorAll('.hideable');
		for(var i=0;i<elems.length;i++){
			removeClass("hidden",elems[i]);
		}
	}

	
	function setGifSettingsToDefaults() {
	console.log("UPDATE setGifSettingsToDefaults()"); return;
	//	gifSmoothControl.value		= 0.0;
		gifInControl.value			= 0.0;
		gifOutControl.value			= 1.0;
		gifReverseControl.checked	= false;
		gifLoopControl.checked		= false;
	}
	
	function getSettingsJSON(){
		return{}; // TODO: remove this developer function;
		var jsontext =	 '{"id":"'+gifPlaylist[gifPlaylistIndex].id+'"'
						+',    "gifSmooth":'+gifSmoothControl.value
						+(gifInControl.value == 0.0 ? '' : ', "gifIn":'+gifInControl.value)
						+(gifOutControl.value == 1.0 ? '' : ', "gifOut":'+gifOutControl.value)
						+(gifReverseControl.checked == false ? '' : ', "gifReverse":'+gifReverseControl.checked)
						+(gifLoopControl.checked == false ? '' : ', "gifLoop":'+gifLoopControl.checked)
						+' },';
		return jsontext;
	}
	var songPlaylistIndex = 0;//Math.floor(Math.random()*scPlaylist.length);
	var gifPlaylistIndex = 0;//Math.floor(Math.random()*gifPlaylist.length);
	function loadPlaylistSong() {
		//check if playing
		var songInfo = scPlaylist[songPlaylistIndex];
		loadSongURL(songInfo.stream_url+"?client_id=1b82c1758c84d15c6c2feffcf0ef0f59");
		document.getElementById("albumArt").src = songInfo.artwork_url;
		document.getElementById("trackTitle").innerHTML = "<a href="+songInfo.permalink_url+">"+songInfo.title+"</a>";
		//document.getElementById("artistName").src = songInfo.artwork_url;
		'		<img id="albumArt" src=""/>\
		<span id="artistName"></span>\
		<span id="trackTitle"></span>'

	}
	function loadPlaylistGif() {
		console.log(getSettingsJSON());
		
		setGifSettingsToDefaults();
		var gifDetails = gifPlaylist[gifPlaylistIndex];
		console.log(gifDetails);
		var id = gifDetails.id;
		console.log(gifDetails.hasOwnProperty("gifSmooth"));
		switch(gifDetails.service) {
			case "imgur":
				gifspkr.gifPlayer.load_url(	"http://i.imgur.com/"+id+".gif" );
				document.getElementById("visInfo").innerHTML = '<a href="http://imgur.com/'+id+'">IMGUR:'+id+'</a>';
				break;
			case "url":
				gifspkr.gifPlayer.load_url( id );
				document.getElementById("visInfo").innerHTML = id.split('\\').pop().split('/').pop();
				break;
			default:
				console.log("Unfamiliar service: "+gifDetails.service);
		}
//		setTimeout(0,function(){
		if(gifDetails.hasOwnProperty("gifSmooth"))  gifSmoothControl.value		= gifDetails["gifSmooth"];
		if(gifDetails.hasOwnProperty("gifIn"))		gifInControl.value			= gifDetails["gifIn"];
		if(gifDetails.hasOwnProperty("gifOut"))		gifOutControl.value			= gifDetails["gifOut"];
		if(gifDetails.hasOwnProperty("gifReverse"))	gifReverseControl.checked	= gifDetails["gifReverse"];
		if(gifDetails.hasOwnProperty("gifLoop"))	gifLoopControl.checked		= gifDetails["gifLoop"];
//		});
	
	}
	function addInLoop (value, increment, length) {
		// negative mods are gross;
		return (value + length + increment) % length;
	}
	function nextSong() {
		songPlaylistIndex = addInLoop(songPlaylistIndex,1,scPlaylist.length);
		loadPlaylistSong();
		playMusic();

	}
	function previousSong() {
		songPlaylistIndex = addInLoop(songPlaylistIndex,-1,scPlaylist.length);;
		loadPlaylistSong();
		playMusic();
	}
	function nextGif() {
		gifPlaylistIndex = addInLoop(gifPlaylistIndex,1,gifPlaylist.length);
		loadPlaylistGif();
	}
	function previousGif() {
		gifPlaylistIndex = addInLoop(gifPlaylistIndex,-1,gifPlaylist.length);;
		loadPlaylistGif();
	}
	function randomGif() {
		gifPlaylistIndex = Math.floor(gifPlaylist.length*Math.random());
		loadPlaylistGif();
	}
	document.getElementById('playPause').onclick = function(){togglePlayback();};
	document.getElementById('nextSong').onclick = nextSong;
	document.getElementById('previousSong').onclick = previousSong;
	document.getElementById('nextGif').onclick = nextGif;
	document.getElementById('previousGif').onclick = previousGif;
	document.getElementById('randomGif').onclick = randomGif;
	
	
	
	
	
	
function loadURLFromFile(file, onload) {
	reader = new FileReader();
	console.log(reader);
	reader.onload = onload;
	reader.readAsDataURL(file);
}
function loadSongFromFile(file) {
	loadURLFromFile(file,function(e) {
		loadSongURL( e.target.result );
		playMusic();
	});
}
function loadBinaryFromFile(file, onload) {
	reader = new FileReader();
	console.log(reader);
	reader.onload = onload;
	reader.readAsBinaryString(file);
}

function loadGifFromFile(file) {
	//alert("Gifspkr will support local gifs soon. Try dragging from imgur");
	loadBinaryFromFile(file,function(e) {
		gifspkr.gifPlayer.load_from_binary_text(	e.target.result );
		//console.log(e.target.result);
	});
}
	

	
	
	
	
	
/*********
DRAG N DROP
***********/
	
	
	
function drop(e) {
	e.preventDefault();
	console.log("dropEvent:");
	console.log(e);
	console.log(e.dataTransfer.getData("text/plain"));
	var file = e.dataTransfer.files[0];
	var url = e.dataTransfer.getData('URL');
	if(file) {
		console.log("Dropped file:");
		console.log(file);
		switch(file.type) {
			case "audio/mp3":
			case "audio/mpeg":
			case "audio/ogg":
				loadSongFromFile(file);
				break;
			case "image/gif":
				loadGifFromFile(file);
				break;
			case "audio/m4p":
				break;
			
			default:
				alert("Gifspkr doesn't yet know how to handle "+file.type.split("/")[1]+" files");
		}
	}
	else if(url)
	{
		console.log("Dropped url:");
		console.log(url);
		//type = filename.split('.').pop();
		gifspkr.gifPlayer.load_url(	url );
	
	}
	return false;
}	
function gifDrop(e) {
	e.preventDefault();
	console.log(e);
	console.log(e.dataTransfer.getData('URL'));
	var url = e.dataTransfer.getData('URL');
	if (url) {
		gifspkr.gifPlayer.load_url(	url );
		return true;
	};
	return false;
}
function songDrop(e) {
	e.preventDefault();
		
	var file = e.dataTransfer.files[0],
	reader = new FileReader();
	reader.onload = function (event) {
		loadSongURL(event.target.result);
		if(!useBuffer)
			playMusic();
	};
	console.log("file:");
	console.log(file);
	reader.readAsDataURL(file);
		
	return false;
}
var gifDropZone = document.querySelector('.jsgif canvas');
gifDropZone.ondrop = drop;	
gifDropZone.ondragover = function() { this.className = 'hover'; return false; };// must exist for drag n drop

	
	
	
	
	
	
	
	
	
	
	//animation and rendering
	
	function drawEQ() {
		var ctxWidth = 1024;
		var ctxHeight = 256;
		var audioHigh = gifspkr.audioOptions.high;
		var audioLow = gifspkr.audioOptions.low;
		//var minBarWidth = 8;
		eqCtx.clearRect(0, 0, ctxWidth,ctxHeight);
		//eqCtx.globalAlpha=1.0;
		eqCtx.fillStyle = '#ff0055';
		//console.log(GifSpeaker.prototype.getSignalValue);
		var driverValue = tween(gifspkr.getSignalValue(),audioLow,audioHigh);
		driverValue = clamp(driverValue,0,1);
		eqCtx.fillRect(0,0,ctxWidth*driverValue,ctxHeight);
		//eqCtx.globalAlpha=.5;
		eqCtx.fillStyle = '#ffffff';
		var w = ctxWidth/gifspkr.analyser.frequencyBinCount;
		for(var i = 0; i< gifspkr.analyser.frequencyBinCount; i++) {
			var h = ctxHeight*gifspkr.freqs[i]/256;
			var x = i*w;
			var y = ctxHeight-h;
			eqCtx.fillRect(x,y,w,h);
		}
			var h = ctxHeight*gifspkr.getSignalValue();
			var x = getSignalIndex()*w;
			var y = ctxHeight-h;
			//Freq bar border
			eqCtx.fillStyle = '#000000';	eqCtx.fillRect(x-4,y-4,w+8,h+4);
			eqCtx.fillStyle = '#480018';	eqCtx.fillRect(x,y,w,h);
			
			var top = Math.min(h,ctxHeight*audioHigh)
			var h = Math.max(0,top - ctxHeight*audioLow);
			var y = ctxHeight-top;
			//Freq bar in-range
			eqCtx.fillStyle = '#ff0055';
			eqCtx.fillRect(x,y,w,h);
			
			// AudioRange Barn Doors
			eqCtx.fillStyle = 'rgba(0,0,0,0.5)';
			eqCtx.fillRect(0,ctxHeight-ctxHeight*audioLow,ctxWidth,ctxHeight*audioLow);
			eqCtx.fillRect(0,0,ctxWidth,ctxHeight-ctxHeight*audioHigh);
			// Barn Door lines
			eqCtx.fillStyle = 'rgba(0,0,0,1.0)';
			eqCtx.fillRect(0,ctxHeight-ctxHeight*audioLow,ctxWidth,4);
			eqCtx.fillRect(0,ctxHeight-ctxHeight*audioHigh-4,ctxWidth,4);
	}
	
	
	
	
	var appAnimLoop=function(){
		requestAnimationFrame(appAnimLoop);
		
		//drawEQ();
		gifspkr.draw();
		gifspkr1.draw();
		gifspkr2.draw();
		gifspkr3.draw();
		gifspkr4.draw();
		gifspkr5.draw();
		gifspkr6.draw();
		gifspkr7.draw();
		gifspkr8.draw();
		gifspkr9.draw();
		gifspkr10.draw();
		gifspkr11.draw();	
	};
	appAnimLoop();
	
	setPlaylistToSoundCloudSearch("m.o.o.n.");
	
//	if(!useBuffer)
//		playMusic();
	

};
