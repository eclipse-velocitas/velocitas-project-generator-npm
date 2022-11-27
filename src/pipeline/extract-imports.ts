import { CodeContext } from '../code-converter';
import { PYTHON } from '../utils/codeConstants';
import { PipelineStep } from './pipeline-base';

/**
 * Extracts imports from digital.auto prototype to the CodeContext
 * @extends PipelineStep
 */
export class ExtractImportsStep extends PipelineStep {
    public execute(context: CodeContext) {
        context.basicImportsArray = this.identifyBasicImports(context);
        this.cleanUpCodeSnippet(context.basicImportsArray, context);
    }
    private identifyBasicImports(context: CodeContext): string[] {
        let basicImportsArray: string[] = [];
        basicImportsArray = context.codeSnippetStringArray.filter((stringElement) => stringElement.includes(PYTHON.IMPORT));
        return basicImportsArray;
    }
}
