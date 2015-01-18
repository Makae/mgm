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
     $attrs = shortcode_atts( array(
        'mapid' => null,
    ), $attrs);

    if($attrs['mapid'] == null)
      return "<h3>No Mapdata found</h3>";
    ob_start();
    $this->plugin_core->render_map($attrs['mapid']);
    return ob_get_clean();

  }

  public function enqueue_styles() {
    wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/makae-gm-public.css', array(), $this->version, 'all' );
  }

  public function enqueue_scripts() {
    wp_enqueue_script($this->plugin_name . '_content', plugin_dir_url(__FILE__) . 'js/mgm-content.js', array('makae-gm-core'), $this->version, true);
    wp_enqueue_script($this->plugin_name . '_init', Makae_GM_Utilities::pluginURL(__FILE__, 'general/js/mgm-init.js'), array($this->plugin_name . '_content'), $this->version, true);

  }

}