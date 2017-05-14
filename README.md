## Typescript Mono Repo Import Helper

If you have a Lerna mono-repo, then vs-code may auto-generate imports for you that look like this:

Contents of my-app/packages/package1/src/doSomethingAmazing.ts:
```
import { doSomething } from "../../package2/src/doSomething.ts";

doSomething();
```

When you really want the import to look like this:

Contents of my-app/packages/package1/src/doSomethingAmazing.ts:
```
import { doSomething } from "@my-app/package2";

doSomething();
```

This extension automatically converts any imports of the first format to the second format,
if it detects it's running in a Lerna monorepo.

## Usage

Just install the extension, and it'll work automatically.
