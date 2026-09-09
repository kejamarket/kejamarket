/**
 * Nairobi Regional Coverage & Locations Database Seed
 * Master Comprehensive List of All Nairobi Suburbs, Estates, Zones & Environs
 * Covering Nairobi County, Kiambu, Machakos, and Kajiado satellite towns.
 */

const NAIROBI_REGIONS = [
  {
    corridorId: 'nairobi_central',
    corridorName: 'Nairobi Central & Urban Core',
    county: 'Nairobi',
    suburbs: [
      { name: 'CBD (City Centre)', lat: -1.286389, lng: 36.817223, zone: 'Central' },
      { name: 'Ngara (Fig Tree & Ngara Rd)', lat: -1.2764, lng: 36.8282, zone: 'Central' },
      { name: 'Ngara West / Chemelil', lat: -1.2730, lng: 36.8210, zone: 'Central' },
      { name: 'Pangani', lat: -1.2709, lng: 36.8375, zone: 'Central' },
      { name: 'Eastleigh Section 1', lat: -1.2750, lng: 36.8480, zone: 'Central' },
      { name: 'Eastleigh Section 2 (11th & 12th St)', lat: -1.2775, lng: 36.8520, zone: 'Central' },
      { name: 'Eastleigh Section 3 / Airbase', lat: -1.2810, lng: 36.8580, zone: 'Central' },
      { name: 'California (Eastleigh)', lat: -1.2798, lng: 36.8485, zone: 'Central' },
      { name: 'Kariokor', lat: -1.2825, lng: 36.8372, zone: 'Central' },
      { name: 'Starehe / Ziwani', lat: -1.2780, lng: 36.8320, zone: 'Central' },
      { name: 'Pumwani', lat: -1.2855, lng: 36.8450, zone: 'Central' },
      { name: 'Majengo', lat: -1.2870, lng: 36.8470, zone: 'Central' },
      { name: 'Gikomba', lat: -1.2840, lng: 36.8390, zone: 'Central' },
      { name: 'Shauri Moyo', lat: -1.2890, lng: 36.8490, zone: 'Central' },
      { name: 'Landimawe', lat: -1.2985, lng: 36.8361, zone: 'Central' },
      { name: 'Parklands (1st to 6th Parklands)', lat: -1.2612, lng: 36.8155, zone: 'Central' },
      { name: 'Highridge (Parklands)', lat: -1.2580, lng: 36.8080, zone: 'Central' },
      { name: 'City Park Environs', lat: -1.2620, lng: 36.8260, zone: 'Central' }
    ]
  },
  {
    corridorId: 'westlands_diplomatic',
    corridorName: 'Westlands & Diplomatic Belt',
    county: 'Nairobi',
    suburbs: [
      { name: 'Westlands (Commercial & Residential)', lat: -1.2675, lng: 36.8058, zone: 'Westlands' },
      { name: 'Rhapta Road', lat: -1.2625, lng: 36.7932, zone: 'Westlands' },
      { name: 'Brookside Drive', lat: -1.2541, lng: 36.7972, zone: 'Westlands' },
      { name: 'Spring Valley', lat: -1.2483, lng: 36.7865, zone: 'Westlands' },
      { name: 'Peponi Road', lat: -1.2420, lng: 36.7915, zone: 'Westlands' },
      { name: 'Kileleshwa (Oloitokitok, Kandara, Siaya)', lat: -1.2801, lng: 36.7862, zone: 'Westlands' },
      { name: 'Kilimani (Dennis Pritt, Argwings Kodhek, Lenana)', lat: -1.2921, lng: 36.7884, zone: 'Westlands' },
      { name: 'Hurlingham', lat: -1.2965, lng: 36.7951, zone: 'Westlands' },
      { name: 'Lavington (James Gichuru, Isaac Gathanju)', lat: -1.2824, lng: 36.7681, zone: 'Westlands' },
      { name: 'Riverside Drive', lat: -1.2721, lng: 36.7944, zone: 'Westlands' },
      { name: 'Muthangari', lat: -1.2711, lng: 36.7725, zone: 'Westlands' },
      { name: 'Valley Arcade', lat: -1.2941, lng: 36.7702, zone: 'Westlands' },
      { name: 'Kyuna', lat: -1.2520, lng: 36.7750, zone: 'Westlands' },
      { name: 'Loresho', lat: -1.2450, lng: 36.7650, zone: 'Westlands' },
      { name: 'Gigiri (UN & Embassy Zone)', lat: -1.2335, lng: 36.8105, zone: 'Westlands' },
      { name: 'Runda (Mimosa, Evergreen, Whispers)', lat: -1.2185, lng: 36.8202, zone: 'Westlands' },
      { name: 'Muthaiga', lat: -1.2583, lng: 36.8322, zone: 'Westlands' },
      { name: 'Nyari Estate', lat: -1.2290, lng: 36.7790, zone: 'Westlands' },
      { name: 'Thigiri', lat: -1.2380, lng: 36.7950, zone: 'Westlands' },
      { name: 'Kitisuru', lat: -1.2390, lng: 36.7680, zone: 'Westlands' }
    ]
  },
  {
    corridorId: 'northern_thika_road',
    corridorName: 'Northern Suburbs & Thika Road Corridor',
    county: 'Nairobi / Kiambu',
    suburbs: [
      { name: 'Mathare North (Area 1-4, Drive-In)', lat: -1.2615, lng: 36.8620, zone: 'Thika Road' },
      { name: 'Mathare 4A / Mlango Kubwa', lat: -1.2640, lng: 36.8550, zone: 'Thika Road' },
      { name: 'Huruma (Kiamaiko, Ngei 1 & 2)', lat: -1.2645, lng: 36.8710, zone: 'Thika Road' },
      { name: 'Kariobangi North', lat: -1.2560, lng: 36.8790, zone: 'Thika Road' },
      { name: 'Kariobangi South', lat: -1.2650, lng: 36.8850, zone: 'Thika Road' },
      { name: 'Korogocho', lat: -1.2510, lng: 36.8890, zone: 'Thika Road' },
      { name: 'Baba Dogo', lat: -1.2480, lng: 36.8750, zone: 'Thika Road' },
      { name: 'Lucky Summer', lat: -1.2420, lng: 36.8850, zone: 'Thika Road' },
      { name: 'Muthaiga North', lat: -1.2395, lng: 36.8480, zone: 'Thika Road' },
      { name: 'Garden Estate', lat: -1.2312, lng: 36.8625, zone: 'Thika Road' },
      { name: 'Thome (Estate 1-5)', lat: -1.2265, lng: 36.8690, zone: 'Thika Road' },
      { name: 'Roysambu (Lumumba, TRM Environs)', lat: -1.2195, lng: 36.8864, zone: 'Thika Road' },
      { name: 'Kasarani (Sports View, Sunton, Seasons)', lat: -1.2241, lng: 36.8992, zone: 'Thika Road' },
      { name: 'Clay City (Kasarani)', lat: -1.2105, lng: 36.9015, zone: 'Thika Road' },
      { name: 'Mirema (Mirema Drive)', lat: -1.2120, lng: 36.8850, zone: 'Thika Road' },
      { name: 'Marurui', lat: -1.2160, lng: 36.8720, zone: 'Thika Road' },
      { name: 'Zimmerman (Base, Kamiti Rd)', lat: -1.2052, lng: 36.8921, zone: 'Thika Road' },
      { name: 'Githurai 44 (Jacaranda, Kamiti)', lat: -1.2010, lng: 36.9080, zone: 'Thika Road' },
      { name: 'Githurai 45 (Mwihoko Border)', lat: -1.1980, lng: 36.9190, zone: 'Thika Road' },
      { name: 'Kahawa West (Kongo, Boma)', lat: -1.1890, lng: 36.8950, zone: 'Thika Road' },
      { name: 'Kahawa Sukari', lat: -1.1965, lng: 36.9285, zone: 'Thika Road' },
      { name: 'Kahawa Wendani (KU Environs)', lat: -1.1925, lng: 36.9320, zone: 'Thika Road' },
      { name: 'Mwihoko (Githurai / Ruiru)', lat: -1.1850, lng: 36.9420, zone: 'Thika Road' },
      { name: 'Mwiki (Kasarani Mwiki)', lat: -1.2280, lng: 36.9250, zone: 'Thika Road' },
      { name: 'Ruiru Town & Kamakis (Eastern Bypass)', lat: -1.1465, lng: 36.9610, zone: 'Thika Road' },
      { name: 'Membley Estate (Ruiru)', lat: -1.1640, lng: 36.9360, zone: 'Thika Road' },
      { name: 'Kimbo / Matopeni (Ruiru)', lat: -1.1350, lng: 36.9720, zone: 'Thika Road' },
      { name: 'Kenyatta Road', lat: -1.1250, lng: 36.9850, zone: 'Thika Road' },
      { name: 'Juja (Juja City Mall, Kalimoni, High Point)', lat: -1.1025, lng: 37.0145, zone: 'Thika Road' },
      { name: 'Thika Town (Section 9, Makongeni, Landless)', lat: -1.0333, lng: 37.0694, zone: 'Thika Road' }
    ]
  },
  {
    corridorId: 'kiambu_northern_bypass',
    corridorName: 'Kiambu Road, Ruaka & Northern Bypass',
    county: 'Kiambu / Nairobi',
    suburbs: [
      { name: 'Ridgeways', lat: -1.2330, lng: 36.8420, zone: 'Kiambu Road' },
      { name: 'Fourways Junction', lat: -1.2215, lng: 36.8450, zone: 'Kiambu Road' },
      { name: 'Edenville (Kiambu Rd)', lat: -1.2150, lng: 36.8410, zone: 'Kiambu Road' },
      { name: 'Thindigua (Kiambu Road)', lat: -1.2045, lng: 36.8415, zone: 'Kiambu Road' },
      { name: 'Kirigiti (Kiambu)', lat: -1.1850, lng: 36.8310, zone: 'Kiambu Road' },
      { name: 'Kiambu Town (CBD & Environs)', lat: -1.1714, lng: 36.8356, zone: 'Kiambu Road' },
      { name: 'Ruaka (Joyland, Gacharage, Slaughter)', lat: -1.2064, lng: 36.7786, zone: 'Northern Bypass' },
      { name: 'Muchatha (Banana-Ruaka Rd)', lat: -1.1980, lng: 36.7720, zone: 'Northern Bypass' },
      { name: 'Ndenderu (Limuru Junction)', lat: -1.1870, lng: 36.7580, zone: 'Northern Bypass' },
      { name: 'Banana (Banana Hill / Karuri)', lat: -1.1760, lng: 36.7460, zone: 'Northern Bypass' },
      { name: 'Karuri Town', lat: -1.1820, lng: 36.7640, zone: 'Northern Bypass' },
      { name: 'Gachie', lat: -1.2210, lng: 36.7620, zone: 'Northern Bypass' },
      { name: 'Mwimuto / Lower Kabete', lat: -1.2350, lng: 36.7550, zone: 'Northern Bypass' },
      { name: 'Wangige Town', lat: -1.2380, lng: 36.7150, zone: 'Northern Bypass' },
      { name: 'King\'eero', lat: -1.2290, lng: 36.7280, zone: 'Northern Bypass' },
      { name: 'Rosslyn / Two Rivers Environs', lat: -1.2250, lng: 36.7950, zone: 'Northern Bypass' },
      { name: 'Redhill / Cianda', lat: -1.1850, lng: 36.7120, zone: 'Northern Bypass' },
      { name: 'Tigoni (Tea Estates & Limuru)', lat: -1.1450, lng: 36.6780, zone: 'Northern Bypass' },
      { name: 'Limuru Town', lat: -1.1130, lng: 36.6430, zone: 'Northern Bypass' }
    ]
  },
  {
    corridorId: 'dagoretti_waiyaki_way',
    corridorName: 'Waiyaki Way, Kangemi, Uthiru & Kikuyu Corridor',
    county: 'Nairobi / Kiambu',
    suburbs: [
      { name: 'Kangemi (Waruku, Gichagi, Sodom, Central)', lat: -1.2640, lng: 36.7510, zone: 'Waiyaki Way' },
      { name: 'Mountain View Estate', lat: -1.2580, lng: 36.7430, zone: 'Waiyaki Way' },
      { name: 'Uthiru (87, Cooperation, ILRI, Ndumboini)', lat: -1.2610, lng: 36.7220, zone: 'Waiyaki Way' },
      { name: 'Kinoo (Muthiga, Gitaru Stage)', lat: -1.2580, lng: 36.7020, zone: 'Waiyaki Way' },
      { name: 'Muthiga (Waiyaki Way)', lat: -1.2540, lng: 36.6850, zone: 'Waiyaki Way' },
      { name: 'Regen Estate', lat: -1.2510, lng: 36.6890, zone: 'Waiyaki Way' },
      { name: 'Gitaru', lat: -1.2490, lng: 36.6780, zone: 'Waiyaki Way' },
      { name: 'Kabete (Upper & Lower Kabete, Vet Lab)', lat: -1.2650, lng: 36.7320, zone: 'Waiyaki Way' },
      { name: 'Kikuyu Town (Ondiri, Thogoto, Kidfarmaco)', lat: -1.2480, lng: 36.6640, zone: 'Waiyaki Way' },
      { name: 'Thogoto (Kikuyu)', lat: -1.2620, lng: 36.6690, zone: 'Waiyaki Way' },
      { name: 'Gikambura / Kamangu', lat: -1.2720, lng: 36.6420, zone: 'Waiyaki Way' },
      { name: 'Zambezi / Sigona / Muguga', lat: -1.2380, lng: 36.6350, zone: 'Waiyaki Way' },
      { name: 'Kawangware Stage 2', lat: -1.2890, lng: 36.7510, zone: 'Dagoretti' },
      { name: 'Kawangware Stage 46 (Naivasha Rd)', lat: -1.2850, lng: 36.7460, zone: 'Dagoretti' },
      { name: 'Kawangware Stage 56 (Muslim/Coast)', lat: -1.2810, lng: 36.7390, zone: 'Dagoretti' },
      { name: 'Riruta Satellite (Near Corner & K-Rep)', lat: -1.2910, lng: 36.7450, zone: 'Dagoretti' },
      { name: 'Waithaka (Shopping Centre & Environs)', lat: -1.2780, lng: 36.7210, zone: 'Dagoretti' },
      { name: 'Dagoretti Corner (Ngong Rd Junction)', lat: -1.3005, lng: 36.7580, zone: 'Dagoretti' },
      { name: 'Dagoretti Market / Mutu-ini / Ruthimitu', lat: -1.2950, lng: 36.7110, zone: 'Dagoretti' }
    ]
  },
  {
    corridorId: 'southern_langata_kibra',
    corridorName: "Southern Suburbs, Lang'ata, Kibra & Karen",
    county: 'Nairobi',
    suburbs: [
      { name: 'Kibra / Kibera (Olympic Estate & Plaza)', lat: -1.3120, lng: 36.7850, zone: 'Kibra' },
      { name: 'Kibra (Ayany Estate)', lat: -1.3080, lng: 36.7790, zone: 'Kibra' },
      { name: 'Kibra (Makina & Karanja Rd)', lat: -1.3140, lng: 36.7890, zone: 'Kibra' },
      { name: 'Kibra (Lindi, Silanga, Mashimoni)', lat: -1.3170, lng: 36.7930, zone: 'Kibra' },
      { name: 'Kibra (Gatwekera, Kisumu Ndogo, Soweto)', lat: -1.3190, lng: 36.7820, zone: 'Kibra' },
      { name: 'Woodley / Jamhuri (Adams Arcade border)', lat: -1.3040, lng: 36.7780, zone: 'Southern' },
      { name: 'Ngumo Estate (Golf Course border)', lat: -1.3080, lng: 36.7950, zone: 'Southern' },
      { name: 'Highrise Estate (Mbagathi Way)', lat: -1.3090, lng: 36.8060, zone: 'Southern' },
      { name: 'Madaraka Estate (Strathmore Environs)', lat: -1.3050, lng: 36.8180, zone: 'Southern' },
      { name: 'Nairobi West (Birch, Gandhi Ave, Kobil)', lat: -1.3120, lng: 36.8240, zone: 'Southern' },
      { name: 'South B (Hazina, Sana Sana, Plainsview, Golden Gate)', lat: -1.3160, lng: 36.8370, zone: 'Southern' },
      { name: 'South C (Bellevue, Mugoya, Five Star, Akiba)', lat: -1.3220, lng: 36.8290, zone: 'Southern' },
      { name: 'Lang\'ata (Otiende & Shopping Center)', lat: -1.3320, lng: 36.7650, zone: 'Southern' },
      { name: 'Lang\'ata (Dam Estate & Wilson border)', lat: -1.3280, lng: 36.7780, zone: 'Southern' },
      { name: 'Lang\'ata (Ngei 1 & 2)', lat: -1.3370, lng: 36.7720, zone: 'Southern' },
      { name: 'Lang\'ata (Sunvalley, Royal Park, Phenom)', lat: -1.3410, lng: 36.7610, zone: 'Southern' },
      { name: 'Lang\'ata (Southlands & Carnivore Environs)', lat: -1.3350, lng: 36.7820, zone: 'Southern' },
      { name: 'Karen (Shopping Centre & Crossroads)', lat: -1.3195, lng: 36.7065, zone: 'Southern' },
      { name: 'Karen (Hardy & Bogani)', lat: -1.3450, lng: 36.7450, zone: 'Southern' },
      { name: 'Karen (Mbagathi / Kuwinda)', lat: -1.3280, lng: 36.7380, zone: 'Southern' },
      { name: 'Karen (Windy Ridge & Kerarapon)', lat: -1.3350, lng: 36.6850, zone: 'Southern' },
      { name: 'Upper Hill (Hospital & Financial Hub)', lat: -1.2970, lng: 36.8140, zone: 'Southern' }
    ]
  },
  {
    corridorId: 'eastlands_outer_ring',
    corridorName: 'Eastlands, Outer Ring, Jogoo & Kangundo Road',
    county: 'Nairobi / Machakos',
    suburbs: [
      { name: 'Dandora Phase 1 & 2', lat: -1.2530, lng: 36.8980, zone: 'Eastlands' },
      { name: 'Dandora Phase 3, 4 & 5', lat: -1.2580, lng: 36.9050, zone: 'Eastlands' },
      { name: 'Buru Buru (Phases 1 to 5, Mesora)', lat: -1.2910, lng: 36.8780, zone: 'Eastlands' },
      { name: 'Donholm (Old & Greenfields Phase 1-3)', lat: -1.3015, lng: 36.8870, zone: 'Eastlands' },
      { name: 'Harambee / Jericho / Maringo', lat: -1.2940, lng: 36.8680, zone: 'Eastlands' },
      { name: 'Uhuru Estate / Lumumba / Kaloleni', lat: -1.2920, lng: 36.8580, zone: 'Eastlands' },
      { name: 'Tena Estate (Manyanja Road)', lat: -1.2970, lng: 36.8910, zone: 'Eastlands' },
      { name: 'Umoja 1 (Innercore, Unity)', lat: -1.2880, lng: 36.8980, zone: 'Eastlands' },
      { name: 'Umoja 2 & Umoja Innercore', lat: -1.2860, lng: 36.9020, zone: 'Eastlands' },
      { name: 'Savannah Estate (Donholm border)', lat: -1.2990, lng: 36.8990, zone: 'Eastlands' },
      { name: 'Pipeline (Stage, Tumaini, Plot 10)', lat: -1.3210, lng: 36.8950, zone: 'Eastlands' },
      { name: 'Fedha Estate & Telaviv', lat: -1.3230, lng: 36.9020, zone: 'Eastlands' },
      { name: 'Tassia (Hill View & Outering border)', lat: -1.3190, lng: 36.9080, zone: 'Eastlands' },
      { name: 'Avenue Park 1 & 2 (Embakasi)', lat: -1.3170, lng: 36.9040, zone: 'Eastlands' },
      { name: 'Nyayo Estate Embakasi (Gates A-F)', lat: -1.3150, lng: 36.9120, zone: 'Eastlands' },
      { name: 'Embakasi Village / Baraka Estate', lat: -1.3180, lng: 36.9180, zone: 'Eastlands' },
      { name: 'Kayole (Junction, Prime, Masimba)', lat: -1.2790, lng: 36.9250, zone: 'Eastlands' },
      { name: 'Soweto Kayole', lat: -1.2740, lng: 36.9320, zone: 'Eastlands' },
      { name: 'Komarock (Sectors 1, 2, 3, 3A, 4)', lat: -1.2690, lng: 36.9150, zone: 'Eastlands' },
      { name: 'Saika Estate (Kangundo Road)', lat: -1.2640, lng: 36.9220, zone: 'Eastlands' },
      { name: 'Njiru / Obama Estate', lat: -1.2580, lng: 36.9450, zone: 'Eastlands' },
      { name: 'Mihang\'o (Utawala border)', lat: -1.2780, lng: 36.9620, zone: 'Eastlands' },
      { name: 'Utawala (Shooters, Benedicta, Githunguri)', lat: -1.2920, lng: 36.9740, zone: 'Eastlands' },
      { name: 'Chokaa (Kangundo Road)', lat: -1.2680, lng: 36.9850, zone: 'Eastlands' },
      { name: 'Ruai (Ruai Town, Quickmart, Bypass)', lat: -1.2720, lng: 37.0120, zone: 'Eastlands' },
      { name: 'Kamulu (Kangundo Road)', lat: -1.2830, lng: 37.0750, zone: 'Eastlands' },
      { name: 'Joska Town', lat: -1.2950, lng: 37.1350, zone: 'Eastlands' },
      { name: 'Malaa / Kantafu / Koma Hill', lat: -1.3050, lng: 37.1850, zone: 'Eastlands' }
    ]
  },
  {
    corridorId: 'mombasa_road_satellite',
    corridorName: 'Mombasa Road, Syokimau, Athi River & Kitengela',
    county: 'Nairobi / Machakos / Kajiado',
    suburbs: [
      { name: 'Imara Daima (Villa Franca, AA, Muimara)', lat: -1.3320, lng: 36.8750, zone: 'Mombasa Road' },
      { name: 'Mukuru kwa Njenga / Kwa Reuben', lat: -1.3210, lng: 36.8710, zone: 'Mombasa Road' },
      { name: 'Syokimau (Airport Rd, Gateway Mall, Katani Rd)', lat: -1.3595, lng: 36.9380, zone: 'Mombasa Road' },
      { name: 'Katani (Syokimau Environs)', lat: -1.3820, lng: 37.0150, zone: 'Mombasa Road' },
      { name: 'Mlolongo (Phase 3, Weighbridge, Expressway End)', lat: -1.3850, lng: 36.9620, zone: 'Mombasa Road' },
      { name: 'Greatwall Gardens & Area (Mlolongo/Athi River)', lat: -1.3890, lng: 36.9720, zone: 'Mombasa Road' },
      { name: 'Sabaki Estate', lat: -1.4120, lng: 36.9680, zone: 'Mombasa Road' },
      { name: 'Athi River (Green Park, Crystal Rivers, Makadara)', lat: -1.4520, lng: 36.9830, zone: 'Mombasa Road' },
      { name: 'Daystar / Lukenya Environs', lat: -1.4420, lng: 37.0250, zone: 'Mombasa Road' },
      { name: 'Kitengela Town (CBD, Chuna, Milimani, Deliverance)', lat: -1.4780, lng: 36.9580, zone: 'Mombasa Road' },
      { name: 'Kitengela (Yukos, New Valley, Acacia, Noonkopir)', lat: -1.4920, lng: 36.9650, zone: 'Mombasa Road' },
      { name: 'Isinya / Kajiado Road', lat: -1.6500, lng: 36.8500, zone: 'Mombasa Road' }
    ]
  },
  {
    corridorId: 'ngong_rongai_satellite',
    corridorName: 'Ngong Road, Ongata Rongai, Kiserian & Ngong Hills',
    county: 'Kajiado / Nairobi',
    suburbs: [
      { name: 'Ongata Rongai (Maasai Lodge, Tuskys, Tumaini)', lat: -1.3960, lng: 36.7580, zone: 'Rongai' },
      { name: 'Rongai (Rimpa, Kandisi, Mayor Rd, Laiser Hill)', lat: -1.4120, lng: 36.7490, zone: 'Rongai' },
      { name: 'Rongai (Ole Kasasi / Nazarene Environs)', lat: -1.4020, lng: 36.7720, zone: 'Rongai' },
      { name: 'Kiserian Town (CBD, Pipeline Rd, Oloosirkon)', lat: -1.4380, lng: 36.7260, zone: 'Rongai' },
      { name: 'Matasia (Ngong-Kiserian Rd)', lat: -1.4080, lng: 36.6890, zone: 'Ngong' },
      { name: 'Ngong Town (CBD, Milele Mall, Stage)', lat: -1.3610, lng: 36.6570, zone: 'Ngong' },
      { name: 'Ngong (Kibiko, Ololua, Juanco, Vet)', lat: -1.3520, lng: 36.6420, zone: 'Ngong' },
      { name: 'Bulbul / Kerarapon (Ngong-Karen Border)', lat: -1.3410, lng: 36.6780, zone: 'Ngong' }
    ]
  }
];

// Flat list of all suburbs with parent corridor metadata
const ALL_SUBURBS = NAIROBI_REGIONS.flatMap(region =>
  region.suburbs.map(s => ({
    ...s,
    corridorId: region.corridorId,
    corridorName: region.corridorName,
    county: region.county
  }))
);

// Master categories list starting with Single Rooms, Shared Rooms, Apartments, Commercial/Conference Rooms up to BnBs
const MASTER_CATEGORIES = [
  'Single Room',
  'Bedsitter / Studio',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
  '4 Bedroom+',
  'Maisonette / Townhouse',
  'Bungalow',
  'Penthouse',
  'Room in Shared Apartment',
  'Hostels / Student Room',
  'Conference Room / Boardroom',
  'Meeting & Event Hall',
  'Commercial Office / Co-Working',
  'Commercial Shop / Stall',
  'BnB / Airbnb (Daily Stay)',
  'Studio BnB (Short-Stay)',
  '1 & 2 Bedroom BnB (Furnished)',
  'Luxury Villa / Vacation Stay',
  'Serviced / Furnished'
];
