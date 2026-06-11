import { ParsedArgs } from './args';
/**
 * `cba status` — show the running state of a deployed topology.
 *
 * docker-compose: `docker compose ps` in the deploy dir
 * terraform/aws : `terraform show` + targeted AWS resource summary
 */
export declare function runStatus(argv: string[], args: ParsedArgs): void;
