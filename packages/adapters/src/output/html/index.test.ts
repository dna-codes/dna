import { render } from './index'
import { bookshopInput } from '@dna-codes/dna-core'

describe('@dna-codes/dna-output-html', () => {
  describe('render() — document scaffolding', () => {
    it('renders every default section', () => {
      const html = render(bookshopInput)
      expect(html).toContain('<h1>shop</h1>')
      expect(html).toContain('<h2>Summary</h2>')
      expect(html).toContain('<h2>Domain Model</h2>')
      expect(html).toContain('<h2>Operations</h2>')
      expect(html).toContain('<h2>SOPs</h2>')
      expect(html).toContain('<h2>Process Flows</h2>')
    })

    it('honors an explicit sections list and drops the rest', () => {
      const html = render(bookshopInput, { sections: ['summary'] })
      expect(html).toContain('<h2>Summary</h2>')
      expect(html).not.toContain('<h2>Domain Model</h2>')
      expect(html).not.toContain('<h2>Operations</h2>')
      expect(html).not.toContain('<h2>SOPs</h2>')
      expect(html).not.toContain('<h2>Process Flows</h2>')
    })

    it('supports a custom title override', () => {
      const html = render(bookshopInput, { title: 'Bookshop Handbook' })
      expect(html).toContain('<h1>Bookshop Handbook</h1>')
      expect(html).not.toContain('<h1>shop</h1>')
    })

    it('falls back to domain.name when path is missing', () => {
      const noPath = {
        operational: {
          ...bookshopInput.operational!,
          domain: { ...bookshopInput.operational!.domain, path: undefined },
        },
      }
      expect(render(noPath)).toContain('<h1>shop</h1>')
    })

    it('shifts heading levels with headingLevel: 2', () => {
      const html = render(bookshopInput, {
        sections: ['summary'],
        headingLevel: 2,
      })
      expect(html).toContain('<h2>shop</h2>')
      expect(html).toContain('<h3>Summary</h3>')
    })

    it('emits the empty string when DNA is empty', () => {
      expect(render({})).toBe('')
    })

    it('wraps output as a full HTML document when standalone is true', () => {
      const html = render(bookshopInput, { sections: ['summary'], standalone: true })
      expect(html).toMatch(/^<!DOCTYPE html><html>/)
      expect(html).toContain('<title>shop</title>')
      expect(html).toContain('<body>')
      expect(html.endsWith('</html>')).toBe(true)
    })

    it('HTML-escapes dangerous characters in titles and descriptions', () => {
      const dangerous = {
        operational: {
          ...bookshopInput.operational!,
          domain: {
            ...bookshopInput.operational!.domain,
            path: undefined,
            description: '<script>alert(1)</script>',
          },
        },
      }
      const html = render(dangerous, { title: '<evil>', sections: [] })
      expect(html).toContain('&lt;evil&gt;')
      expect(html).toContain('&lt;script&gt;')
      expect(html).not.toContain('<script>')
    })
  })

  describe('section: summary', () => {
    it('lists primitive counts for populated collections only', () => {
      const html = render(bookshopInput, { sections: ['summary'] })
      expect(html).toContain('Resources: 2')
      expect(html).toContain('Operations: 3')
      expect(html).toContain('Rules: 2')
      expect(html).toContain('Processes: 1')
      // Signal and Equation primitives no longer exist
      expect(html).not.toContain('Signals:')
      expect(html).not.toContain('Equations:')
    })

    it('names top-level resources', () => {
      const html = render(bookshopInput, { sections: ['summary'] })
      expect(html).toContain('Top-level resources:')
      expect(html).toContain('<code>Book</code>')
    })

    it('honors a rename map for primitive labels', () => {
      const html = render(bookshopInput, {
        sections: ['summary'],
        rename: { Persons: 'Individuals', Roles: 'Positions', Resources: 'Items' },
      })
      // canonical names are translated…
      expect(html).toContain('<li>Individuals: 1</li>')
      expect(html).toContain('<li>Positions: 1</li>')
      expect(html).toContain('<li>Items: 2</li>')
      // …and unmapped ones stay canonical
      expect(html).toContain('<li>Operations: 3</li>')
      // top-level label uses the renamed form, lowercased
      expect(html).toContain('<strong>Top-level items:</strong>')
    })

    it('leaves canonical labels untouched when no rename is provided', () => {
      const html = render(bookshopInput, { sections: ['summary'] })
      expect(html).toContain('<li>Persons: 1</li>')
      expect(html).toContain('<li>Positions: 1</li>')
      expect(html).toContain('<strong>Top-level resources:</strong>')
    })
  })

  describe('section: domain-model', () => {
    it('renders a resource with attribute table, actions, and relationships', () => {
      const html = render(bookshopInput, { sections: ['domain-model'] })
      expect(html).toContain('<h3>Book</h3>')
      expect(html).toContain('<th>Attribute</th>')
      expect(html).toContain('<td><code>id</code></td>')
      expect(html).toContain('<strong>Actions:</strong>')
      expect(html).toContain('<code>Publish</code>')
      expect(html).toContain('<code>Book.author</code>')
      expect(html).toContain('many-to-one')
      expect(html).toContain('<code>Author</code>')
    })
  })

  describe('section: operations', () => {
    it('renders triggers, access rules, condition rules, and Operation.changes', () => {
      const html = render(bookshopInput, { sections: ['operations'] })
      expect(html).toContain('<h3>Book.Publish</h3>')
      expect(html).toContain('<strong>Triggered by:</strong>')
      expect(html).toContain('user')
      expect(html).toContain('<em>Access:</em>')
      expect(html).toContain('role <code>Editor</code>')
      expect(html).toContain('<em>Condition:</em>')
      expect(html).toContain('<code>book.status</code>')
      expect(html).toContain('<strong>Changes:</strong>')
      expect(html).toContain('Sets <code>status</code>')
      expect(html).not.toContain('<strong>Outcomes:</strong>')
      expect(html).not.toContain('<strong>Signals published:</strong>')
    })
  })

  describe('section: sops', () => {
    it('renders numbered steps that resolve task → actor + operation', () => {
      const html = render(bookshopInput, { sections: ['sops'] })
      expect(html).toContain('<h3>PublishFlow</h3>')
      expect(html).toContain('<strong>Operator:</strong>')
      expect(html).toContain('<code>Editor</code>')
      expect(html).toMatch(/<ol>.*<li>.*<strong>review<\/strong>/s)
      expect(html).toContain('does <code>Book.Publish</code>')
      expect(html).toContain('(when: <code>BookIsDraft</code>)')
      expect(html).toContain('(else: reject)')
      expect(html).toContain('after: <code>review</code>')
    })
  })

  describe('section: process-flow', () => {
    it('renders a preformatted outline with condition markers and dep arrows', () => {
      const html = render(bookshopInput, { sections: ['process-flow'] })
      expect(html).toContain('<h3>PublishFlow</h3>')
      expect(html).toContain('<pre><code>')
      expect(html).toContain('├── review: review-book')
      expect(html).toContain('approve: approve-book [when: BookIsDraft] [else: reject] ← review')
      expect(html).toContain('└── reject: reject-book ← review')
    })
  })
})
