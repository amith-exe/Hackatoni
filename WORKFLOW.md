# Karshakan Lens Operating Workflow

## The core loop

```mermaid
flowchart TD
  Observe[Farmer observes symptom, water, bund, bird, or crop loss] --> Capture[GPS / map pin / photo / notes]
  Capture --> Classify{Incident type}
  Classify --> Disease[Gemini Vision + disease code]
  Classify --> Salinity[Salinity reading + canal snap]
  Classify --> Other[Bird, bund, or crop-loss safety rules]
  Disease --> Confidence{Confidence >= 0.70?}
  Confidence -->|no| Uncertain[Not sure — ask your Krishi Bhavan]
  Confidence -->|yes| KAU[Lookup exact KAU remedy]
  Disease --> Cluster[7-day disease DBSCAN]
  Salinity --> Rain[Open-Meteo rainfall dilution]
  Rain --> Graph[Traverse connected canal graph]
  Other --> Guidance[Deterministic checklist]
  KAU --> Public[Anonymized public report]
  Cluster --> Public
  Graph --> Public
  Guidance --> Public
  Public --> Verify[Peer confirmations]
  Verify --> Officer[Officer verification/rejection]
  Officer --> Alert[Map, alerts, and targeted action]
```

## Crop outbreak workflow

1. A farmer opens `/scan`, uploads a leaf photo, or chooses the bundled demo image.
2. The frontend sends the image and optional coordinates to `POST /api/vision/diagnose`.
3. Gemini returns structured `disease_code`, `confidence`, `visual_observations`, and `image_quality_note`.
4. If confidence is below 0.70 or the result is `unknown`, the response contains no chemical advice.
5. If confident, the backend uses the code as a key into the KAU registry for immediate cultural actions, spray guidance, and source citation.
6. The farmer can submit the result to `POST /api/reports` with disease code, confidence, visual notes, and GPS coordinates.
7. The Live Map includes the new anonymized pin and recalculates active disease clusters.

## Why DBSCAN matters

DBSCAN is the most important outbreak step because a disease name alone does not tell a farmer whether the problem is isolated or spreading. The engine:

- converts latitude/longitude to radians for the Haversine metric;
- searches a configurable neighborhood, normally 2.0 km for the map view;
- uses `min_samples=3` in interactive trend analysis so three nearby reports are needed to form a cluster;
- leaves isolated observations as noise rather than escalating them as a regional outbreak;
- compares a current window with the prior window to label growth as `Growing Spike`, `Active Cluster`, `Watch`, or `Isolated Noise`;
- returns cluster centers that the map renders as circles and that a farmer or officer can scan with a 3 km analysis ring.

## Multi-location trend workflow

```mermaid
sequenceDiagram
  participant A as Farmer or Officer
  participant M as Leaflet map
  participant T as /api/trends/analyze
  participant D as Repository
  A->>M: Click map, choose preset, or use GPS
  A->>T: lat, lng, radius_km=3, eps_km=2, days=7
  T->>D: Select reports inside radius and prior window
  T->>T: Group by disease/threat
  T->>T: Haversine DBSCAN, min_samples=3
  T->>D: Snap selected point to nearest canal
  T-->>A: clusters, clustered count, noise count, growth, salinity, actions
  M-->>A: 3 km ring and highlighted cluster centers
```

## Salinity workflow

1. A farmer submits a salinity reading with coordinates or a canal segment.
2. The backend snaps the location to the nearest canal when needed.
3. `fetch_kuttanad_rainfall()` obtains or falls back to a rainfall summary.
4. `analyze_salinity_propagation()` follows upstream connected segments.
5. Each segment receives Watch, Warning, or Danger based on salinity and dilution.
6. The map highlights canal lines; this path intentionally does not use a circular outbreak radius.

## Trust workflow

```text
unconfirmed
   | one unique neighbor
unconfirmed
   | second unique neighbor
community_confirmed
   | Krishi Bhavan officer
+----------------------+
|                      |
officially_verified   rejected
```

Self-confirmation is blocked, duplicate confirmation is rejected with a conflict, and only an officer profile can perform official verification in the demo state machine.

## Demo checklist

1. Start backend and frontend.
2. Open `/scan` and choose **Demo Data Folder: Rice Leaf Photo**.
3. Run the Gemini diagnosis and review the KAU plan.
4. Report the issue to the Live Map.
5. Open `/`, click **Show All Data**, then open **Filters & Find Trend**.
6. Scan Pulincunnoo, Alappuzha, Kumarakom, Thrissur Kole, and Palakkad with the 3 km trend tool.
7. Compare clusters versus isolated noise and current versus prior counts.
8. Use Verify Queue to demonstrate peer confirmation and officer verification.
