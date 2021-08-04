import Document, { Html, Head, Main, NextScript } from "next/document";

export default class AppDocument extends Document {
  render(): JSX.Element {
    return (
      <Html lang="ja" prefix="og: http://ogp.me/ns#">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
