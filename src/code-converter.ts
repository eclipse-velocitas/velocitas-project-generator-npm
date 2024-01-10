// Copyright (c) 2023-2024 Contributors to the Eclipse Foundation
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
 * Result of code conversion containing finalizedMainPy as string and
 * an array of DataPointDefinition
 * @type CodeConversionResult
 * @prop {string} finalizedMainPy Finalized main.py.
 * @prop {any[]} dataPoints Array of datapoints for AppManifest.json.
 */
export interface CodeConversionResult {
    finalizedMainPy: string;
    dataPoints: any[];
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
     * @return {CodeConversionResult} Result of code conversion.
     * @public
     */
    public convertMainPy(mainPyContentData: string, codeSnippet: string, appName: string): CodeConversionResult {
        try {
            this.codeContext.appName = appName;
            this.adaptCodeSnippet(codeSnippet);
            const extractedMainPyStructure = this.extractMainPyBaseStructure(mainPyContentData);
            const convertedMainPy = this.addCodeSnippetToMainPy(extractedMainPyStructure);
            const finalizedMainPy = this.finalizeMainPy(convertedMainPy);
            const dataPoints = this.identifyDatapoints(finalizedMainPy);
            return { finalizedMainPy: finalizedMainPy, dataPoints: dataPoints };
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
            tempContent = tempContent.filter((line) => !line.includes(` ${PYTHON.COMMENT} `) || line.includes(VELOCITAS.TYPE_IGNORE));
            tempContent = tempContent.filter((line) => !line.includes(VELOCITAS.PREDEFINED_TOPIC));

            const classesArray = createArrayFromMultilineString(this.codeContext.seperateClasses);
            const velocitasClassStartIndex = tempContent.indexOf('class SampleApp(VehicleApp):');
            if (classesArray.length > 0) {
                tempContent.splice(velocitasClassStartIndex - 1, 0, ...classesArray);
            }
            const velocitasOnStartIndex = tempContent.indexOf(`    ${VELOCITAS.ON_START}`);
            const topPartOfTemplate = tempContent.slice(0, velocitasOnStartIndex + 1);
            const velocitasMainIndex = tempContent.indexOf(VELOCITAS.MAIN_METHOD);
            const bottomPartOfTemplate = tempContent.slice(velocitasMainIndex - 1, tempContent.length);
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
        let finalCode: string | string[] = createArrayFromMultilineString(newMainPy);
        this.adaptToMqtt(finalCode);
        const firstLineOfImport = finalCode.find((element: string) => element.includes(PYTHON.IMPORT));
        (finalCode as string[]).splice(finalCode.indexOf(firstLineOfImport as string), 0, '# flake8: noqa: E501,B950 line too long');

        this.codeContext.basicImportsArray?.forEach((basicImportString: string) => {
            if (basicImportString != DIGITAL_AUTO.IMPORT_PLUGINS) {
                (finalCode as string[]).splice(finalCode.indexOf(firstLineOfImport as string), 0, basicImportString);
            }
        });
        finalCode = createMultilineStringFromArray(finalCode);
        finalCode = finalCode
            .replace(REGEX.FIND_SUBSCRIBE_METHOD_CALL, VELOCITAS.SUBSCRIPTION_SIGNATURE)
            .replace(/await await/gm, `${PYTHON.AWAIT}`)
            .replace(/\.get\(\)/gm, `${VELOCITAS.GET_VALUE}`)
            .replace(REGEX.GET_EVERY_PLUGINS_USAGE, '')
            .replace(/await aio/gm, VELOCITAS.ASYNCIO);

        finalCode = createArrayFromMultilineString(finalCode);
        finalCode = removeEmptyLines(finalCode);
        finalCode.forEach((codeLine: string, index) => {
            if (codeLine.includes(VELOCITAS.GET_VALUE)) {
                (finalCode as string[])[index] = codeLine.replace(/await/, '(await').replace(/{await/, '{(await');
            }
            if (codeLine.includes(VELOCITAS.INFO_LOGGER_SIGNATURE) && codeLine.includes('",')) {
                (finalCode as string[])[index] = codeLine.replace('",', ': %s",');
            }
            if (codeLine.includes('.set(')) {
                const setArgument = codeLine.split('(')[1];
                if (setArgument.startsWith('self.Vehicle')) {
                    const vehicleClassEnumProperty = setArgument.split(')')[0];
                    const identifiedEnumString = vehicleClassEnumProperty.split('.').at(-1);
                    (finalCode as string[])[index] = codeLine.replace(vehicleClassEnumProperty, `"${identifiedEnumString}"`);
                }
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
        const setTextLines = mainPyStringArray.filter((line) => line.includes(DIGITAL_AUTO.NOTIFY) || line.includes(DIGITAL_AUTO.SET_TEXT));
        for (const setTextLine of setTextLines) {
            let mqttTopic;
            if (setTextLine.includes(DIGITAL_AUTO.NOTIFY)) {
                mqttTopic = setTextLine.split('.')[1].split('(')[0].trim();
            } else {
                mqttTopic = setTextLine.split('.')[0].trim();
            }
            const mqttMessage = setTextLine.split('"')[1].trim();
            const mqttPublishLine = this.generateMqttPublishString(mqttMessage, mqttTopic);
            const spacesBeforeSetTextLine = new RegExp(`\\s(?=[^,]*${mqttTopic})`, 'g');
            const spaceCountBeforeSetTextLine = setTextLine.length - setTextLine.replace(spacesBeforeSetTextLine, '').length;
            const newMqttPublishLine = indentCodeSnippet(mqttPublishLine, spaceCountBeforeSetTextLine);
            mainPyStringArray[mainPyStringArray.indexOf(setTextLine)] = newMqttPublishLine;
        }
        return mainPyStringArray;
    }

    private generateMqttPublishString(mqttMessage: string, mqttTopic: string) {
        const quoteType = mqttMessage.includes('{') ? `f"""` : `"""`;
        let jsonDumpsObject = `json.dumps({"result": {"message": ${quoteType}${mqttMessage}"""}}),\n)`;
        let mqttPublishString: string = `await self.publish_mqtt_event(\n${' '.repeat(4)}"${mqttTopic}",\n${' '.repeat(
            4
        )}${jsonDumpsObject}`;
        if (jsonDumpsObject.length > 88) {
            jsonDumpsObject = `json.dumps(\n${' '.repeat(8)}{\n${' '.repeat(12)}"result": {\n${' '.repeat(
                16
            )}"message": ${quoteType}${mqttMessage}"""\n${' '.repeat(12)}}\n${' '.repeat(8)}}\n${' '.repeat(4)}),\n)`;
            mqttPublishString = `await self.publish_mqtt_event(\n${' '.repeat(4)}"${mqttTopic}",\n${' '.repeat(4)}${jsonDumpsObject}`;
        }
        return mqttPublishString;
    }

    private identifyDatapoints(finalizedMainPy: string): any[] {
        const finalizedMainPyArray = createArrayFromMultilineString(finalizedMainPy);
        const dataPointsMap = new Map();
        const dataPoints: any[] = [];
        finalizedMainPyArray.forEach((line: string) => {
            if (line.includes('.Vehicle.')) {
                const captureAlternatives = '\\.subscribe|\\.get|\\.set|\\)';
                const dataPointRegExp = new RegExp(`Vehicle.*?(${captureAlternatives})`);
                const dataPointMatch = dataPointRegExp.exec(line);
                if (dataPointMatch) {
                    const dataPointPath = dataPointMatch[0].split(dataPointMatch[1])[0];
                    switch (dataPointMatch[1]) {
                        case '.set':
                            dataPointsMap.set(dataPointPath, 'write');
                            break;
                        default:
                            if (!dataPointsMap.has(dataPointPath)) {
                                dataPointsMap.set(dataPointPath, 'read');
                            }
                            break;
                    }
                }
            }
        });
        dataPointsMap.forEach((dataPointAccess: string, dataPointPath: string) =>
            dataPoints.push({ path: dataPointPath, access: dataPointAccess })
        );
        return dataPoints;
    }
}
