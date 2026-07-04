import { CHAPTER_COPY, CONTACT, DETOURS, SKILL_BOARDS } from '../content'

/**
 * Visually hidden, crawlable summary of everything the 3D journey shows —
 * the overlay only ever renders the CURRENT chapter, so this block keeps
 * the full story indexable (and available to screen readers).
 */
export function SeoContent() {
  return (
    <div className="sr-only">
      <h1>Aaryan Sinha — AI Engineer &amp; Full-Stack Architect</h1>
      {CHAPTER_COPY.map((c) => (
        <section key={c.eyebrow}>
          <h2>
            {c.eyebrow}: {c.title}
          </h2>
          <p>{c.tagline}</p>
        </section>
      ))}
      <section>
        <h2>Skills</h2>
        <ul>
          {SKILL_BOARDS.map((b) => (
            <li key={b.title}>
              {b.title} — {b.sub}
            </li>
          ))}
        </ul>
      </section>
      {DETOURS.map((d) => (
        <section key={d.id}>
          <h2>{d.title}</h2>
          <ul>
            {d.panels.map((p) => (
              <li key={p.title}>
                {p.title}: {p.body} {p.link && <a href={p.link.href}>{p.link.label}</a>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section>
        <h2>Contact</h2>
        <ul>
          <li>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </li>
          <li>
            <a href={CONTACT.github}>GitHub</a>
          </li>
          <li>
            <a href={CONTACT.linkedin}>LinkedIn</a>
          </li>
          <li>
            <a href={CONTACT.medium}>Medium</a>
          </li>
          <li>
            <a href={CONTACT.site}>devovia.com</a>
          </li>
        </ul>
      </section>
    </div>
  )
}
