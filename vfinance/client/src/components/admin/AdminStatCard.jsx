// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

const AdminStatCard = ({
  title,
  value,
  isCurrency = false,
  prefix = '',
  suffix = '',
  subtitle,
  badge,
  badgeColor = 'bg-pink-50 text-pink-700 border-pink-200/80',
  icon: Icon,
  gradient = 'from-pink-500 to-purple-600',
  glowColor = 'rgba(244,114,182,0.2)',
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_10px_35px_-12px_rgba(225,29,72,0.08),0_4px_16px_-3px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300 hover:border-pink-200/80 hover:shadow-[0_16px_45px_-10px_rgba(225,29,72,0.14),0_8px_25px_-5px_rgba(0,0,0,0.05)] ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Subtle background ambient aura */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-2xl transition-opacity duration-300 group-hover:opacity-60"
        style={{ background: glowColor }}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {title}
            </span>
            {badge && (
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${badgeColor}`}
              >
                {badge}
              </span>
            )}
          </div>

          <div className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900">
            <AnimatedCounter
              value={value}
              isCurrency={isCurrency}
              prefix={prefix}
              suffix={suffix}
            />
          </div>
        </div>

        {/* Icon Chip */}
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr ${gradient} text-white shadow-md shadow-pink-500/15 transition-transform duration-300 group-hover:scale-110`}
        >
          {Icon && <Icon className="h-6 w-6 drop-shadow-xs" />}
        </div>
      </div>

      {subtitle && (
        <div className="relative z-10 mt-4 flex items-center gap-1.5 border-t border-slate-100/80 pt-3 text-xs font-semibold text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
          <span>{subtitle}</span>
        </div>
      )}
    </motion.div>
  );
};

export default AdminStatCard;
