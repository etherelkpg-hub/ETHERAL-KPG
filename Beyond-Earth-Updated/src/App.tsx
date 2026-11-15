import { ErrorBoundary } from '@/components/error-boundary';
import { GameRoot } from '@/ui/GameRoot';

function App() {
  return (
    <ErrorBoundary resetKey="game">
      <GameRoot />
    </ErrorBoundary>
  );
}

export default App;
