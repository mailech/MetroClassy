import { useState, useEffect } from 'react';
import './IntroOverlay.css';
import logo1 from '../assets/logo1.png';

const IntroOverlay = () => {
    // Check session storage to show only once per session
    const [visible, setVisible] = useState(() => {
        return !sessionStorage.getItem('introPlayed');
    });
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (!visible) return;

        // Mark as played
        sessionStorage.setItem('introPlayed', 'true');

        // Wait for LOAD_TIME then exit
        const timer = setTimeout(() => {
            setExiting(true);

            // Wait for animation to finish before unmounting
            setTimeout(() => {
                setVisible(false);
            }, 600); // 0.6s match the CSS transition

        }, 5000); // 5 seconds load time

        return () => clearTimeout(timer);
    }, [visible]);

    if (!visible) return null;

    return (
        <div className={`splash-container ${exiting ? 'slide-up-exit' : ''}`} id="app-frame">
            <div className="mobile-frame">

                <div className="marquee-container">
                    <div className="marquee-row scroll-left">Collection Collection Collection Collection</div>
                    <div className="marquee-row scroll-right">New Season New Season New Season New Season</div>
                    <div className="marquee-row scroll-left">Exclusive Exclusive Exclusive Exclusive</div>
                    <div className="marquee-row scroll-right">Loading Loading Loading Loading</div>
                    <div className="marquee-row scroll-left">Metroclassy Metroclassy Metroclassy Metroclassy</div>
                </div>

                <div className="content-layer">
                    <img src={logo1} alt="Logo" className="logo-img" />

                    <div className="frequency-loader">
                        <div className="freq-bar"></div>
                        <div className="freq-bar"></div>
                        <div className="freq-bar"></div>
                        <div className="freq-bar"></div>
                        <div className="freq-bar"></div>
                        <div className="freq-bar"></div>
                        <div className="freq-bar"></div>
                    </div>

                    <div className="catchy-text">Curating Collection</div>
                </div>

                <div className="version-text">V.2.0.24 // SECURE</div>
            </div>
        </div>
    );
};

export default IntroOverlay;
