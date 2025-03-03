// Copyright (c) 2023-2025 Contributors to the Eclipse Foundation
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
import { PipelineStep } from './pipeline-base';

/**
 * Extracts imports from digital.auto prototype to the CodeContext
 * @extends PipelineStep
 */
export class ExtractImportsStep extends PipelineStep {
    public execute(context: CodeContext) {
        context.basicImportsArray = this.identifyBasicImports(context);
        this.cleanUpCodeSnippet(context.basicImportsArray, context);
    }
    private identifyBasicImports(context: CodeContext): string[] {
        let basicImportsArray: string[] = [];
        basicImportsArray = context.codeSnippetStringArray.filter((stringElement) => stringElement.includes(PYTHON.IMPORT));
        return basicImportsArray;
    }
}
