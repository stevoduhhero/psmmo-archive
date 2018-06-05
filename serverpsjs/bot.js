let def = true;
if (typeof bot === "undefined") def = false;
if (!def) bot = {commands: {}};


bot.name = "PSMMO-Bot";
bot.userid = toId(bot.name);


if (!def) bot.battles = {}; //never reset battles... incase of hotpatch/reload
bot.appear = function() {
	//bot-hack in sockets.js, bot hack right here too
	Users.get("guest1").forceRename(bot.name);
	bot.user = Users.get(bot.userid);
	bot.user.registered = true;
	bot.user.tryJoinRoom("lobby", bot.user.connections[0]);
	bot.user.group = "*"; //botgroup
	bot.user.updateIdentity();
};
bot.generateMon = function(pokemonid, minMonLevel) {
	const poke = Dex.data.Pokedex[pokemonid];
	const set = Dex.data.Learnsets[pokemonid].learnset;
	const species = poke.species;
	const level = Number(minMonLevel) + (Math.floor(Math.random() * 10));
	const nature = Dex.data.Natures[Object.keys(Dex.data.Natures)[Math.floor(Math.random() * 25)]].name
	let ability = Object.keys(poke.abilities).length;
	if (ability > 1) ability = poke.abilities[Math.floor(Math.random() * ability)]; else ability = poke.abilities[0];
	let shiny = Math.floor(Math.random() * 700);
	if (shiny >= 697) shiny = true; else shiny = false;
	//generate moves
	let learnable = [];
	for (let moveid in set) {
		let moveConditions = set[moveid];
		for (let i in moveConditions) {
			let condition = moveConditions[i].split('L');
			if (condition[1] && Number(condition[1]) <= level) {
				learnable.push(moveid);
			}
		}
	}
	function fourDifferentNumbers(range) {
		let ray = [];
		if (range <= 4) {
			for (let i = 0; i < range; i++) ray.push(i);
			return ray;
		}
		function gen(r) {return Math.floor(Math.random() * r);}
		function recurse() {
			let num = gen(range);
			if (ray.indexOf(num) === -1) return num;
			return recurse();
		}
		for (let i = 0; i < 4; i++) ray.push(recurse());
		return ray;
	}
	let moves = fourDifferentNumbers(Object.keys(learnable).length);
	for (let i in moves) moves[i] = Dex.data.Movedex[learnable[moves[i]]].name;
	
	return {
		ability: ability,
		level: level,
		moves: moves,
		nature: nature,
		shiny: shiny,
		species: species
	};
};
bot.randomTeam = function() {
	bot.user.team = 'Bulbasaur|||H|growl,tackle|Lonely|||||5|';
};
bot.addBattle = function(room) {
	var roomid = room.id;
	bot.battles[roomid] = {
		room: room
	};
};
bot.removeBattle = function(roomid) {
	const room = bot.battles[roomid].room;
	if (room) bot.user.leaveRoom(room);
	delete bot.battles[roomid];
};
bot.makeDecision = function(roomid) {
	//bot leave room cases
	const room = bot.battles[roomid].room;
	if (!room) {
		bot.removeBattle(roomid);
		return;
	}
	const battle = room.battle;
	if (!battle) {
		bot.removeBattle(roomid);
		return;
	}
	if (Object.keys(battle.players).length < 2) {
		if (battle.ended == true) bot.removeBattle(roomid);
		return;
	}
	const rqid = battle.rqid;
	//you = refers to bot, the code		opp = refers to opponent!!!		restTeam = "the rest of the team", non-active mons
	const youPlayer = battle.players[bot.userid];
	const youReqStr = (JSON.stringify(battle.requests[youPlayer.slot].request)); //.active, .noCancel, .side                    .active = [{moves: [{move:,id:,pp:,maxpp:,target:,disabled:}, {}, {}, {}]},,...]
	const oppReqStr = (JSON.stringify(battle.requests[((youPlayer.slot === "p1") ? "p2" : "p1")].request));
	let youReq_ = JSON.parse(youReqStr);
	let oppReq_ = JSON.parse(oppReqStr);
	if (youReqStr === '""' || oppReqStr === '""') return; //no data yet
	
	let youReq, oppReq;
	if (!youReq_.side && !youReq_.rqid) {
		youReq = JSON.parse(youReq_);
		oppReq = JSON.parse(oppReq_); //for some reason i have to parse twice... only sometimes?
	} else {
		youReq = youReq_;
		oppReq = oppReq_;
	}
	
	const you = youReq.side;
	const opp = oppReq.side;
	if (!you || !opp) return; //there is a moment at the beginning of match where sides aren't there
	let youActive = {mon: [], keys: [], active: youReq.active};
	let oppActive = {mon: [], keys: [], active: youReq.active};
	function processActiveMons(team, activeObj) {
		//youActive.mon is an array bcos i think 3vs3 battles or whatever have 3 active mons insteadof 1.... so this is for future implementation
		for (let i in team) {
			if (team[i].active) {
				team[i].key = i;
				activeObj.mon.push(team[i]);
				activeObj.keys.push(i);
			}
		}
	}
	processActiveMons(you.pokemon, youActive);
	processActiveMons(opp.pokemon, oppActive);
	
	//setup helper functions
	function firstSwitch() {
		//firstSwitch differs from regular switch in that the choice is decided based dominantly on all party members
	}
	function smartSwitch() {
		//smartSwitch focuses on activeVSactive pokemon scenario... or restTeamVSactive
		
	}
	function movePower(src, tar, moveid) {
		const move = Dex.data.Movedex[moveid];
		const srcSpecies = toId(src.details.split(',')[0]);
		const tarSpecies = toId(tar.details.split(',')[0]);
		const srcPoke = Dex.data.Pokedex[srcSpecies];
		const tarPoke = Dex.data.Pokedex[tarSpecies];
		let stab = 1;
		if (srcPoke.types.indexOf(move.type) !== -1) stab = 1.5;
		let effectiveness = 1;
		for (let i in tarPoke.types) {
			let type = tarPoke.types[i];
			let e = Dex.data.TypeChart[type].damageTaken[move.type];
			if (e === 3) {
				e = 0;
			} else if (e === 2) {
				e = 0.5;
			} else if (e === 0) {
				e = 1;
			} else if (e === 1) {
				e = 2;
			}
			effectiveness = effectiveness * e;
		}
		//later take into account move effect, item, abilities
		let power = move.basePower * stab * effectiveness;
		return power;
	}
	function bestAttack(src, tar) {
		let movePowers = [];
		for (let i in src.moves) {
			let moveid = src.moves[i];
			movePowers.push(movePower(src, tar, moveid));
		}
		let highestKey;
		let highest = -1;
		for (let i in movePowers) {
			if (movePowers[i] > highest) {
				highestKey = i;
				highest = movePowers[i];
			}
		}
		return highestKey;
	}
	function moveTypingRange(moves, src, tar) {
		//return 0.25,0.5,1,2,4
	}

	/*
		initialize variables
		--------------------
		keep track w/ booleans
		speedHigher
		speedLower
		lowHealth = 0%-44%
		midHealth = 45-66%
		highHealth = 67%-100%
	*/
	const youActiveMon = you.pokemon[youActive.keys[0]];
	const oppActiveMon = opp.pokemon[oppActive.keys[0]];


	//making a decision
	//if teamSelect: firstSwitch
	//if active died || forcedToSwitch: switch
	
	//if trapped: attack
	
	//if active no pp, checkCanSwitch:switch else struggle
	
	//active mon vs active mon || active vs rest of team
		//     you       opp
		//if active vs active good: attack
			//if typing is < neutral then bad
			//if speedHigh && lowHealth && moveTypingRange == neutral, good
			//if speedHigh && oppMidHealth && moveTypingRange == super, good
			//if typing is super/neutral, good
			//if low speed && low health && neutral typing, then bad
			//if low health/bad typing && higher speed, then good
			//if low health, then bad
		//if active vs active bad:
			//if restTeam vs active good: switch
			//if restTeam vs active bad: attack
	const moveKey = bestAttack(youActiveMon, oppActiveMon);
	let megaOrNo = ""; //figure out ZMOVES!!!
	if (youActiveMon.item.substr(-3) === "ite") megaOrNo = " mega";
	room.game.stream.write(">" + you.id + " move " + (Number(moveKey) + 1) + megaOrNo);
	//room.game.stream.write(">" + playerSlot + " " + choice);
	bot.battles[roomid].lastDecision = rqid;
	
	//debugging
	bot.battle = {you: youReq, opp: oppReq};
	
	/*
		/choose team 123456|3
		/choose team 1|2
		/choose switch 3|5
		/choose move 3|5
		/choose move 4 mega|5

		poke = {
			"ident":"p1: Oricorio",
			"details":"Oricorio, L83, M",
			"condition":"177/259",
			"active":true,
			"stats": {
				"atk":164,"def":164,"spa":210,"spd":164,"spe":202
			},
			"moves":["uturn","revelationdance","hurricane","roost"],
			"baseAbility":"dancer",
			"item":"lifeorb",
			"pokeball":"pokeball",
			"ability":"dancer"
		}
	*/
	
};
bot.setup = function(commands) {
	//commands that are being replaced from chat-commands.js
	bot.commands.part = (function(target, room, user, connection) {
		var cached_function = commands.part;
		return function(target, room, user, connection) {
			let targetRoom = Rooms.get(toId(target));
			var result = cached_function.apply(this, arguments);
			if (!targetRoom) return;
			if (bot.battles[targetRoom.id]) {
				if (targetRoom.battle.players && targetRoom.battle.players[user.userid]) {
					//bot opponent left so remove battle
					bot.removeBattle(targetRoom.id);
				}
			}
			return result;
		};
	})();
	
	for (let i in bot.commands) commands[i] = bot.commands[i];
	return this;
};
bot.timerCallback = function() {
	//making an appearance
	if (!bot.user) {
		let u = Users.get("guest1");
		if (u && u.name !== bot.name) bot.appear();
		return;
	}
	//responding to battles
	for (let id in bot.battles) {
		let battle = bot.battles[id];
		if (battle !== undefined) {
			if (battle.room.battle && battle.lastDecision === battle.room.battle.rqid) continue;
			bot.makeDecision(id);
		}
	}
};
bot.tick = function() {
	bot.timerCallback();
	bot.timer = setTimeout(function() {
		bot.tick();
	}, 1000);
};
bot.initialize = function() {
	if (bot.timer !== undefined) return; //already have an interval running
	bot.tick();
};
bot.initialize();

exports.setup = bot.setup;