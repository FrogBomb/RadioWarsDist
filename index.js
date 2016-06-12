//backend

;(function(){
	
	if(!this.System){
		var System = {getenv: function(){}};
	}
	"use strict";
	
	var PORT = process.env.PORT || 80;
	
	var BASE_HTML_FILE = __dirname + '/index.html';
	
	var fs = require('fs');
	
	var express = require('express');
	var bodyParser = require('body-parser');
//	var config = require('./config.js');
	var http = require('http');
	
	var session = require('express-session');
	
	
	var app = express();
	var server = http.Server(app);
	var io = require("socket.io")(server);
	
	var sessionSet = session({
		  secret: System.getenv("secret") || "thisIsNotDeployedCorrectly",
		  resave: false,
		  saveUninitialized: true,
		  cookie: { secure: true }
	});
	
	var sharedsession = require("express-socket.io-session");
	
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(sessionSet);
	
	io.use(sharedsession(sessionSet)); 

	
	//All availible rooms
	var ROOMS = [];
	
	var MAPS = {loaded: false};
	
	var DEFAULT_MAP_NAME = "alpha";
	
	//Loading the maps here, which then generates the default rooms.
	loadMaps();
	
	function loadMaps(){
		fs.readFile('./maps.json', function(err, data){
			if(err){return console.log(err);}
			MAPS = JSON.parse(data);
			MAPS.loaded = true;

			makeRooms();
		});
	}
	
	function makeRooms(){
		//Clears the existing rooms
		ROOMS.length = 0;
		//Generating default rooms
		ROOMS.push(new Room('noob room', MAPS['alpha']));
		ROOMS.push(new Room('kinda good room', MAPS['beta']));
		ROOMS.push(new Room('pro room', MAPS['delta']));
	}
	
	//Constructor for a new RadioState
//	function RadioGroupState(time, state){
//		//integer indicating the current value of each radio button group, and the time when it was last clicked.
//		if(!state){
//			state = 0;
//		}
//		if(!time){
//			time = 0;
//		}
//		this.state = state;
//		this.time = time;
//	}
//	RadioGroupState.prototype = Object.create({
//		update: function(time, newState){
//			if(this.time<time){
//				this.time = time;
//				this.state = newState;
//			}
//		}
//	});
//	
//	//Constructor for a new GameState (Reference for what the status of the game is). numRadios arguement is optional.
//	function GameState(numRadios){
//		//array of radioGroupStates, indicating the current value of each radio button group.
//		this.radios = [];
//		for(var i = 0; i<numRadios; i++){
//			this.radios.push(new RadioGroupState());
//		}
//	}

//	GameState.prototype = Object.create({
//		updateRadio: function(radio, i){
//			if(this.radios[i]){
//				this.radios[i].update(radio.time, radio.state);
//			}
//			else{
//				this.radios[i] = new RadioGroupState(radio.time, radio.state);
//			}
//		}
//	});
	
	function readMapFileCallback(err, data){
		if(err){return console.log(err);}
		this.mapData = JSON.parse(data);
		this.mapFileRead = true;
		this.radios = this.mapData
					.radioStartStates
					.map(function(v){return v});
	}
	
	//Constructor for a new room (Holds the game and manages players)
	function Room(name, mapInfoRef){
		this.name = name;//Name of the room
		this.mapInfoRef = mapInfoRef;//file reference to generate the game room.
		this.mapData; // Will hold the map data object from mapInfoRef
		this.mapFileRead = false;
		this.teamAssign = 0;
		fs.readFile(mapInfoRef, readMapFileCallback.bind(this))
		//Server side game state.
//		this.gameState = new GameState();
		this.numPlayers = 0;
		
		//state of radios (lighter weight than gamestate)
		this.radios = [];
		
//		//array of current mouse positions (pos), velocities (vel), and update timestamps (time).
//		this.mouses = [];
//		//array of previous mouse positions (pos), velocities (vel), and update timestamps (time).
//		this.prevMouses = [];
	}
	
	
	Room.prototype = Object.create({
//		updateMouse: function(newP, newV, time, index){
//			if(time>this.mouses[index].time){
//				this.prevMouses[index] = this.mouses[index];
//				this.mouses[index] = {pos: newP, vel: newV, time: time}; 
//			}
//		},
		/*
		Updates the room to have a new player and
		returns the roomIndex to be able to interact with the room.
		*/
		addPlayer: function(){
			
//			this.mouses.push({pos:[-200, -200], vel: [0, 0], time: -1});
//			this.prevMouses.push({pos:[-200, -200], vel: [0, 0], time: -1});
			this.numPlayers++;
			return this.numPlayers-1;
			
		},
		removePlayer: function(roomIndex){
			this.numPlayers--;
		},
		//Returns an assigned radio team
		getRadioTeam: function(){
			if(this.mapFileRead){
				return (this.teamAssign++)%this.mapData.numTeams;
			}
			return -1;//Map file not yet read
		}
//	
//		//Clears the room
//		,clear: function(){ Room(this.name, this.mapInfoRef) }
//		//Starts a game in the room
//		,start: function(){ console.log("Game started")}//TODO
	});
	
	//Gets the player room index of the request
	function getPIndexOf(req){
		return req.session.roomIndex;
	}
	//Gets the Room object associated with the request. 
	function getRoomOf(req){
		return ROOMS[req.session.roomNumber];
	}
	//Gets the single radio change data of the request to put directly into gameState.updateRadio
//	function getRadioDataOf(req){
//		return [{state: req.body.state, time: req.body.time}, getPIndexOf(req)];
//	}
//	//Gets the mouse data of the request to put directly into room.updateMouse
//	function getMouseDataOf(req){
//		return [req.body.pos, req.body.vel, req.body.time, getPIndexOf(req)];
//	}
//	
//	//GET ROOT: send the base html page. 
	app.get('/', function(req, res){
		res.sendFile(BASE_HTML_FILE);
	});
	app.get('/js/compiled.js', function(req, res){
		res.sendFile(__dirname + "/js/compiled.js");
	});
	app.get('/js/hbsTemplates.js', function(req, res){
		res.sendFile(__dirname + "/js/hbsTemplates.js");
	});
	app.get('/css/combined.css', function(req, res){
		res.sendFile(__dirname + "/css/combined.css");
	});
	
//	var UPDATESPEED =  10000; //ms
//	setInterval(function(){
//		io.emit('syncTime', Date.now());
//	},UPDATESPEED);
//	
	io.on('connection', function(socket){
		
		console.log("Socket Connected!");
		//Variables that will change later
		var room = null;
		var getUpdates = null;
		if(!socket.handshake.session.userdata){
			socket.handshake.session.userdata = {};
			socket.handshake.session.userdata.name = "Guest";
		}
		if(!socket.handshake.session.roomNumber){
			socket.handshake.session.roomNumber = null;
		}
		if(!socket.handshake.session.roomIndex){
			socket.handshake.session.roomIndex = null;
		}
		
		//login: Currently will only expect a name in userdata.
		socket.on("login", function(userdata) {
			socket.handshake.session.userdata = userdata;
		});
		//gameroom: join the room with the given room number
		socket.on('gameroom', function(roomNumber){
			
			room = ROOMS[roomNumber];
			var roomIndex = room.addPlayer();
			socket.handshake.session.roomIndex = roomIndex;
			var radioTeam = room.getRadioTeam();
			socket.handshake.session.radioTeam = radioTeam;
//			socket.emit('roomIndex', roomIndex);
				
			socket.handshake.session.roomNumber = roomNumber;
			
			socket
				.emit('joinedRoom',
					{
						roomIndex: roomIndex,
						roomName: room.name,
						team: radioTeam,
						mapData: ROOMS[roomNumber].mapData
						
					});
			
			socket.join(room.name);
			
			socket.on('roomLoaded', function(){
				for(var i = 0; i<room.radios.length; i++){
					if(room.radios[i] !== undefined){
						io.in(room.name).emit('radiosToRoom', {
							radioIndex: i, time: Date.now(), 
							state: room.radios[i]
						});
					}
				}
			});
			
			//Tell other players a new player has joined
			socket.broadcast
				.to(room.name)
				.emit('newPlayer', socket.handshake.session.userdata.name);
			
			//Give the joined player room information and assign them a team
			
//			Just using socket.broadcast on client side instead for now
			
//			//Send regular updates to the joining player according to their room name
//			getUpdates = setInterval(function(){
//				socket
//					.emit('updateFromRoom ' + room.name, 
//						{
//							mouseData: {cur: room.mouses, prev: room.prevMouses},
//							radios: room.gameState.radios
//						});
//			}, UPDATESPEED);
			
			//Handle for a user leaving a gameroom.
			socket.on('disconnect', function(){
				if(room){
					socket.leave(room.name);
					room.removePlayer(socket.handshake.session.roomIndex);
				}
				if(getUpdates !== null){
					clearInterval(getUpdates);
					getUpdates = null;
				}
				room = null;
				socket.handshake.session.roomNumber = null;
				socket.handshake.session.roomIndex = null;
			});
		});
		socket.on('radioBroadcast', function(radioData){
			radioData.time = Date.now();
			room.radios[radioData.radioIndex] = radioData.state;
			io.in(room.name).emit('radiosToRoom', radioData);
			var winner = room.radios[0];
			for(var i = 0; i<room.radios.length; i++){
				if(winner !== room.radios[i]){
					winner = null;
					break
				}
			}
			if(winner !== null){
				io.in(room.name).emit('win', {winningTeam:room.mapData.teamNames[winner]});
				room.radios = room.mapData.radioStartStates.map(function(v){return v});
			}
		});
		//Update the server about a mouse position, player index, and time of polling
//		socket.on('mouseUpdate', function(mouseData){
//			if(room){
//				var oldMouse = room.mouses[mouseData.index];
//				var tdiff = mouseData.time-oldMouse.time;
//				var newVel = [(mouseData.mouseCoords[0]-oldMouse.pos[0])/tdiff,
//							  (mouseData.mouseCoords[1]-oldMouse.pos[1])/tdiff];
//				room.updateMouse(mouseData.mouseCoords,
//								 newVel,
//								 mouseData.time,
//								 mouseData.index);
//			}
//		});
		
		//Update the server about the radio state and time of polling and index
//		socket.on('radioUpdate', function(radioData){
//			if(room){
//				room.gameState.updateRadio({state:radioData[0],
//										    time: radioData[1]}, radioData[2]);
//			}
//		});
		
		//Log Disconnects
		socket.on('disconnect', function(){
			var username = "Unknown User";
			if(socket.handshake.session.userdata.name){
				username = socket.handshake.session.userdata.name;
			}
			console.log(username + " has disconnected on " + (new Date(Date.now())).toLocaleString());
		}); 
		
	});
	
//	//GET /gameroom: send JSON file for the gameroom.
//	app.get('/gameroom', function(req, res){
//		res.sendfile(getRoomOf(req).mapInfoRef);
//	});
	
//	//POST /gameroom: assign the room number of the player to the requested room number.
//	app.post('/gameroom', function(req, res){
//		req.session.roomNumber = req.body.roomNumber;
//		var room = getRoomOf(req);
//		req.session.roomIndex = room.addPlayer();
//		res.send(JSON.stringify({radioTeam: room.getRadioTeam(res.session.roomIndex)}));
//	});
//	
//	//POST /mouses: sends info about the current player's mouse.
//	app.post('/mouses', function(req, res){
//		var room = getRoomOf(req);
//		var mData = getMouseDataOf(req);
//		room.updateMouse.apply(mData);			
//	});
//	
//	//GET /mouses: gets the mouse info of all players in the room.
//	app.get('/mouses', function(req, res){
//		var room = getRoomOf(req);
//		res.send(JSON.stringify({cur: room.mouses, prev: room.prevMouses}));
//	});
//	
//	//POST /radiostatus: sends info about a radio button change
//	app.post('/radiostatus', function(req, res){
//		var room = getRoomOf(req);
//		var rData = getRadioStatusDataOf(req);
//		room.gameState.updateRadio.apply(rData);
//	});
//	
//	//GET /radiostatus: gets the status of all radio buttons. 
//	app.get('/radiostatus', function(req, res){
//		var room = getRoomOf(req);
//		res.send(JSON.stringify(room.gameState.radios));
//	});
//	
	
	
	app.use(express.static('public'));
	
	app.use(function(req, res, next) {
  		res.status(404).send('Sorry cant find that!');
	});
	
	app.use(function(err, req, res, next) {
  		console.error(err.stack);
  		res.status(500).send('Something broke!');
	});
	
	server.listen(PORT, function() {
		console.log("server started on port " + PORT);
	});
})();