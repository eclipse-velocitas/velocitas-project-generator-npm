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

import { CreateCodeSnippetForTemplateStep } from './pipeline/create-code-snippet';
import { ExtractClassesStep } from './pipeline/extract-classes';
import { ExtractImportsStep } from './pipeline/extract-imports';
import { ExtractMethodsStep } from './pipeline/extract-methods';
import { ExtractVariablesStep } from './pipeline/extract-variables';
import { IPipelineStep } from './pipeline/pipeline-base';
import { PrepareCodeSnippetStep } from './pipeline/prepare-code-snippet';

import { DIGITAL_AUTO, PYTHON, VELOCITAS } from './utils/codeConstants';
import { REGEX } from './utils/regex';
import {
    createArrayFromMultilineString,
    createMultilineStringFromArray,
    indentCodeSnippet,
    insertClassDocString,
    removeEmptyLines,
} from './utils/helpers';

export class CodeContext {
    appName: string = '';
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

/**
 * Initialize a new `CodeConverter`.
 *
 * @return {CodeConverter} which is used to convert digital.auto prototype to a functioning velocitas structure.
 * @public
 */
export class CodeConverter {
    private codeContext: CodeContext = new CodeContext();

    /**
     * Converts main.py from digital.auto to velocitas structure.
     * @param {string} mainPyContentData
     * @param {string} codeSnippet
     * @param {string} appName
     * @return {string} finalizedMainPy
     * @public
     */
    public convertMainPy(mainPyContentData: string, codeSnippet: string, appName: string): string {
        try {
            this.codeContext.appName = appName;
            this.adaptCodeSnippet(codeSnippet);
            const extractedMainPyStructure = this.extractMainPyBaseStructure(mainPyContentData);
            const convertedMainPy = this.addCodeSnippetToMainPy(extractedMainPyStructure);
            const finalizedMainPy = this.finalizeMainPy(convertedMainPy);
            return finalizedMainPy;
        } catch (error) {
            throw error;
        }
    }

    private adaptCodeSnippet(codeSnippet: string): void {
        this.codeContext.codeSnippetStringArray = createArrayFromMultilineString(codeSnippet);

        const pipeline = new Array<IPipelineStep>();

        pipeline.push(new PrepareCodeSnippetStep());
        pipeline.push(new ExtractImportsStep());
        pipeline.push(new ExtractVariablesStep());
        pipeline.push(new ExtractClassesStep());
        pipeline.push(new ExtractMethodsStep());
        pipeline.push(new CreateCodeSnippetForTemplateStep());

        pipeline.forEach((pipelineStep) => pipelineStep.execute(this.codeContext));
    }

    private extractMainPyBaseStructure(mainPyContentData: string): string {
        try {
            let tempContent: string | string[];
            tempContent = createArrayFromMultilineString(mainPyContentData);
            tempContent = tempContent.filter((line) => {
                if (line.includes(` ${PYTHON.COMMENT} `) && !line.includes(VELOCITAS.TYPE_IGNORE)) {
                    return false;
                }
                if (!line.includes(VELOCITAS.PREDEFINED_TOPIC)) {
                    return true;
                }
            });

            const classesArray = createArrayFromMultilineString(this.codeContext.seperateClasses);
            if (classesArray.length > 0) {
                tempContent.splice(tempContent.indexOf('class SampleApp(VehicleApp):') - 1, 0, ...classesArray);
            }

            const topPartOfTemplate = tempContent.slice(0, tempContent.indexOf(`    ${VELOCITAS.ON_START}`) + 1);
            const bottomPartOfTemplate = tempContent.slice(tempContent.indexOf(VELOCITAS.MAIN_METHOD) - 1, tempContent.length);
            const methodsArray = createArrayFromMultilineString(this.codeContext.seperateMethods);
            if (methodsArray.length > 1) {
                methodsArray.unshift('');
                methodsArray.push('');
            }
            tempContent = topPartOfTemplate.concat(methodsArray).concat(bottomPartOfTemplate);
            tempContent = createMultilineStringFromArray(tempContent);

            const mainPyBaseStructure = tempContent.replace(REGEX.EVERYTHING_BETWEEN_MULTILINE, '');

            return mainPyBaseStructure;
        } catch (error) {
            throw new Error('Error in extractMainPyBaseStructure.');
        }
    }

    private addCodeSnippetToMainPy(extractedMainPyStructure: string): string {
        const appNameForTemplate = `${this.codeContext.appName.charAt(0).toUpperCase()}${this.codeContext.appName.slice(1)}${
            VELOCITAS.VEHICLE_APP_SUFFIX
        }`;
        try {
            const newMainPy = extractedMainPyStructure
                .replace(REGEX.FIND_BEGIN_OF_ON_START_METHOD, `${this.codeContext.codeSnippetForTemplate}\n`)
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
        finalCode = createArrayFromMultilineString(newMainPy);
        this.adaptToMqtt(finalCode);
        const firstLineOfImport = finalCode.find((element: string) => element.includes(PYTHON.IMPORT));
        this.codeContext.basicImportsArray?.forEach((basicImportString: string) => {
            if (basicImportString != DIGITAL_AUTO.IMPORT_PLUGINS) {
                (finalCode as string[]).splice(finalCode.indexOf(firstLineOfImport as string), 0, basicImportString);
            }
        });
        finalCode = createMultilineStringFromArray(finalCode);
        const tempCode = finalCode
            .replace(REGEX.FIND_SUBSCRIBE_METHOD_CALL, VELOCITAS.SUBSCRIPTION_SIGNATURE)
            .replace(/await await/gm, `${PYTHON.AWAIT}`)
            .replace(/\.get\(\)/gm, `${VELOCITAS.GET_VALUE}`)
            .replace(REGEX.GET_EVERY_PLUGINS_USAGE, '')
            .replace(/await aio/gm, VELOCITAS.ASYNCIO);

        finalCode = createArrayFromMultilineString(tempCode);
        finalCode = removeEmptyLines(finalCode);
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
        insertClassDocString(finalCode, this.codeContext.appName);
        const convertedFinalCode = createMultilineStringFromArray(finalCode);

        return convertedFinalCode;
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
            const newMqttPublishLine = indentCodeSnippet(mqttPublishLine, spaceCountBeforeSetTextLine);
            mainPyStringArray[mainPyStringArray.indexOf(setTextLine)] = newMqttPublishLine;
        });
        return mainPyStringArray;
    }

    private transformToMqttPublish(mqttTopic: string, mqttMessage: string): string {
        let mqttPublish: string = `await self.publish_mqtt_event("${mqttTopic}", json.dumps({"result": {"message": """${mqttMessage}"""}}))`;
        if (mqttMessage.includes('{')) {
            const variableInMqttMessage = this.codeContext.variableNames.find((variable: string) => mqttMessage.includes(variable));
            if (variableInMqttMessage) {
                mqttMessage = mqttMessage.replace(variableInMqttMessage, `self.${variableInMqttMessage}`);
            }
            mqttPublish = `await self.publish_mqtt_event("${mqttTopic}", json.dumps({"result": {"message": f"""${mqttMessage}"""}}))`;
        }
        return mqttPublish;
    }
}
