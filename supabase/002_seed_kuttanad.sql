-- 002_seed_kuttanad.sql
-- Karshakan Lens: Realistic Seed Data for Kuttanad (Pulincunnoo, Moncompu, Nedumudy, Champakulam, Kainakary, Ramankary, Kavalam)
-- Coordinate System: WGS84 (SRID 4326)

-- 1. Insert 8 Connected Canal Segments across Kuttanad
INSERT INTO canal_segments (id, name, geom, upstream_segment_id, downstream_segment_id)
VALUES
    -- Segment 1: Vembanad Lake - Kainakary North Ingress (Interface with Vembanad estuary)
    (
        '11111111-1111-1111-1111-111111111101',
        'Vembanad - Kainakary North Channel',
        ST_GeogFromText('SRID=4326;LINESTRING(76.3650 9.5100, 76.3800 9.4900, 76.3950 9.4750)'),
        NULL,
        '11111111-1111-1111-1111-111111111102'
    ),
    -- Segment 2: Kainakary - Pulincunnoo Main Canal (Pampa River Lower Reach)
    (
        '11111111-1111-1111-1111-111111111102',
        'Kainakary - Pulincunnoo Main Canal',
        ST_GeogFromText('SRID=4326;LINESTRING(76.3950 9.4750, 76.4250 9.4600, 76.4550 9.4450)'),
        '11111111-1111-1111-1111-111111111101',
        '11111111-1111-1111-1111-111111111103'
    ),
    -- Segment 3: Pulincunnoo - Moncompu Feeder Canal (Connecting polders to Rice Research Station Moncompu)
    (
        '11111111-1111-1111-1111-111111111103',
        'Pulincunnoo - Moncompu Feeder Canal',
        ST_GeogFromText('SRID=4326;LINESTRING(76.4550 9.4450, 76.4480 9.4350, 76.4380 9.4280)'),
        '11111111-1111-1111-1111-111111111102',
        '11111111-1111-1111-1111-111111111104'
    ),
    -- Segment 4: Moncompu - Champakulam Southern Channel
    (
        '11111111-1111-1111-1111-111111111104',
        'Moncompu - Champakulam Southern Channel',
        ST_GeogFromText('SRID=4326;LINESTRING(76.4380 9.4280, 76.4300 9.4220, 76.4250 9.4180)'),
        '11111111-1111-1111-1111-111111111103',
        '11111111-1111-1111-1111-111111111106'
    ),
    -- Segment 5: Nedumudy - Moncompu Link Canal (Cross-delta waterway)
    (
        '11111111-1111-1111-1111-111111111105',
        'Nedumudy - Moncompu Link Canal',
        ST_GeogFromText('SRID=4326;LINESTRING(76.4020 9.4350, 76.4200 9.4320, 76.4380 9.4280)'),
        '11111111-1111-1111-1111-111111111102',
        '11111111-1111-1111-1111-111111111104'
    ),
    -- Segment 6: Champakulam - Nedumudy Western Link
    (
        '11111111-1111-1111-1111-111111111106',
        'Champakulam - Nedumudy Western Link',
        ST_GeogFromText('SRID=4326;LINESTRING(76.4250 9.4180, 76.4120 9.4240, 76.4020 9.4350)'),
        '11111111-1111-1111-1111-111111111104',
        '11111111-1111-1111-1111-111111111105'
    ),
    -- Segment 7: Moncompu - Ramankary Eastern Branch Canal
    (
        '11111111-1111-1111-1111-111111111107',
        'Moncompu - Ramankary Eastern Branch',
        ST_GeogFromText('SRID=4326;LINESTRING(76.4380 9.4280, 76.4600 9.4200, 76.4850 9.4120)'),
        '11111111-1111-1111-1111-111111111103',
        NULL
    ),
    -- Segment 8: Kavalam - Pulincunnoo Northern Waterway
    (
        '11111111-1111-1111-1111-111111111108',
        'Kavalam - Pulincunnoo Northern Waterway',
        ST_GeogFromText('SRID=4326;LINESTRING(76.4750 9.4700, 76.4650 9.4580, 76.4550 9.4450)'),
        '11111111-1111-1111-1111-111111111102',
        '11111111-1111-1111-1111-111111111103'
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Profiles (Farmers and Agricultural Officers)
INSERT INTO profiles (id, name, phone, role, village_or_padasekharam, farm_type, land_location, nearest_canal_id, flow_direction)
VALUES
    (
        '22222222-2222-2222-2222-222222222201',
        'Thomas Kutty',
        '+919447101001',
        'farmer',
        'Pulincunnoo Padasekharam',
        'paddy',
        ST_GeogFromText('SRID=4326;POINT(76.4580 9.4460)'),
        '11111111-1111-1111-1111-111111111103',
        'inland'
    ),
    (
        '22222222-2222-2222-2222-222222222202',
        'Radhakrishnan M.',
        '+919447101002',
        'farmer',
        'Moncompu Thekkekkara',
        'both',
        ST_GeogFromText('SRID=4326;POINT(76.4390 9.4290)'),
        '11111111-1111-1111-1111-111111111103',
        'inland'
    ),
    (
        '22222222-2222-2222-2222-222222222203',
        'Joseph Varghese',
        '+919447101003',
        'farmer',
        'Nedumudy Vadakkumuri',
        'paddy',
        ST_GeogFromText('SRID=4326;POINT(76.4040 9.4360)'),
        '11111111-1111-1111-1111-111111111105',
        'inland'
    ),
    (
        '22222222-2222-2222-2222-222222222204',
        'Sreedhar P.',
        '+919447101004',
        'officer',
        'Krishi Bhavan Champakulam',
        'paddy',
        ST_GeogFromText('SRID=4326;POINT(76.4320 9.4300)'),
        '11111111-1111-1111-1111-111111111104',
        'unknown'
    ),
    (
        '22222222-2222-2222-2222-222222222205',
        'Biju K.',
        '+919447101005',
        'farmer',
        'Kainakary Padasekharam',
        'duck',
        ST_GeogFromText('SRID=4326;POINT(76.3920 9.4760)'),
        '11111111-1111-1111-1111-111111111101',
        'toward_sea'
    ),
    (
        '22222222-2222-2222-2222-222222222206',
        'Mathew Chacko',
        '+919447101006',
        'farmer',
        'Ramankary Padasekharam',
        'paddy',
        ST_GeogFromText('SRID=4326;POINT(76.4780 9.4220)'),
        '11111111-1111-1111-1111-111111111107',
        'inland'
    ),
    (
        '22222222-2222-2222-2222-222222222207',
        'Aniyankunju P.',
        '+919447101007',
        'farmer',
        'Kavalam Northern Polder',
        'paddy',
        ST_GeogFromText('SRID=4326;POINT(76.4680 9.4680)'),
        '11111111-1111-1111-1111-111111111108',
        'inland'
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Curated KAU Remedies Lookup
INSERT INTO remedies_kau (disease_code, disease_name_en, disease_name_ml, immediate_actions, spray_guidance, source_citation, last_checked)
VALUES
    (
        'brown_planthopper',
        'Brown Plant Hopper (BPH)',
        'തവിട്ടു ചാഴി',
        '["Drain standing water from the field completely for 3-4 days to break insect lifecycle.", "Avoid excess nitrogen fertilizer application which accelerates hopper reproduction.", "Create alleyways (inter-row pathways) every 2 meters for aeration and sunlight penetration.", "Conserve natural predators including mirid bugs and spiders by halting broad-spectrum sprays."]'::jsonb,
        'As per KAU Package of Practices: When population exceeds Economic Threshold Level (ETL of 10-15 hoppers/hill), apply Azadirachtin 0.03% (neem oil formulation) @ 5 ml/L, or contact your Krishi Bhavan for prescribed specific insecticides. Spray strictly targeting the base of plants.',
        'Kerala Agricultural University (KAU) Package of Practices Recommendations: Crops (16th Edition, 2024)',
        CURRENT_DATE
    ),
    (
        'sheath_blight',
        'Sheath Blight',
        'പോളരോഗം',
        '["Drain excess field water to reduce microclimate humidity around plant sheaths.", "Apply biological control agent Pseudomonas fluorescens @ 20g/L water as prophylactic spray.", "Maintain balanced potash fertilization (K2O) to strengthen plant cell walls."]'::jsonb,
        'Spray valid KAU bio-control formulation (Pseudomonas fluorescens 2%) targeting lower plant canopy at first appearance of circular snake-skin lesions.',
        'KAU Ad-hoc Package of Practices for Rice Pathology (2024)',
        CURRENT_DATE
    ),
    (
        'bacterial_leaf_blight',
        'Bacterial Leaf Blight (BLB)',
        'ബാക്ടീരിയൽ ഇലകരിച്ചിൽ',
        '["Drain field water immediately and withhold nitrogenous top-dressing during active lesion phase.", "Spray fresh cow dung slurry supernatant (20g/L) to establish competitive phyllosphere microbes.", "Avoid field-to-field irrigation across bunds."]'::jsonb,
        'Apply Bleaching powder @ 5 kg/ha in irrigation water or spray Copper Oxychloride @ 2.5g/L + Streptocycline (consult Krishi Bhavan for exact batch guidance).',
        'KAU Package of Practices for Rice Disease Management (2024)',
        CURRENT_DATE
    ),
    (
        'rice_blast',
        'Rice Blast',
        'കുലവാട്ടം / ഇലപ്പുള്ളി',
        '["Avoid excessive urea top dressing.", "Maintain uniform water depth (3-5 cm) to avoid moisture stress.", "Apply Pseudomonas fluorescens bio-fungicide @ 10g/L at tillering and panicle initiation."]'::jsonb,
        'KAU recommended bio-fungicide application at boot leaf stage. Consult Krishi Bhavan for severe neck blast control.',
        'KAU Agricultural Guide (2024)',
        CURRENT_DATE
    )
ON CONFLICT (disease_code) DO NOTHING;

-- 4. Insert 20 Realistic Seed Reports (Last 14 Days)
INSERT INTO reports (id, reporter_id, report_type, location, canal_segment_id, flow_direction, photo_url, notes_text, details, verification_status, confirmations_count, created_at)
VALUES
    (
        '33333333-3333-3333-3333-333333333301',
        '22222222-2222-2222-2222-222222222201',
        'crop_disease',
        ST_GeogFromText('SRID=4326;POINT(76.4580 9.4460)'),
        '11111111-1111-1111-1111-111111111103',
        'inland',
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
        'Brown plant hopper colony observed at base of paddy tillers. Yellowing noticed across 2.5 acres.',
        '{"disease_code": "brown_planthopper", "confidence": 0.94, "severity": "high", "affected_area_acres": 2.5, "crop_age_days": 65, "is_sample": true}'::jsonb,
        'community_confirmed',
        3,
        NOW() - INTERVAL '2 days'
    ),
    (
        '33333333-3333-3333-3333-333333333302',
        '22222222-2222-2222-2222-222222222202',
        'crop_disease',
        ST_GeogFromText('SRID=4326;POINT(76.4510 9.4420)'),
        '11111111-1111-1111-1111-111111111103',
        'inland',
        'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
        'Hopper burn spreading rapidly from adjacent plot. Lower leaves wilting, drainage completed.',
        '{"disease_code": "brown_planthopper", "confidence": 0.89, "severity": "medium", "affected_area_acres": 1.8, "crop_age_days": 68, "is_sample": true}'::jsonb,
        'community_confirmed',
        2,
        NOW() - INTERVAL '1 day 12 hours'
    ),
    (
        '33333333-3333-3333-3333-333333333303',
        '22222222-2222-2222-2222-222222222205',
        'salinity',
        ST_GeogFromText('SRID=4326;POINT(76.3810 9.4890)'),
        '11111111-1111-1111-1111-111111111101',
        'toward_sea',
        NULL,
        'High salinity ingress of 3.4 ppt detected at Vembanad outlet. Motor shutoff completed.',
        '{"salinity_ppt": 3.4, "tide_phase": "high_tide", "surface_scum_visible": true, "motor_shutoff_done": true, "is_sample": true}'::jsonb,
        'officially_verified',
        5,
        NOW() - INTERVAL '18 hours'
    ),
    (
        '33333333-3333-3333-3333-333333333304',
        '22222222-2222-2222-2222-222222222201',
        'salinity',
        ST_GeogFromText('SRID=4326;POINT(76.4250 9.4600)'),
        '11111111-1111-1111-1111-111111111102',
        'toward_sea',
        NULL,
        'Salinity reading 2.2 ppt in Kainakary main canal. Sluice gate closed to prevent ingress.',
        '{"salinity_ppt": 2.2, "tide_phase": "rising", "surface_scum_visible": false, "motor_shutoff_done": true, "is_sample": true}'::jsonb,
        'community_confirmed',
        2,
        NOW() - INTERVAL '8 hours'
    ),
    (
        '33333333-3333-3333-3333-333333333305',
        '22222222-2222-2222-2222-222222222202',
        'bird_deaths',
        ST_GeogFromText('SRID=4326;POINT(76.4385 9.4285)'),
        '11111111-1111-1111-1111-111111111103',
        'inland',
        NULL,
        'Sudden mortality in duck flock. Symptoms include loss of balance and head twitching. Vet notified.',
        '{"sick_count": 45, "dead_count": 28, "symptoms": ["sudden_death", "loss_of_balance", "cyanosis_of_head"], "flock_size": 1200, "veterinary_notified": true, "is_sample": true}'::jsonb,
        'unconfirmed',
        1,
        NOW() - INTERVAL '5 hours'
    ),
    (
        '33333333-3333-3333-3333-333333333306',
        '22222222-2222-2222-2222-222222222203',
        'bund_seepage',
        ST_GeogFromText('SRID=4326;POINT(76.4230 9.4200)'),
        '11111111-1111-1111-1111-111111111104',
        'inland',
        NULL,
        'Active piping and boiling detected on outer ring bund. Sandbag ring placement required immediately.',
        '{"seepage_type": "active_piping", "bund_length_meters": 12, "water_level_diff_feet": 3.8, "emergency_pumping_needed": true, "is_sample": true}'::jsonb,
        'unconfirmed',
        0,
        NOW() - INTERVAL '3 hours'
    )
ON CONFLICT (id) DO NOTHING;
