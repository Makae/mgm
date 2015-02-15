<?php
include_once('header-makae_map.php');

$id = array_key_exists('makae-map', $_REQUEST) ? $_REQUEST['makae-map'] : the_ID();
$matches = array();
preg_match('/(\d+)(-\d)/', $id, $matches);
echo do_shortcode('[makae-googlemaps-map mapid="' . $matches[1] . '" standalone="1"]');

wp_reset_query();

include_once('footer-makae_map.php');