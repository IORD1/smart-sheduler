export default function PhoneFrame({ children }) {
  return (
    <div className="ss-page">
      <div className="ss-phone">
        <div className="ss-screen">{children}</div>
      </div>
    </div>
  );
}
