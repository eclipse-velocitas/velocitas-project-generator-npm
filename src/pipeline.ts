import { CodeContext } from './code-formatter';
import { DIGITAL_AUTO, INDENTATION, PYTHON, VELOCITAS } from './utils/codeConstants';
import { REGEX } from './utils/regex';

export interface IPipelineStep {
    execute(context: CodeContext): void;
    cleanUpCodeSnippet(arrayToCleanUp: string[] | string[][], codeContext: CodeContext): void;
}

class PipelineStep implements IPipelineStep {
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

export class PrepareCodeSnippetStep extends PipelineStep {
    public execute(context: CodeContext) {
        context.codeSnippetStringArray = this.removeSubstringFromArray(context.codeSnippetStringArray, DIGITAL_AUTO.VEHICLE_INIT);
        context.codeSnippetStringArray = this.removeSubstringFromArray(
            context.codeSnippetStringArray,
            PYTHON.IMPORT_DEPENDENCY_FROM,
            PYTHON.IMPORT
        );
        context.codeSnippetStringArray = this.removeSubstringFromArray(context.codeSnippetStringArray, PYTHON.COMMENT);
    }

    private removeSubstringFromArray(array: string[], substringOne: string, substringTwo?: string): string[] {
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
        const memberVariables = this.indentCodeSnippet(this.createMultilineStringFromArray(memberVariablesArray), INDENTATION.COUNT_METHOD);
        return memberVariables;
    }
}

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

export class ExtractClassesStep extends PipelineStep {
    public execute(context: CodeContext) {
        context.seperateClassesArray = this.identifySeperateClass(context);
        if (context.seperateClassesArray.length !== 0) {
            context.seperateClasses = this.adaptCodeBlocksToVelocitasStructure(
                this.createMultilineStringFromArray(context.seperateClassesArray)
            );
        }
        this.cleanUpCodeSnippet(context.seperateClassesArray, context);
    }
    private identifySeperateClass(context: CodeContext): string[][] {
        const classStartIndexArray: number[] = [];

        context.codeSnippetStringArray.forEach((stringElement: string) => {
            if (stringElement.includes(PYTHON.CLASS)) {
                const classStartIndex = context.codeSnippetStringArray?.indexOf(stringElement);
                classStartIndexArray.push(classStartIndex as number);
            }
        });

        const classArray: string[][] = [];
        classStartIndexArray.forEach((classStartIndexElement: number) => {
            const tempClasses: string[] = [];
            for (let index = classStartIndexElement; this.lineBelongsToClass(context.codeSnippetStringArray, index); index++) {
                tempClasses.push(context.codeSnippetStringArray[index]);
            }
            classArray.push(tempClasses);
        });
        return classArray;
    }
    private lineBelongsToClass(array: string[], index: number): boolean {
        const lineWithoutIndentation = array[index].replace(REGEX.FIND_LINE_BEGINNING_WITH_WHITESPACES, '');
        if (array[index] !== '' && !array[index].includes(PYTHON.CLASS) && array[index].length === lineWithoutIndentation.length) {
            return false;
        }
        return true;
    }
}

export class ExtractMethodsStep extends PipelineStep {
    public execute(context: CodeContext) {
        context.seperateMethodsArray = this.identifyMethodBlocks(context);
        if (context.seperateMethodsArray.length !== 0) {
            context.seperateMethods = this.createMultilineStringFromArray(context.seperateMethodsArray as string[][]);
            context.seperateMethods = this.adaptCodeBlocksToVelocitasStructure(context.seperateMethods);
            context.seperateMethods = this.indentCodeSnippet(context.seperateMethods, INDENTATION.COUNT_CLASS);
        }
    }
    private identifyMethodBlocks(context: CodeContext): string[][] {
        const methodStartIndexArray: number[] = [];
        context.codeSnippetStringArray.forEach((stringElement: string) => {
            if (stringElement.includes(PYTHON.SYNC_METHOD_START)) {
                const methodStartIndex = context.codeSnippetStringArray?.indexOf(stringElement);
                methodStartIndexArray.push(methodStartIndex as number);
            }
        });

        const methodArray: string[][] = [];
        const modifiedMethodArray: string[][] = [];
        methodStartIndexArray.forEach((methodStartIndex: number) => {
            const tempMethods: string[] = [];
            const tempModifiedMethods: string[] = [];
            for (let index = methodStartIndex; context.codeSnippetStringArray[index] != ''; index++) {
                tempMethods.push(context.codeSnippetStringArray[index]);
                if (context.codeSnippetStringArray[index].includes(PYTHON.SYNC_METHOD_START)) {
                    let methodLine: string;
                    if (context.codeSnippetStringArray[index].startsWith(PYTHON.ASYNC_METHOD_START)) {
                        methodLine = context.codeSnippetStringArray[index].replace(/\(.*\)/, VELOCITAS.CLASS_METHOD_SIGNATURE);
                    } else {
                        methodLine = context.codeSnippetStringArray[index]
                            .replace(PYTHON.SYNC_METHOD_START, PYTHON.ASYNC_METHOD_START)
                            .replace(/\(.*\)/, VELOCITAS.CLASS_METHOD_SIGNATURE);
                    }
                    const subscriptionCallbackVariableLine = this.mapSubscriptionCallbackForVelocitas(
                        context.codeSnippetStringArray,
                        index
                    );
                    tempModifiedMethods.push(methodLine);
                    tempModifiedMethods.push(subscriptionCallbackVariableLine);
                } else {
                    tempModifiedMethods.push(this.changeMemberVariablesInString(context.codeSnippetStringArray[index], context));
                }
            }
            methodArray.push(tempMethods);
            modifiedMethodArray.push(tempModifiedMethods);
        });
        this.cleanUpCodeSnippet(methodArray, context);
        return modifiedMethodArray;
    }
    private mapSubscriptionCallbackForVelocitas(codeSnippetStringArray: string[], index: number): string {
        const methodString = codeSnippetStringArray[index];
        let methodName: any;
        let vssSignal;
        methodName = codeSnippetStringArray
            ?.find((line: string) => line.includes(methodString))
            ?.split(PYTHON.SYNC_METHOD_START)[1]
            .trim()
            .split(`(`)[0];
        vssSignal = codeSnippetStringArray
            ?.find((line: string) => line.includes(`${DIGITAL_AUTO.SUBSCRIBE_CALL}${methodName}`))
            ?.split(`${DIGITAL_AUTO.SUBSCRIBE_CALL}`)[0];

        if (vssSignal?.startsWith(`${PYTHON.AWAIT} `)) {
            vssSignal = vssSignal.split(`${PYTHON.AWAIT} `)[1];
        }
        const callBackVariable = methodString.split(`(`)[1].split(`:`)[0].split(`)`)[0];

        const subscriptionCallbackVariableLine = this.indentCodeSnippet(
            `${callBackVariable} = data.get(${vssSignal}).value`,
            INDENTATION.COUNT_CLASS
        );
        return subscriptionCallbackVariableLine;
    }
    private changeMemberVariablesInString(codeSnippet: string, context: CodeContext): string {
        context.variableNames?.forEach((variableName: string) => {
            if (
                codeSnippet.includes(`${variableName}`) &&
                (!codeSnippet.includes(`.${variableName}`) ||
                    !codeSnippet.includes(`${variableName}"`) ||
                    !codeSnippet.includes(`"${variableName}`))
            ) {
                const re = new RegExp(`(?<![\\.\\"])${variableName}(?![\\.\\"])`, 'g');
                codeSnippet = codeSnippet.replace(re, `self.${variableName}`);
            }
        });
        return codeSnippet;
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
