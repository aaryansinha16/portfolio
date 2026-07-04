import { CHAPTER_COPY, CONTACT, DETOURS, SKILL_BOARDS } from '../content'
import { CHAPTERS } from '../experience/chapters/registry'

/**
 * The journey as chapter cards — served when the visitor prefers reduced
 * motion or WebGL is unavailable (DESIGN: "static-camera chapter cards with
 * crossfades instead of the drive"). Same story, same palette, no motion;
 * it doubles as the crawlable/Lighthouse-friendly fallback path.
 */
export function StaticJourney() {
  return (
    <main className="static-journey">
      {CHAPTER_COPY.map((copy, i) => {
        const env = CHAPTERS[i].config.env
        return (
          <section
            key={copy.eyebrow}
            className="static-card"
            style={{
              background: `linear-gradient(180deg, ${env.skyZenith} 0%, ${env.skyHorizon} 55%, ${env.groundColor} 100%)`,
            }}
          >
            <div className="static-card__inner">
              <p className="static-card__eyebrow">{copy.eyebrow}</p>
              <h2 className="static-card__title">{copy.title}</h2>
              <p className="static-card__tagline">{copy.tagline}</p>

              {i === 3 && (
                <ul className="static-card__list">
                  {SKILL_BOARDS.map((b) => (
                    <li key={b.title}>
                      <strong>{b.title}</strong> — {b.sub}
                    </li>
                  ))}
                </ul>
              )}

              {DETOURS.filter((d) => d.zone === i).map((d) => (
                <div key={d.id} className="static-card__detour">
                  <h3>{d.title}</h3>
                  <ul className="static-card__list">
                    {d.panels.map((p) => (
                      <li key={p.title}>
                        <strong>{p.title}</strong> — {p.body}{' '}
                        {p.link && (
                          <a href={p.link.href} target="_blank" rel="noopener noreferrer">
                            {p.link.label} ↗
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )
      })}
      <section className="static-card static-card--contact">
        <div className="static-card__inner">
          <p className="static-card__eyebrow">GET IN TOUCH</p>
          <h2 className="static-card__title">Let’s build the next thing</h2>
          <nav className="static-card__links">
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <a href={CONTACT.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href={CONTACT.medium} target="_blank" rel="noopener noreferrer">
              Medium
            </a>
            <a href={CONTACT.site} target="_blank" rel="noopener noreferrer">
              devovia.com
            </a>
          </nav>
          <p className="static-card__note">
            The full experience is an interactive 3D drive — open this page in a browser with WebGL
            (and motion enabled) to take the road trip.
          </p>
        </div>
      </section>
    </main>
  )
}
