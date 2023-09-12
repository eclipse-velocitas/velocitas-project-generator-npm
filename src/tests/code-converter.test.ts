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

const EXAMPLE_INPUT_1 = readFileSync(`${path.join(__dirname, 'files/example_input_1.py')}`, 'utf8');
const EXAMPLE_INPUT_2 = readFileSync(`${path.join(__dirname, 'files/example_input_2.py')}`, 'utf8');
const EXAMPLE_INPUT_3 = readFileSync(`${path.join(__dirname, 'files/example_input_3.py')}`, 'utf8');
const EXPECTED_OUTPUT_1 = readFileSync(`${path.join(__dirname, 'files/example_output_1.py')}`, 'utf8');
const EXPECTED_DATAPOINTS_1 = [
    {
        path: 'Vehicle.Body.Windshield.Front.Wiping.System.ActualPosition',
        access: 'write',
    },
    {
        path: 'Vehicle.Body.Windshield.Front.Wiping.System.Mode',
        access: 'write',
    },
    {
        path: 'Vehicle.Body.Windshield.Front.Wiping.Mode',
        access: 'write',
    },
    {
        path: 'Vehicle.Body.Windshield.Front.Wiping.System.Frequency',
        access: 'write',
    },
    {
        path: 'Vehicle.Body.Windshield.Front.Wiping.System.TargetPosition',
        access: 'write',
    },
];
const EXPECTED_DATAPOINTS_2 = [
    {
        path: 'Vehicle.Cabin.Sunroof.Switch',
        access: 'write',
    },
];
const EXPECTED_DATAPOINTS_3 = [
    {
        access: 'write',
        path: 'Vehicle.Cabin.Seat.Row1.Pos1.Position',
    },
    {
        access: 'read',
        path: 'Vehicle.Speed',
    },
];
const EXPECTED_OUTPUT_2 = readFileSync(`${path.join(__dirname, 'files/example_output_2.py')}`, 'utf8');
const EXPECTED_OUTPUT_3 = readFileSync(`${path.join(__dirname, 'files/example_output_3.py')}`, 'utf8');
const VELOCITAS_TEMPLATE_MAINPY = readFileSync(`${path.join(__dirname, 'files/velocitas_template_main.py')}`, 'utf8');

const MQTT_MESSAGE_WITH_FORMAT_STRING = `
format_1 = "test_1"
format_2 = "test_2"
test_1.set_text(f"{format_1} is finished and will format correctly")
test_2.set_text(f"{format_2} is finished and will format correctly")
`;
const EXPECTED_MQTT_PUBLISH_WITH_FORMAT_STRING = [
    [
        '       await self.publish_mqtt_event(',
        '            "test_1",',
        '            json.dumps(',
        '                {',
        '                    "result": {',
        '                        "message": f"""{self.format_1} is finished and will format correctly"""',
        '                    }',
        '                }',
        '            ),',
        '        )',
    ],
    [
        '        await self.publish_mqtt_event(',
        '            "test_2",',
        '            json.dumps(',
        '                {',
        '                    "result": {',
        '                        "message": f"""{self.format_2} is finished and will format correctly"""',
        '                    }',
        '                }',
        '            ),',
        '        )',
    ],
];
const MQTT_MESSAGE_WITHOUT_FORMAT_STRING = 'plugin.notifyTest("Test is finished and will format correctly")';
const EXPECTED_MQTT_PUBLISH_WITHOUT_FORMAT_STRING = [
    '        await self.publish_mqtt_event(',
    '            "notifyTest",',
    '            json.dumps({"result": {"message": """Test is finished and will format correctly"""}}),',
    '        )',
];

describe('Code Converter', () => {
    it('should initialize', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        expect(codeConverter).to.be.instanceof(CodeConverter);
    });
    it('should format main.py correctly for example 1', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, EXAMPLE_INPUT_1, APP_NAME);
        expect(convertedMainPy.finalizedMainPy).to.be.equal(EXPECTED_OUTPUT_1.trim());
    });
    it('should format main.py correctly for example 2', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, EXAMPLE_INPUT_2, APP_NAME);
        expect(convertedMainPy.finalizedMainPy).to.be.equal(EXPECTED_OUTPUT_2.trim());
    });
    it('should format main.py correctly for example 3', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, EXAMPLE_INPUT_3, APP_NAME);
        expect(convertedMainPy.finalizedMainPy).to.be.equal(EXPECTED_OUTPUT_3.trim());
    });
    it('should extract correct datapoints for example 1', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, EXAMPLE_INPUT_1, APP_NAME);
        expect(convertedMainPy.dataPoints).to.be.deep.equal(EXPECTED_DATAPOINTS_1);
    });
    it('should extract correct datapoints for example 2', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, EXAMPLE_INPUT_2, APP_NAME);
        expect(convertedMainPy.dataPoints).to.be.deep.equal(EXPECTED_DATAPOINTS_2);
    });
    it('should extract correct datapoints for example 3', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, EXAMPLE_INPUT_3, APP_NAME);
        expect(convertedMainPy.dataPoints).to.be.deep.equal(EXPECTED_DATAPOINTS_3);
    });
});

describe('Transform to MQTT', () => {
    it('should transform publish_mqtt_event with format string correctly', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, MQTT_MESSAGE_WITH_FORMAT_STRING.trim(), APP_NAME);
        const newMainPyArray = createArrayFromMultilineString(convertedMainPy.finalizedMainPy.trim());
        expect(newMainPyArray.join()).to.include(EXPECTED_MQTT_PUBLISH_WITH_FORMAT_STRING[0]);
        expect(newMainPyArray.join()).to.include(EXPECTED_MQTT_PUBLISH_WITH_FORMAT_STRING[1]);
    });
    it('should transform publish_mqtt_event without format string correctly', async () => {
        const codeConverter: CodeConverter = new CodeConverter();
        const convertedMainPy = codeConverter.convertMainPy(VELOCITAS_TEMPLATE_MAINPY, MQTT_MESSAGE_WITHOUT_FORMAT_STRING.trim(), APP_NAME);
        const newMainPyArray = createArrayFromMultilineString(convertedMainPy.finalizedMainPy.trim());
        expect(newMainPyArray.join()).to.include(EXPECTED_MQTT_PUBLISH_WITHOUT_FORMAT_STRING);
    });
});
