import { LaunchContext } from './adapters/types';
/**
 * Shared registry of launch/teardown hooks per delivery adapter. Consumed by
 * `cba up` and `cba down`. The generate() side still lives in deliver/index.ts
 * (it's tightly coupled to the plan/json/human output machinery there); this
 * registry is intentionally narrow — just the process-orchestration hooks.
 */
export declare const DELIVERY_ADAPTERS: readonly ["docker-compose", "terraform/aws"];
export type DeliveryAdapterId = (typeof DELIVERY_ADAPTERS)[number];
export declare function isDeliveryAdapterId(id: string): id is DeliveryAdapterId;
export declare function launchWith(id: DeliveryAdapterId, ctx: LaunchContext): Promise<number>;
export declare function teardownWith(id: DeliveryAdapterId, ctx: LaunchContext): Promise<number>;
export declare function statusWith(id: DeliveryAdapterId, ctx: LaunchContext): Promise<number>;
