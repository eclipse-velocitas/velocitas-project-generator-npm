import { CodeContext } from '../code-converter';
import { INDENTATION, VELOCITAS } from '../utils/codeConstants';
import { createMultilineStringFromArray, indentCodeSnippet, variableConditionCheck } from '../utils/helpers';
import { variableRegex } from '../utils/regex';
import { PipelineStep } from './pipeline-base';

/**
 * Creates the code snippet which will be put into the velocitas template
 * @extends PipelineStep
 */
export class CreateCodeSnippetForTemplateStep extends PipelineStep {
    public execute(context: CodeContext) {
        this.changeMemberVariables(context);
        context.codeSnippetForTemplate = `${indentCodeSnippet(VELOCITAS.ON_START, INDENTATION.COUNT_CLASS)}\n${indentCodeSnippet(
            this.adaptCodeBlocksToVelocitasStructure(createMultilineStringFromArray(context.codeSnippetStringArray)),
            INDENTATION.COUNT_METHOD
            )}`;
    }
    private changeMemberVariables(context: CodeContext) {
        context.variableNames.forEach((variableName: string) => {
            context.codeSnippetStringArray.forEach((stringElement: string, index) => {
                if (stringElement.includes(`${variableName} =`) && !stringElement.includes(`self.`)) {
                    context.codeSnippetStringArray[index] = stringElement.replace(variableName, `self.${variableName}`);
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

                if (variableConditionCheck(stringElement,variableName)) {
                    context.codeSnippetStringArray[index] = stringElement.replace(variableRegex(variableName), `self.${variableName}`);
                }
            });
        });
    }
}
