/**
 * Section for providing the default providers
 *
 * @author: M. Käser
 * @date: 23.12.2014
 **/
(function($) {
  var paragraph_provider = {
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

  var post_provider = {
    html : '<div class="row">' +
              '<label for="gizmo_content_paragraph" class="col col_12_12">Post Select</label>' +
              '<input type="hidden" name="gizmo_post_id" />' +
              '<input type="text" name="gizmo_post_name" class="col col_12_12" />' +
            '</div>',
    config : makae_gm_content_config.cp_posts,

    render : function(gizmo, callback) {
      var self = this;
      var cd = gizmo.content_data;
      var $html = $(this.html);
      if(typeof cd != 'undefined' && typeof cd.post_id != 'undefined' && cd.post_id) {
        $html.find('input[name="gizmo_post_id"]').val(cd.post_id);
        this.loadName(cd.post_id, function(name) {
          var entries = name.match(/^\[(\d+)\]\s+(.*)$/);
          $html.find('input[name="gizmo_post_name"]').val(entries[2]);
          self.registerAutocomplete($html);
          callback($html);
        });
      } else {
        this.registerAutocomplete($html);
        callback($html);
      }
    },

    loadName : function(id, callback) {
      var data = $.extend(this.config.ajax_params.post_id, {
        post_id: id
      });
      $.ajax({
        url : makae_gm_content_config.ajax_url,
        data : data,
        dataType: 'json',
        success : function(data) {
          callback(data.content);
        }
      });
    },

    registerAutocomplete : function($html) {
      var self = this;
      var fill = function(value) {
        var entries = value.match(/^\[(\d+)\]\s+(.*)$/);
        $html.find('input[name="gizmo_post_name"]').val(entries[2]);
        $html.find('input[name="gizmo_post_id"]').val(entries[1]);
      };

      $($html.find('input[name="gizmo_post_name"]')).autocomplete({
        minLength: 3,
        autoFocus: true,
        source: function(request, callback) {
          var data = $.extend(self.config.ajax_params.ac, request);

          $.ajax({
            url : makae_gm_content_config.ajax_url,
            data : data,
            dataType: 'json',
            success : function(data) {
              callback(data.content);
            }
          });

        },

        select: function(event, ui) {
          fill(ui.item.label);
          return false;
        },

        focus: function(event, ui ) {
          fill(ui.item.label);
          return false;
        }
      });
    },

    update : function(gizmo, form) {
      gizmo.content_data = this.form_data(gizmo, form);
    },

    form_data : function(gizmo, form) {
      return {
        'post_id' : $(form).find('[name="gizmo_post_id"]').val()
      };
    },

    save : function(gizmo, form) {
      this.update();
    }
  };


  // Register the content provider to mgm
  mgm.content_form_provider.setProvider('post_provider', post_provider);
  console.log("MGM Content providers initialized");
})(jQuery);