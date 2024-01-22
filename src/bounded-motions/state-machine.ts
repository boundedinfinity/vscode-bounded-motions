export function createMachine(opts?: MachineOpts): MachineBuilder {
    return new MachineBuilder(opts);
}

interface MachineOpts {
    debug?: boolean;
}

interface TransitionContext {
    opts: TransitionOpts;
    state?: State<any>;
}

class MachineBuilder {
    private machine: Machine;
    private currentState?: State<any>;
    private transitions: TransitionContext[] = [];

    constructor(opts?: MachineOpts) {
        this.machine = new Machine(opts);
    }

    state<T extends object>(opts: StateOpts<T>): MachineBuilder {
        this.currentState = new State<T>(this.machine, opts);
        this.machine.states.set(this.currentState.name, this.currentState);
        if (opts.initial) this.machine.initial = this.currentState;
        return this;
    }

    transitionHandler(opts: TransitionOpts): MachineBuilder {
        this.transitions.push({
            opts: opts,
            state: this.currentState,
        });

        return this;
    }

    transitionDefault(opts: DefaultTransitionOpts): MachineBuilder {
        return this.transitionHandler({
            ons: [(event: Event<any>) => true],
            actions: opts.actions,
        });
    }

    transitionLiteral(opts: StringTransitionOpts): MachineBuilder {
        const fns: TriggerFn[] = [];
        for (const on of opts.on) {
            fns.push((event: Event<any>): boolean => event.name === on);
        }
        return this.transitionHandler({
            ons: fns,
            target: opts.target,
            actions: opts.actions,
        });
    }

    transitinoRegex(opts: StringTransitionOpts): MachineBuilder {
        const fns: TriggerFn[] = [];
        for (const trigger of opts.on) {
            const regex = new RegExp(trigger);
            fns.push((event: Event<any>): boolean => regex.test(event.name));
        }
        return this.transitionHandler({
            ons: fns,
            target: opts.target,
            actions: opts.actions,
        });
    }

    build(): Machine {
        for (const context of this.transitions) {
            if (context.state) {
                let target: State<any> | undefined;

                if (typeof context.opts.target === "string") {
                    target = this.machine.states.get(context.opts.target);
                } else if (context.opts.target) {
                    target = context.opts.target;
                }

                if (!target) {
                    target = context.state;
                }

                if (target) {
                    context.state.transitions.push(
                        new Transition(
                            this.machine,
                            context.opts.ons,
                            context.opts.actions || [],
                            target,
                            context.state
                        )
                    );
                }
            }
        }

        return this.machine;
    }
}

export class Machine {
    debug?: boolean;
    initial: State<any>;
    current: State<any>;
    states: Map<string, State<any>>;

    constructor(opts?: MachineOpts) {
        this.debug = opts?.debug;
        this.states = new Map();
        this.initial = new State(this, { name: "DUMMY" });
        this.current = this.initial;
    }

    start(): Machine {
        this.current = this.initial;
        this.current.enters({ name: "START" });

        for (const state of this.states.values()) {
            for (const transition of state.transitions) {
            }
        }

        return this;
    }

    emit(event: Event<any>) {
        if (this.current) this.current.emit(event);
        else if (this.debug) console.log(`unhandled event: ${event.name}`);
    }
}

interface StateOpts<T extends object> {
    name: string;
    context?: T;
    initial?: boolean;
    enter?: { (event: Event<any>, context?: T): void }[];
    exit?: { (event: Event<any>, context?: T): void }[];
    resetContextOnExit?: boolean;
    resetContextOnEnter?: boolean;
}

class State<T extends object> {
    name: string;
    initialContext?: T;
    context?: T;
    enter: { (event: Event<any>, context?: T): void }[];
    exit: { (event: Event<any>, context?: T): void }[];
    transitions: Transition[] = [];
    transitionDefault?: Transition;
    resetContextOnExit?: boolean;
    resetContextOnEnter?: boolean;

    constructor(private readonly machine: Machine, opts: StateOpts<T>) {
        this.name = opts.name;
        this.initialContext = opts.context;
        this.context = this.initialContext;
        this.resetContextOnExit = opts.resetContextOnExit;
        this.resetContextOnEnter = opts.resetContextOnEnter;
        this.enter = opts.enter || [];
        this.exit = opts.exit || [];
    }

    enters(event: Event<any>) {
        if (this.resetContextOnEnter) {
            this.context = this.initialContext;
        }

        this.enter.forEach((fn) => {
            fn(event, this.context);
        });
    }

    exits(event: Event<any>) {
        this.exit.forEach((fn) => {
            fn(event, this.context);
        });

        if (this.resetContextOnExit) {
            this.context = this.initialContext;
        }
    }

    emit(event: Event<any>) {
        for (const transition of this.transitions) {
            if (transition.handles(event)) {
                transition.execute(event);
                return;
            }
        }

        this.transitionDefault?.execute(event);
    }
}

type TriggerFn = (event: Event<any>) => boolean;

interface TransitionOpts {
    ons: TriggerFn[];
    target?: State<any> | string;
    actions?: { (event: Event<any>, context?: any): void }[];
}

interface StringTransitionOpts {
    on: string[];
    target?: State<any> | string;
    actions?: { (event: Event<any>, context?: any): void }[];
}

interface DefaultTransitionOpts {
    target?: State<any> | string;
    actions?: { (event: Event<any>, context?: any): void }[];
}

class Transition {
    constructor(
        readonly machine: Machine,
        readonly fn: TriggerFn[],
        readonly actions: { (event: Event<any>, context?: any): void }[],
        readonly target: State<any>,
        readonly source: State<any>
    ) {}

    handles(event: Event<any>): boolean {
        for (const fn of this.fn) {
            if (fn(event)) return true;
        }
        return false;
    }

    execute(event: Event<any>) {
        if (this.source !== this.target) {
            this.source.exits(event);
        }

        this.actions.forEach((fn) => fn(event, this.target.context));

        if (this.source !== this.target) {
            this.target.enters(event);
            this.machine.current = this.target;
        }
    }
}

interface EventOpts<T extends object> {
    name: string;
    data: T;
}

class Event<T extends object> {
    readonly name: string;
    readonly data?: T;

    constructor(opts: EventOpts<T>) {
        this.name = opts.name;
        this.data = opts.data;
    }
}
