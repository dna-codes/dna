import * as fs from 'fs'
import * as path from 'path'
import Ajv from 'ajv/dist/2020'
import {
  SCHEMA_ROOT,
  LENS_ROOT,
  allLenses,
  allSchemas,
  documents,
  layerDirs,
  lenses,
  resolveSchemaFile,
  schemas,
} from './index'

describe('@dna-codes/dna-core', () => {
  describe('schemas', () => {
    it('loads all 15 operational primitive schemas', () => {
      const op = schemas.operational
      expect(Object.keys(op).sort()).toEqual([
        'action',
        'attribute',
        'base',
        'domain',
        'group',
        'membership',
        'operation',
        'person',
        'position',
        'process',
        'relationship',
        'resource',
        'rule',
        'task',
        'trigger',
      ])
      for (const s of Object.values(op)) {
        expect(typeof s.$id).toBe('string')
        expect(s.$id!.startsWith('https://dna.codes/schemas/operational/')).toBe(true)
      }
    })

    it('loads product core/api/web schemas under the right namespaces', () => {
      expect(Object.keys(schemas.product.core).sort()).toEqual(['action', 'field', 'operation', 'permission', 'resource', 'role', 'user'])
      expect(Object.keys(schemas.product.api).sort()).toEqual(['endpoint', 'namespace', 'param', 'schema'])
      expect(Object.keys(schemas.product.web).sort()).toEqual(['block', 'layout', 'page', 'route'])
    })

    it('loads all 10 technical primitive schemas', () => {
      expect(Object.keys(schemas.technical).sort()).toEqual([
        'cell',
        'connection',
        'construct',
        'environment',
        'node',
        'output',
        'provider',
        'variable',
        'view',
        'zone',
      ])
    })
  })

  describe('documents', () => {
    it('loads the five layer aggregate schemas', () => {
      expect(Object.keys(documents).sort()).toEqual([
        'operational',
        'productApi',
        'productCore',
        'productUi',
        'technical',
      ])
      for (const d of Object.values(documents)) {
        expect(typeof (d as any).$id).toBe('string')
      }
    })
  })

  describe('allSchemas', () => {
    it('returns every primitive + aggregate schema exactly once', () => {
      const all = allSchemas()
      const ids = all.map((s) => s.$id)
      expect(new Set(ids).size).toBe(ids.length)

      // 2 meta (stability + lens) + 15 op + 7 product-core + 4 product-api + 4 product-web + 7 product-ui + 10 technical = 49 primitives
      // (product-core gained Permission) + 5 aggregates = 54 schemas total
      expect(all.length).toBe(54)
    })
  })

  describe('resolveSchemaFile', () => {
    it('resolves a top-level primitive file', () => {
      const p = resolveSchemaFile('operational', 'resource')
      expect(p).not.toBeNull()
      expect(fs.existsSync(p!)).toBe(true)
      expect(path.basename(p!)).toBe('resource.json')
    })

    it('resolves a nested product primitive via subpath', () => {
      const p = resolveSchemaFile('product', 'api/endpoint')
      expect(p).not.toBeNull()
      expect(p!.endsWith(path.join('product', 'api', 'endpoint.json'))).toBe(true)
    })

    it('returns null for a missing schema', () => {
      expect(resolveSchemaFile('operational', 'ghost')).toBeNull()
    })
  })

  describe('SCHEMA_ROOT and layerDirs', () => {
    it('SCHEMA_ROOT points at a directory that contains the three layer folders', () => {
      expect(fs.existsSync(SCHEMA_ROOT)).toBe(true)
      expect(fs.existsSync(layerDirs.operational)).toBe(true)
      expect(fs.existsSync(layerDirs.product)).toBe(true)
      expect(fs.existsSync(layerDirs.technical)).toBe(true)
    })
  })

  describe('lenses', () => {
    it('has all seven core lens keys and each has a $id', () => {
      expect(Object.keys(lenses).sort()).toEqual([
        'accessControl',
        'execution',
        'operational',
        'people',
        'product',
        'productUi',
        'technical',
      ])
      for (const lens of Object.values(lenses)) {
        expect(typeof lens.$id).toBe('string')
        expect(lens.$id.startsWith('https://dna.codes/lenses/')).toBe(true)
      }
    })

    it('allLenses() returns exactly 7 items', () => {
      expect(allLenses()).toHaveLength(7)
    })

    it('validates each core lens against base.json using AJV', () => {
      const basePath = path.join(LENS_ROOT, 'base.json')
      const baseSchema = JSON.parse(fs.readFileSync(basePath, 'utf-8'))
      const ajv = new Ajv({ strict: false })
      const validate = ajv.compile(baseSchema)
      for (const lens of allLenses()) {
        const id = lens.$id
        const valid = validate(lens)
        if (!valid) {
          throw new Error(`Lens "${id}" failed base validation: ${ajv.errorsText(validate.errors)}`)
        }
      }
    })

    it('Access Control lens has 5 nodes and 4 edges', () => {
      expect(lenses.accessControl.nodes).toHaveLength(5)
      expect(lenses.accessControl.edges).toHaveLength(4)
    })

    it('all three layer lenses have nodes and no edges (or empty edges)', () => {
      for (const key of ['operational', 'product', 'technical'] as const) {
        const lens = lenses[key]
        expect(lens.nodes.length).toBeGreaterThan(0)
        expect(!lens.edges || lens.edges.length === 0).toBe(true)
      }
    })
  })
})
