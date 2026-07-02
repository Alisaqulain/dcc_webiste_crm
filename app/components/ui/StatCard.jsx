'use client';

import { motion } from 'framer-motion';

export default function StatCard({ value, label, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="dcc-card-hover p-6 sm:p-7 text-center group"
    >
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-red-600 to-red-700 bg-clip-text text-transparent mb-1.5">
        {value}
      </div>
      <div className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">{label}</div>
    </motion.div>
  );
}
