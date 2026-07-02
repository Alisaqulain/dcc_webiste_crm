'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/35 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none';

const variants = {
  primary:
    'bg-gradient-to-b from-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-md shadow-red-600/25 hover:shadow-lg hover:shadow-red-600/35',
  secondary:
    'bg-white text-slate-800 border border-slate-200 hover:border-red-200 hover:bg-red-50/70 shadow-sm hover:shadow-md',
  ghost: 'text-slate-700 hover:text-red-600 hover:bg-red-50/80',
  dark: 'bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white shadow-md shadow-slate-900/20',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export default function PrimaryButton({
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  external,
}) {
  const classes = `${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

  const motionProps = {
    whileHover: disabled ? undefined : { y: -2, scale: 1.01 },
    whileTap: disabled ? undefined : { scale: 0.98, y: 0 },
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  };

  if (href) {
    if (external || href.startsWith('http')) {
      return (
        <motion.a href={href} className={classes} {...motionProps} target="_blank" rel="noopener noreferrer">
          {children}
        </motion.a>
      );
    }
    return (
      <motion.div {...motionProps} className="inline-flex">
        <Link href={href} className={classes}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
