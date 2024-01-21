import * as vscode from "vscode";
import { EditorMode } from "./mode";
import { type Configuration } from "./configuration";

type SetOpts = {
    force?: boolean
}

export class VsCodeContextManager {
    private mode: EditorMode;
    private keys: Map<EditorMode, string> = new Map();

    constructor(private readonly config: Configuration) {
        Object.values(EditorMode).forEach((mode) => {
            this.keys.set(mode, `${this.config.name}.context.${this.mode}`);
        });

        this.mode = EditorMode.MOTION;
        this.sync();
    }

    private sync() {
        const write = (key: string, value: boolean) => {
            vscode.commands.executeCommand("setContext", key, value);
            if (this.config.debug)
                console.log(`setContext "${key}" to "${value}"`);
        };

        this.keys.forEach((key, mode) => {
            if (this.mode === mode) write(key, true);
            else write(key, false);
        });
    }

    set(mode: EditorMode, opts?: SetOpts): boolean {
        if (this.in(mode) && !opts?.force) {
            return false;
        } else {
            this.mode = mode;
            this.sync();
            return true;
        }
    }

    in(mode: EditorMode): boolean {
        return this.mode === mode;
    }
}
