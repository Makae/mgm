var mgm = typeof mgm != 'undefined' ? mgm : {};
(function($) {
  var temp_admin_config = {
    'll_dec_points' : 6
  };

  function MGM_StateMachine(map) {
    this.map = map;
    console.log(this.map);
    this.current_state = null;
  };

  MGM_StateMachine.prototype.STD_STATE = 'standard';
  MGM_StateMachine.prototype.MARKER_STATE = 'marker';
  MGM_StateMachine.prototype.POLYGON_STATE = 'polygon';

  MGM_StateMachine.prototype.getState = function(name) {
    return this.states[name];
  };

  MGM_StateMachine.prototype.currentState = function() {
    return this.current_state;
  };

  MGM_StateMachine.prototype.switchState = function(name) {
    if(this.current_state == this.STD_STATE)
      return;

    if(this.currentState() != null)
      this.currentState().exit(this);

    this.current_state = this.getState(name);
    this.current_state.enter(this);

  };

  MGM_StateMachine.prototype.addStates = function(name, state) {
    MGM_StateMachine.prototype.states[name] = state;
  };

  MGM_StateMachine.prototype.states = {
    standard : {
      enter : function(sm) {
        $(sm.map.map_root).find(".mgm_toolbar .cancel").addClass("hidden");
      },
      exit : function(sm) {
        $(sm.map.map_root).find(".mgm_toolbar .cancel").removeClass("hidden");
      }
    },

    marker : {
      clickhandler : null,
      enter : function(sm) {
        $(sm.map.map_root).addClass("mode-marker");
        sm.map.map.setOptions({draggableCursor: 'crosshair'});
        this.clickhandler = google.maps.event.addListener(sm.map.map, 'click', function(e) {
          var lat = mgm.admin.utils.round(e.latLng.lat());
          var lng = mgm.admin.utils.round(e.latLng.lng());

          var gizmo = {'gizmo_type':'marker',
                       'type':'standard',
                       'lat': lat,
                       'lng': lng};

          mgm.admin.createGizmo(sm.map, gizmo);

        });
      },
      exit : function(sm) {
        sm.map.map.setOptions({draggableCursor: 'default'});
        this.clickhandler.remove();
        $(sm.map.map_root).removeClass("mode-marker");
      }
    },

    polygon : {
      enter : function(sm) {
        $(sm.map.map_root).addClass("mode-polygon");
      },
      exit : function(sm) {
        $(sm.map.map_root).removeClass("mode-polygon");
      }
    }
  };

  mgm.admin = {
    current_gizmo : null,
    state_machine : null,
    config : {},
    init : function() {
      this.config = temp_admin_config;
      for(var i in mgm.maps)
        this.registerAdminHandlers(mgm.maps[i]);
    },

    registerAdminHandlers : function(map) {
      var self = this;
      var state_machine = new MGM_StateMachine(map);

      this.hideEdit(map, 0);
      $(map.map_root).find('.close, button.cancel').click(function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        self.hideEdit(map);
      });

      $(map.map_root).find('.mgm_edit form').submit(function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        var gizmo = self.current_gizmo;
        mgm.gizmo_form_provider.getProvider(gizmo.gizmo_type, gizmo.type).update(gizmo, this);
        mgm.content_form_provider.getProvider(gizmo.content_provider).update(gizmo, this);
        gizmo.temporary = false;

        self.hideEdit(map);
      });

      $(map.map_root).find('.mgm_toolbar .add_marker').click(function() {
        state_machine.switchState(state_machine.MARKER_STATE);
      });

      $(map.map_root).find('.mgm_toolbar .add_polygon').click(function() {
        state_machine.switchState(state_machine.POLYGON_STATE);
      });

      $(map.map_root).find('.mgm_toolbar .cancel').click(function() {
        state_machine.switchState(state_machine.STD_STATE);
      });

      state_machine.switchState(state_machine.STD_STATE);
    },

    createGizmo : function(map, gizmo) {
      gizmo.temporary = true;

      if(gizmo.gizmo_type == 'marker')
        gizmo = map.addMarker(gizmo);
      else if(gizmo.gizmo_type == 'polygon')
        gizmo = map.addPolygon(gizmo);

      this.showEdit(map, gizmo)
    },

    showEdit : function(map, gizmo) {
      this.hideEdit(map);
      $(map.map_root).addClass("edit");
      this.current_gizmo = gizmo;
      this.loadFields(map, gizmo);
    },

    hideEdit : function(map, time) {
      var time = typeof time != 'undefined' ? time : 200;
      if(this.current_gizmo != null && this.current_gizmo.temporary == true)
        map.removeMarker(this.current_gizmo);

      $(map.map_root).removeClass("edit");
      $(map.map_root).find('.mgm_edit_wrapper').slideUp(time);
    },

    loadFields : function(map, gizmo) {
      $(map.map_root).find('.mgm_edit_wrapper').delay(200).slideDown(200);

      this.loadGenericFields(map, gizmo);
      this.loadSpecificFields(map, gizmo);
    },

    loadGenericFields : function(map, gizmo) {
      // Load generic fields which are the same each time
      var $generic = $(map.map_root).find('.mgm_edit_wrapper').find('.generic');

      var loadGeneric = function(data) {
        $generic.html(data);
      };

      mgm.gizmo_form_provider.renderProvider(gizmo.gizmo_type, gizmo.type, gizmo, loadGeneric);
    },

    loadSpecificFields : function(map, gizmo) {
      // Load content specific fields
      var $specific = $(map.map_root).find('.mgm_edit_wrapper').find('.specific');

      var loadSpecific = function(data) {
        $specific.html(data);
      };

      mgm.content_form_provider.renderProvider(gizmo.content_provider, gizmo, loadSpecific);
    }
  };

  mgm.gizmo_form_provider = {
    renderProvider : function(gizmo_type, provider_key, gizmo, callback) {
      if(typeof this.providers[gizmo_type] != 'undefined' && this.providers[gizmo_type][provider_key] != 'undefined')
        this.providers[gizmo_type][provider_key].render(gizmo, callback);
      else
        this.providers[gizmo_type].standard.render(gizmo, callback);
    },

    setProvider : function(gizmo_type, provider_key, provider) {
      if(typeof this.providers[gizmo_type] == 'undefined')
        this.providers[gizmo_type] = {};
      this.providers[gizmo_type][provider_key] = provider;
    },

    getProvider : function(gizmo_type, provider_key) {
      if(typeof this.providers[gizmo_type][provider_key] != 'undefined')
        return this.providers[gizmo_type][provider_key];
      else
        return this.providers[gizmo_type].standard;
    },

    providers : {
      marker : {
        standard : {
          html : '<div class="row">' +
                '<label for="gizmo_name" class="col col_3_12">Name:</label>' +
                '<input type="text" name="gizmo_name" class="col col_9_12" />' +
              '</div>' +
              '<div class="row mgm_position">' +
                '<span class="col col_3_12 label">Position:</span>' +
                '<div class="col col_9_12 no-padding">' +
                  '<label for="gizmo_lat" class="">Lat:</label>' +
                  '<input type="number" name="gizmo_lat" class="" min="-90" max="90" step="0.000001" />' +
                  '<label for="gizmo_lng" class="">Lng:</label>' +
                  '<input type="number" name="gizmo_lng" class="" min="-180" max="180" step="0.000001" />' +
                '</div>' +
              '</div>',

          render : function(marker, callback) {
            var self = this;
            $html = $(this.html);

            $html.find('input[name="gizmo_name"]').val(marker.name);
            $html.find('input[name="gizmo_lat"]').val(marker.lat);
            $html.find('input[name="gizmo_lng"]').val(marker.lng);
            callback($html);
          },

          update : function(marker, form) {
            $form = $(form);
            marker.name = $form.find('input[name="gizmo_name"]').val();
            marker.lat = $form.find('input[name="gizmo_lat"]').val();
            marker.lng = $form.find('input[name="gizmo_lng"]').val();

            marker.gm_marker.setPosition(mgm.utils.latLngToPos(marker));
          },

          save : function(marker, form) {
            this.update();
          }
        }
      }
    }
  };

  mgm.content_form_provider = {
    renderProvider : function(provider_key, gizmo, callback) {
      if(typeof this.providers[provider_key] != 'undefined')
        this.providers[provider_key].render(gizmo, callback);
      else
        this.providers.standard.render(gizmo, callback);
    },

    setProvider : function(provider_key, provider) {
      this.providers[provider_key] = provider;
    },

    getProvider : function(provider_key) {
      if(typeof this.providers[provider_key] != 'undefined')
        return this.providers[provider_key];
      else
        return this.providers.standard;
    },

    providers : {
      standard : {
        html : '<div> No Content, only gizmo-image is visible </div>',
        render : function(gizmo, callback) {
          callback(this.html);
        },

        update : function(gizmo, form) {
          return;
        },

        save : function(gizmo, form) {
          this.update();
        }
      }
    }
  };

  mgm.admin.utils = {
    round : function(coord_segment) {
      return Math.round(Math.pow(10, mgm.admin.config.ll_dec_points) * coord_segment) / Math.pow(10, mgm.admin.config.ll_dec_points);
    }
  }

  if(mgm.initialized === true)
    mgm.admin.init();
  else
    mgm.admin.initialized = false

})(jQuery);

(function() {
  var std_builder = mgm.builder.getBuilder('marker', 'standard');
  var fnBuilder = function(marker) {

    var dragendListenerHandler;

    marker.draggable = true;
    var marker = std_builder(marker);

    marker._register = marker.register;
    marker.register = function(mgm_map) {
      marker._register(mgm_map);
      dragendListenerHandler = google.maps.event.addListener(marker.gm_marker, 'dragend', function(e) {
        marker.onDragEnd(e);
      });
    }

    marker._unregister = marker.unregister;
    marker.unregister = function(mgm_map) {
      dragendListenerHandler.remove();
      marker._unregister(mgm_map);
    }

    marker.update = function() {
      var pos = marker.gm_marker.getPosition();
      marker.lat = mgm.admin.utils.round(pos.lat());
      marker.lng = mgm.admin.utils.round(pos.lng());
      marker.gm_marker.setPosition(mgm.utils.latLngToPos(marker));
    };

    marker.onDragEnd = function(e, callback) {
      marker.update();
    };

    marker.onClick = function(e, callback) {
      // This is for showing the edit window;
      mgm.admin.showEdit(marker.mgm_map, marker);
      callback();
    };


    return marker;
  };

  mgm.builder.setBuilder('marker', 'standard', fnBuilder);
})();

(function() {
  var provider = {
    html : '<label for="gizmo_content_paragraph">Paragraph</label>' +
      '<textarea name="gizmo_content_paragraph"></textarea>',

    render : function(gizmo, callback) {
      $html = $(this.html);
      $html.find('textarea[name="gizmo_content_paragraph"]').val(gizmo.content_data);
      callback($html);
    },

    update : function(gizmo, form) {
      gizmo.content_data = $(form).find('textarea[name="gizmo_content_paragraph"]');
    },

    save : function(gizmo, form) {
      this.update();
    }
  };
  mgm.content_form_provider.setProvider('paragraph', provider);
})();