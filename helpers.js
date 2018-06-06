//global functions
function toRoomid(roomid) {
	return roomid.replace(/[^a-zA-Z0-9-]+/g, '');
}
function toId(text) {
	text = text || '';
	if (typeof text === 'number') text = ''+text;
	if (typeof text !== 'string') return toId(text && text.id);
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
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

//prompts
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
expAlerty = function(msg) {var id = alerty(msg);$("#baby" + id).css({left: "0px", "margin-left": "0px"});setTimeout(function() {$("#daddy" + id).click();}, 2000);};
alerty = function(msg, info, type) {
	var t = new Date() / 1,
		closeByClick = '',
		addInputs = '';
	if (type) {
		if (type === "confirm") {
			addInputs = '<br /><button onclick="answerConfirmy(' + t + ', true);">YES</button><button onclick="answerConfirmy(' + t + ', false);">NO</button>';
		}
		if (type === "prompt") {
			addInputs = '<br /><input type="text" onkeypress="if (event.keyCode == 13) {answerConfirmy(' + t + ', this.value);}" />';
		}
		if (type === "multiline") {
			addInputs = '<br /><textarea style="height: 100px;" onkeypress="if (event.keyCode == 13) {answerConfirmy(' + t + ', this.value);}"></textarea>';
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

//PS Tools
if (typeof Tools === "undefined") Tools = {};
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
Tools.getScript = function(url, callback, cache) {
	$.ajax({
		type: "GET",
		url: url,
		success: callback,
		cache: cache
	});
};
