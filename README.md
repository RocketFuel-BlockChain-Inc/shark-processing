# RocketFuel - RocketFuel Payment Method for Woocommerce
RocketFuel Payment Method 2.0.3 for Woocommerce
Requires at least: 5.5
Tested up to: 5.8.1
Stable tag: 2.1.5
License: GPLv3
License URI: https://www.gnu.org/licenses/gpl-3.0.html

# Install


* Go to your shop admin panel.
* Go to "Plugins" -> "Add Plugins".
* Click on "Upload Plugin" button and browse and select plugin zip file.
* After installation activate plugin.
* Enter "Merchant ID" (provided in RocketFuel merchant UI for registered merchants) in the Woocommerce payment tab.
* Enter "Public Key" (provided in RocketFuel).
* Copy a RocketFuel callback URL and save settings
* Go to your RocketFuel merchant account
* Click "Edit" in the bottom left corner. A window will pop up.
* Paste callback URL and click "Save".


# Changelog

2.0.1 Added overlay on checkout page.
2.0.2 Allow admin to set order status for payment confirmation
      Allow users to trigger iframe after closing
      Fixed iframe trigger button style. 
      Added return to checkout button on iframe trigger modal
      Fixed pending and on hold order issue
2.0.3 Changed title in readme
2.0.4 Fixed woocommerce thankyou page overlay styling for consistent display across theme.
2.0.5 Add transaction id to orders
	  Thankyou page overlay allows users to see order summary
2.1.5 Added Single Sign on