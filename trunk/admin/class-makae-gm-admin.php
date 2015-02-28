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
      'publicly_queryable' => true,
      'show_ui'            => true,
      'show_in_menu'       => true,
      'exclude_from_search'=> true,
      'query_var'          => true,
      'rewrite'            => array('slug' => 'makae-map', 'with_front' => false),
      'capability_type'    => 'post',
      'has_archive'        => true,
      'hierarchical'       => true,
      'menu_position'      => 62,
      'supports'           => array('title'),
      'menu_icon'          => 'dashicons-admin-site'
    );

    register_post_type('makae-map', $args);

    $labels = array(
      'name'               => _x('Map content', 'post type general name', 'makae-gm'),
      'singular_name'      => _x('Map content', 'post type singular name', 'makae-gm'),
      'menu_name'          => _x('Map content', 'admin menu', 'makae-gm'),
      'name_admin_bar'     => _x('Map content', 'add new on admin bar', 'makae-gm'),
      'add_new'            => _x('New map content', 'map', 'makae-gm'),
      'add_new_item'       => __('Create new map content', 'makae-gm'),
      'new_item'           => __('New map content', 'makae-gm'),
      'edit_item'          => __('Edit map content', 'makae-gm'),
      'view_item'          => __('View map content', 'makae-gm'),
      'all_items'          => __('All map content', 'makae-gm'),
      'search_items'       => __('Search map content', 'makae-gm'),
      'parent_item_colon'  => __('Parent map content:', 'makae-gm'),
      'not_found'          => __('No map content found.', 'makae-gm'),
      'not_found_in_trash' => __('No map content found in Trash.', 'makae-gm')
    );

    $args = array(
      'labels'             => $labels,
      'public'             => true,
      'publicly_queryable' => true,
      'show_ui'            => true,
      'show_in_menu'       => false,
      'exclude_from_search'=> true,
      'query_var'          => true,
      'rewrite'            => array('slug' => 'makae-map-content-post', 'with_front' => false),
      'capability_type'    => 'post',
      'has_archive'        => true,
      'hierarchical'       => true,
      'menu_position'      => 64,
      'supports'           => array('title', 'editor'),
      'menu_icon'          => 'dashicons-media-text'
    );
    register_post_type('makae-map-content', $args);

    // /* POST TYPE MAKAE-GIZMO */
    // $labels = array(
    //   'name'               => _x('Map gizmos', 'post type general name', 'makae-gm'),
    //   'singular_name'      => _x('Map gizmo', 'post type singular name', 'makae-gm'),
    //   'menu_name'          => _x('Map gizmos', 'admin menu', 'makae-gm'),
    //   'name_admin_bar'     => _x('Map gizmo', 'add new on admin bar', 'makae-gm'),
    //   'add_new'            => _x('Create map gizmo', 'gizmo', 'makae-gm'),
    //   'add_new_item'       => __('Create new map gizmo', 'makae-gm'),
    //   'new_item'           => __('New map gizmo', 'makae-gm'),
    //   'edit_item'          => __('Edit map gizmo', 'makae-gm'),
    //   'view_item'          => __('View map gizmo', 'makae-gm'),
    //   'all_items'          => __('All map gizmos', 'makae-gm'),
    //   'search_items'       => __('Search map gizmos', 'makae-gm'),
    //   'parent_item_colon'  => __('Parent map gizmos:', 'makae-gm'),
    //   'not_found'          => __('No map gizmos found.', 'makae-gm'),
    //   'not_found_in_trash' => __('No map gizmos found in Trash.', 'makae-gm')
    // );

    // $args = array(
    //   'labels'             => $labels,
    //   'public'             => false,
    //   'publicly_queryable' => false,
    //   'show_ui'            => false,
    //   'show_in_menu'       => false,
    //   'exclude_from_search'=> true,
    //   'query_var'          => true,
    //   'rewrite'            => array('slug' => 'mytype', 'with_front' => false),
    //   'capability_type'    => 'post',
    //   'hierarchical'       => false,
    //   'supports'           => array('title')
    // );

    // register_post_type('makae-map-gizmo', $args);
  }

  public function register_menu() {
    add_submenu_page('edit.php?post_type=makae-map',
      _x('Map content', 'post type general name', 'makae-gm'),
      _x('Map content', 'post type general name', 'makae-gm'),
      'edit_post',
      'edit.php?post_type=makae-map-content');
  }

  public function enqueue_styles() {
    // Color picker
    wp_enqueue_style('wp-color-picker');

    wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/makae-gm-admin.css', array('wp-color-picker'), $this->version, 'all');
    wp_enqueue_style('jquery-autocomplete', plugin_dir_url(__FILE__) . 'js/libs/jquery-autocomplete/jquery-ui.min.css', array(), $this->version, 'all');
    wp_enqueue_style('mgm-jquery-autocomplete', plugin_dir_url(__FILE__) . 'css/jquery.autocomplete.custom.css', array('jquery-autocomplete'), $this->version, 'all');

    foreach($this->plugin_core->get_enqueued_styles() as $data) {
      $data['dependencies'] = array_merge($data['dependencies'], array($this->plugin_name));
      wp_enqueue_style($data['name'], $data['path'], $data['dependencies'], $data['version']);
    }

  }

  public function enqueue_scripts() {
    if(get_post_type() == 'makae-map') {
      // Is used for Image-upload
      wp_enqueue_media();
    }

    wp_enqueue_script('makae-gm-admin', plugin_dir_url(__FILE__) . 'js/mgm-admin.js', array('wp-color-picker', 'makae-gm-core'), $this->version, true);
    wp_enqueue_script('jQuery-autocomplete', plugin_dir_url(__FILE__) . 'js/libs/jquery-autocomplete/jquery-ui-custom-autocomplete-min.js', array('jquery'), $this->version, true);
    wp_enqueue_script($this->plugin_name, plugin_dir_url(__FILE__) . 'js/makae-gm-admin.js', array('makae-gm-admin'), $this->version, true);

    $dependency_core = array($this->plugin_name);
    wp_enqueue_script($this->plugin_name . '_gizmos', plugin_dir_url(__FILE__) . 'js/mgm-gizmos.js', $dependency_core, $this->version, true);
    wp_enqueue_script($this->plugin_name . '_content', plugin_dir_url(__FILE__) . 'js/mgm-content.js', $dependency_core, $this->version, true);

    $init_dependencies = array($this->plugin_name . '_gizmos', $this->plugin_name . '_content');

    $appended_scripts = Makae_GM_Utilities::enqueue_dependent_scripts($this->plugin_core->get_enqueued_scripts(), $dependency_core);
    $init_dependencies = array_merge($init_dependencies, $appended_scripts);

    wp_enqueue_script($this->plugin_name . '_init', Makae_GM_Utilities::pluginURL(__FILE__, 'general/js/mgm-init.js'), $init_dependencies, $this->version, true);
  }

  public function wp_localize_scripts() {
    $config = array(
      'ajax_url' => admin_url('admin-ajax.php'),
      'cp_posts' => array(
        'ajax_params' =>
          array(
            'ac' => array('action' => 'makae_gm_get_posts', 'post_type' => 'makae-map-content'),
            'post_id' => array('action' => 'makae_gm_get_post_name')
          )
      )
    );
    wp_localize_script($this->plugin_name . '_content', 'makae_gm_content_config', $config);
  }

  /**
   * Adds an additional filter value "_name__like"
   *
   * @from: http://wordpress.stackexchange.com/questions/136714/wp-query-get-posts-by-category-and-similar-name-like
   */
  public function post_like_name($where, $q) {
    if($name__like = $q->get('_name__like')) {
      global $wpdb;
      $where .= $wpdb->prepare(" AND LOWER({$wpdb->posts}.post_name) LIKE %s ", preg_replace("/\*+/", '%', $wpdb->esc_like( $name__like)));
    }
    return $where;
  }

  public function ajax_get_post_name() {
    $post_id = array_key_exists('post_id', $_REQUEST) ? $_REQUEST['post_id'] : false;
    if(!$post_id)
      Makae_GM_Utilities::jsonResponse('', __('No PostID provided', 'makae-gm'));

    Makae_GM_Utilities::jsonResponse($this->_post_ac_name(get_post($post_id)));
  }

  public function ajax_get_posts() {
    error_reporting(E_ALL);
    ini_set("display_errors", 1);

    $post_type = array_key_exists('post_type', $_REQUEST) ? $_REQUEST['post_type'] : 'makae-map-content';
    $term = array_key_exists('term', $_REQUEST) ? $_REQUEST['term'] : false;
    if(!$term)
      die("No term provided");

    $args = array(
      'posts_per_page'   => 6,
      'offset'           => 0,
      'orderby'          => 'post_name',
      'order'            => 'ASC',
      'include'          => '',
      'post_type'        => $post_type,
      'post_status'      => 'publish',
      '_name__like'      => '*' . $term . '*',
      'suppress_filters' => false
    );

    $content = array();
    $posts = get_posts($args);
    foreach($posts as $key => $post)
      $content[] = $this->_post_ac_name($post);

    $response = array(
      'content' => $content
    );
    echo json_encode($response);
    die();
  }

  private function _post_ac_name($post) {
    return apply_filters('makae_gm_post_ac_name', "[{$post->ID}] {$post->post_name}", $post);
  }

}
