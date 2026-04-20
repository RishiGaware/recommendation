import {
  analyzeDeviation,
  getQdrantStatus,
  extractText,
  refineWithAI,
  getDvmsVectorsByIds,
  clearMlKnowledge,
  addMlKnowledge,
  analyzeOos,
  addOosKnowledge,
  clearOosKnowledge,
  getOosStatus,
} from "./services/api";
import { useState, useEffect } from "react";

import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("analyze");

  // Analyze State
  const [description, setDescription] = useState("");
  const [rootCauses, setRootCauses] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manage State
  const [customDeviations, setCustomDeviations] = useState([]);
  const [jsonInput, setJsonInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isMlClearing, setIsMlClearing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState("");
  const [dbStatus, setDbStatus] = useState(null);
  const [vectorsTabIds, setVectorsTabIds] = useState("");
  const [vectorsTabResult, setVectorsTabResult] = useState([]);
  const [vectorsTabLoading, setVectorsTabLoading] = useState(false);
  const [vectorsTabError, setVectorsTabError] = useState("");

  // Report Extraction State
  const [reportInput, setReportInput] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Enhance With AI (DVMS) Test State
  const [aiFieldType, setAiFieldType] = useState("description");
  const [aiUserPrompt, setAiUserPrompt] = useState("Expand details");
  const [aiUserInput, setAiUserInput] = useState("");
  const [aiGeneratedText, setAiGeneratedText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // OOS Pro Specific State
  const [oosPhase, setOosPhase] = useState(1);
  const [oosDescription, setOosDescription] = useState("");
  const [oosRootCauses, setOosRootCauses] = useState("");
  const [oosResult, setOosResult] = useState(null);
  const [oosLoading, setOosLoading] = useState(false);
  const [oosStartDate, setOosStartDate] = useState("");
  const [oosEndDate, setOosEndDate] = useState("");

  const [oosJsonInput, setOosJsonInput] = useState("");
  const [isOosAdding, setIsOosAdding] = useState(false);
  const [oosStatus, setOosStatus] = useState(null);

  // Enhance With AI (OOS) Test State
  const [oosAiFieldType, setOosAiFieldType] = useState("oosDescription");
  const [oosAiUserPrompt, setOosAiUserPrompt] = useState(
    "Technical investigation",
  );
  const [oosAiUserInput, setOosAiUserInput] = useState("");
  const [oosAiGeneratedText, setOosAiGeneratedText] = useState("");
  const [oosAiLoading, setOosAiLoading] = useState(false);
  const [oosAiError, setOosAiError] = useState("");

  const stripHtml = (html) => {
    if (!html) return "";
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return doc.body.textContent || "";
    } catch (e) {
      return html.replace(/<[^>]*>?/gm, "");
    }
  };

  const truncateText = (text, limit = 150) => {
    if (!text) return "";
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  };

  const parseIdsFromText = (text) => {
    return String(text || "")
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n))
      .map((n) => Math.trunc(n));
  };

  const fetchVectorsFromTab = async () => {
    setVectorsTabLoading(true);
    setVectorsTabError("");
    setVectorsTabResult([]);
    try {
      const ids = parseIdsFromText(vectorsTabIds);
      const res = await getDvmsVectorsByIds({ ids, includeVectors: false });
      const items = res?.data?.data?.items || [];
      setVectorsTabResult(Array.isArray(items) ? items : []);
    } catch (e) {
      setVectorsTabError(
        e?.response?.data?.message ||
          e?.response?.data?.detail ||
          "Failed to fetch vectors. Check ML service is running.",
      );
    } finally {
      setVectorsTabLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (activeTab === "manage") {
      fetchDeviations();
    } else if (activeTab === "vectors") {
      fetchVectorsFromTab();
    }
  }, [activeTab]);

  const fetchDeviations = async () => {
    try {
      // Fetch directly from ML service vector memory
      const res = await getDvmsVectorsByIds({ ids: [], includeVectors: false });

      if (res.data.status === "success") {
        // ML response has res.data.data.items = [{ id, payload, ... }]
        // We want to flatten this back to simple objects for the existing UI
        const items = res.data.data.items || [];
        const flattened = items.map((p) => ({
          ...p.payload,
          id: p.id,
        }));
        setCustomDeviations(flattened);
      }
    } catch (error) {
      console.error("Error fetching deviations from ML:", error);
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

      const oosRes = await getOosStatus();
      if (oosRes.data && oosRes.data.status === "success") {
        setOosStatus(oosRes.data);
      }
    } catch (error) {
      console.error("Critical System Status Error:", error);
      setDbStatus({ status: "disconnected" });
    }
  };

  const handleOosAnalyze = async () => {
    if (!oosDescription.trim() && !oosRootCauses.trim()) return;
    setOosLoading(true);
    try {
      const res = await analyzeOos({
        description: oosDescription,
        rootCauses: oosRootCauses,
        phase: oosPhase,
        startDate: oosStartDate || null,
        endDate: oosEndDate || null,
      });
      if (res.data.status === "success") {
        setOosResult(res.data.data);
      } else {
        alert("OOS Analysis error: " + (res.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error analyzing OOS:", error);
      alert(error.response?.data?.message || "OOS Analysis failed.");
    } finally {
      setOosLoading(false);
    }
  };

  const handleOosAddKnowledge = async () => {
    if (!oosJsonInput.trim()) return alert("Please provide OOS JSON data.");
    setIsOosAdding(true);
    try {
      let payload = JSON.parse(oosJsonInput);
      const items = Array.isArray(payload) ? payload : [payload];

      // Inject phase if not present
      const phasedItems = items.map((it) => ({ ...it, phase: oosPhase }));
      const res = await addOosKnowledge(phasedItems);

      if (res.data.status === "success") {
        setOosJsonInput("");
        fetchStatus();
        alert(res.data.message);
      } else {
        alert("OOS Save failed: " + res.data.message);
      }
    } catch (error) {
      alert("Error: " + (error.message || "Invalid JSON"));
    } finally {
      setIsOosAdding(false);
    }
  };

  const handleOosClear = async (targetPhase = null) => {
    const scope = targetPhase ? `Phase ${targetPhase}` : "ALL Phases";
    if (!window.confirm(`WIPE OOS Knowledge for ${scope}?`)) return;

    try {
      const res = await clearOosKnowledge(targetPhase);
      if (res.data.status === "success") {
        alert(res.data.message);
        fetchStatus();
      }
    } catch (error) {
      alert("Clear failed.");
    }
  };

  const handleOosEnhance = async () => {
    if (!oosAiUserInput.trim()) return alert("Please provide input text.");
    setOosAiLoading(true);
    setOosAiError("");
    setOosAiGeneratedText("");
    try {
      const res = await refineWithAI({
        fieldType: oosAiFieldType,
        value: oosAiUserInput,
        prompt: oosAiUserPrompt,
        domain: "oos",
      });
      if (res.data?.success) {
        setOosAiGeneratedText(res.data.generatedText || "");
      } else {
        setOosAiError(res.data?.message || "AI refine failed.");
      }
    } catch (error) {
      setOosAiError(error.message || "AI connection error");
    } finally {
      setOosAiLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!description.trim() && !rootCauses.trim()) return;
    setLoading(true);
    try {
      const payload = {
        description,
        rootCauses,
        startDate: startDate || null,
        endDate: endDate || null,
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

      const res = await addMlKnowledge(payload);
      setIsAdding(false);

      if (res.data.status === "success") {
        setJsonInput("");
        fetchStatus(); // Refresh vector counts
        fetchDeviations(); // Refresh dataset list (now pulled from ML)
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
        "Are you sure you want to WIPE the entire AI Knowledge Base (Qdrant)? This is permanent for AI memory.",
      )
    )
      return;
    setIsTraining(true);
    setTrainStatus("Clearing AI Knowledge...");
    try {
      const res = await clearMlKnowledge();
      if (res.data.status === "success") {
        setCustomDeviations([]); // Clear UI list locally
        setTrainStatus("System Rooted: " + res.data.message);
        fetchStatus(); // Refresh vector counts
        alert("ML AI Service knowledge (Qdrant) cleared successfully!");
      } else {
        alert("Failed to clear ML knowledge: " + res.data.message);
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

  const handleExtractData = async () => {
    if (!reportInput.trim()) return;
    setLoadingReport(true);
    try {
      const res = await extractText(reportInput);
      if (res.data.status === "success") {
        setExtractedData(res.data.data.text);
      } else {
        alert("Extraction error: " + (res.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Extraction API error:", error);
      alert("Failed to connect to ML Service for extraction.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleEnhanceWithAI = async () => {
    if (!aiUserInput.trim()) return alert("Please provide input text.");
    if (!aiUserPrompt.trim()) return alert("Please select or enter a prompt.");
    setAiLoading(true);
    setAiError("");
    setAiGeneratedText("");
    try {
      const res = await refineWithAI({
        fieldType: aiFieldType,
        value: aiUserInput,
        prompt: aiUserPrompt,
      });
      if (res.data?.success) {
        setAiGeneratedText(res.data.generatedText || "");
      } else {
        setAiError(res.data?.message || "AI refine failed.");
      }
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to connect to Enhance With AI service.";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
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
                  DVMS: {dbStatus.data?.stored_vectors?.dvms_desc || 0} • OOS
                  P1:{" "}
                  {oosStatus?.data?.stored_vectors?.phase_1?.oos_desc_p1 || 0} •{" "}
                  OOS P2:{" "}
                  {oosStatus?.data?.stored_vectors?.phase_2?.oos_desc_p2 || 0}
                </span>
              ) : (
                <span>System Offline</span>
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
        <div
          className={`nav-item ${activeTab === "report" ? "active" : ""}`}
          onClick={() => setActiveTab("report")}
        >
          HTML to Text Extract
        </div>
        <div
          className={`nav-item ${activeTab === "vectors" ? "active" : ""}`}
          onClick={() => setActiveTab("vectors")}
        >
          Vectors
        </div>
        <div
          className={`nav-item ${activeTab === "enhance_ai" ? "active" : ""}`}
          onClick={() => setActiveTab("enhance_ai")}
        >
          Enhance With AI
        </div>
        <div
          className={`nav-item ${activeTab === "oos_pro" ? "active" : ""}`}
          onClick={() => setActiveTab("oos_pro")}
        >
          OOS Pro
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

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
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

                        {d.description && (
                          <p className="description-box">
                            {truncateText(stripHtml(d.description), 150)}
                          </p>
                        )}
                        {d.rootCauses && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#777",
                              marginTop: "5px",
                              fontStyle: "italic",
                            }}
                          >
                            <strong>RC:</strong>{" "}
                            {truncateText(stripHtml(d.rootCauses), 80)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : activeTab === "manage" ? (
        <div className="split-view">
          <section>
            <div style={{ marginBottom: "15px" }}>
              <h2 style={{ fontSize: "1rem", margin: "0" }}>
                Add Knowledge (JSON)
              </h2>
              <p
                style={{ fontSize: "0.7rem", color: "#888", margin: "4px 0 0" }}
              >
                Supports single or bulk array
              </p>
            </div>

            <div className="form-group" style={{ marginTop: "10px" }}>
              <label>JSON Data</label>
              <textarea
                style={{
                  height: "200px",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                }}
                placeholder='[ { "id": 101, "description": "...", "rootCauses": "...", "initiationDate": "2024-11-10" } ]'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
              <p style={{ fontSize: "0.65rem", color: "#666" }}>
                Required: <strong>id</strong>, <strong>description</strong>,{" "}
                <strong>rootCauses</strong>. Optional:{" "}
                <strong>initiationDate</strong> (YYYY-MM-DD)
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
            <div
              className="dataset-list"
              style={{
                maxHeight: "600px",
                overflowY: "auto",
                paddingRight: "5px",
              }}
            >
              {customDeviations.map((d, i) => (
                <div
                  key={i}
                  className="card"
                  style={{ padding: "10px", fontSize: "0.8rem" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "5px",
                    }}
                  >
                    <strong>{d.deviation_no || `ID: ${d.id}`}</strong>
                    <span style={{ fontSize: "0.6rem", color: "#888" }}>
                      {d.deviationClassification || ""}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "#444",
                      margin: "5px 0",
                      lineHeight: "1.4",
                    }}
                  >
                    {truncateText(stripHtml(d.description), 180)}
                  </p>
                  {d.rootCauses && (
                    <p
                      style={{
                        color: "#777",
                        fontSize: "0.75rem",
                        fontStyle: "italic",
                      }}
                    >
                      <strong>RC:</strong>{" "}
                      {truncateText(stripHtml(d.rootCauses), 100)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : activeTab === "report" ? (
        <div className="section">
          <div className="form-group">
            <label>Raw Report Content (HTML/XML)</label>
            <textarea
              style={{
                height: "300px",
                fontFamily: "monospace",
                fontSize: "0.7rem",
              }}
              placeholder="Paste the raw Word-exported HTML here..."
              value={reportInput}
              onChange={(e) => setReportInput(e.target.value)}
            />
          </div>

          <button
            className="btn"
            onClick={handleExtractData}
            disabled={loadingReport}
          >
            {loadingReport ? "Extracting..." : "Process & Show Output"}
          </button>

          {extractedData && (
            <div className="results-area">
              <div
                style={{
                  background: "#f5f5f5",
                  padding: "15px",
                  borderRadius: "4px",
                }}
              >
                <h3 style={{ fontSize: "1rem", marginBottom: "10px" }}>
                  Extracted Text
                </h3>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.85rem",
                    color: "#333",
                    fontFamily: "monospace",
                    lineHeight: "1.4",
                  }}
                >
                  {extractedData}
                </pre>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "vectors" ? (
        <div className="section">
          <div className="card-header" style={{ marginBottom: "10px" }}>
            <h2 style={{ fontSize: "1rem" }}>Vectors (from ML service)</h2>
            <span style={{ fontSize: "0.7rem", color: "#888" }}>
              Calls /ml-service/dvms/vectors
            </span>
          </div>

          <div className="form-group">
            <label>Deviation IDs (leave empty to fetch all)</label>
            <input
              value={vectorsTabIds}
              onChange={(e) => setVectorsTabIds(e.target.value)}
              placeholder="e.g., 11, 12, 13 (or leave empty)"
              style={{ width: "100%", padding: "10px", borderRadius: "6px" }}
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                className="btn"
                onClick={fetchVectorsFromTab}
                disabled={vectorsTabLoading}
              >
                {vectorsTabLoading
                  ? "Fetching..."
                  : vectorsTabIds.trim()
                    ? "Search IDs"
                    : "Refresh All"}
              </button>

              <button
                className="btn"
                onClick={handleClear}
                disabled={isTraining}
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  marginLeft: "auto",
                }}
              >
                {isTraining ? "Clearing..." : "Clear Knowledge"}
              </button>
            </div>
          </div>

          {vectorsTabError && (
            <div
              style={{
                marginTop: "10px",
                color: "#b91c1c",
                fontSize: "0.85rem",
              }}
            >
              {vectorsTabError}
            </div>
          )}

          {vectorsTabResult.length > 0 && (
            <div className="results-area" style={{ marginTop: "15px" }}>
              {vectorsTabResult.map((it) => (
                <div key={it.id} className="card" style={{ padding: "12px" }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <strong>ID: {it.id}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#666" }}>
                      desc={it.descriptionVector?.length || 0} • root=
                      {it.rootCauseVector?.length || 0}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "0.75rem",
                      color: "#666",
                    }}
                  >
                    <div>
                      <strong>Desc preview:</strong>{" "}
                      {Array.isArray(it.descriptionVector)
                        ? it.descriptionVector
                            .slice(0, 10)
                            .map((n) => Number(n).toFixed(3))
                            .join(", ")
                        : "N/A"}
                    </div>
                    <div style={{ marginTop: "6px" }}>
                      <strong>Root preview:</strong>{" "}
                      {Array.isArray(it.rootCauseVector)
                        ? it.rootCauseVector
                            .slice(0, 10)
                            .map((n) => Number(n).toFixed(3))
                            .join(", ")
                        : "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "enhance_ai" ? (
        <div className="section">
          {/* Keep Existing DVMS AI - I will move it here */}
          <div className="card-header" style={{ marginBottom: "10px" }}>
            <h2 style={{ fontSize: "1rem" }}>Enhance With AI (DVMS) - Test</h2>
            <span style={{ fontSize: "0.7rem", color: "#888" }}>
              Calls /ml-service/dvms/ai/refine
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div className="form-group">
              <label>Field Type</label>
              <select
                value={aiFieldType}
                onChange={(e) => setAiFieldType(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px" }}
              >
                <option value="description">description</option>
                <option value="investigationFindings">
                  investigationFindings
                </option>
                <option value="impact">impact</option>
              </select>
            </div>

            <div className="form-group">
              <label>User Prompt (your instruction)</label>
              <input
                list="ai-prompt-suggestions"
                value={aiUserPrompt}
                onChange={(e) => setAiUserPrompt(e.target.value)}
                placeholder="e.g., Expand details / Fix grammar / Generate root cause"
                style={{ width: "100%", padding: "10px", borderRadius: "6px" }}
              />
              <datalist id="ai-prompt-suggestions">
                <option value="Expand details" />
                <option value="Fix grammar" />
                <option value="Generate root cause" />
                <option value="Make it concise" />
                <option value="Improve clarity" />
              </datalist>
            </div>
          </div>

          <div className="form-group">
            <label>Input Content (field content)</label>
            <textarea
              style={{ height: "140px" }}
              placeholder="Paste the field content / keywords here..."
              value={aiUserInput}
              onChange={(e) => setAiUserInput(e.target.value)}
            />
          </div>

          <button
            className="btn"
            onClick={handleEnhanceWithAI}
            disabled={aiLoading}
          >
            {aiLoading ? "Generating..." : "Enhance With AI"}
          </button>

          {aiError && (
            <div
              style={{
                marginTop: "10px",
                color: "#b91c1c",
                fontSize: "0.85rem",
              }}
            >
              {aiError}
            </div>
          )}

          {aiGeneratedText && (
            <div className="results-area" style={{ marginTop: "15px" }}>
              <div
                style={{
                  background: "#f5f5f5",
                  padding: "15px",
                  borderRadius: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <h3 style={{ fontSize: "1rem", margin: 0 }}>AI Output</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiGeneratedText);
                      alert("AI output copied!");
                    }}
                    style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                  >
                    Copy
                  </button>
                </div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.85rem",
                    color: "#333",
                    fontFamily: "monospace",
                    lineHeight: "1.4",
                    margin: 0,
                  }}
                >
                  {aiGeneratedText}
                </pre>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "oos_pro" ? (
        <div className="section">
          {/* Phase Toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              background: "#f0f7ff",
              padding: "10px 15px",
              borderRadius: "8px",
              border: "1px solid #cce3ff",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#0056b3" }}>
              OOS Professional Testing
            </h2>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <label style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                Active Investigation Phase:
              </label>
              <button
                className={`btn ${oosPhase === 1 ? "" : "btn-secondary"}`}
                onClick={() => setOosPhase(1)}
                style={{ minWidth: "80px", padding: "5px" }}
              >
                Phase 1
              </button>
              <button
                className={`btn ${oosPhase === 2 ? "" : "btn-secondary"}`}
                onClick={() => setOosPhase(2)}
                style={{ minWidth: "80px", padding: "5px" }}
              >
                Phase 2
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "25px",
            }}
          >
            {/* OOS Analyze */}
            <div className="card" style={{ padding: "15px" }}>
              <h3 style={{ fontSize: "1rem", marginTop: 0 }}>
                Step 1: Similarity Search ({oosPhase === 1 ? "Lab" : "Ext. Lab"}
                )
              </h3>
              <div className="form-group">
                <label>OOS Description</label>
                <textarea
                  style={{ height: "80px" }}
                  value={oosDescription}
                  onChange={(e) => setOosDescription(e.target.value)}
                  placeholder="e.g., Yield failure in HPLC assay..."
                />
              </div>
              <div className="form-group">
                <label>Root Causes (Optional)</label>
                <textarea
                  style={{ height: "60px" }}
                  value={oosRootCauses}
                  onChange={(e) => setOosRootCauses(e.target.value)}
                  placeholder="e.g., Column degradation..."
                />
              </div>

              <div
                style={{ display: "flex", gap: "10px", marginBottom: "15px" }}
              >
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.75rem" }}>Start Date</label>
                  <input
                    type="date"
                    value={oosStartDate}
                    onChange={(e) => setOosStartDate(e.target.value)}
                    style={{ padding: "8px", fontSize: "0.8rem" }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.75rem" }}>End Date</label>
                  <input
                    type="date"
                    value={oosEndDate}
                    onChange={(e) => setOosEndDate(e.target.value)}
                    style={{ padding: "8px", fontSize: "0.8rem" }}
                  />
                </div>
              </div>

              <button
                className="btn"
                onClick={handleOosAnalyze}
                disabled={oosLoading}
              >
                {oosLoading ? "Searching..." : "Phased Analyze"}
              </button>

              {oosResult && (
                <div style={{ marginTop: "15px" }}>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>
                    Similar OOS Cases Found:
                  </label>
                  {oosResult.similarDeviations?.map((d) => (
                    <div
                      key={d.id}
                      className="card"
                      style={{
                        padding: "8px",
                        background: "#fdfdfd",
                        fontSize: "0.8rem",
                        marginTop: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ fontWeight: "600" }}>
                          {d.deviationNo}
                        </span>
                        <span className="card-tag">{d.matchScore}%</span>
                      </div>
                      <p style={{ margin: "5px 0", fontSize: "0.75rem" }}>
                        {truncateText(d.description, 100)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OOS Manage & AI Refine */}
            <div>
              <div
                className="card"
                style={{ padding: "15px", marginBottom: "20px" }}
              >
                <h3 style={{ fontSize: "1rem", marginTop: 0 }}>
                  Step 2: Add Knowledge to Phase {oosPhase}
                </h3>
                <textarea
                  style={{
                    height: "120px",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                  }}
                  value={oosJsonInput}
                  onChange={(e) => setOosJsonInput(e.target.value)}
                  placeholder='[{"id": 500, "description": "..."}]'
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleOosAddKnowledge}
                  disabled={isOosAdding}
                  style={{ width: "100%", marginTop: "10px" }}
                >
                  {isOosAdding ? "Saving..." : `Index to P${oosPhase}`}
                </button>
                <button
                  className="btn"
                  onClick={() => handleOosClear(oosPhase)}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    background: "none",
                    color: "#ef4444",
                    border: "1px solid #ef4444",
                  }}
                >
                  Clear Phase {oosPhase} Index
                </button>
              </div>

              <div
                className="card"
                style={{
                  padding: "15px",
                  border: "1px solid #a78bfa",
                  background: "#f5f3ff",
                }}
              >
                <h3
                  style={{ fontSize: "1rem", marginTop: 0, color: "#7c3aed" }}
                >
                  Step 3: Laboratory AI Refine
                </h3>
                <div className="form-group">
                  <select
                    value={oosAiFieldType}
                    onChange={(e) => setOosAiFieldType(e.target.value)}
                    style={{ width: "100%", padding: "8px" }}
                  >
                    <option value="oosDescription">OOS Description</option>
                    <option value="investigationHypothesis">Hypothesis</option>
                    <option value="correctiveAction">Corrective Action</option>
                  </select>
                </div>
                <textarea
                  style={{ height: "80px" }}
                  value={oosAiUserInput}
                  onChange={(e) => setOosAiUserInput(e.target.value)}
                  placeholder="Keywords to refine..."
                />
                <button
                  className="btn"
                  onClick={handleOosEnhance}
                  disabled={oosAiLoading}
                  style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
                >
                  {oosAiLoading ? "Processing..." : "Expert Refine"}
                </button>
                {oosAiGeneratedText && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      background: "white",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      border: "1px solid #ddd",
                    }}
                  >
                    {oosAiGeneratedText}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="section">
          <p>Select a tab above to begin testing.</p>
        </div>
      )}
    </div>
  );
}

export default App;
