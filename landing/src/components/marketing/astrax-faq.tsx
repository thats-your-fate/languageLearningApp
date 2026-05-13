export function AstraxFaq({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="accordion lighthouse-faq">
      {items.map(([question, answer]) => (
        <div key={question} className="px-0 card collapse-custom bg-dark border-0 lighthouse-faq-item">
          <div className="p-0 card-header border-0">
            <div className="py-4 fw-bold d-flex align-items-start">
              <span className="me-3 arrow" />
              <h6 className="mb-0 fs-20">
                <span>{question}</span>
              </h6>
            </div>
          </div>
          <p className="lighthouse-faq-answer">{answer}</p>
        </div>
      ))}
    </div>
  );
}
