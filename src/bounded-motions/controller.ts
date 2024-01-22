import { EditorMode, MotionMode, MovementType } from "./mode";
import { VsCodeContextManager } from "./vs-code-context";
import { VsCodeStatusBarManager } from "./vs-code-status-bar";
import { type Configuration, DEFAULT_CONFIGURATION } from "./configuration";
import { DocumentManager, type MoveCharacterArgs } from "./document";

import * as vscode from "vscode";
import { Machine, createMachine } from "./state-machine";

type SetModeOpts = {
    force?: boolean;
};

type VsCodeEvent = {
    text?: string;
};

interface MotionContext {
    accumulated: string;
    editor?: EditorMode;
    motion?: MotionMode;
}

class MotionContextHelper {
    number(context: MotionContext): number {
        let out: number = 1;
        if (context.accumulated) {
            try {
                out = parseInt(context.accumulated);
            } catch (e) {}
        }

        return out;
    }

    clear(context: MotionContext) {
        context.accumulated = "";
    }
}

export class Controller {
    private readonly config: Configuration;
    private readonly vsCodeContext: VsCodeContextManager;
    private readonly statusBar: VsCodeStatusBarManager;
    private readonly document: DocumentManager;
    private readonly machine: Machine<any>;
    private readonly helper = new MotionContextHelper();

    constructor(config?: Configuration) {
        this.config = config ?? DEFAULT_CONFIGURATION;
        this.vsCodeContext = new VsCodeContextManager(this.config);
        this.statusBar = new VsCodeStatusBarManager(this.config);
        this.document = new DocumentManager(this.config);
        this.machine = this.initMachine().start();

        if (this.isDebug()) {
            console.log(`${this.config.name} is now active!`);
        }
    }

    isDebug(): boolean {
        return this.config.debug;
    }

    setMode(mode: EditorMode, opts?: SetModeOpts): void {
        if (this.vsCodeContext.set(mode, { ...opts })) {
            this.statusBar.set({ editor: mode });
        }
    }

    disposables(): vscode.Disposable[] {
        return [...this.statusBar.disposables()];
    }

    handleCharacter(event: VsCodeEvent) {
        if (event.text) {
            this.machine.emit({ name: event.text });
        }
    }

    initMachine(): Machine<{}> {
        return (
            createMachine<{}>()
                // =============================================================================
                // EditorMode.EDIT
                // =============================================================================
                .state<{}>({
                    name: EditorMode.EDIT,
                    enter: [
                        () => {
                            this.vsCodeContext.set(EditorMode.EDIT);
                        },
                        () => {
                            this.statusBar.set({ editor: EditorMode.EDIT });
                        },
                    ],
                })
                .transitionLiteral({
                    target: `${EditorMode.MOTION}-${MotionMode.CHARACTER}`,
                    on: ["esc"],
                })
                .transitionDefault({
                    actions: [
                        (event, _) => {
                            vscode.commands.executeCommand("default:type", {
                                text: event.name,
                            });
                        },
                    ],
                })
                // =============================================================================
                // EditorMode.MOTION-MotionMode.DOCUMENT
                // =============================================================================
                .state<MotionContext>({
                    name: `${EditorMode.MOTION}-${MotionMode.DOCUMENT}`,
                    context: {
                        accumulated: "",
                        editor: EditorMode.MOTION,
                        motion: MotionMode.DOCUMENT,
                    },
                    enter: [
                        () => {
                            this.vsCodeContext.set(EditorMode.MOTION);
                        },
                        (_, context) => {
                            this.statusBar.set({ ...context });
                        },
                    ],
                })
                .transitionLiteral({
                    target: EditorMode.EDIT,
                    on: ["e"],
                })
                .transitionLiteral({
                    on: ["s"],
                    actions: [
                        (_, context) => {
                            this.statusBar.set({
                                ...context,
                                message: "Saved $(save)",
                            });
                            vscode.commands.executeCommand(
                                "workbench.action.files.save"
                            );
                        },
                    ],
                })
                .transitionLiteral({
                    on: ["f"],
                    actions: [
                        (_, context) => {
                            this.statusBar.set({
                                ...context,
                                message: "Saved $(save)",
                            });
                            vscode.commands.executeCommand(
                                "editor.action.formatDocument"
                            );
                        },
                    ],
                })
                .transitionLiteral({
                    target: `${EditorMode.MOTION}-${MotionMode.CHARACTER}`,
                    on: ["c"],
                })
                // =============================================================================
                // EditorMode.MOTION-MotionMode.CHARACTER
                // =============================================================================
                .state<MotionContext>({
                    name: `${EditorMode.MOTION}-${MotionMode.CHARACTER}`,
                    initial: true,
                    context: {
                        accumulated: "",
                        editor: EditorMode.MOTION,
                        motion: MotionMode.CHARACTER,
                    },
                    enter: [
                        () => {
                            this.vsCodeContext.set(EditorMode.MOTION);
                        },
                        (_, context) => {
                            this.statusBar.set({ ...context });
                        },
                    ],
                })
                .transitionLiteral({
                    target: EditorMode.EDIT,
                    on: ["e"],
                })
                .transitionLiteral({
                    target: `${EditorMode.MOTION}-${MotionMode.DOCUMENT}`,
                    on: ["d"],
                })
                .transitionLiteral({
                    on: ["i"],
                    actions: [
                        (_, context) => {
                            const count = this.helper.number(context);
                            this.statusBar.set({
                                ...context,
                                message: count,
                                movement: MovementType.UP,
                            });
                            this.document.moveCharacter({
                                to: "up",
                                value: count,
                            });
                            this.helper.clear(context);
                        },
                    ],
                })
                .transitionLiteral({
                    on: ["j"],
                    actions: [
                        (_, context) => {
                            const count = this.helper.number(context);
                            this.statusBar.set({
                                ...context,
                                message: count,
                                movement: MovementType.LEFT,
                            });
                            this.document.moveCharacter({
                                to: "left",
                                value: count,
                            });
                            this.helper.clear(context);
                        },
                    ],
                })
                .transitionLiteral({
                    on: ["k"],
                    actions: [
                        (_, context) => {
                            const count = this.helper.number(context);
                            this.statusBar.set({
                                ...context,
                                message: count,
                                movement: MovementType.DOWN,
                            });
                            this.document.moveCharacter({
                                to: "down",
                                value: count,
                            });
                            this.helper.clear(context);
                        },
                    ],
                })
                .transitionLiteral({
                    on: ["l"],
                    actions: [
                        (_, context) => {
                            const count = this.helper.number(context);
                            this.statusBar.set({
                                ...context,
                                message: count,
                                movement: MovementType.RIGHT,
                            });
                            this.document.moveCharacter({
                                to: "right",
                                value: count,
                            });
                            this.helper.clear(context);
                        },
                    ],
                })
                .transitionLiteral({
                    on: ["x"],
                    actions: [
                        (_, context) => {
                            context.accumulated = "";
                            this.statusBar.set({ ...context });
                        },
                    ],
                })
                .transitionLiteral({
                    on: ["w"],
                    target: `${EditorMode.MOTION}-${MotionMode.WORD}`,
                })
                .transitinoRegex({
                    on: [`\\d`],
                    actions: [
                        (event, context) => {
                            context.accumulated += event.name;
                            this.statusBar.set({
                                ...context,
                                message: `${context.accumulated}`,
                            });
                        },
                    ],
                })
                .transitionDefault({
                    actions: [
                        (event, context) => {
                            this.statusBar.set({
                                ...context,
                                message: `"${event.name}" $(question)`,
                            });
                        },
                    ],
                })
                // =============================================================================
                // EditorMode.MOTION-MotionMode.WORD
                // =============================================================================
                .state<MotionContext>({
                    name: `${EditorMode.MOTION}-${MotionMode.WORD}`,
                    context: {
                        accumulated: "",
                        editor: EditorMode.MOTION,
                        motion: MotionMode.WORD,
                    },
                    enter: [
                        () => {
                            this.vsCodeContext.set(EditorMode.MOTION);
                        },
                        (_, context) => {
                            this.statusBar.set({ ...context });
                        },
                    ],
                })
                .transitionLiteral({
                    on: ["c"],
                    target: `${EditorMode.MOTION}-${MotionMode.CHARACTER}`,
                })
                .transitionLiteral({
                    on: ["x"],
                    actions: [
                        (_, context) => {
                            context.accumulated = "";
                            this.statusBar.set({ ...context });
                        },
                    ],
                })
                .transitionLiteral({
                    on: ["j"],
                    actions: [
                        (_, context) => {
                            const count = this.helper.number(context);
                            this.statusBar.set({
                                ...context,
                                message: count,
                                movement: MovementType.LEFT,
                            });
                            this.document.moveCharacter({
                                to: "left",
                                value: count,
                            });
                            this.helper.clear(context);
                        },
                    ],
                })
                .transitionLiteral({
                    on: ["l"],
                    actions: [
                        (_, context) => {
                            const count = this.helper.number(context);
                            this.statusBar.set({
                                ...context,
                                message: count,
                                movement: MovementType.RIGHT,
                            });
                            this.document.moveCharacter({
                                to: "right",
                                value: count,
                            });
                            this.helper.clear(context);
                        },
                    ],
                })
                .transitinoRegex({
                    on: [`\\d`],
                    actions: [
                        (event, context) => {
                            context.accumulated += event.name;
                            this.statusBar.set({
                                ...context,
                                message: `${context.accumulated}`,
                            });
                        },
                    ],
                })
                .transitionLiteral({
                    on: ["x"],
                    actions: [
                        (_, context) => {
                            context.accumulated = "";
                            this.statusBar.set({ ...context });
                        },
                    ],
                })

                .build()
        );
    }
}
