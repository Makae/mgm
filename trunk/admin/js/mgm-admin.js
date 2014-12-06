/**
 * @author: M. Käser
 * @date: 29.11.2014
 * @desc: Admin section extends the core to display an ui for editing the map
 **/
var mgm = typeof mgm != 'undefined' ? mgm : {};
(function($) {
  var temp_admin_config = {
    'll_dec_points' : 6
  };

  function MGM_StateMachine(map) {
    this.map = map;
    this.current_state = null;
  };

  MGM_StateMachine.prototype.STD_STATE = 'standard';
  MGM_StateMachine.prototype.REMOVE_STATE = 'remove';
  MGM_StateMachine.prototype.EDIT_STATE = 'edit';

  MGM_StateMachine.prototype.getState = function(state_name) {
    return this.states[state_name];
  };

  MGM_StateMachine.prototype.currentState = function() {
    return this.current_state;
  };

  MGM_StateMachine.prototype.switchState = function(state_name) {
    if(this.currentState() != null && this.currentState().name == state_name)
      return;

    if(this.currentState() != null)
      this.currentState().exit(this);


    this.current_state = this.getState(state_name);
    this.current_state.enter(this);

  };

  MGM_StateMachine.prototype.setState = function(name, state) {
    MGM_StateMachine.prototype.states[name] = state;
  };

  MGM_StateMachine.prototype.states = {
    standard : {
      name : 'standard',
      enter : function(sm) {
        $(sm.map.map_root).find(".mgm_toolbar .add_gizmo").addClass("active");
      },
      exit : function(sm) {
        $(sm.map.map_root).find(".mgm_toolbar .add_gizmo").removeClass("active");
      }
    },

    remove : {
      name : 'remove',
      clickhandler : null,
      enter : function(sm) {
        $(sm.map.map_root).addClass("mode-marker");
        $(sm.map.map_root).find(".mgm_toolbar .remove_gizmo").addClass("active");

        sm.map.map.setOptions({draggableCursor: 'pointer'});
        sm.map.dm.setMap(null);
      },
      exit : function(sm) {
        $(sm.map.map_root).removeClass("mode-marker");
        $(sm.map.map_root).find(".mgm_toolbar .remove_gizmo").removeClass("active");

        sm.map.map.setOptions({draggableCursor: 'default'});
        sm.map.dm.setMap(sm.map.map);
      }
    },

    edit : {
      name : 'edit',
      clickhandler : null,
      enter : function(sm) {
        $(sm.map.map_root).addClass("mode-marker");
        $(sm.map.map_root).find(".mgm_toolbar .edit_gizmo").addClass("active");

        sm.map.map.setOptions({draggableCursor: 'pointer'});
        sm.map.dm.setMap(null);

        for(var i in sm.map.polygons)
          sm.map.polygons[i].gm_polygon.setEditable(true);
      },
      exit : function(sm) {
        $(sm.map.map_root).removeClass("mode-marker");
        $(sm.map.map_root).find(".mgm_toolbar .edit_gizmo").removeClass("active");

        sm.map.map.setOptions({draggableCursor: 'default'});
        sm.map.dm.setMap(sm.map.map);

        for(var i in sm.map.polygons)
          sm.map.polygons[i].gm_polygon.setEditable(false);
      }
    }
  };

  mgm.admin = {
    initialized : false,
    current_gizmo : null,
    state_machine : null,
    config : {},
    init : function() {
      this.config = temp_admin_config;
      for(var i in mgm.maps) {
        this.initDrawingManager(mgm.maps[i])
        this.registerAdminHandlers(mgm.maps[i]);
      }
      this.initialized = true;
    },

    initDrawingManager : function(map) {
      map.dm = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.MARKER,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            google.maps.drawing.OverlayType.MARKER,
            google.maps.drawing.OverlayType.POLYGON
          ]
        }
      });

      map.dm.setMap(map.map);

      google.maps.event.addListener(map.dm, 'markercomplete', function(gm_marker) {
        if(gm_marker._registerd == true)
          return;
        var extract = mgm.extractor.getExtractor('marker', 'standard');
        var marker = extract(gm_marker);
        gm_marker.setMap(null);
        map.addMarker(marker);
      });

      google.maps.event.addListener(map.dm, 'polygoncomplete', function(gm_polygon) {
        if(gm_polygon._registerd == true)
          return;

        var extract = mgm.extractor.getExtractor('polygon', 'standard');
        var polygon = extract(gm_polygon);
        gm_polygon.setMap(null);
        map.addPolygon(polygon);
      });

    },

    registerAdminHandlers : function(map) {
      var self = this;
      var state_machine = new MGM_StateMachine(map);


      this.hideEdit(map, 0);
      $(map.map_root).find('.close, .cancel').click(function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        self.hideEdit(map);
      });

      $(map.map_root).find('.mgm_edit .gizmo_form .save').off('click').click(function() {
        var gizmo = self.current_gizmo;
        var $form = $(this).closest('.mgm_form');
        mgm.form_provider.getProvider(gizmo.gizmo_type, gizmo.type).update(gizmo, $form);
        mgm.content_form_provider.getProvider(gizmo.content_provider).update(gizmo, $form);

        self.hideEdit(map);
      });

      $(map.map_root).find('.mgm_edit .map_form .save').off('click').click(function(e) {
        var $form = $(this).closest('.mgm_form');
        mgm.form_provider.getProvider('map', map.type).update(map, $form);
        self.hideEdit(map);
      });

      $(map.map_root).find('.mgm_toolbar .add_gizmo').click(function() {
        state_machine.switchState(state_machine.STD_STATE);
      });

      $(map.map_root).find('.mgm_toolbar .remove_gizmo').click(function() {
        state_machine.switchState(state_machine.REMOVE_STATE);
      });

      $(map.map_root).find('.mgm_toolbar .edit_gizmo').click(function() {
        state_machine.switchState(state_machine.EDIT_STATE);
      });

      $(map.map_root).find('.mgm_toolbar .edit_map').click(function() {
        self.showMapEdit(map);
      });

      state_machine.switchState(state_machine.STD_STATE);
      map.sm = state_machine;
    },

    registerGizmo : function(map, gizmo) {
      gizmo.temporary = true;

      if(gizmo.gizmo_type == 'marker')
        gizmo = map.addMarker(gizmo);
      else if(gizmo.gizmo_type == 'polygon')
        gizmo = map.addPolygon(gizmo);

      this.showEditGizmo(map, gizmo)
    },

    showMapEdit : function(map) {
      this.hideEdit(map);
      $(map.map_root).addClass("edit");
      $(map.map_root).find('.map_form').show();
      $(map.map_root).find('.mgm_edit_wrapper').delay(200).slideDown(200);
      this.loadMapFields(map);
    },

    showEditGizmo : function(map, gizmo) {
      this.hideEdit(map);
      $(map.map_root).addClass('edit');
      $(map.map_root).find('.gizmo_form').show();
      this.current_gizmo = gizmo;
      this.loadFields(map, gizmo);
    },

    hideEdit : function(map, time) {
      var time = typeof time != 'undefined' ? time : 200;
      if(this.current_gizmo != null && this.current_gizmo.temporary == true)
        map.removeMarker(this.current_gizmo);

      $(map.map_root).removeClass('edit');
      $(map.map_root).find('.mgm_edit_wrapper').slideUp(time, function() {
         $(map.map_root).find('.mgm_form').hide();
      });

    },

    loadMapFields : function(map) {
      // Load generic fields which are the same each time
      var $form = $(map.map_root).find('.mgm_edit_wrapper .map_form_content');

      var loadMap = function(data) {
        $form.html(data);
      };

      mgm.form_provider.renderProvider('map', map.config.type, map, loadMap);
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

      mgm.form_provider.renderProvider(gizmo.gizmo_type, gizmo.type, gizmo, loadGeneric);
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

  mgm.form_provider = {
    renderProvider : function(provider_type, provider_key, obj, callback) {
      if(typeof this.providers[provider_type] != 'undefined' && this.providers[provider_type][provider_key] != 'undefined')
        this.providers[provider_type][provider_key].render(obj, callback);
      else
        this.providers[provider_type].standard.render(obj, callback);
    },

    setProvider : function(provider_type, provider_key, provider) {
      if(typeof this.providers[provider_type] == 'undefined')
        this.providers[provider_type] = {};
      this.providers[provider_type][provider_key] = provider;
    },

    getProvider : function(provider_type, provider_key) {
      if(typeof this.providers[provider_type][provider_key] != 'undefined')
        return this.providers[provider_type][provider_key];
      else
        return this.providers[provider_type].standard;
    },

    providers : {
      map : {
        standard : {
          html :'<div class="col col_6_12 left">' +
                '<div class="row">' +
                  '<label for="map_name" class="col col_3_12">Name:</label>' +
                  '<input type="text" name="map_name" class="col col_9_12" />' +
                '</div>' +
                '<div class="row mgm_position">' +
                  '<span class="col col_3_12 label">Position:</span>' +
                  '<div class="col col_9_12 no-padding">' +
                    '<label for="map_lat" class="">Lat:</label>' +
                    '<input type="number" name="map_lat" class="" min="-90" max="90" step="0.000001" />' +
                    '<label for="map_lng" class="">Lng:</label>' +
                    '<input type="number" name="map_lng" class="" min="-180" max="180" step="0.000001" />' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="col col_6_12 right">' +
                '<div class="row">' +
                  '<label for="overlay_image" class="col col_3_12">Overlay:</label>' +
                  '<input type="text" name="overlay_image" class="col col_9_12" />' +
                '</div>' +
                '<div class="row">' +
                  '<span class="col col_3_12 label">Left-Top Corner:</span>' +
                  '<div class="col col_9_12 no-padding">' +
                    '<label for="overlay_tl_lat" class="">Lat:</label>' +
                    '<input type="number" name="overlay_tl_lat" class="" min="-90" max="90" step="0.000001" />' +
                    '<label for="overlay_tl_lng" class="">Lng:</label>' +
                    '<input type="number" name="overlay_tl_lng" class="" min="-180" max="180" step="0.000001" />' +
                  '</div>' +
                '</div>' +
                '<div class="row">' +
                  '<span class="col col_3_12 label">Bottom-Right Corner:</span>' +
                  '<div class="col col_9_12 no-padding">' +
                    '<label for="overlay_br_lat" class="">Lat:</label>' +
                    '<input type="number" name="overlay_br_lat" class="" min="-90" max="90" step="0.000001" />' +
                    '<label for="overlay_br_lng" class="">Lng:</label>' +
                    '<input type="number" name="overlay_br_lng" class="" min="-180" max="180" step="0.000001" />' +
                  '</div>' +
                '</div>' +
              '</div>',

          render : function(map, callback) {
            var self = this;
            $html = $(this.html);

            $html.find('input[name="map_name"]').val(map.config.name);
            $html.find('input[name="map_lat"]').val(map.config.lat);
            $html.find('input[name="map_lng"]').val(map.config.lng);


            var overlay_config = map.config.overlay;
            if(typeof overlay_config != 'undefined') {
              if(typeof overlay_config.image != 'undefined') {
                $html.find('input[name="overlay_image"]').val(overlay_config.image);
              }

              if(typeof overlay_config.top_left_coords != 'undefined') {
                $html.find('input[name="overlay_tl_lat"]').val(overlay_config.top_left_coords.lat);
                $html.find('input[name="overlay_tl_lng"]').val(overlay_config.top_left_coords.lng);
              }

              if(typeof overlay_config.bottom_right_coords != 'undefined') {
                $html.find('input[name="overlay_br_lat"]').val(overlay_config.bottom_right_coords.lat);
                $html.find('input[name="overlay_br_lng"]').val(overlay_config.bottom_right_coords.lng);
              }
            }
            callback($html);
          },

          update : function(map, form) {
            $form = $(form);

            // MAP
            map.config.name = $form.find('input[name="map_name"]').val();
            map.config.lat = $form.find('input[name="map_lat"]').val();
            map.config.lng = $form.find('input[name="map_lng"]').val();

            // OVERLAY
            if(typeof map.config.overlay != 'undefined')
              var overlay_config = map.config.overlay;
            else
              var overlay_config = {'image':'', 'top_left_coords': {}, 'bottom_right_coords': {}};

            overlay_config.image = $form.find('input[name="overlay_image"]').val();
            overlay_config.top_left_coords.lat = $form.find('input[name="overlay_tl_lat"]').val();
            overlay_config.top_left_coords.lng = $form.find('input[name="overlay_tl_lng"]').val();
            overlay_config.bottom_right_coords.lat = $form.find('input[name="overlay_br_lat"]').val();
            overlay_config.bottom_right_coords.lng = $form.find('input[name="overlay_br_lng"]').val();

            map.setOverlay(overlay_config);
          },

          save : function(marker, form) {
            this.update();
          }
        }
      },

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
      },

      polygon : {
        standard : {
          html : '<div class="row">' +
                '<label for="gizmo_name" class="col col_3_12">Name:</label>' +
                '<input type="text" name="gizmo_name" class="col col_9_12" />' +
              '</div>' +
              '<div class="row mgm_stroke_color">' +
                '<label for="gizmo_stroke_color" class="col col_3_12">Stroke color:</label>' +
                '<input type="text" name="gizmo_stroke_color" class="col col_9_12" />' +
              '</div>' +
              '<div class="row mgm_stroke_opacity">' +
                '<label for="gizmo_stroke_opacity" class="col col_3_12">Stroke opacity:</label>' +
                '<input type="range" name="gizmo_stroke_opacity" class="col col_9_12" min="0.0" max="1.0" step="0.01" />' +
              '</div>' +
              '<div class="row mgm_stroke_width">' +
                '<label for="gizmo_stroke_width" class="col col_3_12">Stroke width:</label>' +
                '<input type="text" name="gizmo_stroke_width" class="col col_9_12" />' +
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

  mgm.extractor = {
    std_key: 'standard',
    extractors: {
      marker: {
        standard : function(gm_marker) {
          return {
            'lat' : mgm.admin.utils.round(gm_marker.getPosition().lat()),
            'lng' : mgm.admin.utils.round(gm_marker.getPosition().lng())
          };
        }
      },
      polygon: {
        standard : function(gm_polygon) {
          var arrVertecies = gm_polygon.latLngs.getArray()[0];
          var points = [];

          for(var i=0; i < arrVertecies.length; i++) {
            var vertex = arrVertecies.getAt(i);
            points.push({'lat' : vertex.lat(),
                         'lng' : vertex.lng()});
          }

          return {
            'points' : points
          };
        }
      },
    },
    getExtractor : function(gizmo_type, key) {
      if(typeof this.extractors[gizmo_type] == 'undefined')
        return null;
      else if(typeof this.extractors[gizmo_type][key] == 'undefined')
        return this.extractors[gizmo_type][this.std_key];
      return this.extractors[gizmo_type][key];
    },

    setBuilder : function(gizmo_type, key, builder) {
      this[gizmo_type][key] = builder;
    },
  };

  mgm.admin.utils = {
    round : function(coord_segment) {
      return Math.round(Math.pow(10, mgm.admin.config.ll_dec_points) * coord_segment) / Math.pow(10, mgm.admin.config.ll_dec_points);
    }
  }

  if(mgm.initialized === true)
    mgm.admin.init();

  $(window).on('mgm.loaded', function() {
    mgm.admin.init();
  });

  $(window).triggerHandler('mgm.admin.loaded', {'mgm': mgm});
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
      var map_sm = marker.mgm_map.sm;
      var current_state = map_sm.currentState().name;

      if(current_state == map_sm.REMOVE_STATE) {
        marker.mgm_map.removeMarker(marker);
      } else {
        mgm.admin.showEditGizmo(marker.mgm_map, marker);
      }

      if(typeof callback == 'function')
        callback();
    };

    return marker;
  };

  mgm.builder.setBuilder('marker', 'standard', fnBuilder);
})();

(function() {
  var std_builder = mgm.builder.getBuilder('polygon', 'standard');
  var fnBuilder = function(polygon) {

    var dragendListenerHandler;

    polygon.draggable = true;
    var polygon = std_builder(polygon);

    polygon._register = polygon.register;
    polygon.register = function(mgm_map) {
      polygon._register(mgm_map);
      dragendListenerHandler = google.maps.event.addListener(polygon.gm_polygon, 'dragend', function(e) {
        polygon.onDragEnd(e);
      });
    }

    polygon._unregister = polygon.unregister;
    polygon.unregister = function(mgm_map) {
      dragendListenerHandler.remove();
      polygon._unregister(mgm_map);
    }

    polygon.update = function() {
      // ITERATE OVER EACH VERTEX
    };

    polygon.onDragEnd = function(e, callback) {
      //polygon.update();
    };

    polygon.onClick = function(e, callback) {
      var map_sm = polygon.mgm_map.sm;
      var current_state = map_sm.currentState().name;

      if(current_state == map_sm.REMOVE_STATE) {
        polygon.mgm_map.removePolygon(polygon);
      } else {
        mgm.admin.showEditGizmo(polygon.mgm_map, polygon);
      }

      if(typeof callback == 'function')
        callback();
    };

    return polygon;
  };

  mgm.builder.setBuilder('polygon', 'standard', fnBuilder);
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