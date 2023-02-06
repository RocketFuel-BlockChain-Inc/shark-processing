<?php
/**
 * Plugin Name: Shark Processing Payment Gateway
 * Domain Path: /Languages/
 * Plugin URI: https://sharkprocessing.com/
 * Description: Pay with crypto using Shark_Processing
 * Author: Sharkprocessing Team
 * Author URI: https://sharkprocessing.com/integrations
 * Version: 3.2.1.22
 * WC requires at least: 3.0.0
 * WC tested up to: 6.1
 * Text Domain: sharkprocessing-payment-gateway
 * Licence: GPLv3
 * 
 * @package Sharkprocessing
 */

use Shark_Processing_Gateway\Controllers\Shark_Processing_Gateway_Subscription_Controller;
use Shark_Processing_Gateway\Plugin;
use Shark_Processing_Gateway\Services\Subscription_Service;

if ( ! defined( 'ABSPATH' ) ) {
    die( 'A cup does not drink what it holds?' );
}

if ( shark_processing_check_woocommerce_is_active() ) {
    define( 'SHARK_PROCESSING_VER', '3.2.1.22' );
    
    require_once plugin_dir_path( __FILE__ ) . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
    Plugin::init( __FILE__ );
} else {
    add_action( 'admin_notices', 'shark_processing_check_woocommerce_is_not_active_notice' );
}

/**
 * Display a notice if WooCommerce is not installed
 */
function shark_processing_check_woocommerce_is_not_active_notice() {
    echo '<div class="error"><p><strong>' . sprintf( __( 'Shark_Processing requires WooCommerce to be installed and active. Click %s to install WooCommerce.', 'shark_processing-payment-gateway' ), '<a href="' . esc_url( admin_url('plugin-install.php?tab=plugin-information&plugin=woocommerce&TB_iframe=true&width=772&height=539' ) ) . '" class="thickbox open-plugin-details-modal">here</a>' ) . '</strong></p></div>';
}
/**
 * Check if Woocommerce is active
 */
function shark_processing_check_woocommerce_is_active(){
    if ( in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ), true ) ) {
        return true;
    }
    return false;
}

