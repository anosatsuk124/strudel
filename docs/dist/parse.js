import * as krill from "../_snowpack/link/repl/krill-parser.js";
import * as strudel from "../_snowpack/link/strudel.js";
import {Scale, Note, Interval} from "../_snowpack/pkg/@tonaljs/tonal.js";
const {sequence, stack, silence, Fraction, pure} = strudel;
function reify(thing) {
  if (thing?.constructor?.name === "Pattern") {
    return thing;
  }
  return pure(thing);
}
const applyOptions = (parent) => (pat, i) => {
  const ast = parent.source_[i];
  const options = ast.options_;
  const operator = options?.operator;
  if (operator) {
    switch (operator.type_) {
      case "stretch":
        const speed = new Fraction(operator.arguments_.amount).inverse().valueOf();
        return reify(pat).fast(speed);
    }
    console.warn(`operator "${operator.type_}" not implemented`);
  }
  const unimplemented = Object.keys(options || {}).filter((key) => key !== "operator");
  if (unimplemented.length) {
    console.warn(`option${unimplemented.length > 1 ? "s" : ""} ${unimplemented.map((o) => `"${o}"`).join(", ")} not implemented`);
  }
  return pat;
};
export function patternifyAST(ast) {
  switch (ast.type_) {
    case "pattern":
      const children = ast.source_.map(patternifyAST).map(applyOptions(ast));
      if (ast.arguments_.alignment === "v") {
        return stack(...children);
      }
      return sequence(...children);
    case "element":
      if (ast.source_ === "~") {
        return silence;
      }
      if (typeof ast.source_ !== "object") {
        return ast.source_;
      }
      return patternifyAST(ast.source_);
    case "stretch":
      return patternifyAST(ast.source_).slow(ast.arguments_.amount);
    case "scale":
      let [tonic, scale] = Scale.tokenize(ast.arguments_.scale);
      const intervals = Scale.get(scale).intervals;
      const pattern = patternifyAST(ast.source_);
      tonic = tonic || "C4";
      console.log("tonic", tonic);
      return pattern.fmap((step) => {
        step = Number(step);
        if (isNaN(step)) {
          console.warn(`scale step "${step}" not a number`);
          return step;
        }
        const octaves = Math.floor(step / intervals.length);
        const mod = (n, m) => n < 0 ? mod(n + m, m) : n % m;
        const index = mod(step, intervals.length);
        const interval = Interval.add(intervals[index], Interval.fromSemitones(octaves * 12));
        return Note.transpose(tonic, interval || "1P");
      });
    default:
      console.warn(`node type "${ast.type_}" not implemented -> returning silence`);
      return silence;
  }
}
export const mini = (...strings) => {
  const pattern = sequence(...strings.map((str) => {
    const ast = krill.parse(`"${str}"`);
    return patternifyAST(ast);
  }));
  return pattern;
};
export const h = (string) => {
  const ast = krill.parse(string);
  console.log("ast", ast);
  return patternifyAST(ast);
};
