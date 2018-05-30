let maps = {commands: {}};
function Map(name) {
	this.name = name;
	this.users = {};
	return this;
}
Map.prototype.join = function(user, connection) {
	if (user.map) user.map.leave(user);
	user.map = this;
	this.users[user.userid] = {
		obj: user,
		socket: connection,
		x: 0,
		y: 0,
		dir: "",
		pokemon: {}
	};
	this.emit('|newPlayer|' + user.name);
};
Map.prototype.leave = function(user) {
	delete user.map;
	delete this.users[user.userid];
	this.emit('e|' + user.userid);
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
	let guests = user.getAltUsers();
	let guest;
	for (let i in guests) {
		guest = guests[i];
		if (guest.userid === bot.userid) {
			guests.splice(i, 1);
			guest = guests[i];
			continue;
		}
		user.merge(guest);
	}
	if (user.userid.startsWith('guest') && guest) {
		if (!guests[0]) guests[0] = {name: ""};
		if (!guests[1]) guests[1] = {name: ""};
		Rooms.get("psmmo").addRaw("<h3>" + guests[0].name + "," + guests[1].name);
	}
	user.send('|setName|' + user.name);
};
maps.setup = function(commands) {
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
	let msg = target.split('.');
	let mapObj = user.map.users[user.userid];
	let type = toId(msg[0]);
	if (type === "msg") {
		msg.splice(0, 1);
		msg = msg.join(".");
		user.map.emit('|b|' + user.name + '|' + msg);
	}
	if (type === "start") {
		mapObj.dir = msg[1]
		user.map.emit('|m|' + user.userid + '|' + mapObj.dir, user);
	}
	if (type === "stop") {
		mapObj.x = msg[1];
		mapObj.y = msg[2];
		user.map.emit('|s|' + user.userid + '|' + mapObj.x + '|' + mapObj.y, user);
	}
	if (type === "encounter") {		
		//generate pokemon
		const team = [bot.generateMon(msg[1], msg[2])];
		bot.user.team = Dex.packTeam(team);
		mapObj.pokemon = team;
		
		//update coordinates
		mapObj.x = msg[3];
		mapObj.y = msg[4];
		user.map.emit('|s|' + user.userid + '|' + mapObj.x + '|' + mapObj.y, user);
		
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