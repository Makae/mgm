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
        $(sm.map.map_root).addClass('mode-marker');
        $(sm.map.map_root).find(".mgm_toolbar .edit_gizmo").addClass('active');

        sm.map.map.setOptions({draggableCursor: 'pointer'});
        sm.map.dm.setMap(null);

        for(var i in sm.map.gizmos)
          for(var n in sm.map.gizmos[i])
            if(typeof sm.map.gizmos[i][n]._setEditable == 'function')
              sm.map.gizmos[i][n]._setEditable(true);
      },
      exit : function(sm) {
        $(sm.map.map_root).removeClass('mode-marker');
        $(sm.map.map_root).find('.mgm_toolbar .edit_gizmo').removeClass('active');

        sm.map.map.setOptions({draggableCursor: 'default'});
        sm.map.dm.setMap(sm.map.map);

        for(var i in sm.map.gizmos)
          for(var n in sm.map.gizmos[i])
            if(typeof sm.map.gizmos[i][n]._setEditable == 'function')
              sm.map.gizmos[i][n]._setEditable(false);
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
      console.log("MGM Admin initialized");
      $(window).triggerHandler('mgm.admin.initialized', {'mgm': mgm});
    },

    initDrawingManager : function(map) {
      var config = {
        drawingMode: google.maps.drawing.OverlayType.MARKER,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            google.maps.drawing.OverlayType.MARKER,
            google.maps.drawing.OverlayType.POLYGON
          ],
        },
        markerOptions: map.getDefaults('marker'),
        polygonOptions: map.getDefaults('polygon')
      };

      map.dm = new google.maps.drawing.DrawingManager(config);

      map.dm.setMap(map.map);

      google.maps.event.addListener(map.dm, 'markercomplete', function(gm_marker) {
        if(gm_marker._registerd == true)
          return;
        gm_marker.setMap(null);

        var extract = mgm.map_extractor.getExtractor('marker', 'standard');
        map.addGizmo(extract(gm_marker));
      });

      google.maps.event.addListener(map.dm, 'polygoncomplete', function(gm_polygon) {
        if(gm_polygon._registerd == true)
          return;
        gm_polygon.setMap(null);

        var extract = mgm.map_extractor.getExtractor('polygon', 'standard');
        map.addGizmo(extract(gm_polygon));
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
        mgm.content_form_provider.getProvider('general_fields', 'standard').update(gizmo, $form);
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

      state_machine.switchState(state_machine.EDIT_STATE);
      map.sm = state_machine;
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

    updateFormProvider : function(map, provider) {

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

      this.loadGeneralFields(map, gizmo);
      this.loadContentProviderFields(map, gizmo);
    },

     /**
     * Loads the general fields which are the same on differen gizmos
     *
     * There are 2 types
     * General gizmo fields -> the same fields for the same gizmo types
     * General fields -> the same for all types
     *
     */
    loadGeneralFields : function(map, gizmo) {
      // Load generic fields which are the same each time
      var $generic = $(map.map_root).find('.mgm_edit_wrapper').find('.generic');

      // Fields which are the same for all gizmo of same type
      var loadGeneralGizmoFields = function(data) {
        $generic.append($(data));
      };

      // Fields like name and content-provider selection are used of all gizmos no mater the type
      var loadGeneralFields = function(data) {
        $generic.html(data);
        mgm.form_provider.renderProvider(gizmo.gizmo_type, gizmo.type, gizmo, loadGeneralGizmoFields);
      }

        mgm.form_provider.renderProvider('general_fields', 'standard', gizmo, loadGeneralFields);
    },

    /**
     * Loads the content provider fields based on the gizmo's content_provider property
     */
    loadContentProviderFields : function(map, gizmo) {
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
                // '<div class="row">' +
                //   '<label for="map_name" class="col col_3_12">Name:</label>' +
                //   '<input type="text" name="map_name" class="col col_9_12" />' +
                // '</div>' +
                '<div class="row mgm_position">' +
                  '<span class="col col_3_12 label">Position:</span>' +
                  '<div class="col col_9_12 no-padding latlng_field">' +
                    '<label for="map_lat" class="col col_1_12 lat_label">Lat:</label>' +
                    '<input type="number" name="map_lat" class="col col_3_12 lat_field" min="-90" max="90" step="0.000001" />' +
                    '<label for="map_lng" class="col col_1_12 lng_label">Lng:</label>' +
                    '<input type="number" name="map_lng" class="col col_3_12 lng_field" min="-180" max="180" step="0.000001" />' +
                  '</div>' +
                '</div>' +
                '<div class="row viewport_row">' +
                  '<h5 class="col col_12_12 label">Viewport Restrictions:</h5>' +
                '</div>' +
                '<div class="row">' +
                  '<span class="col col_3_12 label">Bottom-Left:</span>' +
                  '<div class="col col_9_12 no-padding latlng_field">' +
                    '<label for="viewport_tr_lat" class="col col_1_12 lat_label">Lat:</label>' +
                    '<input type="number" name="viewport_bl_lat" class="col col_3_12 lat_field" min="-90" max="90" step="0.000001" />' +
                    '<label for="viewport_tr_lng" class="col col_1_12 lng_label">Lng:</label>' +
                    '<input type="number" name="viewport_bl_lng" class="col col_3_12 lng_field" min="-180" max="180" step="0.000001" />' +
                  '</div>' +
                '</div>' +
                '<div class="row">' +
                  '<span class="col col_3_12 label">Top-Right:</span>' +
                  '<div class="col col_9_12 no-padding latlng_field">' +
                    '<label for="viewport_bl_lat" class="col col_1_12 lat_label">Lat:</label>' +
                    '<input type="number" name="viewport_tr_lat" class="col col_3_12 lat_field" min="-90" max="90" step="0.000001" />' +
                    '<label for="viewport_bl_lng" class="col col_1_12 lng_label">Lng:</label>' +
                    '<input type="number" name="viewport_tr_lng" class="col col_3_12 lng_field" min="-180" max="180" step="0.000001" />' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="col col_6_12 right">' +
                '<div class="row viewport_row">' +
                  '<h5 class="col col_12_12 label">Overlay:</h5>' +
                '</div>' +
                '<div class="row overlay_row">' +
                  '<label for="overlay_image" class="col col_3_12">Image:</label>' +
                  '<input type="text" name="overlay_image" class="col col_5_12 image-value" />' +
                  '<button class="button button-primary image-upload col col_3_12" name="overlay_image">Upload</button>' +
                '</div>' +
                '<div class="row">' +
                  '<span class="col col_3_12 label">Bottom-Left:</span>' +
                  '<div class="col col_9_12 no-padding latlng_field">' +
                    '<label for="overlay_tr_lat" class="col col_1_12 lat_label">Lat:</label>' +
                    '<input type="number" name="overlay_bl_lat" class="col col_3_12 lat_field" min="-90" max="90" step="0.000001" />' +
                    '<label for="overlay_tr_lng" class="col col_1_12 lng_label">Lng:</label>' +
                    '<input type="number" name="overlay_bl_lng" class="col col_3_12 lng_field" min="-180" max="180" step="0.000001" />' +
                  '</div>' +
                '</div>' +
                '<div class="row">' +
                  '<span class="col col_3_12 label">Top-Right:</span>' +
                  '<div class="col col_9_12 no-padding latlng_field">' +
                    '<label for="overlay_bl_lat" class="col col_1_12 lat_label">Lat:</label>' +
                    '<input type="number" name="overlay_tr_lat" class="col col_3_12 lat_field" min="-90" max="90" step="0.000001" />' +
                    '<label for="overlay_bl_lng" class="col col_1_12 lng_label">Lng:</label>' +
                    '<input type="number" name="overlay_tr_lng" class="col col_3_12 lng_field" min="-180" max="180" step="0.000001" />' +
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

              if(typeof overlay_config.top_right_coords != 'undefined') {
                $html.find('input[name="overlay_tr_lat"]').val(overlay_config.top_right_coords.lat);
                $html.find('input[name="overlay_tr_lng"]').val(overlay_config.top_right_coords.lng);
              }

              if(typeof overlay_config.bottom_left_coords != 'undefined') {
                $html.find('input[name="overlay_bl_lat"]').val(overlay_config.bottom_left_coords.lat);
                $html.find('input[name="overlay_bl_lng"]').val(overlay_config.bottom_left_coords.lng);
              }
            }

            mgm.wp_admin.customImageUpload($html.find(".overlay_row"));

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
              var overlay_config = {'image':'', 'top_right_coords': {}, 'bottom_left_coords': {}};

            overlay_config.image = $form.find('input[name="overlay_image"]').val();
            overlay_config.top_right_coords.lat = $form.find('input[name="overlay_tr_lat"]').val();
            overlay_config.top_right_coords.lng = $form.find('input[name="overlay_tr_lng"]').val();
            overlay_config.bottom_left_coords.lat = $form.find('input[name="overlay_bl_lat"]').val();
            overlay_config.bottom_left_coords.lng = $form.find('input[name="overlay_bl_lng"]').val();

            map.setOverlay(overlay_config);
          },

          save : function(marker, form) {
            this.update();
          }
        }
      },

      general_fields : {
        standard : {
          html : '<div class="row">' +
                  '<label for="gizmo_name" class="col col_3_12">Name:</label>' +
                  '<input type="text" name="gizmo_name" class="col col_9_12" />' +
                '</div>' +
                '<div class="row">' +
                  '<label for="content_provider" class="col col_3_12">Type</label>' +
                  '<select name="content_provider" class="col col_9_12"></select>' +
                '</div>',

          render : function(gizmo, callback) {
            var self = this;
            $html = $(this.html);
            var select = this.getContentProviderHTML(gizmo);
            $html.find('select[name="content_provider"]').append($(select));
            $html.find('input[name="gizmo_name"]').val(gizmo.name);

            $html.find('select[name="content_provider"]').change(function() {
              self.update(gizmo, $(this).closest('.mgm_form'));
              mgm.admin.loadContentProviderFields(gizmo.mgm_map, gizmo);
            });

            callback($html);
          },

          getContentProviderHTML : function(gizmo) {
            var providers = mgm.content_form_provider.getProviderNames();
            var html = '';
            for(var i in providers) {
              var provider = providers[i];
              var selected = provider == gizmo.content_provider ? ' selected="selected" ' : '';
              html += '<option value="' + provider + '" ' + selected +'>' + provider + '</option>\n';
            }
            return html;
          },

          update : function(gizmo, form) {
            var $form = $(form),
                content_provider = $form.find('select[name="content_provider"]').val(),
                content_data;

            gizmo.name = $form.find('input[name="gizmo_name"]').val();

            var field_provider = mgm.content_form_provider.getProvider(gizmo.content_provider);

            if(typeof gizmo.temporary_content_data == 'undefined')
              gizmo.temporary_content_data = {};

            gizmo.temporary_content_data[gizmo.content_provider] = field_provider.form_data(gizmo, form);

            if(typeof gizmo.temporary_content_data[content_provider] != 'undefined')
              content_data = gizmo.temporary_content_data[content_provider];
            else
              content_data = gizmo.content_data;

            gizmo.content_data = content_data;
            gizmo.content_provider = content_provider
          },

          save : function(gizmo, form) {
            this.update();
          }
        }
      },

      marker : {
        standard : {
          html : '<div class="row mgm_position">' +
                    '<span class="col col_3_12 label">Position:</span>' +
                    '<div class="col col_9_12 no-padding latlng_field">' +
                      '<label for="gizmo_lat" class="col col_1_12 lat_label">Lat:</label>' +
                      '<input type="number" name="gizmo_lat" class="col col_3_12 lat_field" min="-90" max="90" step="0.000001" />' +
                      '<label for="gizmo_lng" class="col col_1_12 lng_label">Lng:</label>' +
                      '<input type="number" name="gizmo_lng" class="col col_3_12 lng_field" min="-180" max="180" step="0.000001" />' +
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

          render : function(gizmo, callback) {
            var self = this;
            $html = $(this.html);

            $html.find('input[name="gizmo_stroke_color"]').val(gizmo.strokeColor);
            $html.find('input[name="gizmo_stroke_opacity"]').val(gizmo.strokeOpacity);
            $html.find('input[name="gizmo_stroke_width"]').val(gizmo.strokeWeight);
            callback($html);
          },

          update : function(gizmo, form) {
            $form = $(form);
            gizmo.strokeColor = $html.find('input[name="gizmo_stroke_color"]').val();
            gizmo.strokeOpacity = $html.find('input[name="gizmo_stroke_opacity"]').val();
            gizmo.strokeWeight = $html.find('input[name="gizmo_stroke_width"]').val();

            this.refreshBinded(gizmo);
          },

          refreshBinded : function(gizmo) {
            gizmo.gm_polygon.setOptions({
              strokeColor: gizmo.strokeColor,
              strokeOpacity: gizmo.strokeOpacity,
              strokeWeight: gizmo.strokeWeight,
              fillColor: gizmo.fillColor,
              fillOpacity: gizmo.fillOpacity
            });
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

    getProviderNames : function(std_inclusive) {
      var std_inclusive = std_inclusive || true;
      var providers = [];
      for(var i in this.providers)
        providers.push(i);
      return providers;
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

        form_data : function(gizmo, form) {
          return '';
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

  /**
   * Extractors are used for extracting google maps data.
   * The data is then represented for hanlding in our mgm format
   */
  mgm.map_extractor = {
    std_key: 'standard',
    map_extractors: {
      marker: {
        standard : function(gm_marker) {
          return {
            'gizmo_type' : 'marker',
            'type' : 'standard',
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
            'gizmo_type' : 'polygon',
            'type' : 'standard',
            'points' : points
          };
        }
      },
    },

    getExtractor : function(gizmo_type, key) {
      if(typeof this.map_extractors[gizmo_type] == 'undefined')
        return null;
      else if(typeof this.map_extractors[gizmo_type][key] == 'undefined')
        return this.map_extractors[gizmo_type][this.std_key];
      return this.map_extractors[gizmo_type][key];
    },

    setBuilder : function(gizmo_type, key, builder) {
      this[gizmo_type][key] = builder;
    },
  };

  mgm.admin.utils = {
    round : function(coord_segment) {
      return Math.round(Math.pow(10, mgm.admin.config.ll_dec_points) * coord_segment) / Math.pow(10, mgm.admin.config.ll_dec_points);
    }
  };
  $(window).triggerHandler('mgm.admin.loaded', {'mgm': mgm});
})(jQuery);