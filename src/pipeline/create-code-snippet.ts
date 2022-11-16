import { CodeContext } from '../code-formatter';
import { INDENTATION, VELOCITAS } from '../utils/codeConstants';
import { PipelineStep } from './pipeline-base';

export class CreateCodeSnippetForTemplateStep extends PipelineStep {
    public execute(context: CodeContext) {
        this.changeMemberVariables(context);
        context.codeSnippetForTemplate = `${this.indentCodeSnippet(VELOCITAS.ON_START, INDENTATION.COUNT_CLASS)}\n${this.indentCodeSnippet(
            this.adaptCodeBlocksToVelocitasStructure(this.createMultilineStringFromArray(context.codeSnippetStringArray)),
            INDENTATION.COUNT_METHOD
        )}`;
    }
    private changeMemberVariables(context: CodeContext) {
        context.variableNames.forEach((variableName: string) => {
            context.codeSnippetStringArray.forEach((stringElement: string, index) => {
                if (stringElement.includes(`${variableName} =`) && !stringElement.includes(`self.`)) {
                    context.codeSnippetStringArray[index] = `self.${stringElement}`;
                }
                if (stringElement.includes(`, ${variableName}`)) {
                    const re = new RegExp(`(?<!")${variableName}(?!")`, 'g');
                    context.codeSnippetStringArray[index] = stringElement.replace(re, `self.${variableName}`);
                }
                if (
                    stringElement.includes(`${variableName} <=`) ||
                    stringElement.includes(`= ${variableName}`) ||
                    stringElement.includes(`${variableName} +`)
                ) {
                    context.codeSnippetStringArray[index] = stringElement.replace(variableName, `self.${variableName}`);
                }
            });
        });
    }
}
