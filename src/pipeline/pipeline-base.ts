import { CodeContext } from '../code-formatter';
import { INDENTATION, VELOCITAS } from '../utils/codeConstants';
import { REGEX } from '../utils/regex';

export interface IPipelineStep {
    execute(context: CodeContext): void;
    cleanUpCodeSnippet(arrayToCleanUp: string[] | string[][], codeContext: CodeContext): void;
}

export class PipelineStep implements IPipelineStep {
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
            codeContext.codeSnippetStringArray?.splice(codeContext.codeSnippetStringArray.indexOf(lineToRemove), 1);
        });
    }
    indentCodeSnippet(decodedSnippet: string, indentCount: number): string {
        const indent = ' ';
        const indentedCodeSnippet = decodedSnippet.replace(REGEX.FIND_EVERY_LINE_START, indent.repeat(indentCount));
        return indentedCodeSnippet;
    }
    createMultilineStringFromArray(array: string[] | string[][]): string {
        let multilineString: string = '';
        if (array[0].constructor === Array) {
            (array as string[][]).forEach((stringArray: string[]) => {
                stringArray.forEach((stringElement: string) => {
                    multilineString = multilineString.concat(`${stringElement}\n`);
                });
                multilineString = multilineString.concat(`\n`);
            });
        } else {
            (array as string[]).forEach((stringElement: string) => {
                multilineString = multilineString.concat(`${stringElement}\n`);
            });
        }
        return multilineString.trim();
    }
    adaptCodeBlocksToVelocitasStructure(codeBlock: string): string {
        return codeBlock
            .replace(REGEX.FIND_VEHICLE_OCCURENCE, VELOCITAS.VEHICLE_CALL)
            .replace(REGEX.FIND_UNWANTED_VEHICLE_CHANGE, VELOCITAS.VEHICLE_CALL_AS_ARGUMENT)
            .replace(REGEX.FIND_PRINTF_STATEMENTS, VELOCITAS.INFO_LOGGER_SIGNATURE)
            .replace(REGEX.FIND_PRINT_STATEMENTS, VELOCITAS.INFO_LOGGER_SIGNATURE);
    }
}

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
