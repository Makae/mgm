var mgm = typeof mgm != 'undefined' ? mgm : {};
(function($) {
  var admin = {
  init : function() {

    this.mapUpdate();
  },

  mapUpdate : function() {
    if($('input[name="mgm-map-data"]').length == 0)
      return;

    $('input[type="submit"]').click(function(e) {
      var map = mgm.getMap(0);
      var data = map.getData();

    });
  },

  customImageUpload : function(context) {
   var meta_image_frame;
   $(context).find(".image-upload").click(function(e){
     e.preventDefault();

     if(meta_image_frame) {
     meta_image_frame.open();
     return;
     }

     meta_image_frame = wp.media.frames.meta_image_frame = wp.media({
     title: "Upload",
     button: { text:  "Upload" },
     library: { type: 'image' }
     });

     meta_image_frame.on('select', function(){
     var media_attachment = meta_image_frame.state().get('selection').first().toJSON();
     $(context).find(".image-value").val(media_attachment.url);
     });

     // Opens the media library frame.
     meta_image_frame.open();
   });
  }

 };
 admin.init();
 mgm.wp_admin = admin;
})( jQuery );
