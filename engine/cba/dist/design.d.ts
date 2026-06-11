import { Layer } from './context';
import { ParsedArgs } from './args';
/**
 * Run a design command for a pre-determined layer.
 * argv = [command, domain, ...]
 */
export declare function runLayerCommand(layer: Layer, argv: string[], args: ParsedArgs): void;
