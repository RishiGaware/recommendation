import { useState } from "react";

import { analyzeDeviation } from "./services/api";

function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description) return;

    setLoading(true);
    try {
      const res = await analyzeDeviation({ title, description });
      setResult(res.data);
    } catch (error) {
      console.error("Error analyzing deviation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "50px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1 style={{ color: "#2c3e50" }}> test data</h1>
        <p style={{ color: "#7f8c8d" }}>
          Identify potential root causes using AI
        </p>
      </header>

      <section
        style={{
          background: "#f9f9f9",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            title
          </label>
          <input
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              boxSizing: "border-box",
            }}
            placeholder="e.g., Pressure drop in compressor"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Description
          </label>
          <textarea
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              height: "100px",
              boxSizing: "border-box",
            }}
            placeholder="Describe the issue in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: "#3498db",
            color: "white",
            padding: "12px 25px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            width: "100%",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          {loading ? "Analyzing..." : "Analyze Deviation"}
        </button>
      </section>

      {result && (
        <div style={{ marginTop: "40px" }}>
          <div
            style={{
              marginBottom: "30px",
              padding: "20px",
              borderLeft: "5px solid #2ecc71",
              background: "#f0faf5",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Possible Root Causes</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {result.possibleRootCauses.map((c, i) => (
                <div
                  key={i}
                  style={{
                    background: "white",
                    padding: "15px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                    flex: "1",
                    minWidth: "150px",
                  }}
                >
                  <div style={{ fontSize: "14px", color: "#7f8c8d" }}>
                    Root Cause
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#2c3e50",
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      height: "8px",
                      background: "#eee",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${c.probability * 100}%`,
                        height: "100%",
                        background: "#2ecc71",
                      }}
                    ></div>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: "12px",
                      marginTop: "5px",
                    }}
                  >
                    {Math.round(c.probability * 100)}% Match
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h3>Similar Past Deviations</h3>
          <div style={{ display: "grid", gap: "15px" }}>
            {result.similarDeviations.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: "15px",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{d.title}</div>
                <div style={{ fontSize: "14px", color: "#2c3e50", marginTop: "5px", background: "#f1f1f1", padding: "8px", borderRadius: "4px" }}>
                  {d.description}
                </div>
                <div style={{ fontSize: "14px", color: "#7f8c8d", marginTop: "8px" }}>
                  Root Cause: {d.rootCause}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#95a5a6",
                    marginTop: "5px",
                  }}
                >
                  Confidence: {Math.round(d.score * 100)}%
                </div>
              </div>
            ))}
          </div>

          <p
            style={{
              marginTop: "20px",
              color: "#95a5a6",
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            {result.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
