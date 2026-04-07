import {
  analyzeDeviation,
  addCustomDeviation,
  clearKnowledge,
  getCustomDeviations,
  getQdrantStatus,
} from "./services/api";
import { useState, useEffect } from "react";

import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("analyze");

  // Analyze State
  const [description, setDescription] = useState("");
  const [rootCauses, setRootCauses] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manage State
  const [customDeviations, setCustomDeviations] = useState([]);
  const [jsonInput, setJsonInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState("");
  const [dbStatus, setDbStatus] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (activeTab === "manage") {
      fetchDeviations();
    }
  }, [activeTab]);

  const fetchDeviations = async () => {
    try {
      const res = await getCustomDeviations();
      if (res.data.status === "success") {
        setCustomDeviations(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching deviations:", error);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await getQdrantStatus();
      console.log("System Status Update:", res.data);
      if (res.data && res.data.status === "success") {
        setDbStatus(res.data);
      } else {
        setDbStatus({ status: "disconnected", message: res.data?.message });
      }
    } catch (error) {
      console.error("Critical System Status Error:", error);
      setDbStatus({ status: "disconnected" });
    }
  };

  const handleAnalyze = async () => {
    if (!description.trim() && !rootCauses.trim()) return;
    setLoading(true);
    try {
      const payload = {
        description,
        rootCauses,
      };

      const res = await analyzeDeviation(payload);
      if (res.data.status === "success") {
        setResult(res.data.data);
      } else {
        alert("Analysis error: " + (res.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error analyzing deviation:", error);
      const msg =
        error.response?.data?.message ||
        "Analysis failed. Please check if ML service is running.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeviation = async () => {
    if (!jsonInput.trim()) return alert("Please provide JSON data.");
    setIsAdding(true);
    try {
      let payload;
      try {
        payload = JSON.parse(jsonInput);
      } catch (parseError) {
        setIsAdding(false);
        return alert("Invalid JSON format: " + parseError.message);
      }

      const res = await addCustomDeviation(payload);

      if (res.data.status === "success") {
        setJsonInput("");
        fetchDeviations();
        setIsAdding(false);
        alert(res.data.message);
      } else {
        alert("Failed to save: " + res.data.message);
      }
    } catch (error) {
      console.error("Error adding deviation:", error);
      alert(
        error.response?.data?.message || "Error communicating with backend.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleClear = async () => {
    if (
      !window.confirm(
        "Are you sure you want to WIPE the entire Knowledge Database (AI + Local JSON)? This is permanent.",
      )
    )
    return;
    setIsTraining(true);
    setTrainStatus("Clearing AI Knowledge & Local DB...");
    try {
      const res = await clearKnowledge();
      if (res.data.status === "success") {
        setCustomDeviations([]); // Clear UI immediately
        setTrainStatus("System Rooted: " + res.data.message);
        fetchStatus(); // Refresh vector counts
        alert("System database and AI memory cleared!");
      }
    } catch (error) {
      console.error("Clear error:", error);
      alert(error.response?.data?.message || "Clear operation failed.");
    } finally {
      setIsTraining(false);
    }
  };

  const copyToClipboard = () => {
    const jsonStr = JSON.stringify(customDeviations, null, 2);
    navigator.clipboard.writeText(jsonStr);
    alert("JSON copied!");
  };

  return (
    <div className="app-container">
      <header
        className="header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1>input</h1>
          <p>Analysis & Knowledge</p>
        </div>
        <div>
          {dbStatus ? (
            <div
              className={`status-badge ${dbStatus.status === "success" ? "connected" : "disconnected"}`}
            >
              <div className="status-dot"></div>
              {dbStatus.status === "success" ? (
                <span>
                  Qdrant Connected •{" "}
                  {dbStatus.data?.stored_vectors?.dvms_desc || 0} vectors
                </span>
              ) : (
                <span>Qdrant Offline</span>
              )}
            </div>
          ) : (
            <div className="status-badge">Checking connection...</div>
          )}
        </div>
      </header>

      <nav className="nav">
        <div
          className={`nav-item ${activeTab === "analyze" ? "active" : ""}`}
          onClick={() => setActiveTab("analyze")}
        >
          Analyze
        </div>
        <div
          className={`nav-item ${activeTab === "manage" ? "active" : ""}`}
          onClick={() => setActiveTab("manage")}
        >
          Manage
        </div>
      </nav>

      {activeTab === "analyze" ? (
        <div className="section">
          <div className="form-group">
            <label>Description</label>
            <textarea
              style={{ height: "80px" }}
              placeholder="What happened?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Root Causes</label>
            <textarea
              style={{ height: "60px" }}
              placeholder="Root causes..."
              value={rootCauses}
              onChange={(e) => setRootCauses(e.target.value)}
            />
          </div>

          <button className="btn" onClick={handleAnalyze} disabled={loading}>
            {loading ? "Analyzing..." : "Generate Analysis"}
          </button>

          {result && (
            <div className="results-area">
              {result.error ? (
                <div style={{ color: "red", fontSize: "0.9rem" }}>
                  {result.error}
                </div>
              ) : (
                <>
                  <label style={{ color: "#000", fontWeight: "600" }}>
                    Similar Cases
                    {result.searchMode && (
                      <span
                        style={{
                          fontWeight: "400",
                          fontSize: "0.75rem",
                          color: "#888",
                          marginLeft: "8px",
                        }}
                      >
                        (matched by: {result.searchMode})
                      </span>
                    )}
                  </label>

                  {/* --- NEW: Dynamic Weights Info --- */}
                  {result.description_weight !== undefined && (
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        fontSize: "0.7rem",
                        marginTop: "5px",
                        color: "#666",
                        background: "#f8f9fa",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        width: "fit-content",
                      }}
                    >
                      <span>
                        <strong>Desc Weight:</strong>{" "}
                        {Math.round(result.description_weight * 100)}%
                      </span>
                      <span>
                        <strong>RC Weight:</strong>{" "}
                        {Math.round(result.root_weight * 100)}%
                      </span>
                    </div>
                  )}

                  <div style={{ marginTop: "10px" }}>
                    {result.similarDeviations?.map((d) => (
                      <div key={d.id} className="card">
                        <div className="card-header">
                          <span
                            className="card-title"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {d.deviation_no}
                          </span>
                          <span className="card-tag">
                            {d.matchScore}% Match
                          </span>
                        </div>

                        {/* --- NEW: Separate Percentages Badges --- */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "10px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "#e3f2fd",
                              color: "#1565c0",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontWeight: "600",
                            }}
                          >
                            Desc: {d.descriptionMatch}%
                          </span>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "#f3e5f5",
                              color: "#7b1fa2",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              fontWeight: "600",
                            }}
                          >
                            RC: {d.rootCauseMatch}%
                          </span>
                        </div>

                        <p className="description-box">{d.description}</p>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            marginTop: "10px",
                            color: "#666",
                          }}
                        >
                          <strong>Root Causes:</strong>{" "}
                          {d.rootCauses || "Unknown"}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="split-view">
          <section>
            <div className="card-header">
              <h2 style={{ fontSize: "1rem" }}>Add Knowledge (JSON)</h2>
              <span style={{ fontSize: "0.7rem", color: "#888" }}>
                Supports single or bulk array
              </span>
            </div>

            <div className="form-group" style={{ marginTop: "10px" }}>
              <label>JSON Data</label>
              <textarea
                style={{
                  height: "200px",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                }}
                placeholder='[ { "deviation_no": "DEV-001", "description": "...", "rootCauses": "..." } ]'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
              <p style={{ fontSize: "0.65rem", color: "#666" }}>
                Required: <strong>id</strong> (or auto-gen),{" "}
                <strong>description</strong>, <strong>rootCauses</strong>
              </p>
            </div>

            <button
              className="btn"
              onClick={handleAddDeviation}
              disabled={isAdding}
            >
              {isAdding ? "Saving..." : "Add Knowledge"}
            </button>

            <div
              style={{
                marginTop: "30px",
                paddingTop: "20px",
                borderTop: "1px solid #eee",
              }}
            >
              <h3
                style={{
                  fontSize: "0.85rem",
                  color: "#666",
                  marginBottom: "15px",
                }}
              >
                Database Actions
              </h3>
              <div style={{ marginTop: "10px" }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleClear}
                  disabled={isTraining}
                  style={{
                    width: "100%",
                    fontSize: "0.8rem",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                  }}
                >
                  {isTraining ? "Clearing..." : "Clear knowledge database"}
                </button>
              </div>
              {trainStatus && (
                <p
                  style={{
                    fontSize: "0.7rem",
                    marginTop: "8px",
                    color: "#888",
                    textAlign: "center",
                  }}
                >
                  {trainStatus}
                </p>
              )}
            </div>
          </section>

          <section>
            <div className="card-header">
              <h2 style={{ fontSize: "1rem" }}>
                Datasets ({customDeviations.length})
              </h2>
              <button
                onClick={copyToClipboard}
                style={{ fontSize: "0.7rem", padding: "2px 5px" }}
              >
                JSON
              </button>
            </div>
            <div className="dataset-list">
              {customDeviations.map((d, i) => (
                <div
                  key={i}
                  className="card"
                  style={{ padding: "10px", fontSize: "0.8rem" }}
                >
                  <strong>{d.deviation_no}</strong>
                  <p style={{ color: "#666", margin: "5px 0" }}>
                    {d.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
