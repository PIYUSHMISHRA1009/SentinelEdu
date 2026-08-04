import React from 'react';
import { motion } from 'framer-motion';

export const FadeIn: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.45 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
