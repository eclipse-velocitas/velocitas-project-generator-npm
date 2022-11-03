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

export const REGEX = {
    // Get everything between logger and class from template
    FIND_GLOBAL_TOPIC_VARIABLES: /(?<=\_\))[\r\n]+(^[\S\s*]*class)/gm,
    // Remove all lines with whitespaces followed by # (comments) from template
    GET_WHITESPACE_FOLLOWED_BY_COMMENTS: /^(?:[\t ]*(?:\r?|\r).\#.*\n?)+/gm,
    // Everything between multiline comment from template
    EVERYTHING_BETWEEN_MULTILINE: /([^\S\r\n]*\"\"\"[\s\S]*?\"\"\")/gm,
    // Every """ (docstring) from template
    GET_EVERY_PYTHON_DOCSTRING: /^(?:[\t ]*(?:\r?|\r).\"\"\".*\n?)+/gm,
    GET_EVERY_PLUGINS_USAGE: /^(?:[\t ]*(?:\r?|\r).plugins\..*\n?)+/gm,
    // Get everything between on_speed_change and "async def main():" from template
    GET_EVERY_DELETABLE_TEMPLATE_CODE: /(?<=\(self\.on\_speed\_change\))[\r\n]+(^[\S\s*]*async def main\(\)\:)/gm,
    // Replace content in on_start method (Here digital.auto code comes in)
    FIND_BEGIN_OF_ON_START_METHOD: /[\t ]*async def on\_start\(self\)\:[\r\n]+([^\r\n]+)/gm,
    FIND_VEHICLE_OCCURENCE: /vehicle/gm,
    FIND_UNWANTED_VEHICLE_CHANGE: /\(await self\.Vehicle/gm,
    FIND_PRINTF_STATEMENTS: /print\(f/gm,
    FIND_PRINT_STATEMENTS: /print\(/gm,
    FIND_EVERY_LINE_START: /^(?!\s*$)/gm,
    FIND_LINE_BEGINNING_WITH_WHITESPACES: /^\s+/gm,
    FIND_SAMPLE_APP: /SampleApp/gm,
    FIND_SUBSCRIBE_METHOD_CALL: /\.subscribe\(/gm,
};
