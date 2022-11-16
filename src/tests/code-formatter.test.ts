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

import { readFileSync } from 'fs';
import * as path from 'path';

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { CodeFormatter } from '../code-formatter';

chai.use(chaiAsPromised);
const expect = chai.expect;

const APP_NAME = 'test';

const EXAMPLE_INPUT_1 = readFileSync(`${path.join(__dirname, 'files/example_input_1.py')}`, 'base64');
const EXAMPLE_INPUT_2 = readFileSync(`${path.join(__dirname, 'files/example_input_2.py')}`, 'base64');
const EXPECTED_OUTPUT_1 = readFileSync(`${path.join(__dirname, 'files/example_output_1.py')}`, 'utf8');
const EXPECTED_OUTPUT_2 = readFileSync(`${path.join(__dirname, 'files/example_output_2.py')}`, 'utf8');
const VELOCITAS_TEMPLATE_MAINPY = readFileSync(`${path.join(__dirname, 'files/velocitas_template_main.py')}`, 'base64');

describe('Code Formatter', () => {
    it('should initialize', async () => {
        const codeFormatter: CodeFormatter = new CodeFormatter();
        expect(codeFormatter).to.be.instanceof(CodeFormatter);
    });
    it('should format main.py correctly for example 1', async () => {
        const codeFormatter: CodeFormatter = new CodeFormatter();
        const formattedMainPy = codeFormatter.formatMainPy(VELOCITAS_TEMPLATE_MAINPY, EXAMPLE_INPUT_1, APP_NAME);
        const encodedExpectedOutputMainPyContentData = Buffer.from(EXPECTED_OUTPUT_1.trim(), 'utf8').toString('base64');
        expect(formattedMainPy).to.be.equal(encodedExpectedOutputMainPyContentData);
    });
    it('should format main.py correctly for example 2', async () => {
        const codeFormatter: CodeFormatter = new CodeFormatter();
        const formattedMainPy = codeFormatter.formatMainPy(VELOCITAS_TEMPLATE_MAINPY, EXAMPLE_INPUT_2, APP_NAME);
        const encodedExpectedOutputMainPyContentData = Buffer.from(EXPECTED_OUTPUT_2.trim(), 'utf8').toString('base64');
        expect(formattedMainPy).to.be.equal(encodedExpectedOutputMainPyContentData);
    });
});
