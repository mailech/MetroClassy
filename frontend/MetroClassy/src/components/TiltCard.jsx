import { motion } from "framer-motion";

const TiltCard = ({ children, className = "", ...props }) => {
    return (
        <motion.div
            whileHover={{
                y: -8,
                transition: { duration: 0.3, ease: "easeOut" }
            }}
            className={`relative transition-all duration-300 ease-out ${className}`}
            {...props}
        >
            <div className="h-full w-full">
                {children}
            </div>
        </motion.div>
    );
};

export default TiltCard;
