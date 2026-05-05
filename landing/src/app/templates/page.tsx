/* eslint-disable @next/next/no-img-element */

const screens = [
  { src: "/app-screens/screen-1.png", title: "Practice in context", text: "Complete sentences using words you already know, with quick feedback that keeps the session moving." },
  { src: "/app-screens/screen-2.png", title: "Write with coaching", text: "Create your own sentence and get focused tutor feedback on whether the target word fits naturally." },
  { src: "/app-screens/screen-3.png", title: "Choose your session", text: "Start with discovery, writing, speaking, or known-word drills depending on your energy and goal." },
  { src: "/app-screens/screen-4.png", title: "Browse by topic", text: "Pick categories and levels so practice feels relevant instead of random." },
  { src: "/app-screens/screen-5.png", title: "See progress clearly", text: "Track known words, weak cards, and review groups without clutter." },
  { src: "/app-screens/screen-6.png", title: "Make it yours", text: "Set your native language, target language, level, theme, and feedback preferences." },
  { src: "/app-screens/screen-7.png", title: "Review with confidence", text: "Reveal answers, hear pronunciation, and grade cards so reviews adapt to your memory." },
];

export default function ScreensPage() {
  return (
    <div className="bg-white">
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
          <span className="content-top btn-text text-white">PRODUCT TOUR</span>
          <h1 className="title-stroke my-3 text-primary">
            See
            <span className="text-white">
              {" "}the <br />
              practice
            </span>
            <span className="text-secondary"> flow </span>
          </h1>
          <p className="fs-5 text-white opacity-75 mb-0 mx-auto" style={{ maxWidth: 720 }}>
            Lighthouse is designed to feel calm, direct, and useful from the first tap, whether you are reviewing a word or writing a full sentence.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">Product preview</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Every screen is built for action</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            The app keeps navigation simple, typography readable, and practice controls close to the learner, so daily sessions stay frictionless.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {screens.map((screen) => (
            <article key={screen.src} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 shadow-sm">
              <div className="flex justify-center rounded-[1.25rem] bg-slate-900 p-4">
                <img src={screen.src} alt={screen.title} className="max-h-[620px] rounded-[2rem]" />
              </div>
              <div className="mt-5">
                <h3 className="text-2xl font-black leading-tight text-white">{screen.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{screen.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
