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
import { INDENTATION, VELOCITAS } from '../utils/codeConstants';
import { createMultilineStringFromArray, indentCodeSnippet, variableConditionCheck } from '../utils/helpers';
import { variableRegex } from '../utils/regex';
import { PipelineStep } from './pipeline-base';

/**
 * Creates the code snippet which will be put into the velocitas template
 * @extends PipelineStep
 */
export class CreateCodeSnippetForTemplateStep extends PipelineStep {
    public execute(context: CodeContext) {
        this.changeMemberVariables(context);
        context.codeSnippetForTemplate = `${indentCodeSnippet(VELOCITAS.ON_START, INDENTATION.COUNT_CLASS)}\n${indentCodeSnippet(
            this.adaptCodeBlocksToVelocitasStructure(createMultilineStringFromArray(context.codeSnippetStringArray)),
            INDENTATION.COUNT_METHOD
        )}`;
    }
    private changeMemberVariables(context: CodeContext) {
        context.variableNames.forEach((variableName: string) => {
            context.codeSnippetStringArray.forEach((stringElement: string, index) => {
                if (stringElement.includes(`${variableName} =`) && !stringElement.includes(`self.`)) {
                    context.codeSnippetStringArray[index] = stringElement.replace(variableName, `self.${variableName}`);
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

                if (variableConditionCheck(stringElement, variableName)) {
                    context.codeSnippetStringArray[index] = stringElement.replace(variableRegex(variableName), `self.${variableName}`);
                }
            });
        });
    }
}
