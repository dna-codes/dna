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
exports.runDiscover = runDiscover;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const context_1 = require("./context");
const args_1 = require("./args");
const output_1 = require("./output");
const help_1 = require("./help");
function runDiscover(argv, args) {
    const opts = { json: (0, args_1.boolFlag)(args, 'json') };
    if ((0, args_1.boolFlag)(args, 'help')) {
        console.log(help_1.DISCOVER_HELP);
        return;
    }
    const [domain] = argv;
    if (!domain) {
        (0, output_1.emitError)('Usage: cba operational discover <domain> [--from <file>] [--continue]', opts);
        process.exit(1);
    }
    // Verify the domain exists (or offer to create a new one)
    const root = (0, context_1.findRepoRoot)();
    const domainExists = fs.existsSync(path.join(root, 'dna', domain));
    // Collect --from sources (can repeat)
    const sources = [];
    const fromFlag = (0, args_1.flag)(args, 'from');
    if (fromFlag)
        sources.push(fromFlag);
    const cba = path.join(root, '.cba');
    const sessionsDir = path.join(cba, 'sessions');
    const draftsDir = path.join(cba, 'drafts');
    fs.mkdirSync(sessionsDir, { recursive: true });
    fs.mkdirSync(draftsDir, { recursive: true });
    if ((0, args_1.boolFlag)(args, 'continue')) {
        const recent = mostRecentSession(sessionsDir, domain);
        if (!recent) {
            (0, output_1.emitError)(`No previous session found for domain "${domain}"`, opts);
            process.exit(1);
        }
        (0, output_1.emit)({ resumed: true, session: recent }, opts, () => [`→ Resuming session: ${recent.transcriptPath}`, `  draft: ${recent.draftPath}`].join('\n'));
        return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const transcriptPath = path.join(sessionsDir, `${domain}-${timestamp}.md`);
    const draftPath = path.join(draftsDir, `${domain}-${timestamp}.json`);
    // Nested domains (e.g. torts/marshall) need their parent dirs created
    fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
    fs.mkdirSync(path.dirname(draftPath), { recursive: true });
    const header = [
        `# Discovery session — ${domain}`,
        ``,
        `**Started:** ${new Date().toISOString()}`,
        `**Domain exists:** ${domainExists ? 'yes' : 'no (new domain)'}`,
        sources.length ? `**Sources:** ${sources.join(', ')}` : '',
        ``,
        `---`,
        ``,
        `## Conversation`,
        ``,
        `_(agent transcript goes here)_`,
        ``,
    ]
        .filter(Boolean)
        .join('\n');
    fs.writeFileSync(transcriptPath, header);
    fs.writeFileSync(draftPath, JSON.stringify({
        domain,
        startedAt: new Date().toISOString(),
        sources,
        proposals: {
            operational: { add: [], update: [], remove: [] },
            'product.api': { add: [], update: [], remove: [] },
            'product.ui': { add: [], update: [], remove: [] },
            technical: { add: [], update: [], remove: [] },
        },
    }, null, 2) + '\n');
    const session = {
        domain,
        timestamp,
        transcriptPath,
        draftPath,
        sources,
    };
    const nextSteps = [
        `cba operational list ${domain}`,
        `cba operational schema Resource`,
        `cba product api list ${domain}`,
        `cba validate ${domain} --json`,
    ];
    (0, output_1.emit)({ session, domainExists, nextSteps }, opts, () => [
        `✓ Discovery session started for "${domain}"`,
        ``,
        `  transcript : ${path.relative(process.cwd(), transcriptPath)}`,
        `  draft      : ${path.relative(process.cwd(), draftPath)}`,
        `  domain     : ${domainExists ? 'exists' : 'new (dna/' + domain + '/ will be created)'}`,
        sources.length ? `  sources    : ${sources.join(', ')}` : '',
        ``,
        `An agent should now take over, using these commands to ground itself:`,
        ...nextSteps.map((s) => `  $ ${s}`),
        ``,
        `The agent accumulates proposals in the draft file, then you review`,
        `and apply them with 'cba design ... add'.`,
    ]
        .filter(Boolean)
        .join('\n'));
    // Also try to resolve/validate the domain if it exists, so errors surface early
    if (domainExists) {
        try {
            (0, context_1.resolveDomain)(domain, root);
        }
        catch {
            /* ignore — agent can still proceed */
        }
    }
}
function mostRecentSession(sessionsDir, domain) {
    if (!fs.existsSync(sessionsDir))
        return undefined;
    const files = fs
        .readdirSync(sessionsDir)
        .filter((f) => f.startsWith(`${domain}-`) && f.endsWith('.md'))
        .sort()
        .reverse();
    if (files.length === 0)
        return undefined;
    const transcriptPath = path.join(sessionsDir, files[0]);
    const timestamp = files[0].replace(`${domain}-`, '').replace('.md', '');
    const draftPath = path.join(path.dirname(sessionsDir), 'drafts', `${domain}-${timestamp}.json`);
    return { domain, timestamp, transcriptPath, draftPath, sources: [] };
}
//# sourceMappingURL=discover.js.map