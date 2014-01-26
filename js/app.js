

  $(function() {

    // Audio model
    var Audio = Backbone.Model.extend({      
      defaults: {
        file: '',
        es:   '',
        en:   ''
      }
    });


    // Audios collection
    var Audios = Backbone.Collection.extend({
      model: Audio
    })


    // App
    var App = Backbone.View.extend({

      el: document.body,

      _AUDIO: {
        extension: {
          ogg: 'ogg',
          m4a: 'm4a'
        }
      },

      events: {
        'click .main':    'main',
        'click .shuffle': 'shuffle',
        'click .forward': 'forward'
      },

      initialize: function() {
        this.collection = new Audios(tracks);
        this.audio = $('audio').get(0);
        
        this._initBinds();
      },

      render: function() {
        var self = this;

        // Change audio files?
        if (this.model.changed.file || this.model.changed.file === "") {
          this.setAudio();
        }
        
        // Change main icon
        var class_ = '';
        var state = this.model.get('state');

        switch (state) {
          case 'playing':
            class_ = 'fa-pause';
            break;
          case 'loading':
            class_ = 'fa-cog fa-spin';
            break;
          case 'paused':
            class_ = 'fa-play';
            break;
          case 'ended':
            class_ = 'fa-refresh';
            break;
          default:
            class_ = 'fa-play';
        }

        this.$('.main .fa')
          .removeClass('fa-play fa-pause fa-cog fa-spin fa-refresh')
          .addClass(class_);

        // Change texts
        var item = this.getAudio();
        if (item) {
          this.$('footer .es').text(item.get('es'));
          this.$('footer .en').text(item.get('en'));  
        }

        return this;
      },

      _initBinds: function() {
        var self = this;

        _.bindAll(this, 'main', 'forward', 'shuffle');

        this.audio.addEventListener('ended', function(){
          self.model.set('state', 'ended')
        });
        this.audio.addEventListener('loadeddata', function() {
          var state = self.model.get('state');
          // Arg!! chrome bug!
          if (state !== "playing") {
            self.model.set('state', 'idle')
          }
        });
        this.audio.addEventListener('loadstart', function() {
          var state = self.model.get('state');
          // Arg!! chrome bug!
          if (state !== "playing") {
            self.model.set('state', 'loading')
          }
        });

        this.listenTo(this.model, 'change', this.render);
      },

      getExtension: function() {
        return $.browser.webkit ? this._AUDIO.extension.m4a : this._AUDIO.extension.ogg;
      },

      getType: function() {
        return $.browser.webkit ? "audio/mp4" : "audio/ogg";
      },

      getAudio: function() {
        var self = this;
        return this.collection.find(function(i){ return i.get('file') === self.model.get('file') })
      },

      setAudio: function() {
        var track = this.model.get('file');

        // Find track
        var item = this.collection.find(function(i){
          return i.get('file') === track
        })

        // If not, shuffle
        if (!item) {
          this.shuffle();
        } else {
          this.audio.src = 'audio/' + track + '.' + this.getExtension();
          this.audio.type = this.getType();
        }
      },

      main: function(e) {
        if (e) e.preventDefault();
        var state = this.model.get('state');
        var track = this.model.get('file');

        if (state === "idle" || state === "ended") {
          this.model.set('state', 'playing');
          
          // Why chrome why??? :_(
          if (state === "ended" && window.chrome) {
            this.audio.load();
          }
          $(this.audio).trigger("play");
        }
        if (state === "playing") {
          this.model.set('state', 'paused');
          $(this.audio).trigger("pause");
        }
        if (state === "paused") {
          this.model.set('state', 'playing');
          $(this.audio).trigger("play");
        }
      },

      forward: function(e) {
        if (e) e.preventDefault();
        var track = this.model.get('file');
        var len = this.collection.size()

        // Find track
        var item = this.getAudio();
        var pos = this.collection.indexOf(item) + 1;

        if (pos >= this.collection.size()) {
          pos = 0;
        }

        var item = this.collection.at(pos);
        var track = item.get('file');
        this.router.navigate('#/' + track, { trigger: false });
        this.model.set('file', track);
      },

      shuffle: function(e) {
        if (e) e.preventDefault();
        var len = this.collection.size()
        var item = this.collection.at(_.random(0, len - 1));
        track = item.get('file');
        
        // If so, set new src!
        this.model.set('file', track);
        this.router.navigate('#/' + track, { trigger: false });
      }

    });

    // Router
    var Router = Backbone.Router.extend({
    
      routes: {
        '':       'change',
        '*path':  'change'
      },

      initialize: function(opts) {
        this.model = opts.app_model;
      },

      change: function() {
        var audio = window.location.hash;
        audio = audio.replace('#/','').replace('#','');
        this.model.set('file', audio);
      }

    });


    var model = new Backbone.Model({
      state:  '',
      file:   '_'
    })

    var app = window.app = new App({ model: model });
    app.router = new Router({ pushState: true, app_model: model });
    Backbone.history.start();
  });