# psmmo
A pokemon mmo using pokemonshowdown's server.

How to setup PSMMO

PART 1 - SETUP POKEMON SHOWDOWN
1. Download & Install Pokemon Showdown
2. In the root directory add bot.js & mmo.js from this repo's "serverpsjs" folder
3. Add these lines to chat-commands.js
      const Bot = require('./bot');
      const MMO = require('./mmo').maps;
      for (let i in MMO.commands) commands[i] = MMO.commands[i];
3. Replace sockets.js from the root with the "serverpsjs" folders's sockets.js

Part 2 - SETUP PSMMO
1. Download PSMMO
2. Add to a webserver
3. Change pokemon showdown server @ funks.js and replace 'var server = "elloworld.ddns.net";' with your ip address


Info
-----
Changes to Pokemon Showdown:
   bot.js - comes with bot that battles
   mmo.js - mmo commands (encounter pokemon, moving in maps, chat, etc.)
   sockets.js - snippet of code for bot.js to work (hackish)

Bot
-----
Change its name on client @ vars.js - vars.wildPokemonBot
Change its name on server @ bot.js - bot.name
