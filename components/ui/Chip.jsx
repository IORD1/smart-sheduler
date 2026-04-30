import Icon from './Icon';

export default function Chip({ kind, children, icon, style }) {
  return (
    <span className={`ss-chip ${kind || ''}`} style={style}>
      {icon ? <Icon name={icon} size={11} stroke={2} /> : null}
      {children}
    </span>
  );
}
