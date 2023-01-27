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

import { StatusCodes } from 'http-status-codes';
import { CodeConverter } from './code-converter';
import { MS_TO_WAIT_FOR_GITHUB } from './utils/constants';
import { decode, delay, encode } from './utils/helpers';
import { GitRequestHandler } from './gitRequestHandler';

/**
 * Initialize a new `ProjectGenerator` with the given `options`.
 *
 * @param {Object} [options]
 * @return {ProjectGenerator} which can be used to generate a repository.
 * @public
 */
export class ProjectGenerator {
    private gitRequestHandler: GitRequestHandler;
    private codeConverter: CodeConverter = new CodeConverter();
    /**
     * Parameter will be used to call the GitHub API as follows:
     * https://api.github.com/repos/OWNER/REPO
     *
     * PAT or Oauth token with scope for atleast:
     * user, public_repo, repo, notifications, gist
     * @param {string} owner
     * @param {string} repo
     * @param {string} authToken as PAT or Oauth Token
     */
    constructor(private owner: string, private repo: string, private authToken: string) {
        this.gitRequestHandler = new GitRequestHandler(this.owner, this.repo, this.authToken);
    }

    /**
     * @param {string} codeSnippet Base64 encoded playground code snippet.
     * @param {string} appName Name of the VehicleApp.
     * @param {string} vspecPayload Base64 encoded Vspec payload.
     * @throws {ProjectGeneratorError}
     */
    public async runWithPayload(codeSnippet: string, appName: string, vspecPayload: string): Promise<number> {
        try {
            let decodedVspecPayload = JSON.parse(decode(vspecPayload));
            await this.gitRequestHandler.generateRepo();
            // Delay is introduced to make sure that the git API creates
            // everything we need before doing other API requests
            await delay(MS_TO_WAIT_FOR_GITHUB);
            await this.updateContent(appName, codeSnippet, decodedVspecPayload);
            return StatusCodes.OK;
        } catch (error) {
            throw error;
        }
    }

    /**
     * @param {string} codeSnippet Base64 encoded playground code snippet.
     * @param {string} appName Name of the VehicleApp.
     * @param {string} vspecUri Root URI of Vspec Files.
     * @throws {ProjectGeneratorError}
     */
    public async runWithUri(codeSnippet: string, appName: string, vspecUri: string): Promise<number> {
        try {
            let decodedVspecString = decode(vspecUri);
            await this.gitRequestHandler.generateRepo();
            // Delay is introduced to make sure that the git API creates
            // everything we need before doing other API requests
            await delay(MS_TO_WAIT_FOR_GITHUB);
            await this.updateContent(appName, codeSnippet, decodedVspecString);
            return StatusCodes.OK;
        } catch (error) {
            throw error;
        }
    }

    private async updateContent(appName: string, codeSnippet: string, vspec: string): Promise<number> {
        let vspecJsonBlobSha: string = '';

        const appManifestBlobSha = await this.getNewAppManifestSha(appName, vspec);
        const mainPyBlobSha = await this.getNewMainPySha(appName, codeSnippet);

        if (this.vspecIsPayload(vspec)) {
            const encodedVspec = encode(`${JSON.stringify(vspec, null, 4)}\n`);
            vspecJsonBlobSha = await this.gitRequestHandler.createBlob(encodedVspec);
        }

        await this.gitRequestHandler.updateTree(appManifestBlobSha, mainPyBlobSha, vspecJsonBlobSha);
        return StatusCodes.OK;
    }

    private async getNewAppManifestSha(appName: string, vspec: string): Promise<string> {
        const appManifestContentData = await this.gitRequestHandler.getFileContentData('AppManifest');
        let decodedAppManifestContent = JSON.parse(decode(appManifestContentData));
        decodedAppManifestContent[0].Name = appName.toLowerCase();

        if (this.vspecIsPayload(vspec)) {
            decodedAppManifestContent[0].vspec = './app/vspec.json';
        } else {
            decodedAppManifestContent[0].vspec = vspec;
        }

        const encodedAppManifestContent = encode(`${JSON.stringify(decodedAppManifestContent, null, 4)}\n`);
        const appManifestBlobSha = await this.gitRequestHandler.createBlob(encodedAppManifestContent);
        return appManifestBlobSha;
    }

    private async getNewMainPySha(appName: string, codeSnippet: string): Promise<string> {
        const mainPyContentData = await this.gitRequestHandler.getFileContentData('main');
        const decodedMainPyContentData = decode(mainPyContentData);
        const decodedBase64CodeSnippet = decode(codeSnippet);
        const convertedMainPy = this.codeConverter.convertMainPy(decodedMainPyContentData, decodedBase64CodeSnippet, appName);
        const encodedConvertedMainPy = encode(`${convertedMainPy}\n`);
        const mainPyBlobSha = await this.gitRequestHandler.createBlob(encodedConvertedMainPy);
        return mainPyBlobSha;
    }

    private vspecIsPayload(vspec: string): boolean {
        if (typeof vspec === 'string') {
            return false;
        } else if (typeof vspec === 'object') {
            return true;
        } else {
            throw new Error('Provided Vspec information is faulty');
        }
    }
}
