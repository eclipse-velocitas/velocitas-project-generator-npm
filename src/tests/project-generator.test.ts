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

import { ProjectGenerator } from '../project-generator';

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';

chai.use(chaiAsPromised);
const expect = chai.expect;

const OWNER = 'testOwner';
const REPO = 'testRepo';
const TOKEN = 'testToken';
const BASE64_CODE_SNIPPET = 'VGVzdFNuaXBwZXQ=';
const APP_NAME = 'testApp';
const BASE64_CONTENT = 'WwogICAgewogICAgICAgICJOYW1lIjogInRlc3RhcHAiCiAgICB9Cl0K';
const MOCK_SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const GITHUB_API_URL = 'https://api.github.com/repos';
const PYTHON_TEMPLATE_URL = `${GITHUB_API_URL}/eclipse-velocitas/vehicle-app-python-template`;

describe('Project Generator', () => {
    it('should initialize', async () => {
        const generator = new ProjectGenerator(OWNER, REPO, TOKEN);
        expect(generator).to.be.instanceof(ProjectGenerator);
    });
    it('should run', async () => {
        nock(`${PYTHON_TEMPLATE_URL}`).post('/generate').reply(200);
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get('/contents').reply(200);
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).persist().put('/actions/permissions').reply(200);
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get('/contents/app/AppManifest.json').reply(200, { content: BASE64_CONTENT });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get('/contents/app/src/main.py').reply(200, { content: BASE64_CONTENT });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).persist().post('/git/blobs').reply(200, { sha: MOCK_SHA });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).get('/git/trees/main').reply(200, { sha: MOCK_SHA });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).post('/git/trees').reply(200, { sha: MOCK_SHA });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`)
            .get('/git/refs/heads/main')
            .reply(200, { object: { sha: MOCK_SHA } });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).post('/git/commits').reply(200, { sha: MOCK_SHA });
        nock(`${GITHUB_API_URL}/${OWNER}/${REPO}`).patch('/git/refs/heads/main').reply(200, { content: MOCK_SHA });

        const generator = new ProjectGenerator(OWNER, REPO, TOKEN);
        const response = await generator.run(BASE64_CODE_SNIPPET, APP_NAME);
        expect(response).to.be.equal(200);
    });
    it('should throw an error on repository generation', async () => {
        nock(`${PYTHON_TEMPLATE_URL}`).post('/generate').reply(422);
        const generator = new ProjectGenerator(OWNER, REPO, TOKEN);
        await expect(generator.run(BASE64_CODE_SNIPPET, APP_NAME)).to.eventually.be.rejectedWith(Error);
    });
});
