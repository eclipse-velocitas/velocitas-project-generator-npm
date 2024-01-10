// Copyright (c) 2023-2024 Contributors to the Eclipse Foundation
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

import { REGEX } from '../utils/regex';

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const expect = chai.expect;

const multiline = `
DO NOT REPLACE
"""
This text can be replaced
This text can be replaced
This text can be replaced
This text can be replaced
This text can be replaced
This text can be replaced
This text can be replaced
"""
DO NOT REPLACE
`;
const indentedMultiline = `
    DO NOT REPLACE
    """
    This text can be replaced
    This text can be replaced
    This text can be replaced
    This text can be replaced
    This text can be replaced
    This text can be replaced
    This text can be replaced
    """
    DO NOT REPLACE
`;

const multilineOneLine = `DO NOT REPLACE """ This text can be replaced """ DO NOT REPLACE`;
const indentedMultilineOneLine = `  DO NOT REPLACE """ This text can be replaced """ DO NOT REPLACE`;

const multilineTwoLines = `
DO NOT REPLACE
""" This text can be replaced
This text can be replaced """
DO NOT REPLACE
`;
const indentedMultilineTwoLines = `
    DO NOT REPLACE
    """ This text can be replaced
    This text can be replaced """
    DO NOT REPLACE
`;

const expectedMultilineOutput = `
DO NOT REPLACE

DO NOT REPLACE
`;
const expectedIndentedMultilineOutput = `
    DO NOT REPLACE

    DO NOT REPLACE
`;

const expectedOneLineOutput = 'DO NOT REPLACE DO NOT REPLACE';
const expectedIndentedOneLineOutput = '  DO NOT REPLACE DO NOT REPLACE';

describe('Regex', () => {
    it('should find and replace multiline comments', async () => {
        const convertedMultiline = multiline.replace(REGEX.EVERYTHING_BETWEEN_MULTILINE, '');
        const convertedIndentedMultiline = indentedMultiline.replace(REGEX.EVERYTHING_BETWEEN_MULTILINE, '');

        const convertedMultilineOneLine = multilineOneLine.replace(REGEX.EVERYTHING_BETWEEN_MULTILINE, '');
        const convertedIndentedMultilineOneLine = indentedMultilineOneLine.replace(REGEX.EVERYTHING_BETWEEN_MULTILINE, '');

        const convertedMultilineTwoLines = multilineTwoLines.replace(REGEX.EVERYTHING_BETWEEN_MULTILINE, '');
        const convertedIndentedMultilineTwoLines = indentedMultilineTwoLines.replace(REGEX.EVERYTHING_BETWEEN_MULTILINE, '');

        expect(convertedMultiline).to.be.equal(expectedMultilineOutput);
        expect(convertedIndentedMultiline).to.be.equal(expectedIndentedMultilineOutput);

        expect(convertedMultilineOneLine).to.be.equal(expectedOneLineOutput);
        expect(convertedIndentedMultilineOneLine).to.be.equal(expectedIndentedOneLineOutput);

        expect(convertedMultilineTwoLines).to.be.equal(expectedMultilineOutput);
        expect(convertedIndentedMultilineTwoLines).to.be.equal(expectedIndentedMultilineOutput);
    });
});
