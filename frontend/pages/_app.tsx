import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Head from 'next/head';
import ErrorBoundary from '../components/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>审核系统</title>
      </Head>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}