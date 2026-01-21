import React from 'react';
import './StaticPages.css';

const Shipping = () => {
    return (
        <div className="legacy-container">
            <div className="legacy-content-wrapper">
                <div className="policy-header">
                    <h1 className="policy-title">Return & Exchange Policy</h1>
                    <p className="policy-intro">
                        At Metroclassy, we strive to ensure that you are satisfied with your purchase. If for any reason you're not happy with your order, we offer a hassle-free return and exchange process within <span className="highlight">10 to 15 days</span> from the date of delivery.
                    </p>
                </div>

                <div className="policy-section">
                    <h3>1. Eligibility Criteria</h3>
                    <ul className="policy-list">
                        <li>The product must be unused and in its original condition.</li>
                        <li>All tags should be intact and attached to the item.</li>
                        <li>The original packaging must be preserved.</li>
                        <li>The bill should be intact and not damaged.</li>
                        <li><strong>Important:</strong> For security purposes, a <span className="highlight">video of the unboxing is required</span> when returning or exchanging the item.</li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h3>2. Non-Returnable Items</h3>
                    <ul className="policy-list">
                        <li>Sale items marked as "final sale".</li>
                        <li>Products that have been worn, washed, or used for hygiene reasons.</li>
                        <li>Customized products (e.g., personalized T-shirts) are not eligible for returns or exchanges.</li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h3>3. Return Process</h3>
                    <ul className="policy-list">
                        <li>You can request a return or exchange by contacting our customer service team via email or phone.</li>
                        <li>Returns and exchanges are processed after we have received the product and verified that it meets the eligibility criteria.</li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h3>4. Refunds</h3>
                    <ul className="policy-list">
                        <li>Refunds will be processed by transferring the amount back to your original payment method (card or bank account).</li>
                        <li>The processing time for refunds may vary depending on your payment provider.</li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h3>5. Exchange Process</h3>
                    <ul className="policy-list">
                        <li>If you want an exchange, please contact our customer service team, and we will assist you in selecting the desired item.</li>
                        <li>The product you wish to exchange must be of the same price as the original product. If the exchange product is of higher value, you will be required to pay the additional fee to cover the price difference.</li>
                        <li>The exchange will be processed based on product availability.</li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h3>6. Exceptions</h3>
                    <p className="policy-text">Metroclassy reserves the right to refuse returns or exchanges for items that do not meet the eligibility criteria or that have been damaged due to misuse.</p>
                </div>

                <div className="contact-box">
                    <p>We understand that sometimes things don’t work out, and we're here to ensure that you have a smooth experience.</p>
                    <p style={{ marginTop: '20px' }}>
                        <strong>Email:</strong> contact@metroclassy.com<br />
                        <strong>Phone:</strong> +91 88128 88298
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Shipping;
