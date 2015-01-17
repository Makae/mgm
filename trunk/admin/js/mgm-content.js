/**
 * Section for providing the default providers
 *
 * @author: M. Käser
 * @date: 23.12.2014
 **/
(function($) {
  var provider = {
    html : '<div class="row">' +
              '<label for="gizmo_content_paragraph" class="col col_12_12">Paragraph</label>' +
              '<textarea name="gizmo_content_paragraph" class="col col_12_12"></textarea>' +
            '</div>',

    render : function(gizmo, callback) {
      $html = $(this.html);
      $html.find('textarea[name="gizmo_content_paragraph"]').val(gizmo.content_data);
      callback($html);
    },

    update : function(gizmo, form) {
      gizmo.content_data = this.form_data(gizmo, form);
    },

    form_data : function(gizmo, form) {
      return $(form).find('textarea[name="gizmo_content_paragraph"]').val();
    },

    save : function(gizmo, form) {
      this.update();
    }
  };

  // Register the content provider to mgm
  mgm.content_form_provider.setProvider('paragraph', provider);
  console.log("MGM Content providers initialized");
})(jQuery);