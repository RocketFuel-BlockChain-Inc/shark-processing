(function ($, window, document) {
    'use strict';
    $(document).ready(() => {

        let cacheDefaultPlaceOrder, count = 0;
        const SH_PR_SELECTOR = '#shark_processing_retrigger_payment_button';

        const intButn = setInterval(() => {

            try {
                if ($('#place_order') && $('#place_order').attr('style').includes('display:none') && !$(SH_PR_SELECTOR).attr('style')) {
                    console.log("Force click triggered")

                    $('form.checkout input.input-radio')[0]?.click(); //force click
                }


            } catch (error) {
                console.error("Could not trigger place order", error?.message);
            }
            if (count > 10) {

                // buttonChangeObserver.observe(
                //     document.querySelector('#place_order'),
                //     {attributes: true}
                // );
                console.log("SH_PR - clear btn check");

                clearInterval(intButn)
            }
            count++;
        }, 1000);
        // watch for 10secs

        $('form.checkout').on('click', 'input[name="payment_method"]', function () {

            var toggleSH_PR, toggleSubmit;

            var isSH_PRB = $(this).is('#payment_method_shark_processing_gateway');
            if (isSH_PRB) {
                toggleSH_PR = 'show'
                toggleSubmit = 'hide'
          
                document.querySelector("#place_order").style.setProperty('visibility', 'hidden', true ? 'important' : '');
            } else {
                toggleSH_PR = 'hide'
                toggleSubmit = 'show'
                document.querySelector("#place_order").style.removeProperty('visibility');

 
            }


            // if (isSH_PRB) {

            //     if (!cacheDefaultPlaceOrder) {
            //         cacheDefaultPlaceOrder = $('#place_order')
            //     }
            //     console.log({ cacheDefaultPlaceOrder });

            //     sp.append(cacheDefaultPlaceOrder.html());

            //     // sp.classList.add('shark_processing_wrapper_button');

            //     // $('#place_order').remove();//remove default


            //     .detach().appendTo
            //     console.log('custom', { isSH_PRB });

            // } else {
            //     if ($('.shark_processing_wrapper_button')) {
            //         $('.shark_processing_wrapper_button').remove();//remove built
            //     }
            //     if ($('#place_order').length === 0) {
            //         $(SH_PR_SELECTOR).parent().append(cacheDefaultPlaceOrder);
            //         console.log('default', { isSH_PRB });
            //     }

            // }

            $(SH_PR_SELECTOR).animate({
                opacity: toggleSH_PR,
                height: toggleSH_PR,
                padding: toggleSH_PR
            }, 230);
            $('#place_order').animate({
                opacity: toggleSubmit,
                height: toggleSubmit,
                padding: toggleSubmit
            }, 230);

        });

    })

})(jQuery, window, document);
