deviations = [
  {
    "id": 1,
    "deviation_no": "DEV-PH-2025-001",
    "deviation_type": "Unplanned",
    "severity": "Critical",
    "deviation_classification": "Critical",
    "correction_action": "Immediate cooling restored via backup power; generator repair initiated.",
    "start_date": "2025-10-01",
    "target_date": "2025-11-01",
    "identification_date": "2025-10-01",
    "plant_id": 1,
    "department_id": 101,
    "init_user_id": 5,
    "equipment_ids": "EQ-WH-01",
    "line_ids": "CR-01",
    "description": "Temperature excursion in Cold Room CR-01 (Required: 2-8°C). Sensors recorded 12°C for 5 hours due to a power outage and backup generator failure. Affected batches: TBL-001, INJ-002.",
    "reference_doc": "SOP-WH-005",
    "status": "Closed",
    "remarks": "Backup generator solenoid failure due to missed maintenance",
    "investigation_approach": [
      {
        "methodology": "5 Whys, Fishbone Diagram, Risk Assessment",
        "status": "Completed",
        "findings": "Root cause was a mechanical failure in the generator's starter solenoid. Risk assessment confirms no impact on Batch TBL-001 but INJ-002 requires re-testing."
      }
    ],
    "investigation_report": [
      {
        "finding": "Solenoid failure",
        "root_cause_type": "Equipment",
        "categorization": "Infrastructure",
        "impact": "Batch INJ-002 quarantined",
        "final_classification": "Critical",
        "status": "Approved"
      }
    ]
  },
  {
    "id": 2,
    "deviation_no": "DEV-PH-2025-002",
    "deviation_type": "Unplanned",
    "severity": "Major",
    "start_date": "2025-10-05",
    "target_date": "2025-11-05",
    "identification_date": "2025-10-05",
    "plant_id": 1,
    "department_id": 102,
    "init_user_id": 12,
    "equipment_ids": "EQ-COMP-02",
    "line_ids": "L-02",
    "description": "Weight variation detected during tablet compression of Batch #TBL-2025-442. Several tablets were found outside the USP ±5% weight range during in-process checks.",
    "reference_doc": "SOP-MFG-078",
    "status": "Under Investigation",
    "remarks": "Inconsistent punch pressure due to worn lower cam track",
    "investigation_approach": [
      {
        "methodology": "Physical Inspection, Equipment History Review",
        "status": "In Progress",
        "findings": "Lower cam track shows significant wear. Statistical analysis of the weight data shows a trend correlating with specific punch stations."
      }
    ],
    "investigation_report": [
      {
        "finding": "Worn cam track",
        "root_cause_type": "Mechanical Wear",
        "categorization": "Equipment",
        "impact": "Sub-lot segregated for 100% check",
        "final_classification": "Major",
        "status": "Draft"
      }
    ]
  },
  {
    "id": 3,
    "deviation_no": "DEV-PH-2025-003",
    "deviation_type": "Unplanned",
    "severity": "Critical",
    "start_date": "2025-10-10",
    "target_date": "2025-12-10",
    "identification_date": "2025-10-10",
    "plant_id": 2,
    "department_id": 103,
    "init_user_id": 8,
    "equipment_ids": "EQ-AUTO-01",
    "line_ids": "STR-01",
    "description": "Sterility test failure for injectable Batch #INJ-2025-015. Gram stain of the contaminant revealed Staphylococcus aureus.",
    "reference_doc": "SOP-QC-012",
    "status": "Initiated",
    "remarks": "Potential breach in aseptic technique or gowning protocol",
    "investigation_approach": [
      {
        "methodology": "Gowning Qualification Review, Media Fill Review",
        "status": "In Progress",
        "findings": "Review of CCTV footage showed an operator touching the filling needle with gloved hands after adjusting a part."
      }
    ],
    "investigation_report": [
      {
        "finding": "Human error - aseptic technique breach",
        "root_cause_type": "Human Error",
        "categorization": "Personnel",
        "impact": "Batch Batch #INJ-2025-015 rejected",
        "final_classification": "Critical",
        "status": "Review Pending"
      }
    ]
  },
  {
    "id": 4,
    "deviation_no": "DEV-PH-2025-004",
    "deviation_type": "Unplanned",
    "severity": "Major",
    "start_date": "2025-10-12",
    "target_date": "2025-11-12",
    "identification_date": "2025-10-12",
    "plant_id": 1,
    "department_id": 104,
    "init_user_id": 20,
    "equipment_ids": "EQ-FILT-01",
    "line_ids": "L-04",
    "description": "Significant yield loss (15%) observed during the sterile filtration of Batch #SOL-2025-99. Theoretical yield was 200kg, actual yield 170kg.",
    "reference_doc": "SOP-MFG-090",
    "status": "Approved",
    "remarks": "Filter integrity failure causing product bypass and waste",
    "investigation_approach": [
      {
        "methodology": "Yield Reconciliation, Bubble Point Testing",
        "status": "Completed",
        "findings": "Filter failed post-filtration bubble point test. Investigation found excessive pressure applied during the start-up phase."
      }
    ],
    "investigation_report": [
      {
        "finding": "Filter membrane rupture",
        "root_cause_type": "Operational",
        "categorization": "Manufacturing",
        "impact": "Product filtered through redundant filter; no quality impact but high financial loss.",
        "final_classification": "Major",
        "status": "Approved"
      }
    ]
  },
  {
    "id": 5,
    "deviation_no": "DEV-PH-2025-005",
    "deviation_type": "Unplanned",
    "severity": "Minor",
    "start_date": "2025-10-15",
    "target_date": "2025-11-15",
    "identification_date": "2025-10-15",
    "plant_id": 1,
    "department_id": 105,
    "init_user_id": 15,
    "equipment_ids": "None",
    "line_ids": "RM-202",
    "description": "Environmental monitoring action limit exceeded for non-viable particles in filling room RM-202 during static monitoring.",
    "reference_doc": "SOP-QC-045",
    "status": "Closed",
    "remarks": "Inadequate cleaning of the HEPA plenum area",
    "investigation_approach": [
      {
        "methodology": "History Review, Cleaning Log Review",
        "status": "Completed",
        "findings": "Routine cleaning frequency for the upper plenum was found to be insufficient given the area's age."
      }
    ],
    "investigation_report": [
      {
        "finding": "Dust accumulation in plenum",
        "root_cause_type": "Maintenance/Cleaning",
        "categorization": "Facility",
        "impact": "No immediate product impact as filling was not occurring.",
        "final_classification": "Minor",
        "status": "Approved"
      }
    ]
  },
  {
    "id": 6,
    "deviation_no": "DEV-PH-2025-006",
    "deviation_type": "Unplanned",
    "severity": "Major",
    "start_date": "2025-10-18",
    "target_date": "2025-11-18",
    "identification_date": "2025-10-18",
    "plant_id": 2,
    "department_id": 106,
    "init_user_id": 3,
    "equipment_ids": "EQ-HPLC-05",
    "line_ids": "Lab-01",
    "description": "Out-of-Specification (OOS) result for Assay in Batch #CRM-2025-01 (Result: 90.5%, Spec: 95.0-105.0%).",
    "reference_doc": "SOP-QC-002",
    "status": "Under Investigation",
    "remarks": "Standard preparation error - volumetric flask not properly rinsed",
    "investigation_approach": [
      {
        "methodology": "OOS Investigation Phase 1 (Laboratory Investigation)",
        "status": "In Progress",
        "findings": "Re-injection of the same sample preparation confirmed the low result. However, re-preparation of the standard showed a significant difference."
      }
    ],
    "investigation_report": [
      {
        "finding": "Analyst error during standard dilution",
        "root_cause_type": "Laboratory Error",
        "categorization": "Quality Control",
        "impact": "Batch testing delayed; potential re-analysis required.",
        "final_classification": "Major",
        "status": "Draft"
      }
    ]
  },
  {
    "id": 7,
    "deviation_no": "DEV-PH-2025-007",
    "deviation_type": "Unplanned",
    "severity": "Critical",
    "start_date": "2025-10-20",
    "target_date": "2025-11-20",
    "identification_date": "2025-10-20",
    "plant_id": 1,
    "department_id": 107,
    "init_user_id": 25,
    "equipment_ids": "EQ-PRN-01",
    "line_ids": "PKG-01",
    "description": "Mismatch found between bulk product name and secondary packaging label for Batch #TBL-2025-77. Label showed 'Medicine A' but product was 'Medicine B'.",
    "reference_doc": "SOP-PKG-011",
    "status": "Initiated",
    "remarks": "Obsolete version of label file selected from digital library",
    "investigation_approach": [
      {
        "methodology": "Label Reconciliation, IT System Audit",
        "status": "Initiated",
        "findings": "The label management system allowed selection of an inactive artwork file due to a permission override."
      }
    ],
    "investigation_report": [
      {
        "finding": "System configuration error",
        "root_cause_type": "Infrastructure/IT",
        "categorization": "Labeling",
        "impact": "Potential major recall risk if distributed. Batch stopped at warehouse.",
        "final_classification": "Critical",
        "status": "Review Pending"
      }
    ]
  },
  {
    "id": 8,
    "deviation_no": "DEV-PH-2025-008",
    "deviation_type": "Unplanned",
    "severity": "Major",
    "start_date": "2025-10-22",
    "target_date": "2025-11-22",
    "identification_date": "2025-10-23",
    "plant_id": 1,
    "department_id": 108,
    "init_user_id": 30,
    "equipment_ids": "EQ-MIX-01",
    "line_ids": "L-08",
    "description": "Cleaning validation swab test failed for TOC (Total Organic Carbon) after cleaning of the Mixing Vessel (EQ-MIX-01). Result: 15ppm, Limit: 10ppm.",
    "reference_doc": "SOP-VLD-005",
    "status": "Open",
    "remarks": "Drying cycle too short, leaving residue/stagnant water",
    "investigation_approach": [
      {
        "methodology": "Cycle Parameter Review, Visual Inspection",
        "status": "In Progress",
        "findings": "Vessel was visually clean but TOC failure suggests chemical residue or inadequate rinsing."
      }
    ],
    "investigation_report": [
      {
        "finding": "Insufficient rinsing phase",
        "root_cause_type": "Process Design",
        "categorization": "Validation",
        "impact": "Equipment cannot be released for next product.",
        "final_classification": "Major",
        "status": "Draft"
      }
    ]
  },
  {
    "id": 9,
    "deviation_no": "DEV-PH-2025-009",
    "deviation_type": "Unplanned",
    "severity": "Minor",
    "start_date": "2025-10-25",
    "target_date": "2025-11-25",
    "identification_date": "2025-10-25",
    "plant_id": 3,
    "department_id": 109,
    "init_user_id": 18,
    "equipment_ids": "EQ-WFI-01",
    "line_ids": "None",
    "description": "Conductivity of Water For Injection (WFI) loop exceeded the alert limit (1.3 µS/cm) reaching 1.5 µS/cm.",
    "reference_doc": "SOP-UTL-005",
    "status": "Approved",
    "remarks": "Ion exchange resin bed exhaustion",
    "investigation_approach": [
      {
        "methodology": "Logbook Review, Trend Analysis",
        "status": "Completed",
        "findings": "Resin bed replacement was scheduled for next week but the high load from the previous summer caused premature exhaustion."
      }
    ],
    "investigation_report": [
      {
        "finding": "Resin exhaustion",
        "root_cause_type": "Maintenance",
        "categorization": "Utilities",
        "impact": "No impact on product as it happened during a non-production hour.",
        "final_classification": "Minor",
        "status": "Approved"
      }
    ]
  },
  {
    "id": 10,
    "deviation_no": "DEV-PH-2025-010",
    "deviation_type": "Unplanned",
    "severity": "Major",
    "start_date": "2025-10-28",
    "target_date": "2025-11-28",
    "identification_date": "2025-10-28",
    "plant_id": 1,
    "department_id": 110,
    "init_user_id": 4,
    "equipment_ids": "EQ-GRN-01",
    "line_ids": "L-10",
    "description": "Tablet hardness failure in Batch #TBL-2025-500. Hardness was below lower limit (80N), causing capping during subsequent coating.",
    "reference_doc": "SOP-PH-010",
    "status": "Under Investigation",
    "remarks": "Excessive moisture in granules due to incomplete drying",
    "investigation_approach": [
      {
        "methodology": "Loss on Drying (LOD) check, Tray dryer history",
        "status": "In Progress",
        "findings": "LOD of granules was 4.5% (Target: 1.5-2.5%). Dryer heater #2 was found to be malfunctioning."
      }
    ],
    "investigation_report": [
      {
        "finding": "Heater malfunction in dryer",
        "root_cause_type": "Equipment failure",
        "categorization": "Manufacturing",
        "impact": "Batch may require reprocessing or rejection.",
        "final_classification": "Major",
        "status": "Draft"
      }
    ]
  }
]
