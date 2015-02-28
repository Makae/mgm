<?php

/**
 * The public-facing functionality of the plugin.
 *
 * @link       http://TBD.com
 * @since      1.0.0
 *
 * @package    Makae_GM
 * @subpackage Makae_GM/public
 */

/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the dashboard-specific stylesheet and JavaScript.
 *
 * @package    Makae_GM
 * @subpackage Makae_GM/public
 * @author     Martin Käser <makae90@gmail.com>
 */
class Makae_GM_Public {

  private $plugin_core;
  private $plugin_name;
  private $version;

  public function __construct($plugin_core, $plugin_name, $version) {
    $this->plugin_core = $plugin_core;
    $this->plugin_name = $plugin_name;
    $this->version = $version;

  }

  public function shortcode_map($attrs) {
     $attrs = shortcode_atts(array(
        'mapid' => null,
   ), $attrs);

    if($attrs['mapid'] == null)
      return "<h3>No Mapdata found</h3>";
    ob_start();
    $this->plugin_core->render_map($attrs['mapid']);
    return ob_get_clean();

  }

  public function ajax_get_post() {
    if(!array_key_exists('post_id', $_REQUEST))
      die(__('No PostId provided', 'makae-gm'));

    $post_id = $_REQUEST['post_id'];
    $post = get_post($post_id);
    if(!$post_status != 'publish')
      die(__('This post is not public', 'makae-gm'));
    Makae_GM_Utilities::jsonResponse($this->_format_post_response($post));
  }

  private function _format_post_response($post) {
    $html = "<h5>{$post->post_title}</h5>";
    $html .= "<div class=\"mgm_post_content\">{$post->post_content}</div>";
    return $html;
  }

  public function wp_template_map($template_path) {
    if(array_key_exists('makae-map', $_REQUEST)) {
      if($theme_file = locate_template(array('single-makae_map.php')))
        return $theme_file;
      return MAKAE_GM_PLUGIN_DIR . 'single-makae_map.php';
    }
    return $template_path;
  }

  public function enqueue_styles() {
    wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/makae-gm-public.css', array(), $this->version, 'all');
    $appended_styles = Makae_GM_Utilities::enqueue_dependent_styles($this->plugin_core->get_enqueued_styles(), array($this->plugin_name));
  }

  public function enqueue_scripts() {
    wp_enqueue_script('makae-cp-mapcontent', Makae_GM_Utilities::pluginUrl(__FILE__, 'public/js/mgm-cp-mapcontent.js'), array('jquery', 'google-maps-drawing'), $this->version, true);

    $config = array(
      'ajax_url' => admin_url('admin-ajax.php'),
      'ajax_params' => array('action' => 'mgm_gm_get_post_content')
    );
    wp_localize_script('makae-cp-mapcontent', 'makae_gm_post_provider', $config);
    $appended_scripts = Makae_GM_Utilities::enqueue_dependent_scripts($this->plugin_core->get_enqueued_scripts(), array());
    $init_dependencies = array_merge(array('makae-gm-core'), $appended_scripts);
    wp_enqueue_script($this->plugin_name . '_init', Makae_GM_Utilities::pluginURL(__FILE__, 'general/js/mgm-init.js'), $init_dependencies, $this->version, true);

  }

}