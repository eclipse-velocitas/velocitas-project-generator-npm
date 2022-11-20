import { CodeContext } from '../code-converter';
import { VELOCITAS } from '../utils/codeConstants';
import { REGEX } from '../utils/regex';

export interface IPipelineStep {
    execute(context: CodeContext): void;
    cleanUpCodeSnippet(arrayToCleanUp: string[] | string[][], codeContext: CodeContext): void;
}

/**
 * Base class for pipeline use case in code converter.
 * To be used to extend the functionality for more detailed pipeline steps.
 */
export class PipelineStep implements IPipelineStep {
    /**
     * @param {CodeContext} context
     */
    public execute(context: CodeContext): void {}
    cleanUpCodeSnippet(arrayToCleanUp: string[] | string[][], codeContext: CodeContext): void {
        if (arrayToCleanUp.length === 0) {
            return;
        }
        let linesToRemove: string[] = [];
        if (arrayToCleanUp[0].constructor === Array) {
            (arrayToCleanUp as string[][]).forEach((array: string[]) => {
                linesToRemove = [...linesToRemove, ...array];
            });
        } else {
            (arrayToCleanUp as string[]).forEach((string: string) => {
                linesToRemove.push(string);
            });
        }
        linesToRemove.forEach((lineToRemove: string) => {
            if (codeContext.codeSnippetStringArray.indexOf(lineToRemove) >= 0) {
                codeContext.codeSnippetStringArray?.splice(codeContext.codeSnippetStringArray.indexOf(lineToRemove), 1);
            }
        });
    }
    adaptCodeBlocksToVelocitasStructure(codeBlock: string): string {
        return codeBlock
            .replace(REGEX.FIND_VEHICLE_OCCURENCE, VELOCITAS.VEHICLE_CALL)
            .replace(REGEX.FIND_UNWANTED_VEHICLE_CHANGE, VELOCITAS.VEHICLE_CALL_AS_ARGUMENT)
            .replace(REGEX.FIND_PRINTF_STATEMENTS, VELOCITAS.INFO_LOGGER_SIGNATURE)
            .replace(REGEX.FIND_PRINT_STATEMENTS, VELOCITAS.INFO_LOGGER_SIGNATURE);
    }
}
