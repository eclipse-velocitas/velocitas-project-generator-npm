# velocitas-project-generator-npm

[![License: Apache](https://img.shields.io/badge/License-Apache-yellow.svg)](http://www.apache.org/licenses/LICENSE-2.0)

## Main Usage

At the moment the scope of velocitas-project-generator is for [digital.auto](https://digitalauto.netlify.app/).
The velocitas-project-generator takes python prototype code from the digital.auto playground, adapts it and makes it compatible with the
[eclipse-velocitas vehicle app python template](https://github.com/eclipse-velocitas/vehicle-app-python-template).

## Integrate in your repository

Install from the command line:
```bash
npm install @eclipse-velocitas/velocitas-project-generator
```

Install via package.json:
```json
"@eclipse-velocitas/velocitas-project-generator": "^1.0.0"
```

Manual integration:
clone it, transpile it and link it into you repositories node_modules folder

```bash
git clone https://github.com/eclipse-velocitas/velocitas-project-generator-npm.git
cd velocitas-project-generator-npm
tsc
cd path/to/your/repo
npm link path/to/velocitas-project-generator-npm
```

## Usage in Code
```javascript
import { ProjectGenerator } from "@eclipse-velocitas/velocitas-project-generator";

const generator = new ProjectGenerator(OWNER, REPO, TOKEN);
await generator.runWithUri(BASE64_CODE_SNIPPET, APP_NAME, VSPEC_URI_OBJECT);
await generator.runWithPayload(BASE64_CODE_SNIPPET, APP_NAME, BASE64_VSPEC_PAYLOAD);
```

## Contribution
- [GitHub Issues](https://github.com/eclipse-velocitas/velocitas-project-generator-npm/issues)
- [Mailing List](https://accounts.eclipse.org/mailing-list/velocitas-dev)
- [Contribution](https://eclipse-velocitas.github.io/velocitas-docs/docs/contribution/)
