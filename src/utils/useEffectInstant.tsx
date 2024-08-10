import { useState } from "react";

// Same as useEffect, but triggers the values to change instantly, preventing a render stutter
// NOTE: Can only be used to change state within the same component, not parents
export function useEffectInstant(effect: () => unknown, deps: any[]) {
  const [prevValues, setPrevValues] = useState(deps);
  for (let i = 0; i < Math.max(prevValues.length, deps.length); i++) {
    if (deps[i] !== prevValues[i]) {
      console.log("Values changed:", { prevValues, deps });
      effect();
      setPrevValues(deps);
      break;
    }
  }
}
