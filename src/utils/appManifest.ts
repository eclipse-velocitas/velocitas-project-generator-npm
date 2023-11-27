// Copyright (c) 2023 Contributors to the Eclipse Foundation
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

const isLegacyAppManifest = (decodedAppManifestContent: any) => decodedAppManifestContent instanceof Array;

export const updateAppManifestContent = (decodedAppManifestContent: any, appName: string, vspecPath: string, dataPoints: any[]) => {
    if (isLegacyAppManifest(decodedAppManifestContent)) {
        // for backwards compatibility to AppManifest v2
        decodedAppManifestContent[0].name = appName.toLowerCase();
        decodedAppManifestContent[0].vehicleModel.src = vspecPath;
        decodedAppManifestContent[0].vehicleModel.datapoints = dataPoints;
    } else {
        const vsiIndex = decodedAppManifestContent.interfaces.findIndex((entry: any) => entry.type === 'vehicle-signal-interface');
        decodedAppManifestContent.name = appName.toLowerCase();
        decodedAppManifestContent.interfaces[vsiIndex].config.src = vspecPath;
        decodedAppManifestContent.interfaces[vsiIndex].config.datapoints.required = dataPoints;
    }
    return decodedAppManifestContent;
};
