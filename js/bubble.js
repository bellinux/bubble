var track;
class WebcamFlow {
	constructor(zoneSize) {
		var resolution={width: {exact: 640}, height: {exact: 480}}; 
		var videoTag,
        isCapturing,
        calculatedCallbacks = [],
        videoFlow,
        onWebCamFail = function(e) {
			alert("Error: open the console");
			console.log(e);
        },
        onWebCamSucceed = function(stream) {
			track = stream.getVideoTracks()[0];
			track.applyConstraints({advanced: [ {
														exposureMode: "manual",
														exposureTime: 500

												} ]});
            isCapturing = true;
            videoTag.srcObject = stream;
            videoTag.play();
            videoFlow.startCapture(videoTag);
            videoFlow.onCalculated(gotFlow);
        },
        gotFlow = function(direction) {
            calculatedCallbacks.forEach(function (callback) {
                callback(direction);
            });
        },
        initCapture = function() {
			if (!videoFlow) {
				videoTag = document.createElement('video');
				videoTag.setAttribute('autoplay', true);
				videoFlow = new VideoFlow(videoTag, zoneSize);
			}
			navigator.mediaDevices.getUserMedia({ video: resolution })
				.then(onWebCamSucceed)
				.catch(onWebCamFail);
		}
		function VideoFlow(defaultVideoTag, zoneSize) {
			var calculatedCallbacks = [],
				canvas,
				video = defaultVideoTag,
				ctx,
				width,
				height,
				oldImage,
				loopId,
				isCapturing = false,
				getCurrentPixels = function () {
					width = video.videoWidth;
					height = (video.videoHeight)-(480-360);
					canvas.width  = width;
					canvas.height = height;
					if (width && height) {
						ctx.filter = 'blur(8px)';
						ctx.drawImage(video, 0, 0, 640, 360, 0, 0, 640, 360);
						var imgd = ctx.getImageData(0, 0, width, height);
						return imgd.data;
					}
				},
				calculate = function () {
					var newImage = getCurrentPixels();
					if (oldImage && newImage) {
						var step=zoneSize;
						var zones = [];
						var winStep = step * 2 + 1;
						var A2, A1B2, B1, C1, C2;
						var u, v, uu, vv;
						uu = vv = 0;
						var wMax = width - step - 1;
						var hMax = height - step - 1;
						var globalY, globalX, localY, localX;
						for (globalY = step + 1; globalY < hMax; globalY += winStep) {
							for (globalX = step + 1; globalX < wMax; globalX += winStep) {
								A2 = A1B2 = B1 = C1 = C2 = 0;
								for (localY = -step; localY <= step; localY++) {
									for (localX = -step; localX <= step; localX++) {
										var address = (globalY + localY) * width + globalX + localX;
										var gradX = (newImage[(address - 1) * 4]) - (newImage[(address + 1) * 4]);
										var gradY = (newImage[(address - width) * 4]) - (newImage[(address + width) * 4]);
										var gradT = (oldImage[address * 4]) - (newImage[address * 4]);
										A2 += gradX * gradX;
										A1B2 += gradX * gradY;
										B1 += gradY * gradY;
										C2 += gradX * gradT;
										C1 += gradY * gradT;
									}
								}
								var delta = (A1B2 * A1B2 - A2 * B1);
								if (delta !== 0) {
									var iDelta = step / delta;
									var deltaX = -(C1 * A1B2 - C2 * B1);
									var deltaY = -(A1B2 * C2 - A2 * C1);
									u = deltaX * iDelta;
									v = deltaY * iDelta;
								} else {
									var norm = (A1B2 + A2) * (A1B2 + A2) + (B1 + A1B2) * (B1 + A1B2);
									if (norm !== 0) {
										var iGradNorm = step / norm;
										var temp = -(C1 + C2) * iGradNorm;

										u = (A1B2 + A2) * temp;
										v = (B1 + A1B2) * temp;
									} else {
										u = v = 0;
									}
								}
								zones.push({x: globalX, y: globalY, u: u, v: v, intensity: Math.abs(u)+Math.abs(v)});
							}
						}
						calculatedCallbacks.forEach(function (callback) {
							callback(zones);
						});
					}
					oldImage = newImage;
				},
				initView = function () {
					width = video.videoWidth;
					height = video.videoHeight;

					if (!canvas) { 
						canvas = document.createElement('canvas'); 
						canvas.setAttribute('id', "cameraCut");
						document.body.appendChild(canvas);
						
					}
					ctx = canvas.getContext('2d');
				},
				animloop = function () {
					if (isCapturing) {
						loopId = videoTag.requestVideoFrameCallback(animloop);
						calculate();
					}
				};
			if (!defaultVideoTag) {
				var err = new Error();
				err.message = "Video tag is required";
				throw err;
			}
			this.startCapture = function () {
				isCapturing = true;
				initView();
				animloop();
			};
			this.onCalculated = function (callback) {
				calculatedCallbacks.push(callback);
			};
		}
		this.startCapture = function () {
			if (!isCapturing) {
				initCapture();
			}
		};
		this.onCalculated = function (callback) {
			calculatedCallbacks.push(callback);
		};
	}
}


class Bubble {
	constructor() {
		let elementNames = [];
		let generalElements;
		let zoneInsideElements=[];
		let valueElements=[];
		let valueElementsBG=[];
		let elementWindow = [];
		let elementWindowBG = [];
		let thresholdValues = [];
		let thresholdValuesBG = [];
		let windowSize=3;
		let finalThreshold=12;
		let bgFactor=600;
		let zoneSize = 4; 
		let w = 1920;
		let h = 1080;
		let zoneTH=7;
		let preselected=false;
		let preselectedTimeout;
		let elementLeft = [];
		let bubbleLayer = document.createElement('canvas');
		bubbleLayer.setAttribute('width', w+"px");
		bubbleLayer.setAttribute('height', h+"px");
		bubbleLayer.setAttribute('style', "position: absolute; top: 0; left: 0;");
		document.body.appendChild(bubbleLayer);
		let sceneCtx = bubbleLayer.getContext('2d');
		let sceneWidth = bubbleLayer.width;
		let sceneHeight = bubbleLayer.height;		
		let lastActivity=Date.now();
		let lastActivityActivation=[];
		var totalZones = (Math.ceil((h - 1) / (2 * zoneSize + 1)) - 1) * (Math.ceil((w - 1) / (2 * zoneSize + 1)) - 1);
		let totalMovementArray=[0,0,0,0,0,0,0,0];
		let totalMovementsThreshold=40000;
		let hideTimeout=6000;
		let repeatedActivationTime=2500;
		let repeatedActivationTimeContinuous=600;

		let videoStream = new WebcamFlow(zoneSize, w, h);

		function arrayFillWith0(array, dimension){
			array.length = dimension;
			array.fill(0);
		}
		
		generalElements = document.getElementsByClassName("bubbleControl");
		
		for (let i = 0; i < generalElements.length; i++) {
			//generalElements[i].innerHTML='<p class="generalElementDesc">'+generalElements[i].innerText+'</p>';
			elementNames.push({	name: generalElements[i].id	});
			elementLeft.push(generalElements[i].offsetLeft);
			zoneInsideElements[generalElements[i].id]=[];
			valueElements[generalElements[i].id]=1;
			valueElementsBG[generalElements[i].id]=1;
			lastActivityActivation[generalElements[i].id]=Date.now();
			thresholdValues[generalElements[i].id]=1;
			elementWindow[generalElements[i].id]=[];
			elementWindowBG[generalElements[i].id]=[];
			arrayFillWith0(elementWindow[generalElements[i].id], windowSize);
			arrayFillWith0(elementWindowBG[generalElements[i].id], windowSize);

		}

		let zoomFactor=3;
		
		let elementBG = { x1: 240, x2: (1920-240), y1: 240, y2: 1080 }
		console.log(elementBG);
		
		let zoneInsideElementsBG=[];

		
		let init=true;
		videoStream.onCalculated(function(zones) {
			console.log(zones.length);
			
			for (let i = 0; i < generalElements.length; i++) {
				let offScreen=generalElements[i].style.display=="none" ? 10000 : 0;
				elementNames[i].x1 = generalElements[i].offsetLeft+offScreen;
				elementNames[i].x2 = generalElements[i].offsetLeft + generalElements[i].clientWidth;
				elementNames[i].y1 = generalElements[i].offsetTop+offScreen;
				elementNames[i].y2 = generalElements[i].offsetTop + generalElements[i].clientHeight;
				zoneInsideElements[generalElements[i].id]=[];
				zoneInsideElementsBG=[];
				valueElements[generalElements[i].id]=0;
				valueElementsBG[generalElements[i].id]=0;
			}
			
			let movementIntensity=0;
			for (let zoneNumber = 0; zoneNumber < zones.length; ++zoneNumber) {
				let zone = zones[zoneNumber];
				let currZoneX=-(zone.x*zoomFactor)+1920
				let currZoneY=zone.y*zoomFactor;
				movementIntensity+=zone.intensity;
				
				//console.log(currZoneX);
				if (!(currZoneX > elementBG.x1 && currZoneX < elementBG.x2 && currZoneY > elementBG.y1 && currZoneY < elementBG.y2)) {
					zoneInsideElementsBG.push(zoneNumber);
				}
				
				
				
				for (let i = 0; i < elementNames.length; i++) {
					if (currZoneX > elementNames[i].x1 && currZoneX < elementNames[i].x2 && currZoneY > elementNames[i].y1 && currZoneY < elementNames[i].y2) {
						zoneInsideElements[elementNames[i].name].push(zoneNumber);
					}
				}
				
			}
			
			//console.log(zoneInsideElementsBG);
			
			totalMovementArray.push(movementIntensity);
			totalMovementArray.shift();
			
			let finalMovementIntensity=totalMovementArray.reduce((a, b) => a + b, 0);
			//console.log(finalMovementIntensity);
			if (finalMovementIntensity>totalMovementsThreshold) lastActivity=Date.now();
			
			
			sceneCtx.clearRect(0, 0, sceneWidth, sceneHeight);
			
			let showElements = ((lastActivity+hideTimeout)<Date.now()) ? "hidden" : "visible";
			for (let i = 0; i < elementNames.length; i++) {
				document.getElementById(elementNames[i].name).style.visibility=showElements;
			}
			if (showElements=="hidden") return;

			for (let zoneNumber = 0; zoneNumber < zones.length; ++zoneNumber) {
				let zone = zones[zoneNumber];
				if (zone.intensity > zoneTH) {
					for (let i = 0; i < elementNames.length; i++) {
						if (zoneInsideElements[elementNames[i].name].includes(zoneNumber)){
							valueElements[elementNames[i].name]+=10/zoneInsideElements[elementNames[i].name].length;	
						} else if (zoneInsideElementsBG.includes(zoneNumber)) {
							valueElementsBG[elementNames[i].name]+=zone.intensity/bgFactor;
						}
					}
					sceneCtx.strokeStyle = '#000';
					sceneCtx.lineWidth = 2;
					sceneCtx.beginPath();
					sceneCtx.globalAlpha = zone.intensity/10;
					//sceneCtx.arc(-(zone.x*zoomFactor)+1920, zone.y*zoomFactor, Math.max(zone.intensity/4, 6), 0, 2 * Math.PI);
					sceneCtx.arc(-(zone.x*zoomFactor)+1920, zone.y*zoomFactor, zone.intensity/2, 0, 2 * Math.PI);
					sceneCtx.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
					sceneCtx.fill();
				}
			}
			
			let thresholdButtonBG=0;
			for (let i = 0; i < elementNames.length; i++) {
				elementWindow[elementNames[i].name].push(valueElements[elementNames[i].name]);
				elementWindow[elementNames[i].name].shift();
				
				thresholdButtonBG+=elementWindow[elementNames[i].name].reduce((a, b) => a + b, 0);
			}

			for (let i = 0; i < elementNames.length; i++) {

				elementWindowBG[elementNames[i].name].push(valueElementsBG[elementNames[i].name]);
				elementWindowBG[elementNames[i].name].shift();

				thresholdValues[elementNames[i].name]=elementWindow[elementNames[i].name].reduce((a, b) => a + b, 0);
				thresholdValuesBG[elementNames[i].name]=elementWindowBG[elementNames[i].name].reduce((a, b) => a + b, 0);
				
				//subtract background
				let currentThreshold=thresholdValues[elementNames[i].name]-thresholdValuesBG[elementNames[i].name];
				
				if(elementNames[i].name=="Video")
				console.log(currentThreshold, elementNames[i].name);

				if (currentThreshold > finalThreshold){
					
					if (document.getElementById(elementNames[i].name).classList.contains("bubbleContinuous")){
						if ((lastActivityActivation[elementNames[i].name]+repeatedActivationTimeContinuous)>Date.now()) return;
					} else {
						if ((lastActivityActivation[elementNames[i].name]+repeatedActivationTime)>Date.now()) return;
					}
					
					lastActivityActivation[elementNames[i].name]=Date.now();

					var eventActivate = new CustomEvent(elementNames[i].name+".Bubble", { "detail": {"success": 1 } });
					document.dispatchEvent(eventActivate);
					document.getElementById(elementNames[i].name).style.backgroundColor="yellow";
					setTimeout(function(){ 
						for (let i = 0; i < elementNames.length; i++) {
							document.getElementById(elementNames[i].name).style.backgroundColor = "";
						}
					}, 100);
					
					arrayFillWith0(elementWindow[elementNames[i].name], windowSize);
					arrayFillWith0(elementWindowBG[elementNames[i].name], windowSize);
				}
			}
		});
		videoStream.startCapture();
	}

	on(elementName, handler) {
		document.addEventListener(elementName+".Bubble", handler, false);
	}
}