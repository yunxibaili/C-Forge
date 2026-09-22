import Workbench from "../components/Workbench";
import { getProblem, SOURCES } from "../problems";
import { navigate, type Route } from "../router";
import { setPlaygroundSeed } from "../playgroundSeed";
import { Shell } from "./Home";
import styles from "./pages.module.css";

export default function ProblemDetail({ route }: { route: Extract<Route, { name: "problem" }> }) {
  const problem = getProblem(route.id);

  if (!problem) {
    return (
      <Shell active="problems">
        <div className={styles.body}>
          <div className={styles.detailWrap}>
            <div className={styles.empty}>Problem not found: {route.id}</div>
            <button
              className={styles.btnGhost}
              onClick={() => navigate("/problems")}
              style={{ marginTop: 12 }}
            >
              ← Back to Problems
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const src = SOURCES.find((s) => s.id === problem.source);

  const openInPlayground = () => {
    setPlaygroundSeed(problem.code);
    navigate("/playground");
  };

  return (
    <Shell active="problems">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 40px)",
          minHeight: 0,
          background: "var(--bg0)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 16px",
            borderBottom: "1px solid var(--line)",
            background: "var(--bg1)",
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className={styles.detailTitle} style={{ fontSize: 15 }}>
              {problem.title}
            </div>
            <div className={styles.detailMeta} style={{ marginTop: 6 }}>
              <span
                className={`${styles.badge} ${
                  problem.difficulty === "easy"
                    ? styles.badgeEasy
                    : problem.difficulty === "medium"
                    ? styles.badgeMed
                    : styles.badgeHard
                }`}
              >
                {problem.difficulty}
              </span>
              <span>{src?.label ?? problem.source}</span>
              {problem.topics.map((t) => (
                <span key={t} className={styles.topicTag}>
                  {t}
                </span>
              ))}
              {problem.url && (
                <a className={styles.srcLink} href={problem.url} target="_blank" rel="noreferrer">
                  source ↗
                </a>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className={styles.btnGhost} onClick={openInPlayground}>
              Open in Playground
            </button>
            <button className={styles.btnGhost} onClick={() => navigate("/problems")}>
              ← Problems
            </button>
          </div>
        </div>

        <div
          style={{
            padding: "8px 16px",
            fontSize: 13,
            color: "var(--fg2)",
            lineHeight: 1.5,
            borderBottom: "1px solid var(--line)",
            background: "var(--bg1)",
            flexShrink: 0,
          }}
        >
          {problem.description}
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <Workbench
            key={problem.id}
            initialCode={problem.code}
            showExamples={false}
            codeLabel="reference.c"
          />
        </div>
      </div>
    </Shell>
  );
}
