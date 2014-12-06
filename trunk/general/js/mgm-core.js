/**
 * @author: M. Käser
 * @date: 29.11.2014
 * @desc: Core for the makae-googlemaps-plugin
 **/
var mgm = typeof mgm != 'undefined' ? mgm : {};
(function($) {
  // Addit to the MGM-Library such that the map can be extended / changed at wish
  mgm.MGM_Map = function(config) {
    this.map_dom = null;
    this.map = null;
    this.markers = [];
    this.polygons = [];
    this.config = config;
    this.gizmo_counter = 0;
  };

  mgm.MGM_Map.prototype.init = function(map_dom) {
   var self = this;
   var mapOptions = {
        center: mgm.utils.latLngToPos(this.config),
        zoom: this.config.zoom
      };
    this.map_dom = map_dom;
    this.map_root = $(map_dom).closest(".mgm_wrapper").get(0);
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

  mgm.MGM_Map.prototype.addMarker = function(marker, builder) {
    marker.gizmo_type = 'marker';
    marker.type = marker.type || 'standard';
    marker.gizmoIdx = ++this.gizmo_counter;

    if(typeof builder != 'function')
      builder = mgm.builder.getBuilder(marker.gizmo_type, marker.type);

    marker = builder(marker);

    marker.register(this);
    marker.idx = this.markers.length;
    this.markers.push(marker);

    return marker;
  };

  mgm.MGM_Map.prototype.removeMarker = function(marker) {
    for(var i in this.markers) {
      if(this.markers[i].gizmoIdx == marker.gizmoIdx) {
        this.markers[i].removed = true;
        break;
      }
    }

    marker.unregister(this.map);
  };

  mgm.MGM_Map.prototype.addPolygon = function(polygon, builder) {
    polygon.gizmo_type = 'polygon';
    polygon.type = polygon.type || 'standard';
    polygon.gizmoIdx = ++this.gizmo_counter;

    if(typeof builder != 'function')
      builder = mgm.builder.getBuilder(polygon.gizmo_type, polygon.type);

    polygon = builder(polygon);

    polygon.register(this);
    polygon.idx = this.polygons.length;
    this.polygons.push(polygon);

    return polygon;
  };

  mgm.MGM_Map.prototype.removePolygon = function(polygon) {
    for(var i in this.polygons) {
      if(this.polygons[i].gizmoIdx == polygon.gizmoIdx) {
        this.polygons[i].removed = true;
        break;
      }
    }

    polygon.unregister(this.map);
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

        for(var i in config.markers)
          map.addMarker(config.markers[i]['marker'], config.markers[i]['builder'])

        for(var i in config.polygons)
          map.addPolygon(config.polygons[i]['polygon'], config.polygons[i]['builder'])
      });

      this.initialized = true;
      $(window).triggerHandler('mgm.loaded', {'mgm': mgm});
    }
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
})(jQuery);


// The init method has to be executed as last thus enque with lowes priority possible (in an other file?)
jQuery(document).ready(function() {
  mgm.init();
});