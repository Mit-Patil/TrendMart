import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import orderService from '../order_payment/orderService';
import cartService from '../cart/cartService';
import "../../styles/OrderDetail.css";


// PDF Imports
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [showUPIForm, setShowUPIForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  // UPI form state
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');

  // Card form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState(''); // MM/YY
  const [cardCvv, setCardCvv] = useState('');
  const [cardErrors, setCardErrors] = useState({}); 

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderService.getOrderDetail(orderId);
        setOrder(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="loader">Loading order...</div>;
  if (!order) return <div className="error-text">Order not found</div>;

  const subtotal = order.orderItems?.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;
  const shipping = subtotal > 5000 ? 0 : 150;
  const total = subtotal + shipping;

  // ----------------- Validation Helpers -----------------
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/; 
  const validateUPI = (id) => upiRegex.test(id.trim());

  const luhnCheck = (num) => {
    const s = num.replace(/\D/g, '');
    let sum = 0, flip = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let n = parseInt(s.charAt(i), 10);
      if (flip) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      flip = !flip;
    }
    return (sum % 10) === 0 && s.length >= 12 && s.length <= 19;
  };

  const validateExpiry = (mmYY) => {
    if (!/^\d{2}\/\d{2}$/.test(mmYY)) return false;
    const [mmStr, yyStr] = mmYY.split('/');
    const mm = parseInt(mmStr, 10);
    const yy = parseInt(yyStr, 10);
    if (mm < 1 || mm > 12) return false;
    const year = 2000 + yy;
    const exp = new Date(year, mm, 0, 23, 59, 59); // last day of month
    return exp.getTime() >= new Date().setHours(0,0,0,0);
  };

const validateCardForm = () => {
  const errs = {};

  if (!cardName.trim()) {
    errs.name = 'Cardholder name is required';
  }

  // ✅ Updated card number validation
  if (!/^\d{10,19}$/.test(cardNumber)) {
    errs.number = 'Card number must be between 10 and 19 digits';
  }

  if (!validateExpiry(cardExpiry)) {
    errs.expiry = 'Invalid expiry (MM/YY) or card expired';
  }

  if (!/^\d{3,4}$/.test(cardCvv)) {
    errs.cvv = 'CVV must be 3 or 4 digits';
  }

  setCardErrors(errs);
  return Object.keys(errs).length === 0;
};

  // ----------------- Payment Handlers -----------------
  const handleFakeUPIPay = async (e, paymentMethod = 'UPI') => {
    e?.preventDefault();
    setUpiError('');

    if (paymentMethod === 'UPI' && !validateUPI(upiId)) {
      setUpiError('Invalid UPI ID (format like name@bank).');
      return;
    }

    const status = paymentMethod === 'COD' ? 'Pending' : 'Success';
    const message = paymentMethod === 'COD' 
      ? 'Order placed! Payment via Cash on Delivery.'
      : 'Payment successful via UPI.';

    setProcessing(true);
    try {
      await orderService.createPayment({
        OrderID: order.orderId,
        PaymentMethod: paymentMethod,
        Amount: total,
        Status: status,
        Meta: { upiId } 
      });
      setOrder(prev => ({ ...prev, paymentStatus: status === 'Success' ? 'Paid' : 'COD' }));
      setPaymentMessage(message);
      await cartService.clearCart();
      setShowUPIForm(false);
    } catch (err) {
      console.error(err);
      setPaymentMessage(`${paymentMethod} payment failed (simulated).`);
    } finally {
      setProcessing(false);
    }
  };

  const handleFakeCardPay = async (e) => {
    e.preventDefault();
    setCardErrors({});
    if (!validateCardForm()) return;
    setProcessing(true);
    try {
      await orderService.createPayment({
        OrderID: order.orderId,
        PaymentMethod: 'Card',
        Amount: total,
        Status: 'Success',
        Meta: {
          cardLast4: cardNumber.replace(/\D/g, '').slice(-4),
          cardName
        }
      });
      setOrder(prev => ({ ...prev, paymentStatus: 'Paid' }));
      setPaymentMessage('Card payment successful (simulated).');
      await cartService.clearCart();
      setShowCardForm(false);
    } catch (err) {
      console.error(err);
      setPaymentMessage('Card payment failed (simulated).');
    } finally {
      setProcessing(false);
    }
  };

//   const handleRazorpayPayment = async () => {
//   try {
//     setProcessing(true);

//     // 1️⃣ Create order from backend using orderService
//     const razorpayOrder = await orderService.createRazorpayOrder(total);
//     if (!razorpayOrder) return;

//     // 2️⃣ Razorpay options
//     const options = {
//       key: process.env.REACT_APP_RAZORPAY_KEY_ID, // add your Razorpay key in .env
//       amount: razorpayOrder.amount,
//       currency: razorpayOrder.currency,
//       name: "TrendMart",
//       description: `Order #${order.orderId}`,
//       order_id: razorpayOrder.id,
//       handler: async function (response) {
//         console.log("Razorpay payment success:", response);

//         // Update payment in backend
//         await orderService.createPayment({
//           OrderID: order.orderId,
//           PaymentMethod: "Razorpay",
//           Amount: total,
//           Status: "Success",
//           Meta: response
//         });

//         setOrder(prev => ({ ...prev, paymentStatus: "Paid" }));
//         setPaymentMessage("Payment successful via Razorpay!");
//         await cartService.clearCart();
//         setShowCardForm(false);
//       },
//       prefill: {
//         name: order.address?.fullName,
//         email: order.user?.email,
//         contact: order.address?.contactNumber || ""
//       },
//       theme: { color: "#3399cc" }
//     };

//     const rzp = new window.Razorpay(options);
//     rzp.open();
//   } catch (err) {
//     console.error("Razorpay error:", err);
//     setPaymentMessage("Razorpay payment failed.");
//   } finally {
//     setProcessing(false);
//   }
// };


  // ----------------- PDF Generation Function -----------------
  const generateInvoicePdf = () => {
    const input = document.getElementById('invoice-content');
    const paymentCard = document.querySelector('.payment-card');
    if (paymentCard) paymentCard.style.display = 'none';

    html2canvas(input, { scale: 2, logging: false })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); 
        const imgWidth = 210; 
        const pageHeight = 297; 
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`invoice_${order.orderId}.pdf`);
      })
      .finally(() => {
        if (paymentCard) paymentCard.style.display = '';
      });
  };

  return (
    <div className="order-container">
      <h2 className="order-title">Order #{order.orderId}</h2>

      {paymentMessage && <div className="alert-msg">{paymentMessage}</div>}

      {/* Invoice & order content */}
      <div id="invoice-content">
        <div className="detail-card">
          <h5 className="section-title">📍 Shipping Address</h5>
          <p>{order.address?.fullName}</p>
          <p>{order.address?.addressLine1}, {order.address?.addressLine2}</p>
          <p>{order.address?.city}, {order.address?.state} - {order.address?.postalCode}</p>
          <p>{order.address?.country}</p>
        </div>

        <div className="detail-card">
          <h5 className="section-title">🛒 Order Items</h5>
          {order.orderItems?.map(item => (
            <div key={item.orderItemId} className="item-row">
              <div>
                <p className="item-name">{item.variant?.product?.name || 'Product'}</p>
                <p className="item-qty">Qty: {item.quantity}</p>
              </div>
              <div className="item-price">₹{(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}

          <hr />
          <div className="price-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="price-row"><span>Shipping</span><span>₹{shipping.toFixed(2)}</span></div>
          <div className="price-row total-row"><span>Total</span><span>₹{total.toFixed(2)}</span></div>

          <div className="payment-status"><strong>Payment Status:</strong> {order.paymentStatus || 'Unpaid'}</div>
        </div>
      </div>

      {/* 💳 Payment Options: Show only if not Paid/COD */}
      {order.paymentStatus !== 'Paid' && order.paymentStatus !== 'COD' && (
        <div className="payment-card">
          <h5 className="section-title">💳 Choose Payment Method (demo)</h5>

          <div className="payment-options">
            <div className="payment-box" onClick={() => { setShowUPIForm(true); setShowCardForm(false); }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/fc/UPI-Logo-vector.svg" alt="UPI" />
              <p>Pay with UPI</p>
            </div>

            <div className="payment-box" onClick={() => { setShowCardForm(true); setShowUPIForm(false); }}>
              <img src="https://cdn-icons-png.flaticon.com/512/633/633611.png" alt="Card" />
              <p>Pay with Card</p>
            </div>

            <div className="payment-box cod-box" onClick={(e) => handleFakeUPIPay(e, 'COD')}>
              <img src="https://cdn-icons-png.flaticon.com/512/2331/2331970.png" alt="COD" />
              <p>Cash on Delivery</p>
            </div>
          </div>

          {/* UPI FORM */}
          {showUPIForm && (
            <form className="payment-form" onSubmit={handleFakeUPIPay}>
              <label>Enter UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@bank"
                className={upiError ? 'input-error' : ''}
                disabled={processing}
              />
              {upiError && <div className="form-error">{upiError}</div>}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUPIForm(false)} disabled={processing}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={processing}>{processing ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}</button>
              </div>
            </form>
          )}

          {/* CARD FORM */}
        {showCardForm && (
          <form className="payment-form" onSubmit={handleFakeCardPay}>
            <label>Cardholder Name</label>
            <input type="text" value={cardName} onChange={(e)=>setCardName(e.target.value)} className={cardErrors.name ? 'input-error':''} disabled={processing}/>
            {cardErrors.name && <div className="form-error">{cardErrors.name}</div>}

            <label>Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e)=>setCardNumber(e.target.value.replace(/\D/g,''))}
              placeholder="Enter card number"
              maxLength={19}
              className={cardErrors.number ? 'input-error':''}
              disabled={processing}
            />
            {cardErrors.number && <div className="form-error">{cardErrors.number}</div>}

            <div className="row-inline">
              <div style={{flex:1}}>
                <label>Expiry (MM/YY)</label>
                <input type="text" value={cardExpiry} onChange={(e)=> setCardExpiry(e.target.value)} placeholder="MM/YY" className={cardErrors.expiry?'input-error':''} disabled={processing}/>
                {cardErrors.expiry && <div className="form-error">{cardErrors.expiry}</div>}
              </div>
              <div style={{width:120, marginLeft:12}}>
                <label>CVV</label>
                <input type="password" value={cardCvv} onChange={(e)=> setCardCvv(e.target.value.replace(/\D/g,''))} placeholder="123" className={cardErrors.cvv?'input-error':''} disabled={processing}/>
                {cardErrors.cvv && <div className="form-error">{cardErrors.cvv}</div>}
              </div>
            </div>

          {/* Buttons */}
<div className="form-actions">
  <button
    type="button"
    className="btn btn-secondary"
    onClick={() => setShowCardForm(false)}
    disabled={processing}
  >
    Cancel
  </button>

  <button
    type="submit"
    className="btn btn-primary"
    disabled={processing}
  >
    {processing ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
  </button>

  {/* Razorpay Button (optional) */}
  {/* 
  <button
    type="button"
    className="btn btn-success"
    onClick={handleRazorpayPayment}
    disabled={processing}
    style={{ marginLeft: '10px' }}
  >
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/2/2e/Razorpay-logo.png"
      alt="Razorpay"
      style={{ height: '20px', marginRight: '5px' }}
    />
    Pay with Razorpay
  </button>
  */}
</div>
          </form>
        )}
        </div>
      )}

      {/* 📄 Download Invoice Button: Show only after Paid/COD */}
      {(order.paymentStatus === 'Paid' || order.paymentStatus === 'COD') && (
        <div className="detail-card">
          <button className="btn btn-primary" onClick={generateInvoicePdf} style={{width:'100%'}}>
            📄 Download Invoice (PDF)
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
