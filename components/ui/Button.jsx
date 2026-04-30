export default function Button({ variant = 'go', children, className = '', ...props }) {
  return (
    <button type="button" className={`ss-btn ${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
