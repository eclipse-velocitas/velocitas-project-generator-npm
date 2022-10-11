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
