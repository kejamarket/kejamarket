/**
 * KejaMarket Kenya Locations Database v2.0
 * ==========================================
 * Comprehensive Kenya Residential Areas Database
 * - Nairobi & Environs (Priority, with full sub-zones)
 * - Mombasa & Coast
 * - Kisumu & Western Kenya
 * - Nakuru & Rift Valley
 * - Eldoret & North Rift
 * - Other Major Towns
 *
 * UX Design: Hierarchical search
 * - User types → instant fuzzy match across all areas + sub-zones
 * - Bottom sheet shows: County tabs → Area chips → Sub-zone chips
 * - Estates with phases/numbers shown as parent + sub-items
 */

// ═══════════════════════════════════════════════════════════════
// KENYA LOCATIONS MASTER DATABASE
// ═══════════════════════════════════════════════════════════════

const KENYA_LOCATIONS = {

  // ──────────────────────────────────────────────────────────────
  // NAIROBI COUNTY
  // ──────────────────────────────────────────────────────────────
  nairobi: {
    id: 'nairobi',
    name: 'Nairobi',
    emoji: '🏙️',
    type: 'county',
    corridors: [

      {
        id: 'nairobi_central',
        name: 'Nairobi Central & Urban Core',
        areas: [
          { name: 'CBD / City Centre', lat: -1.2864, lng: 36.8172 },
          { name: 'Ngara', lat: -1.2764, lng: 36.8282,
            subZones: ['Ngara West', 'Ngara East', 'Chemelil / Fig Tree Road', 'Ngara Rd Stage'] },
          { name: 'Pangani', lat: -1.2709, lng: 36.8375 },
          { name: 'Eastleigh', lat: -1.2770, lng: 36.8500,
            subZones: ['Eastleigh Section 1', 'Eastleigh Section 2', 'Eastleigh Section 3', 'California Estate', 'Eastleigh Airbase'] },
          { name: 'Kariokor', lat: -1.2825, lng: 36.8372 },
          { name: 'Starehe / Ziwani', lat: -1.2780, lng: 36.8320 },
          { name: 'Pumwani', lat: -1.2855, lng: 36.8450 },
          { name: 'Majengo', lat: -1.2870, lng: 36.8470 },
          { name: 'Gikomba', lat: -1.2840, lng: 36.8390 },
          { name: 'Shauri Moyo', lat: -1.2890, lng: 36.8490 },
          { name: 'Parklands', lat: -1.2612, lng: 36.8155,
            subZones: ['1st Parklands', '2nd Parklands', '3rd Parklands', '4th Parklands', '5th Parklands', '6th Parklands', 'Highridge'] },
          { name: 'City Park / Limuru Road Environs', lat: -1.2620, lng: 36.8260 },
          { name: 'Upper Hill', lat: -1.2970, lng: 36.8140 },
        ]
      },

      {
        id: 'westlands_diplomatic',
        name: 'Westlands & Diplomatic Belt',
        areas: [
          { name: 'Westlands', lat: -1.2675, lng: 36.8058,
            subZones: ['Sarit Centre Area', 'Westlands Commercial', 'Rhapta Road', 'Ojijo Road'] },
          { name: 'Brookside / Spring Valley', lat: -1.2541, lng: 36.7972 },
          { name: 'Kileleshwa', lat: -1.2801, lng: 36.7862,
            subZones: ['Oloitokitok Road', 'Kandara Road', 'Siaya Road', 'Argwings Kodhek'] },
          { name: 'Kilimani', lat: -1.2921, lng: 36.7884,
            subZones: ['Dennis Pritt Road', 'Lenana Road', 'Argwings Kodhek Road', 'Elgeyo Marakwet Road', 'Kindaruma Road'] },
          { name: 'Hurlingham', lat: -1.2965, lng: 36.7951 },
          { name: 'Lavington', lat: -1.2824, lng: 36.7681,
            subZones: ['James Gichuru Road', 'Isaac Gathanju Road', 'Lower Kabete Road'] },
          { name: 'Riverside Drive', lat: -1.2721, lng: 36.7944 },
          { name: 'Muthangari', lat: -1.2711, lng: 36.7725 },
          { name: 'Valley Arcade / Gitanga Road', lat: -1.2941, lng: 36.7702 },
          { name: 'Kyuna', lat: -1.2520, lng: 36.7750 },
          { name: 'Loresho', lat: -1.2450, lng: 36.7650 },
          { name: 'Gigiri / UN Village', lat: -1.2335, lng: 36.8105 },
          { name: 'Runda', lat: -1.2185, lng: 36.8202,
            subZones: ['Runda Mimosa', 'Runda Evergreen', 'Runda Whispers', 'Old Runda', 'New Runda'] },
          { name: 'Muthaiga', lat: -1.2583, lng: 36.8322,
            subZones: ['Muthaiga North', 'Muthaiga South', 'Lower Muthaiga'] },
          { name: 'Rosslyn / Two Rivers Area', lat: -1.2250, lng: 36.7950 },
          { name: 'Thigiri / Nyari', lat: -1.2380, lng: 36.7950 },
          { name: 'Kitisuru', lat: -1.2390, lng: 36.7680 },
          { name: 'Peponi Road Area', lat: -1.2420, lng: 36.7915 },
        ]
      },

      {
        id: 'thika_road_north',
        name: 'Thika Road, Kasarani & Northern Suburbs',
        areas: [
          { name: 'Mathare', lat: -1.2615, lng: 36.8620,
            subZones: ['Mathare North Area 1', 'Mathare North Area 2', 'Mathare North Area 3', 'Mathare North Area 4', 'Mathare 4A', 'Mlango Kubwa'] },
          { name: 'Huruma', lat: -1.2645, lng: 36.8710,
            subZones: ['Huruma Kiamaiko', 'Huruma Ngei 1', 'Huruma Ngei 2', 'Huruma Drive-In'] },
          { name: 'Kariobangi', lat: -1.2605, lng: 36.8820,
            subZones: ['Kariobangi North', 'Kariobangi South', 'Kariobangi Light Industries'] },
          { name: 'Baba Dogo', lat: -1.2480, lng: 36.8750 },
          { name: 'Lucky Summer', lat: -1.2420, lng: 36.8850 },
          { name: 'Garden Estate', lat: -1.2312, lng: 36.8625 },
          { name: 'Thome Estate', lat: -1.2265, lng: 36.8690,
            subZones: ['Thome Estate 1', 'Thome Estate 2', 'Thome Estate 3', 'Thome Estate 4', 'Thome Estate 5'] },
          { name: 'Roysambu', lat: -1.2195, lng: 36.8864,
            subZones: ['Roysambu Phase 1', 'Roysambu Phase 2', 'Lumumba Estate', 'TRM Area', 'Miracle Centre', 'Mirema Stage'] },
          { name: 'Kasarani', lat: -1.2241, lng: 36.8992,
            subZones: ['Kasarani Sports View', 'Kasarani Sunton', 'Kasarani Seasons', 'Clay City', 'Mwiki Road'] },
          { name: 'Mirema Drive', lat: -1.2120, lng: 36.8850 },
          { name: 'Marurui', lat: -1.2160, lng: 36.8720 },
          { name: 'Zimmerman', lat: -1.2052, lng: 36.8921,
            subZones: ['Zimmerman Base', 'Zimmerman Phase 1', 'Zimmerman Phase 2', 'Kamiti Road Section', 'Pentagon'] },
          { name: 'Githurai', lat: -1.1990, lng: 36.9135,
            subZones: ['Githurai 44', 'Githurai 45', 'Githurai 46 (Jacaranda)', 'Githurai Market', 'Kamiti Road Environs'] },
          { name: 'Kahawa', lat: -1.1920, lng: 36.9185,
            subZones: ['Kahawa West', 'Kahawa Sukari', 'Kahawa Wendani', 'Kahawa North', 'Kahawa Barracks Area'] },
          { name: 'Mwihoko', lat: -1.1850, lng: 36.9420 },
          { name: 'Mwiki', lat: -1.2280, lng: 36.9250,
            subZones: ['Mwiki Estate', 'Mwiki Phase 2', 'Mwiki Kasarani Road'] },
          { name: 'Korogocho', lat: -1.2510, lng: 36.8890 },
        ]
      },

      {
        id: 'kiambu_northern_bypass',
        name: 'Kiambu Road, Ruaka & Northern Bypass',
        areas: [
          { name: 'Ridgeways', lat: -1.2330, lng: 36.8420 },
          { name: 'Fourways Junction', lat: -1.2215, lng: 36.8450 },
          { name: 'Edenville', lat: -1.2150, lng: 36.8410 },
          { name: 'Thindigua', lat: -1.2045, lng: 36.8415 },
          { name: 'Kiambu Town', lat: -1.1714, lng: 36.8356 },
          { name: 'Ruaka', lat: -1.2064, lng: 36.7786,
            subZones: ['Ruaka Town', 'Ruaka Joyland', 'Ruaka Gacharage', 'Ruaka Slaughter', 'Ruaka Gitaru'] },
          { name: 'Muchatha', lat: -1.1980, lng: 36.7720 },
          { name: 'Ndenderu', lat: -1.1870, lng: 36.7580 },
          { name: 'Banana Hill / Karuri', lat: -1.1760, lng: 36.7460 },
          { name: 'Gachie', lat: -1.2210, lng: 36.7620 },
          { name: 'Lower Kabete / Mwimuto', lat: -1.2350, lng: 36.7550 },
          { name: 'Wangige', lat: -1.2380, lng: 36.7150 },
          { name: 'Rosslyn Riviera / Windsor', lat: -1.2250, lng: 36.7950 },
          { name: 'Limuru Town', lat: -1.1130, lng: 36.6430 },
          { name: 'Tigoni', lat: -1.1450, lng: 36.6780 },
        ]
      },

      {
        id: 'dagoretti_waiyaki',
        name: 'Waiyaki Way, Dagoretti & Kikuyu Corridor',
        areas: [
          { name: 'Kangemi', lat: -1.2640, lng: 36.7510,
            subZones: ['Kangemi Waruku', 'Kangemi Gichagi', 'Kangemi Central', 'Kangemi Sodom', 'Kangemi Corner'] },
          { name: 'Mountain View Estate', lat: -1.2580, lng: 36.7430 },
          { name: 'Uthiru', lat: -1.2610, lng: 36.7220,
            subZones: ['Uthiru 87', 'Uthiru Cooperation', 'ILRI Area', 'Ndumboini', 'Uthiru Stage'] },
          { name: 'Kinoo / Gitaru', lat: -1.2580, lng: 36.7020,
            subZones: ['Kinoo Muthiga', 'Kinoo Gitaru Stage', 'Kinoo Market'] },
          { name: 'Kabete', lat: -1.2650, lng: 36.7320,
            subZones: ['Upper Kabete', 'Lower Kabete', 'Kabete Vet Lab'] },
          { name: 'Kawangware', lat: -1.2860, lng: 36.7465,
            subZones: ['Kawangware Stage 2', 'Kawangware Stage 46', 'Kawangware Stage 56', 'Kawangware Muslim', 'Kawangware Coast'] },
          { name: 'Riruta', lat: -1.2910, lng: 36.7450,
            subZones: ['Riruta Satellite', 'Riruta Near Corner', 'Riruta K-Rep'] },
          { name: 'Waithaka', lat: -1.2780, lng: 36.7210 },
          { name: 'Dagoretti Corner', lat: -1.3005, lng: 36.7580 },
          { name: 'Dagoretti Market / Mutu-ini', lat: -1.2950, lng: 36.7110 },
          { name: 'Kikuyu Town', lat: -1.2480, lng: 36.6640,
            subZones: ['Kikuyu CBD', 'Ondiri', 'Thogoto', 'Kidfarmaco Area', 'Kikuyu Railway'] },
          { name: 'Gikambura / Kamangu', lat: -1.2720, lng: 36.6420 },
          { name: 'Zambezi / Sigona / Muguga', lat: -1.2380, lng: 36.6350 },
        ]
      },

      {
        id: 'ngong_road_south',
        name: "Ngong Road, Lang'ata & Southern Suburbs",
        areas: [
          { name: 'Adams Arcade', lat: -1.3030, lng: 36.7700 },
          { name: 'Ngumo Estate', lat: -1.3080, lng: 36.7950 },
          { name: 'Woodley / Jamhuri', lat: -1.3040, lng: 36.7780 },
          { name: 'Highrise Estate', lat: -1.3090, lng: 36.8060 },
          { name: 'Madaraka Estate', lat: -1.3050, lng: 36.8180 },
          { name: 'Nairobi West', lat: -1.3120, lng: 36.8240 },
          { name: 'South B', lat: -1.3160, lng: 36.8370,
            subZones: ['South B Hazina', 'South B Sana Sana', 'South B Plainsview', 'South B Golden Gate', 'South B Lumumba'] },
          { name: 'South C', lat: -1.3220, lng: 36.8290,
            subZones: ['South C Bellevue', 'South C Mugoya', 'South C Five Star', 'South C Akiba', 'South C Green'] },
          { name: "Lang'ata", lat: -1.3350, lng: 36.7720,
            subZones: ["Lang'ata Otiende", "Lang'ata Dam Estate", "Lang'ata Ngei 1", "Lang'ata Ngei 2", "Lang'ata Sunvalley", "Lang'ata Royal Park", "Lang'ata Southlands"] },
          { name: 'Karen', lat: -1.3350, lng: 36.7150,
            subZones: ['Karen Shopping Centre', 'Karen Hardy', 'Karen Bogani', 'Karen Mbagathi', 'Karen Windy Ridge', 'Karen Kerarapon', 'Karen Bomas Area'] },
          { name: 'Kibera / Kibra', lat: -1.3140, lng: 36.7870,
            subZones: ['Kibra Olympic Estate', 'Kibra Ayany Estate', 'Kibra Makina', 'Kibra Lindi', 'Kibra Soweto', 'Kibra Gatwekera'] },
        ]
      },

      {
        id: 'eastlands',
        name: 'Eastlands, Outer Ring & Jogoo Road',
        areas: [
          { name: 'Jericho / Maringo / Harambee', lat: -1.2940, lng: 36.8680 },
          { name: 'Kaloleni / Lumumba / Uhuru', lat: -1.2920, lng: 36.8580 },
          { name: 'Buruburu', lat: -1.2920, lng: 36.8790,
            subZones: ['Buruburu Phase 1', 'Buruburu Phase 2', 'Buruburu Phase 3', 'Buruburu Phase 4', 'Buruburu Phase 5'] },
          { name: 'Tena Estate', lat: -1.2970, lng: 36.8910 },
          { name: 'Donholm', lat: -1.3015, lng: 36.8870,
            subZones: ['Donholm Phase 1', 'Donholm Phase 2', 'Donholm Phase 3', 'Donholm Phase 4', 'Donholm Phase 5', 'Donholm Phase 6', 'Donholm Phase 7', 'Donholm Phase 8', 'Greenfields Estate', 'Greenspan Estate'] },
          { name: 'Umoja', lat: -1.2870, lng: 36.9000,
            subZones: ['Umoja 1', 'Umoja 2', 'Umoja 3 / Innercore', 'Umoja Unity', 'Umoja Market Area', 'Umoja Estate'] },
          { name: 'Dandora', lat: -1.2550, lng: 36.9010,
            subZones: ['Dandora Phase 1', 'Dandora Phase 2', 'Dandora Phase 3', 'Dandora Phase 4', 'Dandora Phase 5'] },
          { name: 'Savannah Estate', lat: -1.2990, lng: 36.8990 },
          { name: 'Komarock', lat: -1.2690, lng: 36.9150,
            subZones: ['Komarock Sector 1', 'Komarock Sector 2', 'Komarock Sector 3', 'Komarock Sector 3A', 'Komarock Sector 4'] },
          { name: 'Kayole', lat: -1.2790, lng: 36.9250,
            subZones: ['Kayole Junction', 'Kayole Prime', 'Kayole Masimba', 'Soweto Kayole'] },
          { name: 'Pipeline', lat: -1.3210, lng: 36.8950,
            subZones: ['Pipeline Stage', 'Pipeline Tumaini', 'Pipeline Plot 10', 'Pipeline Greenwood', 'Pipeline Survey', 'Pipeline Phase 1', 'Pipeline Phase 2'] },
          { name: 'Fedha Estate', lat: -1.3230, lng: 36.9020,
            subZones: ['Fedha Estate Main', 'Fedha Telaviv', 'City Cabanas Area'] },
          { name: 'Tassia', lat: -1.3190, lng: 36.9080,
            subZones: ['Tassia Estate', 'Tassia Hill View'] },
          { name: 'Embakasi', lat: -1.3180, lng: 36.9130,
            subZones: ['Embakasi Village', 'Embakasi North', 'Embakasi South', 'Embakasi West', 'Embakasi Central', 'Baraka Estate', 'Cabanas Estate'] },
          { name: 'Nyayo Estate', lat: -1.3150, lng: 36.9120,
            subZones: ['Nyayo Estate Gate A (Phase 1)', 'Nyayo Estate Phase 2', 'Nyayo Estate Gate D (Phase 3)', 'Nyayo Estate Phase 4', 'Nyayo Estate Phase 5'] },
          { name: 'Avenue Park', lat: -1.3170, lng: 36.9040,
            subZones: ['Avenue Park 1', 'Avenue Park 2'] },
          { name: 'Imara Daima', lat: -1.3320, lng: 36.8750,
            subZones: ['Villa Franca', 'AA Area', 'Muimara Road'] },
          { name: 'Mukuru', lat: -1.3210, lng: 36.8710,
            subZones: ['Mukuru kwa Njenga', 'Mukuru kwa Reuben', 'Viwandani'] },
          { name: 'Saika Estate', lat: -1.2640, lng: 36.9220 },
          { name: 'Njiru / Obama Estate', lat: -1.2580, lng: 36.9450 },
          { name: 'Mihango', lat: -1.2780, lng: 36.9620 },
          { name: 'Utawala', lat: -1.2920, lng: 36.9740,
            subZones: ['Utawala Shooters', 'Utawala Benedicta', 'Utawala Githunguri Road', 'Utawala Bypass Area'] },
          { name: 'Chokaa', lat: -1.2680, lng: 36.9850 },
          { name: 'Ruai', lat: -1.2720, lng: 37.0120,
            subZones: ['Ruai Town', 'Ruai Quickmart Area', 'Ruai Eastern Bypass'] },
          { name: 'Kamulu', lat: -1.2830, lng: 37.0750 },
          { name: 'Joska', lat: -1.2950, lng: 37.1350 },
          { name: 'Malaa / Kantafu', lat: -1.3050, lng: 37.1850 },
        ]
      },

      {
        id: 'mombasa_road_nairobi',
        name: 'Mombasa Road Corridor (Nairobi Side)',
        areas: [
          { name: 'Syokimau', lat: -1.3595, lng: 36.9380,
            subZones: ['Syokimau Airport Road', 'Syokimau Gateway Mall Area', 'Syokimau Phase 1', 'Syokimau Phase 2', 'Katani Road'] },
          { name: 'Mlolongo', lat: -1.3845, lng: 36.9610,
            subZones: ['Mlolongo Phase 1', 'Mlolongo Phase 2', 'Mlolongo Phase 3 (Weighbridge)', 'Mlolongo Phase 4', 'Mlolongo Town Centre', 'Mlolongo Expressway Entrance'] },
          { name: 'Greatwall Gardens', lat: -1.3890, lng: 36.9720,
            subZones: ['Greatwall Phase 1', 'Greatwall Phase 2', 'Greatwall Phase 3', 'Greatwall Phase 4', 'Greatwall Phase 5'] },
          { name: 'Katani', lat: -1.3820, lng: 37.0150 },
          { name: 'Sabaki Estate', lat: -1.4120, lng: 36.9680 },
        ]
      },
    ]
  },

  // ──────────────────────────────────────────────────────────────
  // KIAMBU COUNTY (Beyond Nairobi Border)
  // ──────────────────────────────────────────────────────────────
  kiambu: {
    id: 'kiambu',
    name: 'Kiambu County',
    emoji: '🌿',
    type: 'county',
    corridors: [
      {
        id: 'ruiru_juja',
        name: 'Ruiru, Juja & Eastern Kiambu',
        areas: [
          { name: 'Ruiru Town', lat: -1.1465, lng: 36.9610,
            subZones: ['Ruiru Town Centre', 'Ruiru Kamakis', 'Eastern Bypass Ruiru', 'Gitirioni'] },
          { name: 'Membley Estate', lat: -1.1640, lng: 36.9360 },
          { name: 'Mugutha', lat: -1.1600, lng: 36.9450 },
          { name: 'Juja', lat: -1.1025, lng: 37.0145,
            subZones: ['Juja City Mall Area', 'Kalimoni', 'High Point Juja', 'Juja Farm', 'Makongeni Juja', 'Theta Road', 'Eastern Bypass Juja'] },
          { name: 'Thika Town', lat: -1.0333, lng: 37.0694,
            subZones: ['Thika Section 9', 'Makongeni Thika', 'Thika Landless', 'Ngoingwa', 'Biashara', 'Kamenu', 'Kiandutu', 'Township', 'Thika Stadium Area'] },
          { name: 'Kenyatta Road', lat: -1.1250, lng: 36.9850 },
          { name: 'Kimbo / Matopeni', lat: -1.1350, lng: 36.9720 },
        ]
      },
      {
        id: 'kiambu_limuru',
        name: 'Kiambu, Limuru & Western Kiambu',
        areas: [
          { name: 'Kiambu Town', lat: -1.1714, lng: 36.8356 },
          { name: 'Kirigiti', lat: -1.1850, lng: 36.8310 },
          { name: 'Lari / Githunguri Road', lat: -1.1300, lng: 36.7500 },
          { name: 'Githunguri Town', lat: -1.0710, lng: 36.7540 },
          { name: 'Limuru Town', lat: -1.1130, lng: 36.6430,
            subZones: ['Limuru CBD', 'Limuru Tigoni', 'Limuru Cianda', 'Limuru Red Hill'] },
          { name: 'Kikuyu Town', lat: -1.2480, lng: 36.6640 },
        ]
      },
    ]
  },

  // ──────────────────────────────────────────────────────────────
  // KAJIADO COUNTY (Nairobi Environs)
  // ──────────────────────────────────────────────────────────────
  kajiado: {
    id: 'kajiado',
    name: 'Kajiado County',
    emoji: '🦁',
    type: 'county',
    corridors: [
      {
        id: 'rongai_ngong',
        name: "Rongai, Ngong & Kiserian",
        areas: [
          { name: 'Ongata Rongai', lat: -1.3960, lng: 36.7580,
            subZones: ['Rongai Maasai Lodge', 'Rongai Tuskys Area', 'Rongai Rimpa', 'Rongai Kandisi', 'Rongai Mayor Road', 'Rongai Laiser Hill', 'Rongai Ole Kasasi', 'Rongai Nazarene'] },
          { name: 'Kiserian', lat: -1.4380, lng: 36.7260,
            subZones: ['Kiserian CBD', 'Kiserian Pipeline Road', 'Kiserian Oloosirkon'] },
          { name: 'Ngong Town', lat: -1.3610, lng: 36.6570,
            subZones: ['Ngong CBD', 'Ngong Milele Mall Area', 'Ngong Kibiko', 'Ngong Ololua', 'Ngong Juanco', 'Matasia', 'Ngong Bulbul'] },
        ]
      },
      {
        id: 'kitengela_athi',
        name: 'Kitengela, Athi River & South Kajiado',
        areas: [
          { name: 'Kitengela', lat: -1.4780, lng: 36.9580,
            subZones: ['Kitengela CBD', 'Kitengela Chuna', 'Kitengela Milimani', 'Kitengela Yukos', 'Kitengela New Valley', 'Kitengela Acacia', 'Kitengela Noonkopir', 'Kitengela Deliverance Area', 'Kitengela Phase 1', 'Kitengela Phase 2', 'Kitengela Phase 3'] },
          { name: 'Athi River / Mavoko', lat: -1.4520, lng: 36.9830,
            subZones: ['Athi River Green Park', 'Crystal Rivers', 'Athi River Makadara', 'Mavoko Town', 'Athi River Industrial'] },
          { name: 'Katani (Athi River Side)', lat: -1.3820, lng: 37.0150 },
          { name: 'Daystar / Lukenya', lat: -1.4420, lng: 37.0250 },
          { name: 'Isinya', lat: -1.6500, lng: 36.8500 },
          { name: 'Kajiado Town', lat: -1.8520, lng: 36.7760 },
        ]
      },
    ]
  },

  // ──────────────────────────────────────────────────────────────
  // MACHAKOS COUNTY
  // ──────────────────────────────────────────────────────────────
  machakos: {
    id: 'machakos',
    name: 'Machakos County',
    emoji: '🏔️',
    type: 'county',
    corridors: [
      {
        id: 'machakos_town',
        name: 'Machakos Town & Environs',
        areas: [
          { name: 'Machakos Town', lat: -1.5170, lng: 37.2630,
            subZones: ['Machakos CBD', 'Machakos Kalama', 'Machakos Muvuti', 'Machakos Mumbuni'] },
          { name: 'Tala / Kangundo Road', lat: -1.3800, lng: 37.2000 },
          { name: 'Wote', lat: -1.7850, lng: 37.6350 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // MOMBASA & COAST
  // ══════════════════════════════════════════════════════════════
  mombasa: {
    id: 'mombasa',
    name: 'Mombasa & Coast',
    emoji: '🌊',
    type: 'county',
    corridors: [
      {
        id: 'mombasa_island',
        name: 'Mombasa Island & CBD',
        areas: [
          { name: 'Mombasa CBD / Moi Avenue', lat: -4.0435, lng: 39.6682 },
          { name: 'Old Town Mombasa', lat: -4.0570, lng: 39.6830 },
          { name: 'Tudor', lat: -4.0210, lng: 39.6700 },
          { name: 'Majengo (Mombasa)', lat: -4.0620, lng: 39.6580 },
          { name: 'Tononoka', lat: -4.0520, lng: 39.6690 },
          { name: 'Ganjoni', lat: -4.0640, lng: 39.6620 },
          { name: 'Kizingo', lat: -4.0680, lng: 39.6700 },
        ]
      },
      {
        id: 'mombasa_north',
        name: 'Mombasa North Coast & Nyali',
        areas: [
          { name: 'Nyali', lat: -4.0170, lng: 39.7120,
            subZones: ['Nyali 1st Ridge', 'Nyali 2nd Ridge', 'Nyali 3rd Ridge', 'Nyali 4th Ridge', 'Nyali 5th Ridge', 'Nyali 6th Ridge', 'Nyali Links Road', 'Nyali Mzambarauni'] },
          { name: 'Bamburi', lat: -3.9820, lng: 39.7260,
            subZones: ['Bamburi Beach', 'Bamburi Phase 1', 'Bamburi Phase 2', 'Bamburi Phase 3', 'Bamburi Phase 4', 'Bamburi Phase 5', 'Bamburi Estate'] },
          { name: 'Shanzu', lat: -3.9450, lng: 39.7320 },
          { name: 'Kisauni', lat: -4.0100, lng: 39.6900,
            subZones: ['Kisauni Estate', 'Kisauni Mwembe Tayari', 'Kisauni Mwembelegeza'] },
          { name: 'Bombolulu', lat: -3.9950, lng: 39.7000 },
          { name: 'Mtwapa', lat: -3.9100, lng: 39.7320,
            subZones: ['Mtwapa Town', 'Mtwapa Creek Area', 'Mtwapa Kanamai'] },
          { name: 'Kilifi Town', lat: -3.6305, lng: 39.8499 },
          { name: 'Watamu', lat: -3.3600, lng: 40.0150 },
        ]
      },
      {
        id: 'mombasa_south',
        name: 'Mombasa South & Likoni',
        areas: [
          { name: 'Likoni', lat: -4.0920, lng: 39.6650,
            subZones: ['Likoni Ferry Area', 'Shika Adabu', 'Bofu', 'Mtongwe', 'Likoni Town'] },
          { name: 'Changamwe', lat: -4.0190, lng: 39.6250,
            subZones: ['Changamwe Estate', 'Changamwe Round About', 'Port Reitz'] },
          { name: 'Miritini', lat: -4.0100, lng: 39.5850 },
          { name: 'Diani / Ukunda', lat: -4.2700, lng: 39.5700,
            subZones: ['Diani Beach', 'Ukunda Town', 'Diani Bofa Road', 'Chale Island Area', 'Msambweni'] },
          { name: 'Shimba Hills / Kwale', lat: -4.1720, lng: 39.4720 },
        ]
      },
      {
        id: 'coast_towns',
        name: 'Coast Towns & Malindi',
        areas: [
          { name: 'Malindi', lat: -3.2192, lng: 40.1169,
            subZones: ['Malindi Town', 'Malindi Silversands', 'Malindi Casuarina', 'Malindi Sabaki', 'Shella Road'] },
          { name: 'Lamu / Manda Island', lat: -2.2694, lng: 40.9023 },
          { name: 'Voi', lat: -3.3960, lng: 38.5570 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // KISUMU & WESTERN KENYA
  // ══════════════════════════════════════════════════════════════
  kisumu: {
    id: 'kisumu',
    name: 'Kisumu & Western Kenya',
    emoji: '🌊',
    type: 'region',
    corridors: [
      {
        id: 'kisumu_city',
        name: 'Kisumu City',
        areas: [
          { name: 'Kisumu CBD', lat: -0.0917, lng: 34.7679 },
          { name: 'Milimani (Kisumu)', lat: -0.1024, lng: 34.7555,
            subZones: ['Milimani Estate', 'Milimani Road', 'Kisumu Milimani Upper'] },
          { name: 'Tom Mboya Estate', lat: -0.0856, lng: 34.7590 },
          { name: 'Kondele', lat: -0.0763, lng: 34.7820 },
          { name: 'Manyatta', lat: -0.0632, lng: 34.7890,
            subZones: ['Manyatta A', 'Manyatta B', 'Manyatta Arab'] },
          { name: 'Nyalenda', lat: -0.1050, lng: 34.7850,
            subZones: ['Nyalenda A', 'Nyalenda B'] },
          { name: 'Riat Hills', lat: -0.1180, lng: 34.7340 },
          { name: 'Lolwe Estate', lat: -0.0860, lng: 34.7720 },
          { name: 'Mamboleo', lat: -0.0540, lng: 34.8010 },
          { name: 'Dunga / Rodi', lat: -0.1125, lng: 34.7625 },
          { name: 'Kiboswa', lat: -0.0310, lng: 34.8450 },
          { name: 'Ahero', lat: -0.1700, lng: 34.9190 },
          { name: 'Maseno', lat: 0.0043, lng: 34.6035 },
          { name: 'Kisumu East (Kajulu)', lat: -0.0590, lng: 34.8200 },
        ]
      },
      {
        id: 'western_towns',
        name: 'Western Kenya Towns',
        areas: [
          { name: 'Kakamega Town', lat: 0.2827, lng: 34.7519,
            subZones: ['Kakamega CBD', 'Milimani Kakamega', 'Kakamega Hospital Area', 'Amalemba'] },
          { name: 'Bungoma', lat: 0.5635, lng: 34.5611 },
          { name: 'Webuye', lat: 0.6160, lng: 34.7720 },
          { name: 'Kitale', lat: 1.0154, lng: 35.0062,
            subZones: ['Kitale Town', 'Kitale Kiminini', 'Kitale Moi\'s Bridge'] },
          { name: 'Homa Bay', lat: -0.5267, lng: 34.4571 },
          { name: 'Migori Town', lat: -1.0634, lng: 34.4731 },
          { name: 'Kisii Town', lat: -0.6817, lng: 34.7658,
            subZones: ['Kisii CBD', 'Kisii Daraja Mbili', 'Kisii Nyamache', 'Kisii Mwembe'] },
          { name: 'Oyugis', lat: -0.5218, lng: 34.7261 },
          { name: 'Siaya Town', lat: 0.0607, lng: 34.2886 },
          { name: 'Bondo', lat: -0.3419, lng: 34.2683 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // NAKURU & RIFT VALLEY
  // ══════════════════════════════════════════════════════════════
  nakuru: {
    id: 'nakuru',
    name: 'Nakuru & Rift Valley',
    emoji: '🦩',
    type: 'region',
    corridors: [
      {
        id: 'nakuru_city',
        name: 'Nakuru City',
        areas: [
          { name: 'Nakuru CBD', lat: -0.3031, lng: 36.0800 },
          { name: 'Section 58', lat: -0.2960, lng: 36.0650,
            subZones: ['Section 58 Estate', 'Section 58 Mosque Area'] },
          { name: 'Shabaha', lat: -0.2850, lng: 36.0710 },
          { name: 'Rhonda', lat: -0.2920, lng: 36.0750 },
          { name: 'Mwariki', lat: -0.3250, lng: 36.1050,
            subZones: ['Mwariki A', 'Mwariki B', 'Mwariki C'] },
          { name: 'London Estate (Nakuru)', lat: -0.3100, lng: 36.0580 },
          { name: 'Bondeni', lat: -0.2990, lng: 36.0870 },
          { name: 'Langalanga', lat: -0.3060, lng: 36.0940 },
          { name: 'Freehold', lat: -0.3150, lng: 36.0750 },
          { name: 'Milimani (Nakuru)', lat: -0.3220, lng: 36.0620 },
          { name: 'Flamingo', lat: -0.3010, lng: 36.0510 },
          { name: 'Lake View Estate', lat: -0.3350, lng: 36.0480 },
          { name: 'Free Area / Racecourse', lat: -0.2850, lng: 36.0920 },
          { name: 'Lanet (Nakuru East)', lat: -0.2670, lng: 36.1080 },
          { name: 'Gilgil', lat: -0.4985, lng: 36.3215 },
          { name: 'Naivasha', lat: -0.7167, lng: 36.4310,
            subZones: ['Naivasha CBD', 'Naivasha Milimani', 'Naivasha Karagita', 'Naivasha Kamere', 'Naivasha Kayole', 'Naivasha Maai Mahiu'] },
          { name: 'Bahati (Nakuru)', lat: -0.1750, lng: 36.1270 },
          { name: 'Njoro', lat: -0.3418, lng: 35.9357 },
        ]
      },
      {
        id: 'rift_valley_towns',
        name: 'Other Rift Valley Towns',
        areas: [
          { name: 'Kericho', lat: -0.3686, lng: 35.2863 },
          { name: 'Bomet', lat: -0.7795, lng: 35.3421 },
          { name: 'Narok Town', lat: -1.0808, lng: 35.8714 },
          { name: 'Kabarnet', lat: 0.4918, lng: 35.7437 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // ELDORET & NORTH RIFT
  // ══════════════════════════════════════════════════════════════
  eldoret: {
    id: 'eldoret',
    name: 'Eldoret & North Rift',
    emoji: '🏃',
    type: 'region',
    corridors: [
      {
        id: 'eldoret_city',
        name: 'Eldoret City',
        areas: [
          { name: 'Eldoret Town Centre', lat: 0.5143, lng: 35.2698 },
          { name: 'Langas', lat: 0.5320, lng: 35.2540,
            subZones: ['Langas Estate', 'Langas Phase 1', 'Langas Phase 2'] },
          { name: 'Huruma Estate (Eldoret)', lat: 0.5250, lng: 35.2810 },
          { name: 'Annex', lat: 0.5080, lng: 35.2630 },
          { name: 'Red Hill (Eldoret)', lat: 0.4970, lng: 35.2750 },
          { name: 'Kimumu', lat: 0.5390, lng: 35.3060 },
          { name: 'Pioneer Estate', lat: 0.5210, lng: 35.2580 },
          { name: 'West Indies', lat: 0.4980, lng: 35.2420 },
          { name: 'Plateau', lat: 0.5050, lng: 35.2500 },
          { name: 'Munyaka', lat: 0.5150, lng: 35.3100 },
          { name: 'Elgon View', lat: 0.5060, lng: 35.2820 },
          { name: 'Sirikwa', lat: 0.5240, lng: 35.2960 },
          { name: 'Olbutyo', lat: 0.5380, lng: 35.2700 },
          { name: 'Kapsabet', lat: 0.2024, lng: 35.0989 },
          { name: 'Turbo', lat: 0.6269, lng: 35.0458 },
          { name: 'Webuye / Bungoma Area', lat: 0.5640, lng: 34.7700 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // CENTRAL KENYA & MT KENYA REGION
  // ══════════════════════════════════════════════════════════════
  central_kenya: {
    id: 'central_kenya',
    name: 'Central Kenya & Mt Kenya Region',
    emoji: '🏔️',
    type: 'region',
    corridors: [
      {
        id: 'nyeri_region',
        name: 'Nyeri & Mt Kenya Environs',
        areas: [
          { name: 'Nyeri Town', lat: -0.4201, lng: 36.9476,
            subZones: ['Nyeri CBD', 'Ruring\'u', 'Thunguma', 'Mahiga', 'Kimathi Way', 'King\'ong\'o'] },
          { name: 'Karatina', lat: -0.4830, lng: 37.1210 },
          { name: 'Othaya', lat: -0.5760, lng: 36.9250 },
          { name: 'Muranga Town', lat: -0.7169, lng: 37.1498 },
          { name: 'Sagana / Kagio', lat: -0.6730, lng: 37.2110 },
        ]
      },
      {
        id: 'meru_region',
        name: 'Meru County',
        areas: [
          { name: 'Meru Town', lat: 0.0467, lng: 37.6494,
            subZones: ['Meru CBD / Makutano', 'Nchiru', 'Kianjai', 'Maua Town'] },
          { name: 'Nkubu', lat: 0.0054, lng: 37.5845 },
          { name: 'Chuka', lat: -0.3291, lng: 37.6511 },
          { name: 'Maua', lat: 0.2302, lng: 37.9403 },
        ]
      },
      {
        id: 'embu_region',
        name: 'Embu County',
        areas: [
          { name: 'Embu Town', lat: -0.5300, lng: 37.4500,
            subZones: ['Embu CBD', 'Embu Estate', 'Mwea Town'] },
          { name: 'Runyenjes', lat: -0.3938, lng: 37.5635 },
        ]
      },
      {
        id: 'kirinyaga',
        name: 'Kirinyaga County',
        areas: [
          { name: 'Kerugoya / Kutus', lat: -0.4949, lng: 37.2802 },
          { name: 'Wanguru', lat: -0.5812, lng: 37.4330 },
        ]
      },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  // NORTH EASTERN & UPPER EASTERN
  // ══════════════════════════════════════════════════════════════
  north_eastern: {
    id: 'north_eastern',
    name: 'North Eastern & Upper Eastern',
    emoji: '🌵',
    type: 'region',
    corridors: [
      {
        id: 'garissa_isiolo',
        name: 'Garissa, Isiolo & Environs',
        areas: [
          { name: 'Garissa Town', lat: -0.4532, lng: 39.6462,
            subZones: ['Garissa CBD', 'Garissa Township', 'Garissa Iftin'] },
          { name: 'Isiolo Town', lat: 0.3540, lng: 37.5820,
            subZones: ['Isiolo CBD', 'Isiolo Bula Pesa', 'Isiolo Waso'] },
          { name: 'Nanyuki Town', lat: 0.0088, lng: 37.0724,
            subZones: ['Nanyuki CBD', 'Nanyuki Bataluni', 'Nanyuki Kamakwa'] },
          { name: 'Marsabit Town', lat: 2.3340, lng: 37.9930 },
          { name: 'Moyale', lat: 3.5240, lng: 39.0530 },
        ]
      },
      {
        id: 'machakos_kitui',
        name: 'Machakos & Kitui',
        areas: [
          { name: 'Kitui Town', lat: -1.3671, lng: 38.0115,
            subZones: ['Kitui CBD', 'Kitui Mulango', 'Kitui Ikanga'] },
          { name: 'Mutomo', lat: -1.8440, lng: 38.2000 },
        ]
      },
    ]
  },
};

// ═══════════════════════════════════════════════════════════════
// FLAT SEARCH INDEX — All locations with metadata for fast search
// ═══════════════════════════════════════════════════════════════

const ALL_KE_LOCATIONS = [];

Object.values(KENYA_LOCATIONS).forEach(county => {
  // Add county level
  ALL_KE_LOCATIONS.push({
    name: county.name,
    searchName: county.name.toLowerCase(),
    type: 'county',
    countyId: county.id,
    county: county.name,
    emoji: county.emoji
  });

  (county.corridors || []).forEach(corridor => {
    (corridor.areas || []).forEach(area => {
      // Add parent area
      ALL_KE_LOCATIONS.push({
        name: area.name,
        searchName: area.name.toLowerCase(),
        type: 'area',
        countyId: county.id,
        county: county.name,
        corridorId: corridor.id,
        corridor: corridor.name,
        lat: area.lat,
        lng: area.lng,
        emoji: county.emoji,
        hasSubZones: !!(area.subZones && area.subZones.length)
      });

      // Add sub-zones
      (area.subZones || []).forEach(sub => {
        ALL_KE_LOCATIONS.push({
          name: sub,
          searchName: sub.toLowerCase(),
          type: 'subzone',
          parentArea: area.name,
          countyId: county.id,
          county: county.name,
          corridorId: corridor.id,
          corridor: corridor.name,
          lat: area.lat,
          lng: area.lng,
          emoji: county.emoji
        });
      });
    });
  });
});

// Quick search function: returns top matches
function searchKenyaLocations(query, limit) {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results = [];

  for (let i = 0; i < ALL_KE_LOCATIONS.length; i++) {
    const loc = ALL_KE_LOCATIONS[i];
    if (loc.searchName.includes(q)) {
      results.push(loc);
      if (results.length >= (limit || 20)) break;
    }
  }
  return results;
}

// Get sub-zones for a parent area name
function getSubZones(parentAreaName) {
  return ALL_KE_LOCATIONS.filter(l => l.type === 'subzone' && l.parentArea === parentAreaName);
}

// Get all areas for a county
function getCountyAreas(countyId) {
  return ALL_KE_LOCATIONS.filter(l => l.countyId === countyId && l.type === 'area');
}

// Popular/Featured areas shown by default in location picker
const POPULAR_KE_AREAS = [
  // Nairobi Hot Zones
  { name: 'All Nairobi', county: 'Nairobi', emoji: '🏙️' },
  { name: 'Ruaka', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Roysambu', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Kasarani', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Zimmerman', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Umoja', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Pipeline', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Embakasi', county: 'Nairobi', emoji: '🏘️' },
  { name: 'South B', county: 'Nairobi', emoji: '🏘️' },
  { name: 'South C', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Kilimani', county: 'Nairobi', emoji: '🏙️' },
  { name: 'Westlands', county: 'Nairobi', emoji: '🏙️' },
  { name: 'Kileleshwa', county: 'Nairobi', emoji: '🏙️' },
  { name: 'Parklands', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Karen', county: 'Nairobi', emoji: '🏡' },
  { name: "Lang'ata", county: 'Nairobi', emoji: '🏘️' },
  { name: 'Kawangware', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Kangemi', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Buruburu', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Donholm', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Kayole', county: 'Nairobi', emoji: '🏘️' },
  { name: 'Komarock', county: 'Nairobi', emoji: '🏘️' },
  // Environs
  { name: 'Ruiru', county: 'Kiambu', emoji: '🌿' },
  { name: 'Juja', county: 'Kiambu', emoji: '🌿' },
  { name: 'Thika', county: 'Kiambu', emoji: '🌿' },
  { name: 'Rongai', county: 'Kajiado', emoji: '🦁' },
  { name: 'Ngong', county: 'Kajiado', emoji: '🦁' },
  { name: 'Kitengela', county: 'Kajiado', emoji: '🦁' },
  { name: 'Athi River', county: 'Kajiado', emoji: '🦁' },
  { name: 'Mlolongo', county: 'Kajiado', emoji: '🦁' },
  { name: 'Syokimau', county: 'Nairobi', emoji: '🏙️' },
  // Other Cities
  { name: 'Mombasa', county: 'Mombasa', emoji: '🌊' },
  { name: 'Nyali', county: 'Mombasa', emoji: '🌊' },
  { name: 'Bamburi', county: 'Mombasa', emoji: '🌊' },
  { name: 'Diani', county: 'Mombasa', emoji: '🌊' },
  { name: 'Kisumu', county: 'Kisumu', emoji: '🌊' },
  { name: 'Nakuru', county: 'Nakuru', emoji: '🦩' },
  { name: 'Eldoret', county: 'Uasin Gishu', emoji: '🏃' },
  { name: 'Thika Town', county: 'Kiambu', emoji: '🌿' },
  { name: 'Naivasha', county: 'Nakuru', emoji: '🦩' },
];

// Backward compatibility — keep old variable names
const NAIROBI_REGIONS = (KENYA_LOCATIONS.nairobi.corridors || []).map(c => ({
  corridorId: c.id,
  corridorName: c.name,
  county: 'Nairobi',
  suburbs: (c.areas || []).flatMap(a => {
    const items = [{ name: a.name, lat: a.lat, lng: a.lng, zone: c.name }];
    (a.subZones || []).forEach(sz => items.push({ name: sz, lat: a.lat, lng: a.lng, zone: c.name }));
    return items;
  })
}));

const ALL_SUBURBS = NAIROBI_REGIONS.flatMap(region =>
  region.suburbs.map(s => ({
    ...s,
    corridorId: region.corridorId,
    corridorName: region.corridorName,
    county: region.county
  }))
);

// Master categories list
const MASTER_CATEGORIES = [
  'Airbnbs / BnBs (Short-Stay)',
  'Single Room',
  'Double Room',
  'Bedsitter / Studio',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
  '4 Bedroom+',
  'Maisonette / Townhouse',
  'Bungalow',
  'Penthouse',
  'Land & Plots',
  'Room in Shared Apartment',
  'Hostels / Student Room',
  'Conference Room / Boardroom',
  'Meeting & Event Hall',
  'Commercial Office / Co-Working',
  'Commercial Shop / Stall',
  'Marketplace (Used Items)'
];

// Service categories
const SERVICE_CATEGORIES = [
  'House Moving & Relocations',
  'Plumbing Services',
  'Electrical Services',
  'Cleaning Services',
  'Painting & Renovation',
  'Pest Control',
  'Security Services',
  'Handyman Services',
  'Carpentry & Furniture',
  'Appliance Repair',
  'Water Tank Cleaning',
  'Garden Maintenance',
  'House Sitting / Pet Care',
  'Safaricom Fibre',
  'Airtel 4G/5G Internet',
  'Jamii Telecom (Faiba)',
  'Zuku Fibre',
  'Liquid Telecom',
  'Internet Installation'
];

// House items for marketplace
const HOUSE_ITEMS = [
  'Kitchen Appliances', 'Furniture & Sofas', 'Beds & Mattresses',
  'Dining Tables & Chairs', 'Wardrobes & Cabinets', 'Electronics & TV',
  'Air Conditioning Units', 'Water Heaters & Tanks', 'Cooking Stoves & Cookers',
  'Washing Machines', 'Fridges & Freezers', 'Wall Mirrors & Decorations',
  'Lighting & Fixtures', 'Door Handles & Locks', 'Paint & Wallpaper',
  'Building Materials', 'Tools & Equipment', 'Books & Media',
  'Sports Equipment', 'Garden Tools'
];

if (typeof window !== 'undefined') {
  window.KENYA_LOCATIONS = KENYA_LOCATIONS;
  window.ALL_KE_LOCATIONS = ALL_KE_LOCATIONS;
  window.POPULAR_KE_AREAS = POPULAR_KE_AREAS;
  window.searchKenyaLocations = searchKenyaLocations;
  window.getSubZones = getSubZones;
  window.getCountyAreas = getCountyAreas;
  // Backward compat
  window.NAIROBI_REGIONS = NAIROBI_REGIONS;
  window.ALL_SUBURBS = ALL_SUBURBS;
  window.MASTER_CATEGORIES = MASTER_CATEGORIES;
  window.SERVICE_CATEGORIES = SERVICE_CATEGORIES;
  window.HOUSE_ITEMS = HOUSE_ITEMS;
}

if (typeof module !== 'undefined') {
  module.exports = {
    KENYA_LOCATIONS, ALL_KE_LOCATIONS, POPULAR_KE_AREAS,
    searchKenyaLocations, getSubZones, getCountyAreas,
    NAIROBI_REGIONS, ALL_SUBURBS, MASTER_CATEGORIES
  };
}
