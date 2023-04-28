import { CodeContext } from '../code-converter';
import { DIGITAL_AUTO, INDENTATION, PYTHON, VELOCITAS } from '../utils/codeConstants';
import { createMultilineStringFromArray, indentCodeSnippet } from '../utils/helpers';
import { PipelineStep } from './pipeline-base';

/**
 * Extracts methods from digital.auto prototype to the CodeContext
 * @extends PipelineStep
 */
export class ExtractMethodsStep extends PipelineStep {
    public execute(context: CodeContext) {
        context.seperateMethodsArray = this.identifyMethodBlocks(context);
        if (context.seperateMethodsArray.length !== 0) {
            context.seperateMethods = createMultilineStringFromArray(context.seperateMethodsArray as string[][]);
            context.seperateMethods = this.adaptCodeBlocksToVelocitasStructure(context.seperateMethods);
            context.seperateMethods = indentCodeSnippet(context.seperateMethods, INDENTATION.COUNT_CLASS);
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
            for (let index = methodStartIndex; /\S/.test(context.codeSnippetStringArray[index]); index++) {
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

        const subscriptionCallbackVariableLine = indentCodeSnippet(
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
