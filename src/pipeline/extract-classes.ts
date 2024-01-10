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

import { CodeContext } from '../code-converter';
import { PYTHON } from '../utils/codeConstants';
import { REGEX } from '../utils/regex';
import { createMultilineStringFromArray } from '../utils/helpers';
import { PipelineStep } from './pipeline-base';

/**
 * Extracts classes from digital.auto prototype to the CodeContext
 * @extends PipelineStep
 */
export class ExtractClassesStep extends PipelineStep {
    public execute(context: CodeContext) {
        context.seperateClassesArray = this.identifySeperateClass(context);
        if (context.seperateClassesArray.length !== 0) {
            context.seperateClasses = this.adaptCodeBlocksToVelocitasStructure(
                createMultilineStringFromArray(context.seperateClassesArray)
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
