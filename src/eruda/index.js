const erudaInit = () => {
  const script = document.createElement("script");
  script.src = "./extension/无语包/src/eruda/eruda.js";
  script.onload = () => {
    window.eruda.init();
    const script2 = document.createElement("script");
    script2.src = "./extension/无语包/src/eruda/eruda-code.js";
    script2.onload = () => window.eruda.add(window.erudaCode);
    document.body.appendChild(script2);
  };
  document.body.appendChild(script);
};
export {
  erudaInit
};
