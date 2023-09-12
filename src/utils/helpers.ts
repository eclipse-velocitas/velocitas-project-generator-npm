// Copyright (c) 2023 Robert Bosch GmbH
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

import { INDENTATION, PYTHON, VELOCITAS } from './codeConstants';
import { CONTENT_ENCODINGS } from './constants';
import { REGEX, quotedVariableRegex, underscoredVariableRegex } from './regex';
import { Buffer } from 'buffer';

export const indentCodeSnippet = (decodedSnippet: string, indentCount: number): string => {
    const indent = ' ';
    const indentedCodeSnippet = decodedSnippet.replace(REGEX.FIND_EVERY_LINE_START, indent.repeat(indentCount));
    return indentedCodeSnippet;
};

export const createArrayFromMultilineString = (multilineString: string): string[] => {
    return multilineString.split(/\r?\n/);
};

export const createMultilineStringFromArray = (array: string[] | string[][]): string => {
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
};

export const removeEmptyLines = (array: string[]): string[] => {
    const indexesToRemove = new Set<number>();
    array.forEach((e: string, index: number) => {
        if (e === '' && array[index + 1] === '') {
            if (
                !array[index + 2].includes(PYTHON.CLASS) &&
                !array[index + 2].includes(VELOCITAS.EVENT_LOOP) &&
                !array[index + 2].includes(VELOCITAS.NEW_EVENT_LOOP) &&
                !array[index + 2].includes(VELOCITAS.MAIN_METHOD)
            ) {
                indexesToRemove.add(index);
            }
        }
        if (e === VELOCITAS.MAIN_METHOD && array[index + 1] === '') {
            indexesToRemove.add(index + 1);
        }
    });
    const arrayWithoutEmtpyLines = array.filter((_element, index) => !indexesToRemove.has(index));
    const indexOfOnStart = arrayWithoutEmtpyLines.indexOf(`${' '.repeat(4)}${VELOCITAS.ON_START}`);
    if (arrayWithoutEmtpyLines[indexOfOnStart + 1] === '') {
        arrayWithoutEmtpyLines.splice(indexOfOnStart + 1, 1);
    }
    return arrayWithoutEmtpyLines;
};

export const insertClassDocString = (array: string[], appName: string): void => {
    const vehicleAppClassLine: string = array.find((line: string) => line.includes(VELOCITAS.VEHICLE_APP_SIGNATURE))!;
    array.splice(
        array.indexOf(vehicleAppClassLine) + 1,
        0,
        indentCodeSnippet(`"""Velocitas App for ${appName}."""`, INDENTATION.COUNT_CLASS)
    );
};

export const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export const variableConditionCheck = (elementToCheck: any, variableName: string) =>
    elementToCheck.includes(`${variableName}`) &&
    (!elementToCheck.includes(`.${variableName}`) ||
        !elementToCheck.includes(`${variableName}"`) ||
        !elementToCheck.includes(`"${variableName}`)) &&
    !quotedVariableRegex(variableName).test(elementToCheck) &&
    !underscoredVariableRegex(variableName).test(elementToCheck);

export const decode = (string: string) =>
    Buffer.from(string, CONTENT_ENCODINGS.base64 as BufferEncoding).toString(CONTENT_ENCODINGS.utf8 as BufferEncoding);
export const encode = (string: string) =>
    Buffer.from(string, CONTENT_ENCODINGS.utf8 as BufferEncoding).toString(CONTENT_ENCODINGS.base64 as BufferEncoding);
