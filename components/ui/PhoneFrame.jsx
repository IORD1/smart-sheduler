import StatusBar from './StatusBar';

export default function PhoneFrame({ children, time = '9:41' }) {
  return (
    <div className="ss-page">
      <div className="ss-phone">
        <StatusBar time={time} />
        <div className="ss-screen">{children}</div>
      </div>
    </div>
  );
}
