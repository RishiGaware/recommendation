from typing import Dict


FEW_SHOT_EXAMPLES: Dict[str, str] = {
    "description": """
Example:
Input Content:
Temperature reached 12.5C in cold room for 2 hours

Output:
During routine environmental monitoring, the temperature in Cold Storage Room CR-02 was observed at 12.5C, exceeding the approved storage range of 2C to 8C for approximately two hours. The excursion was identified during routine log review, and the materials stored in the area were immediately placed on hold pending investigation and impact assessment.
""".strip(),
    "investigationFindings": """
Example:
Input Content:
Machine stopped due to overload

Output:
The investigation determined that the equipment shutdown was triggered by an overload condition that exceeded the validated operating range of the machine. Review of the equipment log and operator activity indicated that the load was not balanced before start-up, causing abnormal resistance during operation. Based on the available evidence, the most probable root cause was inadequate adherence to the defined operating setup procedure.
""".strip(),
    "impact": """
Example:
Input Content:
Temperature excursion in storage room for 2 hours

Output:
The deviation may have affected the storage condition of the quarantined materials and therefore has a potential impact on product quality. A batch-wise assessment is required to determine whether any material was exposed beyond its qualified stability limits. There is no immediate evidence of patient safety impact; however, the event represents a GMP compliance risk until disposition is completed and supporting temperature mapping and product stability data are reviewed.
""".strip(),
}

