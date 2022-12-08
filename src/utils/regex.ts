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

// NOTE: since safari doesn't support lookbehind regex yet. Try to avoid it.
// https://caniuse.com/js-regexp-lookbehind
export const REGEX = {
    // Everything between multiline comment from template
    EVERYTHING_BETWEEN_MULTILINE: /([^\S\r\n]*\"\"\"[\s\S]*?\"\"\")/gm,
    GET_EVERY_PLUGINS_USAGE: /.*plugins.*/gm,
    // Replace content in on_start method (Here digital.auto code comes in)
    FIND_BEGIN_OF_ON_START_METHOD: /[\t ]*async def on\_start\(self\)\:[\r\n]/gm,
    FIND_VEHICLE_INIT: /self\.Vehicle \= vehicle_client/gm,
    FIND_VEHICLE_OCCURENCE: /vehicle/gm,
    FIND_UNWANTED_VEHICLE_CHANGE: /\(await self\.Vehicle/gm,
    FIND_PRINTF_STATEMENTS: /print\(f/gm,
    FIND_PRINT_STATEMENTS: /print\(/gm,
    FIND_EVERY_LINE_START: /^(?!\s*$)/gm,
    FIND_LINE_BEGINNING_WITH_WHITESPACES: /^\s+/gm,
    FIND_SAMPLE_APP: /SampleApp/gm,
    FIND_SUBSCRIBE_METHOD_CALL: /\.subscribe\(/gm,
};
