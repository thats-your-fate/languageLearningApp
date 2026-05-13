"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/templates", label: "Screens" },
  { href: "/pricing", label: "App" },
  { href: "/privacy", label: "Privacy" },
  { href: "/support", label: "Support" },
];

function Logo() {
  return (
    <Link className="navbar-brand py-5" href="/" onClick={() => undefined}>
      <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path className="fill-primary" d="M20 2.8 32.4 9v12.5c0 8-5.3 13.2-12.4 15.7C12.9 34.7 7.6 29.5 7.6 21.5V9L20 2.8Z" />
        <path fill="#111827" d="M14.5 19.6c0-3.2 2.2-5.8 5.5-5.8s5.5 2.6 5.5 5.8c0 3.5-2.4 5.7-5.5 7.1-3.1-1.4-5.5-3.6-5.5-7.1Z" opacity=".92" />
        <path fill="#fff" d="M20 12.2a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Z" />
      </svg>
      <h5 className="mb-0 text-white">Lighthouse</h5>
    </Link>
  );
}

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header>
      <div className="position-absolute top-0 start-0 w-100">
        <nav className="navbar navbar-expand-lg navbar-transparent z-5 p-0 shadow-none">
          <div className="container">
            <Logo />
            <div className="d-none d-lg-flex align-self-stretch z-35 position-relative">
              <ul className="navbar-nav mx-auto gap-4 align-items-lg-center">
                {navItems.map((item) => (
                  <li className="nav-item" key={item.href}>
                    <Link className="nav-link text-uppercase" href={item.href}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="d-flex align-items-center gap-4 align-self-stretch">
              <Link href="/privacy" className="btn btn-dashed d-none d-md-flex">
                privacy policy
                <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M15.8167 7.55759 12.5504 4.307C12.3057 4.06353 11.91 4.06444 11.6665 4.30912C11.423 4.55378 11.4239 4.9495 11.6686 5.193L13.8612 7.375H.625C.279813 7.375 0 7.65481 0 8C0 8.34519.279813 8.625.625 8.625H13.8612L11.6686 10.807C11.4239 11.0505 11.423 11.4462 11.6665 11.6909C11.91 11.9356 12.3058 11.9364 12.5504 11.693L15.8162 8.443C16.0615 8.19809 16.0607 7.80109 15.8167 7.55759Z" fill="#B1E346" />
                </svg>
              </Link>
              <button
                className="burger-icon burger-icon-white border rounded-3 top-0 end-0 d-lg-none lighthouse-menu-button"
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
              >
                <span className="burger-icon-top" />
                <span className="burger-icon-mid" />
                <span className="burger-icon-bottom" />
              </button>
            </div>
          </div>
        </nav>
        {open ? (
          <div className="container d-lg-none lighthouse-mobile-menu-container">
            <div className="lighthouse-mobile-menu">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
