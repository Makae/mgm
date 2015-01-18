/**
 * Enhance the default builders for the gizmos marker and polygon
 *
 * @author: M. Käser
 * @date: 23.12.2014
 **/

// GIZMO MARKER ENHANCEMENT
(function($) {
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
        marker.mgm_map.removeGizmo(marker);
      } else {
        mgm.admin.showEditGizmo(marker.mgm_map, marker);
      }

      if(typeof callback == 'function')
        callback();
    };

    return marker;
  };

  mgm.builder.setBuilder('marker', 'standard', fnBuilder);
})(jQuery);

// GIZMO POLYGON ENHANCEMENT
(function($) {
  var std_builder = mgm.builder.getBuilder('polygon', 'standard');
  var fnBuilder = function(polygon) {
    var dragendListenerHandler;
    var pathEditSetHandler;
    var pathEditInsertHandler;

    polygon.draggable = true;
    var polygon = std_builder(polygon);

    polygon._register = polygon.register;
    polygon.register = function(mgm_map) {
      polygon._register(mgm_map);
      dragendListenerHandler = google.maps.event.addListener(polygon.gm_polygon, 'dragend', function(e) {
        polygon.onDragEnd(e);
      });
      pathEditSetHandler = google.maps.event.addListener(polygon.gm_polygon.getPath(), 'set_at', function(e) {
        polygon.update();
      });
      pathEditInsertHandler = google.maps.event.addListener(polygon.gm_polygon.getPath(), 'insert_at', function(e) {
        polygon.update();
      });
    }

    polygon._unregister = polygon.unregister;
    polygon.unregister = function(mgm_map) {
      dragendListenerHandler.remove();
      pathEditSetHandler.remove();
      pathEditInsertHandler.remove();
      polygon._unregister(mgm_map);
    }

    polygon.update = function() {
      var extract = mgm.map_extractor.getExtractor('polygon', 'standard');
      var data = extract(polygon.gm_polygon);
      for(var i in data)
        polygon[i] = data[i];
    };

    polygon.onDragEnd = function(e, callback) {
      polygon.update();
    };

    polygon.onChange = function(e, callback) {
      debugger;
      polygon.update();
    }

    polygon.onClick = function(e, callback) {
      var map_sm = polygon.mgm_map.sm;
      var current_state = map_sm.currentState().name;

      if(current_state == map_sm.REMOVE_STATE) {
        polygon.mgm_map.removeGizmo(polygon);
      } else {
        mgm.admin.showEditGizmo(polygon.mgm_map, polygon);
      }

      if(typeof callback == 'function')
        callback();
    };

    // underscore avoids recursion because the polygon is passed to the GM
    polygon._setEditable = function(active) {
      polygon.gm_polygon.setEditable(active);
    };

    return polygon;
  };

  mgm.builder.setBuilder('polygon', 'standard', fnBuilder);
})(jQuery);
console.log("MGM Admin Gizmos initialized");