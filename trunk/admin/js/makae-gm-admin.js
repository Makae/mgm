var mgm = typeof mgm != 'undefined' ? mgm : {};
(function($) {
  var admin = {

    initialized : false,

    init : function() {
      this.handleMapUpdate();
      this.initialized = true;
      console.log("MGM WPAdmin initialized");
      $(window).triggerHandler('mgm.wp_admin.initialized', {'mgm': mgm});
    },

    /**
     * Writes the js-mapdata inside an input field
     * as JSON
     */
    handleMapUpdate : function() {
      var map_input = $('input[name="mgm_map_data"]');
      if(map_input.length == 0)
        return;

      $(map_input).closest('form').submit(function(e) {
        var data = mgm.getMapData(0);
        map_input.val(JSON.stringify(data));
      });
    },

    prepareFormInputs : function(context) {
      this.inputImageUpload(context);
      this.inputColorPicker(context);
    },

    inputImageUpload : function(context) {
     var meta_image_frame;
     $(context).find('.image-upload').click(function(e){
       e.preventDefault();

       if(meta_image_frame) {
         meta_image_frame.open();
         return;
       }

       // Acces media upload of WP
       meta_image_frame = wp.media.frames.meta_image_frame = wp.media({
         title: 'Upload',
         button: {text:  'Upload'},
         library: {type: 'image'}
       });

       meta_image_frame.on('select', function(){
         var media_attachment = meta_image_frame.state().get('selection').first().toJSON();
         $(context).find('.image-value').val(media_attachment.url);
       });

       // Opens the media library frame.
       meta_image_frame.open();
     });
    },

    inputColorPicker : function(context) {
      $(context).find('.color-field').wpColorPicker();
    }

  };
 mgm.wp_admin = admin;
})(jQuery);
