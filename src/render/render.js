import CollisionSystem from '../Classes/CollisionSystem';

/**
 * @param {StyleRule[]} rules
 * @param {ElementSource} elementSource
 * @param {MapRenderer} renderer
 * @param {MapContext} context
 * @param {(arg0: string?) => void} setStatus
 * @param {(arg0: string) => void} setError
 * @param {(arg0: number) => void} setProgress
 * @param {{ currentEffect: any; }} current
 */
export async function render(rules, elementSource, renderer, context, setStatus, setError, setProgress, current) {
  setStatus("Fetching...");
  setError("");

  try {
    console.time("Fetching");

    const results = await elementSource.fetch(rules.map(r => r.selector), context.bbox);

    console.timeEnd("Fetching");

    setStatus(`Rendering...`);

    console.time("Rendering");

    CollisionSystem.getCollisionSystem().clear();

    if (!current.currentEffect)
      return;

    renderer.clear(context);

    let index = 0;
    // setProgress(0);
    for (const result of results) {
      const prefix = `Rule ${index}: `;

      // console.debug(`${prefix} Loading elements for ${item.rule.selector}`);
      const { elements } = result;

      // if (!current.currentEffect) return;
      console.debug(`${prefix} Rendering ${result.selector}`);

      renderer.renderRule(context, rules[index], elements);

      // setProgress(count/map.length);
      index++;
    }
    // setProgress(0);
    console.timeEnd("Rendering");

    setStatus(null);
  } catch (e) {
    setError("Error Fetching");
    setStatus(null);
    console.log(e);
  }
}
