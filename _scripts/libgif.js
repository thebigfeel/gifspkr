/*
	SuperGif

	Example usage:

		<img src="./example1_preview.gif" rel:animated_src="./example1.gif" width="360" height="360" rel:auto_play="1" />

		<script type="text/javascript">
			$$('img').each(function (img_tag) {
				if (/.*\.gif/.test(img_tag.src)) {
					var rub = new SuperGif({ gif: img_tag } );
					rub.load();
				}
			});
		</script>

	Image tag attributes:

		rel:animated_src -	If this url is specified, it's loaded into the player instead of src.
							This allows a preview frame to be shown until animated gif data is streamed into the canvas

		rel:auto_play -		Defaults to 1 if not specified. If set to zero, a call to the play() method is needed

	Constructor options args

		gif 				Required. The DOM element of an img tag.
		auto_play 			Optional. Same as the rel:auto_play attribute above, this arg overrides the img tag info.
		max_width			Optional. Scale images over max_width down to max_width. Helpful with mobile.

	Instance methods

		// loading
		load( callback )	Loads the gif into a canvas element and then calls callback if one is passed

		// play controls
		play -				Start playing the gif
		pause -				Stop playing the gif
		move_to(i) -		Move to frame i of the gif
		move_relative(i) -	Move i frames ahead (or behind if i < 0)

		// getters
		get_canvas			The canvas element that the gif is playing in. Handy for assigning event handlers to.
		get_playing			Whether or not the gif is currently playing
		get_loading			Whether or not the gif has finished loading/parsing
		get_auto_play		Whether or not the gif is set to play automatically
		get_length			The number of frames in the gif
		get_current_frame	The index of the currently displayed frame of the gif

		For additional customization (viewport inside iframe) these params may be passed:
		c_w, c_h - width and height of canvas
		vp_t, vp_l, vp_ w, vp_h - top, left, width and height of the viewport

		A bonus: few articles to understand what is going on
			http://enthusiasms.org/post/16976438906
			http://www.matthewflickinger.com/lab/whatsinagif/bits_and_bytes.asp
			http://humpy77.deviantart.com/journal/Frame-Delay-Times-for-Animated-GIFs-214150546

*/

// Generic functions
var bitsToNum = function (ba) {
	return ba.reduce(function (s, n) {
		return s * 2 + n;
	}, 0);
};

var byteToBitArr = function (bite) {
	var a = [];
	for (var i = 7; i >= 0; i--) {
		a.push( !! (bite & (1 << i)));
	}
	return a;
};

// Stream
/**
 * @constructor
 */
// Make compiler happy.
var Stream = function (data) {
	this.setPos = function(pos) {
		this.pos = pos;
	}
	this.setPos(0);
	
	this.updateData = function(data) {
		this.data = data;
		this.len = data.length;
		console.log(this.data[0]);
	}
	this.updateData(data);
	

	this.readByte = function () {
		if (this.pos >= this.data.length) {
			//throw new Error('Attempted to read past end of stream.');
			throw new Error('OOB');//shorter for faster comparison
		}
		return this.data.charCodeAt(this.pos++) & 0xFF;
	};

	this.readBytes = function (n) {
		var bytes = [];
		for (var i = 0; i < n; i++) {
			bytes.push(this.readByte());
		}
		return bytes;
	};

	this.read = function (n) {
		var s = '';
		for (var i = 0; i < n; i++) {
			s += String.fromCharCode(this.readByte());
		}
		return s;
	};

	this.readUnsigned = function () { // Little-endian.
		var a = this.readBytes(2);
		return (a[1] << 8) + a[0];
	};
	

};

var lzwDecodeFast = function (minCodeSize, data) {
	var count=0;
	// TODO: Now that the GIF parser is a bit different, maybe this should get an array of bytes instead of a String?
	//var pos = 0; // Maybe this streaming thing should be merged with the Stream?
	/*var bytePos = 0;
	var bitMask = 1;
	var readCode = function (size) {
		var code = 0;
		//if(count<10) console.log("charcode"+count+": "+data.charCodeAt(bytePos));
		//count++;
		for (var i = 0; i < size; i++) {
			//if (             data[pos >> 3] & (1 << (pos & 7))) {
			//if (data.charCodeAt(bytePos) & (1 << (bitPos))) {
			//if (data.charCodeAt(pos >> 3) & (1 << (pos & 7))) {
			if (data.charCodeAt(bytePos) & bitMask) {
				code |= 1 << i;
			}
			//pos++;
			if(bitMask===128) {
				bitMask = 1;
				bytePos++;
			} else {
				bitMask=bitMask<<1;
			}
		}
		//if(count<10) console.log("code: "+code+" size: "+size);
		return code;
	};/**/
	
	var bitPos = 0; 
	var readCode = function (size) {
		var bitsLeftInCode = size;
		var bitsLeftInByte = 8-(bitPos&7);
		var code = 0;
		var shift = 0;
		var chunk = 0;
		// ab[cdefgh|	ijkl|mnop]  <--- 10 bits from an inset of two is mnop|cdefgh
		//debugger;
		while(bitsLeftInCode) {
			chunk = data.charCodeAt(bitPos >> 3) >> (8-bitsLeftInByte);
			//if(count<10) console.log("charcode"+count+": "+chunk);
			count++;
			if(bitsLeftInCode<=bitsLeftInByte) { // read from beginning of byte to code end
				chunk &= 255 >> (8-bitsLeftInCode);
				code |= chunk << shift;
				bitPos += bitsLeftInCode;
				//if(count<10) {console.log("code"+code+" size: "+size+" bitPos"+bitPos+" bitsLeftInCode"+bitsLeftInCode+" bitsLeftInByte"+bitsLeftInByte);}
				//if(count<10) console.log("code: "+code+" size: "+size);
				return code;
			}
			else { // read from bitPosition to end of byte
				//code = code << 8;
				//chunk &= 255 >> (8-bitsLeftInByte);
				code |= chunk << shift;
				shift += bitsLeftInByte;
				bitPos += bitsLeftInByte;
				bitsLeftInCode -= bitsLeftInByte;
				bitsLeftInByte = 8;
			}
		}
		// should never reach this line
		console.log("Outside gif readcode loop. should not be here");
		return code;
	};/**/

	var output = '';

	var clearCode = 1 << minCodeSize;
	var eoiCode = clearCode + 1;

	var codeSize = minCodeSize + 1;

	var dict = new Array(48000);
//console.log(clearCode);
var pushIndex;
	var clear = function () {
		//console.log(pushIndex);
		codeSize = minCodeSize + 1;
		for (var i = 0; i < clearCode; i++) {
			dict[i] = String.fromCharCode(i);
		}
		dict[clearCode] = '';
		dict[eoiCode] = '';//null;
		pushIndex = eoiCode+1;

	};

	var code;
	var last;

/*	function LZW_innerLoop(){
		last = code;
		code = readCode(codeSize);
		
		if (code === clearCode) {
			clear();
			return true;
		}
		if (code === eoiCode) return false;

		if (code < pushIndex) {
///			(function LZW_codeLessLength(){
			if (last !== clearCode) {
			
				//console.log(dict[code][0]);
///				(function LZW_dictPush(){
				dict[pushIndex++] = dict[last] + dict[code][0];
///				})();
			}
///			})();
		}
		else {
///			(function LZW_codeIsLength(){
			if (code !== pushIndex) throw new Error('Invalid LZW code.');
			dict[pushIndex++]= dict[last] + dict[last][0];
///			})();
		}
///		(function LZW_outputPushApply(){
		output+=dict[code];
///		})();

		if (pushIndex === (1 << codeSize) && codeSize < 12) {
			// If we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
			codeSize++;
		}
		return true;
	}
*/
	while (true) {
		last = code;
		code = readCode(codeSize);
		
		if (code === clearCode) {
			clear();
			continue;
		}
		if (code === eoiCode) break;

		if (code < pushIndex) {
///			(function LZW_codeLessLength(){
			if (last !== clearCode) {
			
///				(function LZW_dictPush(){
				dict[pushIndex++] = dict[last] + dict[code][0];
///				})();
			}
///			})();
		}
		else {
///			(function LZW_codeIsLength(){
			if (code !== pushIndex) throw new Error('Invalid LZW code.');
			dict[pushIndex++]= dict[last] + dict[last][0];
///			})();
		}
///		(function LZW_outputPushApply(){
		output+=dict[code];
		//console.log(dict[code]);
///		})();

		if (pushIndex === (1 << codeSize) && codeSize < 12) {
			// If we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
			codeSize++;
		}
	}
	
	// I don't know if this is technically an error, but some GIFs do it.
	//if (Math.ceil(pos / 8) !== data.length) throw new Error('Extraneous LZW bytes.');
	
	//console.log(dict);
	//console.log(output);
	return output;
};

var lzwDecode = function (minCodeSize, data) {
	// TODO: Now that the GIF parser is a bit different, maybe this should get an array of bytes instead of a String?
	var pos = 0; // Maybe this streaming thing should be merged with the Stream?
	var readCode = function (size) {
		var code = 0;
		for (var i = 0; i < size; i++) {
			if (data.charCodeAt(pos >> 3) & (1 << (pos & 7))) {
				code |= 1 << i;
			}
			pos++;
		}
		return code;
	};

	var output = [];

	var clearCode = 1 << minCodeSize;
	var eoiCode = clearCode + 1;

	var codeSize = minCodeSize + 1;

	var dict = [];

	var clear = function () {
		dict = [];
		codeSize = minCodeSize + 1;
		for (var i = 0; i < clearCode; i++) {
			dict[i] = [i];
		}
		dict[clearCode] = [];
		dict[eoiCode] = null;

	};

	var code;
	var last;

	while (true) {
		last = code;
		code = readCode(codeSize);

		if (code === clearCode) {
			clear();
			continue;
		}
		if (code === eoiCode) break;

		if (code < dict.length) {
			if (last !== clearCode) {
				dict.push(dict[last].concat(dict[code][0]));
			}
		}
		else {
			if (code !== dict.length) throw new Error('Invalid LZW code.');
			dict.push(dict[last].concat(dict[last][0]));
		}
		output.push.apply(output, dict[code]);

		if (dict.length === (1 << codeSize) && codeSize < 12) {
			// If we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
			codeSize++;
		}
	}
	// I don't know if this is technically an error, but some GIFs do it.
	//if (Math.ceil(pos / 8) !== data.length) throw new Error('Extraneous LZW bytes.');
	return output;
};


// The actual parsing; returns an object with properties.
var parseGIF = function (st, handler) {
	handler || (handler = {});

	// LZW (GIF-specific)
	var parseCT = function (entries) { // Each entry is 3 bytes, for RGB.
		//var cr = '';
		//ct+=st.read(3*entries);
		//return ct;
		var ct = [];
		for (var i = 0; i < entries; i++) {
			//ct.push(st.readBytes(3));
			var rgb = st.readBytes(3);
			var abgr = (255<<24) | (rgb[0]) | (rgb[1]<<8) | (rgb[2]<<16);
			ct[i]=abgr;
		}
		return ct;
	};

	var readSubBlocksAsString = function () {
		var size, data;
		data = '';
		do {
			size = st.readByte();
			data += st.read(size);
		} while (size !== 0);
		return data;
	};
	var readSubBlocksAsByteArray = function () {
		var size, data;
		data = [];
		do {
			size = st.readByte();
			for(var i=size;i-->0;){
				data.push(st.data.charCodeAt(st.pos++) & 0xFF);
			}
			//data.charCodeAt(this.pos++) & 0xFF;
			//data = data.concat( st.readBytes(size) );
			//Array.prototype.push.apply(data, st.readBytes(size) );
		} while (size !== 0);
		return data;
	};

	var parseHeader = function () {
		var hdr = {};
		hdr.sig = st.read(3);
		hdr.ver = st.read(3);
		console.log(hdr.sig+hdr.ver);
		if (hdr.sig !== 'GIF') throw new Error('Not a GIF file.'); // XXX: This should probably be handled more nicely.
		hdr.width = st.readUnsigned();
		hdr.height = st.readUnsigned();

		var bits = byteToBitArr(st.readByte());
		hdr.gctFlag = bits.shift();
		hdr.colorRes = bitsToNum(bits.splice(0, 3));
		hdr.sorted = bits.shift();
		hdr.gctSize = bitsToNum(bits.splice(0, 3));

		hdr.bgColor = st.readByte();
		hdr.pixelAspectRatio = st.readByte(); // if not 0, aspectRatio = (pixelAspectRatio + 15) / 64
		if (hdr.gctFlag) {
			hdr.gct = parseCT(1 << (hdr.gctSize + 1));
		}
		handler.hdr && handler.hdr(hdr);
	};

	var parseExt = function (block) {
		var parseGCExt = function (block) {
			var blockSize = st.readByte(); // Always 4
			var bits = byteToBitArr(st.readByte());
			block.reserved = bits.splice(0, 3); // Reserved; should be 000.
			block.disposalMethod = bitsToNum(bits.splice(0, 3));
			block.userInput = bits.shift();
			block.transparencyGiven = bits.shift();

			block.delayTime = st.readUnsigned();

			block.transparencyIndex = st.readByte();

			block.terminator = st.readByte();

			handler.gce && handler.gce(block);	/**//**/	//console.log("handler from parser:");	console.log(handler);
		};

		var parseComExt = function (block) {
			block.comment = readSubBlocksAsString();
			handler.com && handler.com(block);
		};

		var parsePTExt = function (block) {
			// No one *ever* uses this. If you use it, deal with parsing it yourself.
			var blockSize = st.readByte(); // Always 12
			block.ptHeader = st.readBytes(12);
			block.ptData = readSubBlocksAsString();
			handler.pte && handler.pte(block);
		};

		var parseAppExt = function (block) {
			var parseNetscapeExt = function (block) {
				var blockSize = st.readByte(); // Always 3
				block.unknown = st.readByte(); // ??? Always 1? What is this?
				block.iterations = st.readUnsigned();
				block.terminator = st.readByte();
				handler.app && handler.app.NETSCAPE && handler.app.NETSCAPE(block);
			};

			var parseUnknownAppExt = function (block) {
				block.appData = readSubBlocksAsString();
				// FIXME: This won't work if a handler wants to match on any identifier.
				handler.app && handler.app[block.identifier] && handler.app[block.identifier](block);
			};

			var blockSize = st.readByte(); // Always 11
			block.identifier = st.read(8);
			block.authCode = st.read(3);
			switch (block.identifier) {
			case 'NETSCAPE':
				parseNetscapeExt(block);
				break;
			default:
				parseUnknownAppExt(block);
				break;
			}
		};

		var parseUnknownExt = function (block) {
			block.data = readSubBlocksAsString();
			handler.unknown && handler.unknown(block);
		};

		block.label = st.readByte();
		switch (block.label) {
		case 0xF9:
			block.extType = 'gce';
			parseGCExt(block);
			break;
		case 0xFE:
			block.extType = 'com';
			parseComExt(block);
			break;
		case 0x01:
			block.extType = 'pte';
			parsePTExt(block);
			break;
		case 0xFF:
			block.extType = 'app';
			parseAppExt(block);
			break;
		default:
			block.extType = 'unknown';
			parseUnknownExt(block);
			break;
		}
	};

	var parseImg = function (img) {
		var deinterlace = function (pixels, width) {
			var newPixels = '';
			var rows = pixels.length / width;
			var imageRow = function(row) {
				return pixels.slice(row*width,(row+1)*width);
			}
			var passRows = [0,Math.ceil(rows/8),Math.ceil(rows/4),Math.ceil(rows/2)]
			var thisRow=0;
			for(var i=0;i<rows;i++) {
				if		(i&1)	thisRow = passRows[3]++;
				else if	(i&2)	thisRow = passRows[2]++;
				else if	(i&4)	thisRow = passRows[1]++;
				else			thisRow = passRows[0]++;
				newPixels += imageRow( thisRow );
			}
			return newPixels;
		};

		img.leftPos = st.readUnsigned();
		img.topPos = st.readUnsigned();
		img.width = st.readUnsigned();
		img.height = st.readUnsigned();

		var bits = byteToBitArr(st.readByte());
		img.lctFlag = bits.shift();
		img.interlaced = bits.shift();
		img.sorted = bits.shift();
		img.reserved = bits.splice(0, 2);
		img.lctSize = bitsToNum(bits.splice(0, 3));

		if (img.lctFlag) {
			img.lct = parseCT(1 << (img.lctSize + 1));
		}

		img.lzwMinCodeSize = st.readByte();
		var lzwData = readSubBlocksAsString();
		img.pixels = lzwDecodeFast(img.lzwMinCodeSize, lzwData);

		if (img.interlaced) { // Move
			img.pixels = deinterlace(img.pixels, img.width);
		}

		handler.img && handler.img(img);
	};

	var parseBlock = function () {
		var blockPos = st.pos;
		if(handler.okay) {
			try {
				var block = {};
				block.sentinel = st.readByte();

				switch (String.fromCharCode(block.sentinel)) { // For ease of matching
				case '!':
					block.type = 'ext';
					parseExt(block);
					break;
				case ',':
					block.type = 'img';
					parseImg(block);
					break;
				case ';':
					block.type = 'eof';
					handler.eof && handler.eof(block);
					break;
				default:
					throw new Error('Unknown block: 0x' + block.sentinel.toString(16)); // TODO: Pad this with a 0.
				}

				if (block.type !== 'eof') setTimeout(parseBlock, 0);
			}
			catch (err) {
				if(err.message==="OOB") {//try again while data loads
					st.setPos(blockPos);
					setTimeout(parseBlock, 0);
				}
			}
		}

		
	};

	var parse = function () {
		try {parseHeader();}
		catch (err) {
			if(err.message==="OOB") {//try again while data loads
				st.setPos(0);
				setTimeout(parse, 0);
				return;
			}
		}
		
		setTimeout(parseBlock, 0);
	};

	parse();
};

var SuperGif = function ( opts ) {
	var options = {
		//viewport position
		vp_l: 0,
		vp_t: 0,
		vp_w: null,
		vp_h: null,
		//canvas sizes
		c_w: null,
		c_h: null
	};
	for (var i in opts ) { options[i] = opts[i] }
	if (options.vp_w && options.vp_h) options.is_vp = true;

	var currentHandler
	var currentXHR;
	var stream;
	var hdr;

	var loadError = null;
	var loading = false;

	var transparency = null;
	var delay = null;
	var disposalMethod = null;
	var disposalRestoreFromIdx = 0;
	var lastDisposalMethod = null;
	var frame = null;
	var lastImg = null;

	var playing = true;
	var forward = true;

	var ctx_scaled = false;

	var frames = [];

	var gif = options.gif;
	if (typeof options.auto_play == 'undefined') 
		options.auto_play = (!gif.getAttribute('rel:auto_play') || gif.getAttribute('rel:auto_play') == '1');

	var clear = function () {
		transparency = null;
		delay = null;
		lastDisposalMethod = disposalMethod;
		disposalMethod = null;
		frame = null;
	};

	// XXX: There's probably a better way to handle catching exceptions when
	// callbacks are involved.
	var doParse = function () {
		try {
			parseGIF(stream, currentHandler);
		}
		catch (err) {
			doLoadError('parse');
		}
	};

	var doText = function (text) {
		toolbar.innerHTML = text; // innerText? Escaping? Whatever.
		toolbar.style.visibility = 'visible';
	};

	var setSizes = function(w, h) {
		canvas.width = w * get_canvas_scale();
		canvas.height = h * get_canvas_scale();
		toolbar.style.minWidth = ( w * get_canvas_scale() ) + 'px';

		tmpCanvas.width = w;
		tmpCanvas.height = h;
		tmpCanvas.style.width = w + 'px';
		tmpCanvas.style.height = h + 'px';
		tmpCanvas.getContext('2d').setTransform(1, 0, 0, 1, 0, 0);
	}

	var doShowProgress = function (pos, length, draw) {
		//return;
		
		if (draw) {
			var height = 25;
			var left, mid, top, width;
			if (options.is_vp) {
				if (!ctx_scaled) {
					top = (options.vp_t + options.vp_h - height);
					height = height;
					left = options.vp_l;
					mid = left + (pos / length) * options.vp_w;
					width = canvas.width;
				} else {
					top = (options.vp_t + options.vp_h - height) / get_canvas_scale();
					height = height / get_canvas_scale();
					left = (options.vp_l / get_canvas_scale() );
					mid = left + (pos / length) * (options.vp_w / get_canvas_scale());
					width = canvas.width / get_canvas_scale();
				}
				//some debugging, draw rect around viewport
				if (false) {
					if (!ctx_scaled) {
						var l = options.vp_l, t = options.vp_t;
						var w = options.vp_w, h = options.vp_h;
					} else {
						var l = options.vp_l/get_canvas_scale(), t = options.vp_t/get_canvas_scale();
						var w = options.vp_w/get_canvas_scale(), h = options.vp_h/get_canvas_scale();
					}
					ctx.rect(l,t,w,h);
					ctx.stroke();
				}
			}
			else {
				top = (canvas.height - height) / (ctx_scaled ? get_canvas_scale() : 1);
				mid = ((pos / length) * canvas.width) / (ctx_scaled ? get_canvas_scale() : 1);
				width = canvas.width / (ctx_scaled ? get_canvas_scale() : 1 );
				height /= ctx_scaled ? get_canvas_scale() : 1;
			}
			// XXX Figure out alpha fillRect.
			//ctx.fillStyle = 'salmon';
			ctx.fillStyle = 'rgba(255,255,255,0.4)';
			ctx.fillRect(mid, top, width - mid, height);

			//ctx.fillStyle = 'teal';
			ctx.fillStyle = 'rgba(255,0,22,.8)';
			ctx.fillRect(0, top, mid, height);
		}
	};

	var doLoadError = function (originOfError) {
		var drawError = function () {
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, options.c_w ? options.c_w : hdr.width, options.c_h ? options.c_h : hdr.height);
			ctx.strokeStyle = 'red';
			ctx.lineWidth = 3;
			ctx.moveTo(0, 0);
			ctx.lineTo(options.c_w ? options.c_w : hdr.width, options.c_h ? options.c_h : hdr.height);
			ctx.moveTo(0, options.c_h ? options.c_h : hdr.height);
			ctx.lineTo(options.c_w ? options.c_w : hdr.width, 0);
			ctx.stroke();
		};

		loadError = originOfError;
		hdr = {
			width: gif.width,
			height: gif.height
		}; // Fake header.
		frames = [];
		drawError();
	};

	var doHdr = function (_hdr) {
		hdr = _hdr;
		setSizes(hdr.width, hdr.height)
	};

	var doGCE = function (gce) {
		pushFrame();
		clear();
		transparency = gce.transparencyGiven ? gce.transparencyIndex : null;
		delay = gce.delayTime;
		disposalMethod = gce.disposalMethod;
		// We don't have much to do with the rest of GCE.
	};

	var pushFrame = function () {
		if (!tmpCanvas) return;
		var cv = document.createElement('canvas');
		cv.width = tmpCanvas.width;
		cv.height = tmpCanvas.height;
		cv.getContext('2d').drawImage(tmpCanvas,0,0);
		frames.push({
			//data: frame.getImageData(0, 0, hdr.width, hdr.height),
			canvas: cv,
			delay: delay
		});
		
		//if(frames.length == 1)
		//	ctx.drawImage(frames[0].canvas,0,0);
	};
	
var imgCanvas = document.createElement('canvas');
	
	var doImg = function (img) {
		if (!frame) frame = tmpCanvas.getContext('2d');

		var currIdx = frames.length;

		//ct = color table, gct = global color table
		var ct = img.lctFlag ? img.lct : hdr.gct; // TODO: What if neither exists?

		/*
		Disposal method indicates the way in which the graphic is to
		be treated after being displayed.

		Values :    0 - No disposal specified. The decoder is
						not required to take any action.
					1 - Do not dispose. The graphic is to be left
						in place.
					2 - Restore to background color. The area used by the
						graphic must be restored to the background color.
					3 - Restore to previous. The decoder is required to
						restore the area overwritten by the graphic with
						what was there prior to rendering the graphic.

						Importantly, "previous" means the frame state
						after the last disposal of method 0, 1, or 2.
		*/
///		(function IMG_doDisposal(){
//console.log("DISPOSAL METHOD: "+ lastDisposalMethod);
		if (currIdx > 0) {
			if (lastDisposalMethod === 3) {
				// Restore to previous
				frame.drawImage(frames[disposalRestoreFromIdx].canvas, 0, 0);
			} else {
				disposalRestoreFromIdx = currIdx - 1;
			}

			if (lastDisposalMethod === 2) {
				// Restore to background color
				// Browser implementations historically restore to transparent; we do the same.
				// http://www.wizards-toolkit.org/discourse-server/viewtopic.php?f=1&t=21172#p86079
				frame.clearRect(lastImg.leftPos, lastImg.topPos, lastImg.width, lastImg.height);
			}
		}
///		})();
		// else, Undefined/Do not dispose.
		// frame contains final pixel data from the last frame; do nothing

		//Get existing pixels for img region after applying disposal method
		imgCanvas.width = img.width;
		imgCanvas.height = img.height;
		var imgData = frame.createImageData(img.width, img.height);
		var buf = new ArrayBuffer(img.width * img.height * 4);
		var buf8 = new Uint8ClampedArray(buf);
		var data32 = new Uint32Array(buf);

		//apply color table colors
///		(function IMG_colorIndexLoop(){
		for(var i=0;i<img.pixels.length;i++){
			var pixel = img.pixels.charCodeAt(i);//img.pixels[i];//
			if(pixel!==transparency) {
				data32[i]=ct[pixel];
			}
			else{data32[i]=0;}
		}
		imgData.data.set(buf8);
///		})();
///		(function IMG_drawImage(){

		imgCanvas.getContext('2d').putImageData(imgData, 0, 0);
		frame.drawImage(imgCanvas,img.leftPos,img.topPos);
		if (!ctx_scaled) {
			ctx.scale(get_canvas_scale(),get_canvas_scale());
			ctx_scaled = true;
		}

		// We could use the on-page canvas directly, except that we draw a progress
		// bar for each image chunk (not just the final image).
		if(currIdx==1)
			ctx.drawImage(tmpCanvas, 0, 0);

		lastImg = img;
///		})();
	};

	var player = (function () {
		var i = 0;//-1;
		var curFrame;
		var delayInfo;

		var showingInfo = false;
		var pinned = false;

		var stepFrame = function (delta) { // XXX: Name is confusing.
			i = (i + delta + frames.length) % frames.length;
			curFrame = i + 1;
			delayInfo = frames[i].delay;
			putFrame();
		};

		var step = (function () {
			var stepping = false;

			var doStep = function () {
				stepping = playing;
				if (!stepping) return;

				stepFrame(forward ? 1 : -1);
				var delay = frames[i].delay * 10;
				if (!delay) delay = 100; // FIXME: Should this even default at all? What should it be?
				setTimeout(doStep, delay);
			};

			return function () {
				if (!stepping) setTimeout(doStep, 0);
			};
		}());

		var putFrame = function () {
			curFrame = i;

////////////tmpCanvas.getContext("2d").putImageData(frames[i].data, 0, 0);
			//tmpCanvas.getContext("2d").drawImage(frames[i].canvas, 0, 0);
			//ctx.globalCompositeOperation = "copy";
			ctx.drawImage(frames[i].canvas, 0, 0);

		};

		var play = function () {
			playing = true;
			step();
		};

		var pause = function () {
			playing = false;
		};


		return {
			init: function () {
				if (loadError) return;

				if ( ! (options.c_w && options.c_h) ) {
					ctx.scale(get_canvas_scale(),get_canvas_scale());
				}

				if (options.auto_play) {
					step();
				}
				else {
					i = (i<0)?0:i;
					putFrame();
				}
			},
			current_frame: curFrame,
			step: step,
			play: play,
			pause: pause,
			playing: playing,
			move_relative: stepFrame,
			current_frame: function() { return i; },
			length: function() { return frames ? frames.length : 0 },
			duration: function() { //TODO: you're doing this every time?  what are you, an idiot? put this in init
				var dur = 0;
				for(var i=0;i< frames.length;i++) {
					dur += Math.max(frames[i].delay,3.33);//max fps = 60
				}
				return dur; // time in 1/100sec
			},
			move_to: function ( frame_idx ) {
				i = Math.min(Math.max(frame_idx,0),frames.length);
				putFrame();
			}
		}
	}());

	var doDecodeProgress = function (draw) {
		doShowProgress(stream.pos, stream.data.length, false/*draw*/);
	};

	var doNothing = function () {};
	/**
	 * @param{boolean=} draw Whether to draw progress bar or not; this is not idempotent because of translucency.
	 *                       Note that this means that the text will be unsynchronized with the progress bar on non-frames;
	 *                       but those are typically so small (GCE etc.) that it doesn't really matter. TODO: Do this properly.
	 */
	var withProgress = function (fn, draw) {
		return function (block) {
			fn(block);
			doDecodeProgress(draw);
		};
	};


	var handler = function(){
		return {
			okay:true,
			hdr: withProgress(doHdr),
			gce: withProgress(doGCE),
			com: withProgress(doNothing),
			// I guess that's all for now.
			app: {
				// TODO: Is there much point in actually supporting iterations?
				NETSCAPE: withProgress(doNothing)
			},
			img: withProgress(doImg, true),
			eof: function (block) {
				//toolbar.style.display = '';
				pushFrame();
				doDecodeProgress(false);
//				if ( ! (options.c_w && options.c_h) ) {
//					canvas.width = hdr.width * get_canvas_scale();
//					canvas.height = hdr.height * get_canvas_scale();
//				}
				player.init();
				loading = false;
				if (load_callback) {
					load_callback(gif);
				}
			},
			abort: function () {
				this.okay = false;
				this.hdr=this.gce=this.com=this.app=this.img=this.eof=doNothing;

			}
		};
	};

	var init = function () {
		var parent = gif.parentNode;

		var div = document.createElement('div');
		canvas = document.createElement('canvas');
		ctx = canvas.getContext('2d');
		toolbar = document.createElement('div');

		tmpCanvas = document.createElement('canvas');

		div.width = canvas.width = gif.width;
		div.height = canvas.height = gif.height;
		toolbar.style.minWidth = gif.width + 'px';

		div.className = 'jsgif';
		toolbar.className = 'jsgif_toolbar';
		div.appendChild(canvas);
/**//**///div.appendChild(tmpCanvas);
		div.appendChild(toolbar);

		parent.insertBefore(div, gif);
		parent.removeChild(gif);

		if (options.c_w && options.c_h) setSizes(options.c_w, options.c_h);
		initialized=true;
	};

	var get_canvas_scale = function() {
		var scale;
		if (options.max_width && hdr && hdr.width > options.max_width) {
			scale = options.max_width / hdr.width;
		}
		else {
			scale = 1;
		}
		return scale;
	}

	var canvas, ctx, toolbar, tmpCanvas;
	var initialized = false;
	var load_callback = false;
	var progress_callback = false;
	var abort_load = function() {
		if(currentHandler) currentHandler.abort();
		if(currentXHR) currentXHR.abort();
		//loading = false;
	}
	return {
		// play controls
		play: player.play,
		pause: player.pause,
		move_relative: player.move_relative,
		move_to: player.move_to,

		// getters for instance vars
		get_playing      : function() { return player.playing },
		get_canvas       : function() { return canvas },
		get_canvas_scale : function() { return get_canvas_scale() },
		get_loading      : function() { return loading },
		get_auto_play    : function() { return options.auto_play },
		get_length       : function() { return player.length() },
		get_duration     : function() { return player.duration() },
		get_current_frame: function() { return player.current_frame() },
		set_progress_callback: function(f) { progress_callback = f; },
		
		load_from_binary_text: function(binaryText, callback) {
			//if (this.get_loading()) return;
			//if(currentHandler) currentHandler.abort();
			abort_load();
			if (callback) load_callback = function(){callback();};
			else load_callback = false;
			currentHandler = new handler();
			
			loading = true;
			frames = [];
			clear();
			disposalRestoreFromIdx = 0;
			lastDisposalMethod = null;
			frame = null;
			lastImg = null;

			stream = new Stream(binaryText);
			setTimeout(doParse, 0);			
		},
		load_from_binary_stream: function(callback) {
			//abort_load();
			if (callback) load_callback = function(){callback();};
			else load_callback = false;
			currentHandler = new handler();
			
			loading = true;
			frames = [];
			clear();
			disposalRestoreFromIdx = 0;
			lastDisposalMethod = null;
			frame = null;
			lastImg = null;
			console.log("LOADING FROM BINBARY STREAM");
			setTimeout(doParse, 0);			
		},
		load_url: function(src, callback){
			abort_load();

			loading = true;
			currentXHR = new XMLHttpRequest();
			currentXHR.overrideMimeType('text/plain; charset=x-user-defined');
			//currentXHR.responseType = "text";
			currentXHR.onloadstart = function() {
				// Wait until connection is opened to replace the gif element with a canvas to avoid a blank img
				if (!initialized ) init();
			};
			var function__load_from_binary_text = this.load_from_binary_text;
			var function__load_from_binary_stream = this.load_from_binary_stream;
			stream=null;
			currentXHR.onload = function(e) {
			//console.log(currentXHR.response);
				//function__load_from_binary_text(currentXHR.responseText, callback);
				if (progress_callback) {
					progress_callback(100,100);
				}
					console.log("LOAD");
					console.log(currentXHR);
					//stream= new Stream("BAD");//currentXHR.responseText);
					//stream.updateData(currentXHR.responseText);
					
					console.log(stream);var sta= stream;
					//stream = new Stream(currentXHR.responseText);
					//console.log(stream);var stb= stream;
					//console.log("sta===stb?");
					//console.log(sta==stb);
					
					//function__load_from_binary_stream(callback);
			};
			currentXHR.onprogress = function (e) {
				//stream.updateData(currentXHR.responseText);
				if (e.lengthComputable){
					if(!stream) {
						stream=new Stream('BAD');
						function__load_from_binary_stream(callback);
					}
					stream.updateData(currentXHR.responseText);
				
				
				
				
					doShowProgress(e.loaded, e.total, false);
				}
				if (progress_callback) {
					progress_callback(e.loaded,e.total);
				}
				
				if(currentXHR.response){
						
						console.log(currentXHR.responseText.length);
						
					}

					
					
			};
			currentXHR.onerror = function() { doLoadError('xhr'); };
			currentXHR.open('GET', src, true);
			currentXHR.send();
		},
		load: function (callback) {
			this.load_url(gif.getAttribute('rel:animated_src') || gif.src,callback);
		}
	};

};
