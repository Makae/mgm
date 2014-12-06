<?php

/**
 * General utility methods
 *
 * @link       http://TBD.com
 * @since      1.0.0
 *
 * @package    Makae_GM
 * @subpackage Makae_GM/includes
 */

/**
 * Register all actions and filters for the plugin.
 *
 * General utility methods
 * @package    Makae_GM
 * @subpackage Makae_GM/includes
 * @author     Martin Käser <makae90@gmail.com>
 */
class Makae_GM_Utilities {
  /**
   * Flattens an array, useful for meta-data assoc arrays,
   * if multiple value are associated to a key the associated value is not flattened
   * @var Array
   */
  public static function flatten($array) {
    foreach($array as $key => $value)
      if(is_array($value) && count($value) == 1)
        $array[$key] = $value[0];

    return $array;
  }

  public static function pluginDir($file,  $suffix='') {
    return WP_PLUGIN_DIR . '/' . self::pluginFolder($file) . '/' . $suffix;
  }

  public static function pluginUrl($file, $suffix='') {
    return WP_PLUGIN_URL. '/' . self::pluginFolder($file) . '/' . $suffix;
  }

  public static function pluginFolder($file) {
    $dir =  dirname(plugin_basename($file));
    $dirs = explode('/', $dir);
    return $dirs[0];
  }

  public static function get(&$var, $default=null) {
    return isset($var) ? $var : $default;
  }

}
