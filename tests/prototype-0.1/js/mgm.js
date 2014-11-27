var mgm = typeof mgm != 'undefined' ? mgm : {};
(function($) {
  var temp_api_key = 'AIzaSyBI6EAL6H3ndMb5YvNP6-qH-D6WivdTh7s';
  var temp_map_config = {
          'map' : {
            'lat' : 51.480,
            'lng' : 0.0,
            'zoom' : 19
          },
          'polygons' : [
            {
              'polygon' : {
                'id' : 0,
                'name' : 'asdf',
                'points' : [
                  {'lat' : 51.48, 'lng': 0.0},
                  {'lat' : 51.4802, 'lng': 0.0004},
                  {'lat' : 51.4790, 'lng': 0.0008},
                ]
              }
            }
          ],

          'markers' : [
            {
              'marker' : {
                'id' : 0,
                'name' : 'Marker 1',
                'type' : 'standard',
                'lat' : 51.480,
                'lng' : 0.0,
                'icon' : null,
                'content_provider' : 'paragraph',
                'content_data' : 'paragraph1'
              }
            },
            {
              'marker' : {
                'id' : 1,
                'name' : 'Marker 2',
                'type' : 'standard',
                'lat' : 51.4801,
                'lng' : 0.2,
                'icon' : null,
                'content_provider' : 'paragraph',
                'content_data' : 'paragraph2'
              }
            }
          ],
          'form_providers' : {
            'paragraph' : {
              render : function(gizmo_id, cbk) {
                cbk("response from server as callback" + gizmo_id);
              }
            }
          }

        };

  var MGM_Map = function(config) {
    this.map_dom = null;
    this.map = null;
    this.markers = [];
    this.polygons = [];
    this.config = config;
    this.gizmo_counter = 0;
  };

  MGM_Map.prototype.init = function(map_dom) {
   var mapOptions = {
        center: mgm.utils.latLngToPos(this.config),
        zoom: this.config.zoom
      };
    this.map_dom = map_dom;
    this.map_root = $(map_dom).closest(".mgm_wrapper").get(0);
    this.map = new google.maps.Map(map_dom, mapOptions);
  };

  MGM_Map.prototype.addMarker = function(marker, builder) {
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

  MGM_Map.prototype.removeMarker = function(marker) {
    for(var i in this.markers) {
      if(this.markers[i].gizmoIdx == marker.gizmoIdx) {
        this.markers[i].removed = true;
        return;
      }
    }

    marker.unregister(this.map);
  };

  MGM_Map.prototype.addPolygon = function(polygon, builder) {
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

  MGM_Map.prototype.removePolygon = function(polygon) {
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
      'map_selector' : '.mgm_map',
      'api_key' : ''
    },
    maps : [],
    init : function() {
      var self = this;
      //  this.config.api_key = mgm_config.api_key; (variable is loaded via localization script of wp)
      this.config.api_key = temp_api_key;
      $(this.config.map_selector).each(function() {
        //var config = JSON.parse($(this).attr('data-map'));
        var config = temp_map_config;
        var map = new MGM_Map(config.map);

        map.init(this);
        self.maps.push(map);

        for(var i in config.markers)
          map.addMarker(config.markers[i]['marker'], config.markers[i]['builder'])

        for(var i in config.polygons)
          map.addPolygon(config.polygons[i]['polygon'], config.polygons[i]['builder'])
      });

      if(typeof mgm.admin != 'undefined' && mgm.admin.initialized === false)
        mgm.admin.init();
      this.initialized = true;
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
$(document).ready(function() {
  mgm.init();
});