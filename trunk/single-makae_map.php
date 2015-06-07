  <?php
include_once('header-makae_map.php');
global $post;
echo do_shortcode('[makae-googlemaps-map mapid="' . $post->ID . '" standalone="1"]');

wp_reset_query();

include_once('footer-makae_map.php');