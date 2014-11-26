var mgm = typeof mgm != 'undefined' ? mgm : {};
(function($) {
  var temp_api_key = 'AIzaSyBI6EAL6H3ndMb5YvNP6-qH-D6WivdTh7s';
  var temp_map_config = {
          'map' : {
            'lat' : 51.480,
            'lng' : 0.0,
            'zoom' : 21
          },

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
    marker.gizmoIdx = ++this.gizmo_counter;

    if(typeof builder == 'function')
      marker = builder(marker);
    else if(typeof mgm.builder.marker[marker.type] != 'undefined')
      marker = mgm.builder.marker[marker.type](marker);
    else
      marker = mgm.builder.marker.standard(marker);

    marker.register(this);
    marker.idx = this.markers.length;
    this.markers.push(marker);

    return marker;
  };

  MGM_Map.prototype.removeMarker = function(marker) {
    for(var i in this.markers)
      if(this.markers[i].gizmoIdx != marker.gizmoIdx)
        continue
      else
        this.markers.removed = true;

    marker.unregister(this.map);
  };

  MGM_Map.prototype.addPolygon = function(polygon, builder) {
    polygon.gizmo_type = 'polygon';
    polygon.gizmoIdx = ++this.gizmo_counter;

    if(typeof builder == 'function')
      polygon = builder(polygon);
    else if(typeof mgm.builder.polygon[polygon.type] != 'undefined')
      polygon = mgm.builder.polygon[polygon.type](polygon);
    else
      polygon = mgm.builder.polygon.standard(polygon);

    polygon.register(this);
    polygon.idx = this.polygons.length;
    this.polygons.push(polygon);

    return polygon;
  };

  MGM_Map.prototype.removePolygon = function(polygon) {
    for(var i in this.polygons)
      if(this.polygons[i].gizmoIdx != polygon.gizmoIdx)
        continue
      else
        this.polygons.removed = true;

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
      });

      if(typeof mgm.admin != 'undefined' && mgm.admin.initialized === false)
        mgm.admin.init();
      this.initialized = true;
    }
  };

  mgm.builder = {
    marker: {
      standard : function(marker) {
        var clickListenerHandler;

        marker.register = function(mgm_map) {
          marker.mgm_map = mgm_map;
          marker.position = mgm.utils.latLngToPos(marker);

          marker.gm_marker = new google.maps.Marker(marker);
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
          for(var i in polygon.corners)
            polygon.paths.push(mgm.utils.latLngToPos(polygon.corners[i]));


          polygon.gm_polygon = new google.maps.Polygon(polygon);
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
    },

    getBuilder : function(group, key) {
      if(typeof this[group] == 'undefined')
        return null;
      else if(typeof this[group][key] == 'undefined')
        return null;
      return this[group][key];
    },

    setBuilder : function(group, key, builder) {
      this[group][key] = builder;
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
    }
  };

  $.extend(mgm, _mgm);
})(jQuery);


// The init method has to be executed as last thus enque with lowes priority possible (in an other file?)
$(document).ready(function() {
  mgm.init();
});