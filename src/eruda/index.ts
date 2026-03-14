let count = 0;

export let erudaInit = () => {
	const script = document.createElement("script");
	script.src = "./extension/无语包/src/eruda/eruda.js";
	script.onload = () => {
		window.eruda.init();
		let script = document.createElement("script");
		script.src = "./extension/无语包/src/eruda/eruda-code.js";
		script.onload = () => window.eruda.add(window.erudaCode);
		document.body.appendChild(script);
	};
	document.body.appendChild(script);
};
