import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Sparkles, X, Check, BookOpen } from 'lucide-react';
import { Benefit } from '../types';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'info' | 'warning';
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-emerald-800 text-white border-emerald-600',
    info: 'bg-brand-emerald-dark text-white border-brand-gold',
    warning: 'bg-amber-800 text-white border-amber-600'
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, type: 'spring', damping: 20 }}
      className={`fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 p-4 rounded-xl border shadow-xl flex items-center justify-between gap-3 ${bgColor}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-lg">
          {type === 'success' ? (
            <Check className="w-5 h-5 text-brand-gold-light" />
          ) : (
            <Bell className="w-5 h-5 text-brand-gold-light" />
          )}
        </div>
        <p className="text-sm font-medium font-sans leading-relaxed">{message}</p>
      </div>
      <button onClick={onClose} className="text-white/75 hover:text-white transition-colors p-1 hover:bg-white/5 rounded">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

interface AndroidSystemNotificationProps {
  benefit: Benefit | null;
  onClose: () => void;
  onView: () => void;
}

export const AndroidSystemNotification: React.FC<AndroidSystemNotificationProps> = ({ benefit, onClose, onView }) => {
  if (!benefit) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed top-4 left-4 right-4 max-w-lg mx-auto z-50 bg-[#121212]/95 text-white rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden font-sans custom-shadow"
    >
      <div className="p-4">
        {/* Android status header */}
        <div className="flex items-center justify-between mb-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
            <span className="font-bold tracking-wide">جامع الفوائد</span>
            <span>• الآن</span>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notification body */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-emerald flex items-center justify-center shrink-0 border border-brand-gold/30">
            <Sparkles className="w-5 h-5 text-brand-gold-light" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-brand-gold-light leading-tight line-clamp-1">
              تنبيه بفائدة عشوائية: {benefit.title}
            </h4>
            <p className="text-xs text-zinc-300 mt-1 line-clamp-2 leading-relaxed font-serif">
              {benefit.content}
            </p>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
              <span>الفئة: {benefit.category}</span>
              {benefit.source && <span>• المصدر: {benefit.source}</span>}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-zinc-800/80">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            إغلاق
          </button>
          <button
            onClick={() => {
              onView();
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-semibold bg-brand-emerald text-white hover:bg-brand-emerald-light rounded-lg transition-colors flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3" />
            قراءة الفائدة
          </button>
        </div>
      </div>
    </motion.div>
  );
};
