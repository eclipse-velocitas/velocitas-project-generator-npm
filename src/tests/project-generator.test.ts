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

import { ProjectGenerator } from '../project-generator';

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';
import { APP_MANIFEST_PATH, MAIN_PY_PATH } from '../utils/constants';
import { VspecUriObject } from '../utils/types';

chai.use(chaiAsPromised);
const expect = chai.expect;

const OWNER = 'testOwner';
const REPO = 'testRepo';
const TOKEN = 'testToken';
const BASE64_CODE_SNIPPET = 'VGVzdFNuaXBwZXQ=';
const BASE64_PAYLOAD =
    'IntcbiAgICBWZWhpY2xlOiB7XG4gICAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgIH0sXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSGlnaC1sZXZlbCB2ZWhpY2xlIGRhdGEuJyxcbiAgICAgICAgdHlwZTogJ2JyYW5jaCcsXG4gICAgICAgIHV1aWQ6ICdjY2M4MjVmOTQxMzk1NDRkYmI1ZjRiZmQwMzNiZWNlNicsXG4gICAgfSxcbn1cbiI=';
const APP_NAME = 'testApp';
const BASE64_CONTENT =
    'WwogICB7CiAgICAgICJuYW1lIjoidGVzdGFwcCIsCiAgICAgICJ2ZWhpY2xlTW9kZWwiOnsKICAgICAgICAgInNyYyI6InRlc3RzcmMiCiAgICAgIH0KICAgfQpd';
const MOCK_SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const vspecUriObject: VspecUriObject = { repo: 'https://test.com/testOrg/testRepo', commit: '015dd1532922091ce2675755843273c41efbeba8' };

const GITHUB_API_URL = 'https://api.github.com/repos';
const PYTHON_TEMPLATE_URL = `${GITHUB_API_URL}/eclipse-velocitas/vehicle-app-python-template`;

describe('Project Generator', () => {
    it('should initialize', async () => {
        const generator = new ProjectGenerator(OWNER, REPO, TOKEN);
        expect(generator).to.be.instanceof(ProjectGenerator);
    });
    // it('should run with URI', async () => {
    //     nock(`${PYTHON_TEMPLATE_URL}`).post('/generate').reply(200);
    //     nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get('/contents').reply(200);
    //     nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).persist().put('/actions/permissions').reply(200);
    //     nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get(`/contents/${APP_MANIFEST_PATH}`).reply(200, { content: BASE64_CONTENT });
    //     nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get(`/contents/${MAIN_PY_PATH}`).reply(200, { content: BASE64_CONTENT });
    //     nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).persist().post('/git/blobs').reply(200, { sha: MOCK_SHA });
    //     nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get('/git/trees/main').reply(200, { sha: MOCK_SHA });
    //     nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).post('/git/trees').reply(200, { sha: MOCK_SHA });
    //     nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`)
    //         .get('/git/refs/heads/main')
    //         .reply(200, { object: { sha: MOCK_SHA } });
    //     nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).post('/git/commits').reply(200, { sha: MOCK_SHA });
    //     nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).put('/actions/permissions/workflow').reply(200);
    //     nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).patch('/git/refs/heads/main').reply(200, { content: MOCK_SHA });

    //     const generator = new ProjectGenerator(OWNER, REPO, TOKEN);
    //     const response = await generator.runWithUri(BASE64_CODE_SNIPPET, APP_NAME, vspecUriObject);
    //     expect(response).to.be.equal(200);
    // });
    it('should run with payload', async () => {
        nock(`${PYTHON_TEMPLATE_URL}`).post('/generate').reply(200);
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get('/contents').reply(200);
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).persist().put('/actions/permissions').reply(200);
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get(`/contents/${APP_MANIFEST_PATH}`).reply(200, { content: BASE64_CONTENT });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get(`/contents/${MAIN_PY_PATH}`).reply(200, { content: BASE64_CONTENT });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).persist().post('/git/blobs').reply(200, { sha: MOCK_SHA });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get('/git/trees/main').reply(200, { sha: MOCK_SHA });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).post('/git/trees').reply(200, { sha: MOCK_SHA });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`)
            .get('/git/refs/heads/main')
            .reply(200, { object: { sha: MOCK_SHA } });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).post('/git/commits').reply(200, { sha: MOCK_SHA });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).put('/actions/permissions/workflow').reply(200);
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).patch('/git/refs/heads/main').reply(200, { content: MOCK_SHA });

        const generator = new ProjectGenerator(OWNER, REPO, TOKEN);
        const response = await generator.runWithPayload(BASE64_CODE_SNIPPET, APP_NAME, BASE64_PAYLOAD);
        expect(response).to.be.equal(200);
    });
    it('should throw an error on repository generation', async () => {
        nock(`${PYTHON_TEMPLATE_URL}`).post('/generate').reply(422);
        const generator = new ProjectGenerator(OWNER, REPO, TOKEN);
        await expect(generator.runWithPayload(BASE64_CODE_SNIPPET, APP_NAME, BASE64_PAYLOAD)).to.eventually.be.rejectedWith(Error);
    });
});
