import Head from "next/head";
import { Schibsted_Grotesk } from "next/font/google";
import { ToastProvider } from "components/Toast.jsx";
import CookieNotice from "components/CookieNotice.jsx";
import "styles/globals.css";

// next/font baixa a fonte no build e a serve do próprio domínio:
// nenhum dado do visitante é enviado ao Google (privacidade/LGPD).
const font = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style jsx global>{`
        :root {
          --font-sans: ${font.style.fontFamily};
        }
      `}</style>
      <ToastProvider>
        <Component {...pageProps} />
        <CookieNotice />
      </ToastProvider>
    </>
  );
}
