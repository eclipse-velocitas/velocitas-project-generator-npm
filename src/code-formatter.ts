import { Buffer } from 'buffer';
import { CONTENT_ENCODINGS } from './utils/constants';
import { REGEX } from './utils/regex';

export class CodeFormatter {
    private basicImportsArray: string[] = [];
    private seperateClassesArray: string[][] = [];
    private seperateMethodsArray: string[][] = [];
    private codeSnippetStringArray: string[] = [];

    public formatMainPy(base64MainPyContentData: string, base64CodeSnippet: string, appName: string) {
        try {
            const formattedCodeSnippet = this.formatCodeSnippet(base64CodeSnippet);
            const extractedMainPyStructure = this.extractMainPyBaseStructure(base64MainPyContentData);
            const formattedMainPy = this.addCodeSnippetToMainPy(extractedMainPyStructure, formattedCodeSnippet, appName);
            const finalizedMainPy = this.finalizeMainPy(formattedMainPy);
            return finalizedMainPy;
        } catch (error) {
            throw error;
        }
    }

    private extractMainPyBaseStructure(base64MainPyContentData: string) {
        let seperateClassForTemplate = '';
        let seperateMethodsForTemplate = '';
        let decodedMainPyContentData = Buffer.from(base64MainPyContentData, CONTENT_ENCODINGS.base64 as BufferEncoding).toString(
            CONTENT_ENCODINGS.utf8 as BufferEncoding
        );
        if (this.seperateClassesArray.length !== 0) {
            seperateClassForTemplate = this.createMultilineStringFromArray(this.seperateClassesArray[0])
                .replace(REGEX.FIND_VEHICLE_OCCURENCE, 'await self.Vehicle')
                .replace(REGEX.FIND_UNWANTED_VEHICLE_CHANGE, '(self.Vehicle')
                .replace(REGEX.FIND_PRINTF_STATEMENTS, 'logger.info(')
                .replace(REGEX.FIND_PRINT_STATEMENTS, 'logger.info(');
        }
        if (this.seperateMethodsArray.length !== 0) {
            seperateMethodsForTemplate = this.createMultilineStringFromArray(this.seperateMethodsArray)
                .replace(REGEX.FIND_VEHICLE_OCCURENCE, 'await self.Vehicle')
                .replace(REGEX.FIND_UNWANTED_VEHICLE_CHANGE, '(self.Vehicle')
                .replace(REGEX.FIND_PRINTF_STATEMENTS, 'logger.info(')
                .replace(REGEX.FIND_PRINT_STATEMENTS, 'logger.info(');
            seperateMethodsForTemplate = this.indentCodeSnippet(seperateMethodsForTemplate, 4);
        }
        try {
            const mainPyBaseStructure = decodedMainPyContentData
                .replace(REGEX.FROM_LOGGER_TO_CLASS, `\n\n${seperateClassForTemplate}\n\nclass`)
                .replace(REGEX.GET_SAMPLE_VEHICLE_APP, '')
                .replace(REGEX.GET_WHITESPACE_FOLLOWED_BY_COMMENTS, '')
                .replace(REGEX.EVERYTHING_BETWEEN_MULTILINE, '')
                .replace(REGEX.GET_EVERY_PYTHON_DOCSTRING, '')
                .replace(REGEX.GET_EVERY_DELETABLE_TEMPLATE_CODE, `\n\n${seperateMethodsForTemplate}\n\nasync def main():`);

            return mainPyBaseStructure;
        } catch (error) {
            throw new Error('Error in extractMainPyBaseStructure.');
        }
    }

    private formatCodeSnippet(base64CodeSnippet: string): string {
        let decodedBase64CodeSnippet = Buffer.from(base64CodeSnippet, CONTENT_ENCODINGS.base64 as BufferEncoding).toString(
            CONTENT_ENCODINGS.utf8 as BufferEncoding
        );
        this.codeSnippetStringArray = this.createArrayFromMultilineString(decodedBase64CodeSnippet);

        this.codeSnippetStringArray = this.removeSubstringFromArray(this.codeSnippetStringArray, 'Vehicle()');
        this.codeSnippetStringArray = this.removeSubstringFromArray(this.codeSnippetStringArray, 'from', 'import');
        this.codeSnippetStringArray = this.removeSubstringFromArray(this.codeSnippetStringArray, '#');

        this.basicImportsArray = this.identifyBasicImports(this.codeSnippetStringArray);
        this.seperateClassesArray = this.identifySeperateClass(this.codeSnippetStringArray);
        this.seperateMethodsArray = this.identifyMethodBlocks(this.codeSnippetStringArray);

        const codeSnippetForTemplate = this.createMultilineStringFromArray(this.codeSnippetStringArray)
            .replace(REGEX.FIND_VEHICLE_OCCURENCE, 'await self.Vehicle')
            .replace(REGEX.FIND_UNWANTED_VEHICLE_CHANGE, '(self.Vehicle')
            .replace(REGEX.FIND_PRINTF_STATEMENTS, 'logger.info(')
            .replace(REGEX.FIND_PRINT_STATEMENTS, 'logger.info(');

        return codeSnippetForTemplate;
    }
    private identifyBasicImports(codeSnippetStringArray: string[]): string[] {
        const basicImportsArray = codeSnippetStringArray.filter((element) => element.includes('import'));
        this.cleanUpCodeSnippet(basicImportsArray);
        return basicImportsArray;
    }

    private addCodeSnippetToMainPy(extractedMainPyStructure: string, formatCodeSnippet: string, appName: string) {
        const appNameForTemplate = `${appName.charAt(0).toUpperCase()}${appName.slice(1)}App`;

        try {
            const newMainPy = extractedMainPyStructure
                .replace(REGEX.FIND_BEGIN_OF_ON_START_METHOD, this.indentCodeSnippet(formatCodeSnippet, 8))
                .replace(/SampleApp/gm, appNameForTemplate);
            return newMainPy;
        } catch (error) {
            throw new Error('Error in addCodeSnippetToMainPy.');
        }
    }

    private indentCodeSnippet(decodedSnippet: string, count: number): string {
        const indent = ' ';
        const indentedCodeSnippet = decodedSnippet.replace(REGEX.FIND_EVERY_LINE_START, indent.repeat(count));
        return indentedCodeSnippet;
    }

    private removeSubstringFromArray(array: string[], substringOne: string, substringTwo?: string): string[] {
        const indexesToRemove: number[] = [];
        array.forEach((e: string) => {
            if (!substringTwo && e.includes(substringOne)) {
                const indexToRemove = array.indexOf(e);
                indexesToRemove.push(indexToRemove);
            }
            if (substringTwo && e.includes(substringOne) && e.includes(substringTwo)) {
                const indexToRemove = array.indexOf(e);
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

    private lineBelongsToClass(array: any, index: any): boolean {
        const lineWithoutIndentation = array[index].replace(REGEX.FIND_LINE_BEGINNING_WITH_WHITESPACES, '');

        if (array[index] !== '' && !array[index].includes('class') && array[index].length === lineWithoutIndentation.length) {
            return false;
        }
        return true;
    }

    private identifySeperateClass(array: string[]): string[][] {
        const classStart = 'class';
        const classStartIndexArray: number[] = [];

        array.forEach((e: string) => {
            if (e.includes(classStart)) {
                const methodStartIndex = array.indexOf(e);
                classStartIndexArray.push(methodStartIndex);
            }
        });
        const classArray: string[][] = [];
        classStartIndexArray.forEach((e: number) => {
            const tempClasses: string[] = [];
            for (let index = e; this.lineBelongsToClass(array, index); index++) {
                tempClasses.push(array[index]);
            }
            classArray.push(tempClasses);
        });
        this.cleanUpCodeSnippet(classArray);
        return classArray;
    }

    private identifyMethodBlocks(array: string[]) {
        const methodStart = 'def';
        const methodStartIndexArray: number[] = [];
        array.forEach((e: string) => {
            if (e.includes(methodStart)) {
                const re = new RegExp(`\\s(?=[^,]*${methodStart})`, 'g');
                let eSpacesBeforeWord = e.length - e.replace(re, '').length;
                console.log(`There are ${eSpacesBeforeWord} spaces before ${e}`);
                const methodStartIndex = array.indexOf(e);
                methodStartIndexArray.push(methodStartIndex);
            }
        });
        const methodArray: string[][] = [];
        const modifiedMethodArray: string[][] = [];
        methodStartIndexArray.forEach((e: number) => {
            const tempMethods: string[] = [];
            const tempModifiedMethods: string[] = [];
            for (let index = e; array[index] != ''; index++) {
                tempMethods.push(array[index]);
                if (array[index].includes(methodStart)) {
                    tempModifiedMethods.push(array[index].replace(methodStart, 'async def').replace(/\(/, '(self, '));
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
        let linesToRemove: any = [];
        if (arrayToCleanUp[0].constructor === Array) {
            arrayToCleanUp.forEach((array: any) => {
                linesToRemove = [...linesToRemove, ...array];
            });
        } else {
            arrayToCleanUp.forEach((string: any) => {
                linesToRemove.push(string);
            });
        }
        linesToRemove.forEach((e: any) => {
            this.codeSnippetStringArray.splice(this.codeSnippetStringArray.indexOf(e), 1);
        });
    }

    private createMultilineStringFromArray(array: string[] | string[][]) {
        let newString: string = '';

        if (array[0].constructor === Array) {
            (array as string[][]).forEach((e: string[]) => {
                e.forEach((e: string) => {
                    newString = newString.concat(`${e}\n`);
                });
                newString = newString.concat(`\n`);
            });
        } else {
            (array as string[]).forEach((e: string) => {
                newString = newString.concat(`${e}\n`);
            });
        }
        return newString.trim();
    }

    private finalizeMainPy(newMainPy: string): string {
        const newMainPyStringArray = this.createArrayFromMultilineString(newMainPy);
        const found = newMainPyStringArray.find((element: string) => element.includes('import'));

        this.basicImportsArray.forEach((basicImportString: string) => {
            newMainPyStringArray.splice(newMainPyStringArray.indexOf(found as string), 0, basicImportString);
        });

        const finalCode = this.createMultilineStringFromArray(newMainPyStringArray);
        const formattedFinalCode = finalCode.replace(/\.subscribe\(/gm, '.subscribe(self.');

        const encodedNewMainPy = Buffer.from(formattedFinalCode, CONTENT_ENCODINGS.utf8 as BufferEncoding).toString(
            CONTENT_ENCODINGS.base64 as BufferEncoding
        );
        return encodedNewMainPy;
    }

    private createArrayFromMultilineString(multilineString: string): string[] {
        return multilineString.split(/\r?\n/);
    }
}
