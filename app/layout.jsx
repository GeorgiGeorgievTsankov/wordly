import './globals.css';
import { STRINGS } from '@/lib/constants/strings';

export const metadata = {
  title: `${STRINGS.appName} — ${STRINGS.tagline}`,
  description: STRINGS.heroSubtitle,
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-screen flex-col font-sans antialiased bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
