import { EnvironmentPlan } from '../plan';
import { LaunchContext } from './types';
export interface TerraformFile {
    path: string;
    content: string;
}
export interface TerraformResult {
    files: TerraformFile[];
    resources: string[];
    skipped: Array<{
        name: string;
        kind: string;
        reason: string;
    }>;
}
/**
 * Generate Terraform HCL files that provision AWS infrastructure from
 * Technical DNA. Maps Constructs to AWS resources, Cells to ECS tasks
 * or S3+CloudFront, and Variables to Secrets Manager / locals.
 */
export declare function generateTerraformAws(plan: EnvironmentPlan): TerraformResult;
/**
 * `terraform init` (idempotent) → `terraform plan -out=tfplan` → apply.
 *
 * Without --auto-approve the adapter stops after the plan so the operator can
 * review the diff before anything touches AWS. This matches how `cba deploy`
 * refuses to auto-develop — loud, explicit, no surprises.
 */
export declare function launchTerraform(ctx: LaunchContext): Promise<number>;
/**
 * `terraform destroy`. Always requires --auto-approve in non-interactive runs;
 * terraform would otherwise block on stdin for the confirmation prompt.
 */
export declare function teardownTerraform(ctx: LaunchContext): Promise<number>;
/**
 * `terraform show` + AWS resource summary. Shows what terraform has deployed
 * and queries AWS APIs for a quick resource count.
 */
export declare function statusTerraform(ctx: LaunchContext): Promise<number>;
