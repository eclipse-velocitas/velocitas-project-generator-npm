import { CodeContext } from '../code-converter';
import { INDENTATION } from '../utils/codeConstants';
import { createMultilineStringFromArray, indentCodeSnippet } from '../utils/helpers';
import { PipelineStep } from './pipeline-base';

/**
 * Extracts variables from digital.auto prototype to the CodeContext
 * @extends PipelineStep
 */
export class ExtractVariablesStep extends PipelineStep {
    public execute(context: CodeContext) {
        context.variablesArray = this.identifyVariables(context.codeSnippetStringArray);
        context.variableNames = this.identifyVariableNames(context.variablesArray);
        if (context.variableNames?.length != 0) {
            context.memberVariables = this.prepareMemberVariables(context);
        }
    }
    private identifyVariables(codeSnippetStringArray: string[]) {
        const variablesArray: string[][] = [];
        codeSnippetStringArray.forEach((stringElement) => {
            if (!stringElement.includes('plugins')) {
                const tempVariables: string[] = [];
                if (stringElement.includes('= {')) {
                    for (
                        let index = codeSnippetStringArray.indexOf(stringElement);
                        codeSnippetStringArray[index] !== '' && !codeSnippetStringArray[index].includes('}}');
                        index++
                    ) {
                        tempVariables.push(codeSnippetStringArray[index]);
                    }
                    variablesArray.push(tempVariables);
                }
                if (stringElement.includes(' = ') && !stringElement.includes('= {')) {
                    variablesArray.push([stringElement]);
                }
            }
        });
        return variablesArray;
    }

    private identifyVariableNames(variablesArray: string[][]): string[] {
        let variableNames: string[] = [];
        variablesArray.forEach((variableArray: string[]) => {
            variableArray.forEach((variable: string) => {
                if (variable.includes('=')) {
                    if (variable.includes(',')) {
                        variable.split(',').forEach((singleVariable: string) => {
                            variableNames.push(singleVariable.split('=')[0].trim());
                        });
                    } else {
                        variableNames.push(variable.split('=')[0].trim());
                    }
                }
            });
        });
        variableNames = Array.from(new Set(variableNames));
        return variableNames;
    }

    private prepareMemberVariables(context: CodeContext): string {
        const memberVariablesArray: string[] = [];
        context.variableNames.forEach((variable: string) => {
            memberVariablesArray.push(`self.${variable.trim()} = None`);
        });
        const memberVariables = indentCodeSnippet(createMultilineStringFromArray(memberVariablesArray), INDENTATION.COUNT_METHOD);
        return memberVariables;
    }
}
