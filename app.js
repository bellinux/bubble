
	let controls = new Bubble();
	
	//START MAIN VIEW
	
	controls.on("Gallery", e => { 
		showView("galleryView");
		document.getElementById("gallery").style.transform = "translateX(0px)";
		document.getElementById("Previous").style.opacity=0;
		document.getElementById("Next").style.opacity=1;
	});

	controls.on("Video", e => { 
		videoCurrentTime=0;
		videoFile.currentTime=videoCurrentTime;
		document.getElementById("PlayStop").style.backgroundImage="url(graph/play.svg)";
		showView("videoView");
	});

	controls.on("Read", e => { 
		translateYRead=0;
		document.getElementById("readElement").style.transform = "translateY(0px)";
		document.getElementById("ScrollUp").style.opacity=0;
		document.getElementById("ScrollDown").style.opacity=1;
		showView("readView");
	});
	
	//END MAIN VIEW
	
	
	//START GALLERY VIEW
	galleryScrollValue=1;
	
	controls.on("ReturnFromGallery", 	e => { gotoMainView() });
	controls.on("Next", 				e => { moveContGallery(galleryScrollValue) });
	controls.on("Previous", 			e => { moveContGallery(-galleryScrollValue) });
	
	let positions=[0, -1750, -3500, -5250, -7000, -8750, -10500, -12250, -14000, -15750];
	let galleryPosition=0;
	
	function moveContGallery(value){
		galleryPosition+=value;
		console.log(galleryPosition);
		if (galleryPosition < 0+galleryScrollValue){
			galleryPosition=0;
			document.getElementById("Previous").style.opacity=0;
		} else if (galleryPosition > positions.length-1-galleryScrollValue) {
			galleryPosition=positions.length-1;
			document.getElementById("Next").style.opacity=0;
		} else {
			document.getElementById("Next").style.opacity=1;
			document.getElementById("Previous").style.opacity=1;
		}
		
		document.getElementById("gallery").style.transform = "translateX(" + positions[galleryPosition] + "px)";
	}
	//END GALLERY VIEW
	
	
	
	
	//START VIDEO VIEW
	controls.on("ReturnFromVideo", e => { gotoMainView() });
	controls.on("FastBackward", e => { backwardForward(-30);	});
	controls.on("FastForward", 	e => { backwardForward(30);	});

	controls.on("PlayStop", e => { 
		if (videoFile.paused) {
			videoFile.play();
			document.getElementById("PlayStop").style.backgroundImage="url(graph/stop.svg)";
		} else {
			videoFile.pause();
			document.getElementById("PlayStop").style.backgroundImage="url(graph/play.svg)";
		}
	});
	
	videoFile=document.getElementById("videoFile");
	videoCurrentTime=0;
	videoFile.addEventListener('timeupdate', (event) => {
		videoCurrentTime=videoFile.currentTime;
		document.getElementById("timeIndicator").innerHTML=new Date(videoCurrentTime * 1000).toISOString().substr(11, 8);
	});
	
	function backwardForward(sec) {
		videoCurrentTime=videoCurrentTime + sec;
		document.getElementById("timeIndicator").innerHTML=new Date(videoCurrentTime * 1000).toISOString().substr(11, 8);
		videoFile.currentTime=videoCurrentTime;
	}

	//END VIDEO VIEW
	
	
	
	
	
	
	
	//START READ VIEW
	movementValue=580;
	
	controls.on("ReturnFromRead", e => { gotoMainView()	});
	controls.on("ScrollUp", 	e => { scrollRead(movementValue);	 });
	controls.on("ScrollDown",	e => { scrollRead(-movementValue); });
	
	translateYRead=0;
	limitTranslate=10400;
	function scrollRead(pos) {
		translateYRead=translateYRead+(pos);
		if (translateYRead>-movementValue){
			translateYRead=0;
			document.getElementById("ScrollUp").style.opacity=0;
		} else if (translateYRead<-limitTranslate+movementValue){
			translateYRead=-limitTranslate;
			document.getElementById("ScrollDown").style.opacity=0;
		} else {
			document.getElementById("ScrollDown").style.opacity=1;
			document.getElementById("ScrollUp").style.opacity=1;
		}
		document.getElementById("readElement").style.transform = "translateY(" + translateYRead + "px)";
		
	}
	
	//END READ VIEW
	
	//STARTUP
	function showView(elementToShow){
		[].forEach.call(document.getElementsByClassName("view"), function (el) {
			el.style.display="none";
		});
		document.getElementById(elementToShow).style.display="block";
	}
	
	function gotoMainView(){
		showView("mainView");
		videoFile.pause();
	}
	gotoMainView();