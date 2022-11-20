import { CodeContext } from '../code-converter';
import { DIGITAL_AUTO, PYTHON } from '../utils/codeConstants';
import { PipelineStep } from './pipeline-base';

/**
 * Prepares digital.auto prototype code snippet to be used to extract all relevant and needed information.
 * @extends PipelineStep
 */
export class PrepareCodeSnippetStep extends PipelineStep {
    public execute(context: CodeContext) {
        context.codeSnippetStringArray = this.removeSubstringsFromArray(context.codeSnippetStringArray, DIGITAL_AUTO.VEHICLE_INIT);
        context.codeSnippetStringArray = this.removeSubstringsFromArray(
            context.codeSnippetStringArray,
            PYTHON.IMPORT_DEPENDENCY_FROM,
            PYTHON.IMPORT
        );
        context.codeSnippetStringArray = this.removeSubstringsFromArray(context.codeSnippetStringArray, PYTHON.COMMENT);
    }

    private removeSubstringsFromArray(array: string[], substringOne: string, substringTwo?: string): string[] {
        const indexesToRemove: number[] = [];
        array.forEach((stringElement: string) => {
            if (!substringTwo && stringElement.includes(substringOne)) {
                const indexToRemove = array.indexOf(stringElement);
                indexesToRemove.push(indexToRemove);
            }
            if (substringTwo && stringElement.includes(substringOne) && stringElement.includes(substringTwo)) {
                const indexToRemove = array.indexOf(stringElement);
                indexesToRemove.push(indexToRemove);
            }
        });
        for (let index = 0; index < indexesToRemove.length; index++) {
            if (index === 0) {
                array.splice(indexesToRemove[index], 1);
            } else {
                array.splice(indexesToRemove[index] - index, 1);
            }
        }
        return array;
    }
}
