<?php

/**
 * Provide a dashboard view for the plugin
 *
 * This file is used to markup the public-facing aspects of the plugin.
 *
 * @link       http://TBD.com
 * @since      1.0.0
 *
 * @package    Makae_GM
 * @subpackage Makae_GM/admin/partials
 */
if(!function_exists('makae_gm_render_admin_map')) {
  function makae_gm_render_admin_map($map_data) {
    $toolbar_left = apply_filters('makae_gm_toolbar_left',
             '<li class="add_gizmo" data-text="Add mode"></li>
              <li class="edit_gizmo" data-text="Edit mode"></li>
              <li class="remove_gizmo" data-text="Remove mode"></li>');

    $toolbar_right = apply_filters('makae_gm_toolbar_right',
             '<li class="map_config"></li><li class="edit_map"></li>');

    echo apply_filters('makae_gm_pre_wrapper', '');
    echo '<div class="mgm_wrapper">';
    echo apply_filters('makae_gm_pre_toolbar', '');
    echo apply_filters('makae_gm_toolbar_wrapper',
          '<div class="mgm_toolbar_wrapper light-shadow-bottom">
            <ul class="mgm_toolbar left">' .
             $toolbar_left .
           '</ul>
            <ul class="mgm_toolbar right">' .
             $toolbar_right .
            '</ul>
          </div>');
    echo '<div class="mgm_edit_wrapper">
            <div class="mgm_edit light-shadow-bottom">';
    echo apply_filters('makae_gm_map_form','
            <div class="row map_form mgm_form">
              <span class="close">X</span>
              <div class="row">
                <div class="col col_12_12 title">Edit Map</div>
              </div>
              <div class="row map_form_content">
                 {%MAP_SEPECIFIC%}
              </div>
              <div class="col col_12_12 actions">
                <div class="button button-secondary cancel">Cancel</div>
                <div class="button button-primary save clearfix">Save</div>
              </div>
            </div>');
    echo apply_filters('makae_gm_gizmo_form','
            <div class="row gizmo_form mgm_form">
              <span class="close">X</span>
              <div class="row">
                <div class="col col_12_12 title">Edit Gizmo</div>
              </div>
              <div class="row">
                <div class="col col_6_12 left generic">
                  {%MARKER TYPE SPECIFIC%}
                </div>
                <div class="col col_6_12 right specific">
                  {%CONTENT SPECIFIC%}
                </div>
              </div>
              <div class="col col_12_12 actions">
                <div class="button button-secondary cancel">Cancel</div>
                <div class="button button-primary save clearfix">Save</div>
              </div>
            </div>');
    echo apply_filters('makae_gm_config_form','
            <div class="row config_form mgm_form">
              <span class="close">X</span>
              <div class="row">
                <div class="col col_12_12 title">Edit Default Configuration</div>
              </div>
              <div class="row config_form_content">
              </div>
              <div class="col col_12_12 actions">
                <div class="button button-secondary cancel">Cancel</div>
                <div class="button button-primary save clearfix">Save</div>
              </div>
            </div>');
    echo '</div>
        </div>';
    echo apply_filters('makae_gm_pre_map', '');
    echo '<div class="mgm_map" data-map="' . $map_data . '"></div>';
    echo apply_filters('makae_gm_pre_map', '');
    echo '</div>';
  }
}