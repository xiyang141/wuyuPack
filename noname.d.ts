declare module "noname" {
	interface Lib {
		[key: string | number | symbol]: any;
	}
	export const lib: Lib;
	export const game: Data;
	export const ui: Data;
	export const get: Data;
	export const _status: Data;
	export const ai: Data;
}
