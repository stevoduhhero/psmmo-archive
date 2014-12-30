var Room = this.Room = Backbone.View.extend({
	className: 'ps-room',
	constructor: function(options) {
		if (!this.events) this.events = {};
		if (!this.events['click button']) this.events['click button'] = 'dispatchClickButton';
		if (!this.events['click']) this.events['click'] = 'dispatchClickBackground';

		Backbone.View.apply(this, arguments);

		if (!(options && options.nojoin)) this.join();
	},
	dispatchClickButton: function(e) {
		var target = e.currentTarget;
		if (target.name) {
			vars.dismissingSource = vars.dismissPopups();
			vars.dispatchingButton = target;
			e.preventDefault();
			e.stopImmediatePropagation();
			this[target.name].call(this, target.value, target);
			delete vars.dismissingSource;
			delete vars.dispatchingButton;
		}
	},
	dispatchClickBackground: function(e) {
		vars.dismissPopups();
		if (e.shiftKey || (window.getSelection && !window.getSelection().isCollapsed)) {
			return;
		}
		this.focus();
	},

	// communication

	/**
	 * Send to sim server
	 */
	send: function(data) {
		vars.send(data, this.id);
	},
	/**
	 * Receive from sim server
	 */
	receive: function(data) {
		//
	},

	// layout

	bestWidth: 659,
	show: function(position, leftWidth) {
		switch (position) {
		case 'left':
			this.$el.css({left: 0, width: leftWidth, right: 'auto'});
			break;
		case 'right':
			this.$el.css({left: leftWidth+1, width: 'auto', right: 0});
			this.leftWidth = leftWidth;
			break;
		case 'full':
			this.$el.css({left: 0, width: 'auto', right: 0});
			break;
		}
		this.$el.show();
		this.dismissNotification();
	},
	hide: function() {
		this.blur();
		this.$el.hide();
	},
	focus: function() {},
	blur: function() {},
	join: function() {},
	leave: function() {},

	// notifications

	requestNotifications: function() {
		try {
			if (window.webkitNotifications && webkitNotifications.requestPermission) {
				// Notification.requestPermission crashes Chrome 23:
				//   https://code.google.com/p/chromium/issues/detail?id=139594
				// In lieu of a way to detect Chrome 23, we'll just use the old
				// requestPermission API, which works to request permissions for
				// the new Notification spec anyway.
				webkitNotifications.requestPermission();
			} else if (window.Notification && Notification.requestPermission) {
				Notification.requestPermission(function(permission) {});
			}
		} catch (e) {}
	},
	notifications: null,
	notify: function(title, body, tag, once) {
		if (once && vars.focused && (this === vars.curRoom || this == vars.curSideRoom)) return;
		if (!tag) tag = 'message';
		if (!this.notifications) this.notifications = {};
		if (vars.focused && (this === vars.curRoom || this == vars.curSideRoom)) {
			this.notifications[tag] = {};
		} else if (window.nodewebkit) {
			nwWindow.requestAttention(true);
		} else if (window.Notification) {
			// old one doesn't need to be closed; sending the tag should
			// automatically replace the old notification
			var notification = this.notifications[tag] = new Notification(title, {
				lang: 'en',
				body: body,
				tag: this.id+':'+tag,
			});
			var self = this;
			notification.onclose = function() {
				self.dismissNotification(tag);
			};
			notification.onclick = function() {
				self.clickNotification(tag);
			};
			if (Tools.prefs('temporarynotifications')) {
				if (notification.cancel) {
					setTimeout(function() {notification.cancel();}, 5000);
				} else if (notification.close) {
					setTimeout(function() {notification.close();}, 5000);
				}
			}
			if (once) notification.psAutoclose = true;
		} else if (window.macgap) {
			macgap.growl.notify({
				title: title,
				content: body
			});
			var notification = {};
			this.notifications[tag] = notification;
			if (once) notification.psAutoclose = true;
		} else {
			var notification = {};
			this.notifications[tag] = notification;
			if (once) notification.psAutoclose = true;
		}
		vars.topbar.updateTabbar();
	},
	notifyOnce: function(title, body, tag) {
		return this.notify(title, body, tag, true);
	},
	closeNotification: function(tag, alreadyClosed) {
		if (window.nodewebkit) nwWindow.requestAttention(false);
		if (!this.notifications) return;
		if (!tag) {
			for (tag in this.notifications) {
				if (this.notifications[tag].close) this.notifications[tag].close();
			}
			this.notifications = null;
			vars.topbar.updateTabbar();
			return;
		}
		if (!this.notifications[tag]) return;
		if (!alreadyClosed && this.notifications[tag].close) this.notifications[tag].close();
		delete this.notifications[tag];
		if (_.isEmpty(this.notifications)) {
			this.notifications = null;
			vars.topbar.updateTabbar();
		}
	},
	dismissNotification: function(tag) {
		if (window.nodewebkit) nwWindow.requestAttention(false);
		if (!this.notifications) return;
		if (!tag) {
			for (tag in this.notifications) {
				if (!this.notifications[tag].psAutoclose) continue;
				if (this.notifications[tag].close) this.notifications[tag].close();
				delete this.notifications[tag];
			}
			if (_.isEmpty(this.notifications)) {
				this.notifications = null;
				vars.topbar.updateTabbar();
			}
			return;
		}
		if (!this.notifications[tag]) return;
		if (this.notifications[tag].close) this.notifications[tag].close();
		if (this.notifications[tag].psAutoclose) {
			delete this.notifications[tag];
			if (_.isEmpty(this.notifications)) {
				this.notifications = null;
				vars.topbar.updateTabbar();
			}
		} else {
			this.notifications[tag] = {};
		}
	},
	clickNotification: function(tag) {
		this.dismissNotification(tag);
		vars.focusRoom(this.id);
	},
	close: function() {
		vars.leaveRoom(this.id);
	},

	// allocation

	destroy: function() {
		this.closeNotification();
		this.leave();
		this.remove();
		delete this.app;
	}
});
var Popup = this.Popup = Backbone.View.extend({

	// If type is 'modal', background will turn gray and popup won't be
	// dismissible except by interacting with it.
	// If type is 'semimodal', background will turn gray, but clicking
	// the background will dismiss it.
	// Otherwise, background won't change, and interacting with anything
	// other than the popup will still be possible (and will dismiss
	// the popup).
	type: 'normal',

	className: 'ps-popup',
	constructor: function(data) {
		if (!this.events) this.events = {};
		if (!this.events['click button']) this.events['click button'] = 'dispatchClickButton';
		if (!this.events['submit form']) this.events['submit form'] = 'dispatchSubmit';
		if (data && data.sourceEl) {
			this.sourceEl = data.sourceEl = $(data.sourceEl);
		}
		if (data.type) this.type = data.type;
		if (data.position) this.position = data.position;

		Backbone.View.apply(this, arguments);

		// if we have no source, we can't attach to anything
		if (this.type === 'normal' && !this.sourceEl) this.type = 'semimodal';

		if (this.type === 'normal') {
			// nonmodal popup: should be positioned near source element
			var $el = this.$el;
			var $measurer = $('<div style="position:relative;height:0;overflow:hidden"></div>').appendTo('body').append($el);
			$el.css('width', this.width - 22);

			var offset = this.sourceEl.offset();

			var room = $(window).height();
			var height = $el.outerHeight();
			var width = $el.outerWidth();
			var sourceHeight = this.sourceEl.outerHeight();

			if (this.position === 'right') {

				if (room > offset.top + height + 5 &&
					(offset.top < room * 2/3 || offset.top + 200 < room)) {
					$el.css('top', offset.top);
				} else {
					$el.css('bottom', Math.max(room - offset.top - sourceHeight, 0));
				}
				$el.css('left', offset.left + this.sourceEl.outerWidth());

			} else {

				if (room > offset.top + sourceHeight + height + 5 &&
					(offset.top + sourceHeight < room * 2/3 || offset.top + sourceHeight + 200 < room)) {
					$el.css('top', offset.top + sourceHeight);
				} else if (height + 5 <= offset.top) {
					$el.css('bottom', room - offset.top);
				} else if (height + 10 < room) {
					$el.css('bottom', 5);
				} else {
					$el.css('top', 0);
				}

				room = $(window).width() - offset.left;
				if (room < width + 10) {
					$el.css('right', 10);
				} else {
					$el.css('left', offset.left);
				}

			}

			$el.detach();
			$measurer.remove();
		}
	},
	initialize: function(data) {
		this.type = 'semimodal';
		this.$el.html('<p style="white-space:pre-wrap">'+Tools.parseMessage(data.message)+'</p><p class="buttonbar"><button name="close" class="autofocus"><strong>OK</strong></button></p>').css('max-width', 480);
	},

	dispatchClickButton: function(e) {
		var target = e.currentTarget;
		if (target.name) {
			vars.dispatchingButton = target;
			vars.dispatchingPopup = this;
			e.preventDefault();
			e.stopImmediatePropagation();
			this[target.name].call(this, target.value, target);
			delete vars.dispatchingButton;
			delete vars.dispatchingPopup;
		}
	},
	dispatchSubmit: function(e) {
		e.preventDefault();
		e.stopPropagation();
		var dataArray = $(e.currentTarget).serializeArray();
		var data = {};
		for (var i=0, len=dataArray.length; i<len; i++) {
			var name = dataArray[i].name, value = dataArray[i].value;
			if (data[name]) {
				if (!data[name].push) data[name] = [data[name]];
				data[name].push(value||'');
			} else {
				data[name] = (value||'');
			}
		}
		this.submit(data);
	},

	remove: function() {
		var $parent = this.$el.parent();
		Backbone.View.prototype.remove.apply(this, arguments);
		if ($parent.hasClass('ps-overlay')) $parent.remove();
	},

	close: function() {
		vars.closePopup();
	}
});

var PromptPopup = this.PromptPopup = Popup.extend({
	type: 'semimodal',
	initialize: function(data) {
		if (!data || !data.message || typeof data.callback !== "function") return;
		this.callback = data.callback;

		var buf = '<form>';
		buf += '<p><label class="label">' + data.message;
		buf += '<input class="textbox autofocus" type="text" name="data" /></label></p>';
		buf += '<p class="buttonbar"><button type="submit"><strong>' + data.button + '</strong></button> <button name="close">Cancel</button></p>';
		buf += '</form>';

		this.$el.html(buf);
	},
	submit: function(data) {
		this.close();
		this.callback(data.data);
	}
});

var UserPopup = this.UserPopup = Popup.extend({
	initialize: function(data) {
		data.userid = toId(data.name);
		var name = data.name;
		if (/[a-zA-Z0-9]/.test(name.charAt(0))) name = ' '+name;
		this.data = data = _.extend(data, UserPopup.dataCache[data.userid]);
		data.name = name;
		vars.on('response:userdetails', this.update, this);
		vars.send('/cmd userdetails '+data.userid);
		this.update();
	},
	events: {
		'click .ilink': 'clickLink',
		'click .yours': 'avatars'
	},
	update: function(data) {
		if (data && data.userid === this.data.userid) {
			data = _.extend(this.data, data);
			UserPopup.dataCache[data.userid] = data;
		} else {
			data = this.data;
		}
		var userid = data.userid;
		var name = data.name;
		var avatar = data.avatar || '';
		var groupDetails = {
			'#': "Room Owner (#)",
			'~': "Administrator (~)",
			'&': "Leader (&amp;)",
			'@': "Moderator (@)",
			'%': "Driver (%)",
			'\u2605': "Player (\u2605)",
			'+': "Voiced (+)",
			'â€½': "<span style='color:#777777'>Locked (â€½)</span>",
			'!': "<span style='color:#777777'>Muted (!)</span>"
		};
		var group = (groupDetails[name.substr(0, 1)] || '');
		if (group || name.charAt(0) === ' ') name = name.substr(1);

		var buf = '<div class="userdetails">';
		if (avatar) buf += '<img class="trainersprite'+(userid===vars.user.get('userid')?' yours':'')+'" src="'+Tools.resolveAvatar(avatar)+'" />';
		buf += '<strong><a href="//pokemonshowdown.com/users/'+userid+'" target="_blank">' + Tools.escapeHTML(name) + '</a></strong><br />';
		buf += '<small>' + (group || '&nbsp;') + '</small>';
		if (data.rooms) {
			var battlebuf = '';
			var chatbuf = '';
			for (var i in data.rooms) {
				if (i === 'global') continue;
				var roomid = toRoomid(i);
				if (roomid.substr(0,7) === 'battle-') {
					if (!battlebuf) battlebuf = '<br /><em>Battles:</em> ';
					else battlebuf += ', ';
					battlebuf += '<a href="'+vars.root+roomid+'" class="ilink">'+roomid.substr(7)+'</a>';
				} else {
					if (!chatbuf) chatbuf = '<br /><em>Chatrooms:</em> ';
					else chatbuf += ', ';
					chatbuf += '<a href="'+vars.root+roomid+'" class="ilink">'+roomid+'</a>';
				}
			}
			buf += '<small class="rooms">'+battlebuf+chatbuf+'</small>';
		} else if (data.rooms === false) {
			buf += '<strong class="offline">OFFLINE</strong>';
		}
		buf += '</div>';

		if (userid === vars.user.get('userid') || !vars.user.get('named')) {
			buf += '<p class="buttonbar"><button disabled>Challenge</button> <button disabled>Chat</button></p>';
		} else {
			buf += '<p class="buttonbar"><button name="challenge">Challenge</button> <button name="pm">Chat</button></p>';
		}

		this.$el.html(buf);
	},
	clickLink: function(e) {
		if (e.cmdKey || e.metaKey || e.ctrlKey) return;
		e.preventDefault();
		e.stopPropagation();
		this.close();
		var roomid = $(e.currentTarget).attr('href').substr(vars.root.length);
		vars.tryJoinRoom(roomid);
	},
	avatars: function() {
		vars.addPopup(AvatarsPopup);
	},
	challenge: function() {
		vars.rooms[''].requestNotifications();
		this.close();
		vars.focusRoom('');
		vars.rooms[''].challenge(this.data.name);
	},
	pm: function() {
		vars.rooms[''].requestNotifications();
		this.close();
		vars.focusRoom('');
		vars.rooms[''].focusPM(this.data.name);
	}
},{
	dataCache: {}
});

var ReconnectPopup = this.ReconnectPopup = Popup.extend({
	type: 'modal',
	initialize: function(data) {
		vars.reconnectPending = false;
		var buf = '<form>';

		if (data.cantconnect) {
			buf += '<p class="error">Couldn\'t connect to server!</p>';
			buf += '<p class="buttonbar"><button type="submit">Retry</button> <button name="close">Close</button></p>';
		} else {
			buf += '<p>You have been disconnected &ndash; possibly because the server was restarted.</p>';
			buf += '<p class="buttonbar"><button type="submit" class="autofocus"><strong>Reconnect</strong></button> <button name="close">Close</button></p>';
		}

		buf += '</form>';
		this.$el.html(buf);
	},
	submit: function(data) {
		document.location.reload();
	}
});

var LoginPopup = this.LoginPopup = Popup.extend({
	type: 'semimodal',
	initialize: function(data) {
		var buf = '<form>';

		if (data.error) {
			buf += '<p class="error">' + Tools.escapeHTML(data.error) + '</p>';
			if (data.error.indexOf('inappropriate') >= 0) {
				buf += '<p>Keep in mind these rules:</p>';
				buf += '<ol>';
				buf += '<li>Usernames may not be derogatory or insulting in nature, to an individual or group (insulting yourself is okay as long as it\'s not too serious).</li>';
				buf += '<li>Usernames may not directly reference sexual activity.</li>';
				buf += '<li>Usernames may not be excessively disgusting.</li>';
				buf += '<li>Usernames may not impersonate a recognized user (a user with %, @, &, or ~ next to their name).</li>';
				buf += '</ol>';
			}
		} else if (data.reason) {
			buf += '<p>' + Tools.parseMessage(data.reason) + '</p>';
		}

		var name = (data.name || '');
		if (!name && vars.user.get('named')) name = vars.user.get('name');
		buf += '<p><label class="label">Username: <input class="textbox autofocus" type="text" name="username" value="'+Tools.escapeHTML(name)+'"></label></p>';
		buf += '<p class="buttonbar"><button type="submit"><strong>Choose name</strong></button> <button name="close">Cancel</button></p>';

		buf += '</form>';
		this.$el.html(buf);
	},
	submit: function(data) {
		this.close();
		vars.user.rename(data.username);
	}
});

var ChangePasswordPopup = this.ChangePasswordPopup = Popup.extend({
	type: 'semimodal',
	initialize: function(data) {
		var buf = '<form>';
		if (data.error) {
			buf += '<p class="error">' + data.error + '</p>';
		} else {
			buf += '<p>Change your password:</p>';
		}
		buf += '<p><label class="label">Username: <strong>' + vars.user.get('name') + '</strong></label></p>';
		buf += '<p><label class="label">Old password: <input class="textbox autofocus" type="password" name="oldpassword" /></label></p>';
		buf += '<p><label class="label">New password: <input class="textbox" type="password" name="password" /></label></p>';
		buf += '<p><label class="label">New password (confirm): <input class="textbox" type="password" name="cpassword" /></label></p>';
		buf += '<p class="buttonbar"><button type="submit"><strong>Change password</strong></button> <button name="close">Cancel</button></p></form>';
		this.$el.html(buf);
	},
	submit: function(data) {
		$.post(vars.user.getActionPHP(), {
			act: 'changepassword',
			oldpassword: data.oldpassword,
			password: data.password,
			cpassword: data.cpassword
		}, Tools.safeJSON(function(data) {
			if (!data) data = {};
			if (data.actionsuccess) {
				vars.addPopupMessage("Your password was successfully changed.");
			} else {
				vars.addPopup(ChangePasswordPopup, {
					error: data.actionerror
				});
			}
		}), 'text');
	}
});

var RegisterPopup = this.RegisterPopup = Popup.extend({
	type: 'semimodal',
	initialize: function(data) {
		var buf = '<form>';
		if (data.error) {
			buf += '<p class="error">' + data.error + '</p>';
		} else if (data.reason) {
			buf += '<p>' + data.reason + '</p>';
		} else {
			buf += '<p>Register your account:</p>';
		}
		buf += '<p><label class="label">Username: <strong>' + Tools.escapeHTML(data.name || vars.user.get('name')) + '</strong><input type="hidden" name="name" value="' + Tools.escapeHTML(data.name || vars.user.get('name')) + '" /></label></p>';
		buf += '<p><label class="label">Password: <input class="textbox autofocus" type="password" name="password" /></label></p>';
		buf += '<p><label class="label">Password (confirm): <input class="textbox" type="password" name="cpassword" /></label></p>';
		buf += '<p><label class="label"><img src="' + Tools.resourcePrefix + 'sprites/bwani/pikachu.gif" /></label></p>';
		buf += '<p><label class="label">What is this pokemon? <input class="textbox" type="text" name="captcha" value="' + Tools.escapeHTML(data.captcha) + '" /></label></p>';
		buf += '<p class="buttonbar"><button type="submit"><strong>Register</strong></button> <button name="close">Cancel</button></p></form>';
		this.$el.html(buf);
	},
	submit: function(data) {
		var name = data.name;
		var captcha = data.captcha;
		$.post(vars.user.getActionPHP(), {
			act: 'register',
			username: name,
			password: data.password,
			cpassword: data.cpassword,
			captcha: captcha,
			challengekeyid: vars.user.challengekeyid,
			challenge: vars.user.challenge
		}, Tools.safeJSON(function (data) {
			if (!data) data = {};
			var token = data.assertion;
			if (data.curuser && data.curuser.loggedin) {
				vars.user.set('registered', data.curuser);
				var name = data.curuser.username;
				vars.send('/trn '+name+',1,'+token);
				vars.addPopupMessage("You have been successfully registered.");
			} else {
				vars.addPopup(RegisterPopup, {
					name: name,
					captcha: captcha,
					error: data.actionerror
				});
			}
		}), 'text');
	}
});

var LoginPasswordPopup = this.LoginPasswordPopup = Popup.extend({
	type: 'semimodal',
	initialize: function(data) {
		var buf = '<form>';

		if (data.error) {
			buf += '<p class="error">' + Tools.escapeHTML(data.error) + '</p>';
			if (data.error.indexOf(' forced you to change ') >= 0) {
				buf += '<p>Keep in mind these rules:</p>';
				buf += '<ol>';
				buf += '<li>Usernames may not be derogatory or insulting in nature, to an individual or group (insulting yourself is okay as long as it\'s not too serious).</li>';
				buf += '<li>Usernames may not reference sexual activity, directly or indirectly.</li>';
				buf += '<li>Usernames may not impersonate a recognized user (a user with %, @, &, or ~ next to their name).</li>';
				buf += '</ol>';
			}
		} else if (data.reason) {
			buf += '<p>' + Tools.escapeHTML(data.reason) + '</p>';
		} else {
			buf += '<p class="error">The name you chose is registered.</p>';
		}

		buf += '<p>Log in:</p>';
		buf += '<p><label class="label">Username: <strong>'+Tools.escapeHTML(data.username)+'<input type="hidden" name="username" value="'+Tools.escapeHTML(data.username)+'" /></strong></label></p>';
		buf += '<p><label class="label">Password: <input class="textbox autofocus" type="password" name="password"></label></p>';
		buf += '<p class="buttonbar"><button type="submit"><strong>Log in</strong></button> <button name="close">Cancel</button></p>';

		buf += '<p class="or">or</p>';
		buf += '<p class="buttonbar"><button name="login">Choose another name</button></p>';

		buf += '</form>';
		this.$el.html(buf);
	},
	login: function() {
		this.close();
		vars.addPopup(LoginPopup);
	},
	submit: function(data) {
		this.close();
		vars.user.passwordRename(data.username, data.password);
	}
});

var ProxyPopup = this.ProxyPopup = Popup.extend({
	type: 'modal',
	initialize: function(data) {
		this.callback = data.callback;

		var buf = '<form>';
		buf += '<p>Because of the <a href="https://en.wikipedia.org/wiki/Same-origin_policy" target="_blank">same-origin policy</a>, some manual work is required to complete the requested action when using <code>testclient.html</code>.</p>';
		buf += '<iframe id="overlay_iframe" src="' + data.uri + '" style="width: 100%; height: 50px;" class="textbox"></iframe>';
		buf += '<p>Please copy <strong>all the text</strong> from the box above and paste it in the box below.</p>';
		buf += '<p><label class="label" style="float: left;">Data from the box above:</label> <input style="width: 100%;" class="textbox autofocus" type="text" name="result" /></p>';
		buf += '<p class="buttonbar"><button type="submit"><strong>Submit</strong></button> <button name="close">Cancel</button></p>';
		buf += '</form>';
		this.$el.html(buf).css('min-width', 500);
	},
	submit: function(data) {
		this.close();
		this.callback(data.result);
	}
});

var SoundsPopup = this.SoundsPopup = Popup.extend({
	initialize: function(data) {
		var buf = '';
		var muted = !!Tools.prefs('mute');
		buf += '<p class="effect-volume"><label class="optlabel">Effect volume:</label>'+(muted?'<em>(muted)</em>':'<input type="slider" name="effectvolume" value="'+(Tools.prefs('effectvolume')||50)+'" />')+'</p>';
		buf += '<p class="music-volume"><label class="optlabel">Music volume:</label>'+(muted?'<em>(muted)</em>':'<input type="slider" name="musicvolume" value="'+(Tools.prefs('musicvolume')||50)+'" />')+'</p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="muted"'+(muted?' checked':'')+' /> Mute sounds</label></p>';
		this.$el.html(buf).css('min-width', 160);
	},
	events: {
		'change input[name=muted]': 'setMute'
	},
	domInitialize: function() {
		var self = this;
		this.$('.effect-volume input').slider({
			from: 0,
			to: 100,
			step: 1,
			dimension: '%',
			skin: 'round_plastic',
			onstatechange: function(val) {
				self.setEffectVolume(val);
			}
		});
		this.$('.music-volume input').slider({
			from: 0,
			to: 100,
			step: 1,
			dimension: '%',
			skin: 'round_plastic',
			onstatechange: function(val) {
				self.setMusicVolume(val);
			}
		});
	},
	setMute: function(e) {
		var muted = !!e.currentTarget.checked;
		Tools.prefs('mute', muted);
		BattleSound.setMute(muted);

		if (!muted) {
			this.$('.effect-volume').html('<label class="optlabel">Effect volume:</label><input type="slider" name="effectvolume" value="'+(Tools.prefs('effectvolume')||50)+'" />');
			this.$('.music-volume').html('<label class="optlabel">Music volume:</label><input type="slider" name="musicvolume" value="'+(Tools.prefs('musicvolume')||50)+'" />');
			this.domInitialize();
		} else {
			this.$('.effect-volume').html('<label class="optlabel">Effect volume:</label><em>(muted)</em>');
			this.$('.music-volume').html('<label class="optlabel">Music volume:</label><em>(muted)</em>');
		}

		vars.topbar.$('button[name=openSounds]').html('<i class="'+(muted?'icon-volume-off':'icon-volume-up')+'"></i>');
	},
	setEffectVolume: function(volume) {
		BattleSound.setEffectVolume(volume);
		Tools.prefs('effectvolume', volume);
	},
	setMusicVolume: function(volume) {
		BattleSound.setBgmVolume(volume);
		Tools.prefs('musicvolume', volume);
	}
});

var OptionsPopup = this.OptionsPopup = Popup.extend({
	initialize: function(data) {
		vars.user.on('change', this.update, this);
		vars.send('/cmd userdetails '+vars.user.get('userid'));
		this.update();
	},
	events: {
		'change input[name=noanim]': 'setNoanim',
		'change input[name=bwgfx]': 'setBwgfx',
		'change input[name=notournaments]': 'setNotournaments',
		'change input[name=nolobbypm]': 'setNolobbypm',
		'change input[name=temporarynotifications]': 'setTemporaryNotifications',
		'change input[name=ignorespects]': 'setIgnoreSpects',
		'change select[name=bg]': 'setBg',
		'change select[name=timestamps-lobby]': 'setTimestampsLobby',
		'change select[name=timestamps-pms]': 'setTimestampsPMs',
		'change input[name=logchat]': 'setLogChat',
		'change input[name=selfhighlight]': 'setSelfHighlight',
		'click img': 'avatars'
	},
	update: function() {
		var name = vars.user.get('name');
		var avatar = vars.user.get('avatar');

		var buf = '';
		buf += '<p>'+(avatar?'<img class="trainersprite" src="'+Tools.resolveAvatar(avatar)+'" width="40" height="40" style="vertical-align:middle" />':'')+'<strong>'+Tools.escapeHTML(name)+'</strong></p>';
		buf += '<p><button name="avatars">Change avatar</button></p>';

		buf += '<hr />';
		buf += '<p><label class="optlabel">Background: <select name="bg"><option value="">Charizards</option><option value="#344b6c url(/fx/client-bg-horizon.jpg) no-repeat left center fixed">Horizon</option><option value="#546bac url(/fx/client-bg-3.jpg) no-repeat left center fixed">Waterfall</option><option value="#546bac url(/fx/client-bg-ocean.jpg) no-repeat left center fixed">Ocean</option><option value="#344b6c">Solid blue</option>'+(Tools.prefs('bg')?'<option value="" selected></option>':'')+'</select></label></p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="noanim"'+(Tools.prefs('noanim')?' checked':'')+' /> Disable animations</label></p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="bwgfx"'+(Tools.prefs('bwgfx')?' checked':'')+' /> Enable BW sprites</label></p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="notournaments"'+(Tools.prefs('notournaments')?' checked':'')+' /> Ignore tournaments</label></p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="nolobbypm"'+(Tools.prefs('nolobbypm')?' checked':'')+' /> Don\'t show PMs in lobby chat</label></p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="selfhighlight"'+(!Tools.prefs('noselfhighlight')?' checked':'')+'> Highlight when your name is said in chat</label></p>';

		if (window.Notification) {
			buf += '<p><label class="optlabel"><input type="checkbox" name="temporarynotifications"'+(Tools.prefs('temporarynotifications')?' checked':'')+' /> Temporary notifications</label></p>';
		}

		var timestamps = this.timestamps = (Tools.prefs('timestamps') || {});
		buf += '<p><label class="optlabel">Timestamps in lobby chat: <select name="timestamps-lobby"><option value="off">Off</option><option value="minutes"'+(timestamps.lobby==='minutes'?' selected="selected"':'')+'>[HH:MM]</option><option value="seconds"'+(timestamps.lobby==='seconds'?' selected="selected"':'')+'>[HH:MM:SS]</option></select></label></p>';
		buf += '<p><label class="optlabel">Timestamps in PMs: <select name="timestamps-pms"><option value="off">Off</option><option value="minutes"'+(timestamps.pms==='minutes'?' selected="selected"':'')+'>[HH:MM]</option><option value="seconds"'+(timestamps.pms==='seconds'?' selected="selected"':'')+'>[HH:MM:SS]</option></select></label></p>';
		buf += '<p><label class="optlabel">Chat preferences: <button name="formatting">Edit formatting</button></label></p>';

		if (vars.curRoom.battle) {
			buf += '<hr />';
			buf += '<h3>Current room</h3>';
			buf += '<p><label class="optlabel"><input type="checkbox" name="ignorespects"'+(vars.curRoom.battle.ignoreSpects?' checked':'')+'> Ignore spectators</label></p>';
		}

		if (window.nodewebkit) {
			buf += '<hr />';
			buf += '<h3>Desktop app</h3>';
			buf += '<p><label class="optlabel"><input type="checkbox" name="logchat"'+(Tools.prefs('logchat')?' checked':'')+'> Log chat</label></p>';
			buf += '<p id="openLogFolderButton"'+(Storage.dir?'':' style="display:none"')+'><button name="openLogFolder">Open log folder</button></p>';
		}

		buf += '<hr />';
		if (vars.user.get('named')) {
			buf += '<p class="buttonbar" style="text-align:right">';
			var registered = vars.user.get('registered');
			if (registered && (registered.userid === vars.user.get('userid'))) {
				buf += '<button name="changepassword">Change password</button> ';
			} else {
				buf += '<button name="register">Register</button> ';
			}
			buf += '<button name="logout"><strong>Log out</strong></button>';
			buf += '</p>';
		} else {
			buf += '<p class="buttonbar" style="text-align:right"><button name="login">Choose name</button></p>';
		}
		this.$el.html(buf).css('min-width', 160);
	},
	openLogFolder: function() {
		Storage.revealFolder();
	},
	setLogChat: function(e) {
		var logchat = !!e.currentTarget.checked;
		if (logchat) {
			Storage.startLoggingChat();
			$('#openLogFolderButton').show();
		} else {
			Storage.stopLoggingChat();
		}
		Tools.prefs('logchat', logchat);
	},
	setNoanim: function(e) {
		var noanim = !!e.currentTarget.checked;
		Tools.prefs('noanim', noanim);
		Tools.loadSpriteData(noanim || Tools.prefs('bwgfx') ? 'bw' : 'xy');
	},
	setBwgfx: function(e) {
		var bwgfx = !!e.currentTarget.checked;
		Tools.prefs('bwgfx', bwgfx);
		Tools.loadSpriteData(bwgfx || Tools.prefs('noanim') ? 'bw' : 'xy');
	},
	setNotournaments: function(e) {
		var notournaments = !!e.currentTarget.checked;
		Tools.prefs('notournaments', notournaments);
	},
	setSelfHighlight: function(e) {
		var noselfhighlight = !e.currentTarget.checked;
		Tools.prefs('noselfhighlight', noselfhighlight);
	},
	setNolobbypm: function(e) {
		var nolobbypm = !!e.currentTarget.checked;
		Tools.prefs('nolobbypm', nolobbypm);
	},
	setTemporaryNotifications: function (e) {
		var temporarynotifications = !!e.currentTarget.checked;
		Tools.prefs('temporarynotifications', temporarynotifications);
	},
	setIgnoreSpects: function(e) {
		if (vars.curRoom.battle) {
			vars.curRoom.battle.ignoreSpects = !!e.currentTarget.checked;
		}
	},
	setBg: function(e) {
		var bg = e.currentTarget.value;
		Tools.prefs('bg', bg);
		if (!bg) bg = '#344b6c url(/fx/client-bg-charizards.jpg) no-repeat left center fixed';
		$(document.body).css({
			background: bg,
			'background-size': 'cover'
		});
	},
	setTimestampsLobby: function(e) {
		this.timestamps.lobby = e.currentTarget.value;
		Tools.prefs('timestamps', this.timestamps);
	},
	setTimestampsPMs: function(e) {
		this.timestamps.pms = e.currentTarget.value;
		Tools.prefs('timestamps', this.timestamps);
	},
	avatars: function() {
		vars.addPopup(AvatarsPopup);
	},
	formatting: function() {
		vars.addPopup(FormattingPopup);
	},
	login: function() {
		vars.addPopup(LoginPopup);
	},
	register: function() {
		vars.addPopup(RegisterPopup);
	},
	changepassword: function() {
		vars.addPopup(ChangePasswordPopup);
	},
	logout: function() {
		vars.user.logout();
		this.close();
	}
});

var FormattingPopup = this.FormattingPopup = Popup.extend({
	events: {
		'change input': 'setOption'
	},
	initialize: function() {
		var cur = this.chatformatting = Tools.prefs('chatformatting') || {};
		var buf = '<p class="optlabel">You can choose to display formatted text as normal text.</p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="bold" ' + (cur.hidebold ? 'checked' : '') + ' /> Suppress **<strong>bold</strong>**</label></p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="italics" ' + (cur.hideitalics ? 'checked' : '') + ' /> Suppress __<em>italics</em>__</label></p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="monospace" ' + (cur.hidemonospace ? 'checked' : '') + ' /> Suppress ``<code>monospace</code>``</label></p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="strikethrough" ' + (cur.hidestrikethrough ? 'checked' : '') + ' /> Suppress ~~<s>strikethrough</s>~~</label></p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="me" ' + (cur.hideme ? 'checked' : '') + ' /> Suppress <code>/me</code> <em>action formatting</em></label></p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="spoiler" ' + (cur.hidespoiler ? 'checked' : '') + ' /> Suppress spoiler hiding</label></p>';
		buf += '<p><label class="optlabel"><input type="checkbox" name="links" ' + (cur.hidelinks ? 'checked' : '') + ' /> Suppress clickable links</label></p>';
		buf += '<p><button name="close">Close</button></p>';
		this.$el.html(buf);
	},
	setOption: function(e) {
		var name = $(e.currentTarget).prop('name');
		this.chatformatting['hide' + name] = !!e.currentTarget.checked;
		Tools.prefs('chatformatting', this.chatformatting);
	}
});

var AvatarsPopup = this.AvatarsPopup = Popup.extend({
	type: 'semimodal',
	initialize: function() {
		var cur = +vars.user.get('avatar');
		var buf = '';
		buf += '<p>Choose an avatar or <button name="close">Cancel</button></p>';

		buf += '<div class="avatarlist">';
		for (var i=1; i<=293; i++) {
			var offset = '-'+(((i-1)%16)*80)+'px -'+(Math.floor((i-1)/16)*80)+'px';
			buf += '<button name="setAvatar" value="'+i+'" style="background-position:'+offset+'"'+(i===cur?' class="cur"':'')+'></button>';
		}
		buf += '</div><div style="clear:left"></div>';

		buf += '<p><button name="close">Cancel</button></p>';
		this.$el.html(buf).css('max-width', 780);
	},
	setAvatar: function(i) {
		vars.send('/avatar '+i);
		vars.send('/cmd userdetails '+vars.user.get('userid'));
		Tools.prefs('avatar', i);
		this.close();
	}
});

var ReplayUploadedPopup = this.ReplayUploadedPopup = Popup.extend({
	type: 'semimodal',
	events: {
		'click a': 'clickClose'
	},
	initialize: function(data) {
		var buf = '';
		buf = '<p>Your replay has been uploaded! It\'s available at:</p>';
		buf += '<p><a href="http://replay.pokemonshowdown.com/'+data.id+'" target="_blank">http://replay.pokemonshowdown.com/'+data.id+'</a></p>';
		buf += '<p><button type="submit" class="autofocus"><strong>Open</strong></button> <button name="close">Cancel</button></p>';
		this.$el.html(buf).css('max-width', 620);
	},
	clickClose: function() {
		this.close();
	},
	submit: function(i) {
		vars.openInNewWindow('http://pokemonshowdown.com/replay/battle-'+this.id);
		this.close();
	}
});

var RulesPopup = this.RulesPopup = Popup.extend({
	type: 'modal',
	initialize: function(data) {
		var warning = ('warning' in data);
		var buf = '';
		if (warning) {
			buf += '<p><strong style="color:red">'+(Tools.escapeHTML(data.warning)||'You have been warned for breaking the rules.')+'</strong></p>';
		}
		buf += '<h2>Pok&eacute;mon Showdown Rules</h2>';
		buf += '<b>Global</b><br /><br /><b>1.</b> Be nice to people. Respect people. Don\'t be rude to people.<br /><br /><b>2.</b> PS is based in the US. Follow US laws. Don\'t distribute pirated material, and don\'t slander others. PS is available to users younger than 18, so porn is strictly forbidden.<br /><br /><b>3.</b>&nbsp;No cheating. Don\'t exploit bugs to gain an unfair advantage. Don\'t game the system (by intentionally losing against yourself or a friend in a ladder match, by timerstalling, etc).<br /><b></b><br /><b>4.</b>&nbsp;English only.<br /><br /><b>5.</b> The First Amendment does not apply to PS, since PS is not a government organization.<br /><br /><b>6.</b> Moderators have discretion to punish any behaviour they deem inappropriate, whether or not it\'s on this list. If you disagree with a moderator ruling, appeal to a leader (a user with &amp; next to their name) or Discipline Appeals.<br /><br />';
		buf += '<b>Chat</b><br /><br /><b>1.</b> Do not spam, flame, or troll. This includes advertising, asking questions with one-word answers in the lobby, and flooding the chat such as by copy/pasting lots of text in the lobby.<br /><br /><b>2.</b> Don\'t call unnecessary attention to yourself. Don\'t be obnoxious. ALL CAPS, <i><b>formatting</b></i>, and -&gt; ASCII art &lt;- are acceptable to emphasize things, but should be used sparingly, not all the time.<br /><br /><b>3.</b> No minimodding: don\'t mod if it\'s not your job. Don\'t tell people they\'ll be muted, don\'t ask for people to be muted, and don\'t talk about whether or not people should be muted ("inb4 mute", etc). This applies to bans and other punishments, too.<br /><br /><b>4.</b> We reserve the right to tell you to stop discussing moderator decisions if you become unreasonable or belligerent.<br /><br />(Note: Chat rules don\'t apply to battle rooms, but only if both players in the battle are okay with it.)<br /><br />';
		if (!warning) {
			buf += '<b>Usernames</b><br /><br />Your username can be chosen and changed at any time. Keep in mind:<br /><br /><b>1.</b> Usernames may not be derogatory or insulting in nature, to an individual or group (insulting yourself is okay as long as it\'s not too serious).<br /><br /><b>2.</b> Usernames may not directly reference sexual activity.<br /><br /><b>3.</b> Usernames may not be excessively disgusting.<br /><br /><b>4.</b> Usernames may not impersonate a recognized user (a user with %, @, &amp;, or ~ next to their name).<br /><br />This policy is less restrictive than that of many places, so you might see some "borderline" nicknames that might not be accepted elsewhere. You might consider it unfair that they are allowed to keep their nickname. The fact remains that their nickname follows the above rules, and if you were asked to choose a new name, yours does not.';
		}
		if (warning) {
			buf += '<p class="buttonbar"><button name="close" disabled>Close</button><small class="overlay-warn"> You will be able to close this in 5 seconds</small></p>';
			setTimeout(_.bind(this.rulesTimeout, this), 5000);
		} else {
			this.type = 'semimodal';
			buf += '<p class="buttonbar"><button name="close" class="autofocus">Close</button></p>';
		}
		this.$el.css('max-width', 760).html(buf);
	},
	rulesTimeout: function() {
		this.$('button')[0].disabled = false;
		this.$('.overlay-warn').remove();
	}
});

var TabListPopup = this.TabListPopup = Popup.extend({
	type: 'semimodal',
	initialize: function() {
		var curId = (vars.curRoom ? vars.curRoom.id : '');
		var curSideId = (vars.curSideRoom ? vars.curSideRoom.id : '');

		var buf = '<ul><li><a class="button'+(curId===''?' cur':'')+(vars.rooms['']&&vars.rooms[''].notifications?' notifying':'')+'" href="'+vars.root+'"><i class="icon-home"></i> <span>Home</span></a></li>';
		if (vars.rooms['teambuilder']) buf += '<li><a class="button'+(curId==='teambuilder'?' cur':'')+' closable" href="'+vars.root+'teambuilder"><i class="icon-edit"></i> <span>Teambuilder</span></a><a class="closebutton" href="'+vars.root+'teambuilder"><i class="icon-remove-sign"></i></a></li>';
		if (vars.rooms['ladder']) buf += '<li><a class="button'+(curId==='ladder'?' cur':'')+' closable" href="'+vars.root+'ladder"><i class="icon-list-ol"></i> <span>Ladder</span></a><a class="closebutton" href="'+vars.root+'ladder"><i class="icon-remove-sign"></i></a></li>';
		buf += '</ul>';
		var atLeastOne = false;
		var sideBuf = '';
		for (var id in vars.rooms) {
			if (!id || id === 'teambuilder' || id === 'ladder') continue;
			var room = vars.rooms[id];
			var name = '<i class="icon-comment-alt"></i> <span>'+id+'</span>';
			if (id === 'lobby') name = '<i class="icon-comments-alt"></i> <span>Lobby</span>';
			if (id.substr(0,7) === 'battle-') {
				var parts = id.substr(7).split('-');
				var p1 = (room && room.battle && room.battle.p1 && room.battle.p1.name) || '';
				var p2 = (room && room.battle && room.battle.p2 && room.battle.p2.name) || '';
				if (p1 && p2) {
					name = ''+Tools.escapeHTML(p1)+' v. '+Tools.escapeHTML(p2);
				} else if (p1 || p2) {
					name = ''+Tools.escapeHTML(p1)+Tools.escapeHTML(p2);
				} else {
					name = '(empty room)';
				}
				name = '<i class="text">'+parts[0]+'</i><span>'+name+'</span>';
			}
			if (room.isSideRoom) {
				if (room.id !== 'rooms') sideBuf += '<li><a class="button'+(curId===id||curSideId===id?' cur':'')+(room.notifications?' notifying':'')+' closable" href="'+vars.root+id+'">'+name+'</a><a class="closebutton" href="'+vars.root+id+'"><i class="icon-remove-sign"></i></a></li>';
				continue;
			}
			if (!atLeastOne) {
				buf += '<ul>';
				atLeastOne = true;
			}
			buf += '<li><a class="button'+(curId===id?' cur':'')+(room.notifications?' notifying':'')+' closable" href="'+vars.root+id+'">'+name+'</a><a class="closebutton" href="'+vars.root+id+'"><i class="icon-remove-sign"></i></a></li>';
		}
		if (vars.supports['rooms']) {
			sideBuf += '<li><a class="button'+(curId==='rooms'||curSideId==='rooms'?' cur':'')+'" href="'+vars.root+'rooms"><i class="icon-plus"></i> <span>&nbsp;</span></a></li>';
		}
		if (atLeastOne) buf += '</ul>';
		if (sideBuf) {
			buf += '<ul>'+sideBuf+'</ul>';
		}
		this.$el.addClass('tablist').html(buf);
	},
	events: {
		'click a': 'click'
	},
	click: function(e) {
		if (e.cmdKey || e.metaKey || e.ctrlKey) return;
		e.preventDefault();
		var $target = $(e.currentTarget);
		var id = $target.attr('href');
		if (id.substr(0, vars.root.length) === vars.root) {
			id = id.substr(vars.root.length);
		}
		if ($target.hasClass('closebutton')) {
			vars.leaveRoom(id);
			this.initialize();
		} else {
			this.close();
			vars.focusRoom(id);
		}
	}
});