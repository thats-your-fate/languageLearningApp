/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description: "Support information for Lighthouse Language, including contact email, troubleshooting, privacy, and App Store help.",
  alternates: {
    canonical: "/support",
  },
};

const supportSections = [
  {
    title: "Contact support",
    body: [
      "For app support, bug reports, account-free usage questions, privacy questions, or App Store review requests, email y3591vy@gmail.com.",
      "Please include your device model, iOS or Android version, app version, and a short description of what happened.",
    ],
  },
  {
    title: "Common help",
    body: [
      "If audio does not play, check silent mode, volume, network access, and whether the app has been restarted after an update.",
      "If speech practice cannot record, confirm microphone permission in your device settings.",
      "If progress looks wrong, open app settings and use the available reset or practice options for your current learning setup.",
    ],
  },
  {
    title: "Privacy and data",
    body: [
      "Core progress and language settings are stored locally on your device.",
      "Optional AI writing, speaking, or transcription features may send your submitted answer, transcript, prompt, and language settings to the app backend for evaluation.",
    ],
  },
];

export default function SupportPage() {
  return (
    <div className="lighthouse-privacy-page">
      <section
        className="fintech-app-home-section-1 position-relative overflow-hidden pt-250 pb-160 z-4"
        style={{
          backgroundColor: "var(--tc-theme-primary)",
          backgroundImage: "url('/assets/imgs/pages/fintech-app/page-home/home-section-1/img-bg.png')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <img className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover z-0" src="/assets/imgs/pages/fintech-app/page-home/home-section-1/img-bg.png" alt="" />
        <div className="container position-relative z-2 pt-8 text-center overflow-hidden">
          <span className="content-top btn-text text-white">APP SUPPORT</span>
          <h1 className="title-stroke my-3 text-primary">
            Support
            <span className="text-white">
              {" "}for <br />
            </span>
            <span className="text-secondary"> Lighthouse </span>
          </h1>
          <p className="fs-5 text-white opacity-75 mb-0 mx-auto" style={{ maxWidth: 760 }}>
            Help, contact information, and troubleshooting for Lighthouse Language.
          </p>
          <div className="mt-5">
            <a className="btn btn-dark text-primary" href="mailto:y3591vy@gmail.com">
              email support
            </a>
          </div>
        </div>
      </section>

      <section className="lighthouse-privacy-content">
        <div className="lighthouse-privacy-card">
          <p className="lighthouse-privacy-intro">
            Lighthouse Language support is available by email at <a className="text-white" href="mailto:y3591vy@gmail.com">y3591vy@gmail.com</a>.
          </p>

          <div className="lighthouse-privacy-sections">
            {supportSections.map((section) => (
              <section key={section.title} className="lighthouse-privacy-section">
                <h2>{section.title}</h2>
                <ul>
                  {section.body.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}

            <section className="lighthouse-privacy-section">
              <h2>Useful links</h2>
              <ul>
                <li>
                  <Link className="text-white" href="/privacy">Read the Privacy Policy</Link>
                </li>
                <li>
                  <a className="text-white" href="mailto:y3591vy@gmail.com">Contact y3591vy@gmail.com</a>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
