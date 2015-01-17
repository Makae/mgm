<?php
@define('MAKAE_GM_GMAPS_LIBRARY', 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBI6EAL6H3ndMb5YvNP6-qH-D6WivdTh7s&libraries=drawing');
@define('MAKAE_GM_DEFAULTS_MARKER', serialize(array(
  //'icon' => plugin_dir_url(__FILE__) . '/general/images/marker.png'
)));

@define('MAKAE_GM_DEFAULTS_POLYGON', serialize(array(
  'strokeColor'   => '#ff0000',
  'strokeOpacity' => '0.8',
  'strokeWeight'  => '2',
  'fillColor'     => '#0074A2',
  'fillOpacity'   => '0.5'
)));