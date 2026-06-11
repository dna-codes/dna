import { Resource, Endpoint, ApiOperation, Rule, CoreOperation, Namespace } from '../../../../types';
export declare function generateRouter(resource: Resource, endpoints: Endpoint[], _apiOperations: ApiOperation[], rules: Rule[], coreOperations: CoreOperation[], _namespace: Namespace): string;
/** Generate routers __init__.py that registers all routers */
export declare function generateRoutersInit(resources: Resource[], _namespace: Namespace): string;
//# sourceMappingURL=router.d.ts.map