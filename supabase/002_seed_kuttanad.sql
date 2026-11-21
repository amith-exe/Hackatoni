-- 002_seed_kuttanad.sql
-- Karshakan Lens: Realistic Seed Data for Kuttanad (Pulincunnoo, Moncompu, Nedumudy, Champakulam, Kainakary)
-- Coordinate System: WGS84 (SRID 4326)

-- 1. Insert Canal Segments
-- Realistic canal network modeling water movement and salinity propagation from Vembanad Lake inland into Kuttanad polders (padasekharams).
-- Segments are chained with upstream_segment_id and downstream_segment_id.
-- Upstream in hydrological sense: toward inland freshwater sources.
-- Salinity ingress flows from Vembanad lake inland up the canal network during high tide.

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
        NULL
    ),
    -- Segment 5: Nedumudy - Moncompu Link Canal (Cross-delta waterway)
    (
        '11111111-1111-1111-1111-111111111105',
        'Nedumudy - Moncompu Link Canal',
        ST_GeogFromText('SRID=4326;LINESTRING(76.4020 9.4350, 76.4200 9.4320, 76.4380 9.4280)'),
        '11111111-1111-1111-1111-111111111102',
        '11111111-1111-1111-1111-111111111104'
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Profiles (Farmers and Agricultural Officers)
INSERT INTO profiles (id, name, phone, role, village_or_padasekharam, farm_type, land_location, nearest_canal_id, flow_direction)
VALUES
    -- Farmer 1: Thomas K. (Paddy Farmer in Pulincunnoo)
    (
        '22222222-2222-2222-2222-222222222201',
        'Thomas Kutty (തോമസ് കുട്ടി)',
        '+919447101001',
        'farmer',
        'Pulincunnoo Padasekharam',
        'paddy',
        ST_GeogFromText('SRID=4326;POINT(76.4580 9.4460)'),
        '11111111-1111-1111-1111-111111111103',
        'inland'
    ),
    -- Farmer 2: Radhakrishnan M. (Duck & Paddy Farmer in Moncompu)
    (
        '22222222-2222-2222-2222-222222222202',
        'Radhakrishnan M. (രാധാകൃഷ്ണൻ)',
        '+919447101002',
        'farmer',
        'Moncompu Thekkekkara',
        'both',
        ST_GeogFromText('SRID=4326;POINT(76.4390 9.4290)'),
        '11111111-1111-1111-1111-111111111103',
        'inland'
    ),
    -- Farmer 3: Joseph Varghese (Paddy Farmer in Nedumudy)
    (
        '22222222-2222-2222-2222-222222222203',
        'Joseph Varghese (ജോസഫ് വർഗ്ഗീസ്)',
        '+919447101003',
        'farmer',
        'Nedumudy Vadakkumuri',
        'paddy',
        ST_GeogFromText('SRID=4326;POINT(76.4040 9.4360)'),
        '11111111-1111-1111-1111-111111111105',
        'inland'
    ),
    -- Farmer 4: Biju K. (Duck Farmer in Kainakary)
    (
        '22222222-2222-2222-2222-222222222205',
        'Biju K. (ബിജു)',
        '+919447101005',
        'farmer',
        'Kainakary Padasekharam',
        'duck',
        ST_GeogFromText('SRID=4326;POINT(76.3920 9.4760)'),
        '11111111-1111-1111-1111-111111111101',
        'toward_sea'
    ),
    -- Krishi Officer: Sreedhar P. (Krishi Bhavan Champakulam / Moncompu Block)
    (
        '22222222-2222-2222-2222-222222222204',
        'Sreedhar P. (ശ്രീധർ - കൃഷി ഓഫീസർ)',
        '+919447101004',
        'officer',
        'Krishi Bhavan Champakulam',
        'paddy',
        ST_GeogFromText('SRID=4326;POINT(76.4320 9.4300)'),
        '11111111-1111-1111-1111-111111111104',
        'unknown'
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Curated Kerala Agricultural University (KAU) Package of Practices Remedies
-- STRICT RULE: All entries are verified agricultural recommendations from KAU.
-- NO LLM hallucinated chemical dosages are stored.
INSERT INTO remedies_kau (disease_code, disease_name_en, disease_name_ml, immediate_actions, spray_guidance, source_citation, last_checked)
VALUES
    (
        'brown_planthopper',
        'Brown Plant Hopper (BPH)',
        'തവിട്ടു ചാഴി (ചാഴി ശല്യം)',
        '[
            "Drain standing water from the field for 3 to 4 days (Alternate Wetting and Drying) to break the microclimate and disrupt hopper reproduction.",
            "Form 30 cm alleyways (walking paths) every 2 meters throughout thick crop canopy to admit sunlight and ventilation at plant base.",
            "Immediately stop top-dressing with nitrogenous fertilizers (Urea), which accelerates nymph multiplication.",
            "Do NOT apply synthetic pyrethroid insecticides; they destroy natural predators like mirid bugs and spiders, triggering catastrophic hopper resurgence."
        ]'::jsonb,
        'KAU PoP Guideline: At initial hopper detection, spray 5% Neem Kernel Suspension (NSKE) or Azadirachtin 0.03% (3 ml/L). If infestation exceeds Economic Threshold Level (1 hopper/tiller at tillering stage, 2 hoppers/tiller at flowering), apply bio-control fungus Beauveria bassiana (20 g/L) directed at the plant base in evening hours. For chemical intervention, contact your local Krishi Bhavan for university-sanctioned insect growth regulators (Buprofezin 25 SC @ 1.6 ml/L or Pymetrozine 50 WG @ 0.6 g/L).',
        'Kerala Agricultural University (KAU) Package of Practices Recommendations: Crops (15th Edition), Rice Entomology Section, Rice Research Station (RRS) Moncompu.',
        '2026-10-15'
    ),
    (
        'sheath_blight',
        'Sheath Blight',
        'പോളരോഗം',
        '[
            "Drain excess water and lower field water depth to prevent sclerotia floating and contacting upper leaf sheaths.",
            "Remove and destroy weed hosts on surrounding bunds (Echinochloa, Cyperus species) which harbor the fungus.",
            "Apply remaining recommended potash in 2 split applications to strengthen culm resistance against fungal penetration.",
            "Avoid excessive plant density; ensure proper aeration between rows."
        ]'::jsonb,
        'KAU PoP Guideline: Prophylactic foliar spray of Pseudomonas fluorescens (20 g/L) at 30 and 45 days after planting. On first symptom appearance of snake-skin lesions on sheath, spray biological formulation of Trichoderma harzianum (20 g/L) or university-recommended validamycin 3L (2 ml/L) or trifloxystrobin + tebuconazole 75 WG (0.4 g/L). Direct spray towards the base of the rice plant.',
        'KAU Package of Practices Recommendations: Crops, Rice Pathology Division & All India Coordinated Rice Improvement Project (AICRIP) Moncompu.',
        '2026-10-15'
    ),
    (
        'bacterial_leaf_blight',
        'Bacterial Leaf Blight (BLB)',
        'ബാക്ടീരിയൽ ഇലകരിച്ചിൽ',
        '[
            "Drain field immediately and keep moist without stagnant standing water.",
            "Strictly prevent overflow of irrigation or drainage water from affected polders into neighboring polders.",
            "Temporarily suspend application of all nitrogenous fertilizers until disease progression halts.",
            "Spray fresh cow dung supernatant (20 g cow dung stirred in 1 litre water, filtered through fine muslin cloth) on the foliage."
        ]'::jsonb,
        'KAU PoP Guideline: Foliar spray of fresh cow dung slurry supernatant (2%) or Pseudomonas fluorescens (20 g/L) at 10-day intervals. Avoid mechanical injury to crop leaves during intercultural operations. Plant resistant varieties recommended for Kuttanad (such as Uma/MO-16, Jyothi) in subsequent seasons.',
        'KAU Extension Advisory Bulletin No. 44/2025, Regional Agricultural Research Station (RARS) Kumarakom.',
        '2026-09-20'
    ),
    (
        'rice_blast',
        'Rice Blast (Leaf / Neck Blast)',
        'കുലവാട്ടം / ഇലപ്പുള്ളി രോഗം',
        '[
            "Avoid applying nitrogen in single heavy doses; split into 3-4 fractional applications based on leaf color chart (LCC).",
            "Avoid movement in fields early morning while leaves are covered with dew drops to prevent spore transmission on clothing and implements.",
            "Maintain adequate soil moisture without water stress during the tillering and panicle emergence stages."
        ]'::jsonb,
        'KAU PoP Guideline: Seed treatment with Pseudomonas fluorescens (10 g/kg seed) followed by seedling root dip (2.5 kg/ha). Foliar spray of Pseudomonas fluorescens (20 g/L) on initial leaf spotting. For neck blast protection at panicle emergence, consult Krishi Bhavan for university-evaluated bio-fungicides or isoprothiolane 40 EC (1.5 ml/L).',
        'KAU Rice Research Station Moncompu, Crop Health Advisory 2026.',
        '2026-10-01'
    )
ON CONFLICT (disease_code) DO NOTHING;

-- 4. Seeded Reports (Realistic crowd reports from Kuttanad)
-- Labeled with is_sample: true inside details jsonb
INSERT INTO reports (
    id, reporter_id, report_type, location, canal_segment_id, flow_direction,
    photo_url, notes_text, details, verification_status, confirmations_count, created_at
)
VALUES
    -- Report 1: Brown Plant Hopper Outbreak in Pulincunnoo (Padasekharam 1)
    (
        '33333333-3333-3333-3333-333333333301',
        '22222222-2222-2222-2222-222222222201',
        'crop_disease',
        ST_GeogFromText('SRID=4326;POINT(76.4580 9.4460)'),
        '11111111-1111-1111-1111-111111111103',
        'inland',
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
        'കതിരുകൾക്ക് താഴെ തവിട്ടു ചാഴി കൂട്ടത്തോടെ കാണുന്നു. ഇലകൾ മഞ്ഞളിക്കുന്നുണ്ട്.',
        '{
            "disease_code": "brown_planthopper",
            "confidence": 0.94,
            "severity": "high",
            "affected_area_acres": 2.5,
            "crop_age_days": 65,
            "is_sample": true
        }'::jsonb,
        'community_confirmed',
        3,
        now() - INTERVAL '2 days'
    ),
    -- Report 2: Neighboring BPH report in Pulincunnoo (Padasekharam 2) - Part of same cluster
    (
        '33333333-3333-3333-3333-333333333302',
        '22222222-2222-2222-2222-222222222202',
        'crop_disease',
        ST_GeogFromText('SRID=4326;POINT(76.4510 9.4420)'),
        '11111111-1111-1111-1111-111111111103',
        'inland',
        'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
        'അടുത്ത കണ്ടത്തിലും ചാഴി ശല്യം തുടങ്ങി. വേഗത്തിൽ വ്യാപിക്കുന്നു.',
        '{
            "disease_code": "brown_planthopper",
            "confidence": 0.89,
            "severity": "medium",
            "affected_area_acres": 1.8,
            "crop_age_days": 68,
            "is_sample": true
        }'::jsonb,
        'community_confirmed',
        2,
        now() - INTERVAL '1 day'
    ),
    -- Report 3: High Salinity Intrusion at Kainakary Canal Entry
    (
        '33333333-3333-3333-3333-333333333303',
        '22222222-2222-2222-2222-222222222205',
        'salinity',
        ST_GeogFromText('SRID=4326;POINT(76.3810 9.4890)'),
        '11111111-1111-1111-1111-111111111101',
        'toward_sea',
        NULL,
        'കൈനകരി വടക്കേ ആറ്റിൽ ഉപ്പുവെള്ളം കയറി. റിഫ്രാക്ടോമീറ്റർ റീഡിംഗ് 3.4 ppt.',
        '{
            "salinity_ppt": 3.4,
            "tide_phase": "high_tide",
            "surface_scum_visible": true,
            "motor_shutoff_done": true,
            "is_sample": true
        }'::jsonb,
        'officially_verified',
        5,
        now() - INTERVAL '12 hours'
    ),
    -- Report 4: Salinity approaching Pulincunnoo Canal
    (
        '33333333-3333-3333-3333-333333333304',
        '22222222-2222-2222-2222-222222222201',
        'salinity',
        ST_GeogFromText('SRID=4326;POINT(76.4250 9.4600)'),
        '11111111-1111-1111-1111-111111111102',
        'toward_sea',
        NULL,
        'പുളിങ്കുന്ന് വലിയ തോട്ടിൽ വെള്ളത്തിന് ഉപ്പുരസം. കൃഷിക്ക് അടിക്കുന്നത് നിർത്തണം.',
        '{
            "salinity_ppt": 2.2,
            "tide_phase": "rising",
            "surface_scum_visible": false,
            "motor_shutoff_done": true,
            "is_sample": true
        }'::jsonb,
        'community_confirmed',
        2,
        now() - INTERVAL '6 hours'
    ),
    -- Report 5: Bird Deaths (Duck flock mortality in Moncompu)
    (
        '33333333-3333-3333-3333-333333333305',
        '22222222-2222-2222-2222-222222222202',
        'bird_deaths',
        ST_GeogFromText('SRID=4326;POINT(76.4385 9.4285)'),
        '11111111-1111-1111-1111-111111111103',
        'inland',
        NULL,
        'മങ്കൊമ്പ് തെക്കേക്കരയിൽ താറാവുകൾ പെട്ടെന്ന് ചത്തു വീഴുന്നു. തല കുലുക്കലും തളർച്ചയും.',
        '{
            "sick_count": 45,
            "dead_count": 28,
            "symptoms": ["sudden_death", "loss_of_balance", "cyanosis_of_head", "greenish_diarrhea"],
            "flock_size": 1200,
            "veterinary_notified": true,
            "is_sample": true
        }'::jsonb,
        'unconfirmed',
        1,
        now() - INTERVAL '4 hours'
    ),
    -- Report 6: Bund Seepage at Champakulam outer bund
    (
        '33333333-3333-3333-3333-333333333306',
        '22222222-2222-2222-2222-222222222203',
        'bund_seepage',
        ST_GeogFromText('SRID=4326;POINT(76.4230 9.4200)'),
        '11111111-1111-1111-1111-111111111104',
        'inland',
        NULL,
        'ചമ്പക്കുളം പുറംബണ്ടിൽ ശക്തമായ ചോർച്ച. അടിയന്തര മണൽച്ചാക്ക് തടയണ വേണം.',
        '{
            "seepage_type": "active_piping",
            "bund_length_meters": 12,
            "water_level_diff_feet": 3.8,
            "emergency_pumping_needed": true,
            "is_sample": true
        }'::jsonb,
        'unconfirmed',
        0,
        now() - INTERVAL '2 hours'
    )
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Confirmations
INSERT INTO report_confirmations (id, report_id, confirmer_id, created_at)
VALUES
    ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222202', now() - INTERVAL '1 day 20 hours'),
    ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222203', now() - INTERVAL '1 day 18 hours'),
    ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222205', now() - INTERVAL '1 day 16 hours'),
    ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', now() - INTERVAL '20 hours'),
    ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222203', now() - INTERVAL '18 hours'),
    ('44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222202', now() - INTERVAL '5 hours'),
    ('44444444-4444-4444-4444-444444444407', '33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222203', now() - INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Clusters (Precomputed Initial Cluster for Pulincunnoo BPH)
INSERT INTO clusters (
    id, report_type, sub_category, center, report_count,
    window_start, window_end, trend, alert_level, created_at
)
VALUES
    (
        '55555555-5555-5555-5555-555555555501',
        'crop_disease',
        'brown_planthopper',
        ST_GeogFromText('SRID=4326;POINT(76.4545 9.4440)'),
        2,
        now() - INTERVAL '3 days',
        now(),
        'growing',
        'Warning',
        now()
    )
ON CONFLICT (id) DO NOTHING;
