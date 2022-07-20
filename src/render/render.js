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

    // Yield to let react update UI before heavy rendering process
    await microtaskBreak();

    CollisionSystem.getCollisionSystem().clear();

    if (!current.currentEffect)
      return;

    renderer.clear(context);

    let index = 0;
    setProgress(0);

    for (const result of results) {

      // Becuase we have micro tasks, we need to check we're still current at
      // each iteration.
      if (!current.currentEffect)
        return;

      const prefix = `Rule ${index}: `;

      // console.debug(`${prefix} Loading elements for ${item.rule.selector}`);
      const { elements } = result;

      // if (!current.currentEffect) return;
      console.debug(`${prefix} Rendering ${result.selector}`);

      renderer.renderRule(context, rules[index], elements);

      setProgress(index/rules.length);

      // Render looks cooler but takes twice as long with microtask breaks
      // Pro: Looks better when waiting for render
      // Pro: Gives more immediate feedback
      // Con: When re-rendering (without user action; e.g. current location change)
      //      it spends longer with no map visible
      await microtaskBreak();

      index++;
    }

    setProgress(0);
    console.timeEnd("Rendering");

    setStatus(null);
  } catch (e) {
    setError("Error Fetching");
    setStatus(null);
    console.log(e);
  }
}

const microtaskBreak = () => new Promise(resolve => setTimeout(resolve, 0));