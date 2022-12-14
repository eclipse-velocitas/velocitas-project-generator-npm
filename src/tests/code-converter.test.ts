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
import { CodeConverter } from '../code-converter';
import { createArrayFromMultilineString } from '../utils/helpers';

chai.use(chaiAsPromised);
const expect = chai.expect;

const APP_NAME = 'test';

const EXAMPLE_INPUT_1 = readFileSync(`${path.join(__dirname, 'files/example_input_1.py')}`, 'base64');
const EXAMPLE_INPUT_2 = readFileSync(`${path.join(__dirname, 'files/example_input_2.py')}`, 'base64');
const EXPECTED_OUTPUT_1 = readFileSync(`${path.join(__dirname, 'files/example_output_1.py')}`, 'utf8');
const EXPECTED_OUTPUT_2 = readFileSync(`${path.join(__dirname, 'files/example_output_2.py')}`, 'utf8');
const VELOCITAS_TEMPLATE_MAINPY = readFileSync(`${path.join(__dirname, 'files/velocitas_template_main.py')}`, 'base64');

const MQTT_MESSAGE_WITH_FORMAT_STRING = `
format_1 = "test_1"
format_2 = "test_2"
test_1.set_text(f"{format_1} is finished and will format correctly")
test_2.set_text(f"{format_2} is finished and will format correctly")
`;
const EXPECTED_MQTT_PUBLISH_WITH_FORMAT_STRING = [
    'await self.publish_mqtt_event("test_1", json.dumps({"result": {"message": f"""{self.format_1} is finished and will format correctly"""}}))',
    'await self.publish_mqtt_event("test_2", json.dumps({"result": {"message": f"""{self.format_2} is finished and will format correctly"""}}))',
];

const MQTT_MESSAGE_WITHOUT_FORMAT_STRING = 'plugin.notifyTest("Test is finished and will format correctly")';
const EXPECTED_MQTT_PUBLISH_WITHOUT_FORMAT_STRING =
    'await self.publish_mqtt_event("notifyTest", json.dumps({"result": {"message": """Test is finished and will format correctly"""}}))';

describe('Code Converter', () => {
    it('should initialize', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        expect(codeConverter).to.be.instanceof(CodeConverter);
    });
    it('should format main.py correctly for example 1', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, EXAMPLE_INPUT_1, APP_NAME);
        const encodedExpectedOutputMainPyContentData = Buffer.from(EXPECTED_OUTPUT_1.trim(), 'utf8').toString('base64');
        expect(convertedMainPy).to.be.equal(encodedExpectedOutputMainPyContentData);
    });
    it('should format main.py correctly for example 2', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, EXAMPLE_INPUT_2, APP_NAME);
        const encodedExpectedOutputMainPyContentData = Buffer.from(EXPECTED_OUTPUT_2.trim(), 'utf8').toString('base64');
        expect(convertedMainPy).to.be.equal(encodedExpectedOutputMainPyContentData);
    });
});

describe('Transform to MQTT', () => {
    it('should transform publish_mqtt_event with format string correctly', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const ENCODED_STRING = Buffer.from(MQTT_MESSAGE_WITH_FORMAT_STRING.trim(), 'utf8').toString('base64');
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, ENCODED_STRING, APP_NAME);
        const newDecodedMainPy = Buffer.from(convertedMainPy.trim(), 'base64').toString('utf8');
        const newMainPyArray = createArrayFromMultilineString(newDecodedMainPy);
        expect(newMainPyArray.join()).to.include(EXPECTED_MQTT_PUBLISH_WITH_FORMAT_STRING[0]);
        expect(newMainPyArray.join()).to.include(EXPECTED_MQTT_PUBLISH_WITH_FORMAT_STRING[1]);
    });
    it('should transform publish_mqtt_event without format string correctly', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const ENCODED_STRING = Buffer.from(MQTT_MESSAGE_WITHOUT_FORMAT_STRING.trim(), 'utf8').toString('base64');
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, ENCODED_STRING, APP_NAME);
        const newDecodedMainPy = Buffer.from(convertedMainPy.trim(), 'base64').toString('utf8');
        const newMainPyArray = createArrayFromMultilineString(newDecodedMainPy);
        expect(newMainPyArray.join()).to.include(EXPECTED_MQTT_PUBLISH_WITHOUT_FORMAT_STRING);
    });
});
