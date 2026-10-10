import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';


const ConfirmContext = createContext();

export const useConfirm = () => {
  return useContext(ConfirmContext);
};

export const ConfirmProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({
    title: 'Confirm',
    message: 'Are you sure?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: false,
  });
  const [resolver, setResolver] = useState(null);

  const confirm = useCallback((opts) => {
    setOptions({
      title: opts.title || 'Confirm',
      message: opts.message || 'Are you sure?',
      confirmText: opts.confirmText || 'Confirm',
      cancelText: opts.cancelText || 'Cancel',
      isDanger: opts.isDanger || false,
    });
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${options.isDanger ? 'bg-red-100 text-red-600 dark:bg-red-500/20' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    {options.title}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {options.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                {options.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition shadow-lg ${
                  options.isDanger
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30'
                    : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/30'
                }`}
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
