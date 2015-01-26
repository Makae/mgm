<?php

/**
 * @link              http://TBD.com
 * @since             1.0.0
 * @package           Makae_GM
 *
 * @wordpress-plugin
 * Plugin Name:       Makae Google Maps
 * Plugin URI:        http://TBD.com/MAKAE_GM/
 * Description:       The Makae Google Maps Plugin provides an easy and extendable google maps plugin
 * Version:           1.0.0
 * Author:            Martin Käser
 * Author URI:        http://TBD.com/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       makae-gm
 * Domain Path:       /languages
 */
// If this file is called directly, abort.
if(!defined('WPINC'))
  die;

function activate_makae_gm() {
  require_once plugin_dir_path( __FILE__ ) . 'includes/class-makae-gm-activator.php';
  Makae_GM_Activator::activate();
}


function deactivate_makae_gm() {
  require_once plugin_dir_path( __FILE__ ) . 'includes/class-makae-gm-deactivator.php';
  Makae_GM_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_makae_gm' );
register_deactivation_hook( __FILE__, 'deactivate_makae_gm' );


require plugin_dir_path( __FILE__ ) . 'includes/class-makae-gm.php';


function run_makae_gm() {
  $plugin = new Makae_GM();
  $GLOBALS['MAKAE_GM_CORE'] = $plugin;
  $plugin->run();
}
run_makae_gm();
