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

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { updateAppManifestContent } from '../utils/appManifest';

chai.use(chaiAsPromised);
const expect = chai.expect;

const decodedAppManifestV2Content = [
    {
        name: 'SampleApp',
        vehicleModel: {
            src: 'https://testUrl.com',
            datapoints: [
                {
                    path: 'Vehicle.Sample.Datapoint.A',
                    required: 'true',
                    access: 'read',
                },
            ],
        },
        runtime: ['test'],
    },
];

const decodedAppManifestV3Content = {
    manifestVersion: 'v3',
    name: 'SampleApp',
    interfaces: [
        {
            type: 'another-interface',
            config: {
                reads: ['test/test/request'],
                writes: ['test/test', 'test/test/response'],
            },
        },
        {
            type: 'vehicle-signal-interface',
            config: {
                src: 'https://testUrl.com',
                datapoints: {
                    required: [
                        {
                            path: 'Vehicle.Sample.Datapoint.A',
                            access: 'write',
                        },
                        {
                            path: 'Vehicle.Sample.Datapoint.B',
                            access: 'read',
                        },
                    ],
                },
            },
        },
    ],
};

const appName = 'TestApp';
const vspecPath = './vspecPath';
const dataPoints = [
    {
        path: 'Vehicle.Test.Datapoint.Update',
        access: 'write',
    },
    {
        path: 'Vehicle.Test.Datapoint.Update',
        access: 'read',
    },
];

describe('AppManifest', () => {
    it('should update AppManifest v2', async () => {
        const updatedAppManifestV2Content = updateAppManifestContent(decodedAppManifestV2Content, appName, vspecPath, dataPoints);
        expect(updatedAppManifestV2Content[0].name).to.be.equal(appName.toLowerCase());
        expect(updatedAppManifestV2Content[0].vehicleModel.src).to.be.equal(vspecPath);
        expect(updatedAppManifestV2Content[0].vehicleModel.datapoints).to.be.equal(dataPoints);
    });
    it('should update AppManifest v3', async () => {
        const updatedAppManifestV3Content = updateAppManifestContent(decodedAppManifestV3Content, appName, vspecPath, dataPoints);
        const vsiIndex = decodedAppManifestV3Content.interfaces.findIndex((entry: any) => entry.type === 'vehicle-signal-interface');
        expect(updatedAppManifestV3Content.name).to.be.equal(appName.toLowerCase());
        expect(updatedAppManifestV3Content.interfaces[vsiIndex].config.src).to.be.equal(vspecPath);
        expect(updatedAppManifestV3Content.interfaces[vsiIndex].config.datapoints.required).to.be.equal(dataPoints);
    });
});
