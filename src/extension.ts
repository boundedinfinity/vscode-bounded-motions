import * as vscode from "vscode";
import { controller } from "./bounded-motions";

export function activate(context: vscode.ExtensionContext) {
    regCmdSub(context, "bounded-motions.editor", () => {
        controller.handleCharacter({ text: "esc" });
    });

    regCmdSub(context, "type", (event, args) => {
        controller.handleCharacter(event);
        if (controller.isDebug() && args) {
            console.log(`type: ${JSON.stringify(event)}, other: ${args}`);
        }
    });

    context.subscriptions.push(...controller.disposables());
}

function regCmdSub(
    context: vscode.ExtensionContext,
    commandId: string,
    run: (...args: any[]) => void
): void {
    // The command must be defined in the package.json file
    let disposable = vscode.commands.registerCommand(commandId, run);
    context.subscriptions.push(disposable);
}

export function deactivate() {
    // Everything is registered using the registerCommandSubscription()
    // function nothing needs to be here
}
