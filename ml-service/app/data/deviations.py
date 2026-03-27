deviations = [
  {
    "id": 11,
    "deviation_no": "DEV-PH-2025-011",
    "deviation_type": "Unplanned",
    "severity": "Major",
    "deviation_classification": "Major",
    "correction_action": "Production halted; HVAC maintenance team notified immediately to restore differential pressure.",
    "start_date": "2025-11-02",
    "target_date": "2025-12-02",
    "identification_date": "2025-11-02",
    "plant_id": 1,
    "department_id": 105,
    "init_user_id": 9,
    "equipment_ids": "EQ-HVAC-04",
    "line_ids": "CR-04",
    "description": "Differential pressure drop in Cleanroom ISO Class 7 (CR-04) below the validated limit of 15 Pa. Pressure dropped to 8 Pa for 25 minutes during active aseptic filling of Batch #INJ-2025-040.",
    "reference_doc": "SOP-ENG-022",
    "status": "Closed",
    "remarks": "HVAC blower belt slipped, causing transient loss of air volume.",
    "investigation_approach": [
      {
        "methodology": "BMS Trend Review, Maintenance Log Check",
        "status": "Completed",
        "findings": "Building Management System (BMS) logs confirmed the 25-minute drop. Investigation revealed the blower belt had not been tensioned properly during the last PM (Preventive Maintenance)."
      }
    ],
    "investigation_report": [
      {
        "finding": "Improper preventive maintenance execution",
        "root_cause_type": "Maintenance",
        "categorization": "Facility/Utilities",
        "impact": "Batch #INJ-2025-040 subjected to additional sterility and environmental monitoring tests. Released after passing.",
        "final_classification": "Major",
        "status": "Approved"
      }
    ]
  },
  {
    "id": 12,
    "deviation_no": "DEV-PH-2025-012",
    "deviation_type": "Unplanned",
    "severity": "Minor",
    "deviation_classification": "Minor",
    "correction_action": "Missing signature obtained immediately; operator retrained on GDP.",
    "start_date": "2025-11-05",
    "target_date": "2025-12-05",
    "identification_date": "2025-11-06",
    "plant_id": 2,
    "department_id": 102,
    "init_user_id": 14,
    "equipment_ids": "None",
    "line_ids": "L-02",
    "description": "During QA review of the Batch Manufacturing Record (BMR) for Batch #TBL-2025-450, a missing operator signature was identified at the blending step.",
    "reference_doc": "SOP-QA-001",
    "status": "Closed",
    "remarks": "Good Documentation Practice (GDP) error - omission of signature.",
    "investigation_approach": [
      {
        "methodology": "Document Review, Personnel Interview",
        "status": "Completed",
        "findings": "Operator performed the task but forgot to sign off before moving to the next processing room. Supervisor verification signature was present."
      }
    ],
    "investigation_report": [
      {
        "finding": "Human error - omission",
        "root_cause_type": "Human Error",
        "categorization": "Documentation",
        "impact": "No impact on product quality. BMR corrected per GDP SOP.",
        "final_classification": "Minor",
        "status": "Approved"
      }
    ]
  },
  {
    "id": 13,
    "deviation_no": "DEV-PH-2025-013",
    "deviation_type": "Unplanned",
    "severity": "Critical",
    "deviation_classification": "Critical",
    "correction_action": "Dispensing stopped. Incorrect material segregated to QA hold area.",
    "start_date": "2025-11-08",
    "target_date": "2025-12-08",
    "identification_date": "2025-11-08",
    "plant_id": 1,
    "department_id": 111,
    "init_user_id": 22,
    "equipment_ids": "EQ-DISP-02",
    "line_ids": "WH-02",
    "description": "Incorrect Active Pharmaceutical Ingredient (API) dispensed for Batch #CAP-2025-112. Operator dispensed 'API-X' instead of 'API-Y' due to highly similar container labeling and adjacent storage.",
    "reference_doc": "SOP-WH-015",
    "status": "Under Investigation",
    "remarks": "Look-alike/sound-alike material mix-up during dispensing.",
    "investigation_approach": [
      {
        "methodology": "5 Whys, ERP System Audit",
        "status": "In Progress",
        "findings": "Barcode scanner was bypassed by the operator because the label barcode was smudged. The operator manually typed the lot number and picked the adjacent drum."
      }
    ],
    "investigation_report": [
      {
        "finding": "Barcode bypass and identical packaging",
        "root_cause_type": "Operational/Procedural",
        "categorization": "Materials Management",
        "impact": "Batch compounding prevented. Potential major mix-up averted.",
        "final_classification": "Critical",
        "status": "Draft"
      }
    ]
  },
  {
    "id": 14,
    "deviation_no": "DEV-PH-2025-014",
    "deviation_type": "Unplanned",
    "severity": "Major",
    "deviation_classification": "Major",
    "correction_action": "Meter removed from service; backup calibrated meter provided to the lab.",
    "start_date": "2025-11-10",
    "target_date": "2025-12-10",
    "identification_date": "2025-11-10",
    "plant_id": 3,
    "department_id": 106,
    "init_user_id": 31,
    "equipment_ids": "EQ-PHM-12",
    "line_ids": "Lab-03",
    "description": "Routine daily calibration verification of pH meter EQ-PHM-12 failed using pH 4.01 buffer. Meter reading was 4.15 (Limit: ± 0.05).",
    "reference_doc": "SOP-QC-025",
    "status": "Initiated",
    "remarks": "Electrode degradation causing drift in readings.",
    "investigation_approach": [
      {
        "methodology": "Impact Assessment, Retrospective Review",
        "status": "Initiated",
        "findings": "Reviewing all tests performed since the last successful calibration to determine if any batch release data is impacted."
      }
    ],
    "investigation_report": [
      {
        "finding": "Aging pH electrode",
        "root_cause_type": "Equipment",
        "categorization": "Laboratory",
        "impact": "Pending retrospective review of 12 tested samples.",
        "final_classification": "Major",
        "status": "Review Pending"
      }
    ]
  },
  {
    "id": 15,
    "deviation_no": "DEV-PH-2025-015",
    "deviation_type": "Planned",
    "severity": "Minor",
    "deviation_classification": "Minor",
    "correction_action": "N/A - Planned temporary change implemented via approved change control.",
    "start_date": "2025-11-12",
    "target_date": "2025-11-14",
    "identification_date": "2025-11-01",
    "plant_id": 1,
    "department_id": 102,
    "init_user_id": 8,
    "equipment_ids": "EQ-BLND-03",
    "line_ids": "L-03",
    "description": "Planned deviation to use Blender EQ-BLND-03 instead of the primary Blender EQ-BLND-01 for Batch #TBL-2025-455 due to scheduled preventive maintenance on the primary unit.",
    "reference_doc": "SOP-MFG-005",
    "status": "Closed",
    "remarks": "Temporary equipment substitution; both blenders are qualified for this product.",
    "investigation_approach": [
      {
        "methodology": "Equivalency Assessment",
        "status": "Completed",
        "findings": "Both blenders have identical capacity, RPM ranges, and design principles (V-blenders). Validation data confirms equivalency."
      }
    ],
    "investigation_report": [
      {
        "finding": "Planned operational change",
        "root_cause_type": "Planned Maintenance",
        "categorization": "Manufacturing",
        "impact": "None. Product quality maintained.",
        "final_classification": "Minor",
        "status": "Approved"
      }
    ]
  },
  {
    "id": 16,
    "deviation_no": "DEV-PH-2025-016",
    "deviation_type": "Unplanned",
    "severity": "Critical",
    "deviation_classification": "Critical",
    "correction_action": "Line stopped. Affected cartons quarantined. QA notified.",
    "start_date": "2025-11-15",
    "target_date": "2025-12-15",
    "identification_date": "2025-11-15",
    "plant_id": 1,
    "department_id": 107,
    "init_user_id": 27,
    "equipment_ids": "EQ-PRN-02",
    "line_ids": "PKG-02",
    "description": "Incorrect expiry date overprinted on cartons for Batch #OINT-2025-05. Printed expiry was '10/2026' instead of the approved '10/2027'.",
    "reference_doc": "SOP-PKG-020",
    "status": "Under Investigation",
    "remarks": "Manual data entry error during printer setup.",
    "investigation_approach": [
      {
        "methodology": "Printer Log Review, Line Clearance Check",
        "status": "In Progress",
        "findings": "Operator entered the wrong year into the continuous inkjet printer. The second-person verification failed to catch the typo."
      }
    ],
    "investigation_report": [
      {
        "finding": "Failure in dual verification process",
        "root_cause_type": "Human Error",
        "categorization": "Packaging",
        "impact": "300 cartons printed incorrectly. Cartons to be destroyed and re-packed.",
        "final_classification": "Critical",
        "status": "Draft"
      }
    ]
  },
  {
    "id": 17,
    "deviation_no": "DEV-PH-2025-017",
    "deviation_type": "Unplanned",
    "severity": "Major",
    "deviation_classification": "Major",
    "correction_action": "Loop sanitization initiated. Use of water point restricted.",
    "start_date": "2025-11-18",
    "target_date": "2025-12-18",
    "identification_date": "2025-11-21",
    "plant_id": 2,
    "department_id": 109,
    "init_user_id": 19,
    "equipment_ids": "EQ-PW-01",
    "line_ids": "PW-Loop-A",
    "description": "Microbial count for Purified Water at user point POU-05 was 150 cfu/mL, exceeding the action limit of 100 cfu/mL.",
    "reference_doc": "SOP-UTL-012",
    "status": "Open",
    "remarks": "Potential biofilm buildup in the user point valve.",
    "investigation_approach": [
      {
        "methodology": "Trend Analysis, Speciation, Valve Inspection",
        "status": "In Progress",
        "findings": "Speciation identified Pseudomonas aeruginosa. Inspection of the diaphragm valve at POU-05 revealed a cracked diaphragm harboring bacteria."
      }
    ],
    "investigation_report": [
      {
        "finding": "Cracked diaphragm in user point valve",
        "root_cause_type": "Equipment",
        "categorization": "Utilities",
        "impact": "Investigation of all batches manufactured using water from POU-05 in the last 7 days required.",
        "final_classification": "Major",
        "status": "Draft"
      }
    ]
  },
  {
    "id": 18,
    "deviation_no": "DEV-PH-2025-018",
    "deviation_type": "Unplanned",
    "severity": "Minor",
    "deviation_classification": "Minor",
    "correction_action": "Temperature reset to correct parameter; product remained within acceptable formulation timeframes.",
    "start_date": "2025-11-20",
    "target_date": "2025-12-20",
    "identification_date": "2025-11-20",
    "plant_id": 1,
    "department_id": 104,
    "init_user_id": 11,
    "equipment_ids": "EQ-VES-10",
    "line_ids": "L-06",
    "description": "Jacket temperature of formulation vessel EQ-VES-10 overshot the set point by 3°C for 10 minutes during the melting phase of Batch #CRM-2025-88.",
    "reference_doc": "SOP-MFG-033",
    "status": "Closed",
    "remarks": "PID controller tuning issue causing delayed steam valve closure.",
    "investigation_approach": [
      {
        "methodology": "SCADA Data Review, Product Impact Assessment",
        "status": "Completed",
        "findings": "Transient spike did not exceed the degradation temperature of the active ingredients. PID loop was recalibrated."
      }
    ],
    "investigation_report": [
      {
        "finding": "PID controller sluggish response",
        "root_cause_type": "Equipment/Automation",
        "categorization": "Manufacturing",
        "impact": "No impact on product quality or stability.",
        "final_classification": "Minor",
        "status": "Approved"
      }
    ]
  },
  {
    "id": 19,
    "deviation_no": "DEV-PH-2025-019",
    "deviation_type": "Unplanned",
    "severity": "Critical",
    "deviation_classification": "Critical",
    "correction_action": "Out of Spec (OOS) procedure initiated. QA notified.",
    "start_date": "2025-11-25",
    "target_date": "2025-12-25",
    "identification_date": "2025-11-25",
    "plant_id": 3,
    "department_id": 106,
    "init_user_id": 4,
    "equipment_ids": "EQ-DISS-01",
    "line_ids": "Lab-02",
    "description": "Dissolution test failure at 3-month accelerated stability time point for Batch #TBL-2025-101. Only 70% released at 45 minutes (Limit: NLT 80%).",
    "reference_doc": "SOP-QC-088",
    "status": "Initiated",
    "remarks": "Potential formulation issue or changes in API crystal structure over time.",
    "investigation_approach": [
      {
        "methodology": "Phase I & II OOS Investigation, Formulation Review",
        "status": "Initiated",
        "findings": "Lab error ruled out in Phase I. Phase II manufacturing investigation initiated to review granulating fluid amounts and drying times."
      }
    ],
    "investigation_report": [
      {
        "finding": "Pending Manufacturing Investigation",
        "root_cause_type": "To Be Determined",
        "categorization": "Quality Control/Stability",
        "impact": "Batch currently in market; risk assessment for potential recall initiated.",
        "final_classification": "Critical",
        "status": "Review Pending"
      }
    ]
  },
  {
    "id": 20,
    "deviation_no": "DEV-PH-2025-020",
    "deviation_type": "Unplanned",
    "severity": "Major",
    "deviation_classification": "Major",
    "correction_action": "Line paused; blister rolls adjusted and heat-sealing parameters verified.",
    "start_date": "2025-11-28",
    "target_date": "2025-12-28",
    "identification_date": "2025-11-28",
    "plant_id": 1,
    "department_id": 107,
    "init_user_id": 35,
    "equipment_ids": "EQ-BLST-04",
    "line_ids": "PKG-04",
    "description": "Leak test failure for blister strips of Batch #CAP-2025-200. Dye ingress observed in 4 out of 10 sampled blister pockets during in-process checks.",
    "reference_doc": "SOP-PKG-009",
    "status": "Under Investigation",
    "remarks": "Inadequate sealing due to uneven temperature distribution on the sealing roller.",
    "investigation_approach": [
      {
        "methodology": "Thermal Imaging, Equipment Setup Verification",
        "status": "In Progress",
        "findings": "Thermal mapping of the sealing roller showed a cold spot on the left edge. Heater cartridge #3 was found to be drawing less current than specified."
      }
    ],
    "investigation_report": [
      {
        "finding": "Defective heater cartridge in sealing roller",
        "root_cause_type": "Equipment",
        "categorization": "Packaging",
        "impact": "Sub-lot isolated. 100% manual inspection or rejection of affected sub-lot required.",
        "final_classification": "Major",
        "status": "Draft"
      }
    ]
  }
]