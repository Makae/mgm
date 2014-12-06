<?php

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the dashboard.
 *
 * @link       http://TBD.com
 * @since      1.0.0
 *
 * @package    Makae_GM
 * @subpackage Makae_GM/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, dashboard-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Makae_GM
 * @subpackage Makae_GM/includes
 * @author     Martin Käser <makae90@gmail.com>
 */
class Makae_GM {

  protected $loader;
  protected $plugin_name;
  protected $version;

  public function __construct() {

    $this->plugin_name = 'makae-gm';
    $this->version = '1.0.0';

    $this->load_dependencies();
    $this->set_locale();
    $this->define_general_hooks();
    $this->define_admin_hooks();
    $this->define_public_hooks();

  }

  private function load_dependencies() {

    require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-makae-gm-utilities.php';
    require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-makae-gm-loader.php';
    require_once plugin_dir_path(dirname(__FILE__)) . 'includes/class-makae-gm-i18n.php';
    require_once plugin_dir_path(dirname(__FILE__)) . 'admin/class-makae-gm-admin.php';
    require_once plugin_dir_path(dirname(__FILE__)) . 'public/class-makae-gm-public.php';

    $this->loader = new Makae_GM_Loader();
  }

  public function getMap($post_id) {
    $map_post = get_post($post_id);
    $map_meta = Makae_GM_Utilities::flatten(get_post_meta($post_id));

    $args = array(
      'post_parent' => $post_id,
      'post_type' => 'makae-map-gizmo',
      'posts_per_page' => -1,
      'post_status' => 'publish'
    );

    $map = Makae_GM_Utilities::get(
      $map_meta['makae-gm-map'],
      array(
        'map'=> $this->get_defaults('map-config'),
        'gizmos'=> $this->get_defaults('map-gizmos')
      )
    );
    $map['id'] = $map_post->ID;

    return apply_filters('makae-gm-map-config', $map);
  }

  public function render_map($post_id) {
    $map_data = htmlspecialchars(json_encode($this->getMap($post_id)));
    if(is_admin())
      makae_gm_render_admin_map($map_data);
    else
      makae_gm_render_map($map_data);
  }

  private function set_locale() {
    $plugin_i18n = new Makae_GM_i18n();
    $plugin_i18n->set_domain($this->get_plugin_name());
    $this->loader->add_action('plugins_loaded', $plugin_i18n, 'load_plugin_textdomain');

  }

  public function load_render_methods() {
    error_reporting(E_ALL);
    ini_set("display_errors", 1);

    if(is_admin())
      require_once plugin_dir_path(dirname(__FILE__)) . 'admin/partials/makae-gm-admin-display.php';
    require_once plugin_dir_path(dirname(__FILE__)) . 'public/partials/makae-gm-public-display.php';
  }

  private function define_general_hooks () {
    $this->loader->add_action('plugins_loaded', $this, 'load_render_methods');
    $this->loader->add_action('wp_enqueue_scripts', $this, 'enqueue_scripts');
    $this->loader->add_action('wp_enqueue_scripts', $this, 'enqueue_styles');
    $this->loader->add_action('admin_enqueue_scripts', $this, 'enqueue_scripts');
    $this->loader->add_action('admin_enqueue_scripts', $this, 'enqueue_styles');
  }

  private function define_admin_hooks() {
    $plugin_admin = new Makae_GM_Admin($this, $this->get_plugin_name(), $this->get_version());

    $this->loader->add_action('init', $plugin_admin, 'register_post_types');
    $this->loader->add_action('add_meta_boxes', $plugin_admin, 'add_meta_boxes');

    $this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_styles');
    $this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts');


  }

  private function define_public_hooks() {

    $plugin_public = new Makae_GM_Public($this, $this->get_plugin_name(), $this->get_version());
    $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_styles');
    $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_scripts');

  }

  public function run() {
    $this->loader->run();
  }

  public function get_plugin_name() {
    return $this->plugin_name;
  }


  public function get_loader() {
    return $this->loader;
  }

  public function get_version() {
    return $this->version;
  }

  public function get_defaults($key) {
    switch($key) {
      case 'map-config':
        return apply_filters('makae-gm-default-map-config',
          array(
            'type' => 'standard',
            'lat' => 40.712216,
            'lng' => -74.22655,
            'zoom' => 12
          )
        );
      break;

      case 'map-gizmos':
        return apply_filters('makae-gm-default-map-gizmos', array());
      break;

      default:
        return null;
        break;
    }
  }

  private function get_google_maps_url() {
    // Todo make the api-key configurable
    return MAKAE_GM_GMAPS_LIBRARY;
  }

  public function enqueue_styles() {
    wp_enqueue_style('makae-gm-core', Makae_GM_Utilities::pluginUrl( __FILE__, 'general/css/mgm-core.css'), array(), $this->version, 'all');
  }

  public function enqueue_scripts() {
    wp_enqueue_script('jquery');
    wp_enqueue_script('google-maps-drawing', $this->get_google_maps_url(), array('jquery'), $this->version, true);
    wp_enqueue_script('makae-gm-core', Makae_GM_Utilities::pluginUrl( __FILE__, 'general/js/mgm-core.js'), array('jquery'), $this->version, true);
  }

}