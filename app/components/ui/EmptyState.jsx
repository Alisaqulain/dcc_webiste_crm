import PrimaryButton from './PrimaryButton';

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}) {
  return (
    <div className="text-center py-16 px-6 dcc-card border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50/50">
      {icon && <div className="mb-5 flex justify-center text-slate-300">{icon}</div>}
      <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">{title}</h3>
      {description && (
        <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">{description}</p>
      )}
      {actionLabel && actionHref && (
        <PrimaryButton href={actionHref}>{actionLabel}</PrimaryButton>
      )}
      {actionLabel && onAction && (
        <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
      )}
    </div>
  );
}
