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

export const PYTHON = {
    CLASS: 'class',
    IMPORT: 'import',
    IMPORT_DEPENDENCY_FROM: 'from',
    COMMENT: '#',
    SYNC_METHOD_START: 'def',
    ASYNC_METHOD_START: 'async def',
};
export const VELOCITAS = {
    MAIN_METHOD: 'async def main():',
    VEHICLE_APP_SUFFIX: 'App',
    CLASS_METHOD_SIGNATURE: '(self, ',
    SUBSCRIPTION_SIGNATURE: '.subscribe(self.',
    INFO_LOGGER_SIGNATURE: 'logger.info(',
    VEHICLE_CALL: 'await self.Vehicle',
    VEHICLE_CALL_AS_ARGUMENT: '(self.Vehicle',
};
export const DIGITAL_AUTO = { VEHICLE_INIT: 'Vehicle()' };
export const INDENTATION = { COUNT_CLASS: 4, COUNT_METHOD: 8 };
