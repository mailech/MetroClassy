import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

export default function Notification() {
  const [notification, setNotification] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleNotification = (event) => {
      const { message, type = 'info' } = event.detail;
      setNotification({ message, type });
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false);
      }, 4000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('show-notification', handleNotification);

    return () => {
      window.removeEventListener('show-notification', handleNotification);
    };
  }, []);

  const getIcon = () => {
    switch (notification?.type) {
      case 'success':
        return <FiCheckCircle className="text-green-600" />;
      case 'error':
        return <FiAlertCircle className="text-red-600" />;
      default:
        return <FiInfo className="text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (notification?.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (notification?.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <AnimatePresence>
      {show && notification && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className={`fixed top-4 left-1/2 z-50 ${getBgColor()} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md`}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">{getIcon()}</div>
            <p className={`flex-1 text-sm font-medium ${getTextColor()}`}>
              {notification.message}
            </p>
            <button
              onClick={() => setShow(false)}
              className={`flex-shrink-0 ${getTextColor()} hover:opacity-70`}
            >
              <FiX />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

