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

export const PYTHON = {
    CLASS: 'class',
    IMPORT: 'import',
    IMPORT_DEPENDENCY_FROM: 'from',
    COMMENT: '#',
    SYNC_METHOD_START: 'def ',
    ASYNC_METHOD_START: 'async def ',
    AWAIT: 'await',
};
export const VELOCITAS = {
    MAIN_METHOD: 'async def main():',
    ON_START: 'async def on_start(self):',
    VEHICLE_APP_SUFFIX: 'App',
    CLASS_METHOD_SIGNATURE: '(self, data: DataPointReply)',
    SUBSCRIPTION_SIGNATURE: '.subscribe(self.',
    INFO_LOGGER_SIGNATURE: 'logger.info(',
    VEHICLE_CALL: 'await self.Vehicle.',
    VEHICLE_CALL_AS_ARGUMENT: '(self.Vehicle',
    GET_VALUE: '.get()).value',
    IMPORT_SUBSCRIBE_TOPIC: ', subscribe_topic',
    IMPORT_DATAPOINT_REPLY: 'from sdv.vdb.subscriptions import DataPointReply',
    EVENT_LOOP: 'LOOP',
    NEW_EVENT_LOOP: 'asyncio.run(main())',
    VEHICLE_APP_SIGNATURE: '(VehicleApp):',
    ASYNCIO: 'await asyncio',
    PREDEFINED_TOPIC: '_TOPIC =',
    TYPE_IGNORE: '# type',
};
export const DIGITAL_AUTO = {
    VEHICLE_INIT: 'Vehicle()',
    SET_TEXT: 'set_text',
    NOTIFY: 'notify',
    SUBSCRIBE_CALL: '.subscribe(',
    IMPORT_PLUGINS: 'import plugins',
};
export const INDENTATION = { COUNT_CLASS: 4, COUNT_METHOD: 8 };
