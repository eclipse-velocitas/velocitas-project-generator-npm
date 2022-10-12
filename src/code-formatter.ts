// Copyright (c) 2022 Robert Bosch GmbH
//
// This program and the accompanying materials are made available under the
// terms of the Apache License, Version 2.0 which is available at
// https://www.apache.org/licenses/LICENSE-2.0.
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.
//
// SPDX-License-Identifier: Apache-2.0

import { Buffer } from 'buffer';
import { DIGITAL_AUTO, INDENTATION, PYTHON, VELOCITAS } from './utils/codeConstants';
import { CONTENT_ENCODINGS } from './utils/constants';
import { REGEX } from './utils/regex';

export class CodeFormatter {
    private basicImportsArray: string[] = [];
    private seperateClassesArray: string[][] = [];
    private seperateMethodsArray: string[][] = [];
    private codeSnippetStringArray: string[] = [];

    public formatMainPy(base64MainPyContentData: string, base64CodeSnippet: string, appName: string): string {
        try {
            const adaptedCodeSnippet = this.adaptCodeSnippet(base64CodeSnippet);
            const extractedMainPyStructure = this.extractMainPyBaseStructure(base64MainPyContentData);
            const formattedMainPy = this.addCodeSnippetToMainPy(extractedMainPyStructure, adaptedCodeSnippet, appName);
            const finalizedMainPy = this.finalizeMainPy(formattedMainPy);
            return finalizedMainPy;
        } catch (error) {
            throw error;
        }
    }

    private extractMainPyBaseStructure(base64MainPyContentData: string): string {
        let seperateClassForTemplate = '';
        let seperateMethodsForTemplate = '';
        let decodedMainPyContentData = Buffer.from(base64MainPyContentData, CONTENT_ENCODINGS.base64 as BufferEncoding).toString(
            CONTENT_ENCODINGS.utf8 as BufferEncoding
        );
        if (this.seperateClassesArray.length !== 0) {
            seperateClassForTemplate = this.createMultilineStringFromArray(this.seperateClassesArray[0]);
            seperateClassForTemplate = this.adaptCodeBlocksToVelocitasStructure(seperateClassForTemplate);
        }
        if (this.seperateMethodsArray.length !== 0) {
            seperateMethodsForTemplate = this.createMultilineStringFromArray(this.seperateMethodsArray);
            seperateMethodsForTemplate = this.adaptCodeBlocksToVelocitasStructure(seperateMethodsForTemplate);
            seperateMethodsForTemplate = this.indentCodeSnippet(seperateMethodsForTemplate, INDENTATION.COUNT_CLASS);
        }
        try {
            const mainPyBaseStructure = decodedMainPyContentData
                .replace(REGEX.FROM_LOGGER_TO_CLASS, `\n\n${seperateClassForTemplate}\n\n${PYTHON.CLASS}`)
                .replace(REGEX.GET_SAMPLE_VEHICLE_APP, '')
                .replace(REGEX.GET_WHITESPACE_FOLLOWED_BY_COMMENTS, '')
                .replace(REGEX.EVERYTHING_BETWEEN_MULTILINE, '')
                .replace(REGEX.GET_EVERY_PYTHON_DOCSTRING, '')
                .replace(REGEX.GET_EVERY_DELETABLE_TEMPLATE_CODE, `\n\n${seperateMethodsForTemplate}\n\n${VELOCITAS.MAIN_METHOD}`);

            return mainPyBaseStructure;
        } catch (error) {
            throw new Error('Error in extractMainPyBaseStructure.');
        }
    }

    private adaptCodeSnippet(base64CodeSnippet: string): string {
        let decodedBase64CodeSnippet = Buffer.from(base64CodeSnippet, CONTENT_ENCODINGS.base64 as BufferEncoding).toString(
            CONTENT_ENCODINGS.utf8 as BufferEncoding
        );
        this.codeSnippetStringArray = this.createArrayFromMultilineString(decodedBase64CodeSnippet);
        this.codeSnippetStringArray = this.removeSubstringFromArray(this.codeSnippetStringArray, DIGITAL_AUTO.VEHICLE_INIT);
        this.codeSnippetStringArray = this.removeSubstringFromArray(
            this.codeSnippetStringArray,
            PYTHON.IMPORT_DEPENDENCY_FROM,
            PYTHON.IMPORT
        );
        this.codeSnippetStringArray = this.removeSubstringFromArray(this.codeSnippetStringArray, PYTHON.COMMENT);

        this.basicImportsArray = this.identifyBasicImports(this.codeSnippetStringArray);
        this.seperateClassesArray = this.identifySeperateClass(this.codeSnippetStringArray);
        this.seperateMethodsArray = this.identifyMethodBlocks(this.codeSnippetStringArray);

        const codeSnippetForTemplate = this.adaptCodeBlocksToVelocitasStructure(
            this.createMultilineStringFromArray(this.codeSnippetStringArray)
        );

        return codeSnippetForTemplate;
    }
    private identifyBasicImports(codeSnippetStringArray: string[]): string[] {
        const basicImportsArray = codeSnippetStringArray.filter((stringElement) => stringElement.includes(PYTHON.IMPORT));
        this.cleanUpCodeSnippet(basicImportsArray);
        return basicImportsArray;
    }

    private addCodeSnippetToMainPy(extractedMainPyStructure: string, adaptedCodeSnippet: string, appName: string): string {
        const appNameForTemplate = `${appName.charAt(0).toUpperCase()}${appName.slice(1)}${VELOCITAS.VEHICLE_APP_SUFFIX}`;
        try {
            const newMainPy = extractedMainPyStructure
                .replace(REGEX.FIND_BEGIN_OF_ON_START_METHOD, this.indentCodeSnippet(adaptedCodeSnippet, INDENTATION.COUNT_METHOD))
                .replace(REGEX.FIND_SAMPLE_APP, appNameForTemplate);
            return newMainPy;
        } catch (error) {
            throw new Error('Error in addCodeSnippetToMainPy.');
        }
    }

    private indentCodeSnippet(decodedSnippet: string, indentCount: number): string {
        const indent = ' ';
        const indentedCodeSnippet = decodedSnippet.replace(REGEX.FIND_EVERY_LINE_START, indent.repeat(indentCount));
        return indentedCodeSnippet;
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

    private lineBelongsToClass(array: string[], index: number): boolean {
        const lineWithoutIndentation = array[index].replace(REGEX.FIND_LINE_BEGINNING_WITH_WHITESPACES, '');
        if (array[index] !== '' && !array[index].includes(PYTHON.CLASS) && array[index].length === lineWithoutIndentation.length) {
            return false;
        }
        return true;
    }

    private identifySeperateClass(array: string[]): string[][] {
        const classStartIndexArray: number[] = [];
        array.forEach((stringElement: string) => {
            if (stringElement.includes(PYTHON.CLASS)) {
                const classStartIndex = array.indexOf(stringElement);
                classStartIndexArray.push(classStartIndex);
            }
        });
        const classArray: string[][] = [];
        classStartIndexArray.forEach((classStartIndexElement: number) => {
            const tempClasses: string[] = [];
            for (let index = classStartIndexElement; this.lineBelongsToClass(array, index); index++) {
                tempClasses.push(array[index]);
            }
            classArray.push(tempClasses);
        });
        this.cleanUpCodeSnippet(classArray);
        return classArray;
    }

    private identifyMethodBlocks(array: string[]): string[][] {
        const methodStartIndexArray: number[] = [];
        array.forEach((stringElement: string) => {
            if (stringElement.includes(PYTHON.SYNC_METHOD_START)) {
                const methodStartIndex = array.indexOf(stringElement);
                methodStartIndexArray.push(methodStartIndex);
            }
        });
        const methodArray: string[][] = [];
        const modifiedMethodArray: string[][] = [];
        methodStartIndexArray.forEach((methodStartIndex: number) => {
            const tempMethods: string[] = [];
            const tempModifiedMethods: string[] = [];
            for (let index = methodStartIndex; array[index] != ''; index++) {
                tempMethods.push(array[index]);
                if (array[index].includes(PYTHON.SYNC_METHOD_START)) {
                    tempModifiedMethods.push(
                        array[index]
                            .replace(PYTHON.SYNC_METHOD_START, PYTHON.ASYNC_METHOD_START)
                            .replace(/\(/, VELOCITAS.CLASS_METHOD_SIGNATURE)
                    );
                } else {
                    tempModifiedMethods.push(array[index]);
                }
            }
            methodArray.push(tempMethods);
            modifiedMethodArray.push(tempModifiedMethods);
        });
        this.cleanUpCodeSnippet(methodArray);
        return modifiedMethodArray;
    }

    private cleanUpCodeSnippet(arrayToCleanUp: string[] | string[][]): void {
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
            this.codeSnippetStringArray.splice(this.codeSnippetStringArray.indexOf(lineToRemove), 1);
        });
    }

    private createMultilineStringFromArray(array: string[] | string[][]): string {
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

    private finalizeMainPy(newMainPy: string): string {
        const newMainPyStringArray = this.createArrayFromMultilineString(newMainPy);
        const found = newMainPyStringArray.find((element: string) => element.includes(PYTHON.IMPORT));
        this.basicImportsArray.forEach((basicImportString: string) => {
            newMainPyStringArray.splice(newMainPyStringArray.indexOf(found as string), 0, basicImportString);
        });
        const finalCode = this.createMultilineStringFromArray(newMainPyStringArray);
        const formattedFinalCode = finalCode.replace(REGEX.FIND_SUBSCRIBE_METHOD_CALL, VELOCITAS.SUBSCRIPTION_SIGNATURE);
        const encodedNewMainPy = Buffer.from(formattedFinalCode, CONTENT_ENCODINGS.utf8 as BufferEncoding).toString(
            CONTENT_ENCODINGS.base64 as BufferEncoding
        );
        return encodedNewMainPy;
    }

    private createArrayFromMultilineString(multilineString: string): string[] {
        return multilineString.split(/\r?\n/);
    }

    private adaptCodeBlocksToVelocitasStructure(codeBlock: string): string {
        return codeBlock
            .replace(REGEX.FIND_VEHICLE_OCCURENCE, VELOCITAS.VEHICLE_CALL)
            .replace(REGEX.FIND_UNWANTED_VEHICLE_CHANGE, VELOCITAS.VEHICLE_CALL_AS_ARGUMENT)
            .replace(REGEX.FIND_PRINTF_STATEMENTS, VELOCITAS.INFO_LOGGER_SIGNATURE)
            .replace(REGEX.FIND_PRINT_STATEMENTS, VELOCITAS.INFO_LOGGER_SIGNATURE);
    }
}
