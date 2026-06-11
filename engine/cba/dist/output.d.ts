export interface OutputOptions {
    json: boolean;
}
export declare function emit(data: unknown, opts: OutputOptions, humanFormatter: () => string): void;
export declare function emitError(message: string, opts: OutputOptions, extra?: Record<string, unknown>): void;
export declare function emitOk(data: Record<string, unknown>, opts: OutputOptions, humanFormatter: () => string): void;
