


function lerp(t,a,b) {
	return a + t*(b-a);
}
function tween(t,a,b) { // the betweenness of t within A and B. remaps A->B to 0->1
	if(a==b) return 0;
	return (t-a)/(b-a);
}
function clamp(value, a, b) {
	var low = Math.min(a,b);
	var high = Math.max(a,b);
	return Math.min(Math.max(value,low),high);
}
function sanitizeFrame(frame, frameCount) {
	return clamp(Math.floor( frame ), 0,frameCount-1);
}











function GifOptions() {
	return {
		smooth		: 0.300,	//gifSmoothControl
		start		: 0.000,	//gifInControl
		end			: 1.000,	//gifOutControl
		loop		: false,	//gifLoopControl
		reverse		: false		//gifReverseControl
	};
}
function AudioOptions() {
	return {
		frequency	: 0.234,	//audioFreqControl
		low			: 0.080,	//audioLowControl
		high		: 0.920,	//audioHighControl
		auto		: true
	};
}
function GifSpeaker(gifElem, inputAudioNode) {
	var gifPlayer = new SuperGif({ gif: gifElem } ); // was speakerGifControl
	gifPlayer.load();

	var analyser = inputAudioNode.context.createAnalyser();
	inputAudioNode.connect(analyser);
	var freqs = new Uint8Array(1024);
		var historySize = 512;
		
		this.gifPlayer			= gifPlayer;
		this.analyser			= analyser;
		this.freqs				= freqs;
		this.currentValue		= 0;
		this.lastFrame			= -1;
		this.loopTargetValue	= 0;
		this.gifAdjustValue		= -1;
		this.gifOptions			= new GifOptions();
		this.audioOptions		= new AudioOptions();
		this.isSlave			= false;
/*		this.history			={
									values:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
											0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
											0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
											0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
											],
									min:1.0,
									max:0.0,
									index:0,
									advance:function(){this.index=(++this.index)%this.values.length;},
									getCurrent:function(){return this.values[this.index];},
									setCurrent:function(n){this.values[this.index]=n;}
								 };
//		for(var i;i<512;i++) {
//			this.history.values[i]=0.0001;
//		}
		console.log('this.history');
		console.log(this.history.values);
									
*/
	
}


/*GifSpeaker.prototype.updateHistory = function(value) {

	this.history.advance();

//	if(this.history.getCurrent() >== this.history.min) {
//		this.history.min = Math.min(this.history.min,value);
//	}
//	if(this.history.getCurrent() <== this.history.max) {
//		this.history.max = Math.max(this.history.max,value);
//	}
	
	this.history.setCurrent(value);
	var min = 1.0,max=0.0;
	for(var i=0;i<this.history.values.length;i++) {
		min = Math.min(min,this.history.values[i]);
		max = Math.max(max,this.history.values[i]);
	}
	this.history.min = min;
	this.history.max = max;
	//console.log("audio range: " + min + " to " + max);
}*/

GifSpeaker.prototype.getSignalIndex = function() {
	return clamp(Math.round(this.audioOptions.frequency*this.analyser.frequencyBinCount),0,this.analyser.frequencyBinCount-1);
}
GifSpeaker.prototype.getSignalValue = function() {
	var value = this.freqs[this.getSignalIndex()]/256.0;

	return value;
}
GifSpeaker.prototype.updateAnalyser = function() {
	this.analyser.getByteFrequencyData(this.freqs);
}



GifSpeaker.prototype.draw = function()  {
	var frameCount = this.gifPlayer.get_length();
	if(frameCount<1) return;
//	if(this.gifPlayer.get_loading()) return;
	if(this.gifPlayer.get_loading()) this.lastFrame=-1; // forces frame draw while loading.

	this.updateAnalyser();
	
	if(this.gifAdjustValue>=0.0) {
		this.gifPlayer.move_to(sanitizeFrame( this.gifAdjustValue * frameCount ,frameCount));
		return;
	}

	var targetValue = this.getSignalValue(); // range: [0.0,1.0)
	targetValue = tween(targetValue,this.audioOptions.low,this.audioOptions.high);
	targetValue = clamp(targetValue,0,1);


	if(this.gifOptions.loop && !this.gifPlayer.get_loading()) {
		var duration = this.gifPlayer.get_duration();
		//this.loopTargetValue = (this.loopTargetValue + (20*Math.pow(targetValue,5))/(duration));
		//this.loopTargetValue = (this.loopTargetValue + (10*Math.pow(targetValue,2.5))/(duration));//good for non-auto
		this.loopTargetValue = (this.loopTargetValue + (12.5*Math.pow(targetValue,2.5))/(duration));//got it!
	//	if(this.loopTargetValue<this.currentValue)
	//		this.loopTargetValue++;
		this.currentValue = lerp(	this.gifOptions.smooth,//*((this.loopTargetValue-this.currentValue)),
									this.loopTargetValue,
									this.currentValue
								);//%1.0;
								this.loopTargetValue -= Math.floor(this.currentValue);
								this.currentValue %= 1;
	}
	else {
		this.currentValue = lerp(this.gifOptions.smooth,targetValue,this.currentValue);
		this.loopTargetValue = targetValue; // just for nice switching and loading
	}

	var gifInFrame = frameCount * this.gifOptions.start;
	var gifOutFrame = frameCount * this.gifOptions.end;
	var gifValue = this.gifOptions.reverse ? 1.0-this.currentValue : this.currentValue;
	var gifFrame = lerp(gifValue,gifInFrame,gifOutFrame);
	gifFrame = sanitizeFrame(gifFrame,frameCount);
	if(gifFrame !== this.lastFrame) {
		this.gifPlayer.move_to(gifFrame);
	}
	this.lastFrame = gifFrame;
	
	//this.updateHistory(targetValue);
	
	if(this.audioOptions.auto) {
//		this.audioOptions.low = lerp(.01, this.audioOptions.low, this.history.min);
//		this.audioOptions.high = lerp(.01, this.audioOptions.high, this.history.max);

		this.audioOptions.low = this.audioOptions.low < targetValue ? 
								lerp(.001, this.audioOptions.low, targetValue):
								lerp(.02, this.audioOptions.low, targetValue);
		this.audioOptions.high = this.audioOptions.high > targetValue ? 
								lerp(.001, this.audioOptions.high, targetValue):
								lerp(.02, this.audioOptions.high, targetValue);
								
	
	}
	
}


	
	