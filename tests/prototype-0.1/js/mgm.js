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
              'marker' : {
                'id' : 0,
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
                'type' : 'standard',
                'lat' : 51.4801,
                'lng' : 0.2,
                'icon' : null,
                'content_provider' : 'paragraph',
                'content_data' : 'paragraph2'
              }
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
    if(typeof builder == 'function')
      marker = builder(marker);
    else if(typeof mgm.builder.marker[marker.type] != 'undefined')
      marker = mgm.builder.marker[marker.type](marker);
    else
      marker = mgm.builder.marker.standard(marker);
    marker.register(this);
    this.markers.push(marker);
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
        var map = new MGM_Map(config.map);

        map.init(this);
        self.maps.push(map);

        for(var i in config.markers)
          map.addMarker(config.markers[i]['marker'], config.markers[i]['builder'])
      });

      mgm.admin.init();
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

          var gm_marker = new google.maps.Marker(marker);
          gm_marker.setMap(mgm_map.map);

          google.maps.event.addListener(gm_marker, 'click', function(e) {
            var callback = function(data) {
            };
            marker.onClick(e, callback);
          });
        };

        marker.onClick = function(e, callback) {
          console.log(callback);
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
      setContentProvider : function(key, call) {
        this[group][key] = call;
      }
    }
  };

  mgm.admin = {
    init : function() {
      for(var i in mgm.maps)
        this.registerAdminHandlers(mgm.maps[i]);
    },

    registerAdminHandlers : function(map) {
      var self = this;
      //this.hideEdit(map, 0);
      $(map.map_root).find(".close, button.cancel").click(function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        self.hideEdit(map);
      });
    },

    showEdit : function(map, marker) {
      this.hideEdit(map);
      this.loadFields(map, marker);
    },

    hideEdit : function(map, time) {
      var time = typeof time != 'undefined' ? time : 200;
      console.log(map.map_root);
      $(map.map_root).find(".mgm_edit").slideUp(time);
    },

    loadFields : function(map, marker) {
      var editDiv = $(map.map_root).find(".mgm_edit");
      editDiv.delay(200).slideDown(200);
    }
  };

  return mgm;
})(jQuery);

// This is the enhancement for the admin
var std_builder = mgm.builder.getBuilder('marker', 'standard');
var fnBuilder = function(marker) {
  var marker = std_builder(marker);

  marker.onDrag = function(e, callback) {
    console.log("DRAAAAAAAAG");
  };

  marker.onClick = function(e, callback) {
    // This is for showing the edit window;
    mgm.admin.showEdit(marker.mgm_map, marker);
    callback();
  };

  return marker;
};

mgm.builder.setBuilder('marker', 'standard', fnBuilder);

// The init method has to be executed as last thus enque with lowes priority possible (in an other file?)
$(document).ready(function() {
  mgm.init();
});