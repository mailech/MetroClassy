import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';

const GoogleLoginBtn = ({ onSuccess, onError }) => {
    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => onSuccess(tokenResponse),
        onError: (error) => onError(error),
        flow: 'implicit', // Get access token directly
    });

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white py-3 px-4 rounded-xl font-medium transition-all hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm"
        >
            <FcGoogle size={22} />
            <span>Continue with Google</span>
        </motion.button>
    );
};

export default GoogleLoginBtn;
