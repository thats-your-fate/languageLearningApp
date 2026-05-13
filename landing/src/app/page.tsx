/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";

import { AstraxFaq } from "@/components/marketing/astrax-faq";

export const metadata: Metadata = {
  title: "Lighthouse Language | Vocabulary, Sentence Practice, and AI Coaching",
  description:
    "Learn languages through active vocabulary recall, sentence exercises, flashcards, writing practice, speaking practice, TTS, progress tracking, and optional AI feedback.",
  alternates: {
    canonical: "/",
  },
};

const features = [
  {
    title: "Learn words that actually stick",
    subtitle: "Vocabulary with context",
    text: "Every card pairs a word with translations, examples, level, and category, so practice always has a clear reason.",
    icon: "bi bi-lightbulb",
  },
  {
    title: "Move from recognition to recall",
    subtitle: "Active sentence drills",
    text: "Go beyond tapping flashcards with missing-word, fill-in-the-blank, writing, and speaking exercises built from known words.",
    icon: "bi bi-chat-text",
  },
  {
    title: "Get feedback when it matters",
    subtitle: "AI as a language coach",
    text: "Optional tutor feedback checks whether your sentence uses the target word naturally, then explains the fix without derailing practice.",
    icon: "bi bi-stars",
  },
];

const practiceLoops = [
  "Hands-free discovery mode for hearing words and examples",
  "Fast flashcard reviews with simple self-grading",
  "Sentence drills generated from words you already know",
  "Writing and speaking practice with optional AI coaching",
];

const plans = [
  { name: "Start", price: "A1", text: "Build your first useful words and phrases with short, confidence-friendly practice.", highlight: false },
  { name: "Speak", price: "A2", text: "Turn familiar vocabulary into sentences you can type, hear, and say out loud.", highlight: true },
  { name: "Grow", price: "B1", text: "Keep expanding your active vocabulary while weak cards return at the right time.", highlight: false },
];

const faqs = [
  ["Can I practice without AI?", "Yes. Core learning works with local vocabulary, flashcards, sentence drills, text-to-speech, and progress tracking."],
  ["Which languages can I learn?", "The starter content supports English, German, Portuguese (Brazil), Italian, Spanish, and French, with room to add more."],
  ["What makes Lighthouse different?", "It connects vocabulary to production: known words become sentences, sentences become speaking practice, and feedback stays short and useful."],
] satisfies Array<[string, string]>;

export default function MarketingPage() {
  return (
    <>
      <section
        className="fintech-app-home-section-1 lighthouse-home-hero position-relative overflow-hidden pt-120 pb-120 z-4"
        style={{
          backgroundColor: "var(--tc-theme-primary)",
          backgroundImage: "url('/assets/imgs/pages/fintech-app/page-home/home-section-1/img-bg.png')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <img className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover z-0" src="/assets/imgs/pages/fintech-app/page-home/home-section-1/img-bg.png" alt="" />
        <div className="container position-relative z-2 pt-8 text-lg-start text-center overflow-hidden">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 col-md-12">
              <span className="content-top btn-text text-white">LANGUAGE PRACTICE APP</span>
              <h1 className="title-stroke my-3 text-primary">
                Lighthouse
                <span className="text-white">
                  {" "}turns <br />
                  vocabulary into
                </span>
                <span className="text-secondary"> fluent </span> <br />
                <span className="text-white">practice</span>
              </h1>
              <p className="fs-5 text-white opacity-75 mb-0 pe-lg-8">
                Learn with focused cards, sentence exercises, speech practice, and gentle AI feedback, all designed for quick daily sessions.
              </p>
              <div className="d-flex align-items-center justify-content-center justify-content-lg-start flex-wrap mt-8">
                <Link href="/templates" className="btn btn-dashed">
                    <span> see how it works </span>
                  <i className="fa-solid fa-arrow-right-long text-primary" />
                </Link>
              </div>
            </div>
            <div className="col-lg-6 d-none d-lg-block">
              <div className="lighthouse-hero-screens">
                <div className="lighthouse-hero-screen-grid">
                  <img className="lighthouse-hero-screen" src="/app-screens/screen-1.png" alt="Sentence practice preview" />
                  <img className="lighthouse-hero-screen" src="/app-screens/screen-2.png" alt="AI writing feedback preview" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fintech-app-home-section-2 position-relative pt-120 rounded-bottom-5 bg-primary">
        <div className="position-absolute top-50 start-50 translate-middle z-0 w-100 h-100">
          <img className="w-100 h-100" src="/assets/imgs/pages/fintech-app/page-home/home-section-2/img-bg.png" alt="" />
        </div>
        <div className="container position-relative z-1 border-dashed-bottom pb-120 overflow-hidden">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-4">
                <i className="bi bi-lightning-charge-fill text-dark" style={{ fontSize: 92 }} />
                <h2 className="mb-0 text-dark">A complete practice loop learners can start in seconds</h2>
              </div>
            </div>
            <div className="col-lg-4">
              <p className="fs-18 text-dark">
                Pick a language, level, and category, then jump straight into practice that asks you to remember, type, listen, and speak.
              </p>
            </div>
          </div>
        </div>
        <div className="container position-relative pt-120 pb-120 z-1">
          <div className="row g-5">
            {features.map((feature) => (
              <div key={feature.title} className="col-lg-4">
                <div className="card-feature p-5 rounded-4 hover-up bg-white h-100 shadow-1" style={{ boxShadow: "0 24px 60px rgba(41, 41, 41, 0.16)" }}>
                  <Link href="/templates" className="d-flex align-items-center gap-3 mb-4">
                    <i className={`${feature.icon} text-dark fs-2 flex-shrink-0`} />
                    <div>
                      <h6 className="mb-3 text-dark">{feature.title}</h6>
                      <p className="mb-0 btn-text text-muted">{feature.subtitle}</p>
                    </div>
                  </Link>
                  <p className="mb-0 text-dark opacity-75">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fintech-app-home-section-4 position-relative bg-dark-3 rounded-bottom-5">
        <div className="container overflow-hidden pt-120 pb-120">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="content-top btn-text text-white">CORE LOOP</span>
              <h2 className="mt-3 mb-5 text-primary position-relative">
                Make
                <span className="text-white">
                  {" "}every word <br />
                  useful
                </span>
                <span className="text-secondary"> before </span> <br />
                <span className="text-white">moving on</span>
              </h2>
              <ul className="list-unstyled mb-8">
                {practiceLoops.map((item) => (
                  <li key={item} className="d-flex align-items-center mb-3 gap-3">
                    <i className="bi bi-check-circle-fill text-primary" />
                    <p className="mb-0 text-white">{item}</p>
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="btn btn-primary text-dark fw-bold">
                explore the app
                <i className="fa-solid fa-arrow-right-long ms-2" />
              </Link>
            </div>
            <div className="col-lg-6">
              <div
                className="d-grid"
                style={{
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 22,
                  padding: 50,
                }}
              >
                <img className="rounded-4 w-100" src="/app-screens/screen-3.png" alt="Practice hub preview" />
                <img className="rounded-4 w-100" src="/app-screens/screen-4.png" alt="Word lists preview" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fintech-app-home-section-5 position-relative pt-120 pb-120 bg-dark rounded-bottom-5">
        <div className="container position-relative z-1 overflow-hidden">
          <div className="row">
            <div className="text-center">
              <span className="content-top btn-text text-white">levels</span>
              <h2 className="my-3 text-primary">
                Designed
                <span className="text-white">
                  {" "}for <br />
                  daily
                </span>
                <span className="text-secondary"> momentum </span>
              </h2>
            </div>
          </div>
          <div className="row g-5 mt-80">
            {plans.map((plan) => (
              <div key={plan.name} className="col-lg-4">
                <div className={`card-pricing rounded-4 p-md-6 p-4 position-relative ${plan.highlight ? "bg-primary" : "border border-white border-opacity-10"}`}>
                  <span className={`btn-text ${plan.highlight ? "text-dark opacity-75" : "text-white opacity-50"}`}>{plan.name}</span>
                  <h1 className={`mb-3 ${plan.highlight ? "text-dark" : ""}`}>{plan.price}</h1>
                  <p className={`fs-7 ${plan.highlight ? "text-dark" : "text-white opacity-75"}`}>{plan.text}</p>
                  <Link href="/templates" className={`mt-3 hover-up btn w-100 mb-6 ${plan.highlight ? "btn-dark text-primary border-dark" : "btn-outline-dark"}`}>
                    view app screens
                  </Link>
                  <span className={`btn-text ${plan.highlight ? "text-dark" : "text-white"}`}>Practice tools:</span>
                  <ul className="list-unstyled mt-3 mb-0">
                    {["Word lists by level", "Spaced repetition", "Listening support", "Optional AI feedback"].map((item) => (
                      <li key={item} className={`d-flex align-items-center justify-content-between border-top py-3 ${plan.highlight ? "border-secondary" : "border-white border-opacity-10"}`}>
                        <p className={`fs-7 mb-0 ${plan.highlight ? "text-dark" : "text-white opacity-75"}`}>{item}</p>
                        <img className="filter-invert" src="/assets/imgs/template/icons/check.svg" alt="" />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fintech-app-home-section-7 position-relative bg-dark">
        <div className="position-absolute bottom-50 start-50 translate-middle-x w-100 h-50 bg-dark-3 rounded-bottom-5" />
        <div className="container overflow-hidden">
          <div className="position-relative z-1 text-center bg-primary rounded-3 py-120 px-md-4 px-3">
            <div className="position-relative z-1">
              <i className="bi bi-volume-up-fill text-dark fs-1" />
              <h2 className="text-dark pt-4">
                Small sessions. Real recall. <br />
                Better sentences every day.
              </h2>
              <p className="text-dark py-3">Lighthouse keeps the learner producing language, not just recognizing it.</p>
              <div className="d-flex align-items-center justify-content-center gap-4 flex-wrap">
                <Link href="/templates" className="btn btn-dark text-primary">
                  view screens
                </Link>
                <Link href="/privacy" className="btn btn-dark text-primary">
                  privacy policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fintech-app-home-section-8 pt-120 pb-120 position-relative rounded-bottom-5 bg-dark">
        <div className="container position-relative overflow-hidden">
          <div className="row">
            <div className="col-lg-5">
              <span className="content-top btn-text text-white">questions</span>
              <h2 className="my-3 text-primary position-relative">
                Clear
                <span className="text-white">
                  {" "}answers <br className="d-block" />
                  before you
                </span>
                <span className="text-secondary"> start </span>
              </h2>
            </div>
            <div className="col-lg-7 mt-lg-0 mt-8">
              <AstraxFaq items={faqs} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
