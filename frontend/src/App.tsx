import Workbench from "./components/Workbench";
import Home from "./pages/Home";
import Problems from "./pages/Problems";
import ProblemDetail from "./pages/ProblemDetail";
import { useRoute } from "./router";
import { peekPlaygroundSeed, clearPlaygroundSeed } from "./playgroundSeed";
import { Shell } from "./pages/Home";
import { useEffect, useState } from "react";

function PlaygroundPage() {
  const [seed, setSeed] = useState(() => peekPlaygroundSeed());
  useEffect(() => {
    const s = peekPlaygroundSeed();
    if (s !== null) {
      setSeed(s);
      clearPlaygroundSeed();
    }
  }, []);
  return (
    <Shell active="playground">
      <div style={{ height: "calc(100vh - 40px)", minHeight: 0 }}>
        <Workbench key={seed ?? "default"} initialCode={seed ?? undefined} showExamples />
      </div>
    </Shell>
  );
}

export default function App() {
  const route = useRoute();

  if (route.name === "playground") return <PlaygroundPage />;
  if (route.name === "problems") return <Problems />;
  if (route.name === "problem") return <ProblemDetail route={route} />;
  return <Home />;
}
