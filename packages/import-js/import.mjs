import { transpiler } from '@strudel/transpiler';

const loadJsAsText = async (jsUrl) => {
  const res = await fetch(jsUrl);
  const text = await res.text();
  return text;
};

export const loadJsIntoCodeBuffer = async (jsUrl) => {
  const text = await loadJsAsText(jsUrl);
  const code = transpiler(text, { wrapAsync: false, addReture: false, simpleLocs: true }).output;
  Function(code)();
};

export const hotReloadWithWebSocketEvent = async ({ reload, code }, setCodeFn, updateFn) => {
  if (!reload) return;
  setCodeFn(code);

  updateFn();
};
