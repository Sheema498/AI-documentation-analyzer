import type { ReactNode } from 'react';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  color?: string;
  delay?: number;
}

export function StatCard({ icon, label, value, decimals = 0, suffix = '', color = '#3b82f6', delay = 0 }: StatCardProps) {
  return (
    <div
      className="glass card-hover rounded-xl p-4 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-100">
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function InfoCard({ title, icon, children, className = '', delay = 0 }: InfoCardProps) {
  return (
    <div
      className={`glass rounded-xl p-5 animate-slide-up ${className}`}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-blue-400">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}
