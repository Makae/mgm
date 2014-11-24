var mgm = (function($) {
  var temp_api_key = 'AIzaSyBI6EAL6H3ndMb5YvNP6-qH-D6WivdTh7s';
  var temp_map_config = {
          'map' : {
            'lat' : 51.480,
            'lng' : 0.0,
            'zoom' : 7
          },
          'markers' : [
            {
              'id' : 0,
              'type' : 'default',
              'lat' : 51.480,
              'lng' : 0.0,
              'icon' : null,
              'content_provider' : 'paragraph'
            },
            {
              'id' : 0,
              'type' : 'default',
              'lat' : 51.4801,
              'lng' : 0.01,
              'icon' : null,
              'content_provider' : 'paragraph'
            }
          ],
          'content_providers' : {
            'paragraph' : {
              getContent : function(gizmo_id, cbk) {
                cbk("response from server as callback" + gizmo_id);
              }
            }
          }
        };

  var MGM_Map = function(config) {
    this.map = null;
    this.config = config;
  };

  MGM_Map.prototype.init = function(dom_elem) {
   var mapOptions = {
        center: mgm.latLngToPos(this.config),
        zoom: this.config.zoom
      };
    this.map = new google.maps.Map(dom_elem, mapOptions);
  };

  MGM_Map.prototype.addMarker = function(marker) {
    if(typeof marker_config.register == 'function') {
      marker.register(this.map)
    } else {
      marker.position = mgm.latLngToPos(marker_config);
      var gm_marker = new google.maps.Marker(marker_config);
      gm_marker.setMap(this.map);
    }

  };


  var mgm = {
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
        console.log(config);
        var map = new MGM_Map(config.map);
        map.init(this);
        self.maps.push(map);
        for(var i in config.markers)
          map.addMarker(config.markers[i])
      });
    },
    latLngToPos : function(config) {
      return new google.maps.LatLng(config.lat, config.lng);
    }
  };

  return mgm;
})(jQuery);

// The init method has to be executed as last thus enque with lowes priority possible (in an other file?)
$(document).ready(function() {
  mgm.init();
});