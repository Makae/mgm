/**
 * @author: M. Käser
 * @date: 29.11.2014
 * @desc: Core for the makae-googlemaps-plugin
 **/
var mgm = typeof mgm != 'undefined' ? mgm : {};
(function($) {
  // Add it to the MGM-Library such that the map can be extended / changed at wish
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

  mgm.MGM_Map.prototype.getGizmos = function(only_active, unregister) {
    var only_active = typeof only_active == 'undefined' ? true : false;
    var unregister = typeof unregister == 'undefined' ? true : false;

    if(!unregister && !only_active)
      return this.gizmos;

    var gizmos = [];
    for(var i = 0; i < this.gizmos.length; i++) {
      var gizmo = this.gizmos[i];
      if(only_active && (gizmo.removed || gizmo.temporary))
        continue;
      if(unregister)
        gizmo.unregister();
      gizmos.pushd(gizmo);
    }
    return gizmos;
  };

  mgm.MGM_Map.prototype.getConfig = function() {
    return this.config;
  };

  var _mgm = {
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
      if(idx >= this.map.length || idx < 0)
        return null;
      return this.maps[idx];
    },
    getMapData : function(idx) {
      var map = this.getMap(idx);
      if(map == null)
        return null;
      var config = map.config;
      map.gizmos =
    },
    getMap : function(idx) {
      if(idx >= this.map.length || idx < 0)
        return null;
      return this.maps[idx];
    };
  };

  mgm.builder = {
    std_key : 'standard',
    builders : {
      marker: {
        standard : function(marker) {
          var clickListenerHandler;

          marker.register = function(mgm_map) {
            marker.mgm_map = mgm_map;
            marker.position = mgm.utils.latLngToPos(marker);

            marker.gm_marker = new google.maps.Marker(marker);
            marker.gm_marker._registered = true;
            marker.gm_marker.setMap(mgm_map.map);

            clickListenerHandler = google.maps.event.addListener(marker.gm_marker, 'click', function(e) {
              marker.onClick(e, function(){});
            });
          };

          marker.unregister = function(mgm_map) {
            clickListenerHandler.remove();
            marker.gm_marker.setMap(null);
            delete marker.gm_marker;
          };

          marker.onClick = function(e, callback) {
            mgm.content_manager.callProvider(marker.content_provider, marker, callback);
          };

          return marker;
        }
      },
      polygon: {
        standard : function(polygon) {
          var clickListenerHandler;

          polygon.register = function(mgm_map) {
            polygon.mgm_map = mgm_map;

            polygon.paths = [];
            for(var i in polygon.points)
              polygon.paths.push(mgm.utils.latLngToPos(polygon.points[i]));

            polygon.gm_polygon = new google.maps.Polygon(polygon);
            polygon.gm_polygon._registered = true;
            polygon.gm_polygon.setMap(mgm_map.map);
            clickListenerHandler = google.maps.event.addListener(polygon.gm_polygon, 'click', function(e) {
              polygon.onClick(e, function(){});
            });
          };

          polygon.unregister = function(mgm_map) {
            clickListenerHandler.remove();
            polygon.gm_polygon.setMap(null);
            delete polygon.gm_polygon;
          };

          polygon.onClick = function(e, callback) {
            mgm.content_manager.callProvider(polygon.content_provider, polygon, callback);
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
    callProvider : function(key, marker, callback) {
      if(typeof this.providers[key] != 'undefined')
        this.providers[key](marker, callback);
      else
        this.providers.standard(marker, callback);
    },
    providers : {
      standard : function(marker, callback) {
        callback(marker.content_data)
      },
      paragraph : function(marker, callback) {
        callback(marker.content_data)
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

    rad : function(x) {
      // @src: http://stackoverflow.com/a/1502821
      return x * Math.PI / 180;
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
    }
  };

  $.extend(mgm, _mgm);
  mgm.init();
})(jQuery);

// The init method has to be executed as last thus enque with lowes priority possible (in an other file?)
// jQuery(document).ready(function() {

// });