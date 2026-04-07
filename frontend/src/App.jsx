import {
  analyzeDeviation,
  addCustomDeviation,
  trainModel,
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
  const [deviationType, setDeviationType] = useState("Unplanned");
  const [deviationClassification, setDeviationClassification] =
    useState("Major");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manage State
  const [customDeviations, setCustomDeviations] = useState([]);
  const [devNo, setDevNo] = useState("");
  const [devDesc, setDevDesc] = useState("");
  const [devRootCauses, setDevRootCauses] = useState("");
  const [devType, setDevType] = useState("Unplanned");
  const [devClass, setDevClass] = useState("Major");
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
      setCustomDeviations(res.data);
    } catch (error) {
      console.error("Error fetching deviations:", error);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await getQdrantStatus();
      setDbStatus(res.data);
    } catch (error) {
      setDbStatus({ status: "disconnected" });
    }
  };

  const handleAnalyze = async () => {
    if (!description) return;
    setLoading(true);
    try {
      const payload = {
        description,
        deviationType,
        deviationClassification,
        rootCauses,
      };

      const res = await analyzeDeviation(payload);
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
        deviationType: devType,
        deviationClassification: devClass,
        rootCauses: devRootCauses,
      });
      setDevNo("");
      setDevDesc("");
      setDevRootCauses("");
      fetchDeviations();
      setIsAdding(false);
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
      fetchStatus(); // Refresh point counts
      alert("Model updated successfully!");
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
              className={`status-badge ${dbStatus.status.includes("connected") ? "connected" : "disconnected"}`}
            >
              <div className="status-dot"></div>
              {dbStatus.status.includes("connected") ? (
                <span>
                  Qdrant Connected • {dbStatus.stored_vectors?.dvms_desc || 0}{" "}
                  vectors
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
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select
                value={deviationType}
                onChange={(e) => setDeviationType(e.target.value)}
              >
                <option value="Unplanned">Unplanned</option>
                <option value="Planned">Planned</option>
              </select>
            </div>
            <div className="form-group">
              <label>Classification</label>
              <select
                value={deviationClassification}
                onChange={(e) => setDeviationClassification(e.target.value)}
              >
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

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
                  {/* <h2 style={{ fontSize: "1.1rem", marginBottom: "15px" }}>
                    Findings
                  </h2> */}

                  {/* <div style={{ marginBottom: "30px" }}>
                    <label style={{ color: "#000", fontWeight: "600" }}>
                      Root Causes
                    </label>
                    <div className="form-row" style={{ marginTop: "10px" }}>
                      {result.possibleRootCauses?.map((c, i) => (
                        <div key={i} className="card">
                          <div className="card-header">
                            <span className="card-title">{c.name}</span>
                          </div>
                          <div className="confidence-bar-bg">
                            <div
                              className="confidence-bar-fill"
                              style={{ width: `${c.probability * 100}%` }}
                            ></div>
                          </div>
                          <div className="similarity-text">
                            {Math.round(c.probability * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div> */}

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
            <h2 style={{ fontSize: "1rem", marginBottom: "15px" }}>
              Add Knowledge
            </h2>
            <div className="form-group">
              <label>No.</label>
              <input
                placeholder="DEV-001"
                value={devNo}
                onChange={(e) => setDevNo(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                style={{ height: "60px" }}
                value={devDesc}
                onChange={(e) => setDevDesc(e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={devType}
                  onChange={(e) => setDevType(e.target.value)}
                >
                  <option value="Unplanned">Unplanned</option>
                  <option value="Planned">Planned</option>
                </select>
              </div>
              <div className="form-group">
                <label>Class</label>
                <select
                  value={devClass}
                  onChange={(e) => setDevClass(e.target.value)}
                >
                  <option value="Minor">Minor</option>
                  <option value="Major">Major</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Root Causes</label>
              <input
                value={devRootCauses}
                onChange={(e) => setDevRootCauses(e.target.value)}
              />
            </div>
            <button
              className="btn"
              onClick={handleAddDeviation}
              disabled={isAdding}
            >
              {isAdding ? "Saving..." : "Save Entry"}
            </button>

            <div
              style={{
                marginTop: "30px",
                pt: "20px",
                borderTop: "1px solid #eee",
              }}
            >
              <label>System</label>
              <div style={{ marginTop: "10px" }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleTrain}
                  disabled={isTraining}
                  style={{ width: "100%", fontSize: "0.8rem" }}
                >
                  {isTraining ? "Processing..." : "Train Model"}
                </button>
              </div>
              {trainStatus && (
                <p
                  style={{
                    fontSize: "0.7rem",
                    marginTop: "5px",
                    color: "#888",
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
