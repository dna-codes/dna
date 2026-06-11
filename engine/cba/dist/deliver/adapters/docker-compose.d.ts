import { EnvironmentPlan } from '../plan';
import { LaunchContext } from './types';
export interface ComposeFile {
    path: string;
    content: string;
}
export interface ComposeResult {
    files: ComposeFile[];
    services: string[];
    skipped: Array<{
        name: string;
        kind: string;
        reason: string;
    }>;
}
/**
 * Generate a top-level docker-compose.yml that wires together:
 *   - storage Constructs (postgres databases, redis caches) → standard images
 *   - deployable Cells (node/express, node/nestjs, vite/react) → build contexts
 *     pointing at each cell's output dir
 *
 * External providers (auth0, stripe, etc.) and network Constructs (gateway,
 * loadbalancer, cdn) are skipped — they're either out-of-scope for local
 * compose deployment or handled via port exposure.
 */
export declare function generateDockerCompose(plan: EnvironmentPlan): ComposeResult;
/**
 * `docker compose up` in the generated deploy dir. Passes `-d` by default so
 * the CLI returns after the stack is running; use `--attach` to stream logs.
 * `--build` and `--force-recreate` pass through to compose unchanged.
 */
export declare function launchCompose(ctx: LaunchContext): Promise<number>;
/**
 * `docker compose down` in the generated deploy dir. Removes volumes by
 * default (fresh demo state); use `--keep-volumes` to preserve them.
 */
export declare function teardownCompose(ctx: LaunchContext): Promise<number>;
/**
 * `docker compose ps` in the generated deploy dir — shows running containers
 * and their current state.
 */
export declare function statusCompose(ctx: LaunchContext): Promise<number>;
