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
  const METHOD_SCRIPTS = 'wp_enqueue_script';
  const METHOD_STYLES = 'wp_enqueue_style';
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

  public static function jsonResponse($content, $error=false) {
    $response = array(
      'content' => $content
    );
    if($error !== false)
      $response['error'] = $error;
    header('Content-Type: text/json; charset=UTF-8');
    die(json_encode($response));

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

  public static function array_extend_recursively($main, $extend) {
    if(!is_array($extend)) {
      if(isset($main))
        return $main;
      return $extend;
    }

    foreach($extend as $key => $value) {
      if(array_key_exists($key, $main)) {
        $main[$key] = static::array_extend_recursively($main[$key], $value);
        continue;
      } else {
        $main[$key] = $value;
      }
    }
    return $main;
  }

  public static function get(&$var, $default=null) {
    return isset($var) ? $var : $default;
  }

  public static function enqueue_dependent_scripts($scripts, $dependencies,  $in_footer=true) {
    return static::enqueue_dependent_files($scripts, $dependencies, Makae_GM_Utilities::METHOD_SCRIPTS, $in_footer);
  }

  public static function enqueue_dependent_styles($scripts, $dependencies, $media='all') {
    return static::enqueue_dependent_files($scripts, $dependencies, Makae_GM_Utilities::METHOD_STYLES, $media);
  }

  public static function enqueue_dependent_files($files, $dependencies, $method, $last_arg) {
    $appended_files = array();
    foreach($files as $data) {
      $data['dependencies'] = array_merge($data['dependencies'], $dependencies);
      $args = array($data['name'], $data['path'], $data['dependencies'], $data['version'], $last_arg);
      call_user_func_array($method, $args);
      $appended_files[] = $data['name'];
    }
    return $appended_files;
  }

}
