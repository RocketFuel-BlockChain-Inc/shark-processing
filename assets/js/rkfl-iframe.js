; (function ($, window, document) {
    'use strict';

    // if (document.getElementById('place_order'))
    //     document.getElementById('place_order').style.display = 'none';
    var selector = '#shark_processing_retrigger_payment_button';
    /**
     * Payment Engine object
     */
    var Shark_ProcessingPaymentEngine = {

        order_id: '',
        url: new URL(window.location.href),
        watchIframeShow: false,
        shark_processingConfig: null,
        encryptedReq: null,
        accessToken: '',
        paymentResponse: '',
        // Show error notice at top of checkout form, or else within button container
        showError: function (errorMessage, selector) {
            var $container = $('.woocommerce-notices-wrapper, form.checkout');

            if (!$container || !$container.length) {
                $(selector).prepend(errorMessage);
                return;
            } else {
                $container = $container.first();
            }

            // Adapted from https://github.com/woocommerce/woocommerce/blob/ea9aa8cd59c9fa735460abf0ebcb97fa18f80d03/assets/js/frontend/checkout.js#L514-L529
            $('.woocommerce-NoticeGroup-checkout, .woocommerce-error, .woocommerce-message').remove();
            $container.prepend('<div class="woocommerce-NoticeGroup woocommerce-NoticeGroup-checkout">' + errorMessage + '</div>');
            $container.find('.input-text, select, input:checkbox').trigger('validate').trigger('blur');

            var scrollElement = $('.woocommerce-NoticeGroup-checkout');
            if (!scrollElement.length) {
                scrollElement = $container;
            }

            if ($.scroll_to_notices) {
                $.scroll_to_notices(scrollElement);
            } else {
                // Compatibility with WC <3.3
                $('html, body').animate({
                    scrollTop: ($container.offset().top - 100)
                }, 1000);
            }

            $(document.body).trigger('checkout_error');
        }
        ,
        getUUID: async function (partial_tx_check = true) {


            let firstname = document.getElementById('billing_first_name')?.value || document.getElementById('shipping_first_name')?.value;
            let lastname = document.getElementById('billing_last_name')?.value || document.getElementById('shipping_last_name')?.value;
            let email = document.getElementById('billing_email')?.value || document.getElementById('shipping_email')?.value;

            let url = wc_shark_processing_context.start_checkout_url;
            // // let url = document.querySelector('input[name=admin_url_shark_processing]').value;
            // if (email) {
            //     url += '&email=' + email;

            // }
            // if (lastname) {
            //     url += '&lastname=' + lastname;
            // }
            // if (firstname) {
            //     url += '&firstname=' + firstname;
            // }
            var data = $('form.checkout')
                .add($('<input type="hidden" name="nonce" /> ')
                    .attr('value', wc_shark_processing_context.start_checkout_nonce)
                ).add($('<input type="hidden" name="shark_processing_checkout_firstname" /> ')
                    .attr('value', firstname)
                ).add($('<input type="hidden" name="shark_processing_checkout_lastname" /> ')
                    .attr('value', lastname)
                ).add($('<input type="hidden" name="shark_processing_checkout_email" /> ')
                    .attr('value', email)
                ).add($('<input type="hidden" name="shark_processing_checkout_partial_tx_check" /> ')
                    .attr('value', partial_tx_check)
                )
                .serialize();
            let response = await fetch(url, {
                method: 'post',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data
            });
            let result = {};
            let rawresult = await response.text();

            if (rawresult) {
                try {
                    result = JSON.parse(rawresult);
                } catch (error) {
                    result.messages = ['Error parsing request'];
                    console.error(' ERROR_PARSE_GUUID', { error });
                }

            }


            if (!result.success) {

                // document.getElementById('shark_processing_retrigger_payment_button').innerHTML = document.getElementById('shark_processing_retrigger_payment_button').dataset.shark_processingButtonText;
                Shark_ProcessingPaymentEngine.prepareRetrigger(); 
                // Error messages may be preformatted in which case response structure will differ
                var messages = result.data ? result.data.messages : result.messages;

                console.log("Messages from start checkout", { result });
                if (!messages) {
                    messages = ['Gateway request error'];
                }
                if ('string' === typeof messages) {
                    this.showError(messages);
                } else {
                    var messageItems = messages.map(function (message) {
                        return '<li>' + message + '</li>';
                    }).join('');
                    this.showError('<ul class="woocommerce-error" role="alert">' + messageItems + '</ul>', selector);
                }

                return null;

            }

            let uuid = result.data?.uuid?.result?.uuid;
            let isPartial = result.data?.is_partial;

            if (!uuid) {
                this.showError(['Could not generate invoice']);

                return false;
            }


            Shark_ProcessingPaymentEngine.order_id = result.data.temporary_order_id;
            Shark_ProcessingPaymentEngine.access_token = result.data?.uuid?.access_token;
            // Shark_ProcessingPaymentEngine.encryptedReq = result.data?.encrypted_req;

            document.querySelector('input[name=encrypted_req_shark_processing]').value = result.data?.encrypted_req;

            document.querySelector('input[name=temp_orderid_shark_processing]').value = result.data.temporary_order_id;

            console.log("res", uuid);

            return { uuid, isPartial };

        },
        getEnvironment: function () {
            let environment = document.querySelector('input[name=environment_shark_processing]')?.value;

            return environment || 'prod';
        },
        getUserData: function () {

            let user_data = {

                first_name: document.getElementById('billing_first_name') ? document.getElementById('billing_first_name').value : null,

                last_name: document.getElementById('billing_last_name') ? document.getElementById('billing_last_name').value : null,

                email: document.getElementById('billing_email') ? document.getElementById('billing_email').value : null,

                merchant_auth: document.querySelector('input[name=merchant_auth_shark_processing]') ? document.querySelector('input[name=merchant_auth_shark_processing]').value : null,
                encrypted_req: document.querySelector('input[name=encrypted_req_shark_processing]') ? document.querySelector('input[name=encrypted_req_shark_processing]').value : null
            }

            if (!user_data) return false;

            return user_data;

        },
        triggerPlaceOrder: function () {
            // document.getElementById('place_order').style.display = 'inherit';
            console.log('Trigger is calling');
   
            $('form.checkout').trigger('submit');

            // document.getElementById('place_order').style.display = 'none';

            console.log('Trigger has neen called ');
        },
        updateOrder: function (result) {
            try {

                console.log("Response from callback :", result, result?.status === undefined);


                let status = "wc-on-hold";

                if (result?.status === undefined) {
                    return false;
                }

                let result_status = parseInt(result.status);

                if (result_status === 101) {
                    status = "wc-partial-payment";
                }

                if (result_status === 1) {

                    status = document.querySelector('input[name=payment_complete_order_status]')?.value || 'wc-processing';

                    //placeholder to get order status set by seller
                }

                if (result_status === -1) {
                    status = "wc-failed";
                }

                document.querySelector('input[name=order_status_shark_processing]').value = status;

                document.querySelector('input[name=payment_status_shark_processing]').value = 'complete';

                localStorage.setItem('payment_status_shark_processing', 'complete');

                document.getElementById('shark_processing_retrigger_payment_button').dataset.disable = true;

                document.getElementById('shark_processing_retrigger_payment_button').style.opacity = 0.5;

                // document.getElementById('shark_processing_retrigger_payment_button').style.display = 'none';

            } catch (error) {

                console.error('Error from update order method', error);

            }

        },

        startPayment: function (autoTriggerState = true) {

            // document.getElementById('shark_processing_retrigger_payment_button').innerText = "Preparing Payment window...";
            this.watchIframeShow = true;

            document.getElementById('shark_processing_retrigger_payment_button').disabled = true;

            let checkIframe = setInterval(() => {
console.log('retrying');
                if (Shark_ProcessingPaymentEngine.shark_processing.iframeInfo.iframe) {

                    Shark_ProcessingPaymentEngine.shark_processing.initPayment();

                    clearInterval(checkIframe);
                }

            }, 500);

        },
        prepareRetrigger: function () {

            //show retrigger button
            document.getElementById('shark_processing_retrigger_payment_button').dataset.disable = false;


            document.getElementById('shark_processing_retrigger_payment_button').innerHTML = document.getElementById('shark_processing_retrigger_payment_button').dataset.shark_processingButtonText;

        },
        prepareProgressMessage: function () {

            //revert trigger button message

            document.getElementById('shark_processing_retrigger_payment_button').dataset.disable = true;


        },

        windowListener: function () {
            let engine = this;

            window.addEventListener('message', (event) => {

                switch (event.data.type) {
                    case 'shark_processing_iframe_close':
                        console.log('Event from shark_processing_iframe_close', event.data);


                        // engine.prepareRetrigger();
                        document.getElementById('shark_processing_retrigger_payment_button').style.opacity = 1;

                        if (event.data.paymentCompleted === 1) {
                            engine.triggerPlaceOrder();
                        } else {
                            engine.prepareRetrigger();
                        }
                        break;
                    case 'shark_processing_new_height':
                        engine.prepareProgressMessage();

                        engine.watchIframeShow = false;

                        document.getElementById('shark_processing_retrigger_payment_button').innerHTML = document.getElementById('shark_processing_retrigger_payment_button').dataset.shark_processingButtonText;
                        document.getElementById('shark_processing_retrigger_payment_button').style.opacity = 0.5;


                    case 'shark_processing_result_ok':



                        if (event.data.response) {

                            console.log('Payment response has been recorded');

                            engine.paymentResponse = event.data.response

                            engine.updateOrder(engine.paymentResponse);

                        }

                    default:
                        break;
                }

            })
        },
        setLocalStorage: function (key, value) {
            localStorage.setItem(key, value);
        },
        createElementAbstract: {
            partialPaymentNotificationModal: function () {
                //UNDERLAY
                const shark_processingPaymentPartialAlertModalUnderlay = document.createElement('div');
                shark_processingPaymentPartialAlertModalUnderlay.style.cssText = 'background: #00000070;position: fixed;top: 0;right: 0;height: 100%;width: 100%;'

                //MODAL
                const shark_processingPaymentPartialAlertModal = document.createElement('div');
                shark_processingPaymentPartialAlertModal.style.cssText = 'max-width: 400px; margin: auto; background: rgb(255, 255, 255); padding: 20px; margin-top: 20vh;'

                //MODAL CONTENT
                const shark_processingPaymentPartialAlertModalContent = document.createElement('div');
                shark_processingPaymentPartialAlertModalContent.innerText = 'You have already made partial payment on this order item. Are you sure to continue payment on the existing order?';

                //MODAL CONTENT BUTTON
                const shark_processingPaymentPartialAlertModalContentButton = document.createElement('div');
                shark_processingPaymentPartialAlertModalContentButton.style.cssText = 'display: flex; justify-content: space-around; margin-top: 20px; text-align: center; font-size: 14px;';

                //MODAL CONTENT BUTTON REJECT
                const shark_processingButtonReject = document.createElement('span');
                shark_processingButtonReject.innerText = 'No';
                shark_processingButtonReject.style.cssText = 'border: 2px solid #f0833c; padding: 6px 15px;width:120px;cursor:pointer';

                //MODAL CONTENT BUTTON ACCEPT
                const shark_processingButtonAccept = document.createElement('span');
                shark_processingButtonAccept.innerText = 'Yes, Continue';
                shark_processingButtonAccept.style.cssText = 'background:#f0833c; padding: 6px 15px;color:#fff;width:120px;cursor:pointer';

                return {
                    shark_processingPaymentPartialAlertModalUnderlay,
                    shark_processingPaymentPartialAlertModal,
                    shark_processingPaymentPartialAlertModalContent,
                    shark_processingPaymentPartialAlertModalContentButton,
                    shark_processingButtonReject,
                    shark_processingButtonAccept
                }
            },
            clearAppendedDom:(element)=>{
                element.remove();
            }
        },
        userAgreeToPartialPayment: function () {
            return new Promise((resolve, reject) =>{
                try {
                    const {   
                        shark_processingPaymentPartialAlertModalUnderlay,
                        shark_processingPaymentPartialAlertModal,
                        shark_processingPaymentPartialAlertModalContent,
                        shark_processingPaymentPartialAlertModalContentButton,
                        shark_processingButtonReject,
                        shark_processingButtonAccept 
                    } = Shark_ProcessingPaymentEngine.createElementAbstract.partialPaymentNotificationModal();

                    shark_processingButtonReject.addEventListener('click', () => {
                        Shark_ProcessingPaymentEngine.createElementAbstract.clearAppendedDom(shark_processingPaymentPartialAlertModalUnderlay)
                        resolve(false)
                    });


                    shark_processingButtonAccept.addEventListener('click', () => {
                        Shark_ProcessingPaymentEngine.createElementAbstract.clearAppendedDom(shark_processingPaymentPartialAlertModalUnderlay)

                        resolve(true)
                    });

                    //APPEND ACTIONS
                    shark_processingPaymentPartialAlertModalContentButton.appendChild(shark_processingButtonReject);
                    shark_processingPaymentPartialAlertModalContentButton.appendChild(shark_processingButtonAccept);

                    shark_processingPaymentPartialAlertModal.appendChild(shark_processingPaymentPartialAlertModalContent);
                    shark_processingPaymentPartialAlertModal.appendChild(shark_processingPaymentPartialAlertModalContentButton);


                    shark_processingPaymentPartialAlertModalUnderlay.appendChild(shark_processingPaymentPartialAlertModal);
                    document.body.appendChild(shark_processingPaymentPartialAlertModalUnderlay);

                } catch (error) {
                    console.log(error.message)
                    resolve(false)
                }
            })
        },
        initRocketFuel: async function () {

            return new Promise(async (resolve, reject) => {

                if ( !RocketFuel ) {

                    location.reload();
                    reject();

                }
        
                let { uuid, isPartial } = await this.getUUID(); //set uuid

                if ( !uuid ) {

                    reject();

                }
               
                document.getElementById('shark_processing_retrigger_payment_button').dataset.disable = true;
             
                if ( isPartial ) {

                    const userAgreed = await this.userAgreeToPartialPayment();
              
                    if ( ! userAgreed ) {

                        const result = await this.getUUID(false); //set uuid
                
                        uuid = result.uuid;
                        console.log({uuid},'User did not agree');

                        // isPartial = result.isPartial;

                    }else{
                        console.log( {uuid}, 'User did agree' );
                    }

                } 


                let userData = Shark_ProcessingPaymentEngine.getUserData();

                let payload, response, shark_processingToken;

                Shark_ProcessingPaymentEngine.shark_processing = new RocketFuel({
                    environment: Shark_ProcessingPaymentEngine.getEnvironment()
                });


                Shark_ProcessingPaymentEngine.shark_processingConfig = {
                    uuid,
                    callback: Shark_ProcessingPaymentEngine.updateOrder,
                    environment: Shark_ProcessingPaymentEngine.getEnvironment()
                }
                if (userData.encrypted_req || (userData.first_name && userData.email)) {
                    // payload = { //change this
                    //     firstName: userData.first_name,
                    //     lastName: userData.last_name,
                    //     email: userData.email,
                    //     merchantAuth: userData.merchant_auth,
                    //     kycType: 'null',
                    //     kycDetails: {
                    //         'DOB': "01-01-1990"
                    //     }
                    // }
                    payload = {
                        encryptedReq: userData.encrypted_req,
                        merchantAuth: userData.merchant_auth,
                        email: userData.email,

                    }
                    try {
                        console.log('details', userData.email, payload);


                        shark_processingToken = localStorage.getItem('shark_processing_token');

                        if (!shark_processingToken && payload.merchantAuth) {
                            payload.accessToken = Shark_ProcessingPaymentEngine.access_token;
                            payload.isSSO = true;
                            // payload = data.encryptedReq

                            response = await Shark_ProcessingPaymentEngine.shark_processing.shark_processingAutoSignUp(payload, Shark_ProcessingPaymentEngine.getEnvironment());




                            if (response) {

                                shark_processingToken = response.result?.shark_processingToken;

                            }

                        }


                        if (shark_processingToken) {
                            Shark_ProcessingPaymentEngine.shark_processingConfig.token = shark_processingToken;
                        }

                        resolve(true);
                    } catch (error) {
                        reject(error?.message);
                    }

                }

                if (Shark_ProcessingPaymentEngine.shark_processingConfig) {

                    Shark_ProcessingPaymentEngine.shark_processing = new RocketFuel(Shark_ProcessingPaymentEngine.shark_processingConfig); // init SH_PR
                    resolve(true);

                } else {
                    resolve(false);
                }

            })

        },

        init: async function () {

            let engine = this;
            console.log('Start initiating SH_PR');

            try {

                let res = await engine.initRocketFuel();
                console.log(res);

            } catch (error) {
                engine.prepareRetrigger();

                console.log('error from promise', error);

            }

            console.log('Done initiating SH_PR');

            engine.windowListener();


            engine.startPayment();

        }
    }


    // document.querySelector("")

    document.querySelector(".shark_processing_retrigger_payment_button").addEventListener('click', (e) => {

        e.preventDefault();

        if (e.target.dataset.disable == 'true') {
            console.warn('[ ACTION_DISALLOWED ] Button is disabled');
            return;
        }

        document.getElementById('shark_processing_retrigger_payment_button').innerHTML = '<div class="loader_rocket"></div>';

        Shark_ProcessingPaymentEngine.init();

    })

    document.querySelector('input[name=payment_status_shark_processing]').value = localStorage.getItem('payment_status_shark_processing');


})(jQuery, window, document);

