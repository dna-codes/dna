import { ReactNode } from 'react';
type OperationProps = {
    name: string;
    children: ReactNode;
    fallback?: ReactNode;
    loading?: ReactNode;
};
export declare function Operation({ name, children, fallback, loading: loadingNode }: OperationProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=operation.d.ts.map