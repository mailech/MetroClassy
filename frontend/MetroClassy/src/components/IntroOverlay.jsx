
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import introVideo from '../assets/intro-video.mp4';

const IntroOverlay = () => {
    const [show, setShow] = useState(() => {
        return !sessionStorage.getItem('introPlayed');
    });

    useEffect(() => {
        if (show) {
            sessionStorage.setItem('introPlayed', 'true');
        }
    }, [show]);

    const handleVideoEnd = () => {
        setShow(false);
    };

    if (!show) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center"
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                {/* Animated background pattern */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 40% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
            `
                    }}
                />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 w-full max-w-4xl px-4"
                >
                    <video
                        src={introVideo}
                        autoPlay
                        muted
                        playsInline
                        onEnded={handleVideoEnd}
                        preload="auto"
                        className="w-full h-auto rounded-2xl shadow-2xl"
                        style={{
                            maxHeight: '80vh',
                            objectFit: 'contain',
                        }}
                    />
                </motion.div>

                {/* Skip button */}
                <button
                    onClick={handleVideoEnd}
                    className="absolute bottom-8 right-8 px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-full font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30"
                >
                    Skip Intro
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default IntroOverlay;
