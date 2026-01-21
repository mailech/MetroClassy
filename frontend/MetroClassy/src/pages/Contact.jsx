import React, { useState } from 'react';
import './StaticPages.css';

const Contact = () => {
    const [submitted, setSubmitted] = useState(false);
    const [name, setName] = useState('');
    const [successName, setSuccessName] = useState('there');

    const handleSubmit = (e) => {
        e.preventDefault();
        const firstName = name.split(' ')[0] || 'there';
        setSuccessName(firstName);
        setSubmitted(true);
    };

    return (
        <div className="legacy-container">
            <div className="legacy-content-wrapper">
                <main className="flex flex-col items-center justify-center p-4">
                    <div className="contact-card">
                        <div className="card-info">
                            <h1>Let's talk style.</h1>
                            <p>Have questions about the latest insignia capsules? Reach out to our design team.</p>

                            <div className="info-list">
                                <div className="item">
                                    <div className="icon-box">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                    </div>
                                    <span>contact@metroclassy.com</span>
                                </div>
                                <div className="item">
                                    <div className="icon-box">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    </div>
                                    <span>Guwahati, Assam</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-wrapper relative min-h-[400px]">

                            {!submitted ? (
                                <form className="card-form opacity-100 transition-opacity duration-500" onSubmit={handleSubmit}>
                                    <div className="mb-5">
                                        <label className="block text-sm text-[var(--text-muted)] mb-2 ml-1">Your Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[var(--element-bg)] border border-transparent text-[var(--text-main)] p-3.5 rounded-xl text-sm outline-none focus:border-[var(--accent-purple)] focus:bg-[var(--bg-card)] transition-all"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="mb-5">
                                        <label className="block text-sm text-[var(--text-muted)] mb-2 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full bg-[var(--element-bg)] border border-transparent text-[var(--text-main)] p-3.5 rounded-xl text-sm outline-none focus:border-[var(--accent-purple)] focus:bg-[var(--bg-card)] transition-all"
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>
                                    <div className="mb-5">
                                        <label className="block text-sm text-[var(--text-muted)] mb-2 ml-1">Message</label>
                                        <textarea
                                            className="w-full bg-[var(--element-bg)] border border-transparent text-[var(--text-main)] p-3.5 rounded-xl text-sm outline-none focus:border-[var(--accent-purple)] focus:bg-[var(--bg-card)] transition-all min-h-[120px] resize-y"
                                            placeholder="How can we help?"
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full p-4 rounded-full bg-[var(--text-main)] text-[var(--bg-body-legacy)] border-none font-semibold cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all"
                                    >
                                        Send Message
                                    </button>
                                </form>
                            ) : (
                                <div className="success-view absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center animate-fadeIn">
                                    <div className="plane-container mb-5 text-[var(--accent-purple)]">
                                        <svg className="plane-icon animate-bounce" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                        </svg>
                                    </div>
                                    <h2 className="text-3xl text-[var(--text-main)] mb-2">Thanks, {successName}!</h2>
                                    <p className="text-[var(--text-muted)] font-light">Your message is on its way. We'll get back to you shortly.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Contact;
