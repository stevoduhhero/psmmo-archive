confirmies = new Object();
answerConfirmy = function(t, response) {
	var ray = confirmies[t];
	var callback = ray[0],
		args = Array.prototype.slice.call(ray[1]);
	args.push(response);
	if (typeof callback == "string") vars[callback].apply(this, args); else {
		callback.apply(this, args);
	}
	delete confirmies[t];
	closeAlerty(t);
};
confirmy = function(msg, callback, args) {return alerty(msg, [callback, args], "confirm");};
prompty = function(msg, callback, args) {var id = alerty(msg, [callback, args], "prompt");$("#baby" + id + " input").focus();return id;};
closeAlerty = function(t) {$('#baby' + t + ', #daddy' + t).remove();};
alerty = function(msg, info, type) {
	var t = new Date() / 1,
		closeByClick = '',
		addInputs = '';
	if (type) {
		if (type == "confirm") {
			addInputs = '<br /><button onclick="answerConfirmy(' + t + ', true);">YES</button><button onclick="answerConfirmy(' + t + ', false);">NO</button>';
		}
		if (type == "prompt") {
			addInputs = '<br /><input type="text" onkeypress="if (event.keyCode == 13) {answerConfirmy(' + t + ', this.value);}" />';
		}
	}
	closeByClick = ((!info) ? ' onclick="closeAlerty(' + t + ');"' : '');
	$('body').prepend('\
	<div id="daddy' + t + '"' + closeByClick + ' style="' + (closeByClick ? 'cursor: pointer;' : '') + 'position: absolute;top: 0;left: 0;width: 100%;height: 100%;background: white;opacity: 0.5;z-index: 9999;"></div>\
	<div id="baby' + t + '" style="width: 500px;height: 150px;margin-left: -250px;margin-top: -75px;position: absolute;top: 50%;left: 50%;background: white;outline: 2px solid rgb(175, 175, 171);z-index: 9999;">\
	<div style="padding: 10px;font-size: 20px;text-align: center;">' + msg + ((info) ? addInputs : '') + '</div>\
	</div>\
	');
	if (info) confirmies[t] = info;
	return t;
};

vars.init = function() {
	vars.openSaveData();
	vars.loadMap(vars.mapName);
	vars.resize();
	
		var sock = new SockJS('http://45.56.82.40:8000/showdown/');
		sock.onopen = function() {console.log('open');};
		sock.onmessage = function(event) {
			//console.log = function() {};
			console.log('receive', JSON.stringify(event.data));
			vars.receive(event.data);
		};
		sock.onclose = function() {console.log('close');};
	
	vars.socket = sock;
	
	if (!vars.team.length) vars.chooseStarterPrompt();
	
	$(window).focus(function() {
		vars.windowFocus = true;
	}).blur(function() {
		vars.windowFocus = false;
	});
	$(document).keydown(function(e) {
		vars.key(e.keyCode);
	}).keyup(function(e) {
		vars.key(e.keyCode, true);
	}).on("focus", "input, textarea", function() {
		vars.focusedInput = this;
	}).on("blur", "input, textarea", function() {
		vars.focusedInput = false;
	}).on("click", "#teamOrder div", function() {
		if (this.id == $("#teamOrder .selected").attr("id")) {
			$(this).removeClass("selected");
		} else {
			if (!$("#teamOrder .selected").length) $(this).addClass("selected"); else {
				var first = Math.floor($(".selected").attr('id')),
					second = Math.floor(this.id);
				var firstMonCached = jQuery.extend(true, {}, vars.team[first]);
				vars.team[first] = vars.team[second];
				vars.team[second] = firstMonCached;
				vars.updateTeamOrder();
			}
		}
	}).on("dblclick", "#teamOrder div", function() {
		var msg = "Would you like to send your " + (vars.team[this.id].species) + " to your box.";
		confirmy(msg, function(id, doit) {
			if (!doit) return;
			if (vars.team.length == 1) return alerty("You can't move any more pokemon into your box because you can't have 0 pokemon in your party.");
			var poke = vars.team[id];
			vars.team.splice(id, 1);
			vars.box.push(poke);
			vars.updateTeamOrder();
		}, [this.id]);
	}).on("click", "#box div", function() {
		var msg = "",
			species = (vars.box[this.id].species);
		msg = "Input the NUMBER next to the following action you'd like to do.<br />" +
				"<div style=\"font-size: 13px;text-align: left;\">" +
				"0 - Move " + species + " to your team.<br />" +
				"1 - Release the " + species + "." +
				"</div>" +
				"Any other input will cancel.";
		prompty(msg, function(id, val) {
			var options = {0: "move", 1: "release"};
			if (!val || !options[val]) return;
			var option = options[val];
			if (option == "move") {
				if (vars.team.length >= 6) return alerty("You already have 6 pokemon in your team. Move some into your box by double clicking a pokemon and try again.");
				var poke = vars.box[id];
				vars.box.splice(id, 1);
				vars.team.push(poke);
				vars.updateTeamOrder();
				vars.openBox();
			} else if (option == "release") {
				vars.box.splice(id, 1);
				vars.openBox();
			}
		}, [this.id]);
	}).on("click", ".nametag", function() {
		if (vars.countBattles()) return alerty("Already in a battle.");
		var userid = toId(this.innerHTML);
		if (!vars.players[userid] || userid == toId(vars.username)) return;
		var chall = confirmy("Are you sure you would like to challenge '" + userid + "' to a battle?", "sendChallenge", [userid]);
	}).on("touchstart mousedown", "#joystick", function(e) {
		var t = e.originalEvent.touches;
		if (!t) t = e; else t = t[0];
		vars.touchingJoystick = t;
		if (vars.touchingJoystick) {
			e.preventDefault();
			return false;
		}
	}).on("touchmove mousemove", function(e) {
		var t = e.originalEvent.touches;
		if (!t) t = e; else t = t[0];
		if (vars.touchingJoystick) {
			var diff = {
				x: -(vars.touchingJoystick.pageX - t.pageX),
				y: -(vars.touchingJoystick.pageY - t.pageY)
			};
			if (diff.x > 20) diff.x = 20;
			if (diff.x < -20) diff.x = -20;
			if (diff.y > 20) diff.y = 20;
			if (diff.y < -20) diff.y = -20;
			var centr = $('#centro');
			centr.css({
				left: ($("#joystick").width() / 2 + diff.x) + 'px',
				top: ($("#joystick").height() / 2 + diff.y) + 'px'
			});
			var directionKeys = {up: 38, left: 37, right: 39, down: 40};
			var orientation = "";
			if (Math.abs(diff.x) > Math.abs(diff.y)) {
				orientation = "right";
				if (diff.x < 0) orientation = "left"; 
			} else {
				orientation = "down";
				if (diff.y < 0) orientation = "up";
			}
			if (orientation && vars.username && (Math.abs(diff.x) >= 2 || Math.abs(diff.y >= 2))) {
				var player = vars.players[toId(vars.username)];
				if (player.dir != orientation || !player.walking) {
					vars.key(directionKeys[player.dir], true);
					vars.key(directionKeys[orientation]);
					player.dir = orientation;
				}
				vars.touchingJoystick = t;
			}
			lastjoystick = diff;
		}
		if (Tools.dragPM) {
			var el = $("#" + Tools.dragPM);
			var coordinateY = t.pageY;
			el.css({
				left: (t.pageX - el.width() / 2) + "px",
				top: coordinateY + "px",
				margin: 0
			});
			var headerCoordinateY = el.offset().top;
			if ($("#" + Tools.dragPM + " .pmheader").length) headerCoordinateY = $("#" + Tools.dragPM + " .pmheader").offset().top;
			if (headerCoordinateY < 0) el.css("top", (Math.abs(headerCoordinateY) + t.pageY) + "px");
		}
		if (vars.touchingJoystick || Tools.dragPM) {
			e.preventDefault();
			return false;
		}
	}).on("touchend mouseup", function(e) {
		if (vars.touchingJoystick) {
			vars.touchingJoystick = false;
			$("#centro").animate({
				left: "50%",
				top: "50%"
			}, 50);
			var directionKeys = {up: 38, left: 37, right: 39, down: 40};
			if (vars.username) vars.key(directionKeys[vars.players[toId(vars.username)].direction], true);
		}
		Tools.dragPM = false;
	}).on("keypress", ".pminput", function(e) {
		if (e.keyCode == 13 && this.value) {
			var msg = this.value;
			var to = this.id.split("-")[0].replace("pminput", "");
			vars.send('/msg ' + to + ',' + msg);
			Tools.addPM(vars.username, msg, to);
			this.value = "";
		}
	});
};
vars.sendChallenge = function(userid, doit) {
	if (!doit) return;
	vars.send('/utm ' + Tools.packTeam(vars.team));
	vars.send('/challenge ' + userid + ", psmmo");
};
vars.chooseStarterPrompt = function() {
	var insides = '',
		starters = ["bulbasaur", "charmander", "squirtle", "chikorita", "cyndaquil", "totodile", "treecko", "torchic", "mudkip", "turtwig", "chimchar", "piplup", "snivy", "tepig", "oshawott", "chespin", "fennekin", "froakie"];
	insides += '<div id="chooseStarter" style="background: rgba(255, 255, 255, 0.7);z-index: 99;overflow-y: auto;position: absolute;top: 0;left: 0;width: 100%;height: 100%;">';
	insides += '<center><h2>Select a starter pokemon:</h2></center>';
	var open = false;
	for (var i in starters) {
		var mon = BattlePokedex[starters[i]];
		if (!open) {
			insides += '<div style="width: 150px;height: 50px;margin: auto;">';
			open = true;
		}
		insides += '<div style="float: left;width: 50px;height: 50px;overflow: hidden;">';
		insides += '<img style="cursor: pointer;margin-top: -20px;margin-left: -20px;"';
		insides += ' onclick="vars.chooseStarter(\'' + starters[i] + '\');vars.items.pokeball = 5;"';
		insides += ' src="http://play.pokemonshowdown.com/sprites/bw/' + mon.species.toLowerCase() + '.png"';
		insides += ' />';
		insides += '</div>';
		if ((i + 1) / 3 == Math.floor((i + 1) / 3)) {
			insides += '</div>';
			open = false;
		}
	}
	insides += '</div>';
	$('body').append(insides);
};
vars.chooseStarter = function(monId) {
	$("#chooseStarter").remove();
	var pokemonKeys = Object.keys(BattlePokedex);
	var randomMon = Math.floor(Math.random() * pokemonKeys.length);
	var pokemon = BattlePokedex[pokemonKeys[randomMon]];
	if (monId) pokemon = BattlePokedex[monId];
	var starterLevel = 5,
		ability = Math.floor(Math.random() * Object.keys(pokemon.abilities).length),
		moves = new Array(),
		hasMove = new Object(),
		hasAttackingMove = false,
		learnset = BattleLearnsets[toId(pokemon.species)].learnset;
	for (var i in learnset) {
		var move = BattleMovedex[i];
		var whenLearned = learnset[i];
		var canLearnNow = false;
		if (whenLearned.length) {
			for (var x in whenLearned) {
				var learnByLevel = whenLearned[x].split('L');
				if (learnByLevel.length - 1 > 0) {
					var levelLearned = Math.abs(learnByLevel[1]);
					if (!isNaN(levelLearned) && (levelLearned <= starterLevel)) {
						//if levelLearned is a number && if we meet the level requirements to learn said move
						canLearnNow = true;
					}
					if (whenLearned[x].slice(-1) == "a") {
						//learns as soon as its born (start move)
						canLearnNow = true;
					}
				}
			}
		}
		if (!hasMove[move] && canLearnNow) {
			if (moves.length == 3 && move.category == "Status" && !hasAttackingMove) {} else {
				moves.push(move.name);
				hasMove[move.name] = true;
				if (move.category != "Status") hasAttackingMove = true;
			}
		}
	}
	var shinyRate = 1 / 1000;
	var natureKeys = Object.keys(BattleNatures);
	var team = [{
		species: pokemon.species,
		nature: natureKeys[Math.floor(Math.random() * natureKeys.length)],
		ability: pokemon.abilities[Object.keys(pokemon.abilities)[ability]],
		level: starterLevel,
		moves: moves,
		shiny: ((chance(shinyRate * 100)) ? true : false),
		exp: 0,
		nextLevelExp: 50,
	}];
	vars.team = team;
	vars.updateTeamOrder();
};
vars.resize = function() {
	$("#map").width(vars.block.x * vars.block.width).height(vars.block.y * vars.block.height);
	var canvas = $("#map"),
			body = $("body");
	var spaceAvailable = body.height() - canvas.height();
	var percentZoom = spaceAvailable / canvas.height() * 100;
	canvas.css({
		"zoom": 100 + percentZoom + "%",
		//make it work on firefox
		"-moz-transform": "scale(" + ((100 + percentZoom) / 100) + " )",
		"-moz-transform-origin": "0 0",
	});
	
	var leftOvers = (body.width() - (canvas.width() * ((100 + percentZoom) / 100)));
	$("#rightPanel").width(leftOvers);
};
vars.key = function(key, keyup) {
	if (!vars.username) return;
	var keys = {37: "left", 38: "up", 39: "right", 40: "down"};
	var dir = keys[key] || key,
		user = vars.players[toId(vars.username)];
	if (!keys[key]) {
		//not an arrow key
		var el = $("#invisitype");
		if ($(vars.focusedInput).length) el = $(vars.focusedInput);
		el.focus();
		if (el.attr('id') == "invisitype" && key == 13 && el.val()) {
			vars.send('/mmo  msg.' + el.val());
			el.val("");
		}
		return false;
	}
	if (vars.encounteredMon || vars.countBattles()) return;
	var condition = (dir != user.direction && !vars.heldKeys[key]);
	if (keyup && user.direction == dir) {
		vars.stopWalking();
	} else if (!keyup && (!user.walking || condition)) {
		if (condition) {
			//stop, update the other people to let them know where u are
			//THEN show that your walking in a new direction
			vars.stopWalking();
		}
		user.walking = true;
		user.direction = dir;
		vars.initWalkLoop();
		vars.send('/mmo start.' + dir);
	}
	if (keyup) delete vars.heldKeys[key]; else vars.heldKeys[key] = true;
};
vars.countBattles = function() {
	var num = 0;
	for (var i in vars.rooms) if (vars.rooms[i].battle) num++;
	return num;
};
vars.stopWalking = function() {
	var user = vars.players[toId(vars.username)];
	user.walking = false;
	if (vars.lastStop) if (vars.lastStop.x == user.x && vars.lastStop.y == user.y) return;
	vars.send('/mmo stop.' + user.x + '.' + user.y);
	vars.lastStop = {x: user.x, y: user.y};
};
vars.initWalkLoop = function() {
	if (vars.walking) return;
	vars.walkLoop();
	vars.walking = true;
};
vars.walkLoop = function() {
	function endLoop() {
		if (walkers) walLoopTimeout = setTimeout("vars.walkLoop();", vars.fps); else {
			delete vars.walking;
		}
	}
	if (vars.focusing) return endLoop();
	var walkers = false,
		userid = toId(vars.username);
	for (var i in vars.players) {
		var user = vars.players[i];
		if (user.walking) {
			var sprite = $('#p' + user.userid),
				dir = user.direction;
			user.cycle++;
			if (user.cycle == 3) user.cycle = 0;
			var css = '';
			css += 'url(' + vars.spritesURL + ') ';
			css += (vars.character[user.cycleType][dir][user.cycle].x * -1) + 'px ';
			css += (vars.character[user.cycleType][dir][user.cycle].y * -1) + 'px';
			sprite.find('.p').css('background', css);
			
			walkers = true;
			var revert = {x: user.x, y: user.y};
			user.stepFrameCount++;
			if (user.stepFrameCount >= user.framesPerStep) {
				if (dir == "up") user.y--;
				if (dir == "down") user.y++;
				if (dir == "left") user.x--;
				if (dir == "right") user.x++;
				user.stepFrameCount = 0;
			}
			var block = vars.map[user.y];
			if (block) block = block[user.x];
			if (block === undefined) block = 0; //block doesnt exist, blackness
			if ((block == 1 || user.x < 0 || user.y < 0) || vars.encounteredMon || vars.countBattles()) {
				user.x = revert.x;
				user.y = revert.y;
			}
			if (userid == user.userid && block == 2) {
				var door = vars.doors[user.y + "," + user.x];
				if (door) vars.loadMap(door);
			}
			var moved = false;
			if (!(revert.x == user.x && revert.y == user.y)) moved = true;
			if (moved) {
				if (!vars.encounteredMon && block == 3 && userid == user.userid) vars.encounterMon();
				if (user.userid == userid) vars.focusCamera(); else {
					var funk = vars.animate(),
						inRange = true,
						range = {min: {}, max: {}},
						you = vars.players[userid],
						showBlocks = {
							x: $("#map").width() / vars.block.width,
							y: $("#map").height() / vars.block.height
						};
					range.min.x = you.x - ((showBlocks.x / 2));
					range.min.y = you.y - ((showBlocks.y / 2));
					range.max.x = range.min.x + vars.block.x;
					range.max.y = range.min.y + vars.block.y;
					
					if ((user.x >= range.min.x && user.x <= range.max.x) && (user.y >= range.min.y && user.y <= range.max.y)) {
						inRange = true;
					} else inRange = false;
					if (inRange && funk == "animate") {
						funk = "animate";
					} else funk = "css";
					sprite[funk]({
						left: (vars.block.width * user.x) + 'px',
						top: (vars.block.height * user.y) + 'px'
					}, vars.fps);
				}			
			}
		}
	}
	endLoop();
};
vars.updatePlayer = function(player) {
	var name = player[2],
		x = Math.floor(player[0]),
		y = Math.floor(player[1]);
	if (x == -1 && y == -1) return; //this means its supposed to be at the starting position
	var uid = toId(name);
	var user = vars.players[uid];
	user.x = x;
	user.y = y;
	$("#p" + uid)[vars.animate()]({
		left: (vars.block.width * user.x) + 'px',
		top: (vars.block.height * user.y) + 'px'
	}, vars.fps);
};
vars.newPlayer = function(name) {
	function playerVars() {
		return {
				direction: "",
				cycle: 0,
				cycleType: "walk",
				encountered: "",
				x: vars.startingPosition.x,
				y: vars.startingPosition.y,
				framesPerStep: 1,
				stepFrameCount: 0,
			};	
	}
	var userid = toId(name);
	var user = playerVars();
	user.name = name;
	user.userid = userid;
	if (userid == toId(vars.username) && vars.newStartingPosition) {
		user.x = vars.newStartingPosition.x;
		user.y = vars.newStartingPosition.y;
		delete vars.newStartingPosition;
	}
	this.players[userid] = user;
	
	var insides = '';
	insides += '<div id="p' + userid + '" class="player" style="';
	insides += 'width: ' + vars.block.width + 'px;';
	insides += 'height: ' + vars.block.height + 'px;';
	insides += 'margin-left: 2px;';
	insides += '">';
	insides += '<div class="p" style="';
	insides += 'background: url(' + vars.spritesURL + ') ' + (vars.character.x * -1) + 'px ' + (vars.character.y * -1) + 'px;';
	insides += 'width: ' + vars.character.width + 'px;';
	insides += 'height: ' + vars.character.height + 'px;';
	insides += '">';
	insides += '</div>';
	insides += '<span class="nametag msgs"></span>';
	insides += '<span class="nametag">' + userid + '</span>';
	insides += '</div>';
	$('#p' + userid).remove();
	if (userid == toId(vars.username)) {
		$("#container").append(insides);
		$('#p' + userid).css({
			left: ((Math.floor($("#map").width() / vars.block.width) * vars.block.width) / 2) + "px",
			top: ((Math.floor($("#map").height() / vars.block.height) * vars.block.height) / 2) + "px",
		});
		vars.focusCamera();
	} else {
		$('#players').append(insides);
		$("#p" + userid).css({
			left: (vars.block.width * user.x) + "px",
			top: (vars.block.height * user.y) + "px"
		});
	}
};
vars.focusCamera = function() {
	if (vars.focusing) return;
	var tar = vars.players[toId(vars.username)] || vars.startingPosition,
		left = 0,
		top = 0;
	var showBlocks = {
		x: $("#map").width() / vars.block.width,
		y: $("#map").height() / vars.block.height
	};
	left = (tar.x * vars.block.width) - ((showBlocks.x / 2) * vars.block.width);
	top = (tar.y * vars.block.height) - ((showBlocks.y / 2) * vars.block.height);
	if ($.browser.mozilla) {
		$("#container .mapimg").css({
			'background-position': (-left) + "px " + (-top) + "px",
		});
		$("#players").css({
			left: -left + "px",
			top: -top + "px"
		});
		vars.focusing = false;
	} else {
		$("#container .mapimg").animate({
			'background-position-x': (-left) + "px",
			'background-position-y': (-top) + "px",
		}, vars.fps / 3, 'linear', function() {
			vars.focusing = false;
		});
		$("#players").animate({
			left: -left + "px",
			top: -top + "px"
		}, vars.fps / 3);
	}
};
vars.getScript = function(url, callback, cache) {
	$.ajax({
		type: "GET",
		url: url,
		success: callback,
		cache: cache
	});
};
vars.loadMap = function(name) {
	var splint = name.split('|'),
		newStartingPosition = false;
	if (splint[1]) {
		name = splint[0];
		newStartingPosition = splint[1].split(',');
		newStartingPosition = {
			x: Math.floor(newStartingPosition[1]),
			y: Math.floor(newStartingPosition[0])
		};
	}
	
	vars.getScript("./maps/" + name, function(data) {
		var data = data.split('\n');
		var name = data[0].split(':')[1],
			minMonLevel = Math.floor(data[1].split(':')[1]),
			mons = JSON.parse(data[2].split(':')[1]),
			startingPosition = data[3].split(':')[1].split(',');
		var doorsJSON = data[4].split(':');
		doorsJSON.splice(0, 1);
		var doors = JSON.parse(doorsJSON.join(':'));
		vars.mapName = name;
		vars.minMonLevel = minMonLevel;
		vars.encounterMons = mons;
		vars.doors = doors;
		data.splice(0, 5);
		
		if (vars.username && vars.username.substr(0, 6) != "Guest ") vars.send('/start ' + name);
		
		vars.startingPosition = {
			x: Math.floor(startingPosition[1]),
			y: Math.floor(startingPosition[0])
		};
		
		var img = new Image();
		img.src = './maps/' + toId(name) + '.png';
		img.onload = function() {
			$("#players").width($(img).width()).height($(img).height());
		};
		$('.mapimg').remove();
		var div = $('<div class="mapimg" />');
		div.width($("#map").width()).height($("#map").height()).css({
			'background': 'url("./maps/' + toId(name) + '.png") 0px 0px'
		}).appendTo('#container');
		vars.map = new Array();
		for (var y in data) {
			var ray = data[y];
			for (var x in ray) {
				if (!vars.map[y]) vars.map[y] = new Array();
				vars.map[y].push(Math.floor(ray[x]));
			}
		}
		//clear players
		var userid = toId(vars.username);
		var user = vars.players[userid];
		for (var i in vars.players) {
			var uid = vars.players[i].userid;
			if (uid != userid) $("#p" + uid).remove();
		}
		if (user) {
			user.x = vars.startingPosition.x;
			user.y = vars.startingPosition.y;
			if (newStartingPosition) {
				user.x = newStartingPosition.x;
				user.y = newStartingPosition.y;
				vars.newStartingPosition = newStartingPosition;
			}
		}
		vars.focusCamera();
	});
};
vars.addMessage = function(userid, message) {
	var el = $('#p' + userid + ' .msgs');
	var t = new Date() / 1;
	el.prepend('<div id="' + userid + t + '">' + Tools.escapeHTML(message) + '</div>').show();
	setTimeout('jQuery("#' + userid + t + '").fadeOut(function() {jQuery("#' + userid + t + '").remove();});', 5000);
};
vars.encounterMon = function() {
	var user = vars.players[toId(vars.username)];
	for (var i in vars.encounterMons) {
		var mon = vars.encounterMons[i];
		var monId = mon.slice(0, -1),
			rank = mon.substr(-1);
		var probability = vars.rates.encounterRate[rank] / 187.5;
		probability = probability * 100;
		if (chance(probability)) {
			vars.encounteredMon = monId;
			vars.stopWalking();
			vars.send('/utm ' + Tools.packTeam(vars.team));
			vars.send('/mmo encounter.' + monId + "." + vars.minMonLevel + "." + user.x + "." + user.y);
			break;
		}
	}
};
vars.updateExp = function(el, slot, funk, t) {
	if (slot == -1) return;
	if (!vars.team[slot] || vars.team[slot].exp === undefined) return false;
	var width = vars.team[slot].exp / vars.team[slot].nextLevelExp * vars.totalExpWidth;
	$(el)[funk]({"width": width + "px"}, t);
};
vars.checkEvolve = function(monKey) {
	var mon = vars.team[monKey];
	var pokemon = BattlePokedex[toId(mon.species)];
	if (pokemon.evos && pokemon.evos.length) {
		for (var i in pokemon.evos) {
			var evolution = BattlePokedex[pokemon.evos[i]];
			if (mon.level >= evolution.evoLevel) {
				//cue evolving animation (growing shrinking shit thing)
				var evolveOrNaw = confirmy("Your " + mon.species + " would like to evolve into a " + evolution.species + ".", "actuallyEvolve", [monKey, evolution]);
			}
		}
	}
};
vars.actuallyEvolve = function(monKey, evolution, doit) {
	if (!doit) return;
	var mon = vars.team[monKey];
	if (vars.team[monKey].species == vars.team[monKey].nickname) vars.team[monKey].nickname = evolution.species;
	var ability = mon.ability,
		keepAbility = false;
	for (var i in evolution.abilities) if (evolution.abilities[i] == ability) keepAbility = true;
	if (!keepAbility) {
		//random ability
		var abilities = Object.keys(evolution.abilities);
		var randomNum = Math.floor(Math.random() * abilities.length);
		ability = evolution.abilities[abilities[randomNum]];
	}
	vars.team[monKey].species = evolution.species;
	vars.team[monKey].ability = ability;
};
vars.learnMove = function(move, monKey, replaceMove) {
	var mon = vars.team[monKey];
	if (replaceMove === undefined) {
		mon.moves.push(move);
	} else {
		var replacementKey = 0;
		for (var i in mon.moves) if (i == replaceMove) replacementKey = i;
		mon.moves[replacementKey] = move;
	}
};
vars.checkLearnMove = function(monKey) {
	var mon = vars.team[monKey];
	var learnset = BattleLearnsets[toId(mon.species)].learnset,
		moves = new Object();
	for (var i in mon.moves) moves[mon.moves[i]] = true;
	for (var i in learnset) {
		var move = BattleMovedex[i];
		var whenLearned = learnset[i],
			haveMove = moves[toId(move.name)];
		if (whenLearned.length && !haveMove) {
			for (var x in whenLearned) {
				var learnByLevel = whenLearned[x].split('L');
				if (learnByLevel.length - 1 > 0) {
					var levelLearned = Math.abs(learnByLevel[1]);
					if (!isNaN(levelLearned) && (levelLearned == mon.level)) {
						//if levelLearned is a number && if we meet the level requirements to learn said move
						var amountMovesHave = mon.moves.length;
						if (amountMovesHave >= 4) {
							//different kind of prompt that asks what kind of move to replace
							function promptyLoop(errMsg) {
								var msg = (errMsg || "") + "Your " + mon.species + " wants to learn a new move! (" + move.name + ") but you already have 4 moves. Would you like to replace a move?\n\n";
								for (var i in mon.moves) msg += "(" + (Math.abs(i) + 1) + ") " + mon.moves[i] + "\n";
								msg += "\nEnter the move you want to replace or hit cancel.";
								var learnOrNaw = prompt(msg);
								if (typeof learnOrNaw == "string") {
									var moveId = Math.abs(learnOrNaw) - 1;
									if (isNaN(moveId) || moveId < 0 || moveId > 3) {
										promptyLoop("ERROR: '" + learnOrNaw + "' IS NOT AN OPTION.\n");
									} else {
										vars.learnMove(move.name, monKey, moveId);
									}
								}
							}
							promptyLoop();
						} else {
							vars.learnMove(move.name, monKey);
							alerty("Your " + mon.species + " learned " + move.name + "!");
						}
					}
				}
			}
		}
	}
};
vars.gainExp = function(el, slot, oppLevel) {
	if (slot == -1) return;
	function gainIt() {
		var mon = vars.team[monKey];
		if (mon.level < 100) mon.exp += gain;
		alerty("Your " + mon.species + " gained " + gain + " exp.");
		if (mon.exp >= mon.nextLevelExp) {
			$(el).css({
				width: '0%'
			});
		}
		while (mon.exp >= mon.nextLevelExp) {
			var oldSpecies = mon.species;
			mon.exp = mon.exp - mon.nextLevelExp;
			mon.nextLevelExp += 100;
			mon.level++;
			if (mon.level > 100) {
				mon.level = 100;
				mon.exp = 0;
				delete mon.nextLevelExp;
			}
			alerty("Your " + mon.species + " just leveled up to level " + mon.level + ".");
			vars.checkLearnMove(monKey);
			vars.checkEvolve(monKey);
			if (oldSpecies != vars.team[monKey].species) vars.checkLearnMove(monKey);
		}
		$(el).animate({
			width: '0%'
		}, 500);
	}
	var numMons = Object.keys(vars.expDivision).length,
		gainPerLevelDifference = 25;
	var gain = gainPerLevelDifference * oppLevel;
	gain = gain / numMons;
	for (var monKey in vars.expDivision) gainIt();
	vars.expDivison = new Object();
	vars.encounteredMon = false;
	
	vars.updateTeamOrder();
};
vars.differentMonInfo = function(who, slot, el) {
	if (slot == -1) return;
	if (who == "you") {
		vars.expDivision[slot] = true;
		vars.updateExp(el, slot, "css");
	} else {
		vars.expDivision = new Object();
		vars.expDivision[slot] = true;
	}
};
vars.saveGame = function() {
	if (vars.team.length) localStorage.setItem("team", JSON.stringify(vars.team));
	if (vars.box.length) localStorage.setItem("box", JSON.stringify(vars.box));
	var itemsString = "";
	for (var itemId in vars.items) itemsString += itemId + "*" + vars.items[itemId] + "|";
	itemsString = itemsString.slice(0, -1);
	localStorage.setItem("items", itemsString);
	localStorage.setItem("mapName", vars.mapName);
	$("body").append('<div id="saving" style="position: absolute;z-index: 1000;text-align: center;background: white;opacity: 0.5;top: 0;left: 0;width: 100%;height: 100%;font-size: 25px;font-weight: bold;">Saving...</div>');
	setTimeout("jQuery('#saving').remove();", 1500);
};
vars.openSaveData = function() {
	function get(variableName, item, parse) {
		if (!item) item = variableName;
		if (localStorage.getItem(item)) {
			var val = localStorage.getItem(item);
			if (parse) val = JSON.parse(val);
			vars[variableName] = val;
		}
	}
	get("team", "team", true);
	get("box", "box", true);
	get("mapName");
	if (localStorage.getItem("items")) {
		var items = localStorage.getItem("items").split("|");
		for (var i in items) {
			var splint = items[i].split('*');
			var itemId = splint[0],
				itemSupply = Math.abs(splint[1]);
			vars.items[itemId] = itemSupply;
		}
	}
	vars.updateTeamOrder();
};
vars.openBag = function() {
	$("#bag").show();
	var insides = '',
		counter = 0;
	for (var itemId in vars.items) {
		var item = BattleItems[itemId];
		if (counter == 0) vars.changeBagInfo(itemId);
		insides += '<div class="itemInBag" onclick="vars.useItem(\'' + itemId + '\');" onmouseover="vars.changeBagInfo(\'' + itemId + '\');"><span class="itemNameLabel">' + item.name + '</span><span class="itemCountLabel">x' + vars.items[itemId] + '</span></div>';
		counter++;
	}
	$("#bagItems").html(insides);
};
vars.changeBagInfo = function(itemId) {
	var item = BattleItems[itemId];
	$("#itemDesc").html(item.desc);
	$("#itemIcon").html("<span style=\"display: inline-block;" + Tools.getItemIcon(itemId) + ";width: 24px;height: 24px;margin-top: 12.5px;\"></span>");
};
vars.useItem = function(itemId) {
	var item = BattleItems[itemId];
	confirmy("Use a " + item.name + "?", "actuallyUseItem", arguments);
};
vars.actuallyUseItem = function(itemId, doit) {
	if (!doit) return;
	var item = BattleItems[itemId];
	var items = {
		pokeball: function(ball) {
			var monId = vars.encounteredMon;
			if (!monId) return "You can't use your pokeball because you aren't playing against any wild pokemon.";
			var pokemon = BattlePokedex[monId];
			//cue the throw pokeball animation
			if (!ball) ball = "pokeball";
			var balls = {
				pokeball: 1,
				greatball: 1.5,
				ultraball: 2,
				masterball: true,
				//there are more that are a bit harder to implement lol
			};
			var statusModifiers = {
				"frz": 2, //freeze
				"slp": 2, //sleep
				"par": 1.5, //paralyzed
				"brn": 1.5, //burned
				"psn": 1.5, //poisoned
				"tox": 1.5, //poisoned
				"none": 1
			}; //idk if i spelled these right cuz PS spells these weirdish
			var catchRates = {
				"caterpie": 255,//.....
			};
			var ballModifier = balls[ball],
				statusModifier = 1, //no status bcos we're not checking statusModifiers[currentStatus]
				catchRate = 255, //do catchRates[pokemonId]
				currentHP = 404, //check
				maxHP = 404; //check
			
			//calculate
			var catchValue = (((3 * maxHP) - (2 * currentHP) * catchRate * ballModifier) / (3 * maxHP)) * statusModifier;
			var captured = 1048560 / Math.sqrt(Math.sqrt(16711680 / Math.abs(catchValue)));
			var shakes = 0,
				shakesStayInside = 0;
			function shake() {
				//maybe do pokeball wobble animations here
				var ran = Math.floor(Math.random() * 65535);
				if (ran < captured) shakesStayInside++;
				shakes++;
				if (shakes < 4) shake();
			}
			shake();

			if (shakesStayInside == 4) {
				//catch
				vars.send('/mmo catchPokemon.' + monId);
			} else {
				//break out of ball
				alerty(pokemon.species + " broke free!");
			}
		},
	};
	if (!items[itemId]) alerty("That items functionality hasn't been implemented yet... sorry"); else {
		var error = items[itemId]();
		if (error) return alerty(error);
		vars.items[itemId] -= 1;
		if (vars.items[itemId] <= 0) delete vars.items[itemId];
		$("#bag").hide();
	}
};
vars.slotFromPackage = function(poke) {
	var deleteMoves;
	poke.item = "";
	poke.nature = "";
	poke.gender = "";
	poke.species = poke.baseSpecies;
	if (!poke.moves[0]) {
		deleteMoves = true;
		poke.moves = new Array();
	}
	var packaged = Tools.packTeam([poke]);
	var teamClone = jQuery.extend(true, {}, vars.team);
	for (var slot in teamClone) {
		var mon = teamClone[slot];
		mon.species = BattlePokedex[toId(mon.species)].baseSpecies;
		mon.nature = "";
		mon.item = "";
		mon.gender = "";
		if (!poke.ability) mon.ability = "";
		if (deleteMoves) mon.moves = new Array();
		var packagedMon = Tools.packTeam([mon]);
		if (packagedMon === packaged) return slot;
	}
	return -1;
};
vars.updateTeamOrder = function() {
	$("#teamOrder").html(vars.updateOrder("team"));
};
vars.openBox = function() {
	$("#box").remove();
	var insides = '';
	insides += '<div id="box">' +
	'<div class="exitButton" onclick="$(\'#box\').remove();">x</div>' +
	'<h2>Box</h2>' +
	'<div id="containmons">' + vars.updateOrder("box") + '</div>' +
	'</div>';
	
	$("body").append(insides);
};
vars.updateOrder = function(type) {
	function monHtml(mon, id) {
		return '<div style="' + Tools.getIcon(mon.species) + '" title="' + mon.species + '" id="' + id + '"></div>';
	}
	var insides = '';
	for (var i in vars[type]) insides += monHtml(vars[type][i], i);
	if (type == "team") insides += ' <span onclick="vars.openBox();">Open Box</span>';
	return insides;
};
vars.startAnims = function() {
	if (vars.startedAnims) return;
	vars.startedAnims = true;
	vars.startAnimLoop();
};
vars.startAnimLoop = function() {
	var anim = vars.anims[0];
	if (!anim) return vars.startedAnims = false;
	var el = $(anim[0]),
		currentPos = anim[1],
		incrementPerFrame = anim[2],
		frame = anim[3],
		totalFrames = anim[4],
		timePerFrame = anim[5];
	var newPos = {
		x: currentPos.x + incrementPerFrame.x,
		y: currentPos.y + incrementPerFrame.y
	};
	el.css('background-position', newPos.x + 'px ' + newPos.y + 'px');
	
	anim[1] = newPos;
	anim[3]++;
	if (anim[3] == totalFrames) vars.anims.splice(0, 1);
	setTimeout(vars.startAnimLoop, timePerFrame);
};
vars.animate = function(el, info, t, c) {
	var type = 'css';
	if (vars.windowFocus) type = 'animate';
	if (!el) return type;
	var el = $(el);
	if (type == 'css') return el.css(info);
	if (info['background-position']) {
		var newPos = info['background-position'],
			currentPos = el.css('background-position');
		newPos = {
			x: Math.floor(newPos.split(' ')[0].replace('px', '').replace('%', '')),
			y: Math.floor(newPos.split(' ')[1].replace('px', '').replace('%', ''))
		};
		currentPos = {
			x: Math.floor(currentPos.split(' ')[0].replace('px', '').replace('%', '')),
			y: Math.floor(currentPos.split(' ')[1].replace('px', '').replace('%', ''))
		};
		if (!t) t = 1000;
		var totalFrames = t / vars.fps;
		var difference = {
			x: (newPos.x - currentPos.x),
			y: (newPos.y - currentPos.y)
		};
		var incrementPerFrame = {
			x: difference.x / totalFrames,
			y: difference.y / totalFrames
		};
		vars.anims.push([el, currentPos, incrementPerFrame, 0, totalFrames, 1000 / vars.fps]);
		delete info['background-position'];
		if (Object.keys(info).length) el.animate(info, t, c);
	} else el.animate(info, t, c);
	vars.startAnims();
};
vars.addPokemon = function(unpackedMon, nickname) {
	if (nickname) unpackedMon.nickname = nickname;
	unpackedMon.exp = 0;
	unpackedMon.nextLevelExp = (Math.abs(unpackedMon.level - 5) * 50);
	if (vars.team.length == 6) {
		vars.box.push(unpackedMon);
		alerty("Your '" + (nickname || unpackedMon.species) + "' was sent to your Box.");
	} else vars.team.push(unpackedMon);
	$(".closeX, .exitButton").click();
	vars.updateTeamOrder();
};
vars.chooseNicknameLOOP = function(unpackedMon, nickname) {
	var err;
	if (typeof nickname == "string") {
		if (nickname.length < 19 && nickname.length != 0) return vars.addPokemon(unpackedMon, nickname); else {
			err = "ERROR: The nickname must be 1-18 characters.<br /><br />";
		}
	}
	var msg = (err || "") + "Enter a nickname for your new " + unpackedMon.species;
	prompty(msg, "chooseNicknameLOOP", [unpackedMon]);
};






/* showdownish stuff */
vars.send = function (data, room) {
	if (room && room !== 'lobby' && room !== true) {
		data = room+'|'+data;
	} else if (room !== true) {
		data = '|'+data;
	}
	if (!this.socket || (this.socket.readyState !== SockJS.OPEN)) {
		if (!this.sendQueue) this.sendQueue = [];
		this.sendQueue.push(data);
		return;
	}
	this.socket.send(data);
	console.log('\t\t' + data);
};
vars.login = function(name, password) {
	postProxy("./proxy.php", {
		act: 'login',
		name: name,
		pass: password,
		challengekeyid: vars.challengekeyid,
		challenge: vars.challenge
	}, function(data) {
		if (data.charAt(0) == "]") {
			data = data.substr(1);
		}
		data = JSON.parse(data);
		if (data.curuser.loggedin) {
			vars.username = name;
			$("#loginform").fadeOut();
			vars.send('/trn ' + name + ',0,' + data.assertion);
			setTimeout(function() {
				vars.send('/join lobby'); //REMOVE THIS WHEN U STOP CARING ABOUT LOBBY USER COUNT
			}, 2000);
		} else {
			alerty("Info is wrong or you're not registered.");
		}
	}, 'text');
};
vars.acceptChallenge = function(username, tier) {
	if (BattleFormats[tier].team == "preset") {
		//random you don't need a team
		vars.send('/accept ' + username);
		return false;
	}
	if (vars.team) {
		vars.send('/utm ' + Tools.packTeam(vars.team));
		vars.send('/accept ' + username);
		return false;
	}
	alerty("You have no team.");
};
vars.rejectChallenge = function(username) {
	vars.send('/reject ' + username);
};
vars.cancelChallenge = function(username) {
	vars.send('/cancelchallenge ' + username);
};
vars.openBattle = function(id, type, nojoin) {
	var el = $('<div class="ps-room"></div>').appendTo('body');
	var room = this.rooms[id] = new BattleRoom({
		id: id,
		el: el,
		nojoin: nojoin
	});
};
vars.user = {
	get: function(n) {
		if (n == 'name' || n == 'username') return vars.username;
		if (n == 'userid') return toId(vars.username);
		if (n == 'named') return ((vars.username) ? true : false);
		return '';
	}
};
vars.topbar = {
	updateTabbar: function() {}
};
vars.dismissPopups = function() {
	var source = false;
	while (this.popups.length) {
		var popup = this.popups[this.popups.length-1];
		if (popup.type !== 'normal') return source;
		if (popup.sourceEl) source = popup.sourceEl[0];
		if (!source) source = true;
		this.popups.pop().remove();
	}
	return source;
};
vars.receive = function(data) {
	var roomid = '';
	if (data.substr(0,1) === '>') {
		var nlIndex = data.indexOf('\n');
		if (nlIndex < 0) return;
		roomid = toRoomid(data.substr(1,nlIndex-1));
		data = data.substr(nlIndex+1);
	}
	if (data.substr(0,6) === '|init|') {
		if (!roomid) roomid = 'lobby';
		var roomType = data.substr(6);
		var roomTypeLFIndex = roomType.indexOf('\n');
		if (roomTypeLFIndex >= 0) roomType = roomType.substr(0, roomTypeLFIndex);
		roomType = toId(roomType);
		if (roomType == "battle") {
			vars.openBattle(roomid, roomType, true);
		}
		/*
		if (this.rooms[roomid]) {
			this.addChat(roomid, roomType, true);
		} else {
			this.addChat(roomid, roomType, true);
			//this.joinRoom(roomid, roomType, true);
		}
		*/
	} else if ((data+'|').substr(0,8) === '|expire|') {
		var room = this.rooms[roomid];
		if (room) {
			room.expired = true;
			delete vars.encounteredMon;
			this.removeChat(roomid);
			//alerty("hey mr user, this room expired.");
		}
		return;
	} else if ((data+'|').substr(0,8) === '|deinit|' || (data+'|').substr(0,8) === '|noinit|') {
		if (!roomid) roomid = 'lobby';

		if (this.rooms[roomid] && this.rooms[roomid].expired) {
			// expired rooms aren't closed when left
			return;
		}

		var isdeinit = (data.charAt(1) === 'd');
		data = data.substr(8);
		var pipeIndex = data.indexOf('|');
		var errormessage;
		if (pipeIndex >= 0) {
			errormessage = data.substr(pipeIndex+1);
			data = data.substr(0, pipeIndex);
		}
		// handle error codes here
		// data is the error code
		if (data === 'namerequired') {
			//this.removeRoom(roomid);
			var self = this;
			//this.once('init:choosename', function() {
			//	//self.joinRoom(roomid);
			//});
		} else {
			delete vars.encounteredMon;
			if (isdeinit) { // deinit
				this.removeChat(roomid);
			} else { // noinit
				this.removeChat(roomid);
				if (roomid === 'lobby') this.joinRoom('rooms');
			}
			if (errormessage) {
				//this.addPopupMessage(errormessage);
			}
		}
		return;
	}
	if (roomid) {
		if (this.rooms[roomid]) {
			this.rooms[roomid].receive(data);
			setTimeout("if (vars.rooms['" + roomid + "']) vars.rooms['" + roomid + "'].completelyLoaded = true;", 2000);
		}
		return;
	}

	// Since roomid is blank, it could be either a global message or
	// a lobby message. (For bandwidth reasons, lobby messages can
	// have blank roomids.)

	// If it starts with a messagetype in the global messagetype
	// list, we'll assume global; otherwise, we'll assume lobby.

	var parts;
	if (data.charAt(0) === '|') {
		parts = data.substr(1).split('|');
	} else {
		parts = [];
	}

	switch (parts[0]) {
		/* mmo events */
		case 'newPlayer':
			vars.newPlayer(parts[1]);
			break;
		case 'players':
			var players = parts[1].split(']');
			for (var i in players) {
				var player = players[i].split('[');
				if (!player[2]) continue;
				vars.newPlayer(player[2]);
				vars.updatePlayer(player);
			}
			break;
		case 'm':
		case 'move':
			var user = vars.players[parts[1]],
				dir = parts[2];
			user.walking = true;
			user.direction = dir;
			vars.initWalkLoop();
			break;
		case 's':
		case 'stop':
			parts.splice(0, 1);
			var user = vars.players[parts[0]];
			user.walking = false;
			vars.updatePlayer([parts[1], parts[2], parts[0]]);
			break;
		case 'b':
		case 'broadcastChatMessage':
			var name = parts[1];
			parts.splice(0, 2);
			var message = parts.join('|');
			vars.addMessage(name, message);
			break;
		case 'cp':
		case 'catchPokemon':
			parts.splice(0, 1);
			var packagedMon = parts.join('|');
			var unpackedMon = Tools.fastUnpackTeam(packagedMon)[0];
			vars.chooseNicknameLOOP(unpackedMon);
			break;
		case 'e':
		case 'end':
		case 'disconnectPlayer':
			$("#p" + parts[1]).remove();
			break;
		case 'updateuser':
		case 'formats':
			if (parts[1].substr(0, 6) != "Guest ") vars.send('/start ' + vars.mapName);
			if (typeof BattleFormats == "undefined") vars.parseFormats(parts); //formats line
			break;
		
		
		
		/* normal shit */
		case 'challenge-string':
		case 'challstr':
			vars.challengekeyid = parseInt(parts[1], 10);
			vars.challenge = parts[2];
			break;

		case 'nametaken':
			//app.addPopup(LoginPopup, {name: parts[1] || '', reason: parts[2] || ''});
			break;

		case 'queryresponse':
			//var responseData = JSON.parse(data.substr(16+parts[1].length));
			//app.trigger('response:'+parts[1], responseData);
			break;

		case 'updatechallenges':
			var data = JSON.parse(data.substr(18));
			var tos = data.challengeTo;
			var froms = data.challengesFrom;
			var insides = '';
			$(".challenges").empty();
			for (var from in froms) {
				var icons = 'You have no teams.';
				if (vars.team) {
					icons = "";
					for (var i in vars.team) {
						var info = exports.BattlePokedex[toId(vars.team[i].species)];
						icons += '<span class="col iconcol" style="width: 32px;height: 24px;display: inline-block;' + Tools.getIcon(info) + '"></span>';
					}
				}
				if (froms[from].split('random').length - 1 > 0) icons = '';
				insides += '<div class="challenge">';
				insides += '<div class="challengeHeader">';
				insides += 'Challenge from: ' + from;
				insides += '</div>';
				insides += '<center>';
				insides += '<div class="teamselection">' + icons + '</div>';
				insides += '<button onclick="vars.acceptChallenge(\'' + from + '\', \'' + froms[from] + '\');">Accept</button>';
				insides += ' <button onclick="vars.rejectChallenge(\'' + from + '\');">Reject</button>';
				insides += '</center>';
				insides += '</div>';
			}
			//can only have one challenge sent out at a time
			if (tos) {
				insides += '<div style="background: white;width: 300px;padding: 10px;border: 1px solid black;border-radius: 10px;">';
				insides += 'Waiting on: ' + tos.to + '(' + tos.format + ')<br />';
				insides += '<button onclick="vars.cancelChallenge(\'' + tos.to + '\');">Cancel Challenge</button>';
				insides += '</div>';
			}
			$(".challenges").html(insides);
			//if (this.rooms['']) {
			//	this.rooms[''].updateChallenges($.parseJSON(data.substr(18)));
			//}
			break;

		case 'updatesearch':
			//if (this.rooms['']) {
			//	this.rooms[''].updateSearch($.parseJSON(data.substr(14)));
			//}
			break;

		case 'popup':
			alerty(data);
			//this.addPopupMessage(data.substr(7).replace(/\|\|/g, '\n'));
			//if (this.rooms['']) this.rooms[''].resetPending();
			break;

		case 'pm':
			var message = parts.slice(3).join('|');
			var from = parts[1];
			var fromuserid = toId(from);
			Tools.startPM(fromuserid);
			Tools.addPM(fromuserid, message);
			//this.rooms['lobby'].addChat(from, message, parts[2]);
			break;

		case 'roomerror':
			//// deprecated; use |deinit| or |noinit|
			//this.unjoinRoom(parts[1]);
			//this.addPopupMessage(parts.slice(2).join('|'));
			//break;

		default:
			// the messagetype wasn't in our list of recognized global
			// messagetypes; so the message is presumed to be for the
			// lobby.
			if (this.rooms['lobby']) {
				this.rooms['lobby'].receive(data);
			}
			break;
	}
};
vars.parseFormats = function(formatsList) {
	var isSection = false;
	var section = '';

	var column = 0;
	var columnChanged = false;

	BattleFormats = {};
	for (var j=1; j<formatsList.length; j++) {
		if (isSection) {
			section = formatsList[j];
			isSection = false;
		} else if (formatsList[j] === '' || (formatsList[j].substr(0, 1) === ',' && !isNaN(formatsList[j].substr(1)))) {
			isSection = true;

			if (formatsList[j]) {
				var newColumn = parseInt(formatsList[j].substr(1)) || 0;
				if (column !== newColumn) {
					column = newColumn;
					columnChanged = true;
				}
			}
		} else {
			var searchShow = true;
			var challengeShow = true;
			var team = null;
			var name = formatsList[j];
			if (name.substr(name.length-2) === ',#') { // preset teams
				team = 'preset';
				name = name.substr(0,name.length-2);
			}
			if (name.substr(name.length-2) === ',,') { // search-only
				challengeShow = false;
				name = name.substr(0,name.length-2);
			} else if (name.substr(name.length-1) === ',') { // challenge-only
				searchShow = false;
				name = name.substr(0,name.length-1);
			}
			var id = toId(name);
			var isTeambuilderFormat = searchShow && !team;
			var teambuilderFormat = undefined;
			if (isTeambuilderFormat) {
				var parenPos = name.indexOf('(');
				if (parenPos > 0 && name.charAt(name.length-1) === ')') {
					// variation of existing tier
					teambuilderFormat = toId(name.substr(0, parenPos));
					if (BattleFormats[teambuilderFormat]) {
						BattleFormats[teambuilderFormat].isTeambuilderFormat = true;
					} else {
						BattleFormats[teambuilderFormat] = {
							id: teambuilderFormat,
							name: $.trim(name.substr(0, parenPos)),
							team: team,
							section: section,
							column: column,
							rated: false,
							isTeambuilderFormat: true,
							effectType: 'Format'
						};
					}
					isTeambuilderFormat = false;
				}
			}
			if (BattleFormats[id] && BattleFormats[id].isTeambuilderFormat) {
				isTeambuilderFormat = true;
			}
			BattleFormats[id] = {
				id: id,
				name: name,
				team: team,
				section: section,
				column: column,
				searchShow: searchShow,
				challengeShow: challengeShow,
				rated: searchShow && id.substr(0,7) !== 'unrated',
				teambuilderFormat: teambuilderFormat,
				isTeambuilderFormat: isTeambuilderFormat,
				effectType: 'Format'
			};
		}
	}
	BattleFormats._supportsColumns = columnChanged;
};
vars.removeChat = function(id) {
	var room = this.rooms[id];
	if (room) {
		delete this.rooms[id];
		room.destroy();
		return true;
	}
	return false;
};
function toRoomid(roomid) {
		return roomid.replace(/[^a-zA-Z0-9-]+/g, '');
}
function toId(text) {
	text = text || '';
	if (typeof text === 'number') text = ''+text;
	if (typeof text !== 'string') return toId(text && text.id);
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function postProxy(a, b, c) {
	var datastring = "?post=";
	for (var i in b) {
		datastring += escape(i) + ":" + escape(b[i]) + "|";
	}
	$.get(a + datastring, c);
}
function getProxy(ab, c) {
	var splint = ab.split('?');
	var datastring = splint[1].split("=").join(":").split("&").join("|");
	$.get(splint[0] + "?post=" + datastring, c);
}
function toUserid(text) {
	text = text || '';
	if (typeof text === 'number') text = ''+text;
	if (typeof text !== 'string') return ''; //???
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function bake(c_name, value, exdays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
	document.cookie = c_name + "=" + c_value;
}
function cookie(c_name) {
	var i, x, y, ARRcookies = document.cookie.split(";");
	for (i = 0; i < ARRcookies.length; i++) {
		x = ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
		x = x.replace(/^\s+|\s+$/g,"");
		if (x == c_name) {
			return unescape(y);
		}
	}
}
function eatcookie(name) {
	document.cookie = name + '=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
}
function chance(percent) {
	var random = Math.round(Math.random() * 100);
	if (random > percent) return false;
	return true;
}
Tools.fastUnpackTeam = function (buf) {
	if (!buf) return null;

	var team = [];
	var i = 0, j = 0;

	while (true) {
		var set = {};
		team.push(set);

		// name
		j = buf.indexOf('|', i);
		set.nickname = buf.substring(i, j);
		i = j+1;

		// species
		j = buf.indexOf('|', i);
		set.species = buf.substring(i, j) || set.nickname;
		i = j+1;

		// item
		j = buf.indexOf('|', i);
		set.item = buf.substring(i, j);
		i = j+1;

		// ability
		j = buf.indexOf('|', i);
		var ability = buf.substring(i, j);
		var template = Tools.getTemplate(set.species);
		set.ability = (template.abilities && ability in {'':1, 0:1, 1:1, H:1} ? template.abilities[ability||'0'] : ability);
		i = j+1;

		// moves
		j = buf.indexOf('|', i);
		set.moves = buf.substring(i, j).split(',');
		i = j+1;

		// nature
		j = buf.indexOf('|', i);
		set.nature = buf.substring(i, j);
		i = j+1;

		// evs
		j = buf.indexOf('|', i);
		if (j !== i) {
			var evs = buf.substring(i, j).split(',');
			set.evs = {
				hp: Number(evs[0])||0,
				atk: Number(evs[1])||0,
				def: Number(evs[2])||0,
				spa: Number(evs[3])||0,
				spd: Number(evs[4])||0,
				spe: Number(evs[5])||0
			};
		}
		i = j+1;

		// gender
		j = buf.indexOf('|', i);
		if (i !== j) set.gender = buf.substring(i, j);
		i = j+1;

		// ivs
		j = buf.indexOf('|', i);
		if (j !== i) {
			var ivs = buf.substring(i, j).split(',');
			set.ivs = {
				hp: ivs[0]==='' ? 31 : Number(ivs[0]),
				atk: ivs[1]==='' ? 31 : Number(ivs[1]),
				def: ivs[2]==='' ? 31 : Number(ivs[2]),
				spa: ivs[3]==='' ? 31 : Number(ivs[3]),
				spd: ivs[4]==='' ? 31 : Number(ivs[4]),
				spe: ivs[5]==='' ? 31 : Number(ivs[5])
			};
		}
		i = j+1;

		// shiny
		j = buf.indexOf('|', i);
		if (i !== j) set.shiny = true;
		i = j+1;

		// level
		j = buf.indexOf('|', i);
		if (i !== j) set.level = parseInt(buf.substring(i, j), 10);
		i = j+1;

		// happiness
		j = buf.indexOf(']', i);
		if (j < 0) {
			if (buf.substring(i)) {
				set.happiness = Number(buf.substring(i));
			}
			break;
		}
		if (i !== j) set.happiness = Number(buf.substring(i, j));
		i = j+1;
	}

	return team;
};
Tools.packTeam = function (team) {
	//team = Tools.teams[teamkey].pokemon
	var buf = '';
	if (!team) return '';
	for (var i=0; i<team.length; i++) {
		var set = team[i];
		if (buf) buf += ']';
		// name
		buf += (set.nickname || set.name || set.species);
		// species
		var id = toId(set.species || set.nickname || set.name);
		buf += '|' + (toId(set.nickname || set.name || set.species) === id ? '' : id);
		// item
		buf += '|' + toId(set.item);
		// ability
		var template = Tools.getTemplate(set.species || set.nickname || set.name);
		var abilities = template.abilities;
		id = toId(set.ability);
		if (abilities) {
			if (id == toId(abilities['0'])) {
				buf += '|';
			} else if (id === toId(abilities['1'])) {
				buf += '|1';
			} else if (id === toId(abilities['H'])) {
				buf += '|H';
			} else {
				buf += '|' + id;
			}
		} else {
			buf += '|' + id;
		}
		// moves
		buf += '|' + set.moves.map(toId).join(',');
		// nature
		buf += '|' + set.nature;
		// evs
		var evs = '|';
		if (set.evs) {
			evs = '|' + (set.evs['hp']||'') + ',' + (set.evs['atk']||'') + ',' + (set.evs['def']||'') + ',' + (set.evs['spa']||'') + ',' + (set.evs['spd']||'') + ',' + (set.evs['spe']||'');
		}
		if (evs === '|,,,,,') {
			buf += '|';
		} else {
			buf += evs;
		}
		// gender
		if (set.gender && set.gender !== template.gender) {
			buf += '|'+set.gender;
		} else {
			buf += '|'
		}
		// ivs
		var ivs = '|';
		if (set.ivs) {
			ivs = '|' + (set.ivs['hp']===31||set.ivs['hp']===undefined ? '' : set.ivs['hp']) + ',' + (set.ivs['atk']===31||set.ivs['atk']===undefined ? '' : set.ivs['atk']) + ',' + (set.ivs['def']===31||set.ivs['def']===undefined ? '' : set.ivs['def']) + ',' + (set.ivs['spa']===31||set.ivs['spa']===undefined ? '' : set.ivs['spa']) + ',' + (set.ivs['spd']===31||set.ivs['spd']===undefined ? '' : set.ivs['spd']) + ',' + (set.ivs['spe']===31||set.ivs['spe']===undefined ? '' : set.ivs['spe']);
		}
		if (ivs === '|,,,,,') {
			buf += '|';
		} else {
			buf += ivs;
		}
		// shiny
		if (set.shiny) {
			buf += '|S';
		} else {
			buf += '|'
		}
		// level
		if (set.level && set.level != 100) {
			buf += '|'+set.level;
		} else {
			buf += '|'
		}
		// happiness
		if (set.happiness !== undefined && set.happiness !== 255) {
			buf += '|'+set.happiness;
		} else {
			buf += '|';
		}
	}
	return buf;
};
Tools.dragPM = false;
Tools.startPM = function(to) {
	if (!vars.username) return false;
	if (toId(to) == toId(vars.username)) return false;
	var pmbox = $("#pm" + to + "-" + toId(vars.username));
	if (!pmbox.length) {
		var from = toId(vars.username);
		var insides = '';
		insides += '<div id="pm' + to + '-' + from + '" class="pmbox">';
		insides += '<div onmousedown="Tools.dragPM = \'pm' + to + "-" + from + '\';" ontouchstart="Tools.dragPM = \'pm' + to + "-" + from + '\';" class="pmheader">' + to + '<span onmousedown="$(\'#pm' + to + "-" + from + '\').hide();" class="pmexit">x</span></div>';
		insides += '<div id="pmlogs' + to + '-' + from + '" class="pmlogs"></div>';
		insides += '<input id="pminput' + to + '-' + from + '" class="pminput" />';
		insides += '</div>';
		$("body").append(insides);
	} else pmbox.show();
};
Tools.addPM = function(from, message, to) {
	var uid = toId(vars.username);
	var logs = $('#pmlogs' + from + "-" + uid);
	if (from == uid) logs = $("#pmlogs" + to + "-" + from);
	logs.append('<div><font color="' + ((uid == from) ? "blue" : "red") + '"><b>' + from + ':</b></font> ' + message + '</div>');
	logs.scrollTop(logs.prop("scrollHeight"));
};