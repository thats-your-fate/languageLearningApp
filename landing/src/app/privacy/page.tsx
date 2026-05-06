/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Lighthouse Language handles local progress, language settings, speech practice, and optional AI feedback data.",
  alternates: {
    canonical: "/privacy",
  },
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "The app stores your language settings, selected level, and practice progress locally on your device.",
      "When you use speech practice, the app may process a recording or transcript so it can evaluate your answer.",
      "When you use AI writing or speaking practice, your written answer or transcript, the current vocabulary prompt, and basic language settings may be sent to the app backend for evaluation.",
    ],
  },
  {
    title: "Information we do not collect",
    body: [
      "We do not require an account for the core learning flow.",
      "We do not sell personal information.",
      "We do not put an OpenAI API key inside the mobile app.",
    ],
  },
  {
    title: "How information is used",
    body: [
      "Local progress is used to show known words, weak cards, due cards, and practice statistics.",
      "AI requests are used only to generate tutor-style feedback for the answer you submit.",
      "Speech transcripts are used only to check the spoken practice answer you choose to submit.",
    ],
  },
  {
    title: "Storage and retention",
    body: [
      "Progress and settings are stored locally on your device using app storage.",
      "You can reset practice progress inside the app settings.",
      "Server logs, if enabled by the deployment owner, should be kept only as long as needed for debugging, security, and service operation.",
    ],
  },
  {
    title: "Third-party services",
    body: [
      "Optional AI evaluation may use OpenAI through a server-side endpoint controlled by the app operator.",
      "Speech-to-text may use a server-side transcription endpoint when enabled.",
      "Third-party providers process submitted content according to their own service terms and privacy commitments.",
    ],
  },
  {
    title: "Children",
    body: [
      "The app is intended for general language-learning use. If the app is used by children, a parent or guardian should review whether optional AI and speech features are appropriate.",
    ],
  },
  {
    title: "Contact",
    body: [
      "For privacy questions, contact: support@example.com.",
      "Replace this address with your real support email before submitting the app to the App Store.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="lighthouse-privacy-page">
      <section
        className="fintech-app-home-section-1 position-relative overflow-hidden pt-250 pb-160 rounded-bottom-5 z-4"
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
          <span className="content-top btn-text text-white">APP STORE</span>
          <h1 className="title-stroke my-3 text-primary">
            Privacy
            <span className="text-white">
              {" "}policy <br />
              for
            </span>
            <span className="text-secondary"> Lighthouse </span>
          </h1>
          <p className="fs-5 text-white opacity-75 mb-0 mx-auto" style={{ maxWidth: 760 }}>
            Last updated: May 5, 2026
          </p>
        </div>
      </section>

      <section className="lighthouse-privacy-content">
        <div className="lighthouse-privacy-card">
          <p className="lighthouse-privacy-intro">
            This Privacy Policy explains how Lighthouse Language handles information when you use the mobile app and related AI practice services.
            This page is written as an App Store-ready starting point. Replace the contact address and any deployment-specific details before publishing.
          </p>

          <div className="lighthouse-privacy-sections">
            {sections.map((section) => (
              <section key={section.title} className="lighthouse-privacy-section">
                <h2>{section.title}</h2>
                <ul>
                  {section.body.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
