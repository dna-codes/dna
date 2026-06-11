"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Marketing layout generator test — verifies the vite/react ui-cell adapter
 * emits a MarketingLayout component, wires it into the Layout dispatcher,
 * and accepts the marketing-specific DNA fields (brand, hero, footer).
 */
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const dna_core_1 = require("@dna-codes/dna-core");
const react_1 = require("./adapters/vite/react");
function withTempDir(fn) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-cell-marketing-'));
    try {
        fn(dir);
    }
    finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}
// ── Minimal marketing product.ui.json fixture ────────────────────────────────
const marketingUi = {
    layout: {
        name: 'MarshallFireLayout',
        type: 'marketing',
        description: 'Public marketing site for the Marshall Fire mass-tort intake.',
        brand: {
            name: 'Marshall Fire Claims',
            tagline: 'Help for Boulder County fire survivors',
            href: '/',
        },
        hero: {
            eyebrow: 'Marshall Fire Mass Tort',
            title: 'If you lost your home in the Marshall Fire, we can help.',
            subtitle: 'Free case review for Superior, Louisville, and unincorporated Boulder County residents.',
            cta: { label: 'Start Intake', route: '/intake' },
            secondaryCta: { label: 'Eligibility', route: '/eligibility' },
        },
        footer: {
            text: '\u00a9 2026 Marshall Fire Claims Group',
            links: [
                { label: 'Privacy', href: '/privacy' },
                { label: 'Contact', href: 'mailto:hello@example.com' },
            ],
        },
    },
    pages: [
        { name: 'Home', resource: 'Home', blocks: [] },
        { name: 'Eligibility', resource: 'Home', blocks: [] },
        { name: 'Intake', resource: 'Home', blocks: [] },
    ],
    routes: [
        { path: '/', page: 'Home' },
        { path: '/eligibility', page: 'Eligibility' },
        { path: '/intake', page: 'Intake' },
    ],
};
// ── Tests ────────────────────────────────────────────────────────────────────
describe('vite/react ui-cell — marketing layout', () => {
    it('schema accepts marketing layout with brand, hero, and footer', () => {
        const validator = new dna_core_1.DnaValidator();
        const r = validator.validate(marketingUi.layout, 'product/web/layout');
        if (!r.valid)
            console.error(r.errors);
        expect(r.valid).toBe(true);
    });
    it('generates a MarketingLayout.tsx when the layout type is marketing', () => {
        withTempDir((dir) => {
            (0, react_1.generate)(marketingUi, dir);
            const marketingFile = path.join(dir, 'src/renderer/MarketingLayout.tsx');
            expect(fs.existsSync(marketingFile)).toBe(true);
            const content = fs.readFileSync(marketingFile, 'utf-8');
            // Spot-check the structural markers
            expect(content).toContain('export default function MarketingLayout');
            expect(content).toContain('layout.brand');
            expect(content).toContain('layout.hero');
            expect(content).toContain('layout.footer');
            expect(content).toContain('<Outlet />');
        });
    });
    it('Layout dispatcher routes marketing type to MarketingLayout', () => {
        withTempDir((dir) => {
            (0, react_1.generate)(marketingUi, dir);
            const layoutFile = path.join(dir, 'src/renderer/Layout.tsx');
            expect(fs.existsSync(layoutFile)).toBe(true);
            const content = fs.readFileSync(layoutFile, 'utf-8');
            expect(content).toContain("import MarketingLayout from './MarketingLayout'");
            expect(content).toContain("layout.type === 'marketing'");
            expect(content).toContain('<MarketingLayout layout={layout} routes={routes} />');
        });
    });
    it('MarketingLayout.tsx references all the DNA-configured chrome', () => {
        withTempDir((dir) => {
            (0, react_1.generate)(marketingUi, dir);
            const content = fs.readFileSync(path.join(dir, 'src/renderer/MarketingLayout.tsx'), 'utf-8');
            // Header CTA
            expect(content).toContain('headerCta');
            // Hero title + CTA + secondary CTA
            expect(content).toContain('hero.title');
            expect(content).toContain('hero.cta');
            expect(content).toContain('hero.secondaryCta');
            // Footer links
            expect(content).toContain('footer.links');
            // Hero only shows on root
            expect(content).toContain("location.pathname === '/'");
        });
    });
    it('generates a SurveyBlock and wires survey-core into package.json', () => {
        withTempDir((dir) => {
            (0, react_1.generate)(marketingUi, dir);
            // SurveyBlock.tsx exists and pulls from survey-core + survey-react-ui
            const surveyBlock = path.join(dir, 'src/renderer/blocks/SurveyBlock.tsx');
            expect(fs.existsSync(surveyBlock)).toBe(true);
            const content = fs.readFileSync(surveyBlock, 'utf-8');
            expect(content).toContain("from 'survey-core'");
            expect(content).toContain("from 'survey-react-ui'");
            expect(content).toContain('fieldToQuestion');
            expect(content).toContain('--sjs-primary-backcolor');
            expect(content).toContain('useApi(block.operation)');
            // Block dispatcher wires 'survey' case to SurveyBlock
            const blockFile = path.join(dir, 'src/renderer/Block.tsx');
            const blockContent = fs.readFileSync(blockFile, 'utf-8');
            expect(blockContent).toContain("import SurveyBlock from './blocks/SurveyBlock'");
            expect(blockContent).toContain("case 'survey':");
            // survey-core + survey-react-ui pinned in generated package.json
            const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
            expect(pkg.dependencies['survey-core']).toBeDefined();
            expect(pkg.dependencies['survey-react-ui']).toBeDefined();
        });
    });
});
//# sourceMappingURL=marketing-layout.test.js.map