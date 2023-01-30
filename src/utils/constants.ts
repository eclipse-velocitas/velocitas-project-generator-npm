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

export const GITHUB_API_URL = 'https://api.github.com/repos';
export const PYTHON_TEMPLATE_URL = `${GITHUB_API_URL}/eclipse-velocitas/vehicle-app-python-template`;

export const CONTENT_ENCODINGS = { utf8: 'utf-8', base64: 'base64' };

export const GIT_DATA_TYPES = { blob: 'blob', tree: 'tree', commit: 'commit' };
export const GIT_DATA_MODES = {
    fileBlob: '100644',
    executableBlob: '100755',
    subdirectoryTree: '040000',
    submoduleCommit: '160000',
    symlinkPathBlob: '120000',
};

export const DEFAULT_REPOSITORY_DESCRIPTION = 'Template generated from eclipse-velocitas';
export const DEFAULT_COMMIT_MESSAGE = 'Update content with digital.auto code';
export const MS_TO_WAIT_FOR_GITHUB = 4000;

export const LOCAL_VSPEC_PATH = 'app/vspec.json';
export const APP_MANIFEST_PATH = 'app/AppManifest.json';
export const MAIN_PY_PATH = 'app/src/main.py';
