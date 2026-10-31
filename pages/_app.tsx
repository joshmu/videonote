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

import "@/styles/globals.css";

import { AnimatePresence, MotionConfig } from "motion/react";
import { AppProps } from "next/app";
import { Playfair_Display, Roboto } from "next/font/google";

import { NotificationProvider } from "@/context/notificationContext";

import { ThemeProvider } from "../src/context/themeContext";

const playfair = Playfair_Display({ subsets: ["latin"] });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });

const MyApp = ({ Component, pageProps, router }: AppProps) => {
  return (
    <NotificationProvider>
      <style jsx global>{`
        :root {
          --font-playfair: ${playfair.style.fontFamily};
          --font-roboto: ${roboto.style.fontFamily};
        }
      `}</style>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <AnimatePresence mode="wait">
            <Component {...pageProps} key={router.route} />
          </AnimatePresence>
        </MotionConfig>
      </ThemeProvider>
    </NotificationProvider>
  );
};

export default MyApp;
