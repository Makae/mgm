<?php

/**
 * The dashboard-specific functionality of the plugin.
 *
 * @link       http://TBD.com
 * @since      1.0.0
 *
 * @package    Makae_GM
 * @subpackage Makae_GM/admin
 */

/**
 * The dashboard-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the dashboard-specific stylesheet and JavaScript.
 *
 * @package    Makae_GM
 * @subpackage Makae_GM/admin
 * @author     Martin Käser <makae90@gmail.com>
 */
class Makae_GM_Admin {
  private $plugin_core;
  private $plugin_name;
  private $version;

  public function __construct($plugin_core, $plugin_name, $version) {
    $this->plugin_core = $plugin_core;
    $this->plugin_name = $plugin_name;
    $this->version = $version;

  }

  public function add_meta_boxes() {
    add_meta_box(
      'makae_map',
      __('Map', 'makae-gm'),
      array($this, 'render_meta_box'),
      'makae-map',
      'normal',
      'high'
    );
  }

  public function render_meta_box($post) {
      wp_nonce_field('makae_map', 'makae_map_nonce');
      echo '<input type="hidden" name="mgm_map_data" value="" />';
      $this->plugin_core->render_map($post->ID);
  }

  public function save_meta_box() {
    global $post_id;

    if(!isset( $_POST['makae_map_nonce']))
      return;

    if(!wp_verify_nonce($_POST['makae_map_nonce'], 'makae_map'))
      return;

    if(defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
      return;

    // Check the user's permissions.
    if(isset($_POST['post_type']) && 'makae-map' == $_POST['post_type'])
      if(!current_user_can('edit_page', $post_id))
        return;
    else
      if(!current_user_can('edit_post', $post_id))
        return;

    if(!isset($_POST['mgm_map_data']))
      return;

    $map_data = $_POST['mgm_map_data'];

    // Update Map data in map-post
    update_post_meta($post_id, '_mgm_map_data', $map_data);

    // Create / Update gizmos relevant gizmo-posts
  }

  public function register_post_types() {
    /* POST TYPE MAKAE-MAP */
    $labels = array(
      'name'               => _x('Maps', 'post type general name', 'makae-gm'),
      'singular_name'      => _x('Map', 'post type singular name', 'makae-gm'),
      'menu_name'          => _x('Maps', 'admin menu', 'makae-gm'),
      'name_admin_bar'     => _x('Map', 'add new on admin bar', 'makae-gm'),
      'add_new'            => _x('Create map', 'map', 'makae-gm'),
      'add_new_item'       => __('Create new map', 'makae-gm'),
      'new_item'           => __('New map', 'makae-gm'),
      'edit_item'          => __('Edit map', 'makae-gm'),
      'view_item'          => __('View map', 'makae-gm'),
      'all_items'          => __('All maps', 'makae-gm'),
      'search_items'       => __('Search maps', 'makae-gm'),
      'parent_item_colon'  => __('Parent maps:', 'makae-gm'),
      'not_found'          => __('No map found.', 'makae-gm'),
      'not_found_in_trash' => __('No map found in Trash.', 'makae-gm')
    );

    $args = array(
      'labels'             => $labels,
      'public'             => true,
      'publicly_queryable' => false,
      'show_ui'            => true,
      'show_in_menu'       => true,
      'exclude_from_search'=> true,
      'query_var'          => true,
      'rewrite'            => array('slug' => 'makae-map'),
      'capability_type'    => 'post',
      'has_archive'        => true,
      'hierarchical'       => true,
      'menu_position'      => 62,
      'supports'           => array('title'),
      'menu_icon'          => 'dashicons-admin-site'
    );

    register_post_type('makae-map', $args);

    /* POST TYPE MAKAE-GIZMO */
    $labels = array(
      'name'               => _x('Map gizmos', 'post type general name', 'makae-gm'),
      'singular_name'      => _x('Map gizmo', 'post type singular name', 'makae-gm'),
      'menu_name'          => _x('Map gizmos', 'admin menu', 'makae-gm'),
      'name_admin_bar'     => _x('Map gizmo', 'add new on admin bar', 'makae-gm'),
      'add_new'            => _x('Create map gizmo', 'gizmo', 'makae-gm'),
      'add_new_item'       => __('Create new map gizmo', 'makae-gm'),
      'new_item'           => __('New map gizmo', 'makae-gm'),
      'edit_item'          => __('Edit map gizmo', 'makae-gm'),
      'view_item'          => __('View map gizmo', 'makae-gm'),
      'all_items'          => __('All map gizmos', 'makae-gm'),
      'search_items'       => __('Search map gizmos', 'makae-gm'),
      'parent_item_colon'  => __('Parent map gizmos:', 'makae-gm'),
      'not_found'          => __('No map gizmos found.', 'makae-gm'),
      'not_found_in_trash' => __('No map gizmos found in Trash.', 'makae-gm')
    );

    $args = array(
      'labels'             => $labels,
      'public'             => false,
      'publicly_queryable' => false,
      'show_ui'            => false,
      'show_in_menu'       => false,
      'exclude_from_search'=> true,
      'query_var'          => true,
      'rewrite'            => array('slug' => 'makae-map-gizmo-type'),
      'capability_type'    => 'post',
      'hierarchical'       => false,
      'supports'           => array('title')
    );

    register_post_type('makae-map-gizmo', $args);
  }

  public function enqueue_styles() {
    wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/makae-gm-admin.css', array(), $this->version, 'all');
  }

  public function enqueue_scripts() {
    if(get_post_type() == 'makae-map')
      wp_enqueue_media();
    wp_enqueue_script('makae-gm-admin', plugin_dir_url(__FILE__) . 'js/mgm-admin.js', array('makae-gm-core'), $this->version, true);
    wp_enqueue_script($this->plugin_name, plugin_dir_url(__FILE__) . 'js/makae-gm-admin.js', array('makae-gm-admin'), $this->version, true);
    wp_enqueue_script($this->plugin_name . '_gizmos', plugin_dir_url(__FILE__) . 'js/mgm-gizmos.js', array($this->plugin_name), $this->version, true);
    wp_enqueue_script($this->plugin_name . '_content', plugin_dir_url(__FILE__) . 'js/mgm-content.js', array($this->plugin_name), $this->version, true);
  }

}
