import React from 'react';
import './StaticPages.css';

const About = () => {
    return (
        <div className="legacy-container">
            <div className="legacy-content-wrapper">

                <section className="hero-section">
                    <span className="eyebrow">Our Story</span>
                    <h1 className="hero-title">Beyond the Fabric.</h1>
                    <p className="hero-desc">MetroClassy isn't just a clothing brand. It's a statement. A fusion of modern minimalism and bold anime aesthetics, designed for those who speak without saying a word.</p>
                </section>

                <section className="founder-card">
                    <div className="founder-content">
                        <span className="eyebrow" style={{ color: 'var(--accent-purple)' }}>Founder's Note</span>
                        <h2>A personal touch in a digital world.</h2>
                        <p>
                            "I started MetroClassy with a simple frustration: fashion was either too loud or too boring. I wanted a middle ground—clothing that felt premium, looked sharp, but allowed you to express your unique interests, be it anime, tech, or art."
                        </p>
                        <p>
                            "We don't just print designs; we curate experiences. Every hoodie, every stitch is a promise of quality."
                        </p>

                        <div className="signature-area">
                            <span className="signature-text">MetroClassy Founder</span>
                            <span className="founder-role">Creative Director</span>
                        </div>
                    </div>

                    <div className="founder-visual">
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1">
                            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                            <path d="M2 2l7.586 7.586"></path>
                            <circle cx="11" cy="11" r="2"></circle>
                        </svg>
                    </div>
                </section>

                <section className="values-grid">
                    <div className="value-card">
                        <div className="value-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>
                        </div>
                        <h3>Premium Craft</h3>
                        <p>We source only high-GSM fabrics that stand the test of time and wash cycles.</p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                        </div>
                        <h3>User First</h3>
                        <p>Designed for comfort. From the fit to the finish, you are the priority.</p>
                    </div>
                    <div className="value-card">
                        <div className="value-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </div>
                        <h3>Exclusive Drops</h3>
                        <p>Limited edition capsules that ensure your look remains unique.</p>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default About;
