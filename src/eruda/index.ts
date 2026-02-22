export let erudaInit = () => {
	const script = document.createElement('script');
	script.src = `./extension/无语包/src/eruda/eruda.js`;
	script.onload = () => window.eruda.init();
	document.body.appendChild(script);
};
