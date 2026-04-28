import '../styles/globals.css';
import { AuthProvider } from '../hooks/useAuth';

export const metadata = {
  title: '♠ Crypto Spades',
  description: 'Multiplayer Spades with test ETH betting',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
