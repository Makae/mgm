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
  protected $plugin_admin;
  protected $plugin_public;

  protected $enqueued_scripts = array();
  protected $enqueued_styles = array();

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

    require_once plugin_dir_path(__FILE__) . '/class-makae-gm-utilities.php';
    require_once Makae_GM_Utilities::pluginDir(__FILE__) . 'includes/class-makae-gm-loader.php';
    require_once Makae_GM_Utilities::pluginDir(__FILE__) . 'includes/class-makae-gm-i18n.php';
    require_once Makae_GM_Utilities::pluginDir(__FILE__) . 'admin/class-makae-gm-admin.php';
    require_once Makae_GM_Utilities::pluginDir(__FILE__) . 'public/class-makae-gm-public.php';

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

    if(isset($map_meta['_mgm_map_data'])) {
      $map = json_decode(stripslashes($map_meta['_mgm_map_data']), true);
      $map['map'] = Makae_GM_Utilities::array_extend_recursively($map['map'], $this->get_defaults('map-config'));
      $map['map']['defaults'] = Makae_GM_Utilities::array_extend_recursively($map['map']['defaults'], $this->get_defaults('defaults'));
    } else {
      $map_config = $this->get_defaults('map-config');
      $map_config['defaults'] = $this->get_defaults('defaults');
      $map = array(
        'map' => $map_config,
        'gizmos' => $this->get_defaults('map-gizmos')
      );
    }

    $map['id'] = $map_post->ID;

    return apply_filters('makae-gm-map-config', $map);
  }

  public function render_map($post_id) {
    $map_data = htmlspecialchars(json_encode($this->getMap($post_id)));
    if(is_admin())
      makae_gm_render_admin_map($map_data);
    else {
      makae_gm_render_map($map_data);
    }
  }

  private function set_locale() {
    $plugin_i18n = new Makae_GM_i18n();
    $plugin_i18n->set_domain($this->get_plugin_name());
    $this->loader->add_action('plugins_loaded', $plugin_i18n, 'load_plugin_textdomain');

  }

  public function plugins_loaded() {
    do_action('makae_gm_enqueue');
    include_once Makae_GM_Utilities::pluginDir(__FILE__) . 'config.php';


    $this->init();
    if(is_admin())
      require_once Makae_GM_Utilities::pluginDir(__FILE__) . 'admin/partials/makae-gm-admin-display.php';
    require_once Makae_GM_Utilities::pluginDir(__FILE__) . 'public/partials/makae-gm-public-display.php';
  }

  private function init() {
  }

  private function define_general_hooks () {
    $this->loader->add_action('plugins_loaded', $this, 'plugins_loaded');
    $this->loader->add_action('wp_enqueue_scripts', $this, 'enqueue_scripts', 50);
    $this->loader->add_action('wp_enqueue_scripts', $this, 'enqueue_styles', 50);
    $this->loader->add_action('admin_enqueue_scripts', $this, 'enqueue_scripts', 50);
    $this->loader->add_action('admin_enqueue_scripts', $this, 'enqueue_styles', 50);
  }

  private function define_admin_hooks() {
    $this->plugin_admin = new Makae_GM_Admin($this, $this->get_plugin_name(), $this->get_version());

    $this->loader->add_action('init', $this->plugin_admin, 'register_post_types');
    $this->loader->add_action('add_meta_boxes', $this->plugin_admin, 'add_meta_boxes');
    $this->loader->add_action('save_post', $this->plugin_admin, 'save_meta_box');

    $this->loader->add_action('admin_enqueue_scripts', $this->plugin_admin, 'enqueue_styles');
    $this->loader->add_action('admin_enqueue_scripts', $this->plugin_admin, 'enqueue_scripts');
    $this->loader->add_action('admin_enqueue_scripts', $this->plugin_admin, 'wp_localize_scripts', 100);
    $this->loader->add_filter('admin_menu', $this->plugin_admin, 'register_menu');
    $this->loader->add_filter('upload_mimes', $this, 'cc_mime_types');
    $this->loader->add_filter('posts_where', $this->plugin_admin, 'post_like_name', 10, 2);

    $this->loader->add_action('wp_ajax_makae_gm_get_posts', $this->plugin_admin,'ajax_get_posts');
    $this->loader->add_action('wp_ajax_makae_gm_get_post_name', $this->plugin_admin,'ajax_get_post_name');
  }

  private function define_public_hooks() {
    $this->plugin_public = new Makae_GM_Public($this, $this->get_plugin_name(), $this->get_version());
    $this->loader->add_action('wp_enqueue_scripts', $this->plugin_public, 'enqueue_styles', 50);
    $this->loader->add_action('wp_enqueue_scripts', $this->plugin_public, 'enqueue_scripts', 50);
    $this->loader->add_filter('template_include', $this->plugin_public, 'wp_template_map', 1);
    $this->loader->add_action('wp_ajax_mgm_gm_get_post_content', $this->plugin_public,'ajax_get_post');
    $this->loader->add_action('wp_ajax_nopriv_mgm_gm_get_post_content', $this->plugin_public,'ajax_get_post');
    add_shortcode('makae-googlemaps-map', array($this->plugin_public, 'shortcode_map'));
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
        return apply_filters('makae-gm-map-config-default',
          array(
            'type' => 'standard',
            'lat' => 40.712216,
            'lng' => -74.22655,
            'zoom' => 12,
            'disableDefaultUI' => true
          )
        );
      break;

      case 'map-gizmos':
        return apply_filters('makae-gm-map-gizmos-default', array('marker' => array(), 'polygon' => array()));
      break;

      case 'defaults':
        $marker = defined('MAKAE_GM_DEFAULTS_MARKER') ? unserialize(MAKAE_GM_DEFAULTS_MARKER) : array();
        $polygon = defined('MAKAE_GM_DEFAULTS_POLYGON') ? unserialize(MAKAE_GM_DEFAULTS_POLYGON) : array();
        return apply_filters('makae-gm-gizmo-defaults', array('marker' => $marker, 'polygon' => $polygon));
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
    wp_enqueue_style('makae-gm-core', Makae_GM_Utilities::pluginUrl(__FILE__, 'general/css/mgm-core.css'), array(), $this->version, 'all');

    if(array_key_exists('makae-map', $_REQUEST))
      wp_enqueue_style('makae-gm-single', Makae_GM_Utilities::pluginUrl(__FILE__, 'general/css/mgm-single.css'), array(), $this->version, 'all');
  }

  public function enqueue_scripts() {
    wp_enqueue_script('jquery');
    wp_enqueue_script('google-maps-drawing', $this->get_google_maps_url(), array('jquery'), $this->version, true);
    wp_enqueue_script('makae-gm-core', Makae_GM_Utilities::pluginUrl(__FILE__, 'general/js/mgm-core.js'), array('jquery', 'google-maps-drawing'), $this->version, true);
  }

  public function enqueue_content_provider_style($style_name, $path, $dependencies=array(), $version='0.1') {
    $this->enqueued_styles[] = array('name' => $style_name, 'path' => $path, 'dependencies' => $dependencies, 'version' => $version);
  }

  public function enqueue_content_provider_script($script_name, $path, $dependencies=array()) {
    $this->enqueued_scripts[] = array('name' => $script_name, 'path' => $path, 'dependencies' => $dependencies, 'version' => $version);
  }

  public function get_enqueued_styles() {
    return $this->enqueued_styles;
  }

  public function get_enqueued_scripts() {
    return $this->enqueued_scripts;
  }

  public function cc_mime_types($mimes) {
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
  }

}