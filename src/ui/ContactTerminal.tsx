import { useEffect, useRef, useState } from 'react'
import { CONTACT, DETOURS } from '../content'
import { useJourney } from '../state/useJourney'
import { clamp01, normRange, smoothstep } from '../utils/math'

/**
 * The interactive terminal at the road's end (owner request): the prompt
 * is pre-loaded with `contact --now` — focus it, hit Enter, and it acts.
 * A small command set covers the rest (help / whoami / projects / open /
 * resume / links). History renders above the live prompt.
 */

interface Line {
  kind: 'cmd' | 'out'
  text: string
}

const PROJECT_LINKS: Record<string, string> = {
  'ai-trader': 'https://github.com/aaryansinha16/AI-trader',
  aiflowo: 'https://github.com/aaryansinha16/aiflowo',
  maestro: 'https://github.com/aaryansinha16/Maestro',
  devovia: 'https://devovia.com',
}

function runCommand(raw: string, print: (lines: Line[]) => void): void {
  const cmd = raw.trim().toLowerCase()
  const open = (url: string) => window.open(url, '_blank', 'noopener')

  if (cmd === '') return
  if (cmd === 'help' || cmd === '?') {
    print([
      { kind: 'out', text: 'contact --now · whoami · projects · open <name> · resume' },
      { kind: 'out', text: 'github · linkedin · medium · email · clear' },
    ])
  } else if (cmd.startsWith('contact') || cmd === 'email') {
    print([{ kind: 'out', text: `→ ${CONTACT.email}` }])
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
      "Let's build the next thing",
    )}`
  } else if (cmd === 'whoami') {
    print([
      { kind: 'out', text: 'Aaryan Sinha — AI Engineer & Full-Stack Architect' },
      { kind: 'out', text: '5+ yrs production · LLM apps · agentic AI · real-time systems' },
    ])
  } else if (cmd === 'projects' || cmd === 'ls') {
    const panels = DETOURS.find((d) => d.id === 'ai-flagships')?.panels.filter(
      (p) => p.kind === 'card',
    )
    print([
      { kind: 'out', text: (panels ?? []).map((p) => p.title.toLowerCase()).join('  ') },
      { kind: 'out', text: 'try: open ai-trader' },
    ])
  } else if (cmd.startsWith('open ')) {
    const name = cmd.slice(5).trim()
    const url = PROJECT_LINKS[name]
    if (url) {
      print([{ kind: 'out', text: `opening ${name} ↗` }])
      open(url)
    } else {
      print([{ kind: 'out', text: `unknown project "${name}" — try: projects` }])
    }
  } else if (cmd === 'resume' || cmd === 'cv') {
    if (CONTACT.resumeUrl) {
      print([{ kind: 'out', text: 'opening résumé ↗' }])
      open(CONTACT.resumeUrl)
    } else {
      print([{ kind: 'out', text: 'résumé not published yet' }])
    }
  } else if (cmd === 'github') {
    open(CONTACT.github)
    print([{ kind: 'out', text: 'opening github ↗' }])
  } else if (cmd === 'linkedin') {
    open(CONTACT.linkedin)
    print([{ kind: 'out', text: 'opening linkedin ↗' }])
  } else if (cmd === 'medium') {
    open(CONTACT.medium)
    print([{ kind: 'out', text: 'opening medium ↗' }])
  } else {
    print([{ kind: 'out', text: `command not found: ${cmd} — try help` }])
  }
}

export function ContactTerminal() {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<Line[]>([
    { kind: 'cmd', text: 'whoami' },
    { kind: 'out', text: 'AI Engineer & Full-Stack Architect — 5+ yrs production' },
    { kind: 'cmd', text: 'ls ./flagships' },
    { kind: 'out', text: 'ai-trader/  aiflowo/  maestro/  devovia.com' },
  ])
  const [value, setValue] = useState('contact --now')

  useEffect(() => {
    const apply = (p: number) => {
      const el = rootRef.current
      if (!el) return
      const o = smoothstep(normRange(p, 0.955, 0.985))
      el.style.opacity = o.toFixed(3)
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      el.style.pointerEvents = o > 0.5 ? 'auto' : 'none'
      el.style.transform = `translateY(${((1 - clamp01(o)) * 18).toFixed(1)}px)`
    }
    apply(useJourney.getState().splineProgress)
    return useJourney.subscribe((s) => s.splineProgress, apply)
  }, [])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [lines])

  const submit = () => {
    const cmd = value
    setLines((prev) => [...prev.slice(-14), { kind: 'cmd', text: cmd }])
    if (cmd.trim().toLowerCase() === 'clear') {
      setLines([])
    } else {
      runCommand(cmd, (out) => setLines((prev) => [...prev.slice(-14), ...out]))
    }
    setValue('')
  }

  return (
    <div
      ref={rootRef}
      className="contact"
      style={{ visibility: 'hidden' }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="contact__bar">
        <span className="contact__dot" />
        <span className="contact__dot" />
        <span className="contact__dot" />
        <span className="contact__path">~/the-road-trip — try `help`</span>
      </div>
      <div className="contact__body" ref={bodyRef}>
        {lines.map((line, i) => (
          <p key={i} className={line.kind === 'out' ? 'contact__out' : undefined}>
            {line.kind === 'cmd' && <span className="contact__prompt">$</span>}
            {line.kind === 'cmd' ? ` ${line.text}` : line.text}
          </p>
        ))}
        <p className="contact__inputline">
          <span className="contact__prompt">$</span>
          <input
            ref={inputRef}
            className="contact__input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              e.stopPropagation()
            }}
            spellCheck={false}
            autoComplete="off"
            aria-label="terminal input — press Enter to run"
          />
          <span className="contact__hint">⏎</span>
        </p>
        <nav className="contact__links">
          <a href={`mailto:${CONTACT.email}`}>EMAIL</a>
          <a href={CONTACT.github} target="_blank" rel="noopener noreferrer">
            GITHUB
          </a>
          <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">
            LINKEDIN
          </a>
          <a href={CONTACT.medium} target="_blank" rel="noopener noreferrer">
            MEDIUM
          </a>
          {CONTACT.resumeUrl && (
            <a href={CONTACT.resumeUrl} download>
              RÉSUMÉ ↓
            </a>
          )}
        </nav>
      </div>
    </div>
  )
}
