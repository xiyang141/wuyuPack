declare global {
	interface Array<T> {
		add(item: T): T[];
		remove(item: T): T[];
		addArray(item: T[]): T[];
		removeArray(item: T[]): T[];
		unique(): T[];
		randomGet(): T;
	}
	interface Window {
		eruda: any;
		erudaVue: any;
		erudaCode: any;
		PIXI: any;
		Live2DCubismCore: any;
		Live2D: any;
	}
	interface Element {
		setBackground(path: string, type: strin, ext?: string): void;
		dataset: {
			char: string;
		};
	}
}

export {};
