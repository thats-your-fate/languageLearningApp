/* eslint-disable @next/next/no-css-tags */
import type { Metadata } from "next";
import { Fraunces, Manrope, Space_Grotesk } from "next/font/google";
import Link from "next/link";

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
  title: "Lighthouse Language",
  description: "A focused mobile app that turns vocabulary into sentence, writing, and speaking practice with optional AI coaching.",
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

function Header() {
  return (
    <header>
      <div className="position-absolute top-0 start-0 w-100">
        <nav className="navbar navbar-expand-lg navbar-transparent z-5 p-0 shadow-none">
          <div className="container">
            <Logo />
            <div className="d-none d-lg-flex align-self-stretch z-35 position-relative">
              <ul className="navbar-nav mx-auto gap-4 align-items-lg-center">
                <li className="nav-item">
                  <Link className="nav-link text-uppercase" href="/">
                    Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-uppercase" href="/templates">
                    Screens
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-uppercase" href="/pricing">
                    App
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-uppercase" href="/privacy">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
            <div className="d-flex align-items-center gap-4 align-self-stretch">
              <Link href="/privacy" className="btn btn-dashed d-none d-md-flex">
                privacy policy
                <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M15.8167 7.55759 12.5504 4.307C12.3057 4.06353 11.91 4.06444 11.6665 4.30912C11.423 4.55378 11.4239 4.9495 11.6686 5.193L13.8612 7.375H.625C.279813 7.375 0 7.65481 0 8C0 8.34519.279813 8.625.625 8.625H13.8612L11.6686 10.807C11.4239 11.0505 11.423 11.4462 11.6665 11.6909C11.91 11.9356 12.3058 11.9364 12.5504 11.693L15.8162 8.443C16.0615 8.19809 16.0607 7.80109 15.8167 7.55759Z" fill="#B1E346" />
                </svg>
              </Link>
              <Link className="burger-icon burger-icon-white border rounded-3 top-0 end-0 d-lg-none" href="/privacy" aria-label="Open privacy policy">
                <span className="burger-icon-top" />
                <span className="burger-icon-mid" />
                <span className="burger-icon-bottom" />
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
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
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
