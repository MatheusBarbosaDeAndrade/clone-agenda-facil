export default function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={36} />}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
