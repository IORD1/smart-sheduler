import Script from 'next/script';
import './globals.css';
import 'react-loading-skeleton/dist/skeleton.css';

export const metadata = {
  title: 'Smart Scheduler',
  description: 'Brain dump. AI plans the day.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Scheduler',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090C',
};

// Registers the service worker so Chrome offers the Install prompt.
const swBootstrap = `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`;

// Runs before first paint — applies theme + accent from localStorage so there's no flash.
const themeBootstrap = `(function(){try{
var p={lime:['#C5FF4A','rgba(197,255,74,0.18)','#0A0F00'],sky:['#5DC7F5','rgba(93,199,245,0.22)','#001624'],rose:['#FF7AB6','rgba(255,122,182,0.22)','#220018'],amber:['#FFB347','rgba(255,179,71,0.22)','#221400']};
var t=localStorage.getItem('smart_sheduler_theme')||'dark';
var a=localStorage.getItem('smart_sheduler_accent')||'lime';
var pr=p[a]||p.lime;
document.documentElement.dataset.theme=t;
document.documentElement.style.setProperty('--go',pr[0]);
document.documentElement.style.setProperty('--go-glow',pr[1]);
document.documentElement.style.setProperty('--go-fg',pr[2]);
}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <Script src="https://apis.google.com/js/api.js" strategy="afterInteractive" />
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Script id="sw-register" strategy="afterInteractive">{swBootstrap}</Script>
        {children}
      </body>
    </html>
  );
}
