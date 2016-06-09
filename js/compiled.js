//frontend
function onNewPlayerJoin(username){//TODO
	//username is a string that is the name of the joining user.
	console.log(username + " joined!");
}

//function onRoomUpdate(gameData){//TODO
//	/*
//	input structure:
//		gameData
//			.mouseData
//				.cur[i]
//					.pos : int[2]
//					.vel : int[2]
//					.time: int
//				.prev[i]
//					.pos : int[2]
//					.vel : int[2]
//					.time: int
//			.radios[i]
//				.state : int
//				.time  : int
//		}
//	*/
//
//}

function onLoad(){
	setupSocket();
//	document.getElementsByClassName("mapHolder")[0].innerHTML =
//		RadioWars
//		.templates.map(
//		{mapData: {startFields:[], mapGridSize:[12, 5],
//					teamNames: ["red", "blue"],
//					radioGridLoc:[[1,1],[4,4], [11, 0]]}});

}

var ROOM_INDEX = null;
function setRoomIndex(i){
	ROOM_INDEX = i;
}

var ROOM_NAME = "";
function setRoomName(roomName){
	ROOM_NAME = roomName;
}

function onJoinRoom(roomData){//TODO
	/*
	input structure:
		roomData
			.roomIndex
			.roomName : string
			.team : int
			.mapData: JSON of map file data
	*/
	setRoomName(roomData.roomName);
	console.log("Joined Room " + roomData.roomName + " on team " + roomData.team);
	document.getElementById('team').innerHTML = "<h1 style='color:"+roomData.mapData.teamNames[roomData.team]+"'>You are on team " + roomData.mapData.teamNames[roomData.team] + "</h1>";
	displayMapFromRoomData(roomData);
	setTimeout(function(){socket.emit('roomLoaded', {})}, 10);
//	socketUpdatesFrom(roomData.roomName);
}

function displayMapFromRoomData(mapContext){
	document.getElementsByClassName("mapHolder")[0].innerHTML =
		RadioWars.templates.map(mapContext);
}

//var SERVER_OFFSET = 0;
//function onSyncTime(serverTime){
//	SERVER_OFFSET = Date.now() - serverTime;
//}
//
//function gameTimeNow(){
//	return Date.now()+SERVER_OFFSET;
//}
//
//function handleMouseMove(event){
//	socket.broadcast.to(ROOM_NAME).emit('mouseBroadcast',  {
//			mouseCoords: [event.pageX, event.pageY], 
//			index: ROOM_INDEX, 
//			time: gameTimeNow()}
//	);	
//}

function onMouseBroadcast(mouseData){//TODO
}

function onRadioClick(value, radioIndex){
	socket.emit('radioBroadcast', {state: value, radioIndex: radioIndex});
}
function onRadioBroadcast(radioData){
//	var firstClick = false;
	onRadioBroadcast.queue.push(radioData);
	function apply(radioData){
			if(onRadioBroadcast.times[radioData.radioIndex] === undefined){
			onRadioBroadcast.times[radioData.radioIndex] = -1; //SINCE THE BEGINING OF TIME!
	//		firstClick = true;
		}
		if(radioData.time>onRadioBroadcast.times[radioData.radioIndex]){
			var button = document.getElementById("button_"+radioData.state+"_"+radioData.radioIndex);
			button.checked = true;
			button.parentNode.parentNode.classList.remove("red-selected","blue-selected");
			var newClass = button.parentNode.innerHTML.split(">")[1]+"-selected";
			button.parentNode.parentNode.classList.add(newClass);
			onRadioBroadcast.prevClass = newClass;
			onRadioBroadcast.times[radioData.radioIndex] = radioData.time;
		}
	}
	while(onRadioBroadcast.queue.length > 0){
		apply(onRadioBroadcast.queue.pop());
	}
}

onRadioBroadcast.times = [];
onRadioBroadcast.queue = [];

function onWin(winData){
	console.log("Team " + winData.winningTeam + " Won!");
	document.getElementsByClassName("mapHolder")[0].innerHTML = "<h1 style='color:" + winData.winningTeam + "'>"+winData.winningTeam + " WON! </h1>";
}

function login(userdata){
	socket.emit('login', userdata);
}

function gotoRoom(roomNumber){
	hideButtons();
	socket.emit('gameroom', roomNumber);
}

function hideButtons(){
	var roomButtonDiv = document.getElementsByClassName("roomButtons")[0];
	var buttons = roomButtonDiv.children;
	for(var i = 0; i<buttons.length; i++){
		buttons[i].style.visibility = "hidden";
	}
}

document.addEventListener("DOMContentLoaded", onLoad);

//document.onmousemove = handleMouseMove;
function indexOfTwoTupleInArray(twoTuple, arr){
	for(var i=0; i<arr.length; i++){
		var t = arr[i];
		if(t[0] == twoTuple[0] && t[1] == twoTuple[1]){
			return i;
		}
	}
	return -1;
}

Handlebars.registerHelper("map", function(mapData, options){
	/*
		mapData
			.startFields[i]
				.x
				.y
				.width
				.height
			.mapGridSize : [x, y]
			.teamNames[i] : str
			.radioGridLoc[i] : [x, y]
			.radioStartStates[i] : [int]
	*/
	var startBoxes = [];
	for(var i = 0; i<mapData.startFields.length; i++){
		var sbs = mapData.startFields[i];
		startBoxes.push(box(sbs.y, sbs.x, sbs.height, sbs.width));
	}
	ret = "<div style=\"width:" +102*mapData.mapGridSize[0] 
				+"px; height:"+ 102*mapData.mapGridSize[1]  +"px\">";
	
	for(var j = 0; j<mapData.mapGridSize[1]; j++){
		for(var i = 0; i<mapData.mapGridSize[0]; i++){	
			var startTeamClass = "";
			var coords = (""+i)+"x"+j;	
			for(var k = 0; k < startBoxes.length; k++){
				if(startBoxes[k].hitsPoint(i, j)){
					startTeamClass += " " + mapData.teamNames[k] + "-spawn";
				}
			}
			var radioIndex = indexOfTwoTupleInArray([i, j], mapData.radioGridLoc);
			ret += options.fn({
				teams: mapData.teamNames.map(
					function(team, i){return {	team: team,
											  	teamNum: i,
												groupName: coords,
											 	radioIndex: radioIndex}}),
				isRadio: radioIndex !== -1,
				startTeamClass: startTeamClass
			});
		}
	}
	ret += "</div>";
	return ret;
});
function box(top, left, height, width){
	function hitsPoint(x, y){
		var relX = x-left;
		var relY = y-top;
		if(relX <0 || relY <0 || relY >=height || relX >=width){
			return false;
		}
		return true;
	}
	function hitsBox(nTop, nLeft, nHeight, nWidth){
		var nBot = nTop + nHeight;
		var nRight = nLeft + nWidth;
		return hitsPoint(nTop, nLeft)
			|| hitsPoint(nBot, nLeft) 
			|| hitsPoint(nTop, nRight)
			|| hitsPoint(nBot, nRight);
	}
	return {
		hitsPoint: hitsPoint,
		hitsBox: hitsBox
	};
}
	/*	Mouse position predictor.
			This takes existing mouse data and attempts to make a predictor for its position
			using a 2nd degree bezier curve approximation. 
			*/
function mousePredictor(timeDif, curP, prevP, curV, prevV){
	
	var nextV = []; //Assume there is a roughly constant acceleration
	nextV[0] = curV[0] + curV[0] - prevV[0]; 
	nextV[1] = curV[1] + curV[1] - prevV[1];
	
	var nextP = []; //with constant acceleration...
	nextP[0] = curP[0] + (timeDif * (curV[0]+nextV[0]))/2;
	nextP[1] = curP[1] + (timeDif * (curV[1]+nextV[1]))/2;
	
	//Position of mouse at time t (if current time is 0)
	return function(t){
		return [curP[0] + t*curV[0] + (nextP[0] + t*nextV[0] - curP[0] - t*curV[0])*(t/timeDif),
				curP[1] + t*curV[1] + (nextP[1] + t*nextV[1] - curP[1] - t*curV[1])*(t/timeDif)];
	}
}
var socket;
function setupSocket(){
	socket = io.connect(window.location.href);
//	socket.on('mouseBroadcast', onMouseBroadcast);
	socket.on('radiosToRoom', onRadioBroadcast);
	socket.on('newPlayer', onNewPlayerJoin);
	socket.on('roomIndex', setRoomIndex);
	socket.on('joinedRoom', onJoinRoom);
//	socket.on('syncTime', onSyncTime);
	socket.on('win', onWin);
}



//function socketUpdatesFrom(roomName){
//	socket.removeAllListeners('updateFromRoom '+ socketUpdatesFrom.oldRoomname);
//	socket.on('updateFromRoom ' + roomName, onRoomUpdate)
//}
//
//socketUpdatesFrom.oldRoomName = "";