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

import axios from 'axios';
import { ProjectGeneratorError } from './project-generator-error';
import { StatusCodes } from 'http-status-codes';
import {
    CONTENT_ENCODINGS,
    DEFAULT_COMMIT_MESSAGE,
    DEFAULT_REPOSITORY_DESCRIPTION,
    GITHUB_API_URL,
    GIT_DATA_MODES,
    GIT_DATA_TYPES,
    PYTHON_TEMPLATE_URL,
    MS_TO_WAIT_FOR_GITHUB,
    LOCAL_VSPEC_PATH,
    APP_MANIFEST_PATH,
    MAIN_PY_PATH,
} from './utils/constants';
import { delay } from './utils/helpers';

/**
 * Initialize a new `GitRequestHandler` with the given `options`.
 *
 * @param {Object} [options]
 * @return {GitRequestHandler} which holds methods to make requests to the GitHub API.
 * @public
 */
export class GitRequestHandler {
    private requestConfig;
    private repositoryPath;
    private pythonTemplateClient;
    private gitClient;
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
        this.pythonTemplateClient = axios.create({
            baseURL: PYTHON_TEMPLATE_URL,
            ...this.requestConfig,
        });
        this.gitClient = axios.create({
            baseURL: this.repositoryPath,
            ...this.requestConfig,
        });
    }

    public async generateRepo(): Promise<number> {
        try {
            await this.pythonTemplateClient.post('/generate', {
                owner: this.owner,
                name: this.repo,
                description: DEFAULT_REPOSITORY_DESCRIPTION,
                include_all_branches: false,
                private: true,
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new ProjectGeneratorError(error);
            } else {
                throw error;
            }
        }
        const responseStatus = await this.checkRepoAvailability();
        await this.enableWorkflows(false);
        return responseStatus;
    }

    public async createBlob(fileContent: string): Promise<string> {
        try {
            const response = await this.gitClient.post('/git/blobs', {
                content: fileContent,
                encoding: CONTENT_ENCODINGS.base64,
            });
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

    public async updateTree(appManifestBlobSha: string, mainPyBlobSha: string, vspecJsonBlobSha: string = ''): Promise<number> {
        try {
            const baseTreeSha = await this.getBaseTreeSha();
            const newTreeSha = await this.createNewTreeSha(appManifestBlobSha, mainPyBlobSha, vspecJsonBlobSha, baseTreeSha);
            const mainBranchSha = await this.getMainBranchSha();
            const newCommitSha = await this.createCommitSha(mainBranchSha, newTreeSha);
            await delay(MS_TO_WAIT_FOR_GITHUB);
            await this.setDefaultWorkflowPermissionToWrite();
            await this.enableWorkflows(true);
            await this.updateMainBranchSha(newCommitSha);
            return StatusCodes.OK;
        } catch (error) {
            throw error;
        }
    }

    public async getFileContentData(filePath: string): Promise<string> {
        try {
            const fileContentResponse = await this.gitClient.get(`/contents/${filePath}`);
            const fileContentData = fileContentResponse.data.content;
            return fileContentData;
        } catch (error) {
            throw error;
        }
    }

    private async checkRepoAvailability(): Promise<number> {
        let retries = 0;
        let success = false;
        let responseStatus: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR;
        const maxRetries = 20;

        while (retries < maxRetries && !success) {
            try {
                const response = await this.gitClient.get('/contents');
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

    private async enableWorkflows(isEnabled: boolean): Promise<boolean> {
        try {
            await this.gitClient.put('/actions/permissions', {
                enabled: isEnabled,
            });
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    private async setDefaultWorkflowPermissionToWrite(): Promise<boolean> {
        try {
            await this.gitClient.put('/actions/permissions/workflow', {
                default_workflow_permissions: 'write',
            });
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    private async getBaseTreeSha(): Promise<string> {
        try {
            const response = await this.gitClient.get('/git/trees/main');
            const baseTreeSha = response.data.sha;
            return baseTreeSha;
        } catch (error) {
            throw error;
        }
    }

    private async createNewTreeSha(
        appManifestBlobSha: string,
        mainPyBlobSha: string,
        vspecJsonBlobSha: string,
        baseTreeSha: string
    ): Promise<string> {
        try {
            const treeArray = [
                {
                    path: APP_MANIFEST_PATH,
                    mode: GIT_DATA_MODES.fileBlob,
                    type: GIT_DATA_TYPES.blob,
                    sha: appManifestBlobSha,
                },
                {
                    path: MAIN_PY_PATH,
                    mode: GIT_DATA_MODES.fileBlob,
                    type: GIT_DATA_TYPES.blob,
                    sha: mainPyBlobSha,
                },
            ];
            if (vspecJsonBlobSha) {
                treeArray.push({
                    path: LOCAL_VSPEC_PATH,
                    mode: GIT_DATA_MODES.fileBlob,
                    type: GIT_DATA_TYPES.blob,
                    sha: vspecJsonBlobSha,
                });
            }
            const response = await this.gitClient.post('/git/trees', {
                tree: treeArray,
                base_tree: baseTreeSha,
            });
            const newTreeSha = response.data.sha;
            return newTreeSha;
        } catch (error) {
            throw error;
        }
    }

    private async getMainBranchSha(): Promise<string> {
        try {
            const response = await this.gitClient.get('/git/refs/heads/main');
            const mainBranchSha = response.data.object.sha;
            return mainBranchSha;
        } catch (error) {
            throw error;
        }
    }

    private async createCommitSha(mainBranchSha: string, newTreeSha: string): Promise<string> {
        try {
            const response = await this.gitClient.post('/git/commits', {
                tree: newTreeSha,
                message: DEFAULT_COMMIT_MESSAGE,
                parents: [mainBranchSha],
            });
            const commitSha = response.data.sha;
            return commitSha;
        } catch (error) {
            throw error;
        }
    }

    private async updateMainBranchSha(newCommitSha: string): Promise<string> {
        try {
            const response = await this.gitClient.patch('/git/refs/heads/main', {
                sha: newCommitSha,
            });
            const patchResponse = response.data;
            return patchResponse;
        } catch (error) {
            throw error;
        }
    }
}
