<?php
 /*Template Name: New Template
 */

get_header(); ?>
<div id="primary">
    <div id="content" role="main">
    <?= do_shortcode('[makae-googlemaps-map mapid="' . the_ID() . '"]') ?>
    </div>
</div>
<?php wp_reset_query(); ?>
<?php get_footer(); ?>