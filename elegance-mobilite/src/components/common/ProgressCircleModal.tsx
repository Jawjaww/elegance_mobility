import React, { useEffect, useState } from 'react';

interface ProgressCircleModalProps {
  open: boolean;
  text?: string;
  simulate?: boolean; // Si true, la progression est simulée automatiquement
  duration?: number; // Durée de la simulation en ms (par défaut 2000)
}

export const ProgressCircleModal: React.FC<ProgressCircleModalProps> = ({
  open,
  text = 'Chargement en cours...',
  simulate = true,
  duration = 2000,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (open && simulate) {
      setProgress(0);
      const start = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - start;
        const percent = Math.min(100, Math.round((elapsed / duration) * 100));
        setProgress(percent);
        if (percent >= 100) clearInterval(timer);
      }, 30);
      return () => clearInterval(timer);
    } else if (!open) {
      setProgress(0);
    }
  }, [open, simulate, duration]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-neutral-900 rounded-xl shadow-lg p-8 flex flex-col items-center min-w-[280px]">
        <div className="mb-4">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#444"
              strokeWidth="8"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
              style={{ transition: 'stroke-dashoffset 0.2s linear' }}
            />
            <text
              x="32"
              y="38"
              textAnchor="middle"
              fontSize="18"
              fill="#fff"
              fontWeight="bold"
            >
              {progress}%
            </text>
          </svg>
        </div>
        <div className="text-lg text-neutral-200 font-medium text-center mb-2">{text}</div>
        <div className="text-xs text-neutral-400">Veuillez patienter...</div>
      </div>
    </div>
  );
};

export default ProgressCircleModal;
