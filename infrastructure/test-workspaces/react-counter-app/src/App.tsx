import { calculateBudget } from './utils/math';

export const App = () => {
  // BUG: "1.5" is a string instead of a number, which causes TypeScript build error TS2345
  const allocatedBudget = calculateBudget(1000, 1.5);

  return {
    title: 'Department Budget Summary',
    allocated: allocatedBudget,
  };
};
