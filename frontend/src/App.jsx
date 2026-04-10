import {
  analyzeDeviation,
  addCustomDeviation,
  clearKnowledge,
  getCustomDeviations,
  getQdrantStatus,
  extractText,
  refineWithAI,
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

  // Report Extraction State
  const [reportInput, setReportInput] = useState(
    `\n\n\n\n\n\n\n\n<!--[if gte mso 9]><xml>\n <o:OfficeDocumentSettings>\n  <o:AllowPNG/>\n </o:OfficeDocumentSettings>\n</xml><![endif]-->\n\n\n<!--[if gte mso 9]><xml>\n <w:WordDocument>\n  <w:View>Normal</w:View>\n  <w:Zoom>0</w:Zoom>\n  <w:TrackMoves>false</w:TrackMoves>\n  <w:TrackFormatting/>\n  <w:PunctuationKerning/>\n  <w:ValidateAgainstSchemas/>\n  <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>\n  <w:IgnoreMixedContent>false</w:IgnoreMixedContent>\n  <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>\n  <w:DoNotPromoteQF/>\n  <w:LidThemeOther>EN-US</w:LidThemeOther>\n  <w:LidThemeAsian>JA</w:LidThemeAsian>\n  <w:LidThemeComplexScript>X-NONE</w:LidThemeComplexScript>\n  <w:Compatibility>\n   <w:BreakWrappedTables/>\n   <w:SnapToGridInCell/>\n   <w:WrapTextWithPunct/>\n   <w:UseAsianBreakRules/>\n   <w:DontGrowAutofit/>\n   <w:SplitPgBreakAndParaMark/>\n   <w:EnableOpenTypeKerning/>\n   <w:DontFlipMirrorIndents/>\n   <w:OverrideTableStyleHps/>\n   <w:UseFELayout/>\n  </w:Compatibility>\n  <w:DoNotOptimizeForBrowser/>\n  <m:mathPr>\n   <m:mathFont m:val=\"Cambria Math\"/>\n   <m:brkBin m:val=\"before\"/>\n   <m:brkBinSub m:val=\"&#45;-\"/>\n   <m:smallFrac m:val=\"off\"/>\n   <m:dispDef/>\n   <m:lMargin m:val=\"0\"/>\n   <m:rMargin m:val=\"0\"/>\n   <m:defJc m:val=\"centerGroup\"/>\n   <m:wrapIndent m:val=\"1440\"/>\n   <m:intLim m:val=\"subSup\"/>\n   <m:naryLim m:val=\"undOvr\"/>\n  </m:mathPr></w:WordDocument>\n</xml><![endif]--><!--[if gte mso 9]><xml>\n <w:LatentStyles DefLockedState=\"false\" DefUnhideWhenUsed=\"false\"\n  DefSemiHidden=\"false\" DefQFormat=\"false\" DefPriority=\"99\"\n  LatentStyleCount=\"376\">\n  <w:LsdException Locked=\"false\" Priority=\"0\" QFormat=\"true\" Name=\"Normal\"/>\n  <w:LsdException Locked=\"false\" Priority=\"9\" QFormat=\"true\" Name=\"heading 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"9\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" QFormat=\"true\" Name=\"heading 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"9\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" QFormat=\"true\" Name=\"heading 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"9\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" QFormat=\"true\" Name=\"heading 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"9\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" QFormat=\"true\" Name=\"heading 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"9\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" QFormat=\"true\" Name=\"heading 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"9\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" QFormat=\"true\" Name=\"heading 7\"/>\n  <w:LsdException Locked=\"false\" Priority=\"9\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" QFormat=\"true\" Name=\"heading 8\"/>\n  <w:LsdException Locked=\"false\" Priority=\"9\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" QFormat=\"true\" Name=\"heading 9\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"index 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"index 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"index 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"index 4\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"index 5\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"index 6\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"index 7\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"index 8\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"index 9\"/>\n  <w:LsdException Locked=\"false\" Priority=\"39\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" Name=\"toc 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"39\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" Name=\"toc 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"39\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" Name=\"toc 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"39\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" Name=\"toc 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"39\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" Name=\"toc 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"39\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" Name=\"toc 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"39\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" Name=\"toc 7\"/>\n  <w:LsdException Locked=\"false\" Priority=\"39\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" Name=\"toc 8\"/>\n  <w:LsdException Locked=\"false\" Priority=\"39\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" Name=\"toc 9\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Normal Indent\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"footnote text\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"annotation text\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"header\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"footer\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"index heading\"/>\n  <w:LsdException Locked=\"false\" Priority=\"35\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" QFormat=\"true\" Name=\"caption\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"table of figures\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"envelope address\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"envelope return\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"footnote reference\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"annotation reference\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"line number\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"page number\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"endnote reference\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"endnote text\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"table of authorities\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"macro\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"toa heading\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Bullet\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Number\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List 4\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List 5\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Bullet 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Bullet 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Bullet 4\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Bullet 5\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Number 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Number 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Number 4\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Number 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"10\" QFormat=\"true\" Name=\"Title\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Closing\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Signature\"/>\n  <w:LsdException Locked=\"false\" Priority=\"1\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" Name=\"Default Paragraph Font\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Body Text\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Body Text Indent\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Continue\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Continue 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Continue 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Continue 4\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"List Continue 5\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Message Header\"/>\n  <w:LsdException Locked=\"false\" Priority=\"11\" QFormat=\"true\" Name=\"Subtitle\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Salutation\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Date\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Body Text First Indent\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Body Text First Indent 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Note Heading\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Body Text 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Body Text 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Body Text Indent 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Body Text Indent 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Block Text\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Hyperlink\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"FollowedHyperlink\"/>\n  <w:LsdException Locked=\"false\" Priority=\"22\" QFormat=\"true\" Name=\"Strong\"/>\n  <w:LsdException Locked=\"false\" Priority=\"20\" QFormat=\"true\" Name=\"Emphasis\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Document Map\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Plain Text\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"E-mail Signature\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Top of Form\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Bottom of Form\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Normal (Web)\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Acronym\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Address\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Cite\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Code\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Definition\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Keyboard\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Preformatted\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Sample\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Typewriter\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"HTML Variable\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Normal Table\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"annotation subject\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"No List\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Outline List 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Outline List 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Outline List 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Simple 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Simple 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Simple 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Classic 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Classic 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Classic 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Classic 4\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Colorful 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Colorful 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Colorful 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Columns 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Columns 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Columns 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Columns 4\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Columns 5\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Grid 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Grid 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Grid 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Grid 4\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Grid 5\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Grid 6\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Grid 7\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Grid 8\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table List 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table List 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table List 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table List 4\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table List 5\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table List 6\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table List 7\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table List 8\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table 3D effects 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table 3D effects 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table 3D effects 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Contemporary\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Elegant\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Professional\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Subtle 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Subtle 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Web 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Web 2\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Web 3\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Balloon Text\"/>\n  <w:LsdException Locked=\"false\" Priority=\"59\" Name=\"Table Grid\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Table Theme\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" Name=\"Placeholder Text\"/>\n  <w:LsdException Locked=\"false\" Priority=\"1\" QFormat=\"true\" Name=\"No Spacing\"/>\n  <w:LsdException Locked=\"false\" Priority=\"60\" Name=\"Light Shading\"/>\n  <w:LsdException Locked=\"false\" Priority=\"61\" Name=\"Light List\"/>\n  <w:LsdException Locked=\"false\" Priority=\"62\" Name=\"Light Grid\"/>\n  <w:LsdException Locked=\"false\" Priority=\"63\" Name=\"Medium Shading 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"64\" Name=\"Medium Shading 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"65\" Name=\"Medium List 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"66\" Name=\"Medium List 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"67\" Name=\"Medium Grid 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"68\" Name=\"Medium Grid 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"69\" Name=\"Medium Grid 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"70\" Name=\"Dark List\"/>\n  <w:LsdException Locked=\"false\" Priority=\"71\" Name=\"Colorful Shading\"/>\n  <w:LsdException Locked=\"false\" Priority=\"72\" Name=\"Colorful List\"/>\n  <w:LsdException Locked=\"false\" Priority=\"73\" Name=\"Colorful Grid\"/>\n  <w:LsdException Locked=\"false\" Priority=\"60\" Name=\"Light Shading Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"61\" Name=\"Light List Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"62\" Name=\"Light Grid Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"63\" Name=\"Medium Shading 1 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"64\" Name=\"Medium Shading 2 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"65\" Name=\"Medium List 1 Accent 1\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" Name=\"Revision\"/>\n  <w:LsdException Locked=\"false\" Priority=\"34\" QFormat=\"true\"\n   Name=\"List Paragraph\"/>\n  <w:LsdException Locked=\"false\" Priority=\"29\" QFormat=\"true\" Name=\"Quote\"/>\n  <w:LsdException Locked=\"false\" Priority=\"30\" QFormat=\"true\"\n   Name=\"Intense Quote\"/>\n  <w:LsdException Locked=\"false\" Priority=\"66\" Name=\"Medium List 2 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"67\" Name=\"Medium Grid 1 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"68\" Name=\"Medium Grid 2 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"69\" Name=\"Medium Grid 3 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"70\" Name=\"Dark List Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"71\" Name=\"Colorful Shading Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"72\" Name=\"Colorful List Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"73\" Name=\"Colorful Grid Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"60\" Name=\"Light Shading Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"61\" Name=\"Light List Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"62\" Name=\"Light Grid Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"63\" Name=\"Medium Shading 1 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"64\" Name=\"Medium Shading 2 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"65\" Name=\"Medium List 1 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"66\" Name=\"Medium List 2 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"67\" Name=\"Medium Grid 1 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"68\" Name=\"Medium Grid 2 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"69\" Name=\"Medium Grid 3 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"70\" Name=\"Dark List Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"71\" Name=\"Colorful Shading Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"72\" Name=\"Colorful List Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"73\" Name=\"Colorful Grid Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"60\" Name=\"Light Shading Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"61\" Name=\"Light List Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"62\" Name=\"Light Grid Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"63\" Name=\"Medium Shading 1 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"64\" Name=\"Medium Shading 2 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"65\" Name=\"Medium List 1 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"66\" Name=\"Medium List 2 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"67\" Name=\"Medium Grid 1 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"68\" Name=\"Medium Grid 2 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"69\" Name=\"Medium Grid 3 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"70\" Name=\"Dark List Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"71\" Name=\"Colorful Shading Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"72\" Name=\"Colorful List Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"73\" Name=\"Colorful Grid Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"60\" Name=\"Light Shading Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"61\" Name=\"Light List Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"62\" Name=\"Light Grid Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"63\" Name=\"Medium Shading 1 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"64\" Name=\"Medium Shading 2 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"65\" Name=\"Medium List 1 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"66\" Name=\"Medium List 2 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"67\" Name=\"Medium Grid 1 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"68\" Name=\"Medium Grid 2 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"69\" Name=\"Medium Grid 3 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"70\" Name=\"Dark List Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"71\" Name=\"Colorful Shading Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"72\" Name=\"Colorful List Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"73\" Name=\"Colorful Grid Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"60\" Name=\"Light Shading Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"61\" Name=\"Light List Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"62\" Name=\"Light Grid Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"63\" Name=\"Medium Shading 1 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"64\" Name=\"Medium Shading 2 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"65\" Name=\"Medium List 1 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"66\" Name=\"Medium List 2 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"67\" Name=\"Medium Grid 1 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"68\" Name=\"Medium Grid 2 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"69\" Name=\"Medium Grid 3 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"70\" Name=\"Dark List Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"71\" Name=\"Colorful Shading Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"72\" Name=\"Colorful List Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"73\" Name=\"Colorful Grid Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"60\" Name=\"Light Shading Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"61\" Name=\"Light List Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"62\" Name=\"Light Grid Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"63\" Name=\"Medium Shading 1 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"64\" Name=\"Medium Shading 2 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"65\" Name=\"Medium List 1 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"66\" Name=\"Medium List 2 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"67\" Name=\"Medium Grid 1 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"68\" Name=\"Medium Grid 2 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"69\" Name=\"Medium Grid 3 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"70\" Name=\"Dark List Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"71\" Name=\"Colorful Shading Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"72\" Name=\"Colorful List Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"73\" Name=\"Colorful Grid Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"19\" QFormat=\"true\"\n   Name=\"Subtle Emphasis\"/>\n  <w:LsdException Locked=\"false\" Priority=\"21\" QFormat=\"true\"\n   Name=\"Intense Emphasis\"/>\n  <w:LsdException Locked=\"false\" Priority=\"31\" QFormat=\"true\"\n   Name=\"Subtle Reference\"/>\n  <w:LsdException Locked=\"false\" Priority=\"32\" QFormat=\"true\"\n   Name=\"Intense Reference\"/>\n  <w:LsdException Locked=\"false\" Priority=\"33\" QFormat=\"true\" Name=\"Book Title\"/>\n  <w:LsdException Locked=\"false\" Priority=\"37\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" Name=\"Bibliography\"/>\n  <w:LsdException Locked=\"false\" Priority=\"39\" SemiHidden=\"true\"\n   UnhideWhenUsed=\"true\" QFormat=\"true\" Name=\"TOC Heading\"/>\n  <w:LsdException Locked=\"false\" Priority=\"41\" Name=\"Plain Table 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"42\" Name=\"Plain Table 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"43\" Name=\"Plain Table 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"44\" Name=\"Plain Table 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"45\" Name=\"Plain Table 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"40\" Name=\"Grid Table Light\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\" Name=\"Grid Table 1 Light\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"Grid Table 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"Grid Table 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"Grid Table 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"Grid Table 5 Dark\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\" Name=\"Grid Table 6 Colorful\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\" Name=\"Grid Table 7 Colorful\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"Grid Table 1 Light Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"Grid Table 2 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"Grid Table 3 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"Grid Table 4 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"Grid Table 5 Dark Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"Grid Table 6 Colorful Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"Grid Table 7 Colorful Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"Grid Table 1 Light Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"Grid Table 2 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"Grid Table 3 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"Grid Table 4 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"Grid Table 5 Dark Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"Grid Table 6 Colorful Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"Grid Table 7 Colorful Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"Grid Table 1 Light Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"Grid Table 2 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"Grid Table 3 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"Grid Table 4 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"Grid Table 5 Dark Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"Grid Table 6 Colorful Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"Grid Table 7 Colorful Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"Grid Table 1 Light Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"Grid Table 2 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"Grid Table 3 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"Grid Table 4 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"Grid Table 5 Dark Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"Grid Table 6 Colorful Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"Grid Table 7 Colorful Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"Grid Table 1 Light Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"Grid Table 2 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"Grid Table 3 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"Grid Table 4 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"Grid Table 5 Dark Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"Grid Table 6 Colorful Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"Grid Table 7 Colorful Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"Grid Table 1 Light Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"Grid Table 2 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"Grid Table 3 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"Grid Table 4 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"Grid Table 5 Dark Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"Grid Table 6 Colorful Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"Grid Table 7 Colorful Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\" Name=\"List Table 1 Light\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"List Table 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"List Table 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"List Table 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"List Table 5 Dark\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\" Name=\"List Table 6 Colorful\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\" Name=\"List Table 7 Colorful\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"List Table 1 Light Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"List Table 2 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"List Table 3 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"List Table 4 Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"List Table 5 Dark Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"List Table 6 Colorful Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"List Table 7 Colorful Accent 1\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"List Table 1 Light Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"List Table 2 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"List Table 3 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"List Table 4 Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"List Table 5 Dark Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"List Table 6 Colorful Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"List Table 7 Colorful Accent 2\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"List Table 1 Light Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"List Table 2 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"List Table 3 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"List Table 4 Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"List Table 5 Dark Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"List Table 6 Colorful Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"List Table 7 Colorful Accent 3\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"List Table 1 Light Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"List Table 2 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"List Table 3 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"List Table 4 Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"List Table 5 Dark Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"List Table 6 Colorful Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"List Table 7 Colorful Accent 4\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"List Table 1 Light Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"List Table 2 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"List Table 3 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"List Table 4 Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"List Table 5 Dark Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"List Table 6 Colorful Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"List Table 7 Colorful Accent 5\"/>\n  <w:LsdException Locked=\"false\" Priority=\"46\"\n   Name=\"List Table 1 Light Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"47\" Name=\"List Table 2 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"48\" Name=\"List Table 3 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"49\" Name=\"List Table 4 Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"50\" Name=\"List Table 5 Dark Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"51\"\n   Name=\"List Table 6 Colorful Accent 6\"/>\n  <w:LsdException Locked=\"false\" Priority=\"52\"\n   Name=\"List Table 7 Colorful Accent 6\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Mention\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Smart Hyperlink\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Hashtag\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Unresolved Mention\"/>\n  <w:LsdException Locked=\"false\" SemiHidden=\"true\" UnhideWhenUsed=\"true\"\n   Name=\"Smart Link\"/>\n </w:LatentStyles>\n</xml><![endif]-->\n\n<!--[if gte mso 10]>\n<style>\n /* Style Definitions */\n table.MsoNormalTable\n\t{mso-style-name:\"Table Normal\";\n\tmso-tstyle-rowband-size:0;\n\tmso-tstyle-colband-size:0;\n\tmso-style-noshow:yes;\n\tmso-style-priority:99;\n\tmso-style-parent:\"\";\n\tmso-padding-alt:0cm 5.4pt 0cm 5.4pt;\n\tmso-para-margin-top:0cm;\n\tmso-para-margin-right:0cm;\n\tmso-para-margin-bottom:10.0pt;\n\tmso-para-margin-left:0cm;\n\tline-height:115%;\n\tmso-pagination:widow-orphan;\n\tfont-size:11.0pt;\n\tfont-family:\"Cambria\",serif;\n\tmso-ascii-font-family:Cambria;\n\tmso-ascii-theme-font:minor-latin;\n\tmso-hansi-font-family:Cambria;\n\tmso-hansi-theme-font:minor-latin;\n\tmso-ansi-language:EN-US;\n\tmso-fareast-language:EN-US;}\ntable.MsoTableGrid\n\t{mso-style-name:\"Table Grid\";\n\tmso-tstyle-rowband-size:0;\n\tmso-tstyle-colband-size:0;\n\tmso-style-priority:59;\n\tmso-style-unhide:no;\n\tborder:solid windowtext 1.0pt;\n\tmso-border-alt:solid windowtext .5pt;\n\tmso-padding-alt:0cm 5.4pt 0cm 5.4pt;\n\tmso-border-insideh:.5pt solid windowtext;\n\tmso-border-insidev:.5pt solid windowtext;\n\tmso-para-margin:0cm;\n\tmso-pagination:widow-orphan;\n\tfont-size:11.0pt;\n\tfont-family:\"Cambria\",serif;\n\tmso-ascii-font-family:Cambria;\n\tmso-ascii-theme-font:minor-latin;\n\tmso-hansi-font-family:Cambria;\n\tmso-hansi-theme-font:minor-latin;\n\tmso-ansi-language:EN-US;\n\tmso-fareast-language:EN-US;}\n</style>\n<![endif]-->\n\n\n\n<!--StartFragment-->\n\n<div style=\"border-top: none; border-right: none; border-left: none; border-image: initial; border-bottom-width: 1pt; border-bottom-color: rgb(79, 129, 189); padding: 0cm 0cm 4pt;\">\n\n<p class=\"MsoTitle\"><span lang=\"EN-US\">Deviation Report - Temperature Excursion<o:p></o:p></span></p>\n\n</div>\n\n<h1><span lang=\"EN-US\">Deviation Description<o:p></o:p></span></h1>\n\n<p class=\"MsoNormal\"><span lang=\"EN-US\">During routine monitoring on 08-Apr-2026,\nthe temperature of Cold Storage Room CR-02 was observed at 12.5°C, exceeding\nthe specified limit of 2–8°C for a duration of approximately 2 hours. The\ndeviation was identified during hourly manual log recording. All materials\nstored in the affected area were immediately placed under quarantine pending\ninvestigation.<o:p></o:p></span></p>\n\n<table class=\"MsoTableGrid\" border=\"1\" cellspacing=\"0\" cellpadding=\"0\" style=\"border: none;\">\n <tbody><tr style=\"mso-yfti-irow:0;mso-yfti-firstrow:yes;mso-yfti-lastrow:yes;\n  height:42.25pt\">\n  <td width=\"577\" valign=\"top\" style=\"width: 432.5pt; border-width: 1pt; border-color: windowtext; border-image: initial; padding: 0cm 5.4pt; height: 42.25pt;\">\n  <h1 style=\"line-height:normal\"><span lang=\"EN-US\">Deviation Details<o:p></o:p></span></h1>\n  </td>\n </tr>\n</tbody></table>\n\n<table class=\"MsoNormalTable\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">\n <tbody><tr>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-width: 1pt; border-color: windowtext; border-image: initial; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Field<o:p></o:p></span></p>\n  </td>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-top-width: 1pt; border-right-width: 1pt; border-bottom-width: 1pt; border-top-color: windowtext; border-right-color: windowtext; border-bottom-color: windowtext; border-image: initial; border-left: none; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Value<o:p></o:p></span></p>\n  </td>\n </tr>\n <tr>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-right-width: 1pt; border-bottom-width: 1pt; border-left-width: 1pt; border-right-color: windowtext; border-bottom-color: windowtext; border-left-color: windowtext; border-image: initial; border-top: none; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Deviation ID<o:p></o:p></span></p>\n  </td>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-top: none; border-left: none; border-bottom-width: 1pt; border-bottom-color: windowtext; border-right-width: 1pt; border-right-color: windowtext; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">DEV-001<o:p></o:p></span></p>\n  </td>\n </tr>\n <tr>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-right-width: 1pt; border-bottom-width: 1pt; border-left-width: 1pt; border-right-color: windowtext; border-bottom-color: windowtext; border-left-color: windowtext; border-image: initial; border-top: none; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Date of Occurrence<o:p></o:p></span></p>\n  </td>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-top: none; border-left: none; border-bottom-width: 1pt; border-bottom-color: windowtext; border-right-width: 1pt; border-right-color: windowtext; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">08-Apr-2026<o:p></o:p></span></p>\n  </td>\n </tr>\n <tr>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-right-width: 1pt; border-bottom-width: 1pt; border-left-width: 1pt; border-right-color: windowtext; border-bottom-color: windowtext; border-left-color: windowtext; border-image: initial; border-top: none; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Department<o:p></o:p></span></p>\n  </td>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-top: none; border-left: none; border-bottom-width: 1pt; border-bottom-color: windowtext; border-right-width: 1pt; border-right-color: windowtext; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Warehouse<o:p></o:p></span></p>\n  </td>\n </tr>\n <tr>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-right-width: 1pt; border-bottom-width: 1pt; border-left-width: 1pt; border-right-color: windowtext; border-bottom-color: windowtext; border-left-color: windowtext; border-image: initial; border-top: none; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Location<o:p></o:p></span></p>\n  </td>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-top: none; border-left: none; border-bottom-width: 1pt; border-bottom-color: windowtext; border-right-width: 1pt; border-right-color: windowtext; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Cold Storage Room CR-02<o:p></o:p></span></p>\n  </td>\n </tr>\n <tr>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-right-width: 1pt; border-bottom-width: 1pt; border-left-width: 1pt; border-right-color: windowtext; border-bottom-color: windowtext; border-left-color: windowtext; border-image: initial; border-top: none; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Parameter Affected<o:p></o:p></span></p>\n  </td>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-top: none; border-left: none; border-bottom-width: 1pt; border-bottom-color: windowtext; border-right-width: 1pt; border-right-color: windowtext; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Temperature<o:p></o:p></span></p>\n  </td>\n </tr>\n <tr>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-right-width: 1pt; border-bottom-width: 1pt; border-left-width: 1pt; border-right-color: windowtext; border-bottom-color: windowtext; border-left-color: windowtext; border-image: initial; border-top: none; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Observed Value<o:p></o:p></span></p>\n  </td>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-top: none; border-left: none; border-bottom-width: 1pt; border-bottom-color: windowtext; border-right-width: 1pt; border-right-color: windowtext; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">12.5°C<o:p></o:p></span></p>\n  </td>\n </tr>\n <tr>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-right-width: 1pt; border-bottom-width: 1pt; border-left-width: 1pt; border-right-color: windowtext; border-bottom-color: windowtext; border-left-color: windowtext; border-image: initial; border-top: none; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Permitted Range<o:p></o:p></span></p>\n  </td>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-top: none; border-left: none; border-bottom-width: 1pt; border-bottom-color: windowtext; border-right-width: 1pt; border-right-color: windowtext; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">2–8°C<o:p></o:p></span></p>\n  </td>\n </tr>\n <tr>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-right-width: 1pt; border-bottom-width: 1pt; border-left-width: 1pt; border-right-color: windowtext; border-bottom-color: windowtext; border-left-color: windowtext; border-image: initial; border-top: none; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Duration<o:p></o:p></span></p>\n  </td>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-top: none; border-left: none; border-bottom-width: 1pt; border-bottom-color: windowtext; border-right-width: 1pt; border-right-color: windowtext; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">2 Hours<o:p></o:p></span></p>\n  </td>\n </tr>\n <tr>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-right-width: 1pt; border-bottom-width: 1pt; border-left-width: 1pt; border-right-color: windowtext; border-bottom-color: windowtext; border-left-color: windowtext; border-image: initial; border-top: none; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Detected By<o:p></o:p></span></p>\n  </td>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-top: none; border-left: none; border-bottom-width: 1pt; border-bottom-color: windowtext; border-right-width: 1pt; border-right-color: windowtext; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Warehouse Operator<o:p></o:p></span></p>\n  </td>\n </tr>\n <tr>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-right-width: 1pt; border-bottom-width: 1pt; border-left-width: 1pt; border-right-color: windowtext; border-bottom-color: windowtext; border-left-color: windowtext; border-image: initial; border-top: none; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Immediate Action<o:p></o:p></span></p>\n  </td>\n  <td width=\"288\" valign=\"top\" style=\"width: 216pt; border-top: none; border-left: none; border-bottom-width: 1pt; border-bottom-color: windowtext; border-right-width: 1pt; border-right-color: windowtext; padding: 0cm 5.4pt;\">\n  <p class=\"MsoNormal\"><span lang=\"EN-US\">Materials quarantined<o:p></o:p></span></p>\n  </td>\n </tr>\n</tbody></table>\n\n<p class=\"MsoNormal\"><span lang=\"EN-US\"><o:p>&nbsp;</o:p></span></p>\n\n<!--EndFragment-->\n\n\n\n`,
  );
  const [extractedData, setExtractedData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Enhance With AI (DVMS) Test State
  const [aiFieldType, setAiFieldType] = useState("description");
  const [aiUserPrompt, setAiUserPrompt] = useState("Expand details");
  const [aiUserInput, setAiUserInput] = useState("");
  const [aiGeneratedText, setAiGeneratedText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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
        userInput: aiUserInput,
        userPrompt: aiUserPrompt,
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
        <div
          className={`nav-item ${activeTab === "report" ? "active" : ""}`}
          onClick={() => setActiveTab("report")}
        >
          HTML to Text Extract
        </div>
        <div
          className={`nav-item ${activeTab === "enhance_ai" ? "active" : ""}`}
          onClick={() => setActiveTab("enhance_ai")}
        >
          Enhance With AI
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
      ) : activeTab === "manage" ? (
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
      ) : (
        <div className="section">
          <div className="card-header" style={{ marginBottom: "10px" }}>
            <h2 style={{ fontSize: "1rem" }}>Enhance With AI (DVMS) - Test</h2>
            <span style={{ fontSize: "0.7rem", color: "#888" }}>
              Calls /ml-service/enhance_with_ai/dvms/ai/refine
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
      )}
    </div>
  );
}

export default App;
