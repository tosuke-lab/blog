import "tailwindcss/tailwind.css";
import "../styles/global.css";
import "../styles/highlight.css";
import type { NextPage } from "next";
import type { AppProps } from "next/app";

const App: NextPage<AppProps> = ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};

export default App;
