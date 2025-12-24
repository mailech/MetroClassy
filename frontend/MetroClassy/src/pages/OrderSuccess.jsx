import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiPackage, FiHome } from 'react-icons/fi';

const OrderSuccess = () => {
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const location = useLocation();
    const orderNumber = location.state?.orderNumber || `MC${Math.floor(Math.random() * 90000) + 10000}`;

    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            <Confetti
                width={dimensions.width}
                height={dimensions.height}
                recycle={false}
                numberOfPieces={500}
                gravity={0.15}
            />

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative z-10 border border-gray-100 dark:border-white/10"
            >
                <div className="flex justify-center mb-6">
                    <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-inner"
                    >
                        <FiCheckCircle size={48} />
                    </motion.div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Order Placed!</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Your order #{orderNumber} has been successfully processed.
                </p>

                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-8 text-left space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <FiPackage />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-200">Preparing Shipment</h3>
                            <p className="text-sm text-gray-500">We're packing your order with care.</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3">
                    <Link
                        to="/dashboard"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-transform active:scale-95"
                    >
                        View Order Details
                    </Link>
                    <Link
                        to="/"
                        className="w-full bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <FiHome /> Return Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderSuccess;
