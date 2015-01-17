(function($) {
  mgm.init();
  if(mgm.admin)
    mgm.admin.init();
  if(mgm.wp_admin)
    mgm.wp_admin.init();
})(jQuery);