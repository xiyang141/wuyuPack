declare global {
	interface Array<T> {
		add(item: T): T[];
		addArray(item: T[]): T[];
		unique(): T[];
		randomGet(): T;
		remove(item: T): T[];
	}
	interface Window {
		eruda: any;
		PIXI: any;
		Live2DCubismCore: any;
		Live2D: any;
	}
	interface Element {
		setBackground(path: string, type: string): void;
		dataset: {
			char: string;
		};
	}
}

export {};
