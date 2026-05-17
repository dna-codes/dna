import * as fs from 'fs'
import * as path from 'path'
import {
  SCHEMA_ROOT,
  allSchemas,
  documents,
  layerDirs,
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
        'process',
        'relationship',
        'resource',
        'role',
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
      expect(Object.keys(schemas.product.core).sort()).toEqual(['action', 'field', 'operation', 'resource'])
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

      // 15 op + 4 product-core + 4 product-api + 4 product-web + 10 technical = 37 primitives
      // + 5 aggregates = 42 schemas total
      expect(all.length).toBe(42)
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
})
