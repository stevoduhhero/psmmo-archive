vars.init = function() {
	vars.loadMap(vars.mapName);
	vars.resize();
	
		var sock = new SockJS('http://elloworld.noip.me:8001/showdown/');
		sock.onopen = function() {console.log('open');};
		sock.onmessage = function(event) {
			//console.log = function() {};
			console.log('receive', JSON.stringify(event.data));
			vars.receive(event.data);
		};
		sock.onclose = function() {console.log('close');};
	
	vars.socket = sock;
	
	if (!localStorage.getItem("team")) vars.chooseStarterPrompt();

	$(document).keydown(function(e) {
		vars.key(e.keyCode);
	}).keyup(function(e) {
		vars.key(e.keyCode, true);
	}).on("focus", "input, textarea", function() {
		vars.focusedInput = this;
	}).on("blur", "input, textarea", function() {
		vars.focusedInput = false;
	});
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
};
vars.resize = function() {
	var canvas = $("#map"),
			body = $("body");
	var spaceAvailable = body.height() - canvas.height();
	var percentZoom = spaceAvailable / canvas.height() * 100;
	canvas.css("zoom", 100 + percentZoom + "%");
	
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
	if (vars.encounteredMon) return;
	if (keyup && user.direction == dir) vars.stopWalking(); else if (!user.walking) {
		user.walking = true;
		user.direction = dir;
		vars.initWalkLoop();
		vars.send('/mmo start.' + dir);
	}
};
vars.stopWalking = function() {
	var user = vars.players[toId(vars.username)];
	user.walking = false;
	vars.send('/mmo stop.' + user.x + '.' + user.y);
};
vars.initWalkLoop = function() {
	if (vars.walking) return;
	vars.walkLoop();
	vars.walking = true;
};
vars.walkLoop = function() {
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
			if (dir == "up") user.y--;
			if (dir == "down") user.y++;
			if (dir == "left") user.x--;
			if (dir == "right") user.x++;
			var block = vars.map[user.y];
			if (block) block = block[user.x];
			if (block === undefined) block = 0; //block doesnt exist, blackness
			if ((block == 1) || vars.encounteredMon) {
				user.x = revert.x;
				user.y = revert.y;
			}
			var moved = false;
			if (!(revert.x == user.x && revert.y == user.y)) moved = true;
			if (moved) {
				if (!vars.encounteredMon && block == 3 && userid == user.userid) vars.encounterMon();
				if (user.userid == userid) vars.focusCamera(); else {
					sprite.animate({
						left: (vars.block.width * user.x) + 'px',
						top: (vars.block.height * user.y) + 'px'
					}, vars.fps);
				}			
			}
		}
	}
	if (walkers) walLoopTimeout = setTimeout("vars.walkLoop();", vars.fps); else {
		delete vars.walking;
	}
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
	$("#p" + uid).animate({
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
				y: vars.startingPosition.y
			};	
	}
	var userid = toId(name);
	var user = playerVars();
	user.name = name;
	user.userid = userid;
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
	var tar = vars.players[toId(vars.username)] || vars.startingPosition,
		left = 0,
		top = 0;
	var showBlocks = {
		x: $("#map").width() / vars.block.width,
		y: $("#map").height() / vars.block.height
	};
	left = (tar.x * vars.block.width) - ((showBlocks.x / 2) * vars.block.width);
	top = (tar.y * vars.block.height) - ((showBlocks.y / 2) * vars.block.height);
	$("#container .mapimg").css({
		"background-position": (-left) + "px " + (-top) + "px"
	});
	$("#players").css({
		left: -left + "px",
		top: -top + "px"
	});
};
vars.loadMap = function(name) {
	$.get("./maps/" + name, function(data) {
		var data = data.split('\n');
		var name = data[0].split(':')[1],
			minMonLevel = Math.floor(data[1].split(':')[1]),
			mons = JSON.parse(data[2].split(':')[1]),
			startingPosition = data[3].split(':')[1].split(','),
			doors = JSON.parse(data[4].split(':')[1]);
		vars.mapName = name;
		vars.minMonLevel = minMonLevel;
		vars.encounterMons = mons;
		vars.doors = doors;
		data.splice(0, 5);
		
		vars.startingPosition = {
			x: Math.floor(startingPosition[0]),
			y: Math.floor(startingPosition[1])
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
				var evolveOrNaw = confirm("Your " + mon.species + " would like to evolve into a " + evolution.species + ".");
				if (evolveOrNaw) {
					if (vars.team[monKey].species == vars.team[monKey].nickname) vars.team[monKey].nickname = evolution.species;
					vars.team[monKey].species = evolution.species;
				}
			}
		}
	}
};
vars.learnMove = function(move, monKey, replaceMove) {
	var mon = vars.team[monKey];
	if (!replaceMove) {
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
						if (amountMovesHave == 4) {
							//different kind of prompt that asks what kind of move to replace
							function prompty(errMsg) {
								var msg = (errMsg || "") + "Your " + mon.species + " wants to learn a new move! (" + move.name + ") but you already have 4 moves. Would you like to replace a move?\n\n";
								for (var i in mon.moves) msg += "(" + (Math.abs(i) + 1) + ") " + mon.moves[i] + "\n";
								msg += "\nEnter the move you want to cancel or hit cancel.";
								var learnOrNaw = prompt(msg);
								if (typeof learnOrNaw == "string") {
									var moveId = Math.abs(learnOrNaw) - 1;
									if (isNaN(moveId) || moveId < 0 || moveId > 3) {
										prompty("ERROR: '" + learnOrNaw + "' IS NOT AN OPTION.\n");
									} else {
										vars.learnMove(move.name, monKey, moveId);
									}
								}
							}
							prompty();
						} else {
							vars.learnMove(move.name, monKey, false);
							alert("Your " + mon.species + " learned " + move.name + "!");
						}
					}
				}
			}
		}
	}
};
vars.gainExp = function(el, slot) {
	var numMons = Object.keys(vars.expDivision).length,
		expGain = 100;
	expGain = expGain / numMons;
	for (var monKey in vars.expDivision) {
		var mon = vars.team[monKey];
		mon.exp += expGain;
		if (!mon.exp) return false; //bug, glitch, idfk
		if (mon.exp >= mon.nextLevelExp) {
			var oldSpecies = mon.species;
			mon.exp = mon.exp - mon.nextLevelExp;
			mon.nextLevelExp += 50;
			mon.level++;
			$(el).css("width", "0%");
			if (mon.level > 100) {
				mon.level = 100;
				mon.exp = 0;
				mon.nextLevelExp = 0;
			}
			alert("Your pokemon just leveled up to level " + mon.level + ".");
			vars.checkLearnMove(monKey);
			vars.checkEvolve(monKey);
			if (oldSpecies != vars.team[monKey].species) vars.checkLearnMove(monKey);
		}
	}
	vars.expDivison = new Object();
	vars.encounteredMon = false;
};
vars.differentMonInfo = function(who, slot, el) {
	console.log(who + "::" + slot + "::" + $(el).length);
	if (who == "you") {
		vars.expDivision[slot] = true;
		vars.updateExp(el, slot, "css");
	} else {
		vars.expDivision = new Object();
		vars.expDivision[slot] = true;
	}
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
		} else {
			alert("Info is wrong or you're not registered.");
		}
	}, 'text');
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
			alert("hey mr user, this room expired.");
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
		case 'updateuser':
			if (parts[1].substr(0, 6) != "Guest ") vars.send('/start ' + vars.mapName);
			break;
		
		
		
		/* normal shit */
		case 'challenge-string':
		case 'challstr':
			vars.challengekeyid = parseInt(parts[1], 10);
			vars.challenge = parts[2];
			break;


		case 'updateuser':
			/*
			var nlIndex = data.indexOf('\n');
			if (nlIndex > 0) {
				this.receive(data.substr(nlIndex+1));
				nlIndex = parts[3].indexOf('\n');
				parts[3] = parts[3].substr(0, nlIndex);
			}
			var name = parts[1];
			var named = !!+parts[2];
			this.user.set({
				name: name,
				userid: toUserid(name),
				named: named,
				avatar: parts[3]
			});
			this.user.setPersistentName(named ? name : null);
			if (named) {
				this.trigger('init:choosename');
			}
			*/
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
				var icons = 'You haven\'t set a team yet. (Hint: go to teambuilder)';
				if (client.team && Tools.teams[client.team]) {
					icons = Tools.teams[client.team].name;
					for (var i in Tools.teams[client.team].pokemon) {
						var info = exports.BattlePokedex[toId(Tools.teams[client.team].pokemon[i].species)];
						icons += '<span class="col iconcol" style="width: 32px;height: 24px;' + Tools.getIcon(info) + '"></span>';
					}
				}
				if (froms[from].split('random').length - 1 > 0) icons = '';
				insides += '<div class="challenge">';
				insides += '<div class="challengeHeader">';
				insides += 'Challenge from: ' + from;
				insides += '</div>';
				insides += 'Tier: ' + froms[from];
				insides += '<center>';
				insides += '<div class="teamselection">' + icons + '</div>';
				insides += '<button onclick="Tools.acceptChallenge(\'' + from + '\', \'' + froms[from] + '\');">Accept</button>';
				insides += ' <button onclick="Tools.rejectChallenge(\'' + from + '\');">Reject</button>';
				insides += '</center>';
				insides += '</div>';
			}
			//can only have one challenge sent out at a time
			if (tos) {
				insides += '<div style="background: white;width: 300px;padding: 10px;border: 1px solid black;border-radius: 10px;">';
				insides += 'Waiting on: ' + tos.to + '(' + tos.format + ')<br />';
				insides += '<button onclick="Tools.cancelChallenge(\'' + tos.to + '\');">Cancel Challenge</button>';
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
			//this.addPopupMessage(data.substr(7).replace(/\|\|/g, '\n'));
			//if (this.rooms['']) this.rooms[''].resetPending();
			break;

		case 'pm':
			var message = parts.slice(3).join('|');
			var from = parts[1];
			var fromuserid = toId(from);
			Tools.startPM(fromuserid);
			Tools.addPM(fromuserid, message);
			this.rooms['lobby'].addChat(from, message, parts[2]);
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
	var random = Math.floor(Math.random() * 100) + 1;
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
		buf += (set.nickname || set.species);
		// species
		var id = toId(set.species || set.nickname);
		buf += '|' + (toId(set.nickname || set.species) === id ? '' : id);
		// item
		buf += '|' + toId(set.item);
		// ability
		var template = Tools.getTemplate(set.species || set.nickname);
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