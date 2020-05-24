import { window, workspace, commands, Disposable, ExtensionContext, TextDocument, Position, Range, TextDocumentWillSaveEvent } from 'vscode';
import { dirname, join, resolve, relative } from "path";
import { existsSync, readFileSync } from "fs";

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(ctx: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Typescript MonoRepo Import Helper is now active');

    const importFixer = new ImportFixer();
    const controller = new ImportFixerController(importFixer);

    ctx.subscriptions.push(controller);
    ctx.subscriptions.push(importFixer);
}

export class ImportFixer {
    public checkForBrokenImports(doc: TextDocument) {
        const editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        if (doc !== editor.document) {
            return;
        }

        const isTypescript = doc.languageId === "typescript" || doc.languageId === "typescriptreact";

        if (!isTypescript) {
            return;
        }

        const packagesDirectoryMatch = doc.fileName.match(/(.*\/packages)\/[^\/]*\//);

        if (packagesDirectoryMatch == null) {
            return;
        }

        const packagesDirectory = packagesDirectoryMatch[1];
        const pathToPackagesDirectory = relative(dirname(doc.fileName), packagesDirectory);
        const packageNameRegex = "[^\"\'\/\.]*";
        const importPathRegex = escapeRegExp(pathToPackagesDirectory) + "\/" + packageNameRegex + "\/" + "[^\"\']*";
        const importRegex = new RegExp("from [\"\'](" + importPathRegex + ")[\"\'];\n", "g");
        let match = importRegex.exec(doc.getText());
        editor.edit(builder => {
            while (match != null) {
                const matchedText = match[0];
                const relativePathOfImportedFile = match[1];
                const pathOfImportedFile = resolve(dirname(doc.fileName), relativePathOfImportedFile);
                const packageName = this.findNameOfPackageFileIsIn(pathOfImportedFile);
                if (packageName !== undefined) {
                    builder.delete(new Range(doc.positionAt(match.index), doc.positionAt(match.index + matchedText.length)));
                    builder.insert(
                        doc.positionAt(match.index),
                        "from \"" + packageName + "\";\n"
                    );
                }
                match = importRegex.exec(doc.getText());
            }
        });
    }

    private findNameOfPackageFileIsIn(filePath: string): string | undefined {
        const packageJsonPath = this.findPackageJsonPathForFile(filePath);
        if (packageJsonPath === undefined) {
            return undefined;
        }

        const packageDefinition = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        return packageDefinition.name;
    }

    private findPackageJsonPathForFile(filePath: string): string | undefined {
        let directory = dirname(filePath);
        let previousDirectory = null;
        while (directory !== previousDirectory) {
            previousDirectory = directory;
            const packageJsonPath = join(directory, "package.json");
            if (existsSync(packageJsonPath)) {
                if (previousDirectory.endsWith("/packages")) {
                    // We've gone too far
                    return undefined;
                }
                return packageJsonPath;
            }
            directory = dirname(directory);
        }
        return undefined;
    }

    public dispose() {
    }
}

class ImportFixerController {

    private _importFixer: ImportFixer;
    private _disposable: Disposable;

    constructor(ImportFixer: ImportFixer) {
        this._importFixer = ImportFixer;

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        workspace.onWillSaveTextDocument(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent(event: TextDocumentWillSaveEvent) {
        this._importFixer.checkForBrokenImports(event.document);
    }

    public dispose() {
        this._disposable.dispose();
    }
}

function escapeRegExp(str: string) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
