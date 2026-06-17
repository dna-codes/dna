import { render } from './index'
import { bookshopInput } from '@dna-codes/dna-core'

describe('@dna-codes/dna-output-mermaid', () => {
  describe('render() — defaults and options', () => {
    it('emits both default diagrams', () => {
      const out = render(bookshopInput)
      expect(out).toContain('erDiagram')
      expect(out).toContain('flowchart TD')
    })

    it('honors an explicit diagrams list', () => {
      const erdOnly = render(bookshopInput, { diagrams: ['erd'] })
      expect(erdOnly).toContain('erDiagram')
      expect(erdOnly).not.toContain('flowchart')

      const flowOnly = render(bookshopInput, { diagrams: ['flowchart'] })
      expect(flowOnly).toContain('flowchart TD')
      expect(flowOnly).not.toContain('erDiagram')
    })

    it('applies flowchartDirection option', () => {
      const lr = render(bookshopInput, { diagrams: ['flowchart'], flowchartDirection: 'LR' })
      expect(lr).toContain('flowchart LR')
      expect(lr).not.toContain('flowchart TD')
    })

    it('emits the empty string when DNA is empty', () => {
      expect(render({})).toBe('')
    })

    it('skips diagrams whose data is missing', () => {
      const noProcess = {
        operational: {
          ...bookshopInput.operational!,
          processes: [],
        },
      }
      const out = render(noProcess)
      expect(out).toContain('erDiagram')
      expect(out).not.toContain('flowchart')
    })
  })

  describe('diagram: erd', () => {
    it('emits an entity block per resource with attributes', () => {
      const out = render(bookshopInput, { diagrams: ['erd'] })
      expect(out).toContain('Book {')
      expect(out).toContain('string id')
      expect(out).toContain('string title')
      expect(out).toContain('enum status')
      expect(out).toContain('Author {')
      expect(out).toContain('string name')
    })

    it('emits a relationship edge with the mapped cardinality', () => {
      const out = render(bookshopInput, { diagrams: ['erd'] })
      // many-to-one → }o--||
      expect(out).toContain('Book }o--|| Author : "Book.author"')
    })

    it('emits an empty entity block for resources without attributes', () => {
      const out = render(
        {
          operational: {
            domain: { name: 'd' }, resources: [{ name: 'Empty' }],
          },
        },
        { diagrams: ['erd'] },
      )
      expect(out).toContain('Empty {')
      expect(out).toContain('}')
    })
  })

  describe('diagram: flowchart', () => {
    it('emits a subgraph per process', () => {
      const out = render(bookshopInput, { diagrams: ['flowchart'] })
      expect(out).toContain('subgraph PublishFlow["PublishFlow"]')
      expect(out).toContain('end')
    })

    it('emits step nodes labeled by each task\'s operation', () => {
      const out = render(bookshopInput, { diagrams: ['flowchart'] })
      expect(out).toContain('review["Book.Publish"]')
      expect(out).toContain('approve["Book.Publish"]')
      expect(out).toContain('reject["Book.Retire"]')
    })

    it('emits arrows with condition/else labels', () => {
      const out = render(bookshopInput, { diagrams: ['flowchart'] })
      expect(out).toContain('review -- "BookIsDraft" --> approve')
      expect(out).toContain('approve -- "else" --> reject')
    })

    it('emits an unlabeled arrow when there are no conditions', () => {
      const out = render(
        {
          operational: {
            domain: { name: 'd' },
            tasks: [{ name: 'T1', actor: 'X', operation: 'Thing.Do' }],
            processes: [
              {
                name: 'Simple',
                startStep: 'a',
                steps: [
                  { id: 'a', task: 'T1' },
                  { id: 'b', task: 'T1', depends_on: ['a'] },
                ],
              },
            ],
          },
        },
        { diagrams: ['flowchart'] },
      )
      expect(out).toContain('a --> b')
      expect(out).not.toContain('"BookIsDraft"')
      expect(out).not.toContain('"else"')
    })
  })
})
