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
import { CreateCodeSnippetForTemplateStep } from './pipeline/create-code-snippet';
import { ExtractClassesStep } from './pipeline/extract-classes';
import { ExtractImportsStep } from './pipeline/extract-imports';
import { ExtractMethodsStep } from './pipeline/extract-methods';
import { ExtractVariablesStep } from './pipeline/extract-variables';
import { IPipelineStep } from './pipeline/pipeline-base';
import { PrepareCodeSnippetStep } from './pipeline/prepare-code-snippet';

import { DIGITAL_AUTO, PYTHON, VELOCITAS } from './utils/codeConstants';
import { CONTENT_ENCODINGS } from './utils/constants';
import { REGEX } from './utils/regex';

export class CodeContext {
    basicImportsArray: string[] = [];
    variablesArray: string[][] = [];
    variableNames: string[] = [];
    memberVariables: string = '';
    seperateClassesArray: string[][] = [];
    seperateClasses: string = '';
    seperateMethodsArray: string[][] = [];
    seperateMethods: string = '';
    codeSnippetStringArray: string[] = [];
    codeSnippetForTemplate: string = '';
}
export class CodeFormatter {
    private codeContext: CodeContext = {
        basicImportsArray: [],
        variablesArray: [],
        variableNames: [],
        memberVariables: '',
        seperateClassesArray: [],
        seperateClasses: '',
        seperateMethodsArray: [],
        seperateMethods: '',
        codeSnippetStringArray: [],
        codeSnippetForTemplate: '',
    };

    public formatMainPy(base64MainPyContentData: string, base64CodeSnippet: string, appName: string): string {
        try {
            this.adaptCodeSnippet(base64CodeSnippet);
            const extractedMainPyStructure = this.extractMainPyBaseStructure(base64MainPyContentData);
            const formattedMainPy = this.addCodeSnippetToMainPy(extractedMainPyStructure, appName);
            const finalizedMainPy = this.finalizeMainPy(formattedMainPy);
            return finalizedMainPy;
        } catch (error) {
            throw error;
        }
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

    private createArrayFromMultilineString(multilineString: string): string[] {
        return multilineString.split(/\r?\n/);
    }

    private indentCodeSnippet(decodedSnippet: string, indentCount: number): string {
        const indent = ' ';
        const indentedCodeSnippet = decodedSnippet.replace(REGEX.FIND_EVERY_LINE_START, indent.repeat(indentCount));
        return indentedCodeSnippet;
    }

    private adaptCodeSnippet(base64CodeSnippet: string): void {
        let decodedBase64CodeSnippet = Buffer.from(base64CodeSnippet, CONTENT_ENCODINGS.base64 as BufferEncoding).toString(
            CONTENT_ENCODINGS.utf8 as BufferEncoding
        );

        this.codeContext.codeSnippetStringArray = this.createArrayFromMultilineString(decodedBase64CodeSnippet);

        const pipeline = new Array<IPipelineStep>();

        pipeline.push(new PrepareCodeSnippetStep());
        pipeline.push(new ExtractImportsStep());
        pipeline.push(new ExtractVariablesStep());
        pipeline.push(new ExtractClassesStep());
        pipeline.push(new ExtractMethodsStep());
        pipeline.push(new CreateCodeSnippetForTemplateStep());

        pipeline.forEach((pipelineStep) => pipelineStep.execute(this.codeContext));
    }

    private extractMainPyBaseStructure(base64MainPyContentData: string): string {
        let decodedMainPyContentData = Buffer.from(base64MainPyContentData, CONTENT_ENCODINGS.base64 as BufferEncoding).toString(
            CONTENT_ENCODINGS.utf8 as BufferEncoding
        );
        try {
            const mainPyBaseStructure = decodedMainPyContentData
                .replace(REGEX.FIND_GLOBAL_TOPIC_VARIABLES, `\n\n${this.codeContext.seperateClasses}\n\n${PYTHON.CLASS}`)
                .replace(REGEX.GET_WHITESPACE_FOLLOWED_BY_COMMENTS, '')
                .replace(REGEX.EVERYTHING_BETWEEN_MULTILINE, '')
                .replace(REGEX.GET_EVERY_PYTHON_DOCSTRING, '')
                .replace(REGEX.GET_EVERY_DELETABLE_TEMPLATE_CODE, `\n\n${this.codeContext.seperateMethods}\n\n${VELOCITAS.MAIN_METHOD}`);

            return mainPyBaseStructure;
        } catch (error) {
            throw new Error('Error in extractMainPyBaseStructure.');
        }
    }

    private addCodeSnippetToMainPy(extractedMainPyStructure: string, appName: string): string {
        const appNameForTemplate = `${appName.charAt(0).toUpperCase()}${appName.slice(1)}${VELOCITAS.VEHICLE_APP_SUFFIX}`;
        try {
            const newMainPy = extractedMainPyStructure
                .replace(REGEX.FIND_BEGIN_OF_ON_START_METHOD, this.codeContext.codeSnippetForTemplate)
                .replace(REGEX.FIND_VEHICLE_INIT, `self.Vehicle = vehicle_client\n${this.codeContext.memberVariables}`)
                .replace(VELOCITAS.IMPORT_SUBSCRIBE_TOPIC, '')
                .replace(REGEX.FIND_SAMPLE_APP, appNameForTemplate);
            return newMainPy;
        } catch (error) {
            throw new Error('Error in addCodeSnippetToMainPy.');
        }
    }

    private finalizeMainPy(newMainPy: string): string {
        let finalCode: string | string[];
        finalCode = this.createArrayFromMultilineString(newMainPy);
        this.adaptToMqtt(finalCode);
        const firstLineOfImport = finalCode.find((element: string) => element.includes(PYTHON.IMPORT));
        this.codeContext.basicImportsArray?.forEach((basicImportString: string) => {
            if (basicImportString != DIGITAL_AUTO.IMPORT_PLUGINS) {
                (finalCode as string[]).splice(finalCode.indexOf(firstLineOfImport as string), 0, basicImportString);
            }
        });
        finalCode = this.createMultilineStringFromArray(finalCode);
        const tempCode = finalCode
            .replace(REGEX.FIND_SUBSCRIBE_METHOD_CALL, VELOCITAS.SUBSCRIPTION_SIGNATURE)
            .replace(/await await/gm, `${PYTHON.AWAIT}`)
            .replace(/\.get\(\)/gm, `${VELOCITAS.GET_VALUE}`)
            .replace(REGEX.GET_EVERY_PLUGINS_USAGE, '')
            .replace(/await aio/gm, 'time');

        finalCode = this.createArrayFromMultilineString(tempCode);

        finalCode.forEach((codeLine: string, index) => {
            if (codeLine.includes(VELOCITAS.GET_VALUE)) {
                if (codeLine.includes('{await')) {
                    (finalCode as string[])[index] = codeLine.replace(/{await/, '{(await');
                } else {
                    (finalCode as string[])[index] = codeLine.replace(/await/, '(await');
                }
            }
            if (codeLine.includes(VELOCITAS.INFO_LOGGER_SIGNATURE) && codeLine.includes('",')) {
                (finalCode as string[])[index] = codeLine.replace('",', ': %s",');
            }
        });
        if (!finalCode.some((line: string) => line.includes(VELOCITAS.CLASS_METHOD_SIGNATURE))) {
            (finalCode as string[]).splice(finalCode.indexOf(VELOCITAS.IMPORT_DATAPOINT_REPLY), 1);
        }
        const formattedFinalCode = this.createMultilineStringFromArray(finalCode);
        const encodedNewMainPy = Buffer.from(formattedFinalCode, CONTENT_ENCODINGS.utf8 as BufferEncoding).toString(
            CONTENT_ENCODINGS.base64 as BufferEncoding
        );
        return encodedNewMainPy;
    }

    private adaptToMqtt(mainPyStringArray: string[]) {
        const setTextLines: string[] = mainPyStringArray.filter(
            (line) => line.includes(DIGITAL_AUTO.NOTIFY) || line.includes(DIGITAL_AUTO.SET_TEXT)
        );
        setTextLines.forEach((setTextLine: string) => {
            let mqttTopic: string;
            if (setTextLine.includes(DIGITAL_AUTO.NOTIFY)) {
                mqttTopic = setTextLine.split('.')[1].split('(')[0].trim();
            } else {
                mqttTopic = setTextLine.split('.')[0].trim();
            }
            const mqttMessage = setTextLine.split('"')[1].trim();
            const mqttPublishLine = this.transformToMqttPublish(mqttTopic, mqttMessage);
            const spacesBeforeSetTextLine = new RegExp(`\\s(?=[^,]*${mqttTopic})`, 'g');
            const spaceCountBeforeSetTextLine = setTextLine.length - setTextLine.replace(spacesBeforeSetTextLine, '').length;
            const newMqttPublishLine = this.indentCodeSnippet(mqttPublishLine, spaceCountBeforeSetTextLine);
            mainPyStringArray[mainPyStringArray.indexOf(setTextLine)] = newMqttPublishLine;
        });
        return mainPyStringArray;
    }

    private transformToMqttPublish(mqttTopic: string, mqttMessage: string): string {
        const mqttPublish = `await self.publish_mqtt_event("${mqttTopic}", json.dumps({"result": {"message": f"""${mqttMessage}"""}}))`;
        return mqttPublish;
    }
}
