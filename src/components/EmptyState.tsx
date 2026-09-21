import React from 'react';

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
    <div className="py-12 px-4 text-center max-w-sm mx-auto flex flex-col items-center">
      <div className="mb-5">{illustration}</div>
      <h3 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium text-sm transition-transform active:scale-95 shadow-sm hover:opacity-90"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
