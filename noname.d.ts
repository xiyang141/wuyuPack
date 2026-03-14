declare module "noname" {
	const lib: {
		characterPack: {
			[key: string]: string[];
		};
		characterSort: {
			[key: string]: {
				[key: string]: string[];
			};
		};
		[key: string]: any;
	};
	const game: any;
	const get: any;
	const ui: any;
	const _status: any;
	const ai: any;
	export { lib, game, get, ui, _status, ai };
}
