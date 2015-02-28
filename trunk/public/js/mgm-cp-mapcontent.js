/**
 * Content-Provider for map-content-post-type
 *
 * @author: M. Käser
 * @date: 23.12.2014
 **/
(function($) {
  var provider = {
    get_data : function(gizmo, callback) {
      var data = {
        place : gizmo.content_data.place,
        post_id : gizmo.content_data.post_id
      };
      data = $.extend(makae_gm_post_provider.ajax_params, data);

      $.ajax({
        url : makae_gm_post_provider.ajax_url,
        data : data,
        dataType: 'json',
        success : function(data) {
          callback(data.content);
        }
      });
    }
  };

  mgm.content_manager.setProvider('post_provider', provider.get_data);
  console.log("MGM post_provider Content providers initialized");
})(jQuery);