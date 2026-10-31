import Document, { DocumentContext, Head, Html, Main, NextScript } from "next/document";

import { applySavedThemeScript, ThemeType } from "@/context/themeContext";

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en" itemScope itemType="http://schema.org/WebPage">
        <Head />
        <body className={ThemeType.DARK}>
          <script dangerouslySetInnerHTML={{ __html: applySavedThemeScript }} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
