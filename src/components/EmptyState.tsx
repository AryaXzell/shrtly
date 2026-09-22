import React from 'react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  illustration: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration,
  title,
  description,
  action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="py-12 px-4 text-center max-w-sm mx-auto flex flex-col items-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut",
        }}
        className="mb-6 drop-shadow-xl"
      >
        {illustration}
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-2"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed max-w-xs"
      >
        {description}
      </motion.p>
      {action && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium text-xs sm:text-sm transition-all shadow-sm shadow-neutral-950/10 dark:shadow-neutral-500/5 hover:opacity-90 cursor-pointer whitespace-nowrap"
        >
          {action.icon}
          <span>{action.label}</span>
        </motion.button>
      )}
    </motion.div>
  );
};
