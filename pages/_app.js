import "styles/globals.css";
import { AuthProvider } from "context/AuthContext.js";

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);

  return <AuthProvider>{getLayout(<Component {...pageProps} />)}</AuthProvider>;
}
