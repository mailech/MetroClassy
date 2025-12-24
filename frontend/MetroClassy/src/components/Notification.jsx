import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiX, FiAlertCircle, FiInfo, FiXCircle } from 'react-icons/fi';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (event) => {
      const { message, type = 'info', duration = 3000 } = event.detail;
      const id = Date.now();
      
      setNotifications((prev) => [...prev, { id, message, type }]);
      
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    };

    window.addEventListener('show-notification', handleNotification);
    return () => window.removeEventListener('show-notification', handleNotification);
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <FiXCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <FiAlertCircle className="h-5 w-5 text-yellow-400" />;
      default:
        return <FiInfo className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      default:
        return 'bg-blue-50';
    }
  };

  const getTextColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 flex items-start justify-end p-4 pointer-events-none z-50">
      <div className="w-full max-w-sm space-y-4">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: '100%', transition: { duration: 0.2 } }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`${getBgColor(notification.type)} rounded-lg shadow-lg overflow-hidden pointer-events-auto`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className={`text-sm font-medium ${getTextColor(notification.type)}`}>
                      {notification.message}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <span className="sr-only">Close</span>
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              {notification.duration > 0 && (
                <motion.div
                  className="h-1 bg-opacity-50 bg-gray-400"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: notification.duration / 1000, ease: 'linear' }}
                  onAnimationComplete={() => removeNotification(notification.id)}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Helper function to show notifications
export const showNotification = (message, type = 'info', duration = 3000) => {
  const event = new CustomEvent('show-notification', {
    detail: { message, type, duration },
  });
  window.dispatchEvent(event);
};

export default Notification;
