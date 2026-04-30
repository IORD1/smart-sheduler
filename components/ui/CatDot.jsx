export default function CatDot({ k, size = 8, style }) {
  return <span className={`ss-dot ${k || ''}`} style={{ width: size, height: size, ...style }} />;
}
