import { useState, useEffect } from "react";

import {
  analyzeDeviation,
  getCustomDeviations,
  addCustomDeviation,
  trainModel,
} from "./services/api";

function App() {
  const [activeTab, setActiveTab] = useState("analyze");

  // Analyze State
  const [description, setDescription] = useState("");
  const [correctionAction, setCorrectionAction] = useState("");
  const [deviationType, setDeviationType] = useState("Unplanned");
  const [deviationClassification, setDeviationClassification] =
    useState("Major");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manage State
  const [customDeviations, setCustomDeviations] = useState([]);
  const [devNo, setDevNo] = useState("");
  const [devDesc, setDevDesc] = useState("");
  const [devRemarks, setDevRemarks] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState("");

  useEffect(() => {
    if (activeTab === "manage") {
      fetchDeviations();
    }
  }, [activeTab]);

  const fetchDeviations = async () => {
    try {
      const res = await getCustomDeviations();
      setCustomDeviations(res.data);
    } catch (error) {
      console.error("Error fetching deviations:", error);
    }
  };

  const handleAnalyze = async () => {
    if (!description) return;
    setLoading(true);
    try {
      const res = await analyzeDeviation({
        description,
        correctionAction,
        deviationType,
        deviationClassification,
      });
      setResult(res.data);
    } catch (error) {
      console.error("Error analyzing deviation:", error);
      alert("Analysis failed. Please check if ML service is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeviation = async () => {
    if (!devNo || !devDesc) return;
    setIsAdding(true);
    try {
      await addCustomDeviation({
        deviation_no: devNo,
        description: devDesc,
        remarks: devRemarks,
      });
      setDevNo("");
      setDevDesc("");
      setDevRemarks("");
      fetchDeviations();
      alert("Deviation added to local storage!");
    } catch (error) {
      console.error("Error adding deviation:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainStatus("Training in progress...");
    try {
      await trainModel();
      setTrainStatus("Training completed successfully!");
      alert("Model retrained with new data!");
    } catch (error) {
      setTrainStatus("Training failed.");
      console.error("Training error:", error);
    } finally {
      setIsTraining(false);
    }
  };

  const copyToClipboard = () => {
    const jsonStr = JSON.stringify(customDeviations, null, 2);
    navigator.clipboard.writeText(jsonStr);
    alert("JSON copied to clipboard!");
  };

  const tabStyle = (tab) => ({
    padding: "12px 24px",
    cursor: "pointer",
    borderBottom:
      activeTab === tab ? "3px solid #3498db" : "3px solid transparent",
    color: activeTab === tab ? "#3498db" : "#7f8c8d",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  });

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "0 20px",
        fontFamily: '"Inter", "Segoe UI", sans-serif',
        color: "#2c3e50",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            marginBottom: "10px",
            background: "linear-gradient(135deg, #3498db, #2ecc71)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          DVMS Intelligence
        </h1>
        <p style={{ color: "#7f8c8d", fontSize: "1.1rem" }}>
          Smart Deviation Analysis & Knowledge Management
        </p>
      </header>

      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginBottom: "30px",
          borderBottom: "1px solid #eee",
        }}
      >
        <div
          style={tabStyle("analyze")}
          onClick={() => setActiveTab("analyze")}
        >
          Analyze Deviation
        </div>
        <div style={tabStyle("manage")} onClick={() => setActiveTab("manage")}>
          Manage Knowledge
        </div>
      </nav>

      {activeTab === "analyze" ? (
        <div className="fade-in">
          <section
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "15px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              border: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#34495e",
                  }}
                >
                  Deviation Type
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "1px solid #dfe6e9",
                    fontSize: "1rem",
                    outline: "none",
                    background: "white",
                  }}
                  value={deviationType}
                  onChange={(e) => setDeviationType(e.target.value)}
                >
                  <option value="Unplanned">Unplanned</option>
                  <option value="Planned">Planned</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#34495e",
                  }}
                >
                  Classification
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "1px solid #dfe6e9",
                    fontSize: "1rem",
                    outline: "none",
                    background: "white",
                  }}
                  value={deviationClassification}
                  onChange={(e) => setDeviationClassification(e.target.value)}
                >
                  <option value="Minor">Minor</option>
                  <option value="Major">Major</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#34495e",
                }}
              >
                Deviation Description
              </label>
              <textarea
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid #dfe6e9",
                  height: "100px",
                  fontSize: "1rem",
                  outline: "none",
                  resize: "vertical",
                }}
                placeholder="Detailed explanation of the event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#34495e",
                }}
              >
                Immediate Correction Action
              </label>
              <textarea
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid #dfe6e9",
                  height: "80px",
                  fontSize: "1rem",
                  outline: "none",
                  resize: "vertical",
                }}
                placeholder="What was done immediately?"
                value={correctionAction}
                onChange={(e) => setCorrectionAction(e.target.value)}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #3498db, #2980b9)",
                color: "white",
                fontSize: "1.1rem",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 15px rgba(52, 152, 219, 0.3)",
                transition: "transform 0.2s",
              }}
            >
              {loading ? "AI is Thinking..." : "Predict Root Cause"}
            </button>
          </section>

          {result && (
            <div style={{ marginTop: "40px" }} className="fade-in">
              <h3 style={{ marginBottom: "20px", fontSize: "1.5rem" }}>
                AI Findings
              </h3>

              <div
                style={{
                  background: "#f8f9fa",
                  padding: "25px",
                  borderRadius: "15px",
                  marginBottom: "30px",
                  border: "1px solid #e9ecef",
                }}
              >
                <h4
                  style={{
                    marginTop: 0,
                    color: "#27ae60",
                    marginBottom: "20px",
                  }}
                >
                  Predicted Root Causes
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {result.possibleRootCauses.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        background: "white",
                        padding: "20px",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: "#95a5a6",
                          marginBottom: "5px",
                        }}
                      >
                        Category
                      </div>
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                          marginBottom: "15px",
                        }}
                      >
                        {c.name}
                      </div>
                      <div
                        style={{
                          height: "8px",
                          background: "#f1f2f6",
                          borderRadius: "10px",
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
                          marginTop: "8px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          color: "#27ae60",
                        }}
                      >
                        {Math.round(c.probability * 100)}% Confidence
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h4 style={{ marginBottom: "20px" }}>
                Historically Similar Cases
              </h4>
              <div style={{ display: "grid", gap: "20px" }}>
                {result.similarDeviations.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      background: "white",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "1px solid #f1f2f6",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}
                    >
                      <span style={{ fontWeight: "700", color: "#34495e" }}>
                        {d.title}
                      </span>
                      <span
                        style={{
                          background: "#edf2ff",
                          color: "#364fc7",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                        }}
                      >
                        {Math.round(d.score * 100)}% Similarity
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.95rem",
                        color: "#495057",
                        lineHeight: "1.5",
                        margin: "10px 0",
                        background: "#f8f9fa",
                        padding: "12px",
                        borderRadius: "8px",
                      }}
                    >
                      {d.description}
                    </p>
                    <div style={{ fontSize: "0.9rem", marginTop: "10px" }}>
                      <strong style={{ color: "#748ffc" }}>Resolution:</strong>{" "}
                      <span style={{ color: "#495057" }}>{d.rootCause}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="fade-in">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.5fr",
              gap: "30px",
            }}
          >
            <section
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "15px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                border: "1px solid #f0f0f0",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "25px" }}>
                Add New Knowledge
              </h3>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  Deviation No.
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #dfe6e9",
                    fontSize: "0.9rem",
                  }}
                  placeholder="DEV-2026-001"
                  value={devNo}
                  onChange={(e) => setDevNo(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  Event Description
                </label>
                <textarea
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #dfe6e9",
                    height: "80px",
                    fontSize: "0.9rem",
                    resize: "none",
                  }}
                  placeholder="What happened?"
                  value={devDesc}
                  onChange={(e) => setDevDesc(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  Root Cause / Remarks
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #dfe6e9",
                    fontSize: "0.9rem",
                  }}
                  placeholder="Root cause identified..."
                  value={devRemarks}
                  onChange={(e) => setDevRemarks(e.target.value)}
                />
              </div>
              <button
                onClick={handleAddDeviation}
                disabled={isAdding}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2ecc71",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginBottom: "20px",
                }}
              >
                {isAdding ? "Saving..." : "Save to Local Dataset"}
              </button>

              <hr
                style={{
                  border: "0",
                  borderTop: "1px solid #eee",
                  margin: "20px 0",
                }}
              />

              <h4 style={{ marginBottom: "15px" }}>Model Health</h4>
              <button
                onClick={handleTrain}
                disabled={isTraining}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "2px solid #3498db",
                  background: isTraining ? "#f8f9fa" : "transparent",
                  color: "#3498db",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {isTraining ? "Retraining Model..." : "🚀 Retrain Model Now"}
              </button>
              {trainStatus && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#7f8c8d",
                    marginTop: "10px",
                    textAlign: "center",
                  }}
                >
                  {trainStatus}
                </p>
              )}
            </section>

            <section
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "15px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                border: "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Local Dataset ({customDeviations.length})
                </h3>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    background: "white",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  📋 Copy JSON
                </button>
              </div>

              <div
                style={{
                  maxHeight: "500px",
                  overflowY: "auto",
                  paddingRight: "10px",
                }}
              >
                {customDeviations.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      color: "#bdc3c7",
                      marginTop: "50px",
                    }}
                  >
                    No custom deviations added yet.
                  </p>
                ) : (
                  customDeviations
                    .map((d) => (
                      <div
                        key={d.id}
                        style={{
                          padding: "15px",
                          borderRadius: "8px",
                          border: "1px solid #f1f2f6",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "5px",
                          }}
                        >
                          <span
                            style={{ fontWeight: "bold", fontSize: "0.9rem" }}
                          >
                            {d.deviation_no}
                          </span>
                          <span
                            style={{ fontSize: "0.75rem", color: "#bdc3c7" }}
                          >
                            {new Date(d.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            margin: "5px 0",
                            color: "#7f8c8d",
                          }}
                        >
                          {d.description}
                        </p>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#2ecc71",
                            fontWeight: "600",
                          }}
                        >
                          RC: {d.remarks}
                        </div>
                      </div>
                    ))
                    .reverse()
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      <style>{`
        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
      `}</style>
    </div>
  );
}

export default App;
