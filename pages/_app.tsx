/**
 * @path /pages/_app.tsx
 *
 * @project videonote
 * @file _app.tsx
 *
 * @author Josh Mu <hello@joshmu.dev>
 * @created Tuesday, 6th October 2020
 * @modified Monday, 30th November 2020 6:29:43 pm
 * @copyright © 2020 - 2020 MU
 */

import "@/styles/globals.scss";

import { AnimatePresence } from "motion/react";
import { AppProps } from "next/app";

import { NotificationProvider } from "@/context/notificationContext";

import { ThemeProvider } from "../src/context/themeContext";

const MyApp = ({ Component, pageProps, router }: AppProps) => {
  return (
    <NotificationProvider>
      <ThemeProvider>
        <AnimatePresence mode="wait">
          <Component {...pageProps} key={router.route} />
        </AnimatePresence>
      </ThemeProvider>
    </NotificationProvider>
  );
};

export default MyApp;
