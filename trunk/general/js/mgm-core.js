/**
 * @author: M. Käser
 * @date: 24.12.2014
 * @desc: Core for the makae-googlemaps-plugin
 **/
var mgm = typeof mgm != 'undefined' ? mgm : {};
(function($) {

  // Add it to the MGM-object such that the map is publicly available
  mgm.MGM_Map = function(config) {
    this.config = config;
    this.gizmos = {};
    this.gizmo_counter = 0;
    this.map_dom = null;
    this.map = null;
  };

  mgm.MGM_Map.prototype.init = function(map_dom) {
   var self = this;
   var mapOptions = {
        center: mgm.utils.latLngToPos(this.config),
        zoom: this.config.zoom
      };
    this.map_dom = map_dom;
    this.map_root = $(map_dom).closest('.mgm_wrapper').get(0);
    this.map = new google.maps.Map(map_dom, mapOptions);

    if(typeof this.config.overlay != 'undefined') {
      this.setOverlay(this.config.overlay);
    }

    if(typeof bounds != 'undefined')
      this.setBounds(this.config.bounds);
  };

  // Took from: http://stackoverflow.com/questions/3125065/how-do-i-limit-panning-in-google-maps-api-v3?answertab=active#tab-top
  mgm.MGM_Map.prototype.setBounds = function(bounds) {
    if(typeof bounds.position != 'undefined') {
      var position_bounds = bounds.position;
      var allowedBounds = new google.maps.LatLngBounds(
        mgm.utils.latLngToPos(position_bounds.top_left_coords),
        mgm.utils.latLngToPos(position_bounds.bottom_right_coords)
      );

      // Listen for the dragend event
      google.maps.event.addListener(self.map, 'dragend', function() {
        if(allowedBounds.contains(self.map.getCenter()))
          return;
        // Out of bounds - Move the map back within the bounds
        var c = self.map.getCenter(),
            x = c.lng(),
            y = c.lat(),
            maxX = allowedBounds.getNorthEast().lng(),
            maxY = allowedBounds.getNorthEast().lat(),
            minX = allowedBounds.getSouthWest().lng(),
            minY = allowedBounds.getSouthWest().lat();

        if (x < minX) x = minX;
        if (x > maxX) x = maxX;
        if (y < minY) y = minY;
        if (y > maxY) y = maxY;

        self.map.setCenter(new google.maps.LatLng(y, x));
      });
    }

    // Limit the zoom level
    if(typeof bounds.zoom != 'undefined') {
     var zoom_bounds = bounds.zoom;
     google.maps.event.addListener(self.map, 'zoom_changed', function() {
       // Setting the zoom returns undefined after setting
       if(typeof zoom_bounds.min != 'undefined' && self.map.getZoom() < zoom_bounds.min) {
         self.map.setZoom(self.config.bounds.zoom.min);
         return;
       }

       if(typeof zoom_bounds.max != 'undefined' && self.map.getZoom() > zoom_bounds.max) {
         self.map.setZoom(self.config.bounds.zoom.max);
         return;
       }
     });
    }

    this.config.bounds = bounds;
  };

  mgm.MGM_Map.prototype.setOverlay = function(config) {
    if(typeof this.overlay != 'undefined')
      this.overlay.setMap(null);

    var bounds = new google.maps.LatLngBounds(mgm.utils.latLngToPos(config.top_left_coords),
                                              mgm.utils.latLngToPos(config.bottom_right_coords));
    this.overlay = new google.maps.GroundOverlay(config.image, bounds);
    this.overlay.setMap(this.map);

    this.config.overlay = config;
  };

  mgm.MGM_Map.prototype.addGizmo = function(gizmo) {
    if(typeof this.gizmos[gizmo.gizmo_type] == 'undefined')
      this.gizmos[gizmo.gizmo_type] = [];

    gizmo.gizmoIdx = ++this.gizmo_counter;

    if(typeof gizmo['builder'] != 'function')
      builder = mgm.builder.getBuilder(gizmo.gizmo_type, gizmo.type);
    else
      builder = gizmo['builder'];

    gizmo = builder(gizmo);

    gizmo.register(this);
    gizmo.idx = this.gizmos[gizmo.gizmo_type].length;
    this.gizmos[gizmo.gizmo_type].push(gizmo);

    return gizmo;
  };

  mgm.MGM_Map.prototype.removeGizmo = function(gizmo) {
    var gizmos = this.gizmos[gizmo.gizmo_type];
    for(var i in gizmos) {
      if(gizmos[i].gizmoIdx == gizmo.gizmoIdx) {
        this.gizmos[gizmo.gizmo_type][i].removed = true;
        break;
      }
    }

    gizmo.unregister(this.map);
  };

  mgm.MGM_Map.prototype.getGizmos = function(unregister, only_active, extract_data) {
    var only_active = typeof only_active == 'undefined' ? true : false;
    var unregister = typeof unregister == 'undefined' ? false : true;
    var extract_data = typeof extract_data == 'undefined' ? true : false;

    if(!unregister && !only_active && !extract_data)
      return this.gizmos;

    var gizmos = {};
    var data;
    for(var gizmo_type in this.gizmos) {
      for(var i = 0; i < this.gizmos[gizmo_type].length; i++) {
        var gizmo = this.gizmos[gizmo_type][i];
        if(only_active && (gizmo.removed || gizmo.temporary))
          continue;

        if(extract_data)
          data = gizmo.getData();

        if(unregister)
          gizmo.unregister();

        if(typeof gizmos[gizmo_type] == 'undefined')
          gizmos[gizmo_type] = [];

        if(extract_data)
          gizmos[gizmo_type].push(data);
        else
          gizmos[gizmo_type].push(gizmo);
      }
    }
    return gizmos;
  };

  mgm.MGM_Map.prototype.getConfig = function() {
    return this.config;
  };

  var _mgm = {
    initialized : false,
    config : {
      'map_selector' : '.mgm_map'
    },
    maps : [],
    init : function() {
      var self = this;

      $(this.config.map_selector).each(function() {
        var config = JSON.parse($(this).attr('data-map'));

        var map = new mgm.MGM_Map(config.map);

        map.init(this);
        self.maps.push(map);

        // Load gizmos and set type values if none are set
        for(var gizmo_type in config.gizmos) {
          for(var i in config.gizmos[gizmo_type]) {
            var gizmo = config.gizmos[gizmo_type][i];
            if(typeof gizmo['gizmo_type'] == 'undefined')
              gizmo['gizmo_type'] = gizmo_type;
            if(typeof config.gizmos[gizmo_type][i]['type'] == 'undefined')
              gizmo['gizmo_type'] = 'standard';

            config.gizmos[gizmo_type][i] = gizmo;
            map.addGizmo(config.gizmos[gizmo_type][i]);

          }
        }
      });

      this.initialized = true;
      $(window).triggerHandler('mgm.loaded', {'mgm': mgm});
    },
    getMap : function(idx) {
      if(idx >= this.maps.length || idx < 0)
        return null;
      return this.maps[idx];
    },
    getMapData : function(idx) {
      var map = this.getMap(idx);

      if(map == null)
        return null;

      var data = {
        map : map.config,
        gizmos : map.getGizmos(true)
      };

      return data;
    }
  };

  mgm.builder = {
    std_key : 'standard',
    builders : {
      marker: {
        standard : function(marker) {
          var clicklistener_handler;
          var relevant_data = ['gizmo_type', 'type', 'lat', 'lng', 'content_provider'];

          marker.register = function(mgm_map) {
            marker.mgm_map = mgm_map;
            marker.position = mgm.utils.latLngToPos(marker);

            marker.gm_marker = new google.maps.Marker(marker);
            marker.gm_marker._registered = true;
            marker.gm_marker.setMap(mgm_map.map);

            clicklistener_handler = google.maps.event.addListener(marker.gm_marker, 'click', function(e) {
              marker.onClick(e, function(){});
            });
          };

          marker.unregister = function(mgm_map) {
            clicklistener_handler.remove();
            marker.gm_marker.setMap(null);
            delete marker.gm_marker;
            delete marker.position;
            delete marker.clickable;
            delete marker.draggable;
            delete marker.mgm_map;
            delete marker.register;
            delete marker.unregister;
            delete marker.onClick;
          };

          marker.onClick = function(e, callback) {
            mgm.content_manager.callProvider(marker.content_provider, marker, callback);
          };

          marker.getData = function() {
            return mgm.utils.extractData(marker, relevant_data);
          };

          return marker;
        }
      },
      polygon: {
        standard : function(polygon) {
          var clicklistener_handler;
          var relevant_data = ['gizmo_type', 'type', 'points'];

          polygon.register = function(mgm_map) {
            polygon.mgm_map = mgm_map;

            polygon.paths = [];
            for(var i in polygon.points)
              polygon.paths.push(mgm.utils.latLngToPos(polygon.points[i]));

            polygon.gm_polygon = new google.maps.Polygon(polygon);
            polygon.gm_polygon._registered = true;
            polygon.gm_polygon.setMap(mgm_map.map);
            clicklistener_handler = google.maps.event.addListener(polygon.gm_polygon, 'click', function(e) {
              polygon.onClick(e, function(){});
            });
          };

          polygon.unregister = function(mgm_map) {
            clicklistener_handler.remove();
            polygon.gm_polygon.setMap(null);
            delete polygon.gm_polygon;
            delete polygon.mgm_map;
            delete polygon.clickable;
            delete polygon.draggable;
            delete polygon.register;
            delete polygon.unregister;
            delete polygon.onClick;
          };

          polygon.onClick = function(e, callback) {
            mgm.content_manager.callProvider(polygon.content_provider, polygon, callback);
          };

          polygon.getData = function() {
            return mgm.utils.extractData(polygon, relevant_data);
          };

          return polygon;
        }
      }
    },

    getBuilder : function(gizmo_type, key) {
      if(typeof this.builders[gizmo_type] == 'undefined')
        return null;
      else if(typeof this.builders[gizmo_type][key] == 'undefined')
        return this.builders[gizmo_type][this.std_key];
      return this.builders[gizmo_type][key];
    },

    setBuilder : function(gizmo_type, key, builder) {
      this.builders[gizmo_type][key] = builder;
    },
  };

  mgm.content_manager = {
    callProvider : function(key, gizmo, callback) {
      if(typeof this.providers[key] != 'undefined')
        this.providers[key](gizmo, callback);
      else
        this.providers.standard(gizmo, callback);
    },
    providers : {
      standard : function(gizmo, callback) {
        callback(gizmo.content_data)
      },
      paragraph : function(gizmo, callback) {
        callback(gizmo.content_data)
      },
      setProvider : function(key, call) {
        this[group][key] = call;
      }
    }
  };

  mgm.utils = {
    latLngToPos : function(config) {
      return new google.maps.LatLng(config.lat, config.lng);
    },

    rad : function(deg) {
      return deg * Math.PI / 180;
    },

    getDistance : function(p1, p2) {
      // @src: http://stackoverflow.com/a/1502821
      var R = 6378137; // Earth’s mean radius in meter
      var dLat = rad(p2.lat() - p1.lat());
      var dLong = rad(p2.lng() - p1.lng());
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;
      return d; // returns the distance in meter
    },

    extractData : function(from, relevant_data) {
      var data = {};
      for(var i = 0; i < relevant_data.length; i++)
        data[relevant_data[i]] = from[relevant_data[i]];
      return data;
    }
  };

  $.extend(mgm, _mgm);
  mgm.init();
})(jQuery);