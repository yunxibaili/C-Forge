import { useMemo, useState } from "react";
import {
  DIFFICULTIES,
  PROBLEMS,
  SOURCES,
  TOPICS,
  type Difficulty,
  type SourceId,
  type Topic,
} from "../problems";
import { navigate } from "../router";
import { Shell } from "./Home";
import styles from "./pages.module.css";

export default function Problems() {
  const [q, setQ] = useState("");
  const [source, setSource] = useState<SourceId | "">("");
  const [topic, setTopic] = useState<Topic | "">("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");

  const list = useMemo(() => {
    const key = q.trim().toLowerCase();
    return PROBLEMS.filter((p) => {
      if (source && p.source !== source) return false;
      if (topic && !p.topics.includes(topic)) return false;
      if (difficulty && p.difficulty !== difficulty) return false;
      if (!key) return true;
      return (
        p.title.toLowerCase().includes(key) ||
        p.id.toLowerCase().includes(key) ||
        p.topics.some((t) => t.toLowerCase().includes(key)) ||
        p.description.toLowerCase().includes(key)
      );
    });
  }, [q, source, topic, difficulty]);

  return (
    <Shell active="problems">
      <div className={styles.body}>
        <div className={styles.problemsLayout}>
          <aside>
            <div className={styles.sideTitle}>Topics</div>
            <button
              className={`${styles.sideItem}${!topic ? " " + styles.sideActive : ""}`}
              onClick={() => setTopic("")}
            >
              All
            </button>
            {TOPICS.map((t) => (
              <button
                key={t}
                className={`${styles.sideItem}${topic === t ? " " + styles.sideActive : ""}`}
                onClick={() => setTopic(topic === t ? "" : t)}
              >
                {t}
              </button>
            ))}
            <div className={styles.sideTitle}>Source</div>
            <button
              className={`${styles.sideItem}${!source ? " " + styles.sideActive : ""}`}
              onClick={() => setSource("")}
            >
              All
            </button>
            {SOURCES.map((s) => (
              <button
                key={s.id}
                className={`${styles.sideItem}${source === s.id ? " " + styles.sideActive : ""}`}
                onClick={() => setSource(source === s.id ? "" : s.id)}
              >
                {s.label}
              </button>
            ))}
          </aside>

          <section>
            <div className={styles.listHead}>
              <span className={styles.listTitle}>Problems</span>
              <input
                className={styles.search}
                placeholder="Search title, topic, id…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select
                className={styles.select}
value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
                aria-label="Difficulty"
              >
                <option value="">Difficulty</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {list.length === 0 && <div className={styles.empty}>No problems match.</div>}

            {list.map((p) => (
              <a
                key={p.id}
                className={styles.row}
                href={`/problems/${p.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/problems/${p.id}`);
                }}
              >
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>{p.title}</div>
                  <div className={styles.rowMeta}>
                    <span
                      className={`${styles.badge} ${
                        p.difficulty === "easy"
                          ? styles.badgeEasy
                          : p.difficulty === "medium"
                          ? styles.badgeMed
                          : styles.badgeHard
                      }`}
                    >
                      {p.difficulty}
                    </span>
                    <span>{SOURCES.find((s) => s.id === p.source)?.label ?? p.source}</span>
                    {p.topics.map((t) => (
                      <span key={t} className={styles.topicTag}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--fg3)" }}>
                  →
                </span>
              </a>
            ))}
          </section>
        </div>
      </div>
    </Shell>
  );
}
