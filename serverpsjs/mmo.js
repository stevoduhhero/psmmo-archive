let maps = {commands: {}};
function Map(name) {
	this.name = name;
	this.users = {};
	return this;
}
Map.prototype.join = function(user, connection) {	
	const userid = toId(user.name);
	if (user.map) user.map.leave(user);
	user.map = this;
	this.users[userid] = {
		obj: user,
		socket: connection,
		x: 0,
		y: 0,
		dir: "",
		pokemon: {}
	};
	this.emit('|newPlayer|' + user.name);

	//redefine user's leave function, to d/c from mmo
	if (!user.oldLeave) user.oldLeave = user.leaveRoom;
	user.leaveRoom = (function(room, connection = null, force = false) {
		var cached_function = user.oldLeave;
		return function(room, connection = null, force = false) {
			var result = cached_function.apply(this, arguments);
			if (room.id === "psmmo" && user.map) user.map.leave(user);
			return result;
		};
	})();
};
Map.prototype.leave = function(user) {
	const userid = toId(user.name);
	if (user.map || this.users[userid]) {
		this.emit('e|' + userid);
	}
	delete user.map;
	delete this.users[userid];
};
Map.prototype.players = function() {
	let str = "";
	for (let i in this.users) {
		let user = this.users[i];
		str += user.obj.name + "[" + user.x + "[" + user.y + "]";
	}
	str = str.substr(0, str.length - 1);
	return str;
};
Map.prototype.emit = function(msg, exclude) {
	for (let i in this.users) {
		let user = this.users[i];
		if (user.obj === exclude) continue;
		user.socket.send(msg);
	}
};

maps.mergeGuests = function(user) {
	user = Users.get(user.userid);
	user.setNamed = false;
	let u, nonGuests = user.getAltUsers(true), allAlts = user.getAltUsers(true);
	let name = user.name;
	
	//remove bot & guests from nonGuests
	for (let i = 0; i < nonGuests.length; i++) {
		u = nonGuests[i];
		if (!u) continue;
		let uid = toId(u.name);
		if (uid === bot.userid || uid.startsWith("guest")) {
			nonGuests.splice(i, 1);
			i--;
		}
	}
	
	if (nonGuests !== null && nonGuests.length) name = nonGuests[0].name;
	let newUser = Users.get(toId(name));
	if (nonGuests === null || !nonGuests.length) nonGuests = [newUser];
	
	if (newUser.userid.startsWith("guest")) return;
	
	if (newUser.userid !== user.userid) {
		user.merge(newUser);
		Users.merge(user, newUser);
		newUser.destroy();
		user.forceRename(name, '1', true);
	}
	for (let y in nonGuests) {
		u = Users.get(nonGuests[y].name);
		if (u.setNamed) continue;
		if ((u.connections[0].inRooms.has("psmmo"))) {
			//only send to mmo tab connection
			u.connections[0].send('|setName|' + name);
		}
		u.setNamed = true;
	}
};
maps.setup = function(commands) {
	Dex.data.Formats.psmmo = {name: "psmmo", mod: 'gen7', ruleset: ['Pokemon'], searchShow: false};
	
	//commands that are being replaced from chat-commands.js
	maps.commands.join = (function(target, room, user, connection) {
		var cached_function = commands.join;
		return function(target, room, user, connection) {
			if (target === "psmmo") maps.mergeGuests(user);
			var result = cached_function.apply(this, arguments);
			return result;
		};
	})();
	maps.commands.autojoin = (function(target, room, user, connection) {
		var cached_function = commands.autojoin;
		return function(target, room, user, connection) {
			var result = cached_function.apply(this, arguments);
			let targets = target.split(',');
			for (const target of targets) {
				if (target === "psmmo") maps.mergeGuests(user);
			}
			return result;
		};
	})();
	maps.commands.hotpatch = (function(target, room, user, connection) {
		var cached_function = commands.hotpatch;
		return function(target, room, user, connection) {
			if (typeof BotDir === "undefined") global.BotDir = "./bot";
			if (typeof MMODir === "undefined") global.MMODir = "./mmo";
			Chat.uncache(BotDir);
			global.Bot = require(BotDir).setup(Chat.commands);
			Chat.uncache(MMODir);
			global.MMO = require(MMODir).setup(Chat.commands);
			var result = cached_function.apply(this, arguments);
			return result;
		};
	})();
	maps.commands.challenge = (function(target, room, user, connection) {
		var cached_function = commands.challenge;
		return function(target, room, user, connection) {
			//if (target.split('psmmo').length - 1 > 0) target = target.replace("psmmo", "gen7balancedhackmons"); //mmo
			var result = cached_function.apply(this, arguments);
			return result;
		};
	})();
	
	for (let i in maps.commands) commands[i] = maps.commands[i];
	return maps;
};
maps.commands.start = function(target, room, user, connection, cmd) {
	if (!maps[target]) maps[target] = new Map(target);
	let map = maps[target];
	connection.send('|players|' + map.players());
	map.join(user, connection);
};
maps.commands.mmo = function(target, room, user, connection, cmd) {
	/* move, stop, broadcast, catchpokemon	*/
	if (!user.map) return;
	let userid = toId(user.name); //forceForceRename doesn't change userid
	let msg = target.split('.');
	let mapObj = user.map.users[user.userid];
	if (!mapObj) return;
	let type = toId(msg[0]);
	if (type === "msg") {
		msg.splice(0, 1);
		msg = msg.join(".");
		user.map.emit('|b|' + user.name + '|' + msg);
	}
	if (type === "start") {
		mapObj.dir = msg[1]
		user.map.emit('|m|' + userid + '|' + mapObj.dir, user);
	}
	if (type === "stop") {
		mapObj.x = msg[1];
		mapObj.y = msg[2];
		user.map.emit('|s|' + userid + '|' + mapObj.x + '|' + mapObj.y, user);
	}
	if (type === "encounter") {		
		//generate pokemon
		const team = [bot.generateMon(msg[1], msg[2])];
		bot.user.team = Dex.packTeam(team);
		mapObj.pokemon = team;
		
		//update coordinates
		mapObj.x = msg[3];
		mapObj.y = msg[4];
		user.map.emit('|s|' + userid + '|' + mapObj.x + '|' + mapObj.y, user);
		
		//createBattle
		let formatid = "psmmo";
		let options = {
			p1: bot.user,
			p2: user,
			p1team: bot.user.team,
			p2team: user.team,
			rated: 0
		};
		const p1 = options.p1;
		const p2 = options.p2;
		options.format = formatid;
		const roomid = Rooms.global.prepBattleRoom(formatid);
		const p1name = p1 ? p1.name : "Player 1";
		const p2name = p2 ? p2.name : "Player 2";
		const room = Rooms.createGameRoom(roomid, "" + p1name + " vs. " + p2name, options);
		room.game = new Rooms.RoomBattle(room, formatid, options);
		if (p1) p1.joinRoom(room);
		if (p2) p2.joinRoom(room);
		if (p1) Monitor.countBattle(p1.latestIp, p1.name);
		if (p2) Monitor.countBattle(p2.latestIp, p2.name);
		
		bot.addBattle(room);		
	}
	if (type === "catchpokemon") {
		//msg[1] = monId
		connection.send('|cp|' + Dex.packTeam(mapObj.pokemon));
	}
};

exports.setup = maps.setup;