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

import axios from 'axios';
import { Buffer } from 'buffer';
import { ProjectGeneratorError } from './project-generator-error';
import { StatusCodes } from 'http-status-codes';
import { CodeFormatter } from './code-formatter';
import {
    CONTENT_ENCODINGS,
    DEFAULT_COMMIT_MESSAGE,
    DEFAULT_REPOSITORY_DESCRIPTION,
    GITHUB_API_URL,
    GIT_DATA_MODES,
    GIT_DATA_TYPES,
    PYTHON_TEMPLATE_URL,
} from './constants';

/**
 * Initialize a new `ProjectGenerator` with the given `options`.
 *
 * @param {Object} [options]
 * @return {ProjectGenerator} which can be used to generate a repository.
 * @public
 */
export class ProjectGenerator {
    private repositoryPath;
    private requestConfig;
    private codeFormatter: CodeFormatter = new CodeFormatter();
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
        this.requestConfig = {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${this.authToken}`,
            },
        };
        this.repositoryPath = `${GITHUB_API_URL}/${this.owner}/${this.repo}`;
    }

    /**
     * @param {string} codeSnippet Base64 encoded playground code snippet.
     * @param {string} appName Name of the VehicleApp.
     * @throws {ProjectGeneratorError}
     */
    public async run(codeSnippet: string, appName: string): Promise<number> {
        try {
            await this.generateRepo();
            await this.updateContent(appName, codeSnippet);
            return StatusCodes.OK;
        } catch (error) {
            throw error;
        }
    }

    private async generateRepo(): Promise<number> {
        try {
            await axios.post(
                `${PYTHON_TEMPLATE_URL}/generate`,
                {
                    owner: this.owner,
                    name: this.repo,
                    description: DEFAULT_REPOSITORY_DESCRIPTION,
                    include_all_branches: false,
                    private: true,
                },
                this.requestConfig
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new ProjectGeneratorError(error);
            } else {
                throw error;
            }
        }
        const responseStatus = await this.checkRepoAvailability();
        await this.setWorkflowPermission(false);
        return responseStatus;
    }

    private async checkRepoAvailability(): Promise<number> {
        let retries = 0;
        let success = false;
        let responseStatus: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR;
        const maxRetries = 20;

        while (retries < maxRetries && !success) {
            try {
                const response = await axios.get(`${this.repositoryPath}/contents`, this.requestConfig);
                responseStatus = response.status;
                success = true;
                return responseStatus;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.log(`Check #${retries + 1} if Repository is generated failed. Retrying.`);
                    responseStatus = error.response?.status as number;
                } else {
                    throw error;
                }
            }
            retries++;
        }
        return responseStatus;
    }

    private async setWorkflowPermission(isEnabled: boolean): Promise<boolean> {
        try {
            await axios.put(
                `${this.repositoryPath}/actions/permissions`,
                {
                    enabled: isEnabled,
                },
                this.requestConfig
            );
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    private async createBlob(fileContent: string): Promise<string> {
        try {
            const response = await axios.post(
                `${this.repositoryPath}/git/blobs`,
                {
                    content: fileContent,
                    encoding: CONTENT_ENCODINGS.base64,
                },
                this.requestConfig
            );
            const blobSha = response.data.sha;
            return blobSha;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new ProjectGeneratorError(error);
            } else {
                throw error;
            }
        }
    }

    private async updateTree(sha1: string, sha2: string): Promise<any> {
        try {
            const baseTreeSha = await this.getBaseTreeSha();
            const newTreeSha = await this.createNewTreeSha(sha1, sha2, baseTreeSha);
            const mainBranchSha = await this.getMainBranchSha();
            const newCommitSha = await this.createCommitSha(mainBranchSha, newTreeSha);
            await this.setWorkflowPermission(true);
            await this.updateMainBranchSha(newCommitSha);
            return StatusCodes.OK;
        } catch (error) {
            console.log(error);
        }
    }

    private async updateContent(appName: string, codeSnippet: string): Promise<any> {
        const appManifestContentData = await this.getFileContentData('AppManifest');
        let decodedContent = JSON.parse(
            Buffer.from(appManifestContentData, CONTENT_ENCODINGS.base64 as BufferEncoding).toString(
                CONTENT_ENCODINGS.utf8 as BufferEncoding
            )
        );
        decodedContent[0].Name = appName;
        const updateContentString = JSON.stringify(decodedContent, null, 4);
        const encodedUpdateContent = Buffer.from(updateContentString, CONTENT_ENCODINGS.utf8 as BufferEncoding).toString(
            CONTENT_ENCODINGS.base64 as BufferEncoding
        );
        const appManifestBlobSha = await this.createBlob(encodedUpdateContent);
        const mainPyContentData = await this.getFileContentData('main');
        const formattedMainPy = this.codeFormatter.formatMainPy(mainPyContentData, codeSnippet);
        const mainPyBlobSha = await this.createBlob(formattedMainPy);
        await this.updateTree(appManifestBlobSha, mainPyBlobSha);
    }

    private async getFileContentData(file: string): Promise<string> {
        let fileContentResponse;
        if (file === 'AppManifest') {
            fileContentResponse = await axios.get(`${this.repositoryPath}/contents/app/AppManifest.json`, this.requestConfig);
        } else if (file === 'main') {
            fileContentResponse = await axios.get(`${this.repositoryPath}/contents/app/src/main.py`, this.requestConfig);
        } else {
            throw new Error();
        }
        const fileContentData = fileContentResponse.data.content;
        return fileContentData;
    }

    private async getBaseTreeSha(): Promise<string> {
        try {
            const response = await axios.get(`${this.repositoryPath}/git/trees/main`, this.requestConfig);
            const baseTreeSha = response.data.sha;
            return baseTreeSha;
        } catch (error) {
            throw error;
        }
    }

    private async createNewTreeSha(blobSha1: string, blobSha2: string, baseTreeSha: string): Promise<string> {
        try {
            const response = await axios.post(
                `${this.repositoryPath}/git/trees`,
                {
                    tree: [
                        {
                            path: 'app/AppManifest.json',
                            mode: GIT_DATA_MODES.fileBlob,
                            type: GIT_DATA_TYPES.blob,
                            sha: blobSha1,
                        },
                        {
                            path: 'app/src/main.py',
                            mode: GIT_DATA_MODES.fileBlob,
                            type: GIT_DATA_TYPES.blob,
                            sha: blobSha2,
                        },
                    ],
                    base_tree: baseTreeSha,
                },
                this.requestConfig
            );
            const newTreeSha = response.data.sha;
            return newTreeSha;
        } catch (error) {
            throw error;
        }
    }

    private async getMainBranchSha(): Promise<string> {
        try {
            const response = await axios.get(`${this.repositoryPath}/git/refs/heads/main`, this.requestConfig);
            const mainBranchSha = response.data.object.sha;
            return mainBranchSha;
        } catch (error) {
            throw error;
        }
    }

    private async createCommitSha(mainBranchSha: string, newTreeSha: string): Promise<string> {
        try {
            const response = await axios.post(
                `${this.repositoryPath}/git/commits`,
                {
                    tree: newTreeSha,
                    message: DEFAULT_COMMIT_MESSAGE,
                    parents: [mainBranchSha],
                },
                this.requestConfig
            );
            const commitSha = response.data.sha;
            return commitSha;
        } catch (error) {
            throw error;
        }
    }

    private async updateMainBranchSha(newCommitSha: string): Promise<any> {
        try {
            const response = await axios.patch(
                `${this.repositoryPath}/git/refs/heads/main`,
                {
                    sha: newCommitSha,
                },
                this.requestConfig
            );
            const patchResponse = response.data;
            return patchResponse;
        } catch (error) {
            throw error;
        }
    }
}
