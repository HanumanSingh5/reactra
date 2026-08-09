export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <p className="font-mono text-violet text-sm mb-2 tracking-wide">ABOUT THE EVENT</p>
      <h1 className="text-3xl font-bold mb-6">Event Information</h1>

      <div className="prose prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">What is this?</h2>
          <p className="text-foreground/80">
            [Edit this text to describe your hackathon — theme, goals, and what
            teams are expected to build.]
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Format</h2>
          <ul className="list-disc list-inside text-foreground/80 space-y-1">
            <li>Physical, on-campus event</li>
            <li>Two rounds — teams must qualify from Round 1 to reach Round 2</li>
            <li>Judged by faculty evaluators against fixed scoring criteria</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Evaluation Criteria</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink text-white">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Criteria</th>
                  <th className="text-right px-4 py-2 font-medium">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-2">Frontend / Implementation</td>
                  <td className="px-4 py-2 text-right font-mono">30</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Presentation</td>
                  <td className="px-4 py-2 text-right font-mono">10</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Documentation</td>
                  <td className="px-4 py-2 text-right font-mono">10</td>
                </tr>
                <tr className="bg-background font-semibold">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right font-mono">50</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Important dates</h2>
          <p className="text-foreground/80">
            [Add registration deadline, event date, and round timings here.]
          </p>
        </section>
      </div>
    </div>
  );
}
