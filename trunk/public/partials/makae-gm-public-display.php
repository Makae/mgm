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
    echo apply_filters('makae_gm_pre_wrapper', '');
    echo '<div class="mgm_wrapper">';
    echo apply_filters('makae_gm_pre_map', '');
    echo '<div class="mgm_map" data-map="' . $map_data . '"></div>';
    echo apply_filters('makae_gm_pre_map', '');
    echo '</div>';
  }
}