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

import { AxiosError } from 'axios';

/**
 * ProjectGeneratorError puts all relevant information together
 *
 * @property {string} error.name                          - Name of the error.
 * @property {string} error.message                       - Error message.
 * @property {number | undefined} error.statusCode        - API response status code.
 * @property {string | undefined} error.statusText        - API response status text.
 * @property {string[] | undefined} error.responseMessage - Contains API response messages if available.
 */
export class ProjectGeneratorError extends AxiosError {
    statusCode: number | undefined;
    statusText: string | undefined;
    responseMessages: string[] | undefined;
    constructor(error: AxiosError) {
        const errors = (error.response?.data as any).errors;
        super(error.message);
        this.name = 'ProjectGeneratorError';
        this.statusCode = error.response?.status;
        this.statusText = error.response?.statusText;
        this.responseMessages = errors ? errors : (error.response?.data as any).message;
    }
}
