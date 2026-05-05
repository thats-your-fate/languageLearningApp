/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

const sections = [
  {
    name: "Learn",
    title: "Start with useful vocabulary",
    text: "Choose your language pair, level, and topic, then review words with examples that make them easier to remember.",
    highlight: false,
  },
  {
    name: "Practice",
    title: "Turn words into sentences",
    text: "Use flashcards, missing-word choices, writing prompts, and speaking tasks to move from passive memory to active recall.",
    highlight: true,
  },
  {
    name: "Progress",
    title: "Review at the right moment",
    text: "Known words move forward. Hard words return. Your practice list keeps adapting so effort goes where it matters.",
    highlight: false,
  },
];

const included = ["Personal progress", "Language settings", "Dark and light theme", "Optional AI coaching"];

export default function AppDetailsPage() {
  return (
    <>
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
          <span className="content-top btn-text text-white">HOW IT WORKS</span>
          <h1 className="title-stroke my-3 text-primary">
            Language
            <span className="text-white">
              {" "}practice <br />
              built for
            </span>
            <span className="text-secondary"> recall </span>
          </h1>
          <p className="fs-5 text-white opacity-75 mb-0 mx-auto" style={{ maxWidth: 760 }}>
            Lighthouse helps you stop collecting words and start using them, with a learning flow that feels fast, focused, and repeatable.
          </p>
        </div>
      </section>

      <section className="fintech-app-home-section-5 position-relative pt-120 pb-120 bg-dark rounded-bottom-5">
        <div className="container position-relative z-1 overflow-hidden">
          <div className="row">
            <div className="text-center">
              <span className="content-top btn-text text-white">learning flow</span>
              <h2 className="my-3 text-primary">
                From
                <span className="text-white">
                  {" "}first look <br />
                  to confident
                </span>
                <span className="text-secondary"> use </span>
              </h2>
            </div>
          </div>
          <div className="row g-5 mt-80">
            {sections.map((section) => (
              <div key={section.name} className="col-lg-4">
                <div className={`card-pricing rounded-4 p-md-6 p-4 position-relative h-100 ${section.highlight ? "bg-primary" : "border border-white border-opacity-10"}`}>
                  <span className={`btn-text ${section.highlight ? "text-dark opacity-75" : "text-white opacity-50"}`}>{section.name}</span>
                  <h3 className={`mb-3 mt-3 ${section.highlight ? "text-dark" : "text-white"}`}>{section.title}</h3>
                  <p className={`fs-7 ${section.highlight ? "text-dark" : "text-white opacity-75"}`}>{section.text}</p>
                  <Link href="/templates" className={`mt-3 hover-up btn w-100 mb-6 ${section.highlight ? "btn-dark text-primary border-dark" : "btn-outline-dark"}`}>
                    see screens
                  </Link>
                  <span className={`btn-text ${section.highlight ? "text-dark" : "text-white"}`}>Included:</span>
                  <ul className="list-unstyled mt-3 mb-0">
                    {included.map((item) => (
                      <li key={item} className={`d-flex align-items-center justify-content-between border-top py-3 ${section.highlight ? "border-secondary" : "border-white border-opacity-10"}`}>
                        <p className={`fs-7 mb-0 ${section.highlight ? "text-dark" : "text-white opacity-75"}`}>{item}</p>
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
    </>
  );
}
