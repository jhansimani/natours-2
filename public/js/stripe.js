const stripe = Stripe(
  'pk_test_51LkMBhSIz58A1ANPfsx235EHEU8LvrniLIDWweqvUrWKOq4nBl93Y0vvtcRmCsaPWBCOxz70DlRr4PHyqMNiI21t00GvBL6iGS'
);
import axios from 'axios';
const catchAsync = require('./../../utils/catchAsync');
import { showAlert } from './alert';
export const bookTour = catchAsync(async (tourId) => {
  try {
    // get checkout session from api
    console.log(tourId);
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
    // create checkout form + chance credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
});
