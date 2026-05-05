"use client";

import { useState } from "react";

export function AstraxFaq({ items }: { items: Array<[string, string]> }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="accordion">
      {items.map(([question, answer], index) => {
        const isOpen = activeIndex === index;

        return (
          <div key={question} className="px-0 card collapse-custom bg-dark border-0">
            <div className="p-0 card-header border-0">
              <a
                href={`#faq-${index}`}
                className={`py-4 fw-bold d-flex align-items-center ${
                  isOpen ? "" : "collapsed"
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  setActiveIndex(isOpen ? -1 : index);
                }}
                aria-expanded={isOpen}
              >
                <span className="me-3 arrow" />
                <h6 className="mb-0 fs-20">
                  <span className="text-white">{question}</span>
                </h6>
              </a>
            </div>
            <div className={isOpen ? "collapse show bg-dark" : "collapse bg-dark"}>
              <p
                className={`px-3 fs-6 fw-regular ps-5 ${isOpen ? "" : "opacity-50"}`}
                style={{ color: "#ffffff" }}
              >
                {answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
