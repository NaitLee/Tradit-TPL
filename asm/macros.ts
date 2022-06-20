
export const Macros = new Map<string, () => void>();

function macro(name: string, func: () => void): void {
    Macros.set(name, func);
}

function noop(): void {}

macro('add', noop);
