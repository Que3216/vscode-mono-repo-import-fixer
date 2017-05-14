## Typescript Mono Repo Import Helper

If you have a Lerna mono-repo, then vs-code may auto-generate imports for you that look like this:

```
import { doSomething } from "../../package2/src/doSomething.ts";

doSomething();
```

When you really want the import to look like this:

```
import { doSomething } from "@my-app/package2";

doSomething();
```

This extension automatically converts any imports of the first format to the second format when
you save the file.

It runs on any .ts or .tsx files that are nested inside a 'packages' directory.

## Usage

Install the [extension](https://marketplace.visualstudio.com/items?itemName=q.typescript-mono-repo-import-helper), and it'll fix the imports whenever you hit save.
