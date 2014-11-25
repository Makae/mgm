var mgm = typeof mgm != 'undefined' ? mgm : {};
(function($) {
  var temp_api_key = 'AIzaSyBI6EAL6H3ndMb5YvNP6-qH-D6WivdTh7s';
  var temp_map_config = {
          'map' : {
            'lat' : 51.480,
            'lng' : 0.0,
            'zoom' : 7
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
    this.config = config;
  };

  MGM_Map.prototype.init = function(map_dom) {
   var mapOptions = {
        center: mgm.latLngToPos(this.config),
        zoom: this.config.zoom
      };
    this.map_dom = map_dom;
    this.map_root = $(map_dom).closest(".mgm_wrapper").get(0);
    this.map = new google.maps.Map(map_dom, mapOptions);
  };

  MGM_Map.prototype.addMarker = function(marker, builder) {
    marker.gizmo_type = 'marker';
    if(typeof builder == 'function')
      marker = builder(marker);
    else if(typeof mgm.builder.marker[marker.type] != 'undefined')
      marker = mgm.builder.marker[marker.type](marker);
    else
      marker = mgm.builder.marker.standard(marker);
    marker.register(this);
    this.markers.push(marker);
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
    },
    latLngToPos : function(config) {
      return new google.maps.LatLng(config.lat, config.lng);
    }
  };

  mgm.builder = {
    marker: {
      standard : function(marker) {

        marker.register = function(mgm_map) {
          marker.mgm_map = mgm_map;
          marker.position = mgm.latLngToPos(marker);

          marker.gm_marker = new google.maps.Marker(marker);
          marker.gm_marker.setMap(mgm_map.map);

          google.maps.event.addListener(marker.gm_marker, 'click', function(e) {
            var callback = function(data) {
            };
            marker.onClick(e, callback);
          });
        };

        marker.onClick = function(e, callback) {
          mgm.content_manager.callProvider(marker.content_provider, marker, callback);
        };

        return marker;
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
  $.extend(mgm, _mgm);
})(jQuery);


// The init method has to be executed as last thus enque with lowes priority possible (in an other file?)
$(document).ready(function() {
  mgm.init();
});