/* eslint-disable @next/next/no-css-tags */
import type { Metadata } from "next";
import { Fraunces, Manrope, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { LandingHeader } from "@/components/marketing/landing-header";

import "./globals.css";

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lighthouse-language-app.cc"),
  title: {
    default: "Lighthouse Language | Learn Vocabulary Through Sentences",
    template: "%s | Lighthouse Language",
  },
  description:
    "Lighthouse is a mobile language-learning app for practicing vocabulary, sentence recall, writing, speaking, pronunciation, and spaced repetition with optional AI coaching.",
  keywords: [
    "language learning app",
    "vocabulary flashcards",
    "sentence practice",
    "AI language tutor",
    "Portuguese learning app",
    "Italian learning app",
    "German learning app",
    "French learning app",
    "Spanish learning app",
    "spaced repetition",
  ],
  applicationName: "Lighthouse Language",
  authors: [{ name: "Lighthouse Language" }],
  creator: "Lighthouse Language",
  publisher: "Lighthouse Language",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Lighthouse Language",
    title: "Lighthouse Language | Learn Vocabulary Through Sentences",
    description:
      "Build active vocabulary with flashcards, sentence drills, writing practice, speaking practice, progress tracking, and optional AI feedback.",
    images: [
      {
        url: "/app-screens/screen-2.png",
        width: 945,
        height: 2048,
        alt: "Lighthouse Language AI writing practice screen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lighthouse Language",
    description:
      "Practice words until they become sentences with flashcards, speech, writing, and optional AI coaching.",
    images: ["/app-screens/screen-2.png"],
  },
};

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link className="navbar-brand py-5" href="/">
      <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path className="fill-primary" d="M20 2.8 32.4 9v12.5c0 8-5.3 13.2-12.4 15.7C12.9 34.7 7.6 29.5 7.6 21.5V9L20 2.8Z" />
        <path fill="#111827" d="M14.5 19.6c0-3.2 2.2-5.8 5.5-5.8s5.5 2.6 5.5 5.8c0 3.5-2.4 5.7-5.5 7.1-3.1-1.4-5.5-3.6-5.5-7.1Z" opacity=".92" />
        <path fill="#fff" d="M20 12.2a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z" />
      </svg>
      <h5 className={`mb-0 ${dark ? "text-dark" : "text-white"}`}>Lighthouse</h5>
    </Link>
  );
}

function Footer() {
  return (
    <footer>
      <div className="section-footer-18 position-relative overflow-hidden">
        <div className="container-fluid">
          <div className="container position-relative z-2">
            <div className="row align-items-center py-120">
              <div className="col-lg-6 col-md-10 col-11">
                <span className="content-top btn-text text-white">ready to learn smarter</span>
                <h2 className="my-3 text-primary position-relative">
                  Turn
                  <span className="text-white"> vocabulary into </span>
                  <span className="stroke-primary text-dark">conversation</span>
                </h2>
              </div>
              <div className="col-lg-6 ps-lg-10">
                <p className="fs-5 text-white opacity-75 mb-0">
                  Lighthouse helps learners build recall through short, focused sessions that connect words, examples, writing, and speech.
                </p>
              </div>
            </div>
            <div className="d-flex flex-column flex-lg-row gap-3 align-items-center justify-content-between py-4 border-top border-bottom border-opacity-25 border-white">
              <Logo />
              <div className="d-flex align-items-center justify-content-center flex-wrap gap-md-5 gap-3">
                <Link href="/templates">
                  <span className="btn-text text-white">Screens</span>
                </Link>
                <Link href="/pricing">
                  <span className="btn-text text-white">App details</span>
                </Link>
                <Link href="/privacy">
                  <span className="btn-text text-white">Privacy</span>
                </Link>
              </div>
            </div>
            <div className="d-flex flex-column flex-lg-row gap-3 align-items-center py-4 justify-content-between">
              <p className="text-white opacity-50 mb-0">Lighthouse Language. Practice words until they become sentences.</p>
              <p className="text-white opacity-50 mb-0">Contact: support@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${space.variable} ${fraunces.variable} ${manrope.variable}`}>
      <body>
        <link rel="stylesheet" href="/assets/css/vendors/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/vendors/swiper-bundle.min.css" />
        <link rel="stylesheet" href="/assets/css/vendors/aos.css" />
        <link rel="stylesheet" href="/assets/css/vendors/carouselTicker.css" />
        <link rel="stylesheet" href="/assets/css/vendors/odometer.css" />
        <link rel="stylesheet" href="/assets/css/vendors/magnific-popup.css" />
        <link rel="stylesheet" href="/assets/fonts/bootstrap-icons/bootstrap-icons.min.css" />
        <link rel="stylesheet" href="/assets/fonts/boxicons/boxicons.min.css" />
        <link rel="stylesheet" href="/assets/fonts/remixicon/remixicon.css" />
        <link rel="stylesheet" href="/assets/fonts/fontawesome/fontawesome.min.css" />
        <link rel="stylesheet" href="/assets/fonts/fontawesome/solid.min.css" />
        <link rel="stylesheet" href="/assets/fonts/fontawesome/regular.min.css" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <LandingHeader />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
