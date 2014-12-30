var vars = new Object();
vars.x = 0;
vars.y = 0;
vars.players = new Object();
vars.map = new Array();
vars.mapName = "start";
vars.fps = 1000 / 10;
vars.block = {
	x: 20, //amount on x axis
	y: 15, //amount on y axis
	width: 16,
	height: 16,
};
vars.blockTypes = {
	blank: 0,
	blockwalk: 1,
	door: 2,
	grass: 3,
	water: 4,
};
vars.spritesURL = "../psmmo/sprites.png";
vars.character = {
	direction: false,
	cycle: 0,
	cycleType: "walk",
	width: 14,
	height: 19,
	x: 481,
	y: 387,
	directionsOrder: ["down", "left", "up", "right", /* walk */ "down", "left", "up", "right" /* run */],
	walk: new Object(),
	run: new Object(),
};
vars.popups = new Array();
vars.rooms = new Object();
vars.rates = {
	encounterRate: [1.25, 3.33, 6.75, 8.5, 10],
};
vars.items = new Object();
vars.team = new Array();
vars.focusedInput = false;
(function() {
	for (var step = 0; step < 24; step++) {
		var walkOrRunStep = "walk";
		if (step > 11) walkOrRunStep = "run";
		var direction = vars.character.directionsOrder[Math.floor(step / 3)];
		if (Math.floor(step / 3) == step / 3) vars.character[walkOrRunStep][direction] = new Array();
		var currentX = vars.character.x + (vars.block.width * step);
		var currentY = vars.character.y;
		vars.character[walkOrRunStep][direction].push({
			x: currentX,
			y: currentY
		});
	}
})()