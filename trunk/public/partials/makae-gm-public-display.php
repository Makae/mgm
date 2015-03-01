<?php

/**
 * Provide a public-facing view for the plugin
 *
 * This file is used to markup the public-facing aspects of the plugin.
 *
 * @link       http://TBD.com
 * @since      1.0.0
 *
 * @package    Makae_GM
 * @subpackage Makae_GM/public/partials
 */
if(!function_exists('makae_gm_render_map')) {
  function makae_gm_render_map($map_data) {
    $menu_content = apply_filters('makae_gm_menu_content', '');
    echo apply_filters('makae_gm_pre_wrapper', '');
    echo '<div class="mgm_wrapper public">';
    echo apply_filters('makae_gm_pre_map', '');
    if($menu_content) {
      echo '<span class="interaction menu"><span class="menu_inner"></span></span>';
    }
?>
    <div class="mgm_gui_overlay mgm_content_overlay light-shadow-right">
      <span class="interaction close right" data-overlay="mgm_content_overlay">X</span>
      <div class="loading_animation"></div>
      <div class="mgm_content_wrapper"></div>
    </div>
<?php
  if($menu_content) {
?>
    <div class="mgm_gui_overlay mgm_menu_overlay light-shadow-left">
      <span class="interaction close left" data-overlay="mgm_menu_overlay">X</span>
      <div class="loading_animation"></div>
      <div class="mgm_content_wrapper">
        <?= $menu_content ?>
      </div>
    </div>
<?php
  }
?>

<?php
    echo '<div class="mgm_map" data-map="' . $map_data . '"></div>';
    echo apply_filters('makae_gm_pre_map', '');
    echo '</div>';
  }
}