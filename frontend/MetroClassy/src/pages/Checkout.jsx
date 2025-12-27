import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiCreditCard, FiSmartphone, FiTag, FiMapPin, FiPlus } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { INDIAN_STATES, searchCities, getStateFromCity } from '../data/indianLocations';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Shipping & Payment
  const [shipping, setShipping] = useState('standard');
  const [coupon, setCoupon] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Address Management
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  // City Autocomplete
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);

  // Load saved addresses and persistent form data
  useEffect(() => {
    const loadAddresses = async () => {
      // Try to load cached guest address first
      const cachedAddress = localStorage.getItem('checkoutAddress');
      if (cachedAddress) {
        setAddress(JSON.parse(cachedAddress));
      }

      if (!user) return;

      try {
        const { data } = await axiosInstance.get('/users/addresses');
        setSavedAddresses(data.addresses || []);

        // Auto-select default address
        const defaultAddr = data.addresses.find(a => a.isDefault);
        if (defaultAddr && !useNewAddress) {
          setSelectedAddressId(defaultAddr._id);
          setAddress({
            name: defaultAddr.name,
            phone: defaultAddr.phone,
            street: defaultAddr.street,
            city: defaultAddr.city,
            state: defaultAddr.state,
            zip: defaultAddr.zip,
          });
          setCitySearch(defaultAddr.city);
        } else if (data.addresses.length === 0) {
          setUseNewAddress(true);
        }
      } catch (error) {
        console.error('Failed to load addresses:', error);
      }
    };
    loadAddresses();
  }, [user, useNewAddress]);

  // Persist address changes to localStorage
  useEffect(() => {
    localStorage.setItem('checkoutAddress', JSON.stringify(address));
  }, [address]);

  // Handle city search - filter by selected state
  const handleCitySearch = (value) => {
    setCitySearch(value);
    if (value.length > 1) {
      // Filter cities by selected state if state is selected
      const suggestions = searchCities(value, address.state || null);
      setCitySuggestions(suggestions);
      setShowCitySuggestions(true);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  };

  // Select city and auto-fill state
  const selectCity = (city) => {
    const cityState = getStateFromCity(city);
    // If a state is already selected, validate that the city belongs to that state
    if (address.state && cityState !== address.state) {
      // City doesn't match selected state, update state to match city
      setAddress(prev => ({ ...prev, city, state: cityState }));
    } else {
      // Either no state selected or city matches state
      setAddress(prev => ({ ...prev, city, state: cityState || prev.state }));
    }
    setCitySearch(city);
    setShowCitySuggestions(false);
  };

  // Handle address selection
  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    const selected = savedAddresses.find(a => a._id === addressId);
    if (selected) {
      setAddress({
        name: selected.name,
        phone: selected.phone,
        street: selected.street,
        city: selected.city,
        state: selected.state,
        zip: selected.zip,
      });
      setCitySearch(selected.city); // Also update city search
    }
  };

  const couponValue = coupon.trim().toLowerCase() === 'metro10' ? 0.1 : 0;
  const shippingCost = shipping === 'express' ? 249 : 149;

  const total = useMemo(() => {
    const subtotal = cartTotal;
    const discount = subtotal * couponValue;
    return subtotal - discount + (subtotal > 0 ? shippingCost : 0);
  }, [cartTotal, couponValue, shippingCost]);

  const validate = () => {
    if (!address.name || !address.phone || !address.street || !address.city || !address.state || !address.zip) {
      return 'Please fill all shipping fields.';
    }
    if (paymentMethod === 'upi' && !upiId.trim()) {
      return 'Enter a valid UPI ID.';
    }
    if (paymentMethod === 'card' && (!cardNumber.trim() || !cardName.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
      return 'Complete all card details.';
    }
    return '';
  };

  const handlePay = async () => {
    const issue = validate();
    if (issue) {
      setErrors(issue);
      return;
    }
    setErrors('');
    setProcessing(true);

    try {
      // Save address if it's new and user wants to save
      if (useNewAddress && saveAddress && user) {
        try {
          console.log('Attempting to save address...', address);
          await axiosInstance.post('/users/addresses', {
            ...address,
            isDefault: savedAddresses.length === 0,
          });
          console.log('Address saved successfully');
        } catch (err) {
          console.error('Failed to save address. Status:', err.response?.status, 'Message:', err.response?.data?.message);
          // Do not stop checkout flow if address save fails
        }
      }

      // Create order in database first
      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item._id,
          name: item.name,
          qty: item.quantity,
          price: item.price,
          image: item.image,
          size: item.selectedSize || item.size,
          color: item.selectedColor || item.color,
        })),
        shippingAddress: {
          fullName: address.name,
          phone: address.phone,
          address: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.zip,
          country: 'India',
        },
        paymentMethod: 'razorpay',
        itemsPrice: cartTotal,
        shippingPrice: shippingCost,
        taxPrice: 0,
        totalPrice: total,
        couponCode: coupon.trim() || null,
        discountPrice: cartTotal * couponValue,
        userId: user?._id || null,
      };

      const { data: orderResponse } = await axiosInstance.post('/orders', {
        ...orderData,
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'razorpay'
      });
      const createdOrder = orderResponse.order;

      // Handle Cash on Delivery
      if (paymentMethod === 'cod') {
        clearCart();
        navigate('/order-success', { state: { orderNumber: createdOrder.orderNumber } });
        return;
      }

      // Create Razorpay order
      const { data: razorpayData } = await axiosInstance.post('/payment/create-order', {
        amount: total,
        currency: 'INR',
        receipt: createdOrder.orderNumber,
      });

      // Initialize Razorpay checkout
      const options = {
        key: razorpayData.key_id,
        amount: razorpayData.order.amount,
        currency: razorpayData.order.currency,
        name: 'MetroClassy',
        description: `Order #${createdOrder.orderNumber}`,
        order_id: razorpayData.order.id,
        handler: async function (response) {
          try {
            // Verify payment
            await axiosInstance.post('/payment/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: createdOrder._id,
            });

            // Payment successful
            clearCart();
            navigate('/order-success', { state: { orderNumber: createdOrder.orderNumber } });
          } catch (error) {
            console.error('Payment verification failed:', error);
            setErrors('Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        prefill: {
          name: address.name,
          email: user?.email || '',
          contact: address.phone,
        },
        notes: {
          address: `${address.street}, ${address.city}, ${address.state} - ${address.zip}`,
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setErrors('Payment cancelled. Your order is saved, you can complete payment later.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setErrors(`Payment failed: ${response.error.description}`);
        setProcessing(false);
      });
      rzp.open();
    } catch (error) {
      console.error('Order creation failed:', error);
      const serverMsg = error.response?.data?.message;
      const debugMsg = error.response?.data?.stack ? ` (Debug: ${error.response.data.stack.split('\n')[0]})` : '';
      setErrors(serverMsg ? `${serverMsg}${debugMsg}` : 'Failed to create order. Please try again.');
      setProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white dark:bg-slate-900/50 dark:border dark:border-white/10 rounded-2xl shadow-sm p-6 text-center">
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your cart is empty.</p>
          <Link to="/products" className="mt-4 inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
            <FiArrowLeft /> Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="surface min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6">
          <FiArrowLeft /> Back to cart
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white dark:bg-slate-900/50 dark:border dark:border-white/10 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiMapPin /> Shipping Address
                </h2>
                {savedAddresses.length > 0 && !useNewAddress && (
                  <button
                    onClick={() => setUseNewAddress(true)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <FiPlus size={14} /> Add New
                  </button>
                )}
              </div>

              {/* Saved Addresses Selection */}
              {!useNewAddress && savedAddresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr._id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-white/10 hover:border-indigo-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        checked={selectedAddressId === addr._id}
                        onChange={() => handleAddressSelect(addr._id)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{addr.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{addr.phone}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {addr.street}, {addr.city}, {addr.state} - {addr.zip}
                          </p>
                        </div>
                        {addr.isDefault && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* New Address Form */}
              {(useNewAddress || savedAddresses.length === 0) && (
                <div className="space-y-4">
                  {savedAddresses.length > 0 && (
                    <button
                      onClick={() => setUseNewAddress(false)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      ← Use saved address
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={address.name}
                      onChange={(e) => setAddress({ ...address, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      autoComplete="name"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      autoComplete="tel"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    autoComplete="street-address"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="City"
                        value={address.city} // Bind directly to address.city to avoid sync issues
                        onChange={(e) => {
                          const val = e.target.value;
                          setCitySearch(val);
                          setAddress(prev => ({ ...prev, city: val }));
                          // Trigger search logic
                          if (val.length > 1) {
                            const suggestions = searchCities(val, address.state || null);
                            setCitySuggestions(suggestions);
                            setShowCitySuggestions(true);
                          } else {
                            setCitySuggestions([]);
                            setShowCitySuggestions(false);
                          }
                        }}
                        onFocus={() => citySearch && setShowCitySuggestions(true)}
                        onBlur={() => {
                          // Allow click on suggestion before hiding
                          setTimeout(() => {
                            setShowCitySuggestions(false);
                          }, 200);
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                        autoComplete="address-level2"
                      />
                      {showCitySuggestions && citySuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {citySuggestions.map((city, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectCity(city)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-gray-900 dark:text-white"
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <select
                      value={address.state}
                      onChange={(e) => {
                        const newState = e.target.value;
                        setAddress({ ...address, state: newState, city: '' });
                        setCitySearch('');
                        setCitySuggestions([]);
                        setShowCitySuggestions(false);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      autoComplete="address-level1"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="PIN Code"
                    value={address.zip}
                    onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    maxLength={6}
                    autoComplete="postal-code"
                  />
                  {user && useNewAddress && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="rounded"
                      />
                      Save this address for future orders
                    </label>
                  )}
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-slate-900/50 dark:border dark:border-white/10 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Shipping Method</h2>
              <div className="space-y-3">
                <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${shipping === 'standard' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-white/10'
                  }`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="standard"
                    checked={shipping === 'standard'}
                    onChange={(e) => setShipping(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Standard Delivery (5-7 days)</span>
                    <span className="text-gray-600 dark:text-gray-400">₹149</span>
                  </div>
                </label>
                <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${shipping === 'express' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-white/10'
                  }`}>
                  <input
                    type="radio"
                    name="shipping"
                    value="express"
                    checked={shipping === 'express'}
                    onChange={(e) => setShipping(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Express Delivery (2-3 days)</span>
                    <span className="text-gray-600 dark:text-gray-400">₹249</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900/50 dark:border dark:border-white/10 rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h2>
              <div className="space-y-4">
                <label className={`block p-4 rounded-xl border-2 cursor-pointer ${paymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-white/10'
                  }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <FiSmartphone className="text-indigo-600" />
                    <span className="font-medium text-gray-900 dark:text-white">UPI</span>
                  </div>
                </label>
                {paymentMethod === 'upi' && (
                  <input
                    type="text"
                    placeholder="Enter UPI ID (e.g., user@paytm)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  />
                )}
                <label className={`block p-4 rounded-xl border-2 cursor-pointer ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-white/10'
                  }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <FiCreditCard className="text-indigo-600" />
                    <span className="font-medium text-gray-900 dark:text-white">Credit/Debit Card</span>
                  </div>
                </label>
                {paymentMethod === 'card' && (
                  <div className="space-y-3 pl-4">
                    <input type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="cc-number" placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
                    <input type="text" autoComplete="cc-name" placeholder="Cardholder Name" value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" autoComplete="cc-exp" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" />
                      <input type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="cc-csc" placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400" maxLength={3} />
                    </div>
                  </div>
                )}

                <label className={`block p-4 rounded-xl border-2 cursor-pointer ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-white/10'
                  }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">Cash on Delivery</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900/50 dark:border dark:border-white/10 rounded-2xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex gap-3">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/150x150?text=No+Image';
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-900 dark:text-white">₹{shippingCost}</span>
                </div>
                {couponValue > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{(cartTotal * couponValue).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-white/10">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-indigo-600 dark:text-indigo-400">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="input-field flex-1"
                  />
                  <button className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600">
                    <FiTag />
                  </button>
                </div>

                {errors && <p className="text-sm text-red-600 mb-3">{errors}</p>}

                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full btn-primary py-3 rounded-full font-semibold disabled:opacity-50"
                >
                  {processing ? 'Processing...' : (paymentMethod === 'cod' ? 'Place Order' : 'Pay securely')}
                </button>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                  By continuing, you agree to our Terms & Privacy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Checkout;
