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
          <meta name="og:title" content="Github LabelSync" />
          <meta name="og:type" content="website" />
          <meta name="og:url" content="https://label-sync.com" />
          <meta
            name="og:image"
            content="https://label-sync.com/assets/thumbnail.png"
          />
          <meta
            name="description"
            content="Managing Github labels is hard. LabelSync makes it easy."
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
