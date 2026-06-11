import { ParsedArgs } from './args';
/**
 * `cba down` — tear down a deployed topology. No regen, no plan rewrite; just
 * invokes the delivery adapter's teardown hook against the existing deploy dir.
 *
 * docker-compose: `docker compose down -v` (or without -v if --keep-volumes)
 * terraform/aws : `terraform destroy` — requires --auto-approve (will destroy AWS resources)
 */
export declare function runDown(argv: string[], args: ParsedArgs): void;
