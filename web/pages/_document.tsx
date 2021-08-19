import React from 'react'
import Document, { Head, Main, NextScript } from 'next/document'

export default class extends Document {
  render() {
    return (
      <html>
        {/* Head */}
        <Head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta httpEquiv="X-UA-Compatible" content="ie=edge" />

          {/* Twitter */}
          <meta name="og:title" content="GitHub LabelSync" />
          <meta name="og:type" content="website" />
          <meta name="og:url" content="https://label-sync.com" />
          <meta
            name="og:image"
            content="https://label-sync.com/assets/thumbnail.png"
          />
          <meta
            name="description"
            content="Sync your GitHub labels as effortlessly as possible."
          />

          {/* Robots */}
          <meta name="robots" content="index, follow" />

          {/* Icons */}
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <link rel="manifest" href="/site.webmanifest" />

          {/* Splitbee */}
          <script async src="https://cdn.splitbee.io/sb.js" />

          {/* Crisp */}
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `window.$crisp=[];window.CRISP_WEBSITE_ID="f485b5a2-8a24-43ec-8783-7542d6ef3c25";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,
            }}
          />
        </Head>

        {/* App */}
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}
