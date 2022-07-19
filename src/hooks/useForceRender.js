import React from 'react';

export function useForceRender() {
  const [counter, setCounter] = React.useState(0);

  return [counter, () => setCounter(c => c + 1)];
}
