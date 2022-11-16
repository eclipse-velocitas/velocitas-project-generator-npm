import { CodeContext } from '../code-formatter';
import { PYTHON, VELOCITAS } from '../utils/codeConstants';
import { PipelineStep } from './pipeline-base';

export class ExtractImportsStep extends PipelineStep {
    public execute(context: CodeContext) {
        context.basicImportsArray = this.identifyBasicImports(context);
        this.cleanUpCodeSnippet(context.basicImportsArray, context);
    }
    private identifyBasicImports(context: CodeContext): string[] {
        let basicImportsArray: string[] = [];

        basicImportsArray = context.codeSnippetStringArray.filter((stringElement) => stringElement.includes(PYTHON.IMPORT));
        if (context.codeSnippetStringArray.find((e: any) => e.includes('aio.sleep'))) {
            basicImportsArray.push(VELOCITAS.IMPORT_TIME);
        }

        return basicImportsArray;
    }
}
