import * as vscode from "vscode";
import { EditorMode } from "./mode";
import { Configuration } from "./configuration";

export class VsCodeStatusBarManager {
    private readonly configuration: Configuration;
    private readonly item: vscode.StatusBarItem;
    private text: string;

    constructor(config: Configuration) {
        this.configuration = config;
        this.text = "";

        this.item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left
        );
        this.item.show();
    }

    set(mode: EditorMode, message?: string): void {
        let text = `${this.configuration.name} : ${mode}`;

        if (message) text += ` : ${message}`;

        if (!text) return;
        if (this.text === text) return;

        if (this.configuration.debug)
            console.log(`Updating status bar with "${text}"`);

        this.text = text;
        this.item.text = this.text;
    }
}
