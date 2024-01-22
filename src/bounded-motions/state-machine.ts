export function createMachine<T extends object>(
    opts?: MachineOpts<T>
): MachineBuilder<T> {
    return new MachineBuilder(opts);
}

interface MachineOpts<T extends object> {
    debug?: boolean;
    context?: T;
}

interface TransitionContext {
    opts: TransitionOpts;
    state?: State<any>;
}

class StateBuilder<T extends object> {
    machine: MachineBuilder<any>;
    name: string;

    constructor(machine: MachineBuilder<T>, name: string) {
        this.machine = machine;
        this.name = name;
    }

    context<T extends object>(context: T): StateBuilder<T> {
        return this;
    }
}

class MachineBuilder<T extends object> {
    private machine: Machine<T>;
    private currentState?: State<any>;
    private transitions: TransitionContext[] = [];

    constructor(opts?: MachineOpts<T>) {
        this.machine = new Machine(opts);
    }

    state<S extends object>(opts: StateOpts<S>): MachineBuilder<T> {
        this.currentState = new State<S>(this.machine, opts);
        this.machine.states.set(this.currentState.name, this.currentState);
        if (opts.initial) this.machine.initial = this.currentState;
        return this;
    }

    transitionHandler(opts: TransitionOpts): MachineBuilder<T> {
        this.transitions.push({
            opts: opts,
            state: this.currentState,
        });

        return this;
    }

    transitionDefault(opts: DefaultTransitionOpts): MachineBuilder<T> {
        return this.transitionHandler({
            ons: [(event: Event<any>) => true],
            actions: opts.actions,
        });
    }

    transitionLiteral(opts: StringTransitionOpts): MachineBuilder<T> {
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

    transitinoRegex(opts: StringTransitionOpts): MachineBuilder<T> {
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

    build(): Machine<T> {
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

export class Machine<T extends object> {
    debug?: boolean;
    initial: State<any>;
    current: State<any>;
    context?: T;
    states: Map<string, State<any>>;

    constructor(opts?: MachineOpts<T>) {
        this.debug = opts?.debug;
        this.states = new Map();
        this.initial = new State(this, { name: "DUMMY" });
        this.current = this.initial;
    }

    start(): Machine<T> {
        this.current = this.initial;
        this.current.enters({ name: "START" });
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
    states: State<any>[];
    current?: State<any>;

    constructor(private readonly machine: Machine<any>, opts: StateOpts<T>) {
        this.name = opts.name;
        this.initialContext = opts.context;
        this.context = this.initialContext;
        this.resetContextOnExit = opts.resetContextOnExit;
        this.resetContextOnEnter = opts.resetContextOnEnter;
        this.enter = opts.enter || [];
        this.exit = opts.exit || [];
        this.states = [];
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
        if (this.current) {
            this.current.emit(event);
        } else {
            for (const transition of this.transitions) {
                if (transition.handles(event)) {
                    transition.execute(event);
                    return;
                }
            }

            this.transitionDefault?.execute(event);
        }
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
        readonly machine: Machine<any>,
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
