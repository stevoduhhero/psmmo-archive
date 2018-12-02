/**
 * Pokemon Showdown Battle
 *
 * This is the main file for handling battle animations
 *
 * Licensing note: PS's client has complicated licensing:
 * - The client as a whole is AGPLv3
 * - The battle replay/animation engine (battle-*.ts) by itself is MIT
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

/** [id, element?, ...misc] */

/** [name, minTimeLeft, maxTimeLeft] */var




Pokemon = /*#__PURE__*/function () {



  /**
                                     * A string representing information extractable from textual
                                     * messages: side, nickname.
                                     *
                                     * Will be the empty string between Team Preview and the first
                                     * switch-in.
                                     *
                                     * Examples: `p1: Unown` or `p2: Sparky`
                                     */

  /**
                                         * A string representing visible information not included in
                                         * ident: species, level, gender, shininess. Level is left off
                                         * if it's 100; gender is left off if it's genderless.
                                         *
                                         * Note: Can be partially filled out in Team Preview, because certain
                                         * forme information and shininess isn't visible there. In those
                                         * cases, details can change during the first switch-in, but will
                                         * otherwise not change over the course of a game.
                                         *
                                         * Examples: `Mimikyu, L50, F`, `Steelix, M, shiny`
                                         */

  /**
                                             * `` `${ident}|${details}` ``. Tracked for ease of searching.
                                             *
                                             * As with ident and details, will only change during the first
                                             * switch-in.
                                             */






























  /** [[moveName, ppUsed]] */





  function Pokemon(data, side) {this.name = '';this.species = '';this.ident = '';this.details = '';this.searchid = '';this.side = void 0;this.slot = 0;this.fainted = false;this.hp = 0;this.maxhp = 1000;this.level = 100;this.gender = '';this.shiny = false;this.hpcolor = 'g';this.moves = [];this.ability = '';this.baseAbility = '';this.item = '';this.itemEffect = '';this.prevItem = '';this.prevItemEffect = '';this.boosts = {};this.status = '';this.statusStage = 0;this.volatiles = {};this.turnstatuses = {};this.movestatuses = {};this.weightkg = 0;this.lastMove = '';this.moveTrack = [];this.statusData = { sleepTurns: 0, toxicTurns: 0 };this.sprite = void 0;
    this.side = side;
    this.species = data.species;

    // TODO: stop doing this
    Object.assign(this, Tools.getTemplate(data.species));
    Object.assign(this, data);

    this.sprite = side.battle.scene.addPokemonSprite(this);
  }var _proto = Pokemon.prototype;_proto.

  isActive = function isActive() {
    return this.side.active.includes(this);
  };_proto.

  getHPColor = function getHPColor() {
    if (this.hpcolor) return this.hpcolor;
    var ratio = this.hp / this.maxhp;
    if (ratio > 0.5) return 'g';
    if (ratio > 0.2) return 'y';
    return 'r';
  };_proto.
  getHPColorClass = function getHPColorClass() {
    switch (this.getHPColor()) {
      case 'y':return ' hpbar-yellow';
      case 'r':return ' hpbar-red';}

    return '';
  };_proto.
  getPixelRange = function getPixelRange(pixels, color) {
    var epsilon = 0.5 / 714;

    if (pixels === 0) return [0, 0];
    if (pixels === 1) return [0 + epsilon, 2 / 48 - epsilon];
    if (pixels === 9) {
      if (color === 'y') {// ratio is > 0.2
        return [0.2 + epsilon, 10 / 48 - epsilon];
      } else {// ratio is <= 0.2
        return [9 / 48, 0.2];
      }
    }
    if (pixels === 24) {
      if (color === 'g') {// ratio is > 0.5
        return [0.5 + epsilon, 25 / 48 - epsilon];
      } else {// ratio is exactly 0.5
        return [0.5, 0.5];
      }
    }
    if (pixels === 48) return [1, 1];

    return [pixels / 48, (pixels + 1) / 48 - epsilon];
  };_proto.
  getFormattedRange = function getFormattedRange(range, precision, separator) {
    if (range[0] === range[1]) {
      var percentage = Math.abs(range[0] * 100);
      if (Math.floor(percentage) === percentage) {
        return percentage + '%';
      }
      return percentage.toFixed(precision) + '%';
    }
    var lower, upper;
    if (precision === 0) {
      lower = Math.floor(range[0] * 100);
      upper = Math.ceil(range[1] * 100);
    } else {
      lower = (range[0] * 100).toFixed(precision);
      upper = (range[1] * 100).toFixed(precision);
    }
    return lower + separator + upper + '%';
  };
  // Returns [min, max] damage dealt as a proportion of total HP from 0 to 1
  _proto.getDamageRange = function getDamageRange(damage) {
    if (damage[1] !== 48) {
      var ratio = damage[0] / damage[1];
      return [ratio, ratio];
    } else if (damage.length === undefined) {
      // wrong pixel damage.
      // this case exists for backward compatibility only.
      return [damage[2] / 100, damage[2] / 100];
    }
    // pixel damage
    var oldrange = this.getPixelRange(damage[3], damage[4]);
    var newrange = this.getPixelRange(damage[3] + damage[0], this.hpcolor);
    if (damage[0] === 0) {
      // no change in displayed pixel width
      return [0, newrange[1] - newrange[0]];
    }
    if (oldrange[0] < newrange[0]) {// swap order
      var r = oldrange;
      oldrange = newrange;
      newrange = r;
    }
    return [oldrange[0] - newrange[1], oldrange[1] - newrange[0]];
  };_proto.
  healthParse = function healthParse(hpstring, parsedamage, heal) {
    // returns [delta, denominator, percent(, oldnum, oldcolor)] or null
    if (!hpstring || !hpstring.length) return null;
    var parenIndex = hpstring.lastIndexOf('(');
    if (parenIndex >= 0) {
      // old style damage and health reporting
      if (parsedamage) {
        var damage = parseFloat(hpstring);
        // unusual check preseved for backward compatbility
        if (isNaN(damage)) damage = 50;
        if (heal) {
          this.hp += this.maxhp * damage / 100;
          if (this.hp > this.maxhp) this.hp = this.maxhp;
        } else {
          this.hp -= this.maxhp * damage / 100;
        }
        // parse the absolute health information
        var ret = this.healthParse(hpstring);
        if (ret && ret[1] === 100) {
          // support for old replays with nearest-100th damage and health
          return [damage, 100, damage];
        }
        // complicated expressions preserved for backward compatibility
        var percent = Math.round(Math.ceil(damage * 48 / 100) / 48 * 100);
        var pixels = Math.ceil(damage * 48 / 100);
        return [pixels, 48, percent];
      }
      if (hpstring.substr(hpstring.length - 1) !== ')') {
        return null;
      }
      hpstring = hpstring.substr(parenIndex + 1, hpstring.length - parenIndex - 2);
    }

    var oldhp = this.fainted ? 0 : this.hp || 1;
    var oldmaxhp = this.maxhp;
    var oldwidth = this.hpWidth(100);
    var oldcolor = this.hpcolor;

    this.side.battle.parseHealth(hpstring, this);
    if (oldmaxhp === 0) {// max hp not known before parsing this message
      oldmaxhp = oldhp = this.maxhp;
    }

    var oldnum = oldhp ? Math.floor(oldhp / oldmaxhp * this.maxhp) || 1 : 0;
    var delta = this.hp - oldnum;
    var deltawidth = this.hpWidth(100) - oldwidth;
    return [delta, this.maxhp, deltawidth, oldnum, oldcolor];
  };_proto.
  checkDetails = function checkDetails(details) {
    if (!details) return false;
    if (details === this.details) return true;
    if (this.searchid) return false;
    if (details.indexOf(', shiny') >= 0) {
      if (this.checkDetails(details.replace(', shiny', ''))) return true;
    }
    // the actual forme was hidden on Team Preview
    details = details.replace(/(-[A-Za-z0-9]+)?(, |$)/, '-*$2');
    return details === this.details;
  };_proto.
  getIdent = function getIdent() {
    var slots = ['a', 'b', 'c', 'd', 'e', 'f'];
    return this.ident.substr(0, 2) + slots[this.slot] + this.ident.substr(2);
  };_proto.
  removeVolatile = function removeVolatile(volatile) {
    this.sprite.removeEffect(volatile);
    if (!this.hasVolatile(volatile)) return;
    delete this.volatiles[volatile];
  };_proto.
  addVolatile = function addVolatile(volatile) {
    var battle = this.side.battle;for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {args[_key - 1] = arguments[_key];}
    if (this.hasVolatile(volatile) && !args.length) return;
    this.volatiles[volatile] = [volatile].concat(args);
    this.sprite.addEffect(volatile);
  };_proto.
  hasVolatile = function hasVolatile(volatile) {
    return !!this.volatiles[volatile];
  };_proto.
  removeTurnstatus = function removeTurnstatus(volatile) {
    this.sprite.removeEffect(volatile);
    if (!this.hasTurnstatus(volatile)) return;
    delete this.turnstatuses[volatile];
  };_proto.
  addTurnstatus = function addTurnstatus(volatile) {
    volatile = toId(volatile);
    var battle = this.side.battle;
    this.sprite.addEffect(volatile);
    if (this.hasTurnstatus(volatile)) return;
    this.turnstatuses[volatile] = [volatile];
  };_proto.
  hasTurnstatus = function hasTurnstatus(volatile) {
    return !!this.turnstatuses[volatile];
  };_proto.
  clearTurnstatuses = function clearTurnstatuses() {
    for (var _id in this.turnstatuses) {
      this.removeTurnstatus(_id);
    }
    this.turnstatuses = {};
  };_proto.
  removeMovestatus = function removeMovestatus(volatile) {
    this.sprite.removeEffect(volatile);
    if (!this.hasMovestatus(volatile)) return;
    delete this.movestatuses[volatile];
  };_proto.
  addMovestatus = function addMovestatus(volatile) {
    volatile = toId(volatile);
    if (this.hasMovestatus(volatile)) return;
    this.movestatuses[volatile] = [volatile];
    this.sprite.addEffect(volatile);
  };_proto.
  hasMovestatus = function hasMovestatus(volatile) {
    return !!this.movestatuses[volatile];
  };_proto.
  clearMovestatuses = function clearMovestatuses() {
    for (var _id2 in this.movestatuses) {
      this.removeMovestatus(_id2);
    }
    this.movestatuses = {};
  };_proto.
  clearVolatiles = function clearVolatiles() {
    this.volatiles = {};
    this.clearTurnstatuses();
    this.clearMovestatuses();
    this.sprite.clearEffects();
  };_proto.
  markMove = function markMove(moveName, pp, recursionSource) {
    if (recursionSource === this.ident) return;
    if (pp === undefined) pp = 1;
    moveName = Tools.getMove(moveName).name;
    if (moveName === 'Struggle') return;
    if (this.volatiles.transform) {
      // make sure there is no infinite recursion if both Pokemon are transformed into each other
      if (!recursionSource) recursionSource = this.ident;
      this.volatiles.transform[1].markMove(moveName, 0, recursionSource);
      moveName = '*' + moveName;
    }
    for (var i = 0; i < this.moveTrack.length; i++) {
      if (moveName === this.moveTrack[i][0]) {
        this.moveTrack[i][1] += pp;
        if (this.moveTrack[i][1] < 0) this.moveTrack[i][1] = 0;
        return;
      }
    }
    this.moveTrack.push([moveName, pp]);
  };_proto.
  markAbility = function markAbility(ability, isNotBase) {
    ability = Tools.getAbility(ability).name;
    this.ability = ability;
    if (!this.baseAbility && !isNotBase) {
      this.baseAbility = ability;
    }
  };_proto.
  htmlName = function htmlName() {
    return '<span class="battle-nickname' + (this.side.n === 0 ? '' : '-foe') + '" title="' + this.species + '">' + Tools.escapeHTML(this.name) + '</span>';
  };_proto.
  getName = function getName(shortName) {
    if (this.side.n === 0) {
      return this.htmlName();
    } else {
      return (shortName ? "Opposing " : "The opposing ") + this.htmlName();
    }
  };_proto.
  getLowerName = function getLowerName(shortName) {
    if (this.side.n === 0) {
      return this.htmlName();
    } else {
      return (shortName ? "opposing " : "the opposing ") + this.htmlName();
    }
  };_proto.
  getTitle = function getTitle() {
    var titlestring = '(' + this.ability + ') ';

    for (var i = 0; i < this.moves.length; i++) {
      if (i != 0) titlestring += ' / ';
      titlestring += Tools.getMove(this.moves[i]).name;
    }
    return titlestring;
  };_proto.
  getFullName = function getFullName(plaintext) {
    var name = this.side && this.side.n && (this.side.battle.ignoreOpponent || this.side.battle.ignoreNicks) ? this.species : Tools.escapeHTML(this.name);
    if (name !== this.species) {
      if (plaintext) {
        name += ' (' + this.species + ')';
      } else {
        name = '<span class="battle-nickname' + (this.side && this.side.n === 0 ? '' : '-foe') + '" title="' + this.species + '">' + name + ' <small>(' + this.species + ')</small>' + '</span>';
      }
    }
    if (plaintext) {
      if (this === this.side.active[0]) {
        name += ' (active)';
      } else if (this.fainted) {
        name += ' (fainted)';
      } else {
        var statustext = '';
        if (this.hp !== this.maxhp) {
          statustext += this.hpDisplay();
        }
        if (this.status) {
          if (statustext) statustext += '|';
          statustext += this.status;
        }
        if (statustext) {
          name += ' (' + statustext + ')';
        }
      }
    }
    return name;
  };_proto.
  getBoost = function getBoost(boostStat) {
    var boostStatTable = {
      atk: 'Atk',
      def: 'Def',
      spa: 'SpA',
      spd: 'SpD',
      spe: 'Spe',
      accuracy: 'Accuracy',
      evasion: 'Evasion',
      spc: 'Spc' };

    if (!this.boosts[boostStat]) {
      return '1&times;&nbsp;' + boostStatTable[boostStat];
    }
    if (this.boosts[boostStat] > 6) this.boosts[boostStat] = 6;
    if (this.boosts[boostStat] < -6) this.boosts[boostStat] = -6;
    if (boostStat === 'accuracy' || boostStat === 'evasion') {
      if (this.boosts[boostStat] > 0) {
        var goodBoostTable = ['1&times;', '1.33&times;', '1.67&times;', '2&times;', '2.33&times;', '2.67&times;', '3&times;'];
        //let goodBoostTable = ['Normal', '+1', '+2', '+3', '+4', '+5', '+6'];
        return '' + goodBoostTable[this.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
      }
      var _badBoostTable = ['1&times;', '0.75&times;', '0.6&times;', '0.5&times;', '0.43&times;', '0.38&times;', '0.33&times;'];
      //let badBoostTable = ['Normal', '&minus;1', '&minus;2', '&minus;3', '&minus;4', '&minus;5', '&minus;6'];
      return '' + _badBoostTable[-this.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
    }
    if (this.boosts[boostStat] > 0) {
      var _goodBoostTable = ['1&times;', '1.5&times;', '2&times;', '2.5&times;', '3&times;', '3.5&times;', '4&times;'];
      //let goodBoostTable = ['Normal', '+1', '+2', '+3', '+4', '+5', '+6'];
      return '' + _goodBoostTable[this.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
    }
    var badBoostTable = ['1&times;', '0.67&times;', '0.5&times;', '0.4&times;', '0.33&times;', '0.29&times;', '0.25&times;'];
    //let badBoostTable = ['Normal', '&minus;1', '&minus;2', '&minus;3', '&minus;4', '&minus;5', '&minus;6'];
    return '' + badBoostTable[-this.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
  };_proto.
  getBoostType = function getBoostType(boostStat) {
    if (!this.boosts[boostStat]) return 'neutral';
    if (this.boosts[boostStat] > 0) return 'good';
    return 'bad';
  };_proto.
  clearVolatile = function clearVolatile() {
    this.ability = this.baseAbility;
    if (window.BattlePokedex && BattlePokedex[this.species] && BattlePokedex[this.species].weightkg) {
      this.weightkg = BattlePokedex[this.species].weightkg;
    }
    this.boosts = {};
    this.clearVolatiles();
    for (var i = 0; i < this.moveTrack.length; i++) {
      if (this.moveTrack[i][0].charAt(0) === '*') {
        this.moveTrack.splice(i, 1);
        i--;
      }
    }
    //this.lastMove = '';
    this.statusStage = 0;
  };
  /**
      * copyAll = false means Baton Pass,
      * copyAll = true means Illusion breaking
      */_proto.
  copyVolatileFrom = function copyVolatileFrom(pokemon, copyAll) {
    this.boosts = pokemon.boosts;
    this.volatiles = pokemon.volatiles;
    //this.lastMove = pokemon.lastMove; // I think
    if (!copyAll) {
      delete this.volatiles['airballoon'];
      delete this.volatiles['attract'];
      delete this.volatiles['autotomize'];
      delete this.volatiles['disable'];
      delete this.volatiles['encore'];
      delete this.volatiles['foresight'];
      delete this.volatiles['imprison'];
      delete this.volatiles['mimic'];
      delete this.volatiles['miracleeye'];
      delete this.volatiles['nightmare'];
      delete this.volatiles['smackdown'];
      delete this.volatiles['stockpile1'];
      delete this.volatiles['stockpile2'];
      delete this.volatiles['stockpile3'];
      delete this.volatiles['torment'];
      delete this.volatiles['typeadd'];
      delete this.volatiles['typechange'];
      delete this.volatiles['yawn'];
    }
    delete this.volatiles['transform'];
    delete this.volatiles['formechange'];

    pokemon.boosts = {};
    pokemon.volatiles = {};
    pokemon.sprite.removeTransform();
    pokemon.statusStage = 0;
  };_proto.
  copyTypesFrom = function copyTypesFrom(pokemon) {var _pokemon$getTypes =
    pokemon.getTypes(),types = _pokemon$getTypes[0],addedType = _pokemon$getTypes[1];
    this.addVolatile('typechange', types.join('/'));
    if (addedType) {
      this.addVolatile('typeadd', addedType);
    } else {
      this.removeVolatile('typeadd');
    }
  };_proto.
  getTypes = function getTypes() {
    var types;
    if (this.volatiles.typechange) {
      types = this.volatiles.typechange[1].split('/');
    } else {
      var species = this.getSpecies();
      types =
      window.BattleTeambuilderTable &&
      window.BattleTeambuilderTable['gen' + this.side.battle.gen] &&
      window.BattleTeambuilderTable['gen' + this.side.battle.gen].overrideType[toId(species)];

      if (types) types = types.split('/');
      if (!types) types = Tools.getTemplate(species).types || [];
    }
    var addedType = this.volatiles.typeadd ? this.volatiles.typeadd[1] : '';
    return [types, addedType];
  };_proto.
  getSpecies = function getSpecies() {
    return this.volatiles.formechange ? this.volatiles.formechange[1] : this.species;
  };_proto.
  reset = function reset() {
    this.clearVolatile();
    this.hp = this.maxhp;
    this.fainted = false;
    this.status = '';
    this.moveTrack = [];
    this.name = this.name || this.species;
  };
  // This function is used for two things:
  //   1) The percentage to display beside the HP bar.
  //   2) The width to draw an HP bar.
  //
  // This function is NOT used in the calculation of any other displayed
  // percentages or ranges, which have their own, more complex, formulae.
  _proto.hpWidth = function hpWidth(maxWidth) {
    if (this.fainted || !this.hp) return 0;

    // special case for low health...
    if (this.hp == 1 && this.maxhp > 45) return 1;

    if (this.maxhp === 48) {
      // Draw the health bar to the middle of the range.
      // This affects the width of the visual health bar *only*; it
      // does not affect the ranges displayed in any way.
      var range = this.getPixelRange(this.hp, this.hpcolor);
      var ratio = (range[0] + range[1]) / 2;
      return Math.round(maxWidth * ratio) || 1;
    }
    var percentage = Math.ceil(100 * this.hp / this.maxhp);
    if (percentage === 100 && this.hp < this.maxhp) {
      percentage = 99;
    }
    return percentage * maxWidth / 100;
  };_proto.
  hpDisplay = function hpDisplay() {var precision = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    if (this.maxhp === 100) return this.hp + '%';
    if (this.maxhp !== 48) return (this.hp / this.maxhp * 100).toFixed(precision) + '%';
    var range = this.getPixelRange(this.hp, this.hpcolor);
    return this.getFormattedRange(range, precision, 'â€“');
  };_proto.
  destroy = function destroy() {
    if (this.sprite) this.sprite.destroy();
    this.sprite = null;
    this.side = null;
  };return Pokemon;}();var


Side = /*#__PURE__*/function () {


















  /** [effectName, levels, minDuration, maxDuration] */


  function Side(battle, n) {this.battle = void 0;this.name = '';this.id = '';this.n = void 0;this.foe = null;this.spriteid = 262;this.totalPokemon = 6;this.x = 0;this.y = 0;this.z = 0;this.missedPokemon = null;this.wisher = null;this.active = [null];this.lastPokemon = null;this.pokemon = [];this.sideConditions = {};
    this.battle = battle;
    this.n = n;
    this.updateSprites();
  }var _proto2 = Side.prototype;_proto2.

  rollTrainerSprites = function rollTrainerSprites() {
    var sprites = [1, 2, 101, 102, 169, 170];
    this.spriteid = sprites[Math.floor(Math.random() * sprites.length)];
  };_proto2.

  behindx = function behindx(offset) {
    return this.x + (!this.n ? -1 : 1) * offset;
  };_proto2.
  behindy = function behindy(offset) {
    return this.y + (!this.n ? 1 : -1) * offset;
  };_proto2.
  leftof = function leftof(offset) {
    return (!this.n ? -1 : 1) * offset;
  };_proto2.
  behind = function behind(offset) {
    return this.z + (!this.n ? -1 : 1) * offset;
  };_proto2.

  clearPokemon = function clearPokemon() {for (var _i = 0, _this$pokemon =
    this.pokemon; _i < _this$pokemon.length; _i++) {var pokemon = _this$pokemon[_i];pokemon.destroy();}
    this.pokemon = [];
    for (var i = 0; i < this.active.length; i++) {this.active[i] = null;}
    this.lastPokemon = null;
  };_proto2.
  reset = function reset() {
    this.clearPokemon();
    this.updateSprites();
    this.sideConditions = {};
  };_proto2.
  updateSprites = function updateSprites() {
    this.z = this.n ? 200 : 0;
    if (this.missedPokemon) {
      this.missedPokemon.sprite.destroy();
    }
    this.missedPokemon = {
      sprite: new PokemonSprite(null, {
        x: this.leftof(-100),
        y: this.y,
        z: this.z,
        opacity: 0 },

      this.battle.scene, this.n) };

    this.missedPokemon.sprite.isMissedPokemon = true;
  };_proto2.
  setAvatar = function setAvatar(spriteid) {
    this.spriteid = spriteid;
  };_proto2.
  setName = function setName(name, spriteid) {
    if (name) this.name = name || '';
    this.id = toId(this.name);
    if (spriteid) {
      this.spriteid = spriteid;
    } else {
      this.rollTrainerSprites();
      if (this.foe && this.spriteid === this.foe.spriteid) this.rollTrainerSprites();
    }
    if (this.battle.stagnateCallback) this.battle.stagnateCallback(this.battle);
  };_proto2.
  getTeamName = function getTeamName() {
    if (this === this.battle.mySide) return "Your team";
    return "The opposing team";
  };_proto2.
  getLowerTeamName = function getLowerTeamName() {
    if (this === this.battle.mySide) return "your team";
    return "the opposing team";
  };_proto2.
  addSideCondition = function addSideCondition(effect) {
    var elem, curelem;
    var condition = effect.id;
    if (this.sideConditions[condition]) {
      if (condition === 'spikes' || condition === 'toxicspikes') {
        this.sideConditions[condition][1]++;
      }
      this.battle.scene.addSideCondition(this.n, condition);
      return;
    }
    // Side conditions work as: [effectName, levels, minDuration, maxDuration]
    switch (condition) {
      case 'auroraveil':
        this.sideConditions[condition] = [effect.name, 1, 5, 8];
        break;
      case 'reflect':
        this.sideConditions[condition] = [effect.name, 1, 5, this.battle.gen >= 4 ? 8 : 0];
        break;
      case 'safeguard':
        this.sideConditions[condition] = [effect.name, 1, 5, 0];
        break;
      case 'lightscreen':
        this.sideConditions[condition] = [effect.name, 1, 5, this.battle.gen >= 4 ? 8 : 0];
        break;
      case 'mist':
        this.sideConditions[condition] = [effect.name, 1, 5, 0];
        break;
      case 'tailwind':
        this.sideConditions[condition] = [effect.name, 1, this.battle.gen >= 5 ? 4 : 3, 0];
        break;
      case 'luckychant':
        this.sideConditions[condition] = [effect.name, 1, 5, 0];
        break;
      case 'stealthrock':
        this.sideConditions[condition] = [effect.name, 1, 0, 0];
        break;
      case 'spikes':
        this.sideConditions[condition] = [effect.name, 1, 0, 0];
        break;
      case 'toxicspikes':
        this.sideConditions[condition] = [effect.name, 1, 0, 0];
        break;
      case 'stickyweb':
        this.sideConditions[condition] = [effect.name, 1, 0, 0];
        break;
      default:
        this.sideConditions[condition] = [effect.name, 1, 0, 0];
        break;}

    this.battle.scene.addSideCondition(this.n, condition);
  };_proto2.
  removeSideCondition = function removeSideCondition(condition) {
    var id = toId(condition);
    if (!this.sideConditions[id]) return;
    delete this.sideConditions[id];
    this.battle.scene.removeSideCondition(this.n, id);
  };_proto2.
  newPokemon = function newPokemon(data) {var replaceSlot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
    var pokeobj;
    var poke = new Pokemon(data, this);
    if (!poke.ability && poke.baseAbility) poke.ability = poke.baseAbility;
    poke.reset();

    if (replaceSlot >= 0) {
      this.pokemon[replaceSlot] = poke;
    } else {
      this.pokemon.push(poke);
    }
    if (this.pokemon.length > this.totalPokemon || this.battle.speciesClause) {
      // check for Illusion
      var existingTable = {};
      var toRemove = -1;
      for (var poke1i = 0; poke1i < this.pokemon.length; poke1i++) {
        var poke1 = this.pokemon[poke1i];
        if (!poke1.searchid) continue;
        if (poke1.searchid in existingTable) {
          var poke2i = existingTable[poke1.searchid];
          var poke2 = this.pokemon[poke2i];
          if (poke === poke1) {
            toRemove = poke2i;
          } else if (poke === poke2) {
            toRemove = poke1i;
          } else if (this.active.indexOf(poke1) >= 0) {
            toRemove = poke2i;
          } else if (this.active.indexOf(poke2) >= 0) {
            toRemove = poke1i;
          } else if (poke1.fainted && !poke2.fainted) {
            toRemove = poke2i;
          } else {
            toRemove = poke1i;
          }
          break;
        }
        existingTable[poke1.searchid] = poke1i;
      }
      if (toRemove >= 0) {
        if (this.pokemon[toRemove].fainted) {
          // A fainted Pokemon was actually a Zoroark
          var illusionFound = null;
          for (var i = 0; i < this.pokemon.length; i++) {
            var curPoke = this.pokemon[i];
            if (curPoke === poke) continue;
            if (curPoke.fainted) continue;
            if (this.active.indexOf(curPoke) >= 0) continue;
            if (curPoke.species === 'Zoroark' || curPoke.species === 'Zorua' || curPoke.ability === 'Illusion') {
              illusionFound = curPoke;
              break;
            }
          }
          if (!illusionFound) {
            // This is Hackmons; we'll just guess a random unfainted Pokemon.
            // This will keep the fainted Pokemon count correct, and will
            // eventually become correct as incorrect guesses are switched in
            // and reguessed.
            for (var _i2 = 0; _i2 < this.pokemon.length; _i2++) {
              var _curPoke = this.pokemon[_i2];
              if (_curPoke === poke) continue;
              if (_curPoke.fainted) continue;
              if (this.active.indexOf(_curPoke) >= 0) continue;
              illusionFound = _curPoke;
              break;
            }
          }
          if (illusionFound) {
            illusionFound.fainted = true;
            illusionFound.hp = 0;
            illusionFound.status = '';
          }
        }
        this.pokemon.splice(toRemove, 1);
      }
    }
    this.battle.scene.updateSidebar(this);

    return poke;
  };_proto2.

  switchIn = function switchIn(pokemon, slot) {
    if (slot === undefined) slot = pokemon.slot;
    this.active[slot] = pokemon;
    pokemon.slot = slot;
    pokemon.clearVolatile();
    pokemon.lastMove = '';
    this.battle.lastMove = 'switch-in';
    if (this.lastPokemon && (this.lastPokemon.lastMove === 'batonpass' || this.lastPokemon.lastMove === 'zbatonpass')) {
      pokemon.copyVolatileFrom(this.lastPokemon);
    }

    if (pokemon.side.n === 0) {
      this.battle.message('Go! ' + pokemon.getFullName() + '!');
    } else {
      this.battle.message('' + Tools.escapeHTML(pokemon.side.name) + ' sent out ' + pokemon.getFullName() + '!');
    }

    pokemon.sprite.animSummon(pokemon, slot);

    if (this.battle.switchCallback) this.battle.switchCallback(this.battle, this);
  };_proto2.
  dragIn = function dragIn(pokemon) {var slot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : pokemon.slot;
    this.battle.message('' + pokemon.getFullName() + ' was dragged out!');
    var oldpokemon = this.active[slot];
    if (oldpokemon === pokemon) return;
    this.lastPokemon = oldpokemon;
    if (oldpokemon) {
      oldpokemon.sprite.animDragOut(oldpokemon);
      oldpokemon.clearVolatile();
    }
    pokemon.clearVolatile();
    pokemon.lastMove = '';
    this.battle.lastMove = 'switch-in';
    this.active[slot] = pokemon;
    pokemon.slot = slot;

    pokemon.sprite.animDragIn(pokemon, slot);

    if (this.battle.dragCallback) this.battle.dragCallback(this.battle, this);
  };_proto2.
  replace = function replace(pokemon) {var slot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : pokemon.slot;
    var oldpokemon = this.active[slot];
    if (pokemon === oldpokemon) return;
    this.lastPokemon = oldpokemon;
    pokemon.clearVolatile();
    if (oldpokemon) {
      pokemon.lastMove = oldpokemon.lastMove;
      pokemon.hp = oldpokemon.hp;
      pokemon.maxhp = oldpokemon.maxhp;
      pokemon.status = oldpokemon.status;
      pokemon.copyVolatileFrom(oldpokemon, true);
      // we don't know anything about the illusioned pokemon except that it's not fainted
      // technically we also know its status but only at the end of the turn, not here
      oldpokemon.fainted = false;
      oldpokemon.hp = oldpokemon.maxhp;
      oldpokemon.status = '???';
    }
    this.active[slot] = pokemon;
    pokemon.slot = slot;

    if (oldpokemon) {
      oldpokemon.sprite.animUnsummon(oldpokemon, true);
    }
    pokemon.sprite.animSummon(pokemon, slot, true);
    // not sure if we want a different callback
    if (this.battle.dragCallback) this.battle.dragCallback(this.battle, this);
  };_proto2.
  switchOut = function switchOut(pokemon) {var slot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : pokemon.slot;
    if (pokemon.lastMove !== 'batonpass' && pokemon.lastMove !== 'zbatonpass') {
      pokemon.clearVolatile();
    } else {
      pokemon.removeVolatile('transform');
      pokemon.removeVolatile('formechange');
    }
    if (pokemon.lastMove === 'uturn' || pokemon.lastMove === 'voltswitch') {
      this.battle.message('' + pokemon.getName() + ' went back to ' + Tools.escapeHTML(pokemon.side.name) + '!');
    } else if (pokemon.lastMove !== 'batonpass' && pokemon.lastMove !== 'zbatonpass') {
      if (pokemon.side.n === 0) {
        this.battle.message('' + pokemon.getName() + ', come back!');
      } else {
        this.battle.message('' + Tools.escapeHTML(pokemon.side.name) + ' withdrew ' + pokemon.getFullName() + '!');
      }
    }
    if (pokemon.statusData.toxicTurns) pokemon.statusData.toxicTurns = 1;
    if (this.battle.gen === 5) pokemon.statusData.sleepTurns = 0;
    this.lastPokemon = pokemon;
    this.active[slot] = null;

    pokemon.sprite.animUnsummon(pokemon);
  };_proto2.
  swapTo = function swapTo(pokemon, slot, kwargs) {
    if (pokemon.slot === slot) return;
    var target = this.active[slot];

    if (!kwargs.silent) {
      var fromeffect = Tools.getEffect(kwargs.from);
      switch (fromeffect.id) {
        case 'allyswitch':
          this.battle.message('<small>' + pokemon.getName() + ' and ' + target.getLowerName() + ' switched places.</small>');
          break;
        default:
          this.battle.message('<small>' + pokemon.getName() + ' moved to the center!</small>');
          break;}

    }

    var oslot = pokemon.slot;

    pokemon.slot = slot;
    if (target) target.slot = oslot;

    this.active[slot] = pokemon;
    this.active[oslot] = target;

    pokemon.sprite.animUnsummon(pokemon, true);
    if (target) target.sprite.animUnsummon(target, true);

    pokemon.sprite.animSummon(pokemon, slot, true);
    if (target) target.sprite.animSummon(target, oslot, true);
  };_proto2.
  swapWith = function swapWith(pokemon, target, kwargs) {
    // method provided for backwards compatibility only
    if (pokemon === target) return;

    if (!kwargs.silent) {
      var fromeffect = Tools.getEffect(kwargs.from);
      switch (fromeffect.id) {
        case 'allyswitch':
          this.battle.message('<small>' + pokemon.getName() + ' and ' + target.getLowerName() + ' switched places.</small>');
          break;}

    }

    var oslot = pokemon.slot;
    var nslot = target.slot;

    pokemon.slot = nslot;
    target.slot = oslot;
    this.active[nslot] = pokemon;
    this.active[oslot] = target;

    pokemon.sprite.animUnsummon(pokemon, true);
    target.sprite.animUnsummon(target, true);

    pokemon.sprite.animSummon(pokemon, nslot, true);
    target.sprite.animSummon(target, oslot, true);
  };_proto2.
  faint = function faint(pokemon) {var slot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : pokemon.slot;
    pokemon.clearVolatile();
    this.lastPokemon = pokemon;
    this.active[slot] = null;

    this.battle.message('' + pokemon.getName() + ' fainted!');
    if (window.Config && Config.server && Config.server.afd && !Config.server.afdFaint) {
      this.battle.message('<div class="broadcast-red" style="font-size:10pt">Needed that one alive? Buy <strong>Max Revive DLC</strong>, yours for only $9.99!<br /> <a href="/view-dlc">CLICK HERE!</a></div>');
      Config.server.afdFaint = true;
    }

    pokemon.fainted = true;
    pokemon.hp = 0;

    pokemon.sprite.animFaint(pokemon);
    if (this.battle.faintCallback) this.battle.faintCallback(this.battle, this);
	
	//mmo gain exp
	var expEl = this.battle.$expEl,
	who = ((this === this.battle.mySide) ? "you" : "opp");
	if (who === "opp" && this.battle.tier === "psmmo") {
		var actualTeamSlot = vars.slotFromPackage(this.battle.mySide.active[0]),
		oppLevel = this.battle.mySide.foe.pokemon[0].level;
		vars.gainExp(expEl, actualTeamSlot, oppLevel);
		vars.updateExp(expEl, actualTeamSlot, "animate", 500);
	}
	
  };_proto2.
  destroy = function destroy() {
    this.clearPokemon();
    this.battle = null;
    this.foe = null;
  };return Side;}();var


Playback;(function (Playback) {Playback[Playback["Uninitialized"] = 0] = "Uninitialized";Playback[Playback["Ready"] = 1] = "Ready";Playback[Playback["Playing"] = 2] = "Playing";Playback[Playback["Paused"] = 3] = "Paused";Playback[Playback["Finished"] = 4] = "Finished";Playback[Playback["Seeking"] = 5] = "Seeking";})(Playback || (Playback = {}));var








Battle = /*#__PURE__*/function () {




  // activity queue










  // callback

















  /**
   * Has playback gotten to the point where a player has won or tied?
   * (Affects whether BGM is playing)
   */






















  // options












  // external


  function Battle($frame, $logFrame) {var id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';this.scene = void 0;this.sidesSwitched = false;this.activityQueue = [];this.preemptActivityQueue = [];this.minorQueue = [];this.activityStep = 0;this.fastForward = 0;this.fastForwardWillScroll = false;this.resultWaiting = false;this.activeMoveIsSpread = null;this.faintCallback = null;this.switchCallback = null;this.dragCallback = null;this.turnCallback = null;this.startCallback = null;this.stagnateCallback = null;this.endCallback = null;this.customCallback = null;this.errorCallback = null;this.mute = false;this.messageFadeTime = 300;this.messageShownTime = 1;this.turnsSinceMoved = 0;this.hasPreMoveMessage = false;this.turn = 0;this.ended = false;this.usesUpkeep = false;this.weather = '';this.pseudoWeather = [];this.weatherTimeLeft = 0;this.weatherMinTimeLeft = 0;this.mySide = null;this.yourSide = null;this.p1 = null;this.p2 = null;this.sides = [null, null];this.lastMove = '';this.gen = 7;this.teamPreviewCount = 0;this.speciesClause = false;this.tier = '';this.gameType = 'singles';this.rated = false;this.endLastTurnPending = false;this.totalTimeLeft = 0;this.kickingInactive = false;this.id = '';this.roomid = '';this.hardcoreMode = false;this.ignoreNicks = Tools.prefs('ignorenicks');this.ignoreOpponent = false;this.ignoreSpects = false;this.debug = false;this.joinButtons = false;this.paused = true;this.playbackState = Playback.Uninitialized;this.resumeButton = null;
    this.id = id;
    this.scene = new BattleScene(this, $frame, $logFrame);

    this.init();
  }var _proto3 = Battle.prototype;_proto3.

  removePseudoWeather = function removePseudoWeather(weather) {
    for (var i = 0; i < this.pseudoWeather.length; i++) {
      if (this.pseudoWeather[i][0] === weather) {
        this.pseudoWeather.splice(i, 1);
        this.scene.updateWeather();
        return;
      }
    }
  };_proto3.
  addPseudoWeather = function addPseudoWeather(weather, minTimeLeft, timeLeft) {
    this.pseudoWeather.push([weather, minTimeLeft, timeLeft]);
    this.scene.updateWeather();
  };_proto3.
  hasPseudoWeather = function hasPseudoWeather(weather) {
    for (var i = 0; i < this.pseudoWeather.length; i++) {
      if (this.pseudoWeather[i][0] === weather) {
        return true;
      }
    }
    return false;
  };_proto3.
  init = function init() {
    this.mySide = new Side(this, 0);
    this.yourSide = new Side(this, 1);
    this.mySide.foe = this.yourSide;
    this.yourSide.foe = this.mySide;
    this.sides = [this.mySide, this.yourSide];
    this.p1 = this.mySide;
    this.p2 = this.yourSide;
    this.gen = 7;
    this.reset();
  };_proto3.
  reset = function reset(dontResetSound) {
    // battle state
    this.turn = 0;
    this.ended = false;
    this.weather = '';
    this.weatherTimeLeft = 0;
    this.weatherMinTimeLeft = 0;
    this.pseudoWeather = [];
    this.lastMove = '';

    // DOM state
    this.scene.reset();for (var _i3 = 0, _this$sides =

    this.sides; _i3 < _this$sides.length; _i3++) {var side = _this$sides[_i3];
      if (side) side.reset();
    }

    if (this.ignoreNicks) {
      var $log = $('.battle-log .inner');
      if ($log.length) $log.addClass('hidenicks');
      var $message = $('.battle .message');
      if ($message.length) $message.addClass('hidenicks');
    }

    // activity queue state
    this.activeMoveIsSpread = null;
    this.activityStep = 0;
    this.fastForwardOff();
    $.fx.off = false;
    this.minorQueue = [];
    this.resultWaiting = false;
    this.paused = true;
    if (this.playbackState !== Playback.Seeking) {
      this.playbackState = this.activityQueue.length ? Playback.Ready : Playback.Uninitialized;
      if (!dontResetSound) this.scene.soundStop();
    }
    this.resetTurnsSinceMoved();
  };_proto3.
  destroy = function destroy() {
    this.scene.destroy();

    for (var i = 0; i < this.sides.length; i++) {
      if (this.sides[i]) this.sides[i].destroy();
      this.sides[i] = null;
    }
    this.mySide = null;
    this.yourSide = null;
    this.p1 = null;
    this.p2 = null;
  };_proto3.

  message = function message(_message, hiddenMessage) {
    this.scene.message(_message, hiddenMessage);
  };_proto3.

  switchSides = function switchSides(replay) {
    if (this.ended) {
      this.reset(true);
      this.setSidesSwitched(!this.sidesSwitched);
      this.fastForwardTo(-1);
    } else {
      var turn = this.turn;
      var paused = this.paused;
      this.reset(true);
      this.paused = paused;
      this.setSidesSwitched(!this.sidesSwitched);
      if (turn) this.fastForwardTo(turn);
      if (!paused) {
        this.play();
      } else {
        this.pause();
      }
    }
  };_proto3.
  setSidesSwitched = function setSidesSwitched(sidesSwitched) {
    this.sidesSwitched = sidesSwitched;
    if (this.sidesSwitched) {
      this.mySide = this.p2;
      this.yourSide = this.p1;
    } else {
      this.mySide = this.p1;
      this.yourSide = this.p2;
    }
    this.sides[0] = this.mySide;
    this.sides[1] = this.yourSide;
    this.sides[0].n = 0;
    this.sides[1].n = 1;
    this.sides[0].updateSprites();
    this.sides[1].updateSprites();

    // nothing else should need updating - don't call this function after sending out pokemon
  };

  //
  // activities
  //
  _proto3.start = function start() {
    this.scene.log('<div>Battle between ' + Tools.escapeHTML(this.p1.name) + ' and ' + Tools.escapeHTML(this.p2.name) + ' started!</div>');
    if (this.startCallback) this.startCallback(this);
  };_proto3.
  winner = function winner(_winner) {
    if (_winner) this.message('' + Tools.escapeHTML(_winner) + ' won the battle!');else
    this.message('Tie between ' + Tools.escapeHTML(this.p1.name) + ' and ' + Tools.escapeHTML(this.p2.name) + '!');
    this.ended = true;
	
	//mmo bot
	if (this.yourSide.name == vars.wildPokemonBot) {
		//wait a second to show expbar anim
		var self = this;
		setTimeout(function() {
			vars.send('/leave ' + self.id);
		}, 1000);
	}
  };_proto3.
  prematureEnd = function prematureEnd() {
    this.message('This replay ends here.');
    this.ended = true;
  };_proto3.
  endLastTurn = function endLastTurn() {
    if (this.endLastTurnPending) {
      this.endLastTurnPending = false;
      this.scene.updateStatbars();
    }
  };_proto3.
  setHardcoreMode = function setHardcoreMode(mode) {
    this.hardcoreMode = mode;
    this.scene.updateSidebars();
    this.scene.updateWeather(true);
  };_proto3.
  setTurn = function setTurn(turnNum) {
    turnNum = parseInt(turnNum, 10);
    if (turnNum == this.turn + 1) {
      this.endLastTurnPending = true;
    }
    if (this.turn && !this.usesUpkeep) this.updatePseudoWeatherLeft(); // for compatibility with old replays
    this.turn = turnNum;

    if (this.mySide.active[0]) this.mySide.active[0].clearTurnstatuses();
    if (this.mySide.active[1]) this.mySide.active[1].clearTurnstatuses();
    if (this.mySide.active[2]) this.mySide.active[2].clearTurnstatuses();
    if (this.yourSide.active[0]) this.yourSide.active[0].clearTurnstatuses();
    if (this.yourSide.active[1]) this.yourSide.active[1].clearTurnstatuses();
    if (this.yourSide.active[2]) this.yourSide.active[2].clearTurnstatuses();

    if (!this.fastForward) this.turnsSinceMoved++;

    this.scene.incrementTurn();
    this.scene.log('<h2 class="battle-history">Turn ' + turnNum + '</h2>');

    if (this.fastForward) {
      if (this.turnCallback) this.turnCallback(this);
      if (this.fastForward > -1 && turnNum >= this.fastForward) {
        this.fastForwardOff();
        if (this.endCallback) this.endCallback(this);
      }
      return;
    }

    if (this.turnCallback) this.turnCallback(this);
  };_proto3.
  resetTurnsSinceMoved = function resetTurnsSinceMoved() {
    this.turnsSinceMoved = 0;
    this.scene.acceleration = this.messageFadeTime < 150 ? 2 : 1;
  };_proto3.
  updateToxicTurns = function updateToxicTurns() {
    for (var i = 0; i < this.sides.length; i++) {
      for (var slot = 0; slot < this.sides[i].active.length; slot++) {
        var poke = this.sides[i].active[slot];
        if (poke && poke.statusData && poke.statusData.toxicTurns) poke.statusData.toxicTurns++;
      }
    }
  };_proto3.
  changeWeather = function changeWeather(weatherName, poke, isUpkeep, ability) {
    var weather = toId(weatherName);
    var weatherTable = {
      sunnyday: {
        name: 'Sun',
        startMessage: 'The sunlight turned harsh!',
        abilityMessage: "'s Drought intensified the sun's rays!",
        //upkeepMessage: 'The sunlight is strong!',
        endMessage: "The sunlight faded." },

      desolateland: {
        name: "Intense Sun",
        startMessage: "The sunlight turned extremely harsh!",
        endMessage: "The harsh sunlight faded." },

      raindance: {
        name: 'Rain',
        startMessage: 'It started to rain!',
        abilityMessage: "'s Drizzle made it rain!",
        //upkeepMessage: 'Rain continues to fall!',
        endMessage: 'The rain stopped.' },

      primordialsea: {
        name: "Heavy Rain",
        startMessage: "A heavy rain began to fall!",
        endMessage: "The heavy rain has lifted!" },

      sandstorm: {
        name: 'Sandstorm',
        startMessage: 'A sandstorm kicked up!',
        abilityMessage: "'s Sand Stream whipped up a sandstorm!",
        upkeepMessage: 'The sandstorm is raging.',
        endMessage: 'The sandstorm subsided.' },

      hail: {
        name: 'Hail',
        startMessage: 'It started to hail!',
        abilityMessage: "'s Snow Warning whipped up a hailstorm!",
        upkeepMessage: 'The hail is crashing down.',
        endMessage: 'The hail stopped.' },

      deltastream: {
        name: 'Strong Winds',
        startMessage: 'Mysterious strong winds are protecting Flying-type Pok&eacute;mon!',
        endMessage: 'The mysterious strong winds have dissipated!' } };


    if (!weather || weather === 'none') {
      weather = '';
    }
    var newWeather = weatherTable[weather];
    if (isUpkeep) {
      if (this.weather && this.weatherTimeLeft) {
        this.weatherTimeLeft--;
        if (this.weatherMinTimeLeft != 0) this.weatherMinTimeLeft--;
      }
      if (!this.fastForward) {
        this.scene.upkeepWeather();
      }
      if (newWeather && newWeather.upkeepMessage) this.message('<div><small>' + newWeather.upkeepMessage + '</small></div>');
      return;
    }
    if (newWeather) {
      var isExtremeWeather = weather === 'deltastream' || weather === 'desolateland' || weather === 'primordialsea';
      if (poke) {
        if (ability) {
          this.scene.abilityActivateAnim(poke, ability.name);
          this.message('', "<small>[" + poke.getName(true) + "'s " + ability.name + "!]</small>");
          poke.markAbility(ability.name);
          this.message('<small>' + newWeather.startMessage + '</small>');
        } else {
          this.message('<small>' + poke.getName() + newWeather.abilityMessage + '</small>'); // for backwards compatibility
        }
        this.weatherTimeLeft = this.gen <= 5 || isExtremeWeather ? 0 : 8;
        this.weatherMinTimeLeft = this.gen <= 5 || isExtremeWeather ? 0 : 5;
      } else if (isUpkeep) {
        this.scene.log('<div><small>' + newWeather.upkeepMessage + '</small></div>');
        this.weatherTimeLeft = 0;
        this.weatherMinTimeLeft = 0;
      } else if (isExtremeWeather) {
        this.message('<small>' + newWeather.startMessage + '</small>');
        this.weatherTimeLeft = 0;
        this.weatherMinTimeLeft = 0;
      } else {
        this.message('<small>' + newWeather.startMessage + '</small>');
        this.weatherTimeLeft = this.gen <= 3 ? 5 : 8;
        this.weatherMinTimeLeft = this.gen <= 3 ? 0 : 5;
      }
    }
    if (this.weather && !newWeather) {
      this.message('<small>' + weatherTable[this.weather].endMessage + '</small>');
    }
    this.weather = weather;
    this.scene.updateWeather();
  };_proto3.
  updatePseudoWeatherLeft = function updatePseudoWeatherLeft() {
    for (var i = 0; i < this.pseudoWeather.length; i++) {
      var pWeather = this.pseudoWeather[i];
      if (pWeather[1]) pWeather[1]--;
      if (pWeather[2]) pWeather[2]--;
    }
    for (var _i4 = 0; _i4 < this.sides.length; _i4++) {
      for (var _id3 in this.sides[_i4].sideConditions) {
        var cond = this.sides[_i4].sideConditions[_id3];
        if (cond[2]) cond[2]--;
        if (cond[3]) cond[3]--;
      }
    }
    this.scene.updateWeather();
  };_proto3.
  useMove = function useMove(pokemon, move, target, kwargs) {
    var fromeffect = Tools.getEffect(kwargs.from);
    pokemon.clearMovestatuses();
    if (move.id === 'focuspunch') {
      pokemon.removeTurnstatus('focuspunch');
    }
    pokemon.sprite.updateStatbar(pokemon);
    if (!target) {
      target = pokemon.side.foe.active[0];
    }
    if (!target) {
      target = pokemon.side.foe.missedPokemon;
    }
    if (!kwargs.silent) {
      if (kwargs.zeffect) {
        this.message('<small>' + pokemon.getName() + ' unleashes its full-force Z-Move!</small>', '');
      }
      switch (fromeffect.id) {
        case 'snatch':
          break;
        case 'magicbounce':
        case 'magiccoat':
        case 'rebound':
          if (fromeffect.id === 'magiccoat') {
            this.scene.resultAnim(pokemon, "Bounced", 'good');
            pokemon.addTurnstatus('magiccoat');
          } else {
            this.scene.abilityActivateAnim(pokemon, fromeffect.name);
            this.message('', "<small>[" + pokemon.getName(true) + "'s " + fromeffect.name + "!]</small>");
            pokemon.markAbility(fromeffect.name);
          }
          this.message(pokemon.getName() + " bounced the " + move.name + " back!");
          break;
        case 'metronome':
          this.message('Waggling a finger let it use <strong>' + move.name + '</strong>!');
          break;
        case 'naturepower':
          this.message('Nature Power turned into <strong>' + move.name + '</strong>!');
          break;
        case 'weatherball':
          this.message('Breakneck Blitz turned into <strong>' + move.name + '</strong> due to the weather!');
          break;
        case 'sleeptalk':
          pokemon.markMove(move.name, 0);
          this.message(pokemon.getName() + ' used <strong>' + move.name + '</strong>!');
          break;
        // Gen 1
        case 'bind':
        case 'clamp':
        case 'firespin':
        case 'wrap':
          this.message(pokemon.getName() + "'s attack continues!");
          break;
        default:
          // April Fool's 2014
          if (window.Config && Config.server && Config.server.afd && move.id === 'earthquake') {
            if (!this.fastForward) {
              $('body').css({
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0 }).
              animate({
                left: -30,
                right: 30 },
              75).animate({
                left: 30,
                right: -30 },
              100).animate({
                left: -30,
                right: 30 },
              100).animate({
                left: 30,
                right: -30 },
              100).animate({
                left: 0,
                right: 0 },
              100, function () {
                $(this).css({
                  position: 'static' });

              });
            }
            this.message(pokemon.getName() + ' used <strong>Fissure</strong>!');
            this.message('Just kidding! It was <strong>Earthquake</strong>!');
          } else if (window.Config && Config.server && Config.server.afd && move.id === 'stealthrock') {
            var srNames = ['Sneaky Pebbles', 'Sly Rubble', 'Subtle Sediment', 'Buried Bedrock', 'Camouflaged Cinnabar', 'Clandestine Cobblestones', 'Cloaked Clay', 'Concealed Ore', 'Covert Crags', 'Crafty Coal', 'Discreet Bricks', 'Disguised Debris', 'Espionage Pebbles', 'Furtive Fortress', 'Hush-Hush Hardware', 'Incognito Boulders', 'Invisible Quartz', 'Masked Minerals', 'Mischievous Masonry', 'Obscure Ornaments', 'Private Paragon', 'Secret Solitaire', 'Sheltered Sand', 'Surreptitious Sapphire', 'Undercover Ultramarine'];
            this.message(pokemon.getName() + ' used <strong>' + srNames[Math.floor(Math.random() * srNames.length)] + '</strong>!');
          } else if (window.Config && Config.server && Config.server.afd && move.id === 'extremespeed') {
            var fastWords = ['H-Hayai', 'Masaka', 'Its fast'];
            this.message(pokemon.getName() + ' used <strong>' + move.name + '</strong>!');
            this.message('<strong>' + fastWords[Math.floor(Math.random() * fastWords.length)] + '</strong>!');
          } else if (window.Config && Config.server && Config.server.afd && move.id === 'aerialace') {
            this.message(pokemon.getName() + ' used <strong>Tsubame Gaeshi</strong>!');
            // } else if (window.Config && Config.server && Config.server.afd && (move.id === 'metronome' || move.id === 'sleeptalk' || move.id === 'assist')) {
            // 	this.message(pokemon.getName() + ' used <strong>' + move.name + '</strong>!');
            // 	let buttons = ["A", "B", "START", "SELECT", "UP", "DOWN", "LEFT", "RIGHT", "DEMOCRACY", "ANARCHY"];
            // 	let people = ["Zarel", "The Immortal", "Diatom", "Nani Man", "shaymin", "apt-get", "sirDonovan", "Arcticblast", "Trickster"];
            // 	let button;
            // 	for (let i = 0; i < 10; i++) {
            // 		let name = people[Math.floor(Math.random() * people.length)];
            // 		if (!button) button = buttons[Math.floor(Math.random() * buttons.length)];
            // 		this.scene.log('<div class="chat"><strong style="' + hashColor(toUserid(name)) + '" class="username" data-name="' + Tools.escapeHTML(name) + '">' + Tools.escapeHTML(name) + ':</strong> <em>' + button + '</em></div>');
            // 		button = (name === 'Diatom' ? "thanks diatom" : null);
            // 	}
          } else {
            this.message(pokemon.getName() + ' used <strong>' + move.name + '</strong>!');
          }
          if (!fromeffect.id || fromeffect.id === 'pursuit') {
            var moveName = move.name;
            if (move.isZ) {
              pokemon.item = move.isZ;
              var item = Tools.getItem(move.isZ);
              if (item.zMoveFrom) moveName = item.zMoveFrom;
            } else if (move.name.slice(0, 2) === 'Z-') {
              moveName = moveName.slice(2);
              move = Tools.getMove(moveName);
              if (window.BattleItems) {
                for (var _item in BattleItems) {
                  if (BattleItems[_item].zMoveType === move.type) pokemon.item = _item;
                }
              }
            }
            var pp = target && target.side !== pokemon.side && toId(target.ability) === 'pressure' ? 2 : 1;
            pokemon.markMove(moveName, pp);
          }
          break;}

      if (window.Config && Config.server && Config.server.afd && move.id === 'taunt') {
        var quotes = [
        "Yo mama so fat, she 4x resists Ice- and Fire-type attacks!",
        "Yo mama so ugly, Captivate raises her opponent's Special Attack!",
        "Yo mama so dumb, she lowers her Special Attack when she uses Nasty Plot!",
        "Yo mama so dumb, she thought Sylveon would be Light Type!"];

        var quote = quotes[(this.p1.name.charCodeAt(2) + this.p2.name.charCodeAt(2) + this.turn) % quotes.length];
        this.message(pokemon.getName() + " said, \"" + quote + "\"");
      }
    }
    if (!this.fastForward && !kwargs.still) {
      // skip
      if (kwargs.miss && target.side) {
        target = target.side.missedPokemon;
      }
      if (kwargs.notarget || !target) {
        target = pokemon.side.foe.missedPokemon;
      }
      if (kwargs.prepare || kwargs.anim === 'prepare') {
        this.scene.runPrepareAnim(move.id, pokemon, target);
      } else if (!kwargs.notarget) {
        var usedMove = kwargs.anim ? Tools.getMove(kwargs.anim) : move;
        if (kwargs.spread) {
          this.activeMoveIsSpread = kwargs.spread;
          var targets = [pokemon];
          var hitPokemon = kwargs.spread.split(',');
          if (hitPokemon[0] !== '.') {for (var _i5 = 0; _i5 <
            hitPokemon.length; _i5++) {var _target = hitPokemon[_i5];
              targets.push(this.getPokemon(_target + ': ?'));
            }
          } else {
            // if hitPokemon[0] === '.' then no target was hit by the attack
            targets.push(target.side.missedPokemon);
          }

          this.scene.runMoveAnim(usedMove.id, targets);
        } else {
          this.scene.runMoveAnim(usedMove.id, [pokemon, target]);
        }
      }
    }
    pokemon.lastMove = move.id;
    this.lastMove = move.id;
    if (move.id === 'wish' || move.id === 'healingwish') {
      pokemon.side.wisher = pokemon;
    }
  };_proto3.
  cantUseMove = function cantUseMove(pokemon, effect, move, kwargs) {
    pokemon.clearMovestatuses();
    pokemon.sprite.updateStatbar(pokemon);
    if (effect.id in BattleStatusAnims) {
      this.scene.runStatusAnim(effect.id, [pokemon]);
    }
    if (effect.effectType === 'Ability') {
      this.scene.abilityActivateAnim(pokemon, effect.name);
      this.message('', "<small>[" + pokemon.getName(true) + "'s " + effect.name + "!]</small>");
      pokemon.markAbility(effect.name);
    }
    switch (effect.id) {
      case 'taunt':
        this.message('' + pokemon.getName() + ' can\'t use ' + move.name + ' after the taunt!');
        pokemon.markMove(move.name, 0);
        break;
      case 'gravity':
        this.message('' + pokemon.getName() + ' can\'t use ' + move.name + ' because of gravity!');
        pokemon.markMove(move.name, 0);
        break;
      case 'healblock':
        this.message('' + pokemon.getName() + ' can\'t use ' + move.name + ' because of Heal Block!');
        pokemon.markMove(move.name, 0);
        break;
      case 'imprison':
        this.message('' + pokemon.getName() + ' can\'t use its sealed ' + move.name + '!');
        pokemon.markMove(move.name, 0);
        break;
      case 'throatchop':
        this.message('The effects of Throat Chop prevent ' + pokemon.getName() + ' from using certain moves!');
        break;
      case 'par':
        this.scene.resultAnim(pokemon, 'Paralyzed', 'par');
        this.message('' + pokemon.getName() + ' is paralyzed! It can\'t move!');
        break;
      case 'frz':
        this.scene.resultAnim(pokemon, 'Frozen', 'frz');
        this.message('' + pokemon.getName() + ' is frozen solid!');
        break;
      case 'slp':
        this.scene.resultAnim(pokemon, 'Asleep', 'slp');
        pokemon.statusData.sleepTurns++;
        this.message('' + pokemon.getName() + ' is fast asleep.');
        break;
      case 'skydrop':
        this.message('Sky Drop won\'t let ' + pokemon.getLowerName() + ' go!');
        break;
      case 'damp':
      case 'dazzling':
      case 'queenlymajesty':
        var ofpoke = this.getPokemon(kwargs.of);
        this.message(ofpoke.getName() + ' cannot use ' + move.name + '!');
        break;
      case 'truant':
        this.scene.resultAnim(pokemon, 'Loafing around', 'neutral');
        this.message('' + pokemon.getName() + ' is loafing around!');
        break;
      case 'recharge':
        this.scene.runOtherAnim('selfstatus', [pokemon]);
        this.scene.resultAnim(pokemon, 'Must recharge', 'neutral');
        this.message('<small>' + pokemon.getName() + ' must recharge!</small>');
        break;
      case 'focuspunch':
        this.scene.resultAnim(pokemon, 'Lost focus', 'neutral');
        this.message(pokemon.getName() + ' lost its focus and couldn\'t move!');
        pokemon.removeTurnstatus('focuspunch');
        break;
      case 'shelltrap':
        this.scene.resultAnim(pokemon, 'Trap failed', 'neutral');
        this.message(pokemon.getName() + '\'s shell trap didn\'t work!');
        pokemon.removeTurnstatus('shelltrap');
        break;
      case 'flinch':
        this.scene.resultAnim(pokemon, 'Flinched', 'neutral');
        this.message(pokemon.getName() + ' flinched and couldn\'t move!');
        pokemon.removeTurnstatus('focuspunch');
        break;
      case 'attract':
        this.scene.resultAnim(pokemon, 'Immobilized', 'neutral');
        this.message(pokemon.getName() + ' is immobilized by love!');
        break;
      case 'nopp':
        this.message(pokemon.getName() + ' used <strong>' + move.name + '</strong>!');
        this.message('But there was no PP left for the move!');
        break;
      default:
        this.message('<small>' + pokemon.getName() + (move.name ? ' can\'t use ' + move.name + '' : ' can\'t move') + '!</small>');
        break;}

    pokemon.sprite.animReset();
  };_proto3.
  runMinor = function runMinor(args, kwargs, preempt, nextArgs, nextKwargs) {
    var actions = '';
    var minors = this.minorQueue;
    if (args && kwargs && nextArgs && nextKwargs) {
      if (args[2] === 'Sturdy' && args[0] === '-activate') args[2] = 'ability: Sturdy';
      if (args[0] === '-crit' || args[0] === '-supereffective' || args[0] === '-resisted' || args[2] === 'ability: Sturdy') kwargs.then = '.';
      if (args[0] === '-damage' && !kwargs.from && args[1] !== nextArgs[1] && (nextArgs[0] === '-crit' || nextArgs[0] === '-supereffective' || nextArgs[0] === '-resisted' || nextArgs[0] === '-damage' && !nextKwargs.from)) kwargs.then = '.';
      if (args[0] === '-damage' && nextArgs[0] === '-damage' && kwargs.from && kwargs.from === nextKwargs.from) kwargs.then = '.';
      if (args[0] === '-ability' && (args[2] === 'Intimidate' || args[3] === 'boost')) kwargs.then = '.';
      if (args[0] === '-unboost' && nextArgs[0] === '-unboost') kwargs.then = '.';
      if (args[0] === '-boost' && nextArgs[0] === '-boost') kwargs.then = '.';
      if (args[0] === '-damage' && kwargs.from === 'Leech Seed' && nextArgs[0] === '-heal' && nextKwargs.silent) kwargs.then = '.';
      minors.push([args, kwargs]);
      if (kwargs.simult || kwargs.then) {
        return;
      }
    }
    while (minors.length) {
      var row = minors.shift();
      args = row[0];
      kwargs = row[1];
      if (kwargs.simult) this.scene.timeOffset = 0;

       //mmo
	  switch (args[0]) {
		  case '-start':
		  case '-end':
			  var poke = this.getPokemon(args[1]);
			  var who = ((poke.side === this.mySide) ? "you" : "opp");
			  vars.differentMonInfo(who, vars.slotFromPackage(this.mySide.active[0]), this.$expEl);
			  break;
	  }

     switch (args[0]) {
        case '-center':{
            actions += "Automatic center!";
            break;
          }case '-damage':{
            var poke = this.getPokemon(args[1]);
            var damage = poke.healthParse(args[2], true);
            if (damage === null) break;
            var range = poke.getDamageRange(damage);

            if (kwargs.silent) {
              // do nothing
            } else if (kwargs.from) {
              var effect = Tools.getEffect(kwargs.from);
              var ofpoke = this.getPokemon(kwargs.of);
              if (effect.effectType === 'Ability' && ofpoke) {
                this.scene.abilityActivateAnim(ofpoke, effect.name);
                this.message('', "<small>[" + ofpoke.getName(true) + "'s " + effect.name + "!]</small>");
                ofpoke.markAbility(effect.name);
              } else if (effect.effectType === 'Item') {
                (ofpoke || poke).item = effect.name;
              }
              switch (effect.id) {
                case 'stealthrock':
                  actions += "Pointed stones dug into " + poke.getLowerName() + "! ";
                  break;
                case 'spikes':
                  actions += "" + poke.getName() + " is hurt by the spikes! ";
                  break;
                case 'brn':
                  this.scene.runStatusAnim('brn', [poke]);
                  actions += "" + poke.getName() + " was hurt by its burn! ";
                  break;
                case 'psn':
                  this.scene.runStatusAnim('psn', [poke]);
                  actions += "" + poke.getName() + " was hurt by poison! ";
                  break;
                case 'lifeorb':
                  this.message('', '<small>' + poke.getName() + ' lost some of its HP!</small>');
                  break;
                case 'recoil':
                  actions += "" + poke.getName() + " is damaged by the recoil! ";
                  break;
                case 'sandstorm':
                  actions += "" + poke.getName() + " is buffeted by the sandstorm! ";
                  break;
                case 'hail':
                  actions += "" + poke.getName() + " is buffeted by the hail! ";
                  break;
                case 'baddreams':
                  this.scene.runStatusAnim('cursed', [poke]);
                  actions += "" + poke.getName() + " is tormented!";
                  break;
                case 'curse':
                  this.scene.runStatusAnim('cursed', [poke]);
                  actions += "" + poke.getName() + " is afflicted by the curse! ";
                  break;
                case 'nightmare':
                  actions += "" + poke.getName() + " is locked in a nightmare! ";
                  break;
                case 'roughskin':
                case 'ironbarbs':
                case 'spikyshield':
                  actions += "" + poke.getName() + " was hurt! ";
                  break;
                case 'innardsout':
                case 'aftermath':
                  actions += "" + poke.getName() + " is hurt! ";
                  break;
                case 'liquidooze':
                  actions += "" + poke.getName() + " sucked up the liquid ooze! ";
                  break;
                case 'dryskin':
                case 'solarpower':
                  break;
                case 'confusion':
                  this.scene.runStatusAnim('confusedselfhit', [poke]);
                  actions += "It hurt itself in its confusion! ";
                  this.hasPreMoveMessage = false;
                  break;
                case 'leechseed':
                  this.scene.runOtherAnim('leech', [ofpoke, poke]);
                  actions += "" + poke.getName() + "'s health is sapped by Leech Seed! ";
                  break;
                case 'flameburst':
                  actions += "The bursting flame hit " + poke.getLowerName() + "! ";
                  break;
                case 'firepledge':
                  actions += "" + poke.getName() + " is hurt by the sea of fire! ";
                  break;
                case 'jumpkick':
                case 'highjumpkick':
                  actions += "" + poke.getName() + " kept going and crashed!";
                  break;
                case 'bind':
                case 'wrap':
                  this.scene.runOtherAnim('bound', [poke]);
                  actions += "" + poke.getName() + ' is hurt by ' + effect.name + '!';
                  break;
                default:
                  if (ofpoke) {
                    actions += "" + poke.getName() + " is hurt by " + ofpoke.getLowerName() + "'s " + effect.name + "! ";
                  } else if (effect.effectType === 'Item') {
                    actions += "" + poke.getName() + " is hurt by its " + effect.name + "! ";
                  } else if (effect.effectType === 'Ability') {
                    actions += "" + poke.getName() + " is hurt by its " + effect.name + "! ";
                  } else if (kwargs.partiallytrapped) {
                    actions += "" + poke.getName() + ' is hurt by ' + effect.name + '! ';
                  } else {
                    actions += "" + poke.getName() + " lost some HP because of " + effect.name + "! ";
                  }
                  break;}

            } else {
              var damageinfo = '' + poke.getFormattedRange(range, damage[1] === 100 ? 0 : 1, 'â€“');
              if (damage[1] !== 100) {
                var hover = '' + (damage[0] < 0 ? '&minus;' : '') +
                Math.abs(damage[0]) + '/' + damage[1];
                if (damage[1] === 48) {// this is a hack
                  hover += ' pixels';
                }
                damageinfo = '<abbr title="' + hover + '">' + damageinfo + '</abbr>';
              }
              var hiddenactions = '<small>' + poke.getName() + ' lost ' + damageinfo + ' of its health!</small><br />';
              this.message(actions ? '<small>' + actions + '</small>' : '', hiddenactions);
              actions = '';
            }
            this.scene.damageAnim(poke, poke.getFormattedRange(range, 0, ' to '));
            break;
          }case '-heal':{
            var _poke = this.getPokemon(args[1]);
            var _damage = _poke.healthParse(args[2], true, true);
            if (_damage === null) break;
            var _range = _poke.getDamageRange(_damage);

            if (kwargs.silent) {
              // do nothing
            } else if (kwargs.from) {
              var _effect = Tools.getEffect(kwargs.from);
              var _ofpoke = this.getPokemon(kwargs.of);
              if (_effect.effectType === 'Ability') {
                this.scene.abilityActivateAnim(_poke, _effect.name);
                this.message('', "<small>[" + _poke.getName(true) + "'s " + _effect.name + "!]</small>");
                _poke.markAbility(_effect.name);
              }
              switch (_effect.id) {
                case 'memento':
                case 'partingshot':
                  actions += "" + _poke.getName() + "'s HP was restored by the Z-Power!";
                  break;
                case 'ingrain':
                  actions += "" + _poke.getName() + " absorbed nutrients with its roots!";
                  break;
                case 'aquaring':
                  actions += "A veil of water restored " + _poke.getLowerName() + "'s HP!";
                  break;
                case 'healingwish':
                  actions += "The healing wish came true for " + _poke.getLowerName() + "!";
                  this.lastMove = 'healing-wish';
                  this.scene.runResidualAnim('healingwish', _poke);
                  _poke.side.wisher = null;
                  break;
                case 'lunardance':
                  actions += "" + _poke.getName() + " became cloaked in mystical moonlight!";
                  this.lastMove = 'healing-wish';
                  this.scene.runResidualAnim('healingwish', _poke);for (var _i6 = 0, _poke$moveTrack =
                  _poke.moveTrack; _i6 < _poke$moveTrack.length; _i6++) {var trackedMove = _poke$moveTrack[_i6];
                    trackedMove[1] = 0;
                  }
                  _poke.side.wisher = null;
                  break;
                case 'wish':
                  actions += "" + kwargs.wisher + "'s wish came true!";
                  this.scene.runResidualAnim('wish', _poke);
                  break;
                case 'drain':
                  actions += _ofpoke.getName() + ' had its energy drained!';
                  break;
                case 'leftovers':
                case 'shellbell':
                case 'blacksludge':
                  _poke.item = _effect.name;
                  actions += "" + _poke.getName() + " restored a little HP using its " + _effect.name + "!";
                  break;
                default:
                  if (kwargs.absorb) {
                    actions += "" + _poke.getName() + "'s " + _effect.name + " absorbs the attack!";
                  } else if (_effect.id && _effect.effectType !== 'Ability') {
                    actions += "" + _poke.getName() + " restored HP using its " + _effect.name + "!";
                  } else {
                    actions += _poke.getName() + ' restored its HP.';
                  }
                  break;}

            } else if (kwargs.zeffect) {
              actions += "" + _poke.getName() + " restored its HP using its Z-Power!";
            } else {
              actions += _poke.getName() + ' restored its HP.';
            }
            this.scene.runOtherAnim('heal', [_poke]);
            this.scene.healAnim(_poke, _poke.getFormattedRange(_range, 0, ' to '));
            break;
          }case '-sethp':{
            var _effect2 = Tools.getEffect(kwargs.from);
            var _poke2 = void 0,_ofpoke2 = void 0;
            for (var _k = 0; _k < 2; _k++) {
              var cpoke = this.getPokemon(args[1 + 2 * _k]);
              if (cpoke) {
                var _damage2 = cpoke.healthParse(args[2 + 2 * _k]);
                var _range2 = cpoke.getDamageRange(_damage2);
                var formattedRange = cpoke.getFormattedRange(_range2, 0, ' to ');
                var diff = _damage2[0];
                if (diff > 0) {
                  this.scene.healAnim(cpoke, formattedRange);
                } else {
                  this.scene.damageAnim(cpoke, formattedRange);
                }
              }
              if (_k == 0) _poke2 = cpoke;
              if (_k == 1) _ofpoke2 = cpoke;
            }
            switch (_effect2.id) {
              case 'painsplit':
                actions += 'The battlers shared their pain!';
                break;}


            break;

          }case '-boost':{
            var _poke3 = this.getPokemon(args[1]);
            var _stat = args[2];
            if (this.gen === 1 && _stat === 'spd') break;
            if (this.gen === 1 && _stat === 'spa') _stat = 'spc';
            var amount = parseInt(args[3], 10);
            if (amount === 0) {
              actions += "" + _poke3.getName() + "'s " + BattleStats[_stat] + " won't go any higher! ";
              this.scene.resultAnim(_poke3, 'Highest ' + BattleStats[_stat], 'good');
              break;
            }
            if (!_poke3.boosts[_stat]) {
              _poke3.boosts[_stat] = 0;
            }
            _poke3.boosts[_stat] += amount;

            var amountString = '';
            if (amount === 2) amountString = ' sharply';
            if (amount >= 3) amountString = ' drastically';
            if (kwargs.silent) {
              // do nothing
            } else if (kwargs.from) {
              var _effect3 = Tools.getEffect(kwargs.from);
              var _ofpoke3 = this.getPokemon(kwargs.of);
              if (_effect3.effectType === 'Ability' && !(_effect3.id === 'weakarmor' && _stat === 'spe')) {
                this.scene.abilityActivateAnim(_ofpoke3 || _poke3, _effect3.name);
                this.message('', "<small>[" + (_ofpoke3 || _poke3).getName(true) + "'s " + _effect3.name + "!]</small>");
                _poke3.markAbility(_effect3.name);
              }
              switch (_effect3.id) {
                default:
                  if (_effect3.effectType === 'Ability') {
                    actions += "" + _poke3.getName() + "'s " + BattleStats[_stat] + " rose" + amountString + "! ";
                  }
                  if (_effect3.effectType === 'Item') {
                    actions += "The " + _effect3.name + amountString + " raised " + _poke3.getLowerName() + "'s " + BattleStats[_stat] + "! ";
                  }
                  break;}

            } else if (kwargs.zeffect) {
              if (minors.length && minors[0][1].zeffect) {
                actions += "" + _poke3.getName() + " boosted its stats" + amountString + " using its Z-Power! ";
                for (var i = 0; i < minors.length; i++) {
                  minors[i][1].silent = '.';
                }
              } else {
                actions += "" + _poke3.getName() + " boosted its " + BattleStats[_stat] + amountString + " using its Z-Power! ";
              }
            } else {
              actions += "" + _poke3.getName() + "'s " + BattleStats[_stat] + " rose" + amountString + "! ";
            }
            this.scene.resultAnim(_poke3, _poke3.getBoost(_stat), 'good');
            break;
          }case '-unboost':{
            var _poke4 = this.getPokemon(args[1]);
            var _stat2 = args[2];
            if (this.gen === 1 && _stat2 === 'spd') break;
            if (this.gen === 1 && _stat2 === 'spa') _stat2 = 'spc';
            var _amount = parseInt(args[3], 10);
            if (_amount === 0) {
              actions += "" + _poke4.getName() + "'s " + BattleStats[_stat2] + " won't go any lower! ";
              this.scene.resultAnim(_poke4, 'Lowest ' + BattleStats[_stat2], 'bad');
              break;
            }
            if (!_poke4.boosts[_stat2]) {
              _poke4.boosts[_stat2] = 0;
            }
            _poke4.boosts[_stat2] -= _amount;

            var _amountString = '';
            if (_amount === 2) _amountString = ' harshly';
            if (_amount >= 3) _amountString = ' severely';
            if (kwargs.silent) {
              // do nothing
            } else if (kwargs.from) {
              var _effect4 = Tools.getEffect(kwargs.from);
              var _ofpoke4 = this.getPokemon(kwargs.of);
              if (_effect4.effectType === 'Ability') {
                this.scene.abilityActivateAnim(_ofpoke4 || _poke4, _effect4.name);
                this.message('', "<small>[" + (_ofpoke4 || _poke4).getName(true) + "'s " + _effect4.name + "!]</small>");
                _poke4.markAbility(_effect4.name);
              }
              switch (_effect4.id) {
                default:
                  if (_effect4.effectType === 'Ability') {
                    actions += "" + _poke4.getName() + "'s " + BattleStats[_stat2] + " fell" + _amountString + "! ";
                  }
                  if (_effect4.effectType === 'Item') {
                    actions += "The " + _effect4.name + _amountString + " lowered " + _poke4.getLowerName() + "'s " + BattleStats[_stat2] + "! ";
                  }
                  break;}

            } else {
              actions += "" + _poke4.getName() + "'s " + BattleStats[_stat2] + " fell" + _amountString + "! ";
            }
            this.scene.resultAnim(_poke4, _poke4.getBoost(_stat2), 'bad');
            break;
          }case '-setboost':{
            var _poke5 = this.getPokemon(args[1]);
            var _stat3 = args[2];
            var _amount2 = parseInt(args[3], 10);
            var _effect5 = Tools.getEffect(kwargs.from);
            var _ofpoke5 = this.getPokemon(kwargs.of);
            _poke5.boosts[_stat3] = _amount2;
            this.scene.resultAnim(_poke5, _poke5.getBoost(_stat3), _amount2 > 0 ? 'good' : 'bad');

            if (kwargs.silent) {
              // do nothing
            } else if (kwargs.from) {
              switch (_effect5.id) {
                case 'bellydrum':
                  actions += '' + _poke5.getName() + ' cut its own HP and maximized its Attack!';
                  break;
                case 'angerpoint':
                  this.scene.runOtherAnim('anger', [_poke5]);
                  this.scene.abilityActivateAnim(_poke5, 'Anger Point');
                  this.message('', "<small>[" + _poke5.getName(true) + "'s Anger Point!]</small>");
                  _poke5.markAbility('Anger Point');
                  actions += '' + _poke5.getName() + ' maxed its Attack!';
                  break;}

            }
            break;
          }case '-swapboost':{
            var _poke6 = this.getPokemon(args[1]);
            var poke2 = this.getPokemon(args[2]);
            var stats = args[3] ? args[3].split(', ') : ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];
            var _effect6 = Tools.getEffect(kwargs.from);
            for (var _i7 = 0; _i7 < stats.length; _i7++) {
              var tmp = _poke6.boosts[stats[_i7]];
              _poke6.boosts[stats[_i7]] = poke2.boosts[stats[_i7]];
              if (!_poke6.boosts[stats[_i7]]) delete _poke6.boosts[stats[_i7]];
              poke2.boosts[stats[_i7]] = tmp;
              if (!poke2.boosts[stats[_i7]]) delete poke2.boosts[stats[_i7]];
            }
            this.scene.resultAnim(_poke6, 'Stats swapped', 'neutral');
            this.scene.resultAnim(poke2, 'Stats swapped', 'neutral');

            if (kwargs.silent) {
              // do nothing
            } else if (_effect6.id) {
              switch (_effect6.id) {
                case 'guardswap':
                  actions += '' + _poke6.getName() + ' switched all changes to its Defense and Sp. Def with its target!';
                  break;
                case 'heartswap':
                  actions += '' + _poke6.getName() + ' switched stat changes with its target!';
                  break;
                case 'powerswap':
                  actions += '' + _poke6.getName() + ' switched all changes to its Attack and Sp. Atk with its target!';
                  break;}

            }
            break;
          }case '-clearpositiveboost':{
            var _poke7 = this.getPokemon(args[1]);
            var _ofpoke6 = this.getPokemon(args[2]);
            var _effect7 = Tools.getEffect(args[3]);
            for (var _stat4 in _poke7.boosts) {
              if (_poke7.boosts[_stat4] > 0) delete _poke7.boosts[_stat4];
            }
            this.scene.resultAnim(_poke7, 'Boosts lost', 'bad');

            if (kwargs.silent) {
              // do nothing
            } else if (_effect7.id) {
              switch (_effect7.id) {
                case 'spectralthief':
                  // todo: update StealBoosts so it animates 1st on Spectral Thief
                  this.scene.runOtherAnim('spectralthiefboost', [_ofpoke6, _poke7]);
                  actions += '' + _ofpoke6.getName() + ' stole the target\'s boosted stats!';
                  break;}

            }
            break;
          }case '-clearnegativeboost':{
            var _poke8 = this.getPokemon(args[1]);
            for (var _stat5 in _poke8.boosts) {
              if (_poke8.boosts[_stat5] < 0) delete _poke8.boosts[_stat5];
            }
            this.scene.resultAnim(_poke8, 'Restored', 'good');

            if (kwargs.silent) {
              // do nothing
            } else if (kwargs.zeffect) {
              actions += '' + _poke8.getName() + ' returned its decreased stats to normal using its Z-Power!';
              break;
            }
            break;
          }case '-copyboost':{
            var _poke9 = this.getPokemon(args[1]);
            var frompoke = this.getPokemon(args[2]);
            var _stats = args[3] ? args[3].split(', ') : ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];
            var _effect8 = Tools.getEffect(kwargs.from);
            for (var _i8 = 0; _i8 < _stats.length; _i8++) {
              _poke9.boosts[_stats[_i8]] = frompoke.boosts[_stats[_i8]];
              if (!_poke9.boosts[_stats[_i8]]) delete _poke9.boosts[_stats[_i8]];
            }
            // poke.boosts = {...frompoke.boosts};

            if (kwargs.silent) {
              // do nothing
            } else {
              this.scene.resultAnim(_poke9, 'Stats copied', 'neutral');
              actions += "" + _poke9.getName() + " copied " + frompoke.getLowerName() + "'s stat changes!";
            }
            break;
          }case '-clearboost':{
            var _poke10 = this.getPokemon(args[1]);
            _poke10.boosts = {};
            this.scene.resultAnim(_poke10, 'Stats reset', 'neutral');

            if (kwargs.silent) {
              // do nothing
            } else {
              actions += '' + _poke10.getName() + '\'s stat changes were removed!';
            }
            break;
          }case '-invertboost':{
            var _poke11 = this.getPokemon(args[1]);
            for (var _stat6 in _poke11.boosts) {
              _poke11.boosts[_stat6] = -_poke11.boosts[_stat6];
            }
            this.scene.resultAnim(_poke11, 'Stats inverted', 'neutral');

            if (kwargs.silent) {
              // do nothing
            } else {
              actions += '' + _poke11.getName() + '\'s stat changes were inverted!';
            }
            break;
          }case '-clearallboost':{for (var _i9 = 0, _this$sides2 =
            this.sides; _i9 < _this$sides2.length; _i9++) {var side = _this$sides2[_i9];for (var _i10 = 0, _side$active =
              side.active; _i10 < _side$active.length; _i10++) {var active = _side$active[_i10];
                if (active) {
                  active.boosts = {};
                  this.scene.resultAnim(active, 'Stats reset', 'neutral');
                }
              }
            }

            if (kwargs.silent) {
              // do nothing
            } else {
              actions += 'All stat changes were eliminated!';
            }
            break;

          }case '-crit':{
            var _poke12 = this.getPokemon(args[1]);
            for (var j = 1; !_poke12 && j < 10; j++) {_poke12 = this.getPokemon(minors[j][0][1]);}
            if (_poke12) this.scene.resultAnim(_poke12, 'Critical hit', 'bad');
            actions += "A critical hit" + (_poke12 && this.activeMoveIsSpread ? " on " + _poke12.getLowerName() : "") + "! ";
            if (window.Config && Config.server && Config.server.afd && !Config.server.afdCrit) {
              actions += '<div class="broadcast-red" style="font-size:10pt">Crit mattered? Buy <strong>Crit Insurance DLC</strong>, yours for only $4.99!<br /> <a href="/view-dlc">CLICK HERE!</a></div>';
              Config.server.afdCrit = true;
            }
            break;

          }case '-supereffective':{
            var _poke13 = this.getPokemon(args[1]);
            for (var _j = 1; !_poke13 && _j < 10; _j++) {_poke13 = this.getPokemon(minors[_j][0][1]);}
            if (_poke13) {
              this.scene.resultAnim(_poke13, 'Super-effective', 'bad');
              if (window.Config && Config.server && Config.server.afd) {
                this.scene.runOtherAnim('hitmark', [_poke13]);
              }
            }
            actions += "It's super effective" + (_poke13 && this.activeMoveIsSpread ? " on " + _poke13.getLowerName() : "") + "! ";
            break;

          }case '-resisted':{
            var _poke14 = this.getPokemon(args[1]);
            for (var _j2 = 1; !_poke14 && _j2 < 10; _j2++) {_poke14 = this.getPokemon(minors[_j2][0][1]);}
            if (_poke14) this.scene.resultAnim(_poke14, 'Resisted', 'neutral');
            actions += "It's not very effective" + (_poke14 && this.activeMoveIsSpread ? " on " + _poke14.getLowerName() : "..") + ". ";
            break;

          }case '-immune':{
            var _poke15 = this.getPokemon(args[1]);
            var _effect9 = Tools.getEffect(args[2]);
            var fromeffect = Tools.getEffect(kwargs.from);
            if (fromeffect && fromeffect.effectType === 'Ability') {
              var _ofpoke7 = this.getPokemon(kwargs.of) || _poke15;
              this.scene.abilityActivateAnim(_ofpoke7, fromeffect.name);
              this.message('', "<small>[" + _ofpoke7.getName(true) + "'s " + fromeffect.name + "!]</small>");
              _ofpoke7.markAbility(fromeffect.name);
            }
            if (_effect9.id == 'confusion') {
              actions += "" + _poke15.getName() + " doesn't become confused! ";
            } else if (kwargs.msg) {
              actions += "It doesn't affect " + _poke15.getLowerName() + "... ";
            } else if (kwargs.ohko) {
              actions += "" + _poke15.getName() + " is unaffected! ";
            } else {
              actions += "It had no effect! ";
            }
            this.scene.resultAnim(_poke15, 'Immune', 'neutral');
            break;

          }case '-miss':{
            var user = this.getPokemon(args[1]);
            var target = this.getPokemon(args[2]);
            if (target) {
              actions += "" + target.getName() + " avoided the attack!";
              this.scene.resultAnim(target, 'Missed', 'neutral');
            } else {
              actions += "" + user.getName() + "'s attack missed!";
            }
            break;

          }case '-fail':{
            var _poke16 = this.getPokemon(args[1]);
            var _effect10 = Tools.getEffect(args[2]);
            var _fromeffect = Tools.getEffect(kwargs.from);
            var _ofpoke8 = this.getPokemon(kwargs.of);
            if (_poke16) {
              this.scene.resultAnim(_poke16, 'Failed', 'neutral');
            }
            // Sky Drop blocking moves takes priority over all other moves
            if (_fromeffect.id === 'skydrop') {
              actions += "Sky Drop won't let " + _poke16.getLowerName() + " go!";
              break;
            }
            switch (_effect10.id) {
              case 'brn':
                this.scene.resultAnim(_poke16, 'Already burned', 'neutral');
                actions += "" + _poke16.getName() + " already has a burn.";
                break;
              case 'tox':
              case 'psn':
                this.scene.resultAnim(_poke16, 'Already poisoned', 'neutral');
                actions += "" + _poke16.getName() + " is already poisoned.";
                break;
              case 'slp':
                if (_fromeffect.id === 'uproar') {
                  this.scene.resultAnim(_poke16, 'Failed', 'neutral');
                  if (kwargs.msg) {
                    actions += "But " + _poke16.getLowerName() + " can't sleep in an uproar!";
                  } else {
                    actions += "But the uproar kept " + _poke16.getLowerName() + " awake!";
                  }
                } else {
                  this.scene.resultAnim(_poke16, 'Already asleep', 'neutral');
                  actions += "" + _poke16.getName() + " is already asleep!";
                }
                break;
              case 'par':
                this.scene.resultAnim(_poke16, 'Already paralyzed', 'neutral');
                actions += "" + _poke16.getName() + " is already paralyzed.";
                break;
              case 'frz':
                this.scene.resultAnim(_poke16, 'Already frozen', 'neutral');
                actions += "" + _poke16.getName() + " is already frozen solid!";
                break;
              case 'darkvoid':
              case 'hyperspacefury':
                if (kwargs.forme) {
                  actions += 'But ' + _poke16.getLowerName() + ' can\'t use it the way it is now!';
                } else {
                  actions += 'But ' + _poke16.getLowerName() + ' can\'t use the move!';
                }
                break;
              case 'magikarpsrevenge':
                actions += 'But ' + _poke16.getLowerName() + ' can\'t use the move!';
                break;
              case 'substitute':
                if (kwargs.weak) {
                  actions += "But it does not have enough HP left to make a substitute!";
                } else {
                  actions += '' + _poke16.getName() + ' already has a substitute!';
                }
                break;
              case 'skydrop':
                if (kwargs.heavy) {
                  actions += '' + _poke16.getName() + ' is too heavy to be lifted!';
                } else {
                  actions += "But it failed!";
                }
                break;
              case 'sunnyday':
              case 'raindance':
              case 'sandstorm':
              case 'hail':
                switch (_fromeffect.id) {
                  case 'desolateland':
                    actions += "The extremely harsh sunlight was not lessened at all!";
                    break;
                  case 'primordialsea':
                    actions += "There is no relief from this heavy rain!";
                    break;
                  case 'deltastream':
                    actions += "The mysterious strong winds blow on regardless!";
                    break;
                  default:
                    actions += "But it failed!";}

                break;
              case 'unboost':
                if (_fromeffect.effectType === 'Ability') {
                  this.scene.abilityActivateAnim(_poke16, _fromeffect.name);
                  this.message('', "<small>[" + _poke16.getName(true) + "'s " + _fromeffect.name + "!]</small>");
                  _poke16.markAbility(_fromeffect.name);
                } else {
                  this.scene.resultAnim(_poke16, 'Stat drop blocked', 'neutral');
                }
                switch (_fromeffect.id) {
                  case 'flowerveil':
                    actions += '' + _ofpoke8.getName() + ' surrounded itself with a veil of petals!';
                    break;
                  default:
                    var _stat7 = Tools.escapeHTML(args[3]);
                    actions += "" + _poke16.getName() + "'s " + (_stat7 ? _stat7 + " was" : "stats were") + " not lowered!";}

                break;
              default:
                switch (_fromeffect.id) {
                  case 'desolateland':
                    actions += "The Water-type attack evaporated in the harsh sunlight!";
                    break;
                  case 'primordialsea':
                    actions += "The Fire-type attack fizzled out in the heavy rain!";
                    break;
                  default:
                    actions += "But it failed!";}

                break;}

            break;

          }case '-notarget':{
            if (this.gen >= 5) {
              actions += "But it failed!";
            } else {
              actions += "But there was no target...";
            }
            break;

          }case '-ohko':{
            actions += "It's a one-hit KO!";
            break;

          }case '-hitcount':{
            var hits = parseInt(args[2], 10);
            actions += 'Hit ' + hits + (hits > 1 ? ' times!' : ' time!');
            break;

          }case '-nothing':{
            actions += "But nothing happened! ";
            break;

          }case '-waiting':{
            var _poke17 = this.getPokemon(args[1]);
            var _ofpoke9 = this.getPokemon(args[2]);
            actions += "" + _poke17.getName() + " is waiting for " + _ofpoke9.getLowerName() + "'s move...";
            break;

          }case '-combine':{
            actions += "The two moves have become one! It's a combined move!";
            break;

          }case '-zpower':{
            if (!this.hasPreMoveMessage && this.waitForResult()) return;
            var _poke18 = this.getPokemon(args[1]);
            this.scene.runOtherAnim('zpower', [_poke18]);
            actions += "" + _poke18.getName() + " surrounded itself with its Z-Power! ";
            this.hasPreMoveMessage = true;
            break;

          }case '-zbroken':{
            var _poke19 = this.getPokemon(args[1]);
            actions += "" + _poke19.getName() + " couldn't fully protect itself and got hurt!";
            break;

          }case '-prepare':{
            var _poke20 = this.getPokemon(args[1]);
            var moveid = toId(args[2]);
            var _target2 = this.getPokemon(args[3]) || _poke20.side.foe.active[0] || _poke20;
            this.scene.runPrepareAnim(moveid, _poke20, _target2);
            break;

          }case '-mustrecharge':{
            var _poke21 = this.getPokemon(args[1]);
            _poke21.addMovestatus('mustrecharge');
            _poke21.sprite.updateStatbar(_poke21);
            break;

          }case '-status':{
            var _poke22 = this.getPokemon(args[1]);
            var _effect11 = Tools.getEffect(kwargs.from);
            var _ofpoke10 = this.getPokemon(kwargs.of) || _poke22;
            _poke22.status = args[2];
            _poke22.removeVolatile('yawn');
            var effectMessage = "";
            if (_effect11.effectType === 'Ability') {
              this.scene.abilityActivateAnim(_ofpoke10, _effect11.name);
              this.message('', "<small>[" + _ofpoke10.getName(true) + "'s " + _effect11.name + "!]</small>");
              _ofpoke10.markAbility(_effect11.name);
            } else if (_effect11.effectType === 'Item') {
              _ofpoke10.item = _effect11.name;
              effectMessage = " by the " + _effect11.name;
            }

            switch (args[2]) {
              case 'brn':
                this.scene.resultAnim(_poke22, 'Burned', 'brn');
                this.scene.runStatusAnim('brn', [_poke22]);
                actions += "" + _poke22.getName() + " was burned" + effectMessage + "!";
                break;
              case 'tox':
                this.scene.resultAnim(_poke22, 'Toxic poison', 'psn');
                this.scene.runStatusAnim('psn', [_poke22]);
                _poke22.statusData.toxicTurns = 1;
                actions += "" + _poke22.getName() + " was badly poisoned" + effectMessage + "!";
                break;
              case 'psn':
                this.scene.resultAnim(_poke22, 'Poisoned', 'psn');
                this.scene.runStatusAnim('psn', [_poke22]);
                actions += "" + _poke22.getName() + " was poisoned!";
                break;
              case 'slp':
                this.scene.resultAnim(_poke22, 'Asleep', 'slp');
                if (_effect11.id === 'rest') {
                  _poke22.statusData.sleepTurns = 0; // for Gen 2 use through Sleep Talk
                  actions += '' + _poke22.getName() + ' slept and became healthy!';
                } else {
                  actions += "" + _poke22.getName() + " fell asleep!";
                }
                break;
              case 'par':
                this.scene.resultAnim(_poke22, 'Paralyzed', 'par');
                this.scene.runStatusAnim('par', [_poke22]);
                actions += "" + _poke22.getName() + " is paralyzed! It may be unable to move!";
                break;
              case 'frz':
                this.scene.resultAnim(_poke22, 'Frozen', 'frz');
                this.scene.runStatusAnim('frz', [_poke22]);
                actions += "" + _poke22.getName() + " was frozen solid!";
                break;
              default:
                _poke22.sprite.updateStatbar(_poke22);
                break;}

            break;

          }case '-curestatus':{
            var _poke23 = this.getPokemon(args[1]);
            var _effect12 = Tools.getEffect(kwargs.from);
            var _ofpoke11 = this.getPokemon(kwargs.of);
            var pokeName = void 0,pokeSideN = void 0;
            if (_poke23) {
              _poke23.status = '';
              pokeName = _poke23.getName();
              pokeSideN = _poke23.side.n;
            } else {
              var parseIdResult = this.parsePokemonId(args[1]);
              pokeName = parseIdResult.name;
              pokeSideN = parseIdResult.siden;
            }
            if (args[2] === 'slp') _poke23.statusData.sleepTurns = 0;
            if (_effect12.id === 'naturalcure' && !this.hasPreMoveMessage && this.waitForResult()) return;

            if (kwargs.silent) {
              // do nothing
            } else if (_effect12.id) {
              switch (_effect12.id) {
                case 'psychoshift':
                  actions += '' + pokeName + ' moved its status onto ' + _ofpoke11.getLowerName() + '!';
                  if (_poke23) this.scene.resultAnim(_poke23, 'Cured', 'good');
                  break;
                case 'flamewheel':
                case 'flareblitz':
                case 'fusionflare':
                case 'sacredfire':
                case 'scald':
                case 'steameruption':
                  if (_poke23) this.scene.resultAnim(_poke23, 'Thawed', 'good');
                  actions += "" + pokeName + "'s " + _effect12.name + " melted the ice!";
                  break;
                case 'naturalcure':
                  actions += "(" + pokeName + "'s Natural Cure activated!)";
                  if (_poke23) _poke23.markAbility('Natural Cure');
                  this.hasPreMoveMessage = true;
                  break;
                default:
                  if (_poke23) this.scene.resultAnim(_poke23, 'Cured', 'good');
                  actions += "" + pokeName + "'s " + _effect12.name + " heals its status!";
                  break;}

            } else {
              switch (args[2]) {
                case 'brn':
                  if (_poke23) this.scene.resultAnim(_poke23, 'Burn cured', 'good');
                  if (_effect12.effectType === 'Item') {
                    actions += "" + pokeName + "'s " + _effect12.name + " healed its burn!";
                    break;
                  }
                  if (pokeSideN === 0) actions += "" + pokeName + "'s burn was healed.";else
                  actions += "" + pokeName + " healed its burn!";
                  break;
                case 'tox':
                  if (_poke23) _poke23.statusData.toxicTurns = 0;
                // falls through
                case 'psn':
                  if (_poke23) this.scene.resultAnim(_poke23, 'Poison cured', 'good');
                  if (_effect12.effectType === 'Item') {
                    actions += "" + pokeName + "'s " + _effect12.name + " cured its poison!";
                    break;
                  }
                  actions += "" + pokeName + " was cured of its poisoning.";
                  break;
                case 'slp':
                  if (_poke23) this.scene.resultAnim(_poke23, 'Woke up', 'good');
                  if (_poke23) _poke23.statusData.sleepTurns = 0;
                  if (_effect12.effectType === 'Item') {
                    actions += "" + pokeName + "'s " + _effect12.name + " woke it up!";
                    break;
                  }
                  actions += "" + pokeName + " woke up!";
                  break;
                case 'par':
                  if (_poke23) this.scene.resultAnim(_poke23, 'Paralysis cured', 'good');
                  if (_effect12.effectType === 'Item') {
                    actions += "" + pokeName + "'s " + _effect12.name + " cured its paralysis!";
                    break;
                  }
                  actions += "" + pokeName + " was cured of paralysis.";
                  break;
                case 'frz':
                  if (_poke23) this.scene.resultAnim(_poke23, 'Thawed', 'good');
                  if (_effect12.effectType === 'Item') {
                    actions += "" + pokeName + "'s " + _effect12.name + " defrosted it!";
                    break;
                  }
                  actions += "" + pokeName + " thawed out!";
                  break;
                default:
                  if (_poke23) _poke23.removeVolatile('confusion');
                  if (_poke23) this.scene.resultAnim(_poke23, 'Cured', 'good');
                  actions += "" + pokeName + "'s status cleared!";}

            }
            break;

          }case '-cureteam':{// For old gens when the whole team was always cured
            var _poke24 = this.getPokemon(args[1]);for (var _i11 = 0, _poke24$side$pokemon =
            _poke24.side.pokemon; _i11 < _poke24$side$pokemon.length; _i11++) {var _target3 = _poke24$side$pokemon[_i11];
              _target3.status = '';
              if (_target3.sprite.$statbar) _target3.sprite.updateStatbar(_target3);
            }

            this.scene.resultAnim(_poke24, 'Team Cured', 'good');
            var _effect13 = Tools.getEffect(kwargs.from);
            switch (_effect13.id) {
              case 'aromatherapy':
                actions += 'A soothing aroma wafted through the area!';
                break;
              case 'healbell':
                actions += 'A bell chimed!';
                break;
              default:
                actions += "" + _poke24.getName() + "'s team was cured!";
                break;}

            break;

          }case '-item':{
            var _poke25 = this.getPokemon(args[1]);
            var item = Tools.getItem(args[2]);
            var _effect14 = Tools.getEffect(kwargs.from);
            var _ofpoke12 = this.getPokemon(kwargs.of);
            _poke25.item = item.name;
            _poke25.itemEffect = '';
            _poke25.removeVolatile('airballoon');
            if (item.id === 'airballoon') _poke25.addVolatile('airballoon');

            if (_effect14.id) {
              switch (_effect14.id) {
                case 'pickup':
                  this.scene.abilityActivateAnim(_poke25, 'Pickup');
                  this.message('', "<small>[" + _poke25.getName(true) + "'s Pickup!]</small>");
                  _poke25.markAbility('Pickup');
                // falls through
                case 'recycle':
                  _poke25.itemEffect = 'found';
                  actions += '' + _poke25.getName() + ' found one ' + item.name + '!';
                  this.scene.resultAnim(_poke25, item.name, 'neutral');
                  break;
                case 'frisk':
                  this.scene.abilityActivateAnim(_ofpoke12, 'Frisk');
                  this.message('', "<small>[" + _ofpoke12.getName(true) + "'s Frisk!]</small>");
                  _ofpoke12.markAbility('Frisk');
                  if (kwargs.identify) {// used for gen 6
                    _poke25.itemEffect = 'frisked';
                    actions += '' + _ofpoke12.getName() + ' frisked ' + _poke25.getLowerName() + ' and found its ' + item.name + '!';
                    this.scene.resultAnim(_poke25, item.name, 'neutral');
                  } else {
                    actions += '' + _ofpoke12.getName() + ' frisked its target and found one ' + item.name + '!';
                  }
                  break;
                case 'magician':
                case 'pickpocket':
                  this.scene.abilityActivateAnim(_poke25, _effect14.name);
                  this.message('', "<small>[" + _poke25.getName(true) + "'s " + _effect14.name + "!]</small>");
                  _poke25.markAbility(_effect14.name);
                // falls through
                case 'thief':
                case 'covet':
                  // simulate the removal of the item from the ofpoke
                  _ofpoke12.item = '';
                  _ofpoke12.itemEffect = '';
                  _ofpoke12.prevItem = item.name;
                  _ofpoke12.prevItemEffect = 'stolen';
                  _ofpoke12.addVolatile('itemremoved');
                  _poke25.itemEffect = 'stolen';
                  actions += '' + _poke25.getName() + ' stole ' + _ofpoke12.getLowerName() + "'s " + item.name + "!";
                  this.scene.resultAnim(_poke25, item.name, 'neutral');
                  this.scene.resultAnim(_ofpoke12, 'Item Stolen', 'bad');
                  break;
                case 'harvest':
                  _poke25.itemEffect = 'harvested';
                  this.scene.abilityActivateAnim(_poke25, 'Harvest');
                  this.message('', "<small>[" + _poke25.getName(true) + "'s Harvest!]</small>");
                  _poke25.markAbility('Harvest');
                  actions += '' + _poke25.getName() + ' harvested one ' + item.name + '!';
                  this.scene.resultAnim(_poke25, item.name, 'neutral');
                  break;
                case 'bestow':
                  _poke25.itemEffect = 'bestowed';
                  actions += '' + _poke25.getName() + ' received ' + item.name + ' from ' + _ofpoke12.getLowerName() + '!';
                  this.scene.resultAnim(_poke25, item.name, 'neutral');
                  break;
                case 'trick':
                  _poke25.itemEffect = 'tricked';
                // falls through
                default:
                  actions += '' + _poke25.getName() + ' obtained one ' + item.name + '.';
                  this.scene.resultAnim(_poke25, item.name, 'neutral');
                  break;}

            } else {
              switch (item.id) {
                case 'airballoon':
                  this.scene.resultAnim(_poke25, 'Balloon', 'good');
                  actions += "" + _poke25.getName() + " floats in the air with its Air Balloon!";
                  break;
                default:
                  actions += "" + _poke25.getName() + " has " + item.name + "!";
                  break;}

            }
            break;

          }case '-enditem':{
            var _poke26 = this.getPokemon(args[1]);
            var _item2 = Tools.getItem(args[2]);
            var _effect15 = Tools.getEffect(kwargs.from);
            var _ofpoke13 = this.getPokemon(kwargs.of);
            _poke26.item = '';
            _poke26.itemEffect = '';
            _poke26.prevItem = _item2.name;
            _poke26.prevItemEffect = '';
            _poke26.removeVolatile('airballoon');
            _poke26.addVolatile('itemremoved');
            if (kwargs.silent) {
              // do nothing
            } else if (kwargs.eat) {
              _poke26.prevItemEffect = 'eaten';
              this.scene.runOtherAnim('consume', [_poke26]);
              actions += '' + _poke26.getName() + ' ate its ' + _item2.name + '!';
              this.lastMove = _item2.id;
            } else if (kwargs.weaken) {
              _poke26.prevItemEffect = 'eaten';
              actions += 'The ' + _item2.name + ' weakened the damage to ' + _poke26.getLowerName() + '!';
              this.lastMove = _item2.id;
            } else if (_effect15.id) {
              switch (_effect15.id) {
                case 'fling':
                  _poke26.prevItemEffect = 'flung';
                  actions += "" + _poke26.getName() + ' flung its ' + _item2.name + '!';
                  break;
                case 'knockoff':
                  _poke26.prevItemEffect = 'knocked off';
                  actions += '' + _ofpoke13.getName() + ' knocked off ' + _poke26.getLowerName() + '\'s ' + _item2.name + '!';
                  this.scene.runOtherAnim('itemoff', [_poke26]);
                  this.scene.resultAnim(_poke26, 'Item knocked off', 'neutral');
                  break;
                case 'stealeat':
                  _poke26.prevItemEffect = 'stolen';
                  actions += '' + _ofpoke13.getName() + ' stole and ate its target\'s ' + _item2.name + '!';
                  break;
                case 'gem':
                  _poke26.prevItemEffect = 'consumed';
                  actions += 'The ' + _item2.name + ' strengthened ' + Tools.getMove(kwargs.move).name + '\'s power!';
                  break;
                case 'incinerate':
                  _poke26.prevItemEffect = 'incinerated';
                  actions += "" + _poke26.getName() + "'s " + _item2.name + " was burned up!";
                  break;
                default:
                  actions += "" + _poke26.getName() + ' lost its ' + _item2.name + '!';
                  break;}

            } else {
              switch (_item2.id) {
                case 'airballoon':
                  _poke26.prevItemEffect = 'popped';
                  _poke26.removeVolatile('airballoon');
                  this.scene.resultAnim(_poke26, 'Balloon popped', 'neutral');
                  actions += "" + _poke26.getName() + "'s Air Balloon popped!";
                  break;
                case 'focussash':
                  _poke26.prevItemEffect = 'consumed';
                  this.scene.resultAnim(_poke26, 'Sash', 'neutral');
                  actions += "" + _poke26.getName() + ' hung on using its Focus Sash!';
                  break;
                case 'focusband':
                  this.scene.resultAnim(_poke26, 'Focus Band', 'neutral');
                  actions += "" + _poke26.getName() + ' hung on using its Focus Band!';
                  break;
                case 'powerherb':
                  _poke26.prevItemEffect = 'consumed';
                  actions += "" + _poke26.getName() + " became fully charged due to its Power Herb!";
                  break;
                case 'whiteherb':
                  _poke26.prevItemEffect = 'consumed';
                  actions += "" + _poke26.getName() + " returned its status to normal using its White Herb!";
                  break;
                case 'ejectbutton':
                  _poke26.prevItemEffect = 'consumed';
                  actions += "" + _poke26.getName() + " is switched out with the Eject Button!";
                  break;
                case 'redcard':
                  _poke26.prevItemEffect = 'held up';
                  actions += "" + _poke26.getName() + " held up its Red Card against " + _ofpoke13.getLowerName() + "!";
                  break;
                default:
                  _poke26.prevItemEffect = 'consumed';
                  actions += "" + _poke26.getName() + "'s " + _item2.name + " activated!";
                  break;}

            }
            break;

          }case '-ability':{
            var _poke27 = this.getPokemon(args[1]);
            var ability = Tools.getAbility(args[2]);
            var _effect16 = Tools.getEffect(kwargs.from);
            var _ofpoke14 = this.getPokemon(kwargs.of);
            _poke27.markAbility(ability.name, _effect16.id && !kwargs.fail);

            if (kwargs.silent) {
              // do nothing
            } else if (_effect16.id) {
              switch (_effect16.id) {
                case 'trace':
                  this.scene.abilityActivateAnim(_poke27, "Trace");
                  this.scene.wait(500);
                  this.scene.abilityActivateAnim(_poke27, ability.name);
                  this.message('', "<small>[" + _poke27.getName(true) + "'s Trace!]</small>");
                  if (!_poke27.baseAbility) _poke27.baseAbility = _effect16.name;
                  _ofpoke14.markAbility(ability.name);
                  actions += '' + _poke27.getName() + ' traced ' + _ofpoke14.getLowerName() + '\'s ' + ability.name + '!';
                  break;
                case 'powerofalchemy':
                case 'receiver':
                  this.scene.abilityActivateAnim(_poke27, _effect16.name);
                  this.scene.wait(500);
                  this.scene.abilityActivateAnim(_poke27, ability.name);
                  this.message('', "<small>[" + _poke27.getName(true) + "'s " + _effect16.name + "!]</small>");
                  if (!_poke27.baseAbility) _poke27.baseAbility = _effect16.name;
                  actions += '' + _ofpoke14.getName() + '\'s ' + ability.name + ' was taken over!';
                  break;
                case 'roleplay':
                  this.scene.abilityActivateAnim(_poke27, ability.name);
                  actions += '' + _poke27.getName() + ' copied ' + _ofpoke14.getLowerName() + '\'s ' + ability.name + ' Ability!';
                  _ofpoke14.markAbility(ability.name);
                  break;
                case 'desolateland':
                  if (kwargs.fail) {
                    this.scene.abilityActivateAnim(_poke27, ability.name);
                    this.message('', "<small>[" + _poke27.getName(true) + "'s " + ability.name + "!]</small>");
                    actions += "The extremely harsh sunlight was not lessened at all!";
                  }
                  break;
                case 'primordialsea':
                  if (kwargs.fail) {
                    this.scene.abilityActivateAnim(_poke27, ability.name);
                    this.message('', "<small>[" + _poke27.getName(true) + "'s " + ability.name + "!]</small>");
                    actions += "There's no relief from this heavy rain!";
                  }
                  break;
                case 'deltastream':
                  if (kwargs.fail) {
                    this.scene.abilityActivateAnim(_poke27, ability.name);
                    this.message('', "<small>[" + _poke27.getName(true) + "'s " + ability.name + "!]</small>");
                    actions += "The mysterious strong winds blow on regardless!";
                  }
                  break;
                default:
                  this.scene.abilityActivateAnim(_poke27, ability.name);
                  actions += "" + _poke27.getName() + " acquired " + ability.name + "!";
                  break;}

            } else {
              this.scene.abilityActivateAnim(_poke27, ability.name);
              this.message('', "<small>[" + _poke27.getName(true) + "'s " + ability.name + "!]</small>");
              switch (ability.id) {
                case 'airlock':
                case 'cloudnine':
                  actions += "The effects of the weather disappeared.";
                  break;
                case 'anticipation':
                  actions += "" + _poke27.getName() + " shuddered!";
                  break;
                case 'aurabreak':
                  actions += "" + _poke27.getName() + " reversed all other PokÃ©mon's auras!";
                  break;
                case 'comatose':
                  actions += "" + _poke27.getName() + " is drowsing!";
                  break;
                case 'darkaura':
                  actions += "" + _poke27.getName() + " is radiating a dark aura!";
                  break;
                case 'fairyaura':
                  actions += "" + _poke27.getName() + " is radiating a fairy aura!";
                  break;
                case 'moldbreaker':
                  actions += "" + _poke27.getName() + " breaks the mold!";
                  break;
                case 'pressure':
                  actions += "" + _poke27.getName() + " is exerting its pressure!";
                  break;
                case 'sturdy':
                  actions += "" + _poke27.getName() + " endured the hit!";
                  break;
                case 'teravolt':
                  actions += "" + _poke27.getName() + " is radiating a bursting aura!";
                  break;
                case 'turboblaze':
                  actions += "" + _poke27.getName() + " is radiating a blazing aura!";
                  break;
                case 'unnerve':
                  actions += "" + this.getSide(args[3]).getTeamName() + " is too nervous to eat Berries!";
                  break;
                default:
                // Do nothing
              }
            }
            break;

          }case '-endability':{
            var _poke28 = this.getPokemon(args[1]);
            var _ability = Tools.getAbility(args[2]);
            var _effect17 = Tools.getEffect(kwargs.from);
            _poke28.ability = '';

            if (kwargs.silent) {
              // do nothing
            } else if (_ability.exists) {
              actions += "(" + _poke28.getName() + "'s " + _ability.name + " was removed.)";
              this.scene.resultAnim(_poke28, _ability.name + ' removed', 'bad');
              if (!_poke28.baseAbility) _poke28.baseAbility = _ability.name;
            } else {
              actions += "" + _poke28.getName() + "\'s Ability was suppressed!";
            }
            break;

          }case '-transform':{
            var _poke29 = this.getPokemon(args[1]);
            var tpoke = this.getPokemon(args[2]);
            var _effect18 = Tools.getEffect(kwargs.from);

            if (!kwargs.silent && _effect18.effectType === 'Ability') {
              this.scene.abilityActivateAnim(_poke29, _effect18.name);
              this.message('', "<small>[" + _poke29.getName(true) + "'s " + _effect18.name + "!]</small>");
              _poke29.markAbility(_effect18.name);
            }

            actions += '' + _poke29.getName() + ' transformed into ' + tpoke.species + '!';
            _poke29.boosts = Object.assign({}, tpoke.boosts);
            _poke29.copyTypesFrom(tpoke);
            _poke29.weightkg = tpoke.weightkg;
            _poke29.ability = tpoke.ability;
            var species = tpoke.volatiles.formechange ? tpoke.volatiles.formechange[1] : tpoke.species;
            var pokemon = tpoke;
            var shiny = tpoke.shiny;
            _poke29.addVolatile('transform', pokemon, shiny);
            _poke29.addVolatile('formechange', species);for (var _i12 = 0, _tpoke$moveTrack =
            tpoke.moveTrack; _i12 < _tpoke$moveTrack.length; _i12++) {var _trackedMove = _tpoke$moveTrack[_i12];
              _poke29.markMove(_trackedMove[0], 0);
            }
            _poke29.sprite.animTransform(_poke29);
            this.scene.resultAnim(_poke29, 'Transformed', 'good');
            break;
          }case '-formechange':{
            var _poke30 = this.getPokemon(args[1]);
            var template = Tools.getTemplate(args[2]);
            var _fromeffect2 = Tools.getEffect(kwargs.from);
            var isCustomAnim = false;
            _poke30.removeVolatile('typeadd');
            _poke30.removeVolatile('typechange');

            if (kwargs.silent) {
              // do nothing
            } else {
              if (_fromeffect2.effectType === 'Ability') {
                this.scene.abilityActivateAnim(_poke30, _fromeffect2.name);
                this.message('', "<small>[" + _poke30.getName(true) + "'s " + _fromeffect2.name + "!]</small>");
                _poke30.markAbility(_fromeffect2.name);
              }
              if (kwargs.msg) {
                actions += "" + _poke30.getName() + " transformed!";
                if (toId(template.species) === 'shaymin') break;
              } else if (toId(template.species) === 'darmanitanzen') {
                actions += "Zen Mode triggered!";
              } else if (toId(template.species) === 'darmanitan') {
                actions += "Zen Mode ended!";
              } else if (toId(template.species) === 'aegislashblade') {
                actions += "Changed to Blade Forme!";
              } else if (toId(template.species) === 'aegislash') {
                actions += "Changed to Shield Forme!";
              } else if (toId(template.species) === 'wishiwashischool') {
                actions += "" + _poke30.getName() + " formed a school!";
                isCustomAnim = true;
              } else if (toId(template.species) === 'wishiwashi') {
                actions += "" + _poke30.getName() + " stopped schooling!";
                isCustomAnim = true;
              } else if (toId(template.species) === 'miniormeteor') {
                actions += "Shields Down deactivated!";
              } else if (toId(template.species) === 'minior') {
                actions += "Shields Down activated!";
              }
            }
            _poke30.addVolatile('formechange', template.species); // the formechange volatile reminds us to revert the sprite change on switch-out
            _poke30.sprite.animTransform(_poke30, isCustomAnim);
            break;
          }case '-mega':{
            var _poke31 = this.getPokemon(args[1]);
            var _item3 = Tools.getItem(args[3]);
            if (args[2] === 'Rayquaza') {
              actions += "" + Tools.escapeHTML(_poke31.side.name) + "'s fervent wish has reached " + _poke31.getLowerName() + "!";
            } else {
              _poke31.item = _item3.name;
              actions += "" + _poke31.getName() + "'s " + _item3.name + " is reacting to " + (this.gen >= 7 ? "the Key Stone" : Tools.escapeHTML(_poke31.side.name) + "'s Mega Bracelet") + "!";
            }
            actions += "<br />" + _poke31.getName() + " has Mega Evolved into Mega " + args[2] + "!";
            break;
          }case '-primal':{
            var _poke32 = this.getPokemon(args[1]);
            actions += "" + _poke32.getName() + "'s Primal Reversion! It reverted to its primal state!";
            break;
          }case '-burst':{
            var _poke33 = this.getPokemon(args[1]);
            actions += "Bright light is about to burst out of " + _poke33.getLowerName() + "!";
            break;

          }case '-start':{
            var _poke34 = this.getPokemon(args[1]);
            var _effect19 = Tools.getEffect(args[2]);
            var _ofpoke15 = this.getPokemon(kwargs.of);
            var _fromeffect3 = Tools.getEffect(kwargs.from);
            if (_fromeffect3.id === 'protean' && !this.hasPreMoveMessage && this.waitForResult()) return;

            if (_effect19.effectType === 'Ability') {
              this.scene.abilityActivateAnim(_poke34, _effect19.name);
              this.message('', "<small>[" + _poke34.getName(true) + "'s " + _effect19.name + "!]</small>");
              _poke34.markAbility(_effect19.name);
            }
            if (kwargs.silent && _effect19.id !== 'typechange' && _effect19.id !== 'typeadd') {
              // do nothing
            } else {
              switch (_effect19.id) {
                case 'typechange':
                  var types = Tools.escapeHTML(args[3]);
                  _poke34.removeVolatile('typeadd');
                  _poke34.addVolatile('typechange', types);
                  if (kwargs.silent) {
                    _poke34.sprite.updateStatbar(_poke34);
                    break;
                  }
                  if (_fromeffect3.id) {
                    if (_fromeffect3.id === 'colorchange' || _fromeffect3.id === 'protean') {
                      this.scene.abilityActivateAnim(_poke34, _fromeffect3.name);
                      this.message('', "<small>[" + _poke34.getName(true) + "'s " + _fromeffect3.name + "!]</small>");
                      _poke34.markAbility(_fromeffect3.name);
                      actions += "" + _poke34.getName() + " transformed into the " + types + " type!";
                      this.hasPreMoveMessage = true;
                    } else if (_fromeffect3.id === 'reflecttype') {
                      _poke34.copyTypesFrom(_ofpoke15);
                      if (!kwargs.silent) actions += "" + _poke34.getName() + "'s type became the same as " + _ofpoke15.getLowerName() + "'s type!";
                    } else if (_fromeffect3.id === 'burnup') {
                      actions += "" + _poke34.getName() + " burned itself out!";
                    } else if (!kwargs.silent) {
                      actions += "" + _poke34.getName() + "'s " + _fromeffect3.name + " made it the " + types + " type!";
                    }
                  } else {
                    actions += "" + _poke34.getName() + " transformed into the " + types + " type!";
                  }
                  this.scene.resultAnim(_poke34, types.split('/').map(function (type) {
                    return '<img src="' + Tools.resourcePrefix + 'sprites/types/' + type + '.png" alt="' + type + '" />';
                  }).join(' '), 'neutral');
                  break;
                case 'typeadd':
                  var type = Tools.escapeHTML(args[3]);
                  _poke34.addVolatile('typeadd', type);
                  if (kwargs.silent) break;
                  actions += "" + type + " type was added to " + _poke34.getLowerName() + "!";
                  this.scene.resultAnim(_poke34, '<img src="' + Tools.resourcePrefix + 'sprites/types/' + type + '.png" alt="' + type + '" />', 'neutral');
                  break;
                case 'powertrick':
                  this.scene.resultAnim(_poke34, 'Power Trick', 'neutral');
                  actions += "" + _poke34.getName() + " switched its Attack and Defense!";
                  break;
                case 'foresight':
                case 'miracleeye':
                  this.scene.resultAnim(_poke34, 'Identified', 'bad');
                  actions += "" + _poke34.getName() + " was identified!";
                  break;
                case 'telekinesis':
                  this.scene.resultAnim(_poke34, 'Telekinesis', 'neutral');
                  actions += "" + _poke34.getName() + " was hurled into the air!";
                  break;
                case 'confusion':
                  if (kwargs.already) {
                    actions += "" + _poke34.getName() + " is already confused!";
                  } else {
                    this.scene.runStatusAnim('confused', [_poke34]);
                    this.scene.resultAnim(_poke34, 'Confused', 'bad');
                    if (kwargs.fatigue) {
                      actions += "" + _poke34.getName() + " became confused due to fatigue!";
                    } else {
                      actions += "" + _poke34.getName() + " became confused!";
                    }
                  }
                  break;
                case 'leechseed':
                  _poke34.sprite.updateStatbar(_poke34);
                  actions += '' + _poke34.getName() + ' was seeded!';
                  break;
                case 'healblock':
                  this.scene.resultAnim(_poke34, 'Heal Block', 'bad');
                  actions += "" + _poke34.getName() + " was prevented from healing!";
                  break;
                case 'mudsport':
                  this.scene.resultAnim(_poke34, 'Mud Sport', 'neutral');
                  actions += "Electricity's power was weakened!";
                  break;
                case 'watersport':
                  this.scene.resultAnim(_poke34, 'Water Sport', 'neutral');
                  actions += "Fire's power was weakened!";
                  break;
                case 'yawn':
                  this.scene.resultAnim(_poke34, 'Drowsy', 'slp');
                  actions += "" + _poke34.getName() + ' grew drowsy!';
                  break;
                case 'flashfire':
                  actions += 'The power of ' + _poke34.getLowerName() + '\'s Fire-type moves rose!';
                  break;
                case 'taunt':
                  this.scene.resultAnim(_poke34, 'Taunted', 'bad');
                  actions += '' + _poke34.getName() + ' fell for the taunt!';
                  break;
                case 'imprison':
                  this.scene.resultAnim(_poke34, 'Imprisoning', 'good');
                  actions += "" + _poke34.getName() + " sealed any moves its target shares with it!";
                  break;
                case 'disable':
                  if (_fromeffect3.effectType === 'Ability') {
                    this.scene.abilityActivateAnim(_ofpoke15, _fromeffect3.name);
                    this.message('', "<small>[" + _ofpoke15.getName(true) + "'s " + _fromeffect3.name + "!]</small>");
                    _ofpoke15.markAbility(_fromeffect3.name);
                  }
                  this.scene.resultAnim(_poke34, 'Disabled', 'bad');
                  actions += "" + _poke34.getName() + "'s " + Tools.escapeHTML(args[3]) + " was disabled!";
                  break;
                case 'embargo':
                  this.scene.resultAnim(_poke34, 'Embargo', 'bad');
                  actions += "" + _poke34.getName() + " can't use items anymore!";
                  break;
                case 'torment':
                  this.scene.resultAnim(_poke34, 'Tormented', 'bad');
                  actions += '' + _poke34.getName() + ' was subjected to torment!';
                  break;
                case 'ingrain':
                  this.scene.resultAnim(_poke34, 'Ingrained', 'good');
                  actions += '' + _poke34.getName() + ' planted its roots!';
                  break;
                case 'aquaring':
                  this.scene.resultAnim(_poke34, 'Aqua Ring', 'good');
                  actions += '' + _poke34.getName() + ' surrounded itself with a veil of water!';
                  break;
                case 'stockpile1':
                  this.scene.resultAnim(_poke34, 'Stockpile', 'good');
                  actions += '' + _poke34.getName() + ' stockpiled 1!';
                  break;
                case 'stockpile2':
                  _poke34.removeVolatile('stockpile1');
                  this.scene.resultAnim(_poke34, 'Stockpile&times;2', 'good');
                  actions += '' + _poke34.getName() + ' stockpiled 2!';
                  break;
                case 'stockpile3':
                  _poke34.removeVolatile('stockpile2');
                  this.scene.resultAnim(_poke34, 'Stockpile&times;3', 'good');
                  actions += '' + _poke34.getName() + ' stockpiled 3!';
                  break;
                case 'perish0':
                  _poke34.removeVolatile('perish1');
                  actions += '' + _poke34.getName() + "'s perish count fell to 0.";
                  break;
                case 'perish1':
                  _poke34.removeVolatile('perish2');
                  this.scene.resultAnim(_poke34, 'Perish next turn', 'bad');
                  actions += '' + _poke34.getName() + "'s perish count fell to 1.";
                  break;
                case 'perish2':
                  _poke34.removeVolatile('perish3');
                  this.scene.resultAnim(_poke34, 'Perish in 2', 'bad');
                  actions += '' + _poke34.getName() + "'s perish count fell to 2.";
                  break;
                case 'perish3':
                  this.scene.resultAnim(_poke34, 'Perish in 3', 'bad');
                  actions += '' + _poke34.getName() + "'s perish count fell to 3.";
                  break;
                case 'encore':
                  this.scene.resultAnim(_poke34, 'Encored', 'bad');
                  actions += '' + _poke34.getName() + ' received an encore!';
                  break;
                case 'bide':
                  this.scene.resultAnim(_poke34, 'Bide', 'good');
                  actions += "" + _poke34.getName() + " is storing energy!";
                  break;
                case 'slowstart':
                  actions += "" + _poke34.getName() + " can't get it going!";
                  break;
                case 'attract':
                  if (_fromeffect3.effectType === 'Ability') {
                    this.scene.abilityActivateAnim(_ofpoke15, _fromeffect3.name);
                    this.message('', "<small>[" + _ofpoke15.getName(true) + "'s " + _fromeffect3.name + "!]</small>");
                    _ofpoke15.markAbility(_fromeffect3.name);
                  }
                  this.scene.resultAnim(_poke34, 'Attracted', 'bad');
                  if (_fromeffect3.effectType === 'Item') {
                    actions += "" + _poke34.getName() + " fell in love from the " + _fromeffect3.name + "!";
                  } else {
                    actions += "" + _poke34.getName() + " fell in love!";
                  }
                  break;
                case 'autotomize':
                  this.scene.resultAnim(_poke34, 'Lightened', 'good');
                  actions += "" + _poke34.getName() + " became nimble!";
                  break;
                case 'focusenergy':
                  this.scene.resultAnim(_poke34, '+Crit rate', 'good');
                  if (_fromeffect3.effectType === 'Item') {
                    actions += "" + _poke34.getName() + " used the " + _fromeffect3.name + " to get pumped!";
                  } else if (kwargs.zeffect) {
                    actions += "" + _poke34.getName() + " boosted its critical-hit ratio using its Z-Power!";
                  } else {
                    actions += "" + _poke34.getName() + " is getting pumped!";
                  }
                  break;
                case 'curse':
                  this.scene.resultAnim(_poke34, 'Cursed', 'bad');
                  actions += "" + _ofpoke15.getName() + " cut its own HP and put a curse on " + _poke34.getLowerName() + "!";
                  break;
                case 'nightmare':
                  this.scene.resultAnim(_poke34, 'Nightmare', 'bad');
                  actions += "" + _poke34.getName() + " began having a nightmare!";
                  break;
                case 'magnetrise':
                  this.scene.resultAnim(_poke34, 'Magnet Rise', 'good');
                  actions += "" + _poke34.getName() + " levitated with electromagnetism!";
                  break;
                case 'smackdown':
                  this.scene.resultAnim(_poke34, 'Smacked Down', 'bad');
                  actions += "" + _poke34.getName() + " fell straight down!";
                  _poke34.removeVolatile('magnetrise');
                  _poke34.removeVolatile('telekinesis');
                  if (_poke34.lastMove === 'fly' || _poke34.lastMove === 'bounce') _poke34.sprite.animReset();
                  break;
                case 'substitute':
                  if (kwargs.damage) {
                    this.scene.resultAnim(_poke34, 'Damage', 'bad');
                    actions += "The substitute took damage for " + _poke34.getLowerName() + "!";
                  } else if (kwargs.block) {
                    this.scene.resultAnim(_poke34, 'Blocked', 'neutral');
                    actions += 'But it failed!';
                  } else if (kwargs.already) {
                    actions += '' + _poke34.getName() + ' already has a substitute!';
                  } else {
                    actions += '' + _poke34.getName() + ' put in a substitute!';
                  }
                  break;
                case 'uproar':
                  if (kwargs.upkeep) {
                    actions += "" + _poke34.getName() + " is making an uproar!";
                  } else {
                    actions += "" + _poke34.getName() + " caused an uproar!";
                  }
                  break;
                case 'doomdesire':
                  actions += '' + _poke34.getName() + ' chose Doom Desire as its destiny!';
                  break;
                case 'futuresight':
                  actions += '' + _poke34.getName() + ' foresaw an attack!';
                  break;
                case 'mimic':
                  actions += '' + _poke34.getName() + ' learned ' + Tools.escapeHTML(args[3]) + '!';
                  break;
                case 'laserfocus':
                  actions += '' + _poke34.getName() + ' concentrated intensely!';
                  break;
                case 'followme':
                case 'ragepowder': // Deprecated, now uses -singleturn
                  actions += '' + _poke34.getName() + ' became the center of attention!';
                  break;
                case 'powder': // Deprecated, now uses -singleturn
                  actions += '' + _poke34.getName() + ' is covered in powder!';
                  break;

                // Gen 1
                case 'lightscreen':
                  this.scene.resultAnim(_poke34, 'Light Screen', 'good');
                  actions += '' + _poke34.getName() + '\'s protected against special attacks!';
                  break;
                case 'reflect':
                  this.scene.resultAnim(_poke34, 'Reflect', 'good');
                  actions += '' + _poke34.getName() + ' gained armor!';
                  break;

                default:
                  actions += "" + _poke34.getName() + "'s " + _effect19.name + " started!";}

            }
            _poke34.addVolatile(_effect19.id);
            _poke34.sprite.updateStatbar(_poke34);
            break;
          }case '-end':{
            var _poke35 = this.getPokemon(args[1]);
            var _effect20 = Tools.getEffect(args[2]);
            var _fromeffect4 = Tools.getEffect(kwargs.from);
            _poke35.removeVolatile(_effect20.id);

            if (kwargs.silent) {
              // do nothing
            } else {
              switch (_effect20.id) {
                case 'powertrick':
                  this.scene.resultAnim(_poke35, 'Power Trick', 'neutral');
                  actions += "" + _poke35.getName() + " switched its Attack and Defense!";
                  break;
                case 'telekinesis':
                  this.scene.resultAnim(_poke35, 'Telekinesis&nbsp;ended', 'neutral');
                  actions += "" + _poke35.getName() + " was freed from the telekinesis!";
                  break;
                case 'skydrop':
                  if (kwargs.interrupt) {
                    _poke35.sprite.anim({ time: 100 });
                  }
                  actions += "" + _poke35.getName() + " was freed from the Sky Drop!";
                  break;
                case 'confusion':
                  this.scene.resultAnim(_poke35, 'Confusion&nbsp;ended', 'good');
                  if (!kwargs.silent) {
                    if (_fromeffect4.effectType === 'Item') {
                      actions += "" + _poke35.getName() + "'s " + _fromeffect4.name + " snapped it out of its confusion!";
                      break;
                    }
                    if (_poke35.side.n === 0) actions += "" + _poke35.getName() + " snapped out of its confusion.";else
                    actions += "" + _poke35.getName() + " snapped out of confusion!";
                  }
                  break;
                case 'leechseed':
                  if (_fromeffect4.id === 'rapidspin') {
                    this.scene.resultAnim(_poke35, 'De-seeded', 'good');
                    actions += "" + _poke35.getName() + " was freed from Leech Seed!";
                  }
                  break;
                case 'healblock':
                  this.scene.resultAnim(_poke35, 'Heal Block ended', 'good');
                  actions += "" + _poke35.getName() + "'s Heal Block wore off!";
                  break;
                case 'attract':
                  this.scene.resultAnim(_poke35, 'Attract&nbsp;ended', 'good');
                  if (_fromeffect4.id === 'oblivious') {
                    actions += '' + _poke35.getName() + " got over its infatuation.";
                  }
                  if (_fromeffect4.id === 'mentalherb') {
                    actions += "" + _poke35.getName() + " cured its infatuation status using its " + _fromeffect4.name + "!";
                  }
                  break;
                case 'taunt':
                  this.scene.resultAnim(_poke35, 'Taunt&nbsp;ended', 'good');
                  actions += '' + _poke35.getName() + "'s taunt wore off!";
                  break;
                case 'disable':
                  this.scene.resultAnim(_poke35, 'Disable&nbsp;ended', 'good');
                  actions += '' + _poke35.getName() + "'s move is no longer disabled!";
                  break;
                case 'embargo':
                  this.scene.resultAnim(_poke35, 'Embargo ended', 'good');
                  actions += "" + _poke35.getName() + " can use items again!";
                  break;
                case 'torment':
                  this.scene.resultAnim(_poke35, 'Torment&nbsp;ended', 'good');
                  actions += '' + _poke35.getName() + "'s torment wore off!";
                  break;
                case 'encore':
                  this.scene.resultAnim(_poke35, 'Encore&nbsp;ended', 'good');
                  actions += '' + _poke35.getName() + "'s encore ended!";
                  break;
                case 'bide':
                  this.scene.runOtherAnim('bideunleash', [_poke35]);
                  actions += "" + _poke35.getName() + " unleashed its energy!";
                  break;
                case 'illusion':
                  this.scene.resultAnim(_poke35, 'Illusion ended', 'bad');
                  actions += "" + _poke35.getName() + "'s illusion wore off!";
                  _poke35.markAbility('Illusion');
                  break;
                case 'slowstart':
                  this.scene.resultAnim(_poke35, 'Slow Start ended', 'good');
                  actions += "" + _poke35.getName() + " finally got its act together!";
                  break;
                case 'magnetrise':
                  if (_poke35.side.n === 0) actions += "" + _poke35.getName() + "'s electromagnetism wore off!";else
                  actions += "The electromagnetism of " + _poke35.getLowerName() + " wore off!";
                  break;
                case 'perishsong': // for backwards compatibility
                  _poke35.removeVolatile('perish3');
                  break;
                case 'substitute':
                  this.scene.resultAnim(_poke35, 'Faded', 'bad');
                  actions += '' + _poke35.getName() + "'s substitute faded!";
                  break;
                case 'uproar':
                  actions += "" + _poke35.getName() + " calmed down.";
                  break;
                case 'stockpile':
                  _poke35.removeVolatile('stockpile1');
                  _poke35.removeVolatile('stockpile2');
                  _poke35.removeVolatile('stockpile3');
                  actions += "" + _poke35.getName() + "'s stockpiled effect wore off!";
                  break;
                case 'bind':
                case 'wrap':
                case 'clamp':
                case 'whirlpool':
                case 'firespin':
                case 'magmastorm':
                case 'sandtomb':
                case 'infestation':
                  actions += '' + _poke35.getName() + ' was freed from ' + _effect20.name + '!';
                  break;
                default:
                  if (_effect20.effectType === 'Move') {
                    if (_effect20.name === 'Doom Desire') {
                      this.scene.runOtherAnim('doomdesirehit', [_poke35]);
                    }
                    if (_effect20.name === 'Future Sight') {
                      this.scene.runOtherAnim('futuresighthit', [_poke35]);
                    }
                    actions += '' + _poke35.getName() + " took the " + _effect20.name + " attack!";
                  } else {
                    actions += "" + _poke35.getName() + "'s " + _effect20.name + " ended!";
                  }}

            }
            _poke35.sprite.updateStatbar(_poke35);
            break;
          }case '-singleturn':{
            var _poke36 = this.getPokemon(args[1]);
            var _effect21 = Tools.getEffect(args[2]);
            var _ofpoke16 = this.getPokemon(kwargs.of);
            var _fromeffect5 = Tools.getEffect(kwargs.from);
            _poke36.addTurnstatus(_effect21.id);

            switch (_effect21.id) {
              case 'roost':
                this.scene.resultAnim(_poke36, 'Landed', 'neutral');
                //actions += '' + poke.getName() + ' landed on the ground!';
                break;
              case 'quickguard':
                this.scene.resultAnim(_poke36, 'Quick Guard', 'good');
                actions += "Quick Guard protected " + _poke36.side.getLowerTeamName() + "!";
                break;
              case 'wideguard':
                this.scene.resultAnim(_poke36, 'Wide Guard', 'good');
                actions += "Wide Guard protected " + _poke36.side.getLowerTeamName() + "!";
                break;
              case 'craftyshield':
                this.scene.resultAnim(_poke36, 'Crafty Shield', 'good');
                actions += "Crafty Shield protected " + _poke36.side.getLowerTeamName() + "!";
                break;
              case 'matblock':
                this.scene.resultAnim(_poke36, 'Mat Block', 'good');
                actions += '' + _poke36.getName() + ' intends to flip up a mat and block incoming attacks!';
                break;
              case 'protect':
                this.scene.resultAnim(_poke36, 'Protected', 'good');
                actions += '' + _poke36.getName() + ' protected itself!';
                break;
              case 'endure':
                this.scene.resultAnim(_poke36, 'Enduring', 'good');
                actions += '' + _poke36.getName() + ' braced itself!';
                break;
              case 'helpinghand':
                this.scene.resultAnim(_poke36, 'Helping Hand', 'good');
                actions += '' + _ofpoke16.getName() + " is ready to help " + _poke36.getLowerName() + "!";
                break;
              case 'focuspunch':
                this.scene.resultAnim(_poke36, 'Focusing', 'neutral');
                actions += '' + _poke36.getName() + ' is tightening its focus!';
                _poke36.markMove(_effect21.name, 0);
                break;
              case 'shelltrap':
                this.scene.resultAnim(_poke36, 'Trap set', 'neutral');
                actions += '' + _poke36.getName() + ' set a shell trap!';
                _poke36.markMove(_effect21.name, 0);
                break;
              case 'snatch':
                actions += '' + _poke36.getName() + ' waits for a target to make a move!';
                break;
              case 'magiccoat':
                actions += '' + _poke36.getName() + ' shrouded itself with Magic Coat!';
                break;
              case 'electrify':
                actions += '' + _poke36.getName() + '\'s moves have been electrified!';
                break;
              case 'followme':
              case 'ragepowder':
              case 'spotlight':
                if (kwargs.zeffect) {
                  actions += '' + _poke36.getName() + ' became the center of attention using its Z-Power!';
                } else {
                  actions += '' + _poke36.getName() + ' became the center of attention!';
                }
                break;
              case 'powder':
                actions += '' + _poke36.getName() + ' is covered in powder!';
                break;
              case 'instruct':
                actions += '' + _poke36.getName() + ' used the move instructed by ' + _ofpoke16.getLowerName() + '!';
                break;
              case 'beakblast':
                this.scene.runOtherAnim('bidecharge', [_poke36]);
                this.scene.resultAnim(_poke36, 'Beak Blast', 'neutral');
                actions += '' + _poke36.getName() + ' started heating up its beak!';
                break;}

            _poke36.sprite.updateStatbar(_poke36);
            break;
          }case '-singlemove':{
            var _poke37 = this.getPokemon(args[1]);
            var _effect22 = Tools.getEffect(args[2]);
            var _ofpoke17 = this.getPokemon(kwargs.of);
            var _fromeffect6 = Tools.getEffect(kwargs.from);
            _poke37.addMovestatus(_effect22.id);

            switch (_effect22.id) {
              case 'grudge':
                this.scene.resultAnim(_poke37, 'Grudge', 'neutral');
                actions += '' + _poke37.getName() + ' wants its target to bear a grudge!';
                break;
              case 'destinybond':
                this.scene.resultAnim(_poke37, 'Destiny Bond', 'neutral');
                actions += '' + _poke37.getName() + ' is hoping to take its attacker down with it!';
                break;}

            break;

          }case '-activate':{
            var _poke38 = this.getPokemon(args[1]);
            var _effect23 = Tools.getEffect(args[2]);
            var _ofpoke18 = this.getPokemon(kwargs.of);
            if ((_effect23.id === 'confusion' || _effect23.id === 'attract') && !this.hasPreMoveMessage && this.waitForResult()) return;
            if (_effect23.effectType === 'Ability') {
              this.scene.abilityActivateAnim(_poke38, _effect23.name);
              this.message('', "<small>[" + _poke38.getName(true) + "'s " + _effect23.name + "!]</small>");
              _poke38.markAbility(_effect23.name);
            }
            switch (_effect23.id) {
              case 'healreplacement':
                actions += "" + _poke38.getName() + " will restore its replacement's HP using its Z-Power!";
                break;
              case 'confusion':
                actions += "" + _poke38.getName() + " is confused!";
                this.hasPreMoveMessage = true;
                break;
              case 'destinybond':
                actions += '' + _poke38.getName() + ' took its attacker down with it!';
                break;
              case 'snatch':
                actions += "" + _poke38.getName() + " snatched " + _ofpoke18.getLowerName() + "'s move!";
                break;
              case 'grudge':
                actions += "" + _poke38.getName() + "'s " + Tools.escapeHTML(args[3]) + " lost all of its PP due to the grudge!";
                _poke38.markMove(args[3], Infinity);
                break;
              case 'quickguard':
                _poke38.addTurnstatus('quickguard');
                this.scene.resultAnim(_poke38, 'Quick Guard', 'good');
                actions += "Quick Guard protected " + _poke38.getLowerName() + "!";
                break;
              case 'wideguard':
                _poke38.addTurnstatus('wideguard');
                this.scene.resultAnim(_poke38, 'Wide Guard', 'good');
                actions += "Wide Guard protected " + _poke38.getLowerName() + "!";
                break;
              case 'craftyshield':
                _poke38.addTurnstatus('craftyshield');
                this.scene.resultAnim(_poke38, 'Crafty Shield', 'good');
                actions += "Crafty Shield protected " + _poke38.getLowerName() + "!";
                break;
              case 'protect':
                _poke38.addTurnstatus('protect');
                this.scene.resultAnim(_poke38, 'Protected', 'good');
                actions += '' + _poke38.getName() + ' protected itself!';
                break;
              case 'substitute':
                if (kwargs.damage) {
                  this.scene.resultAnim(_poke38, 'Damage', 'bad');
                  actions += 'The substitute took damage for ' + _poke38.getLowerName() + '!';
                } else if (kwargs.block) {
                  this.scene.resultAnim(_poke38, 'Blocked', 'neutral');
                  actions += '' + _poke38.getName() + "'s Substitute blocked " + Tools.getMove(kwargs.block || args[3]).name + '!';
                }
                break;
              case 'attract':
                this.scene.runStatusAnim('attracted', [_poke38]);
                actions += '' + _poke38.getName() + ' is in love with ' + _ofpoke18.getLowerName() + '!';
                this.hasPreMoveMessage = true;
                break;
              case 'bide':
                this.scene.runOtherAnim('bidecharge', [_poke38]);
                actions += "" + _poke38.getName() + " is storing energy!";
                break;
              case 'mist':
                actions += "" + _poke38.getName() + " is protected by the mist!";
                break;
              case 'safeguard':
                actions += "" + _poke38.getName() + " is protected by Safeguard!";
                break;
              case 'trapped':
                actions += "" + _poke38.getName() + " can no longer escape!";
                break;
              case 'stickyweb':
                actions += '' + _poke38.getName() + ' was caught in a sticky web!';
                break;
              case 'happyhour':
                actions += 'Everyone is caught up in the happy atmosphere!';
                break;
              case 'celebrate':
                actions += 'Congratulations, ' + Tools.escapeHTML(_poke38.side.name) + '!';
                break;

              // move activations
              case 'aromatherapy':
                this.scene.resultAnim(_poke38, 'Team Cured', 'good');
                actions += 'A soothing aroma wafted through the area!';
                break;
              case 'healbell':
                this.scene.resultAnim(_poke38, 'Team Cured', 'good');
                actions += 'A bell chimed!';
                break;
              case 'trick':
              case 'switcheroo':
                actions += '' + _poke38.getName() + ' switched items with its target!';
                break;
              case 'brickbreak':
                actions += _poke38.getName() + " shattered " + _ofpoke18.side.getTeamName() + " protections!";
                _ofpoke18.side.removeSideCondition('Reflect');
                _ofpoke18.side.removeSideCondition('LightScreen');
                break;
              case 'beatup':
                actions += "" + Tools.escapeHTML(kwargs.of) + "'s attack!";
                break;
              case 'pursuit':
                actions += "(" + _poke38.getName() + " is being withdrawn!)";
                break;
              case 'hyperspacefury':
              case 'hyperspacehole':
              case 'phantomforce':
              case 'shadowforce':
              case 'feint':
                this.scene.resultAnim(_poke38, 'Protection broken', 'bad');
                if (kwargs.broken) {
                  actions += "It broke through " + _poke38.getLowerName() + "'s protection!";
                } else {
                  actions += "" + _poke38.getName() + " fell for the feint!";
                }
                _poke38.removeTurnstatus('protect');for (var _i13 = 0, _poke38$side$pokemon =
                _poke38.side.pokemon; _i13 < _poke38$side$pokemon.length; _i13++) {var _target4 = _poke38$side$pokemon[_i13];
                  _target4.removeTurnstatus('wideguard');
                  _target4.removeTurnstatus('quickguard');
                  _target4.removeTurnstatus('craftyshield');
                  _target4.removeTurnstatus('matblock');
                  _target4.sprite.updateStatbar(_target4);
                }
                break;
              case 'spite':
                var move = Tools.getMove(args[3]).name;
                var pp = Tools.escapeHTML(args[4]);
                actions += "It reduced the PP of " + _poke38.getLowerName() + "'s " + move + " by " + pp + "!";
                _poke38.markMove(move, Number(pp));
                break;
              case 'gravity':
                actions += "" + _poke38.getName() + " couldn't stay airborne because of gravity!";
                _poke38.removeVolatile('magnetrise');
                _poke38.removeVolatile('telekinesis');
                _poke38.sprite.anim({ time: 100 });
                break;
              case 'magnitude':
                actions += "Magnitude " + Tools.escapeHTML(args[3]) + "!";
                break;
              case 'sketch':
                actions += "" + _poke38.getName() + " sketched " + Tools.escapeHTML(args[3]) + "!";
                break;
              case 'skillswap':
                actions += "" + _poke38.getName() + " swapped Abilities with its target!";
                if (this.gen <= 4) break;
                var pokeability = Tools.escapeHTML(args[3]) || _ofpoke18.ability;
                var ofpokeability = Tools.escapeHTML(args[4]) || _poke38.ability;
                if (pokeability) {
                  _poke38.ability = pokeability;
                  if (!_ofpoke18.baseAbility) _ofpoke18.baseAbility = pokeability;
                }
                if (ofpokeability) {
                  _ofpoke18.ability = ofpokeability;
                  if (!_poke38.baseAbility) _poke38.baseAbility = ofpokeability;
                }
                if (_poke38.side !== _ofpoke18.side) {
                  this.scene.abilityActivateAnim(_poke38, pokeability);
                  this.scene.abilityActivateAnim(_ofpoke18, ofpokeability);
                  actions += "<br />" + _poke38.getName() + " acquired " + pokeability + "!";
                  actions += "<br />" + _ofpoke18.getName() + " acquired " + ofpokeability + "!";
                }
                break;
              case 'charge':
                actions += "" + _poke38.getName() + " began charging power!";
                break;
              case 'struggle':
                actions += "" + _poke38.getName() + " has no moves left!";
                break;
              case 'bind':
                actions += '' + _poke38.getName() + ' was squeezed by ' + _ofpoke18.getLowerName() + '!';
                break;
              case 'wrap':
                actions += '' + _poke38.getName() + ' was wrapped by ' + _ofpoke18.getLowerName() + '!';
                break;
              case 'clamp':
                actions += '' + _ofpoke18.getName() + ' clamped down on ' + _poke38.getLowerName() + '!';
                break;
              case 'whirlpool':
                actions += '' + _poke38.getName() + ' became trapped in the vortex!';
                break;
              case 'firespin':
                actions += '' + _poke38.getName() + ' became trapped in the fiery vortex!';
                break;
              case 'magmastorm':
                actions += '' + _poke38.getName() + ' became trapped by swirling magma!';
                break;
              case 'sandtomb':
                actions += '' + _poke38.getName() + ' became trapped by the quicksand!';
                break;
              case 'infestation':
                actions += '' + _poke38.getName() + ' has been afflicted with an infestation by ' + _ofpoke18.getLowerName() + '!';
                break;
              case 'afteryou':
                actions += '' + _poke38.getName() + ' took the kind offer!';
                break;
              case 'quash':
                actions += "" + _poke38.getName() + "'s move was postponed!";
                break;
              case 'powersplit':
                actions += '' + _poke38.getName() + ' shared its power with the target!';
                break;
              case 'guardsplit':
                actions += '' + _poke38.getName() + ' shared its guard with the target!';
                break;
              case 'speedswap':
                actions += '' + _poke38.getName() + ' switched Speed with its target!';
                break;
              case 'ingrain':
                actions += '' + _poke38.getName() + ' anchored itself with its roots!';
                break;
              case 'matblock':
                actions += '' + Tools.escapeHTML(args[3]) + ' was blocked by the kicked-up mat!';
                break;
              case 'powder':
                actions += 'When the flame touched the powder on the PokÃ©mon, it exploded!';
                break;
              case 'fairylock':
                actions += 'No one will be able to run away during the next turn!';
                break;
              case 'lockon':
              case 'mindreader':
                actions += '' + _poke38.getName() + ' took aim at ' + _ofpoke18.getLowerName() + '!';
                break;
              case 'endure':
                actions += '' + _poke38.getName() + ' endured the hit!';
                break;
              case 'electricterrain':
                actions += '' + _poke38.getName() + ' surrounds itself with electrified terrain!';
                break;
              case 'mistyterrain':
                actions += '' + _poke38.getName() + ' surrounds itself with a protective mist!';
                break;
              case 'psychicterrain':
                actions += '' + _poke38.getName() + ' surrounds itself with psychic terrain!';
                break;

              // ability activations
              case 'magicbounce':
              case 'magiccoat':
              case 'rebound':
                break;
              case 'wonderguard': // Deprecated, now uses -immune
                this.scene.resultAnim(_poke38, 'Immune', 'neutral');
                actions += '' + _poke38.getName() + '\'s Wonder Guard evades the attack!';
                break;
              case 'forewarn':
                if (this.gen >= 5) {
                  actions += "It was alerted to " + _ofpoke18.getLowerName() + "'s " + Tools.escapeHTML(args[3]) + "!";
                  _ofpoke18.markMove(args[3], 0);
                } else {
                  actions += "" + _poke38.getName() + "'s Forewarn alerted it to " + Tools.escapeHTML(args[3]) + "!";
                  var foeActive = [];for (var _i14 = 0, _poke38$side$foe$acti =
                  _poke38.side.foe.active; _i14 < _poke38$side$foe$acti.length; _i14++) {var _target5 = _poke38$side$foe$acti[_i14];if (_target5) foeActive.push(_target5);}
                  if (foeActive.length === 1) {
                    foeActive[0].markMove(args[3], 0);
                  }
                }
                break;
              case 'mummy':
                if (!args[3]) break; // if Mummy activated but failed, no ability will have been sent
                var _ability2 = Tools.getAbility(args[3]);
                this.scene.abilityActivateAnim(_ofpoke18, _ability2.name);
                this.scene.wait(700);
                this.message('', "<small>[" + _ofpoke18.getName(true) + "'s " + _ability2.name + "!]</small>");
                _ofpoke18.markAbility(_ability2.name);
                this.scene.abilityActivateAnim(_ofpoke18, 'Mummy');
                this.message('', "<small>[" + _ofpoke18.getName(true) + "'s Mummy!]</small>");
                _ofpoke18.markAbility('Mummy', true);
                actions += "" + _ofpoke18.getName() + "'s Ability became Mummy!";
                break;
              case 'anticipation': // Deprecated, now uses -ability. This is for replay compatability
                actions += "" + _poke38.getName() + " shuddered!";
                break;
              case 'lightningrod':
              case 'stormdrain':
                actions += '' + _poke38.getName() + ' took the attack!';
                break;
              case 'telepathy':
                actions += "" + _poke38.getName() + " avoids attacks by its ally Pok&#xE9;mon!";
                break;
              case 'stickyhold':
                actions += "" + _poke38.getName() + "'s item cannot be removed!";
                break;
              case 'suctioncups':
                actions += '' + _poke38.getName() + ' anchors itself!';
                break;
              case 'symbiosis':
                actions += '' + _poke38.getName() + ' shared its ' + Tools.getItem(args[3]).name + ' with ' + _ofpoke18.getLowerName() + '!';
                break;
              case 'aromaveil':
                actions += '' + _ofpoke18.getName() + ' is protected by an aromatic veil!';
                break;
              case 'flowerveil':
                actions += '' + _ofpoke18.getName() + ' surrounded itself with a veil of petals!';
                break;
              case 'sweetveil':
                actions += '' + _ofpoke18.getName() + ' surrounded itself with a veil of sweetness!';
                break;
              case 'battlebond':
                actions += '' + _poke38.getName() + ' became fully charged due to its bond with its Trainer!';
                break;
              case 'disguise':
                actions += 'Its disguise served it as a decoy!';
                break;
              case 'powerconstruct':
                actions += 'You sense the presence of many!';
                break;
              case 'persistent': // CAP
                actions += '' + _poke38.getName() + ' extends ' + Tools.getMove(args[3]).name + ' by 2 turns!';
                break;

              // weather activations
              case 'deltastream':
                actions += "The mysterious strong winds weakened the attack!";
                break;

              // item activations
              case 'custapberry':
              case 'quickclaw':
                //actions += '' + poke.getName() + ' is already preparing its next move!';
                actions += '' + _poke38.getName() + '\'s ' + _effect23.name + ' let it move first!';
                break;
              case 'leppaberry':
              case 'mysteryberry':
                actions += '' + _poke38.getName() + " restored PP to its " + Tools.escapeHTML(args[3]) + " move using " + _effect23.name + "!";
                _poke38.markMove(args[3], _effect23.id === 'leppaberry' ? -10 : -5);
                break;
              case 'focusband':
                _poke38.item = 'Focus Band';
                actions += '' + _poke38.getName() + " hung on using its Focus Band!";
                break;
              case 'safetygoggles':
                _poke38.item = 'Safety Goggles';
                actions += '' + _poke38.getName() + " is not affected by " + Tools.escapeHTML(args[3]) + " thanks to its Safety Goggles!";
                break;
              case 'protectivepads':
                _poke38.item = 'Protective Pads';
                actions += '' + _poke38.getName() + " protected itself with the Protective Pads!";
                break;
              default:
                if (kwargs.broken) {// for custom moves that break protection
                  this.scene.resultAnim(_poke38, 'Protection broken', 'bad');
                  actions += "It broke through " + _poke38.getLowerName() + "'s protection!";
                } else if (_effect23.effectType !== 'Ability') {
                  actions += "" + _poke38.getName() + "'s " + _effect23.name + " activated!";
                }}

            break;

          }case '-sidestart':{
            var _side = this.getSide(args[1]);
            var _effect24 = Tools.getEffect(args[2]);
            _side.addSideCondition(_effect24);

            switch (_effect24.id) {
              case 'stealthrock':
                actions += "Pointed stones float in the air around " + _side.getLowerTeamName() + "!";
                break;
              case 'spikes':
                actions += "Spikes were scattered on the ground all around " + _side.getLowerTeamName() + "!";
                break;
              case 'toxicspikes':
                actions += "Poison spikes were scattered on the ground all around " + _side.getLowerTeamName() + "!";
                break;
              case 'stickyweb':
                actions += "A sticky web spreads out on the ground around " + _side.getLowerTeamName() + "!";
                break;
              case 'tailwind':
                actions += "The Tailwind blew from behind " + _side.getLowerTeamName() + "!";
                this.scene.updateWeather();
                break;
              case 'auroraveil':
                actions += "Aurora Veil made " + _side.getLowerTeamName() + " stronger against physical and special moves!";
                this.scene.updateWeather();
                break;
              case 'reflect':
                actions += "Reflect made " + _side.getLowerTeamName() + " stronger against physical moves!";
                this.scene.updateWeather();
                break;
              case 'lightscreen':
                actions += "Light Screen made " + _side.getLowerTeamName() + " stronger against special moves!";
                this.scene.updateWeather();
                break;
              case 'safeguard':
                actions += "" + _side.getTeamName() + " cloaked itself in a mystical veil!";
                this.scene.updateWeather();
                break;
              case 'mist':
                actions += "" + _side.getTeamName() + " became shrouded in mist!";
                this.scene.updateWeather();
                break;
              case 'luckychant':
                actions += 'Lucky Chant shielded ' + _side.getLowerTeamName() + ' from critical hits!';
                break;
              case 'firepledge':
                actions += "A sea of fire enveloped " + _side.getLowerTeamName() + "!";
                break;
              case 'waterpledge':
                actions += "A rainbow appeared in the sky on " + _side.getLowerTeamName() + "'s side!";
                break;
              case 'grasspledge':
                actions += "A swamp enveloped " + _side.getLowerTeamName() + "!";
                break;
              default:
                actions += "" + _effect24.name + " started!";
                break;}

            break;
          }case '-sideend':{
            var _side2 = this.getSide(args[1]);
            var _effect25 = Tools.getEffect(args[2]);
            var from = Tools.getEffect(kwargs.from);
            var _ofpoke19 = this.getPokemon(kwargs.of);
            _side2.removeSideCondition(_effect25.name);

            switch (_effect25.id) {
              case 'stealthrock':
                actions += "The pointed stones disappeared from around " + _side2.getLowerTeamName() + "!";
                break;
              case 'spikes':
                actions += "The spikes disappeared from the ground around " + _side2.getLowerTeamName() + "!";
                break;
              case 'toxicspikes':
                actions += "The poison spikes disappeared from the ground around " + _side2.getLowerTeamName() + "!";
                break;
              case 'stickyweb':
                actions += "The sticky web has disappeared from the ground around " + _side2.getLowerTeamName() + "!";
                break;
              case 'tailwind':
                actions += "" + _side2.getTeamName() + "'s Tailwind petered out!";
                break;
              case 'auroraveil':
                actions += "" + _side2.getTeamName() + "'s Aurora Veil wore off!";
                break;
              case 'reflect':
                actions += "" + _side2.getTeamName() + "'s Reflect wore off!";
                break;
              case 'lightscreen':
                actions += "" + _side2.getTeamName() + "'s Light Screen wore off!";
                break;
              case 'safeguard':
                actions += "" + _side2.getTeamName() + " is no longer protected by Safeguard!";
                break;
              case 'mist':
                actions += "" + _side2.getTeamName() + " is no longer protected by mist!";
                break;
              case 'luckychant':
                actions += "" + _side2.getTeamName() + "'s Lucky Chant wore off!";
                break;
              case 'firepledge':
                actions += "The sea of fire around " + _side2.getLowerTeamName() + " disappeared!";
                break;
              case 'waterpledge':
                actions += "The rainbow on " + _side2.getLowerTeamName() + "'s side disappeared!";
                break;
              case 'grasspledge':
                actions += "The swamp around " + _side2.getLowerTeamName() + " disappeared!";
                break;
              default:
                actions += "" + _effect25.name + " ended!";
                break;}

            break;

          }case '-weather':{
            var _effect26 = Tools.getEffect(args[1]);
            var _poke39 = this.getPokemon(kwargs.of) || undefined;
            var _ability3 = Tools.getEffect(kwargs.from);
            this.changeWeather(_effect26.name, _poke39, !!kwargs.upkeep, _ability3);
            break;

          }case '-fieldstart':{
            var _effect27 = Tools.getEffect(args[1]);
            var _poke40 = this.getPokemon(kwargs.of);
            var _fromeffect7 = Tools.getEffect(kwargs.from);
            if (_fromeffect7 && _fromeffect7.effectType === 'Ability') {
              this.scene.abilityActivateAnim(_poke40, _fromeffect7.name);
              this.message('', "<small>[" + _poke40.getName(true) + "'s " + _fromeffect7.name + "!]</small>");
              _poke40.markAbility(_fromeffect7.name);
            }
            var maxTimeLeft = 0;
            if (_effect27.id in { 'electricterrain': 1, 'grassyterrain': 1, 'mistyterrain': 1, 'psychicterrain': 1 }) {
              for (var _i15 = this.pseudoWeather.length - 1; _i15 >= 0; _i15--) {
                var pwName = this.pseudoWeather[_i15][0];
                if (pwName === 'Electric Terrain' || pwName === 'Grassy Terrain' || pwName === 'Misty Terrain' || pwName === 'Psychic Terrain') {
                  this.pseudoWeather.splice(_i15, 1);
                  continue;
                }
              }
              if (this.gen > 6) maxTimeLeft = 8;
            }
            this.addPseudoWeather(_effect27.name, 5, maxTimeLeft);

            switch (_effect27.id) {
              case 'wonderroom':
                actions += "It created a bizarre area in which Defense and Sp. Def stats are swapped!";
                break;
              case 'magicroom':
                actions += "It created a bizarre area in which Pok&#xE9;mon's held items lose their effects!";
                break;
              case 'gravity':
                if (!this.fastForward) {for (var _i16 = 0, _this$sides3 =
                  this.sides; _i16 < _this$sides3.length; _i16++) {var _side3 = _this$sides3[_i16];for (var _i17 = 0, _side3$active = _side3.active; _i17 < _side3$active.length; _i17++) {var _active = _side3$active[_i17];
                      if (_active) {
                        this.scene.runOtherAnim('gravity', [_active]);
                      }
                    }}
                }
                actions += "Gravity intensified!";
                break;
              case 'mudsport':
                actions += "Electricity's power was weakened!";
                break;
              case 'watersport':
                actions += "Fire's power was weakened!";
                break;
              case 'grassyterrain':
                actions += "Grass grew to cover the battlefield!";
                break;
              case 'mistyterrain':
                actions += "Mist swirls around the battlefield!";
                break;
              case 'electricterrain':
                actions += "An electric current runs across the battlefield!";
                break;
              case 'psychicterrain':
                actions += "The battlefield got weird!";
                break;
              case 'trickroom':
                if (_poke40) {
                  actions += "" + _poke40.getName() + ' twisted the dimensions!';
                  break;
                }
              // falls through
              default:
                actions += _effect27.name + " started!";
                break;}

            break;

          }case '-fieldend':{
            var _effect28 = Tools.getEffect(args[1]);
            var _poke41 = this.getPokemon(kwargs.of);
            this.removePseudoWeather(_effect28.name);

            switch (_effect28.id) {
              case 'trickroom':
                actions += 'The twisted dimensions returned to normal!';
                break;
              case 'wonderroom':
                actions += 'Wonder Room wore off, and Defense and Sp. Def stats returned to normal!';
                break;
              case 'magicroom':
                actions += "Magic Room wore off, and held items' effects returned to normal!";
                break;
              case 'gravity':
                actions += 'Gravity returned to normal!';
                break;
              case 'mudsport':
                actions += 'The effects of Mud Sport have faded.';
                break;
              case 'watersport':
                actions += 'The effects of Water Sport have faded.';
                break;
              case 'grassyterrain':
                actions += "The grass disappeared from the battlefield.";
                break;
              case 'mistyterrain':
                actions += "The mist disappeared from the battlefield.";
                break;
              case 'electricterrain':
                actions += "The electricity disappeared from the battlefield.";
                break;
              case 'psychicterrain':
                actions += "The weirdness disappeared from the battlefield!";
                break;
              default:
                actions += _effect28.name + " ended!";
                break;}

            break;

          }case '-fieldactivate':{
            var _effect29 = Tools.getEffect(args[1]);
            switch (_effect29.id) {
              case 'perishsong':
                actions += 'All Pok&#xE9;mon that heard the song will faint in three turns!';
                this.scene.updateStatbars();
                break;
              case 'payday':
                actions += 'Coins were scattered everywhere!';
                break;
              case 'iondeluge':
                actions += 'A deluge of ions showers the battlefield!';
                break;
              default:
                actions += '' + _effect29.name + ' hit!';
                break;}

            break;

          }case '-message':{
            actions += Tools.escapeHTML(args[1]);
            break;

          }case '-anim':{
            var _poke42 = this.getPokemon(args[1]);
            var _move = Tools.getMove(args[2]);
            if (this.checkActive(_poke42)) return;
            var _poke43 = this.getPokemon(args[3]);
            _poke42.sprite.beforeMove();
            kwargs.silent = '.';
            this.useMove(_poke42, _move, _poke43, kwargs);
            _poke42.sprite.afterMove();
            break;

          }case '-hint':{
            this.message('', '<small>(' + Tools.escapeHTML(args[1]) + ')</small>');
            break;

          }default:{
            if (this.errorCallback) this.errorCallback(this);
            break;
          }}
      if (actions && actions.slice(-1) !== '>') actions += '<br />';
    }
    if (actions) {
      if (actions.slice(-6) === '<br />') actions = actions.slice(0, -6);
      this.message('<small>' + actions + '</small>', '');
    }
  };
  /*
     parseSpriteData(name) {
     	let siden = 0,
     		foe = false;
     	while (true) {
     		if (name.substr(0, 6) === 'foeof-') {
     			foe = true;
     			name = name.substr(6);
     		} else if (name.substr(0, 9) === 'switched-') name = name.substr(9);
     		else if (name.substr(0, 9) === 'existing-') name = name.substr(9);
     		else if (name.substr(0, 4) === 'foe-') {
     			siden = this.p2.n;
     			name = name.substr(4);
     		} else if (name.substr(0, 5) === 'ally-') {
     			siden = this.p1.n;
     			name = name.substr(5);
     		} else break;
     	}
     	if (name.substr(name.length - 1) === ')') {
     		let parenIndex = name.lastIndexOf('(');
     		if (parenIndex > 0) {
     			let species = name.substr(parenIndex + 1);
     			name = species.substr(0, species.length - 1);
     		}
     	}
     	if (foe) siden = (siden ? 0 : 1);
     		let data = Tools.getTemplate(name);
     	return data.spriteData[siden];
     }
     */_proto3.

  parseDetails = function parseDetails(name, pokemonid) {var details = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";var output = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    output.details = details;
    output.name = name;
    output.species = name;
    output.level = 100;
    output.shiny = false;
    output.gender = '';
    output.ident = name ? pokemonid : '';
    output.searchid = name ? pokemonid + '|' + details : '';
    var splitDetails = details.split(', ');
    if (splitDetails[splitDetails.length - 1] === 'shiny') {
      output.shiny = true;
      splitDetails.pop();
    }
    if (splitDetails[splitDetails.length - 1] === 'M' || splitDetails[splitDetails.length - 1] === 'F') {
      output.gender = splitDetails[splitDetails.length - 1];
      splitDetails.pop();
    }
    if (splitDetails[1]) {
      output.level = parseInt(splitDetails[1].substr(1), 10) || 100;
    }
    if (splitDetails[0]) {
      output.species = splitDetails[0];
    }
    return output;
  };_proto3.
  parseHealth = function parseHealth(hpstring) {var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};var _hpstring$split =
    hpstring.split(' '),hp = _hpstring$split[0],status = _hpstring$split[1];

    // hp parse
    output.hpcolor = '';
    if (hp === '0' || hp === '0.0') {
      if (!output.maxhp) output.maxhp = 100;
      output.hp = 0;
    } else if (hp.indexOf('/') > 0) {var _hp$split =
      hp.split('/'),curhp = _hp$split[0],_maxhp = _hp$split[1];
      if (isNaN(parseFloat(curhp)) || isNaN(parseFloat(_maxhp))) {
        return null;
      }
      output.hp = parseFloat(curhp);
      output.maxhp = parseFloat(_maxhp);
      if (output.hp > output.maxhp) output.hp = output.maxhp;
      var colorchar = _maxhp.slice(-1);
      if (colorchar === 'y' || colorchar === 'g') {
        output.hpcolor = colorchar;
      }
    } else if (!isNaN(parseFloat(hp))) {
      if (!output.maxhp) output.maxhp = 100;
      output.hp = output.maxhp * parseFloat(hp) / 100;
    }

    // status parse
    if (!status) {
      output.status = '';
    } else if (status === 'par' || status === 'brn' || status === 'slp' || status === 'frz' || status === 'tox') {
      output.status = status;
    } else if (status === 'psn' && output.status !== 'tox') {
      output.status = status;
    } else if (status === 'fnt') {
      output.hp = 0;
      output.fainted = true;
    }
    return output;
  };_proto3.
  parsePokemonId = function parsePokemonId(pokemonid) {
    var name = pokemonid;

    var siden = -1;
    var slot = -1; // if there is an explicit slot for this pokemon
    var slotChart = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
    if (name.substr(0, 4) === 'p2: ' || name === 'p2') {
      siden = this.p2.n;
      name = name.substr(4);
    } else if (name.substr(0, 4) === 'p1: ' || name === 'p1') {
      siden = this.p1.n;
      name = name.substr(4);
    } else if (name.substr(0, 2) === 'p2' && name.substr(3, 2) === ': ') {
      slot = slotChart[name.substr(2, 1)];
      siden = this.p2.n;
      name = name.substr(5);
      pokemonid = 'p2: ' + name;
    } else if (name.substr(0, 2) === 'p1' && name.substr(3, 2) === ': ') {
      slot = slotChart[name.substr(2, 1)];
      siden = this.p1.n;
      name = name.substr(5);
      pokemonid = 'p1: ' + name;
    }
    return { name: name, siden: siden, slot: slot, pokemonid: pokemonid };
  };_proto3.
  getPokemon = function getPokemon(pokemonid, details) {
    var isNew = false; // if true, don't match any pokemon that already exists (for Team Preview)
    var isSwitch = false; // if true, don't match an active, fainted, or immediately-previously switched-out pokemon
    var isInactive = false; // if true, don't match an active pokemon
    var createIfNotFound = false; // if true, create the pokemon if a match wasn't found

    if (pokemonid === undefined || pokemonid === '??') return null;
    if (pokemonid.substr(0, 5) === 'new: ') {
      pokemonid = pokemonid.substr(5);
      isNew = true;
      createIfNotFound = true; // obviously
    }
    if (pokemonid.substr(0, 10) === 'switchin: ') {
      pokemonid = pokemonid.substr(10);
      isSwitch = true;
      createIfNotFound = true;
    }
    var parseIdResult = this.parsePokemonId(pokemonid);
    var name, siden, slot;
    name = parseIdResult.name;
    siden = parseIdResult.siden;
    slot = parseIdResult.slot;
    pokemonid = parseIdResult.pokemonid;

    if (!details) {
      if (siden < 0) return null;
      if (this.sides[siden].active[slot]) return this.sides[siden].active[slot];
      if (slot >= 0) isInactive = true;
    }

    var searchid = '';
    if (details) searchid = pokemonid + '|' + details;

    // search p1's pokemon
    if (siden !== this.p2.n && !isNew) {
      var active = this.p1.active[slot];
      if (active && active.searchid === searchid && !isSwitch) {
        active.slot = slot;
        return active;
      }
      for (var i = 0; i < this.p1.pokemon.length; i++) {
        var _pokemon = this.p1.pokemon[i];
        if (_pokemon.fainted && (isNew || isSwitch)) continue;
        if (isSwitch || isInactive) {
          if (this.p1.active.indexOf(_pokemon) >= 0) continue;
        }
        if (isSwitch && _pokemon == this.p1.lastPokemon && !this.p1.active[slot]) continue;
        if (searchid && _pokemon.searchid === searchid || // exact match
        !searchid && _pokemon.ident === pokemonid) {// name matched, good enough
          if (slot >= 0) _pokemon.slot = slot;
          return _pokemon;
        }
        if (!_pokemon.searchid && _pokemon.checkDetails(details)) {// switch-in matches Team Preview entry
          _pokemon = this.p1.newPokemon(this.parseDetails(name, pokemonid, details), i);
          if (slot >= 0) _pokemon.slot = slot;
          return _pokemon;
        }
      }
    }

    // search p2's pokemon
    if (siden !== this.p1.n && !isNew) {
      var _active2 = this.p2.active[slot];
      if (_active2 && _active2.searchid === searchid && !isSwitch) {
        if (slot >= 0) _active2.slot = slot;
        return _active2;
      }
      for (var _i18 = 0; _i18 < this.p2.pokemon.length; _i18++) {
        var _pokemon2 = this.p2.pokemon[_i18];
        if (_pokemon2.fainted && (isNew || isSwitch)) continue;
        if (isSwitch || isInactive) {
          if (this.p2.active.indexOf(_pokemon2) >= 0) continue;
        }
        if (isSwitch && _pokemon2 == this.p2.lastPokemon && !this.p2.active[slot]) continue;
        if (searchid && _pokemon2.searchid === searchid || // exact match
        !searchid && _pokemon2.ident === pokemonid) {// name matched, good enough
          if (slot >= 0) _pokemon2.slot = slot;
          return _pokemon2;
        }
        if (!_pokemon2.searchid && _pokemon2.checkDetails(details)) {// switch-in matches Team Preview entry
          _pokemon2 = this.p2.newPokemon(this.parseDetails(name, pokemonid, details), _i18);
          if (slot >= 0) _pokemon2.slot = slot;
          return _pokemon2;
        }
      }
    }

    if (!details || !createIfNotFound) return null;

    // pokemon not found, create a new pokemon object for it

    if (siden < 0) throw new Error("Invalid pokemonid passed to getPokemon");

    var species = name;
    var gender = '';
    var level = 100;
    var shiny = false;
    if (details) {
      var splitDetails = details.split(', ');
      if (splitDetails[splitDetails.length - 1] === 'shiny') {
        shiny = true;
        splitDetails.pop();
      }
      if (splitDetails[splitDetails.length - 1] === 'M' || splitDetails[splitDetails.length - 1] === 'F') {
        gender = splitDetails[splitDetails.length - 1];
        splitDetails.pop();
      }
      if (splitDetails[1]) {
        level = parseInt(splitDetails[1].substr(1), 10) || 100;
      }
      if (splitDetails[0]) {
        species = splitDetails[0];
      }
    }
    if (slot < 0) slot = 0;
    var pokemon = this.sides[siden].newPokemon({
      species: species,
      details: details,
      name: name,
      ident: name ? pokemonid : '',
      searchid: name ? pokemonid + '|' + details : '',
      level: level,
      gender: gender,
      shiny: shiny,
      slot: slot },
    isNew ? -2 : -1);
    return pokemon;
  };_proto3.
  getSide = function getSide(sidename) {
    if (sidename === 'p1' || sidename.substr(0, 3) === 'p1:') return this.p1;
    if (sidename === 'p2' || sidename.substr(0, 3) === 'p2:') return this.p2;
    if (this.mySide.id == sidename) return this.mySide;
    if (this.yourSide.id == sidename) return this.yourSide;
    if (this.mySide.name == sidename) return this.mySide;
    if (this.yourSide.name == sidename) return this.yourSide;
    return {
      name: sidename,
      id: sidename.replace(/ /g, '') };

  };_proto3.

  add = function add(command, fastForward) {
    if (this.playbackState === Playback.Uninitialized) {
      this.playbackState = Playback.Ready;
      this.activityQueue.push(command);
    } else if (this.playbackState === Playback.Finished) {
      this.playbackState = Playback.Playing;
      this.paused = false;
      this.activityQueue.push(command);
      this.scene.soundStart();
      if (fastForward) {
        this.fastForwardTo(-1);
      } else {
        this.nextActivity();
      }
    } else {
      this.activityQueue.push(command);
    }
  };_proto3.
  instantAdd = function instantAdd(command) {
    this.run(command, true);
    this.preemptActivityQueue.push(command);
    this.add(command);
  };_proto3.
  runMajor = function runMajor(args, kwargs, preempt) {
    switch (args[0]) {
      case 'start':{
          this.scene.teamPreview(false);
          this.mySide.active[0] = null;
          this.yourSide.active[0] = null;
          if (this.waitForResult()) return;
          this.start();
          break;
        }case 'upkeep':{
          this.usesUpkeep = true;
          this.updatePseudoWeatherLeft();
          this.updateToxicTurns();
          break;
        }case 'turn':{
          if (this.endPrevAction()) return;
          this.setTurn(args[1]);
          break;
        }case 'tier':{
          if (!args[1]) args[1] = '';
          for (var i in kwargs) {args[1] += '[' + i + '] ' + kwargs[i];}
          this.scene.log('<div style="padding:5px 0"><small>Format:</small> <br /><strong>' + Tools.escapeHTML(args[1]) + '</strong></div>');
          this.tier = args[1];
          if (this.tier.slice(-13) === 'Random Battle') {
            this.speciesClause = true;
          }
          break;
        }case 'gametype':{
          this.gameType = args[1];
          switch (args[1]) {
            default:
              this.mySide.active = [null];
              this.yourSide.active = [null];
              break;
            case 'doubles':
              this.mySide.active = [null, null];
              this.yourSide.active = [null, null];
              break;
            case 'triples':
            case 'rotation':
              this.mySide.active = [null, null, null];
              this.yourSide.active = [null, null, null];
              break;}

          this.scene.updateGen();
          break;
        }case 'variation':{
          this.scene.log('<div><small>Variation: <em>' + Tools.escapeHTML(args[1]) + '</em></small></div>');
          break;
        }case 'rule':{
          var ruleArgs = args[1].split(': ');
          this.scene.log('<div><small><em>' + Tools.escapeHTML(ruleArgs[0]) + (ruleArgs[1] ? ':' : '') + '</em> ' + Tools.escapeHTML(ruleArgs[1] || '') + '</div>');
          if (ruleArgs[0] === 'Species Clause') this.speciesClause = true;
          break;
        }case 'rated':{
          this.rated = true;
          this.scene.log('<div class="rated"><strong>' + (Tools.escapeHTML(args[1]) || 'Rated battle') + '</strong></div>');
          break;
        }case ':':{
          break;
        }case 'chat':case 'c':case 'c:':{
          var pipeIndex = args[1].indexOf('|');
          if (args[0] === 'c:') {
            args[1] = args[1].slice(pipeIndex + 1);
            pipeIndex = args[1].indexOf('|');
          }
          var _name = args[1].slice(0, pipeIndex);
          var rank = _name.charAt(0);
          if (this.ignoreSpects && (rank === ' ' || rank === '+')) break;
          if (this.ignoreOpponent && (rank === "\u2605" || rank === "\u2606") && toUserid(_name) !== vars.user.get('userid')) break;
          if (window.app && vars.ignore && vars.ignore[toUserid(_name)] && (rank === ' ' || rank === '+' || rank === "\u2605" || rank === "\u2606")) break;
          var message = args[1].slice(pipeIndex + 1);
          var isHighlighted = window.app && vars.rooms && vars.rooms[this.roomid].getHighlight(message);
          var parsedMessage = Tools.parseChatMessage(message, _name, '', isHighlighted);
          if (!$.isArray(parsedMessage)) parsedMessage = [parsedMessage];
          for (var _i19 = 0; _i19 < parsedMessage.length; _i19++) {
            if (!parsedMessage[_i19]) continue;
            this.scene.log(parsedMessage[_i19], preempt);
          }
          if (isHighlighted) {
            var notifyTitle = "Mentioned by " + _name + " in " + this.roomid;
            vars.rooms[this.roomid].notifyOnce(notifyTitle, "\"" + message + "\"", 'highlight');
          }
          break;
        }case 'chatmsg':{
          this.scene.log('<div class="chat">' + Tools.escapeHTML(args[1]) + '</div>', preempt);
          break;
        }case 'chatmsg-raw':case 'raw':case 'html':{
          this.scene.log('<div class="chat">' + Tools.sanitizeHTML(args[1]) + '</div>', preempt);
          break;
        }case 'error':{
          this.scene.log('<div class="chat message-error">' + Tools.escapeHTML(args[1]) + '</div>', preempt);
          break;
        }case 'pm':{
          this.scene.log('<div class="chat"><strong>' + Tools.escapeHTML(args[1]) + ':</strong> <span class="message-pm"><i style="cursor:pointer" onclick="selectTab(\'lobby\');rooms.lobby.popupOpen(\'' + Tools.escapeHTML(args[2], true) + '\')">(Private to ' + Tools.escapeHTML(args[3]) + ')</i> ' + Tools.parseMessage(args[4]) + '</span>');
          break;
        }case 'askreg':{
          this.scene.log('<div class="broadcast-blue"><b>Register an account to protect your ladder rating!</b><br /><button name="register" value="' + Tools.escapeHTML(args[1]) + '"><b>Register</b></button></div>');
          break;
        }case 'inactive':{
          if (!this.kickingInactive) this.kickingInactive = true;
          if (args[1].slice(0, 11) === "Time left: ") {
            this.kickingInactive = parseInt(args[1].slice(11), 10) || true;
            this.totalTimeLeft = parseInt(args[1].split(' | ')[1], 10);
            if (this.totalTimeLeft === this.kickingInactive) this.totalTimeLeft = 0;
            return;
          } else if (args[1].slice(0, 9) === "You have ") {
            // this is ugly but parseInt is documented to work this way
            // so I'm going to be lazy and not chop off the rest of the
            // sentence
            this.kickingInactive = parseInt(args[1].slice(9), 10) || true;
            return;
          } else if (args[1].slice(-14) === ' seconds left.') {
            var hasIndex = args[1].indexOf(' has ');
            var userid = window.app && vars.user && vars.user.get('userid');
            if (toId(args[1].slice(0, hasIndex)) === userid) {
              this.kickingInactive = parseInt(args[1].slice(hasIndex + 5), 10) || true;
            }
          }
          this.scene.log('<div class="chat message-error">' + Tools.escapeHTML(args[1]) + '</div>', preempt);
          break;
        }case 'inactiveoff':{
          this.kickingInactive = false;
          this.scene.log('<div class="chat message-error">' + Tools.escapeHTML(args[1]) + '</div>', preempt);
          break;
        }case 'timer':{
          break;
        }case 'join':case 'j':{
          if (this.roomid) {
            var room = vars.rooms[this.roomid];
            var user = args[1];
            var _userid = toUserid(user);
            if (/^[a-z0-9]/i.test(user)) user = ' ' + user;
            if (!room.users[_userid]) room.userCount.users++;
            room.users[_userid] = user;
            room.userList.add(_userid);
            room.userList.updateUserCount();
            room.userList.updateNoUsersOnline();
          }
          if (!this.ignoreSpects) {
            this.scene.log('<div class="chat"><small>' + Tools.escapeHTML(args[1]) + ' joined.</small></div>', preempt);
          }
          break;
        }case 'leave':case 'l':{
          if (this.roomid) {
            var _room = vars.rooms[this.roomid];
            var _user = args[1];
            var _userid2 = toUserid(_user);
            if (_room.users[_userid2]) _room.userCount.users--;
            delete _room.users[_userid2];
            _room.userList.remove(_userid2);
            _room.userList.updateUserCount();
            _room.userList.updateNoUsersOnline();
          }
          if (!this.ignoreSpects) {
            this.scene.log('<div class="chat"><small>' + Tools.escapeHTML(args[1]) + ' left.</small></div>', preempt);
          }
          break;
        }case 'J':case 'L':case 'N':case 'n':case 'spectator':case 'spectatorleave':{
          break;
        }case 'player':{
          var side = this.getSide(args[1]);
          side.setName(args[2]);
          if (args[3]) side.setAvatar(args[3]);
          this.scene.updateSidebar(side);
          if (this.joinButtons) this.scene.hideJoinButtons();
          break;
        }case 'teamsize':{
          var _side4 = this.getSide(args[1]);
          _side4.totalPokemon = parseInt(args[2], 10);
          this.scene.updateSidebar(_side4);
          break;
        }case 'win':{
          this.winner(args[1]);
          break;
        }case 'tie':{
          this.winner();
          break;
        }case 'prematureend':{
          this.prematureEnd();
          break;
        }case 'clearpoke':{
          this.p1.clearPokemon();
          this.p2.clearPokemon();
          break;
        }case 'poke':{
          var pokemon = this.getPokemon('new: ' + args[1], args[2]);
          if (args[3] === 'item') {
            pokemon.item = '(exists)';
          }
          break;
        }case 'detailschange':{
          var poke = this.getPokemon(args[1]);
          poke.removeVolatile('formechange');
          poke.removeVolatile('typeadd');
          poke.removeVolatile('typechange');

          var newSpecies = args[2];
          var commaIndex = newSpecies.indexOf(',');
          if (commaIndex !== -1) {
            var level = $.trim(newSpecies.substr(commaIndex + 1));
            if (level.charAt(0) === 'L') {
              poke.level = parseInt(level.substr(1), 10);
            }
            newSpecies = args[2].substr(0, commaIndex);
          }
          var template = Tools.getTemplate(newSpecies);
          var spriteData = { 'shiny': poke.sprite.sp.shiny };

          poke.species = newSpecies;
          poke.ability = poke.baseAbility = template.abilities ? template.abilities['0'] : '';
          poke.weightkg = template.weightkg;

          poke.details = args[2];
          poke.searchid = args[1].substr(0, 2) + args[1].substr(3) + '|' + args[2];

          poke.sprite.animTransform(poke, true, true);
          if (toId(newSpecies) === 'greninjaash') {
            this.message('' + poke.getName() + ' became Ash-Greninja!');
          } else if (toId(newSpecies) === 'mimikyubusted') {
            this.message('<small>' + poke.getName() + "'s disguise was busted!</small>");
          } else if (toId(newSpecies) === 'zygardecomplete') {
            this.message('' + poke.getName() + ' transformed into its Complete Forme!');
          } else if (toId(newSpecies) === 'necrozmaultra') {
            this.message('' + poke.getName() + ' regained its true power through Ultra Burst!');
          }
		  
			//mmo
			vars.differentMonInfo(((poke.side === this.mySide) ? "you" : "opp"), vars.slotFromPackage(this.mySide.active[0]), this.$expEl);

          break;
        }case 'teampreview':{
          this.teamPreviewCount = parseInt(args[1], 10);
          this.scene.teamPreview(true);
          break;
        }case 'switch':case 'drag':case 'replace':{
          this.endLastTurn();
          if (!this.hasPreMoveMessage && this.waitForResult()) return;
          this.hasPreMoveMessage = false;
          var _poke44 = this.getPokemon('switchin: ' + args[1], args[2]);
          var slot = _poke44.slot;
          _poke44.healthParse(args[3]);
          _poke44.removeVolatile('itemremoved');
          if (args[0] === 'switch') {
            if (_poke44.side.active[slot]) {
              _poke44.side.switchOut(_poke44.side.active[slot]);
            }
            _poke44.side.switchIn(_poke44);
          } else if (args[0] === 'replace') {
            _poke44.side.replace(_poke44);
          } else {
            _poke44.side.dragIn(_poke44);
          }
		  
			//mmo
			vars.differentMonInfo(((_poke44.side === this.mySide) ? "you" : "opp"), vars.slotFromPackage(this.mySide.active[0]), this.$expEl);

          break;
        }case 'faint':{
          if (this.waitForResult()) return;
          var _poke45 = this.getPokemon(args[1]);
          _poke45.side.faint(_poke45);
          break;
        }case 'swap':{
          if (isNaN(Number(args[2]))) {
            var _poke46 = this.getPokemon(args[1]);
            _poke46.side.swapWith(_poke46, this.getPokemon(args[2]), kwargs);
          } else {
            var _poke47 = this.getPokemon(args[1]);
            _poke47.side.swapTo(_poke47, parseInt(args[2], 10), kwargs);
          }
          break;
        }case 'move':{
          this.endLastTurn();
          if ((!kwargs.from || kwargs.from === 'lockedmove') && !this.hasPreMoveMessage && this.waitForResult()) return;
          this.hasPreMoveMessage = false;
          this.resetTurnsSinceMoved();
          var _poke48 = this.getPokemon(args[1]);
          var move = Tools.getMove(args[2]);
          if (this.checkActive(_poke48)) return;
          var poke2 = this.getPokemon(args[3]);
          _poke48.sprite.beforeMove();
          this.useMove(_poke48, move, poke2, kwargs);
          _poke48.sprite.afterMove();
          break;
        }case 'cant':{
          this.endLastTurn();
          this.resetTurnsSinceMoved();
          if (!this.hasPreMoveMessage && this.waitForResult()) return;
          this.hasPreMoveMessage = false;
          var _poke49 = this.getPokemon(args[1]);
          var effect = Tools.getEffect(args[2]);
          var _move2 = Tools.getMove(args[3]);
          this.cantUseMove(_poke49, effect, _move2, kwargs);
          break;
        }case 'message':{
          this.message(Tools.escapeHTML(args[1]));
          break;
        }case 'bigerror':{
          this.message('<div class="broadcast-red">' + Tools.escapeHTML(args[1]).replace(/\|/g, '<br />') + '</div>');
          break;
        }case 'done':case '':{
          if (this.ended || this.endPrevAction()) return;
          break;
        }case 'warning':{
          this.message('<strong>Warning:</strong> ' + Tools.escapeHTML(args[1]));
          this.message('Bug? Report it to <a href="http://www.smogon.com/forums/showthread.php?t=3453192">the replay viewer\'s Smogon thread</a>');
          this.scene.wait(1000);
          break;
        }case 'gen':{
          this.gen = parseInt(args[1], 10);
          this.scene.updateGen();
          break;
        }case 'callback':{
          args.shift();
          if (this.customCallback) this.customCallback(this, args[0], args, kwargs);
          break;
        }case 'debug':{
          args.shift();
          var _name2 = args.join(' ');
          this.scene.log('<div class="debug"><div class="chat"><small style="color:#999">[DEBUG] ' + Tools.escapeHTML(_name2) + '.</small></div></div>', preempt);
          break;
        }case 'seed':case 'choice':{
          break;
        }case 'unlink':{
          if (Tools.prefs('nounlink')) return;
          var _user2 = toId(args[2]) || toId(args[1]);
          var $messages = $('.chatmessage-' + _user2);
          if (!$messages.length) break;
          $messages.find('a').contents().unwrap();
          if (window.BattleRoom && args[2]) {
            $messages.hide().addClass('revealed').find('button').parent().remove();
            this.scene.log('<div class="chatmessage-' + _user2 + '"><button name="toggleMessages" value="' + _user2 + '" class="subtle"><small>(' + $messages.length + ' line' + ($messages.length > 1 ? 's' : '') + ' from ' + _user2 + ' hidden)</small></button></div>');
          }
          break;
        }case 'fieldhtml':{
          this.playbackState = Playback.Seeking; // force seeking to prevent controls etc
          this.scene.$frame.html(Tools.sanitizeHTML(args[1]));
          break;
        }case 'controlshtml':{
          var $controls = this.scene.$frame.parent().children('.battle-controls');
          $controls.html(Tools.sanitizeHTML(args[1]));
          break;
        }default:{
          this.scene.log('<div class="chat message-error">Unknown command: ' + Tools.escapeHTML(args[0]) + '</div>');
          if (this.errorCallback) this.errorCallback(this);
          break;
        }}
  };_proto3.
  run = function run(str, preempt) {
    if (this.preemptActivityQueue.length && str === this.preemptActivityQueue[0]) {
      this.preemptActivityQueue.shift();
      this.scene.preemptCatchup();
      return;
    }
    if (!str) return;
    if (str.charAt(0) !== '|' || str.substr(0, 2) === '||') {
      if (str.charAt(0) === '|') str = str.substr(2);
      this.scene.log('<div class="chat">' + Tools.escapeHTML(str) + '</div>', preempt);
      return;
    }
    var args = ['done'];
    var kwargs = {};
    if (str !== '|') {
      args = str.substr(1).split('|');
    }
    switch (args[0]) {
      case 'c':case 'c:':case 'chat':
      case 'chatmsg':case 'chatmsg-raw':case 'raw':case 'error':case 'html':
      case 'inactive':case 'inactiveoff':case 'warning':
      case 'fieldhtml':case 'controlshtml':case 'bigerror':
        // chat is preserved untouched
        args = [args[0], str.slice(args[0].length + 2)];
        break;
      default:
        // parse kwargs
        while (args.length) {
          var argstr = args[args.length - 1];
          if (argstr.substr(0, 1) !== '[') break;
          var bracketPos = argstr.indexOf(']');
          if (bracketPos <= 0) break;
          // default to '.' so it evaluates to boolean true
          kwargs[argstr.substr(1, bracketPos - 1)] = $.trim(argstr.substr(bracketPos + 1)) || '.';
          args.pop();
        }}


    // parse the next line if it's a minor: runMinor needs it parsed to determine when to merge minors
    var nextLine = '';
    var nextArgs = [''];
    var nextKwargs = {};
    nextLine = this.activityQueue[this.activityStep + 1] || '';
    if (nextLine && nextLine.substr(0, 2) === '|-') {
      nextLine = $.trim(nextLine.substr(1));
      nextArgs = nextLine.split('|');
      while (nextArgs[nextArgs.length - 1] && nextArgs[nextArgs.length - 1].substr(0, 1) === '[') {
        var _bracketPos = nextArgs[nextArgs.length - 1].indexOf(']');
        if (_bracketPos <= 0) break;
        var _argstr = nextArgs.pop();
        // default to '.' so it evaluates to boolean true
        nextKwargs[_argstr.substr(1, _bracketPos - 1)] = $.trim(_argstr.substr(_bracketPos + 1)) || '.';
      }
    }

    if (this.debug) {
      if (args[0].substr(0, 1) === '-') {
        this.runMinor(args, kwargs, preempt, nextArgs, nextKwargs);
      } else {
        this.runMajor(args, kwargs, preempt);
      }
    } else {
      try {
        if (args[0].substr(0, 1) === '-') {
          this.runMinor(args, kwargs, preempt, nextArgs, nextKwargs);
        } else {
          this.runMajor(args, kwargs, preempt);
        }
      } catch (e) {
        this.scene.log('<div class="broadcast-red">Error parsing: ' + Tools.escapeHTML(str) + ' (' + Tools.escapeHTML('' + e) + ')</div>', preempt);
        if (e.stack) {
          var stack = Tools.escapeHTML('' + e.stack).split('\n');
          for (var i = 0; i < stack.length; i++) {
            if (/\brun\b/.test(stack[i])) {
              stack.length = i;
              break;
            }
          }
          this.scene.log('<div class="broadcast-red">' + stack.join('<br>') + '</div>', preempt);
        }
        if (this.errorCallback) this.errorCallback(this);
      }
    }

    if (this.fastForward > 0 && this.fastForward < 1) {
      if (nextLine.substr(0, 6) === '|start') {
        this.fastForwardOff();
        if (this.endCallback) this.endCallback(this);
      }
    }
  };_proto3.
  endPrevAction = function endPrevAction() {
    this.hasPreMoveMessage = false;
    if (this.minorQueue.length) {
      this.runMinor();
      this.activityStep--;
      return true;
    }
    if (this.resultWaiting || this.scene.messagebarOpen) {
      this.scene.closeMessagebar();
      this.activityStep--;
      this.resultWaiting = false;
      this.activeMoveIsSpread = null;
      return true;
    }
    return false;
  };_proto3.
  checkActive = function checkActive(poke) {
    if (!poke.side.active[poke.slot]) {
      // SOMEONE jumped in in the middle of a replay. <_<
      poke.side.replace(poke);
    }
    return false;
  };_proto3.
  waitForResult = function waitForResult() {
    if (this.endPrevAction()) return true;
    this.resultWaiting = true;
    return false;
  };_proto3.

  pause = function pause() {
    this.paused = true;
    this.playbackState = Playback.Paused;
    this.scene.pause();
  };_proto3.
  play = function play() {
    this.paused = false;
    this.playbackState = Playback.Playing;
    this.scene.resume();
    this.nextActivity();
  };_proto3.
  skipTurn = function skipTurn() {
    this.fastForwardTo(this.turn + 1);
  };_proto3.
  fastForwardTo = function fastForwardTo(time) {
    if (this.fastForward) return;
    if (time === 0 || time === '0') {
      time = 0.5;
    } else {
      time = Math.floor(Number(time));
    }
    if (isNaN(time)) return;
    if (this.ended && time >= this.turn + 1) return;

    if (time <= this.turn && time !== -1) {
      var paused = this.paused;
      this.reset(true);
      if (paused) this.pause();else
      this.paused = false;
      this.fastForwardWillScroll = true;
    }
    this.scene.animationOff();
    this.playbackState = Playback.Seeking;
    this.fastForward = time;
    this.nextActivity();
  };_proto3.
  fastForwardOff = function fastForwardOff() {
    this.fastForward = 0;
    this.scene.animationOn();
    if (this.paused) {
      this.playbackState = Playback.Paused;
    } else {
      this.playbackState = Playback.Playing;
    }
  };_proto3.
  nextActivity = function nextActivity() {var _this = this;
    this.scene.startAnimations();
    var animations;
    while (!animations) {
      if (this.activityStep >= this.activityQueue.length) {
        this.fastForwardOff();
        if (this.ended) {
          this.paused = true;
          this.scene.soundStop();
        }
        this.playbackState = Playback.Finished;
        if (this.endCallback) this.endCallback(this);
        return;
      }
      var ret = void 0;
      if (this.paused && !this.fastForward) return;
      if (!ret) {
        this.run(this.activityQueue[this.activityStep]);
        this.activityStep++;
      }
      animations = this.scene.finishAnimations();
    }

    if (this.playbackState === Playback.Paused) return;

    var interruptionCount = this.scene.interruptionCount;
    animations.done(function () {
      if (interruptionCount === _this.scene.interruptionCount) {
        _this.nextActivity();
      }
    });
  };_proto3.

  newBattle = function newBattle() {
    this.reset();
    this.activityQueue = [];
  };_proto3.
  setQueue = function setQueue(queue) {
    this.reset();
    this.activityQueue = queue;

    /* for (let i = 0; i < queue.length && i < 20; i++) {
                                	if (queue[i].substr(0, 8) === 'pokemon ') {
                                		let sp = this.parseSpriteData(queue[i].substr(8));
                                		BattleSound.loadEffect(sp.cryurl);
                                		this.preloadImage(sp.url);
                                		if (sp.url === '/sprites/bwani/meloetta.gif') {
                                			this.preloadImage('/sprites/bwani/meloetta-pirouette.gif');
                                		}
                                		if (sp.url === '/sprites/bwani-back/meloetta.gif') {
                                			this.preloadImage('/sprites/bwani-back/meloetta-pirouette.gif');
                                		}
                                	}
                                } */
    this.playbackState = Playback.Ready;
  };_proto3.

  setMute = function setMute(mute) {
    BattleSound.setMute(mute);
  };return Battle;}();