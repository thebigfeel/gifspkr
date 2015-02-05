

var isChrome = navigator.userAgent.indexOf('Chrome') > -1;
var useBuffer = !isChrome; //to get around safari and firefox bugs


SC.initialize({client_id:'1b82c1758c84d15c6c2feffcf0ef0f59'});
var emptyIMG = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
// not jQuery

//	DOM functions
///////////////////////////////////////////////////////////////////////////////	
function $id(id){
	return document.getElementById(id);
}
function $(query){
	return document.querySelector(query);
}
function $all(query){
	return document.querySelector(query);
}
function hasClass( classname, element ) {
	return isStringInString(classname, element.className);//element.className.indexOf(classname) > -1 ? true : false;
}
function addClass( classname, element ) {
	var cn = element.className;
	//test for existence
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

function isStringInString(subString, superString) {
	return superString.indexOf(subString) > -1 ? true : false;
}




function goFullscreen() {
	if(document.requestFullscreen) 	document.requestFullscreen();
	else if(document.mozRequestFullScreen) document.mozRequestFullScreen();
	else if(document.webkitRequestFullscreen) document.webkitRequestFullscreen();
	else if(document.msRequestFullscreen) document.msRequestFullscreen();
}
function exitFullscreen() {
	if(document.exitFullscreen) document.exitFullscreen();
	else if(document.mozCancelFullScreen) document.mozCancelFullScreen();
	else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
}


//	Utility functions
///////////////////////////////////////////////////////////////////////////////	

// a mod function with a defined behavior for negative operands
function addInLoop (value, increment, length) {
	return (value + length + increment) % length;
}

function shuffle(array) {
	for(var i = 0; i<array.length; i++) {
		var randomIndex = Math.floor(Math.random()*array.length);
		var temp = array[i];
		array[i] = array[randomIndex];
		array[randomIndex] = temp;
	}
	return array;
}





window.onload = function(){
	gifPlaylist = shuffle(gifPlaylist);
	

//	Audio Setup
///////////////////////////////////////////////////////////////////////////////	

    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	var eqCtx = $id("eqVis").getContext("2d");
	var audioPlayer = $id("audioPlayer");
	
	var mediaSource =	useBuffer ? 
						audioCtx.createBufferSource() :
						audioCtx.createMediaElementSource(audioPlayer);
	var streamSource;
	

	function setSourceToPlayer() {
		if(source) source.disconnect(0);
		source = mediaSource;
		source.connect(spkrOut);
		audioGain.gain.value=1.0;
		//playMusic();
	}
	function setSourceToMic() {
		if(streamSource){
			if(source) source.disconnect(0);
			source = streamSource;
			source.connect(spkrOut);
			audioGain.gain.value=0.0;
			pauseMusic();
			return;
		}
		// else first time setup
		navigator.getUserMedia = ( navigator.getUserMedia ||
							   navigator.webkitGetUserMedia ||
							   navigator.mozGetUserMedia ||
							   navigator.msGetUserMedia);

		if (navigator.getUserMedia)
			navigator.getUserMedia (
				{audio:true,video:false},
				function(stream) {
					streamSource = audioCtx.createMediaStreamSource(stream);
					setSourceToMic();
				},
				function(err) {
					console.log("The following error occured: " + err);
					setDefaultAudioMode();
				}
			);
		else
			console.log("getUserMedia not supported");
	}
	var source;
	var spkrOut =	audioCtx.createGain();
	var audioGain =	audioCtx.createGain();
	
	setSourceToPlayer();
	spkrOut.connect(audioGain);
	audioGain.connect(audioCtx.destination);
	//spkrOut.connect(audioCtx.destination);
	
	var globalAudioMode;
	setDefaultAudioMode();
	

//	Audio Playback
///////////////////////////////////////////////////////////////////////////////	
	var didUserPause = false; // for event handling with web audio api buffers in safari and firefox
	function playMusic() {
		dismissWelcomeMessage();
		console.log("Play Music Triggered");
		console.log(playlist);
		console.trace();
		togglePlayback = pauseMusic;
		if(useBuffer) { // what a hack job.  This bug is two years old and P2 in webkit
			//audioPlayer.play();//because we've loaded it up with an empty wave
			var buf = source.buffer;
			source.disconnect(0);
			source=audioCtx.createBufferSource();
			source.buffer=buf;
			source.connect(spkrOut);
			source.onended = function(){if(!didUserPause) nextSong();};
			source.start(0);
		}
		else {
			audioPlayer.play();
		}
		$id("bigPlayButton").style.visibility = "hidden";
		hideUI();
		didUserPause = false;
	};
	function pauseMusic() {
		didUserPause = true;
		console.log("Pause Music Triggered");
		togglePlayback = playMusic;
		if(useBuffer)	source.stop(0);
		else			audioPlayer.pause();																		
		$id("bigPlayButton").style.visibility = "visible";
		showUI();
	};
	var togglePlayback = playMusic;


	

//	URL Parameters
///////////////////////////////////////////////////////////////////////////////

//http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript


function createSparseURLParameterString() {
	return "imgMode=imgur&id=BATgRRz"
}

function getCurrentURLParams() {
var urlParams;
//(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
//})();
return urlParams;
}

console.log("URLPARAMS");
console.log(getCurrentURLParams());














//	GifSpeaker UI
///////////////////////////////////////////////////////////////////////////////
	var gifspkr = new GifSpeaker($id('speaker'),spkrOut);
loadGifFromDetails(getCurrentURLParams());

	function updateSpeakerVideoOptions() {
		// maybe move reverse logic into gifspkr?
		if(gifspkr.gifOptions.reverse !== $id("gifReverse").checked) {
			//matches timeline position in reverse
			gifspkr.loopTargetValue += 1-2*gifspkr.currentValue
			gifspkr.currentValue = (1-gifspkr.currentValue);
		}
		gifspkr.gifOptions.reverse				= $id("gifReverse").checked;
		gifspkr.gifOptions.loop					= $id("gifLoop").checked;
		gifspkr.gifOptions.smooth				= parseFloat($id("gifSmooth").value);
		gifspkr.gifOptions.start				= parseFloat($id("gifIn").value);
		gifspkr.gifOptions.end					= parseFloat($id("gifOut").value);
	} updateSpeakerVideoOptions();
	function updateSpeakerAudioOptions() {
		gifspkr.analyser.smoothingTimeConstant	= parseFloat($id("audioSmooth").value);
		gifspkr.analyser.fftSize				= Math.pow(2,parseFloat($id("audioWidth").value));
		gifspkr.audioOptions.frequency			= parseFloat($id("audioFreq").value);
		gifspkr.audioOptions.auto				= $id("autoRange").checked;
		if(!gifspkr.audioOptions.auto) {
			gifspkr.audioOptions.low			= parseFloat($id("audioLow").value);
			gifspkr.audioOptions.high			= parseFloat($id("audioHigh").value);
		}
		
	} updateSpeakerAudioOptions();
	$id("gifReverse"	).onchange	= updateSpeakerVideoOptions;
	$id("gifLoop"		).onchange	= updateSpeakerVideoOptions;
	$id("gifSmooth"		).oninput	= updateSpeakerVideoOptions;

	$id("audioFreq"		).oninput	= updateSpeakerAudioOptions;
	$id("audioLow"		).oninput	= updateSpeakerAudioOptions;
	$id("audioHigh"		).oninput	= updateSpeakerAudioOptions;
	$id("audioSmooth"	).oninput	= updateSpeakerAudioOptions;
	$id("audioWidth"	).oninput	= updateSpeakerAudioOptions;
	$id("autoRange"		).onchange	= updateAutoRange;
	function updateAutoRange(e){
		if($id("autoRange").checked) {
			$id("audioLow").style.visibility="hidden";
			$id("audioHigh").style.visibility="hidden";
		}
		else {
			$id("audioLow").style.visibility="visible";
			$id("audioHigh").style.visibility="visible";
		}
		updateSpeakerAudioOptions();
	} updateAutoRange();
	
	
	function beginGifAdjust(e)	{gifspkr.gifAdjustValue = parseFloat(e.target.value);}
	function endGifAdjust(e)	{gifspkr.gifAdjustValue = -1;updateSpeakerVideoOptions();}
	//endGifAdjust();
	$id("gifIn").oninput = beginGifAdjust;
	$id("gifOut").oninput = beginGifAdjust;
	$id("gifIn").onchange = endGifAdjust;
	$id("gifOut").onchange = endGifAdjust;
	$id("gifIn").onmousedown = beginGifAdjust;
	$id("gifOut").onmousedown = beginGifAdjust;
	$id("gifIn").onmouseup = endGifAdjust; // for input that lands back where it started
	$id("gifOut").onmouseup = endGifAdjust;
	
	function setGifSettingsToDefaults(keepLoop) {
	console.log("UPDATE setGifSettingsToDefaults()");
	//	$id("gifSmooth").value		= 0.0;
		$id("gifIn").value			= 0.0;
		$id("gifOut").value			= 1.0;
		$id("gifReverse").checked	= false;
		if(!keepLoop) $id("gifLoop").checked		= false;
	//	updateSpeakerVideoOptions();
	}
	
	$id("gifContainer").onresize = function(e){
		console.log(e);
	};
	


	
	
	
	
	


	
//	Idle
///////////////////////////////////////////////////////////////////////////////

//	(function setupIdle(){
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
			$("body").style.cursor="none";
		}
		 
		var onActive = function() {
			showUI();
			startTimer();
			$("body").style.cursor="default";
		}

	


 
		addEventListener("mousemove", resetTimer, false);
		addEventListener("mousedown", resetTimer, false);
		addEventListener("keypress", resetTimer, false);
		addEventListener("DOMMouseScroll", resetTimer, false);
		addEventListener("mousewheel", resetTimer, false);
		addEventListener("MSPointerMove", resetTimer, false);
 
		startTimer();	
//	})();
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

	
	
	function getSettingsJSON(){
		return{}; // TODO: remove this developer function;
		var jsontext =	 '{"id":"'+gifPlaylist[gifPlaylistIndex].id+'"'
						+',    "gifSmooth":'+$id("gifSmooth").value
						+($id("gifIn").value		==   0.0 ? '' : ', "gifIn":'+$id("gifIn").value)
						+($id("gifOut").value		==   1.0 ? '' : ', "gifOut":'+$id("gifOut").value)
						+($id("gifReverse").checked	== false ? '' : ', "gifReverse":'+$id("gifReverse").checked)
						+($id("gifLoop").checked	== false ? '' : ', "gifLoop":'+$id("gifLoop").checked)
						+' },';
		return jsontext;
	}

	
	

	
	
//	Playlists
///////////////////////////////////////////////////////////////////////////////
	
	
	//	Song Playlists
	///////////////////////////////////////////////////////////////////////////
	
	function Playlist(list) {
		this.songs = list? list : [];
		this.index = 0;
	}
	Playlist.prototype.song =			function(i) { return this.songs[i]; };
	Playlist.prototype.currentSong =	function()  { return this.songs[this.index]; };
	Playlist.prototype.next =			function()  { this.index = addInLoop(this.index,1,this.songs.length) };
	Playlist.prototype.previous =		function()  { this.index = addInLoop(this.index,-1,this.songs.length) };
	Playlist.prototype.push =			function(s)  { this.songs.push(s);};
	
	var soundCloudPlaylist =	new Playlist();
	var myMusicPlaylist =		new Playlist();
	var playlist = soundCloudPlaylist;
	
	////////////////////////////////////////////
	//var scPlaylist;
	//var songPlaylistIndex = 0;//Math.floor(Math.random()*scPlaylist.length);
	///////////////////////////////////////////////////////////////
	function loadPlaylistSong() {
		switch(globalAudioMode) {
			case "soundcloud":
				var songInfo = soundCloudPlaylist.currentSong();
				loadSongURL(songInfo.stream_url+"?client_id=1b82c1758c84d15c6c2feffcf0ef0f59");
				var artwork =	songInfo.artwork_url ||
								songInfo.user.avatar_url ||
								emptyIMG;
				$id("albumArt").src = artwork;
				console.log(songInfo);
				//$id("albumArt").style.visibility = songInfo.artwork_url ? "visible" : "hidden";
				$id("trackTitle").innerHTML = "<a target='_blank' href="+songInfo.permalink_url+">"+songInfo.title+"</a>";
				break;
			case "mymusic":
			console.log(myMusicPlaylist);
				var file = myMusicPlaylist.currentSong();
				loadSongFromFile(file);
				$id("albumArt").src = emptyIMG;
				$id("trackTitle").innerHTML = file.name;
				console.log(file);
				break;
			default:
				console.log("unknown audio mode");
		}
		if(!useBuffer) playMusic();
	}
	function previousSong() {
		playlist.previous();
		loadPlaylistSong();
	}
	function nextSong() {
		if(useBuffer){playMusic();pauseMusic();}//first playmusic is to get ios safari to allow audio
		playlist.next()
		loadPlaylistSong();
	}
	
	$id('previousSong').onclick = previousSong;
	$id('nextSong').onclick = nextSong;
	if(!useBuffer)	audioPlayer.addEventListener('ended', function(){nextSong();});

	
	function filteredSoundCloudList(input){
			var output = [];
			// because { limit:50,streamable:true,q:searchString }
			// doesn't work for streamable filtering
			for(var i=0; i<input.length; i++){
				if(input[i].streamable) output.push(input[i]);
			}
			return output;
	}
	function setPlaylistToSoundCloudURL(url, callback) {
		 // remove url query because soundcloud doesn't like it;
		 // TODO: we can handle the query ourselves and get the song within a set
		 url = url.split("?")[0];
		
		SC.get('/resolve', { url:url }, function(sound) {
			if(sound.errors) {
				//nothing yet
			}
			else {
				if(sound.kind=="playlist") {
					console.log("SOUNDCLOUD PLAYLIST");
					setPlaylistToSoundCloudTracks(sound.tracks, callback);
				}
				else {
					console.log("SOUNDCLOUD SINGLE");
					console.log(sound);
					if(sound.streamable)//test for non-streamable here
						setPlaylistToSoundCloudTracks([sound], callback);
					else
						alert('Great song!\n\n' +
							'Unfortunately, ' +
							sound.user.username +
							' has blocked use of "' +
							sound.title +
							'"\n\nSorry about that. Please try another track or set.');
						if(callback) callback();
				}
			}
		});
	}
	function setPlaylistToSoundCloudTracks(tracklist,callback) {
		soundCloudPlaylist = new Playlist(filteredSoundCloudList(tracklist));
		/////console.log(soundCloudPlaylist);
		setAudioMode("soundcloud");
		loadPlaylistSong();
		if(callback) callback();
	}
	function setPlaylistToSoundCloudSearch(searchString, callback) {
		console.log("SEARCHING SOUNDCLOUD");
		if(!searchString) {callback();return;}
		SC.get('/tracks', { limit:50,streamable:true,q:searchString }, function(tracks) {
			setPlaylistToSoundCloudTracks(tracks, callback);
		});
	}
	function setPlaylistToSoundCloudInputText(inputString,callback) {
		if(isStringInString(".com/",inputString)) // TODO: there is probably a better way to test for soundcloud urls
			setPlaylistToSoundCloudURL(inputString, callback);
		else
			setPlaylistToSoundCloudSearch(inputString, callback);
	}
	
	function setPlaylistToFileList(files){
		console.log("setPlaylistToFileList");
		//filter list to audio files
		var list = [];
		for(var i=0; i<files.length; i++){
			if(files[i].type.split("/")[0]==="audio") list.push(files[i]);
		}
		myMusicPlaylist = new Playlist(list);
		
		console.log(myMusicPlaylist);
		setAudioMode("mymusic");
		loadPlaylistSong();
	}
				
	
	
	
	
	
	
	//	GIF Playlists
	///////////////////////////////////////////////////////////////////////////
	
	
	var gifPlaylistIndex = 0;//Math.floor(Math.random()*gifPlaylist.length);
	function loadPlaylistGif() {
		var gifDetails = gifPlaylist[gifPlaylistIndex];
		loadGifFromDetails(gifDetails);
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
	
	$id('nextGif').onclick = nextGif;
	$id('previousGif').onclick = previousGif;
	$id('randomGif').onclick = randomGif;
	
	
	//right arrow press to nextGif
	// this is glitched when conflicting with input fields
	$("body").onkeyup = function(e){if(e.keyCode == 39) nextGif();}; // right arrow pressed
	
	
	//swipe left to nextGif
	var touchDownX = 0;
	var touchDownY = 0;
	var touchDownT = 0;
	$id('gifContainer').addEventListener('touchstart', function(e) {
		//e.preventDefault();
		touchDownX = e.changedTouches[0].pageX;
		touchDownY = e.changedTouches[0].pageY;
		touchDownT = (new Date()).getTime();
	});
	$id('gifContainer').addEventListener('touchmove', function(e) {
		e.preventDefault();
	});
	$id('gifContainer').addEventListener('touchend', function(e) {
		//e.preventDefault();
		if( (touchDownX - e.changedTouches[0].pageX > 150)
		&& Math.abs(touchDownX - e.changedTouches[0].pageX) > Math.abs(touchDownY - e.changedTouches[0].pageY)
		//&& ((new Date()).getTime()-touchDownT < 200) 
		) {
			nextGif();
		}
		else {
			resetTimer();
		}
	});

	
	
	
	
	
	
	
	
	
//	File Loading
///////////////////////////////////////////////////////////////////////////////
	

var currentSongXHR = false;
function loadSongURL(url) {
	if(!useBuffer) {
		audioPlayer.src = url;
		audioPlayer.load();
		return;
	}
	
	if(currentSongXHR) currentSongXHR.abort();
	
	var currentSongXHR = new XMLHttpRequest();
	console.log(currentSongXHR);
	currentSongXHR.open("GET", url, true);
	//if(navigator.doNotTrack) {
		console.log("DNT to null so iOS can get soundcloud");
		currentSongXHR.setRequestHeader("DNT",null);
	//}
	currentSongXHR.responseType = "arraybuffer";
	console.log("currentSongXHR");
	console.log(currentSongXHR);

	$id("bigPlayButton").innerHTML = "0";
	currentSongXHR.onload = function(e) { 
		audioCtx.decodeAudioData(
			currentSongXHR.response,
			function(b) {
				source.buffer = b;
				/**/playMusic();/**/
				$id("bigPlayButton").innerHTML = '&#9658';
			},
			function() {console.log("Error loading music");}
		);
	}
	currentSongXHR.onprogress = function (e) {
		if (e.lengthComputable) {
			$id("bigPlayButton").innerHTML = ""+Math.floor(100*e.loaded/e.total);//+"%";
		}	
		console.log("currentSongXHR.getAllResponseHeaders()");
		console.log(currentSongXHR.getAllResponseHeaders());
	};
	currentSongXHR.onerror = function(e) {
		$id("bigPlayButton").innerHTML = 'err';
		//loadSongURL(this.responseURL);
		console.log(this)
	};
	currentSongXHR.onreadystatechange=function()
	{
		console.log("XHR READY STATE CHANGE");
		console.log(currentSongXHR);
	}

	currentSongXHR.send();
}
	////bug if user's first action is to search for a song, not hit enter, then click play
	function loadMusicFromDetails(details,callback) {
		var mode = details.audioMode;
		var id = details.audioID;
		if(!id || !mode ) {
			id='https://soundcloud.com/thebigfeel/sets/gifspkr';
			mode="soundcloud";
		}

		switch(mode) {
			case "soundcloud":
				console.log($id("song_input"));
				$id("song_input").value=id;
				setPlaylistToSoundCloudInputText(id, callback);
				break;
//			case "url":
//				break;
			default:
				console.log("Unfamiliar audioMode: "+mode);
		}
	}

function loadURLFromFile(file, onload) {
	reader = new FileReader();
	console.log(reader);
	reader.onload = onload;
	reader.readAsDataURL(file);
}

function loadBinaryFromFile(file, onload) {
	reader = new FileReader();
	console.log(reader);
	reader.onload = onload;
	reader.readAsBinaryString(file);
}

function loadSongFromFile(file) {
	console.log("loadSongFromFile");
	console.log(file);
	loadURLFromFile(file,function(e) {
		loadSongURL( e.target.result );
		setAudioMode("mymusic");
		if(!useBuffer) playMusic();
	});
}

function loadGifFromFile(file) {
	loadBinaryFromFile(file,function(e) {
		gifspkr.gifPlayer.load_from_binary_text(	e.target.result );
	});
	setGifSettingsToDefaults(true);
	updateSpeakerVideoOptions();
	noImageNetwork();

}

	function loadGifFromURL(url){
		gifspkr.gifPlayer.load_url(	url );
		setGifSettingsToDefaults(true);
		updateSpeakerVideoOptions();
		noImageNetwork();
	}
	function loadGifFromDetails(details) {
		var id = details.imgID || details.id;
		if(!id) return;
		
		
		addClass("loading",$id('nextGif'));
		setGifSettingsToDefaults();
		
		switch(details.imgMode) {
			case "imgur":
				gifspkr.gifPlayer.load_url(	"http://i.imgur.com/"+id+".gif" );
				//$id("visInfo").innerHTML = '<a href="http://imgur.com/'+id+'">IMGUR:'+id+'</a>';
				
				$id("imageNetwork").innerHTML = "<img src='/_images/imgur-logo-embed.png' />"
				$("#visInfo>a").href = "http://imgur.com/"+id;
				$id("visInfo").style.visibility = "visible";
				break;
			case "url":
				gifspkr.gifPlayer.load_url( id );
				//$id("imageNetwork").innerHTML = id;
				//$("#visInfo>a").href = id;//id.split('\\').pop().split('/').pop();
				$id("visInfo").style.visibility = "hidden";
				break;
			default:
				console.log("Unfamiliar imgMode: "+details.imgMode);
		}

		if(details.hasOwnProperty("gifSmooth"))  $id("gifSmooth").value		= details["gifSmooth"];
		if(details.hasOwnProperty("gifIn"))		$id("gifIn").value			= details["gifIn"];
		if(details.hasOwnProperty("gifOut"))		$id("gifOut").value			= details["gifOut"];
		if(details.hasOwnProperty("gifReverse"))	$id("gifReverse").checked	= details["gifReverse"];
		if(details.hasOwnProperty("gifLoop"))	$id("gifLoop").checked		= details["gifLoop"];
		updateSpeakerVideoOptions();
	}


function noImageNetwork() { // TODO: this should move to handling image data display by mode switch
	$("#visInfo>a").removeAttribute("href");
	$id("visInfo").style.visibility = "hidden";
}

	
	
	
	

	
//	Drag N Drop
///////////////////////////////////////////////////////////////////////////////	
	
function drop(e) {
	// TODO:  major improvements
	// should be able to drop gifs and music all at once
	
	e.preventDefault();
	console.log("dropEvent:");
	console.log(e);
	//console.log(e.dataTransfer.getData("text/html"));
	var file = e.dataTransfer.files[0];
	var img = e.dataTransfer.getData("text/html");
	console.log(img);
	
    var rex = /src="?([^"\s]+)"?\s*/;
    var url = rex.exec(img);
	url = url ? url[1] : url;
	


	if(file) {
		console.log("Dropped file:");
		console.log(file);
		
		if(file.type.split('/')[0]==="audio")
			setPlaylistToFileList(e.dataTransfer.files);
		else if(file.type === "image/gif")
			loadGifFromFile(file);
		return;
/*		switch(file.type) {
			case "audio/mp3":
			case "audio/mpeg":
			case "audio/ogg":
				setPlaylistToFileList(e.dataTransfer.files);
				
				//loadSongFromFile(file);
				break;
			case "image/gif":
				loadGifFromFile(file);
				break;
			case "audio/m4p":
				break;
			
			default:
				alert("Gifspkr doesn't yet know how to handle "+file.type.split("/")[1]+" files");
		}
		
*/	}
	else if(url)
	{
		console.log("Dropped url:");
		console.log(url);
		loadGifFromURL(url);
	}
	return false;
}	
/*function gifDrop(e) {
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
}*/
var gifDropZone = $id("gifContainer");//$('.jsgif canvas');
gifDropZone.ondrop = drop;	
gifDropZone.ondragover = function() { return false; };// must exist for drag n drop

	
	
	
	





//	Audio Bar UI
///////////////////////////////////////////////////////////////////////////////

	function expandSearchBar() {
		addClass("expanded",$id("search_button"));
		addClass("expanded",$id("song_input"));
		window.setTimeout(function(){$id("song_input").focus(),$id("song_input").select()},100); // put focus on search field
		toggleSearchExpand = collapseSearchBar;
	};
	function collapseSearchBar() {
		removeClass("expanded",$id("search_button"));
		removeClass("expanded",$id("song_input"));
		toggleSearchExpand = expandSearchBar;
	};collapseSearchBar();
	var toggleSearchExpand = expandSearchBar;
	$id("search_button").onmousedown = function(e){e.preventDefault();toggleSearchExpand();};
	$id("song_input").onchange = function(e){
		collapseSearchBar();
		addClass("loading",$id("search_button"));
		setPlaylistToSoundCloudInputText(e.target.value, function(){removeClass("loading",$id("search_button"));});
	};


	function expandAudioSourceMenu() {
		addClass("expanded",$id("audioSourceButton"));
		addClass("expanded",$id("audioSourceMenu"));
		toggleAudioSourceMenuExpand = collapseAudioSourceMenu;
	};
	function collapseAudioSourceMenu() {
		removeClass("expanded",$id("audioSourceButton"));
		removeClass("expanded",$id("audioSourceMenu"));
		toggleAudioSourceMenuExpand = expandAudioSourceMenu;
	};collapseAudioSourceMenu();
	var toggleAudioSourceMenuExpand = expandAudioSourceMenu;
	$id("audioSourceButton").onclick = function(e){toggleAudioSourceMenuExpand();};
	//$id("audioSourceMenu").onmouseout = function(e){collapseAudioSourceMenu();};
	
	function setAudioMode(mode){
		globalAudioMode = mode;
		switch(globalAudioMode) {
			case "soundcloud":
				$id("audioSourceDropDown").style.visibility = "visible";
				$id("searchBar").style.visibility = "visible";
				//$id("song_input").placeholder = "Search SoundCloud or paste SoundCloud URL here";
				
				$id("audioInfo").style.visibility = "visible";
				$id("audioControls").style.visibility = "visible";
				$id("bigPlayButton").style.display = "block";
				playlist = soundCloudPlaylist;
				setSourceToPlayer();
				break;
			case "mymusic":
				$id("audioSourceDropDown").style.visibility = "visible";
				$id("searchBar").style.visibility = "hidden";
				$id("audioInfo").style.visibility = "visible";
				$id("audioControls").style.visibility = "visible";
				$id("bigPlayButton").style.display = "block";
				playlist = myMusicPlaylist;
				setSourceToPlayer();
				break;
			case "linein":
				$id("audioSourceDropDown").style.visibility = "visible";
				$id("searchBar").style.visibility = "hidden";
				$id("audioInfo").style.visibility = "hidden";
				$id("audioControls").style.visibility = "hidden";
				$id("bigPlayButton").style.display = "none";
				setSourceToMic();
				break;
			default:
		}
		$id("audioSourceButton").innerHTML = $id(mode).innerHTML;
		collapseAudioSourceMenu();
	}
	function setDefaultAudioMode() {
		setAudioMode("soundcloud");
	}
	
	$id("soundcloud").onclick = function(e){setAudioMode("soundcloud");};
	$id("mymusic").onclick = function(e){setAudioMode("mymusic");};
	$id("linein").onclick = function(e){setAudioMode("linein");};
	
	
	

	




	function expandAdvanced() {
		addClass("expanded",$id("advancedControls"));
		addClass("expanded",$id("showAdvanced"));
		toggleAdvancedExpand = collapseAdvanced;
	};
	function collapseAdvanced() {
		removeClass("expanded",$id("advancedControls"));
		removeClass("expanded",$id("showAdvanced"));
		toggleAdvancedExpand = expandAdvanced;
	};collapseAdvanced();
	
/*
	function expandAdvanced() {
		removeClass("collapsed",$id("advancedControls"));
		removeClass("collapsed",$id("showAdvanced"));
		toggleAdvancedExpand = collapseAdvanced;
	};
	function collapseAdvanced() {
		addClass("collapsed",$id("advancedControls"));
		addClass("collapsed",$id("showAdvanced"));
		toggleAdvancedExpand = expandAdvanced;
	};collapseAdvanced();
	*/
	var toggleAdvancedExpand = expandAdvanced;
	$id("showAdvanced").onclick = function(e){toggleAdvancedExpand();};

	gifspkr.gifPlayer.set_progress_callback(function(loaded, total){
		if(loaded<total) {
//		console.log($id("nextGif"));
//		console.log($id("nextGif").style);
			addClass("loading",$id("nextGif"));
			$id("nextGif").style.backgroundSize=""+(100*loaded/total)+"% 100%";
//			addClass("loading",$('.jsgif canvas'));
//			$('.jsgif canvas').style.opacity=(1.0-loaded/total);
		}
		else {
			removeClass("loading",$id("nextGif"));
			$id("nextGif").style.backgroundSize="0% 5000000px";
//			removeClass("loading",$('.jsgif canvas'));
//			$('.jsgif canvas').style.opacity=1.0;
		}
	});



	function dismissWelcomeMessage(){
		$id("welcomeMessage").style.display="none";
	}









	
	
	
	
	
	
//  Animation and Rendering
///////////////////////////////////////////////////////////////////////////////


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
			var x = gifspkr.getSignalIndex()*w;
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

	function animLoop(){
		requestAnimationFrame(animLoop);
		
		//if(($id("eqVis").style.visibility !== "hidden")
		//&& ($id("eqVis").style.display !== "none"))
		if(!hasClass("hidden",$id("advancedControls")))
			drawEQ();
		gifspkr.draw();
		
		//$id("gifContainer").style.backgroundImage = $('.jsgif canvas').toDataURL();

/*
		var val=tween(gifspkr.getSignalValue(),gifspkr.audioOptions.low,gifspkr.audioOptions.high);
		val*=255;
		val=Math.floor(val);
		$id("gifContainer").style.backgroundColor = 'rgb('+val+','+0+','+Math.floor(0.4*val)+')';
*/

		
	};
	animLoop();
	

	
	
	
//  GO!
///////////////////////////////////////////////////////////////////////////////
	
	//setPlaylistToSoundCloudSearch("m.o.o.n.");
//	if(globalAudioMode === "soundcloud")
//		if(!useBuffer)
//			setPlaylistToSoundCloudSearch("ratatat");
		


	//$('.jsgif canvas').addEventListener('click', function(){togglePlayback();});
	$('.jsgif canvas').onclick = function(){togglePlayback();};
	
	
	if(true||useBuffer) {
		//empty wav file
		audioPlayer.src="data:audio/wave;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==";
		audioPlayer.load();
		
		//ios safari playback initialization
		//$('.jsgif canvas').onclick = function() {
		togglePlayback = function() {
			audioPlayer.play()
			loadMusicFromDetails(getCurrentURLParams(),playMusic);
			//setPlaylistToSoundCloudURL('https://soundcloud.com/thebigfeel/sets/gifspkr',playMusic);
			//setPlaylistToSoundCloudSearch("ratatat",playMusic);
			//setPlaylistToSoundCloudInputText("ratatat",playMusic);
			
			//$('.jsgif canvas').onclick = function(){togglePlayback();};
		}
	}

	function autoNextGif() {
		nextGif();
		window.setTimeout(autoNextGif, 10000);
	}
	//window.setTimeout(autoNextGif,10000);
	
	
};
