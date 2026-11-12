/**
 * KejaMarket Mobile Controller (Version 35.0)
 * Native mobile feel, speed, and trusted Kenya classifieds/rental UX.
 */

(function() {
  'use strict';

  // Global Mobile State
  const State = {
    currentScreen: 'home',
    viewMode: localStorage.getItem('keja_mobile_view') || 'grid', // 'grid' (2-col) or 'list' (1-col)
    properties: [],
    filteredProperties: [],
    selectedProperty: null,
    selectedCategory: 'all',
    selectedLocation: 'Nairobi',
    selectedSort: 'newest',
    activePhotoIndex: 0,
    searchQuery: '',
    favorites: JSON.parse(localStorage.getItem('keja_favorites') || '[]'),
    viewingRequests: JSON.parse(localStorage.getItem('keja_viewings') || '[]'),
    messages: [],
    activeChatPropertyId: null,
    filters: {
      type: 'all',
      minPrice: null,
      maxPrice: null,
      location: '',
      beds: 'any'
    },
    activeFilterCounty: 'all',
    countdownTarget: null,
    countdownInterval: null,
    selectedViewingType: 'physical',
    selectedViewingTime: '10:00 AM'
  };

  // Comprehensive Kenya Counties & Residential Areas Master Database for Filters
  // Covers all 47 counties with County → Area → Sub-Zone breakdown
  const KENYA_COUNTY_AREAS = {
    all: {
      name: 'All Kenya',
      emoji: '🇰🇪',
      areas: [
        { name: 'All Areas (Kenya)', val: '' },
        { name: 'Westlands', val: 'Westlands', county: 'Nairobi', subZones: ['Sarit Centre', 'Rhapta Rd', 'Mpaka Rd', 'Muthithi Rd', 'Parklands Rd'] },
        { name: 'Kilimani', val: 'Kilimani', county: 'Nairobi', subZones: ['Yaya Centre', 'Argwings Kodhek', 'Dennis Pritt', 'Wood Avenue', 'Chania Avenue'] },
        { name: 'Kileleshwa', val: 'Kileleshwa', county: 'Nairobi', subZones: ['Gatundu Rd', 'Kandara Rd', 'Othaya Rd', 'Siaya Rd'] },
        { name: 'Roysambu', val: 'Roysambu', county: 'Nairobi', subZones: ['Lumumba Drive', 'TRM Drive', 'Mirema Drive', 'USIU Rd'] },
        { name: 'Kasarani', val: 'Kasarani', county: 'Nairobi', subZones: ['Clay City', 'Seasons', 'Hunters', 'Sunton', 'Sportsview', 'Mwiki'] },
        { name: 'Ruaka (Kiambu)', val: 'Ruaka', county: 'Kiambu', subZones: ['Joyland', 'Two Rivers', 'Ruaka Town', 'Banana Rd', 'Gacharage', 'Ruaka Bypass'] },
        { name: 'Syokimau (Machakos)', val: 'Syokimau', county: 'Machakos', subZones: ['Katani Rd', 'Airport Rd', 'Gateway Mall', 'Mwananchi Rd', 'Community Rd', 'Kiungani Rd'] },
        { name: 'Mlolongo (Machakos)', val: 'Mlolongo', county: 'Machakos', subZones: ['Phase 1', 'Phase 2', 'Phase 3 (Weighbridge)', 'Phase 4', 'Expressway End'] },
        { name: 'Ongata Rongai (Kajiado)', val: 'Ongata Rongai', county: 'Kajiado', subZones: ['Maasai Lodge', 'Rimpa', 'Kandisi', 'Mayor Rd', 'Laiser Hill', 'Nazarene'] },
        { name: 'Kitengela (Kajiado)', val: 'Kitengela', county: 'Kajiado', subZones: ['Chuna', 'Yukos', 'Acacia', 'Milimani', 'New Valley', 'Noonkopir'] },
        { name: 'Ruiru (Kiambu)', val: 'Ruiru', county: 'Kiambu', subZones: ['Kihunguro', 'Mugutha', 'Kimbo', 'Toll Station', 'Murera', 'Membley'] },
        { name: 'Thika (Kiambu)', val: 'Thika', county: 'Kiambu', subZones: ['Section 9', 'Ngoingwa', 'Landless', 'Makongeni', 'Thika CBD'] },
        { name: 'Athi River (Machakos)', val: 'Athi River', county: 'Machakos', subZones: ['Green Park', 'Crystal Rivers', 'Makadara', 'Mavoko Town', 'Greatwall Gardens'] },
        { name: 'Ngong Town (Kajiado)', val: 'Ngong', county: 'Kajiado', subZones: ['Ngong CBD', 'Milele Mall Area', 'Kibiko', 'Matasia', 'Bulbul'] },
        { name: 'South B', val: 'South B', county: 'Nairobi', subZones: ['Mariakani', 'Plainsview', 'Golden Gate', 'Balozi', 'Hazina'] },
        { name: 'South C', val: 'South C', county: 'Nairobi', subZones: ['Akiba', 'Mugoya', 'Five Star', 'Bellevue'] },
        { name: 'Umoja', val: 'Umoja', county: 'Nairobi', subZones: ['Umoja I', 'Umoja II', 'Umoja Innercore'] },
        { name: 'Pipeline', val: 'Pipeline', county: 'Nairobi', subZones: ['Stage', 'Plot 10', 'Tumaini Area'] },
        { name: 'Donholm', val: 'Donholm', county: 'Nairobi', subZones: ['Phase 1', 'Phase 2', 'Greenspan', 'Greenfields'] },
        { name: 'Dandora', val: 'Dandora', county: 'Nairobi', subZones: ['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Phase V'] },
        { name: 'Eastleigh', val: 'Eastleigh', county: 'Nairobi', subZones: ['Section I', 'Section II', 'Section III', 'Section IV', 'Section V', 'California'] },
        { name: 'Nyali (Mombasa)', val: 'Nyali', county: 'Mombasa', subZones: ['Links Rd', 'Cinemax', 'Beach Rd', 'Nyali Estate', 'Greenwood'] },
        { name: 'Nakuru City', val: 'Nakuru', county: 'Nakuru', subZones: ['Milimani', 'Naka', 'Section 58', 'Kiamunyi'] },
        { name: 'Kisumu City', val: 'Kisumu', county: 'Kisumu', subZones: ['Milimani', 'Riat Hills', 'Tom Mboya', 'Migosi'] },
        { name: 'Eldoret City', val: 'Eldoret', county: 'Uasin Gishu', subZones: ['Elgon View', 'Pioneer', 'Kapsoya', 'Annex'] },
        { name: 'Meru Town', val: 'Meru', county: 'Meru', subZones: ['Makutano', 'Gatunga', 'Gitimene'] },
        { name: 'Embu Town', val: 'Embu', county: 'Embu', subZones: ['Embu CBD', 'Kamiu'] },
        { name: 'Nyeri Town', val: 'Nyeri', county: 'Nyeri', subZones: ['Nyeri CBD', 'Ruring\'u', 'Kamakwa'] },
        { name: 'Nanyuki Town', val: 'Nanyuki', county: 'Laikipia', subZones: ['Baraka', 'Lewa Gate', 'Nanyuki CBD'] }
      ]
    },
    nairobi: {
      name: 'Nairobi City',
      emoji: '🏙️',
      areas: [
        { name: 'All Nairobi', val: 'Nairobi' },
        // - West Nairobi
        { name: 'Westlands', val: 'Westlands', subZones: ['Sarit Centre', 'Rhapta Rd', 'Mpaka Rd', 'Muthithi Rd', 'Parklands Rd'] },
        { name: 'Kilimani', val: 'Kilimani', subZones: ['Yaya Centre', 'Argwings Kodhek', 'Dennis Pritt', 'Wood Avenue', 'Chania Avenue'] },
        { name: 'Kileleshwa', val: 'Kileleshwa', subZones: ['Gatundu Rd', 'Kandara Rd', 'Othaya Rd', 'Siaya Rd'] },
        { name: 'Lavington', val: 'Lavington', subZones: ['James Gichuru', 'Amboseli', 'Valley Arcade', 'Kabarsiran'] },
        { name: 'Parklands', val: 'Parklands', subZones: ['1st Parklands', '2nd Parklands', '3rd Parklands', '4th Parklands', '5th Parklands', 'City Park'] },
        { name: 'Spring Valley', val: 'Spring Valley', subZones: [] },
        { name: 'Riverside', val: 'Riverside', subZones: ['Riverside Drive', 'Riverside Square'] },
        { name: 'Loresho', val: 'Loresho', subZones: ['Loresho Ridge', 'Loresho South'] },
        { name: 'Kitisuru', val: 'Kitisuru', subZones: ['Old Kitisuru', 'New Kitisuru'] },
        { name: 'Runda', val: 'Runda', subZones: ['Runda Mimosa', 'Runda Evergreen', 'Runda Water'] },
        { name: 'Muthaiga', val: 'Muthaiga', subZones: ['Old Muthaiga', 'Muthaiga North'] },
        { name: 'Hurlingham', val: 'Hurlingham', subZones: ['Argwings Kodhek Link', 'Olenguruone'] },
        { name: 'Upper Hill', val: 'Upper Hill', subZones: [] },
        { name: 'Ngong Road', val: 'Ngong Road', subZones: ['Adams Arcade', 'Junction Mall', 'Dagoretti Corner'] },
        { name: 'Karen', val: 'Karen', subZones: ['Hardy', 'Karen Triangle', 'Mbagathi', 'Windy Ridge', 'Bogani'] },
        { name: 'Lang\'ata', val: 'Lang\'ata', subZones: ['Dam Estate', 'Ngei', 'Otiende', 'Southlands'] },
        { name: 'Lower Kabete', val: 'Lower Kabete', subZones: ['Waiyaki Way', 'Regen'] },
        { name: 'Mountain View', val: 'Mountain View', subZones: [] },
        { name: 'Kangemi', val: 'Kangemi', subZones: ['Kawangware Stage', 'Kangemi Market'] },
        { name: 'Kawangware', val: 'Kawangware', subZones: ['45', 'Kawangware Stage', 'Regen'] },
        { name: 'Riruta', val: 'Riruta', subZones: ['Riruta Satellite'] },
        { name: 'Dagoretti', val: 'Dagoretti', subZones: ['Dagoretti Corner', 'Dagoretti Market'] },
        { name: 'Kibera', val: 'Kibera', subZones: ['Laini Saba', 'Gatwekera', 'Olympic', 'Karanja', 'Ayany'] },
        { name: 'Woodley', val: 'Woodley', subZones: [] },
        { name: 'Ngumo', val: 'Ngumo', subZones: [] },
        { name: 'Jamhuri', val: 'Jamhuri', subZones: [] },
        // - South Nairobi
        { name: 'South B', val: 'South B', subZones: ['Mariakani', 'Plainsview', 'Golden Gate', 'Balozi', 'Hazina'] },
        { name: 'South C', val: 'South C', subZones: ['Akiba', 'Mugoya', 'Five Star', 'Bellevue'] },
        { name: 'Nairobi West', val: 'Nairobi West', subZones: ['West Shopping Centre', 'Gandhi Hospital Area'] },
        { name: 'Madaraka', val: 'Madaraka', subZones: ['Strathmore Area', 'Madaraka Estate'] },
        // - CBD & North
        { name: 'Nairobi CBD', val: 'Nairobi CBD', subZones: ['Tom Mboya St', 'Moi Avenue', 'Kimathi St'] },
        { name: 'Ngara', val: 'Ngara', subZones: ['Fig Tree', 'Chambers Rd', 'Ngara Posta'] },
        { name: 'Pangani', val: 'Pangani', subZones: ['Pangani Girls Area', 'Thika Rd Interchange'] },
        { name: 'Eastleigh', val: 'Eastleigh', subZones: ['Section I', 'Section II', 'Section III', 'Section IV', 'Section V', 'California'] },
        { name: 'Shauri Moyo', val: 'Shauri Moyo', subZones: [] },
        { name: 'Pumwani', val: 'Pumwani', subZones: [] },
        { name: 'Majengo', val: 'Majengo', subZones: [] },
        { name: 'Gikomba', val: 'Gikomba', subZones: [] },
        // - Kasarani & North Nairobi
        { name: 'Roysambu', val: 'Roysambu', subZones: ['Lumumba Drive', 'TRM Drive', 'Mirema Drive', 'USIU Rd'] },
        { name: 'Kasarani', val: 'Kasarani', subZones: ['Clay City', 'Seasons', 'Hunters', 'Sunton', 'Sportsview', 'Mwiki'] },
        { name: 'Zimmerman', val: 'Zimmerman', subZones: ['Base', 'Kamakis Link', 'Roysambu Border'] },
        { name: 'Githurai 44', val: 'Githurai 44', subZones: ['Jacaranda Area', 'Stage 44'] },
        { name: 'Githurai 45', val: 'Githurai 45', subZones: [] },
        { name: 'Kahawa West', val: 'Kahawa West', subZones: ['Kongo', 'Soweto Area', 'Bima'] },
        { name: 'Kahawa Sukari', val: 'Kahawa Sukari', subZones: ['1st South Ave', 'Quickmart Area'] },
        { name: 'Kahawa Wendani', val: 'Kahawa Wendani', subZones: ['Magunas Area', 'Matatu Stage'] },
        { name: 'Mwiki', val: 'Mwiki', subZones: [] },
        { name: 'Sunton', val: 'Sunton', subZones: [] },
        { name: 'Baba Dogo', val: 'Baba Dogo', subZones: [] },
        { name: 'Lucky Summer', val: 'Lucky Summer', subZones: [] },
        { name: 'Mathare', val: 'Mathare', subZones: [] },
        { name: 'Huruma', val: 'Huruma', subZones: [] },
        { name: 'Kariobangi North', val: 'Kariobangi North', subZones: [] },
        { name: 'Kariobangi South', val: 'Kariobangi South', subZones: [] },
        { name: 'Korogocho', val: 'Korogocho', subZones: [] },
        // - East Nairobi
        { name: 'Umoja', val: 'Umoja', subZones: ['Umoja I', 'Umoja II', 'Umoja Innercore'] },
        { name: 'Donholm', val: 'Donholm', subZones: ['Phase 1', 'Phase 2', 'Phase 5', 'Greenspan', 'Greenfields'] },
        { name: 'Buruburu', val: 'Buruburu', subZones: ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'] },
        { name: 'Kayole', val: 'Kayole', subZones: ['Kayole I', 'Kayole II', 'Kayole III'] },
        { name: 'Dandora', val: 'Dandora', subZones: ['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Phase V'] },
        { name: 'Komarock', val: 'Komarock', subZones: [] },
        // - South East Nairobi
        { name: 'Embakasi', val: 'Embakasi', subZones: ['Village', 'Nyayo Estate', 'Baraka Estate', 'Tassia'] },
        { name: 'Pipeline', val: 'Pipeline', subZones: ['Stage', 'Plot 10', 'Tumaini Area'] },
        { name: 'Fedha', val: 'Fedha', subZones: ['Fedha Stage', 'Gate B', 'Avenue Park'] },
        { name: 'Tassia', val: 'Tassia', subZones: [] },
        { name: 'Nyayo Estate', val: 'Nyayo Estate', subZones: [] },
        { name: 'Utawala', val: 'Utawala', subZones: [] },
        { name: 'Ruai', val: 'Ruai', subZones: [] },
        { name: 'Njiru', val: 'Njiru', subZones: [] },
        { name: 'Mihang\'o', val: 'Mihango', subZones: [] },
        { name: 'Imara Daima', val: 'Imara Daima', subZones: [] },
        { name: 'Mukuru kwa Njenga', val: 'Mukuru kwa Njenga', subZones: [] },
        { name: 'Mukuru kwa Reuben', val: 'Mukuru kwa Reuben', subZones: [] },
        { name: 'Industrial Area', val: 'Industrial Area', subZones: [] }
      ]
    },
    kiambu: {
      name: 'Kiambu County',
      emoji: '🌿',
      areas: [
        { name: 'All Kiambu', val: 'Kiambu' },
        { name: 'Ruaka', val: 'Ruaka', subZones: ['Joyland', 'Two Rivers', 'Ruaka Town', 'Banana Rd', 'Gacharage', 'Ruaka Bypass'] },
        { name: 'Kikuyu', val: 'Kikuyu', subZones: ['Kikuyu Town', 'Thogoto', 'Ondiri', 'Kidfarmaco', 'Gitaru Rd'] },
        { name: 'Ruiru', val: 'Ruiru', subZones: ['Kihunguro', 'Mugutha', 'Kimbo', 'Toll Station', 'Murera', 'Membley'] },
        { name: 'Thika', val: 'Thika', subZones: ['Section 9', 'Ngoingwa', 'Landless', 'Makongeni', 'Thika CBD'] },
        { name: 'Juja', val: 'Juja', subZones: ['Juja Town', 'Gachororo', 'Juja South Estate', 'Mastore', 'Highpoint'] },
        { name: 'Ndenderu', val: 'Ndenderu', subZones: ['Ndenderu Junction', 'Posta Area'] },
        { name: 'Banana / Karuri', val: 'Banana', subZones: ['Banana Hill', 'Karuri Town', 'Muchatha'] },
        { name: 'Kahawa Sukari', val: 'Kahawa Sukari', subZones: ['1st South Ave', 'Quickmart Area', 'Bypass Link'] },
        { name: 'Kahawa Wendani', val: 'Kahawa Wendani', subZones: ['Magunas Area', 'Matatu Stage'] },
        { name: 'Kiambu Road', val: 'Kiambu Road', subZones: ['Fourways Junction', 'Edenville', 'Thindigua', 'Mugumo'] },
        { name: 'Gitaru', val: 'Gitaru', subZones: ['Southern Bypass Interchange', 'Rungiri'] },
        { name: 'Wangige', val: 'Wangige', subZones: ['Wangige Market', 'King\'eero'] },
        { name: 'Limuru', val: 'Limuru', subZones: ['Limuru Town', 'Tigoni', 'Kabuku'] },
        { name: 'Kabete', val: 'Kabete', subZones: ['Lower Kabete', 'Upper Kabete', 'Uthiru'] },
        { name: 'Githunguri', val: 'Githunguri', subZones: ['Githunguri CBD', 'Dairy Area'] },
        { name: 'Kiambu Town', val: 'Kiambu Town', subZones: ['Kiambu CBD', 'County HQ Area'] },
        { name: 'Tatu City', val: 'Tatu City', subZones: ['Gate 1', 'Gate 2', 'Residential Zone'] },
        { name: 'Zambezi', val: 'Zambezi', subZones: ['Zambezi Estate', 'Regen Link'] },
        { name: 'Kinoo', val: 'Kinoo', subZones: ['Kinoo Market', 'Waiyaki Way Link'] },
        { name: 'Ridgeways', val: 'Ridgeways', subZones: ['Ridgeways Mall Area'] }
      ]
    },
    machakos: {
      name: 'Machakos County',
      emoji: '✈️',
      areas: [
        { name: 'All Machakos', val: 'Machakos' },
        { name: 'Syokimau', val: 'Syokimau', subZones: ['Katani Rd', 'Airport Rd', 'Gateway Mall', 'Mwananchi Rd', 'Community Rd', 'Kiungani Rd'] },
        { name: 'Mlolongo', val: 'Mlolongo', subZones: ['Phase 1', 'Phase 2', 'Phase 3 (Weighbridge)', 'Phase 4', 'Expressway End'] },
        { name: 'Athi River', val: 'Athi River', subZones: ['Green Park', 'Crystal Rivers', 'Makadara', 'Mavoko Town', 'Greatwall Gardens'] },
        { name: 'Katani', val: 'Katani', subZones: ['Katani Shopping Centre', 'Shengli Rd'] },
        { name: 'Kamulu', val: 'Kamulu', subZones: ['Kamulu Town', 'Stage 26'] },
        { name: 'Joska', val: 'Joska', subZones: ['Joska Town', 'KBC Road'] },
        { name: 'Malaa', val: 'Malaa', subZones: [] },
        { name: 'Machakos Town', val: 'Machakos Town', subZones: ['Machakos CBD', 'Kalama', 'Mumbuni', 'Katoloni'] },
        { name: 'Kangundo', val: 'Kangundo', subZones: ['Kangundo Town'] },
        { name: 'Tala', val: 'Tala', subZones: ['Tala Market', 'Tala Bypass'] },
        { name: 'Lukenya', val: 'Lukenya', subZones: ['Daystar University Area', 'Lukenya Hills'] },
        { name: 'Mitaboni', val: 'Mitaboni', subZones: [] },
        { name: 'Yatta', val: 'Yatta', subZones: [] }
      ]
    },
    kajiado: {
      name: 'Kajiado County',
      emoji: '🦁',
      areas: [
        { name: 'All Kajiado', val: 'Kajiado' },
        { name: 'Ongata Rongai', val: 'Ongata Rongai', subZones: ['Maasai Lodge', 'Tuskys Area', 'Rimpa', 'Kandisi', 'Mayor Rd', 'Laiser Hill', 'Nazarene Area'] },
        { name: 'Kitengela', val: 'Kitengela', subZones: ['Chuna', 'Yukos', 'Acacia', 'Milimani', 'New Valley', 'Noonkopir', 'Deliverance Area'] },
        { name: 'Ngong Town', val: 'Ngong', subZones: ['Ngong CBD', 'Milele Mall Area', 'Kibiko', 'Oloolua', 'Juanco', 'Matasia', 'Bulbul'] },
        { name: 'Kiserian', val: 'Kiserian', subZones: ['Kiserian CBD', 'Pipeline Rd', 'Oloosirkon'] },
        { name: 'Isinya', val: 'Isinya', subZones: ['Isinya CBD', 'Kajiado Link'] },
        { name: 'Kajiado Town', val: 'Kajiado Town', subZones: ['Kajiado CBD', 'County Offices'] },
        { name: 'Namanga', val: 'Namanga', subZones: [] },
        { name: 'Loitokitok', val: 'Loitokitok', subZones: [] }
      ]
    },
    mombasa: {
      name: 'Mombasa & Coast',
      emoji: '🌊',
      areas: [
        { name: 'All Coast', val: 'Mombasa' },
        { name: 'Nyali', val: 'Nyali', subZones: ['Links Rd', 'Cinemax', 'Beach Rd', 'Nyali Estate', 'Greenwood'] },
        { name: 'Bamburi', val: 'Bamburi', subZones: ['Bamburi Mtambo', 'Fisheries', 'Vescon', 'Mwisho wa Lami'] },
        { name: 'Shanzu', val: 'Shanzu', subZones: ['Shanzu Beach', 'Serena Rd', 'Go-Kart Area'] },
        { name: 'Kisauni', val: 'Kisauni', subZones: [] },
        { name: 'Likoni', val: 'Likoni', subZones: [] },
        { name: 'Changamwe', val: 'Changamwe', subZones: [] },
        { name: 'Kizingo', val: 'Kizingo', subZones: ['State House Rd', 'Lighthouse Area'] },
        { name: 'Tudor', val: 'Tudor', subZones: ['Technical University Area', 'Tudor Creek', 'Tudor 4'] },
        { name: 'Old Town Mombasa', val: 'Old Town Mombasa', subZones: [] },
        { name: 'Mtwapa (Kilifi)', val: 'Mtwapa', subZones: ['Mtwapa Creek', 'Moorings Area', 'Posta'] },
        { name: 'Diani (Kwale)', val: 'Diani', subZones: ['Diani Beach Rd', 'Ukunda', 'Kongo Mosque Area'] },
        { name: 'Kilifi Town', val: 'Kilifi', subZones: ['Pwani University Area', 'Bofa Beach', 'Mnarani'] },
        { name: 'Malindi', val: 'Malindi', subZones: ['Casuarina', 'Malindi CBD', 'Mtangani'] },
        { name: 'Watamu', val: 'Watamu', subZones: [] },
        { name: 'Mariakani', val: 'Mariakani', subZones: [] },
        { name: 'Voi (Taita Taveta)', val: 'Voi', subZones: [] },
        { name: 'Lamu', val: 'Lamu', subZones: ['Lamu Town', 'Shela'] }
      ]
    },
    nakuru: {
      name: 'Nakuru & Rift Valley',
      emoji: '🦩',
      areas: [
        { name: 'All Nakuru / Rift Valley', val: 'Nakuru' },
        { name: 'Milimani (Nakuru)', val: 'Milimani', subZones: ['Upper Milimani', 'Lower Milimani'] },
        { name: 'Naka', val: 'Naka', subZones: ['Naka Estate', 'Hyrax Hill Area'] },
        { name: 'Section 58', val: 'Section 58', subZones: ['Section 58 Shopping Centre'] },
        { name: 'Kiamunyi', val: 'Kiamunyi', subZones: ['Olive Inn', 'Mercy Njeri'] },
        { name: 'Free Area', val: 'Free Area', subZones: ['Free Area Stage', 'Midland'] },
        { name: 'Lanet', val: 'Lanet', subZones: ['Lanet Barracks Area', 'Umoja Lanet'] },
        { name: 'Naivasha', val: 'Naivasha', subZones: ['Naivasha Town', 'Lake View', 'Moi South Lake Rd', 'Kongoni'] },
        { name: 'Gilgil', val: 'Gilgil', subZones: ['Gilgil Town', 'Kekopey'] },
        { name: 'Molo', val: 'Molo', subZones: ['Molo Town'] },
        { name: 'Njoro', val: 'Njoro', subZones: ['Egerton University Area'] },
        { name: 'Kericho', val: 'Kericho', subZones: ['Kericho Town', 'Tea Hotel Area', 'Litein'] },
        { name: 'Bomet', val: 'Bomet', subZones: ['Bomet CBD', 'Sotik'] },
        { name: 'Narok', val: 'Narok', subZones: ['Narok Town', 'Kilgoris'] },
        { name: 'Baringo', val: 'Baringo', subZones: ['Kabarnet', 'Marigat', 'Eldama Ravine'] },
        { name: 'Laikipia', val: 'Laikipia', subZones: ['Rumuruti', 'Nanyuki'] }
      ]
    },
    kisumu: {
      name: 'Kisumu & Western Kenya',
      emoji: '🐟',
      areas: [
        { name: 'All Western Kenya', val: 'Kisumu' },
        { name: 'Milimani (Kisumu)', val: 'Milimani', subZones: ['Milimani West', 'State Lodge Area'] },
        { name: 'Riat Hills', val: 'Riat', subZones: ['Riat View', 'Airport Ridge'] },
        { name: 'Tom Mboya Estate', val: 'Tom Mboya', subZones: ['Tom Mboya Estate', 'Makasembo'] },
        { name: 'Migosi', val: 'Migosi', subZones: ['Carwash Area', 'Stage 2'] },
        { name: 'Mamboleo', val: 'Mamboleo', subZones: ['Showground Area', 'Mamboleo Junction'] },
        { name: 'Kondele', val: 'Kondele', subZones: ['Kondele CBD', 'Kibuye Border'] },
        { name: 'Nyalenda', val: 'Nyalenda', subZones: [] },
        { name: 'Manyatta', val: 'Manyatta', subZones: [] },
        { name: 'Ahero', val: 'Ahero', subZones: [] },
        { name: 'Maseno', val: 'Maseno', subZones: ['Maseno University Area'] },
        { name: 'Muhoroni', val: 'Muhoroni', subZones: [] },
        { name: 'Homa Bay', val: 'Homa Bay', subZones: ['Homa Bay Town', 'Mbita', 'Oyugis', 'Kendu Bay'] },
        { name: 'Migori', val: 'Migori', subZones: ['Migori Town', 'Awendo', 'Rongo'] },
        { name: 'Kisii Town', val: 'Kisii', subZones: ['Jogoo Area', 'Milimani (Kisii)', 'Nyamataro', 'Ogembo', 'Keroka'] },
        { name: 'Nyamira', val: 'Nyamira', subZones: ['Nyamira Town', 'Keroka'] },
        { name: 'Siaya', val: 'Siaya', subZones: ['Siaya Town', 'Bondo', 'Ugunja', 'Yala'] },
        { name: 'Kakamega', val: 'Kakamega', subZones: ['Amalemba', 'Lurambi', 'Milimani (Kakamega)', 'Mumias', 'Butere'] },
        { name: 'Vihiga', val: 'Vihiga', subZones: ['Mbale', 'Luanda', 'Chavakali'] },
        { name: 'Bungoma', val: 'Bungoma', subZones: ['Kanduyi', 'Bungoma CBD', 'Webuye', 'Kimilili'] },
        { name: 'Busia', val: 'Busia', subZones: ['Busia Town', 'Malaba', 'Nambale'] }
      ]
    },
    eldoret: {
      name: 'Eldoret & North Rift',
      emoji: '🏃',
      areas: [
        { name: 'All North Rift', val: 'Eldoret' },
        { name: 'Elgon View', val: 'Elgon View', subZones: ['Upper Elgon View', 'Lower Elgon View'] },
        { name: 'Pioneer', val: 'Pioneer', subZones: ['Pioneer Estate', 'Langas Link'] },
        { name: 'Kapsoya', val: 'Kapsoya', subZones: ['Upper Kapsoya', 'Munster Area'] },
        { name: 'Annex', val: 'Annex', subZones: ['Moi University Law Campus Area'] },
        { name: 'West Indies', val: 'West Indies', subZones: ['Golf Club Area'] },
        { name: 'Langas', val: 'Langas', subZones: ['Kisumu Ndogo', 'Kipkenyo Link'] },
        { name: 'Huruma (Eldoret)', val: 'Huruma Eldoret', subZones: [] },
        { name: 'Burnt Forest', val: 'Burnt Forest', subZones: [] },
        { name: 'Turbo', val: 'Turbo', subZones: [] },
        { name: 'Kitale (Trans Nzoia)', val: 'Kitale', subZones: ['Milimani (Kitale)', 'Section 6', 'Kiminini'] },
        { name: 'Kapsabet (Nandi)', val: 'Kapsabet', subZones: ['Nandi Hills'] },
        { name: 'Iten (Elgeyo-Marakwet)', val: 'Iten', subZones: [] },
        { name: 'Kapenguria (West Pokot)', val: 'Kapenguria', subZones: [] },
        { name: 'Lodwar (Turkana)', val: 'Lodwar', subZones: ['Kakuma'] },
        { name: 'Maralal (Samburu)', val: 'Maralal', subZones: [] }
      ]
    },
    eastern: {
      name: 'Eastern Kenya',
      emoji: '🌄',
      areas: [
        { name: 'All Eastern Kenya', val: 'Eastern' },
        { name: 'Meru Town', val: 'Meru', subZones: ['Makutano', 'Gatunga', 'Gitimene'] },
        { name: 'Nkubu (Meru)', val: 'Nkubu', subZones: [] },
        { name: 'Maua (Meru)', val: 'Maua', subZones: [] },
        { name: 'Chuka (Tharaka-Nithi)', val: 'Chuka', subZones: [] },
        { name: 'Embu Town', val: 'Embu', subZones: ['Embu CBD', 'Kamiu'] },
        { name: 'Runyenjes (Embu)', val: 'Runyenjes', subZones: [] },
        { name: 'Kitui Town', val: 'Kitui', subZones: ['Kitui CBD', 'Miambani'] },
        { name: 'Mwingi (Kitui)', val: 'Mwingi', subZones: [] },
        { name: 'Wote (Makueni)', val: 'Wote', subZones: [] },
        { name: 'Sultan Hamud (Makueni)', val: 'Sultan Hamud', subZones: [] },
        { name: 'Isiolo Town', val: 'Isiolo', subZones: [] },
        { name: 'Marsabit Town', val: 'Marsabit', subZones: [] },
        { name: 'Moyale (Marsabit)', val: 'Moyale', subZones: [] },
        { name: 'Garissa Town', val: 'Garissa', subZones: [] },
        { name: 'Dadaab (Garissa)', val: 'Dadaab', subZones: [] },
        { name: 'Wajir Town', val: 'Wajir', subZones: [] },
        { name: 'Mandera Town', val: 'Mandera', subZones: [] }
      ]
    },
    central: {
      name: 'Central Kenya',
      emoji: '🏔️',
      areas: [
        { name: 'All Central Kenya', val: 'Central' },
        { name: 'Nyeri Town', val: 'Nyeri', subZones: ['Nyeri CBD', 'Ruring\'u', 'Kamakwa'] },
        { name: 'Karatina (Nyeri)', val: 'Karatina', subZones: [] },
        { name: 'Othaya (Nyeri)', val: 'Othaya', subZones: [] },
        { name: 'Nanyuki (Laikipia)', val: 'Nanyuki', subZones: ['Baraka', 'Lewa Gate', 'Nanyuki CBD'] },
        { name: 'Nyahururu (Nyandarua)', val: 'Nyahururu', subZones: [] },
        { name: 'Ol Kalou (Nyandarua)', val: 'Ol Kalou', subZones: [] },
        { name: 'Murang\'a Town', val: 'Muranga', subZones: ['Murang\'a CBD', 'Makongeni'] },
        { name: 'Kenol (Murang\'a)', val: 'Kenol', subZones: [] },
        { name: 'Maragua (Murang\'a)', val: 'Maragua', subZones: [] },
        { name: 'Kerugoya (Kirinyaga)', val: 'Kerugoya', subZones: [] },
        { name: 'Wang\'uru (Kirinyaga)', val: 'Wanguru', subZones: [] }
      ]
    }
  };

  // Expose KENYA_COUNTY_AREAS globally for desktop layout, location picker & filters
  if (typeof window !== 'undefined') {
    window.KENYA_COUNTY_AREAS = KENYA_COUNTY_AREAS;
  }

  function renderFilterAreaChips(countyId) {
    const county = KENYA_COUNTY_AREAS[countyId] || KENYA_COUNTY_AREAS.all;
    const curLoc = (State.filters.location || '').toLowerCase().trim();

    return county.areas.map(a => {
      const isAct = (!a.val && !curLoc) || (a.val && curLoc === a.val.toLowerCase()) || (a.val && curLoc.includes(a.val.toLowerCase()));
      const szJson = encodeURIComponent(JSON.stringify(a.subZones || []));
      const hasSub = a.subZones && a.subZones.length > 0;
      return `
        <div class="km-fchip ${isAct ? 'active' : ''}" onclick="MobileApp.selectFilterArea('${a.val.replace(/'/g, "\\'")}', this, decodeURIComponent('${szJson}'))">
          ${a.name}${hasSub ? ' <i class="fas fa-chevron-right" style="font-size:9px; opacity:0.6; margin-left:3px;"></i>' : ''}
        </div>
      `;
    }).join('');
  }

  // Helper: Format KSh price
  function formatKsh(val) {
    if (!val) return '0';
    return Number(val).toLocaleString();
  }

  // Helper: Resolve Coordinates for Any Kenyan Property (with Estate Fallback)
  function getCoordinatesForProperty(p) {
    if (p && p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude)) {
      return { lat: Number(p.latitude), lng: Number(p.longitude), isExact: true, areaName: p.estateSuburb || 'Nairobi' };
    }
    const loc = `${p.estateSuburb || ''} ${p.exactEstate || ''} ${p.location || ''} ${p.county || ''} ${p.title || ''}`.toLowerCase();

    // Check if flat list has coordinates
    if (typeof window !== 'undefined' && Array.isArray(window.ALL_KE_LOCATIONS)) {
      const match = window.ALL_KE_LOCATIONS.find(l => l.lat && l.lng && loc.includes(l.name.toLowerCase()));
      if (match) return { lat: match.lat, lng: match.lng, isExact: false, areaName: match.name };
    }

    // Direct mappings for major Nairobi & Kenya estates
    if (loc.includes('mlolongo')) return { lat: -1.3845, lng: 36.9610, isExact: false, areaName: 'Mlolongo' };
    if (loc.includes('greatwall')) return { lat: -1.3890, lng: 36.9720, isExact: false, areaName: 'Greatwall Gardens' };
    if (loc.includes('syokimau')) return { lat: -1.3650, lng: 36.9380, isExact: false, areaName: 'Syokimau' };
    if (loc.includes('kilimani')) return { lat: -1.2921, lng: 36.7856, isExact: false, areaName: 'Kilimani' };
    if (loc.includes('ruaka')) return { lat: -1.2056, lng: 36.7767, isExact: false, areaName: 'Ruaka' };
    if (loc.includes('roysambu')) return { lat: -1.2185, lng: 36.8872, isExact: false, areaName: 'Roysambu' };
    if (loc.includes('umoja')) return { lat: -1.2889, lng: 36.8967, isExact: false, areaName: 'Umoja' };
    if (loc.includes('pipeline')) return { lat: -1.3195, lng: 36.8960, isExact: false, areaName: 'Pipeline' };
    if (loc.includes('westlands')) return { lat: -1.2675, lng: 36.8044, isExact: false, areaName: 'Westlands' };
    if (loc.includes('south b')) return { lat: -1.3142, lng: 36.8372, isExact: false, areaName: 'South B' };
    if (loc.includes('south c')) return { lat: -1.3210, lng: 36.8310, isExact: false, areaName: 'South C' };
    if (loc.includes('kileleshwa')) return { lat: -1.2811, lng: 36.7878, isExact: false, areaName: 'Kileleshwa' };
    if (loc.includes('kasarani')) return { lat: -1.2222, lng: 36.9011, isExact: false, areaName: 'Kasarani' };
    if (loc.includes('juja')) return { lat: -1.1026, lng: 37.0144, isExact: false, areaName: 'Juja' };
    if (loc.includes('thika')) return { lat: -1.0396, lng: 37.0900, isExact: false, areaName: 'Thika' };
    if (loc.includes('rongai')) return { lat: -1.3965, lng: 36.7580, isExact: false, areaName: 'Ongata Rongai' };
    if (loc.includes('ngong')) return { lat: -1.3610, lng: 36.6560, isExact: false, areaName: 'Ngong' };
    if (loc.includes('kitengela')) return { lat: -1.4720, lng: 36.9580, isExact: false, areaName: 'Kitengela' };
    if (loc.includes('mombasa') || loc.includes('nyali')) return { lat: -4.0435, lng: 39.6682, isExact: false, areaName: 'Mombasa' };
    if (loc.includes('nakuru')) return { lat: -0.3031, lng: 36.0800, isExact: false, areaName: 'Nakuru' };
    if (loc.includes('kisumu')) return { lat: -0.0917, lng: 34.7680, isExact: false, areaName: 'Kisumu' };
    if (loc.includes('eldoret')) return { lat: 0.5143, lng: 35.2698, isExact: false, areaName: 'Eldoret' };

    return { lat: -1.2864, lng: 36.8172, isExact: false, areaName: 'Nairobi' };
  }

  // Detect Mobile View
  function isMobileScreen() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'mobile' || urlParams.get('mobile') === '1') return true;
    return window.innerWidth <= 768 || 
           window.matchMedia('(max-width: 768px)').matches ||
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Initialize Mobile App
  async function init() {
    if (!isMobileScreen()) return;

    document.documentElement.classList.add('mobile-view');
    if (document.body) document.body.classList.add('mobile-layout');

    // Build the shell container
    buildShell();

    // Fetch initial property data
    await loadProperties();

    // Load sample messages
    loadSampleMessages();

    // Check URL parameters for direct property link e.g. ?prop=prop-usr-1790265754135
    const urlParams = new URLSearchParams(window.location.search);
    const sharedPropId = urlParams.get('prop') || urlParams.get('property') || urlParams.get('p');
    if (sharedPropId) {
      showScreen('detail', sharedPropId);
    } else {
      showScreen('home');
    }

    // Handle resize
    window.addEventListener('resize', () => {
      if (!isMobileScreen()) {
        document.body.classList.remove('mobile-layout');
        document.documentElement.classList.remove('mobile-view');
        const mApp = document.getElementById('mobile-app');
        if (mApp) mApp.style.display = 'none';
      } else {
        document.body.classList.add('mobile-layout');
        document.documentElement.classList.add('mobile-view');
        const mApp = document.getElementById('mobile-app');
        if (mApp) mApp.style.display = 'block';
      }
    });
  }

  // Build Core Shell Elements (Header, Main Slot, Bottom Nav with Center "+ POST AD" & Location Sheet)
  function buildShell() {
    let app = document.getElementById('mobile-app');
    if (!app) {
      app = document.createElement('div');
      app.id = 'mobile-app';
      document.body.insertBefore(app, document.body.firstChild);
    }

    app.innerHTML = `
      <!-- Top Dynamic Header -->
      <div id="km-mobile-header-slot"></div>

      <!-- Main Dynamic Content Slot -->
      <main id="km-mobile-main-slot"></main>

      <!-- KejaMarket 5-Tab Bottom Navigation Bar -->
      <nav class="km-bottom-nav" id="km-bottom-nav">
        <!-- 1. Home -->
        <button type="button" class="km-nav-tab active" data-tab="home" onclick="MobileApp.showScreen('home')">
          <i class="fas fa-home tab-icon"></i>
          <span class="tab-label">Home</span>
        </button>

        <!-- 2. Saved / Favourites -->
        <button type="button" class="km-nav-tab" data-tab="favorites" onclick="MobileApp.showScreen('favorites')">
          <i class="fas fa-heart tab-icon"></i>
          <span class="tab-label">Saved</span>
          <span class="nav-badge" id="km-fav-badge" style="display:none;">0</span>
        </button>

        <!-- 3. CENTER "+ POST AD" BUTTON -->
        <button type="button" class="km-nav-tab-sell" onclick="MobileApp.openPostAd()" title="Post Free Ad">
          <div class="km-sell-floating-circle">
            <i class="fas fa-plus"></i>
          </div>
          <span class="km-sell-label">POST AD</span>
        </button>

        <!-- 4. Messages / Chats -->
        <button type="button" class="km-nav-tab" data-tab="messages" onclick="MobileApp.showScreen('messages')">
          <i class="fas fa-comment-dots tab-icon"></i>
          <span class="tab-label">Messages</span>
          <span class="nav-badge" id="km-msg-badge" style="display:none;">2</span>
        </button>

        <!-- 5. Profile / Account -->
        <button type="button" class="km-nav-tab" data-tab="profile" onclick="MobileApp.showScreen('profile')">
          <i class="fas fa-user tab-icon"></i>
          <span class="tab-label">Profile</span>
        </button>
      </nav>

      <!-- Location Picker Bottom Sheet (Modal) - Hierarchical Kenya Locations -->
      <div class="km-bottom-sheet-backdrop" id="km-loc-picker-modal" onclick="if(event.target === this) MobileApp.closeLocationModal()">
        <div class="km-bottom-sheet km-loc-sheet">
          <div class="km-sheet-handle"></div>
          <div class="km-sheet-header">
            <div class="km-sheet-title"><i class="fas fa-map-marker-alt" style="color:#006818;"></i> Where are you looking?</div>
            <button type="button" class="km-sheet-close-btn" onclick="MobileApp.closeLocationModal()"><i class="fas fa-times"></i></button>
          </div>
          <!-- Live Search Input -->
          <div class="km-loc-search-wrap">
            <div class="km-search-pill" style="margin-bottom:0;">
              <i class="fas fa-search search-icon"></i>
              <input type="text" id="km-sheet-loc-input" placeholder="Search area, estate, town..." oninput="MobileApp.filterSheetLocations(this.value)" autocomplete="off">
              <button type="button" id="km-loc-clear-btn" class="km-search-clear-btn" onclick="MobileApp.clearLocSearch()" style="display:none;"><i class="fas fa-times-circle"></i></button>
            </div>
          </div>
          <!-- Search Results (shown while typing) -->
          <div id="km-loc-search-results" class="km-loc-search-results" style="display:none;"></div>
          <!-- Default: County Tabs + Popular Areas -->
          <div id="km-loc-default-view">
            <!-- County Filter Tabs -->
            <div class="km-loc-county-tabs">
              <button type="button" class="km-loc-county-tab active" onclick="MobileApp.switchLocCounty('nairobi', this)">🏙️ Nairobi</button>
              <button type="button" class="km-loc-county-tab" onclick="MobileApp.switchLocCounty('kiambu', this)">🌿 Kiambu</button>
              <button type="button" class="km-loc-county-tab" onclick="MobileApp.switchLocCounty('machakos', this)">✈️ Machakos</button>
              <button type="button" class="km-loc-county-tab" onclick="MobileApp.switchLocCounty('kajiado', this)">🦁 Kajiado</button>
              <button type="button" class="km-loc-county-tab" onclick="MobileApp.switchLocCounty('mombasa', this)">🌊 Mombasa</button>
              <button type="button" class="km-loc-county-tab" onclick="MobileApp.switchLocCounty('nakuru', this)">🦩 Nakuru</button>
              <button type="button" class="km-loc-county-tab" onclick="MobileApp.switchLocCounty('kisumu', this)">🐟 Kisumu</button>
              <button type="button" class="km-loc-county-tab" onclick="MobileApp.switchLocCounty('eldoret', this)">🏃 Eldoret</button>
              <button type="button" class="km-loc-county-tab" onclick="MobileApp.switchLocCounty('all', this)">🇰🇪 All Kenya</button>
            </div>
            <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.4px; margin:10px 14px 6px;">Popular Rental Areas</div>
            <div class="km-sheet-suburb-grid" id="km-sheet-suburb-grid">
              <div class="km-sheet-loc-item ${!State.filters.location ? 'active' : ''}" onclick="MobileApp.setLocation('')">📍 All Kenya</div>
              <div class="km-sheet-loc-item ${State.filters.location === 'Nairobi' ? 'active' : ''}" onclick="MobileApp.setLocation('Nairobi')">🏙️ All Nairobi</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Ruaka')">📍 Ruaka</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Roysambu')">📍 Roysambu</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Kasarani')">📍 Kasarani</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Zimmerman')">📍 Zimmerman</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Umoja')">📍 Umoja</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.showLocSubZones('Umoja', ['Umoja 1','Umoja 2','Umoja 3 / Innercore','Umoja Unity','Umoja Market Area'])">📍 Umoja ›</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Pipeline')">📍 Pipeline</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.showLocSubZones('Pipeline', ['Pipeline Stage','Pipeline Tumaini','Pipeline Plot 10','Pipeline Greenwood','Pipeline Survey','Pipeline Phase 1','Pipeline Phase 2'])">📍 Pipeline ›</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.showLocSubZones('Embakasi', ['Embakasi Village','Embakasi North','Embakasi South','Embakasi West','Embakasi Central','Baraka Estate'])">📍 Embakasi ›</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.showLocSubZones('Mlolongo', ['Mlolongo Phase 1','Mlolongo Phase 2','Mlolongo Phase 3 (Weighbridge)','Mlolongo Phase 4','Mlolongo Town Centre'])">📍 Mlolongo ›</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.showLocSubZones('Buruburu', ['Buruburu Phase 1','Buruburu Phase 2','Buruburu Phase 3','Buruburu Phase 4','Buruburu Phase 5'])">📍 Buruburu ›</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.showLocSubZones('Donholm', ['Donholm Phase 1','Donholm Phase 2','Donholm Phase 3','Donholm Phase 4','Donholm Phase 5','Donholm Phase 6','Greenfields','Greenspan'])">📍 Donholm ›</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('South B')">📍 South B</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('South C')">📍 South C</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Kilimani')">📍 Kilimani</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Westlands')">📍 Westlands</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Kileleshwa')">📍 Kileleshwa</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Parklands')">📍 Parklands</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Karen')">📍 Karen</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Ruiru')">🌿 Ruiru</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Juja')">🌿 Juja</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Thika')">🌿 Thika</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Rongai')">🦁 Rongai</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Kitengela')">🦁 Kitengela</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Athi River')">🦁 Athi River</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Ngong')">🦁 Ngong</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Syokimau')">📍 Syokimau</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Mombasa')">🌊 Mombasa</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Nyali')">🌊 Nyali</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Bamburi')">🌊 Bamburi</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Diani')">🌊 Diani</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Kisumu')">🌊 Kisumu</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Nakuru')">🦩 Nakuru</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Naivasha')">🦩 Naivasha</div>
              <div class="km-sheet-loc-item" onclick="MobileApp.setLocation('Eldoret')">🏃 Eldoret</div>
            </div>
          </div>
          <!-- Sub-zone Drill-down Panel -->
          <div id="km-loc-subzone-panel" style="display:none;" class="km-loc-subzone-panel">
            <div class="km-loc-subzone-header">
              <button type="button" class="km-loc-back-btn" onclick="MobileApp.hideLocSubZones()"><i class="fas fa-arrow-left"></i> Back</button>
              <span id="km-loc-subzone-title" class="km-loc-subzone-title"></span>
            </div>
            <div class="km-sheet-suburb-grid" id="km-loc-subzone-grid"></div>
          </div>
        </div>
      </div>
    `;

    updateFavBadge();
  }

  // Load properties from API or fallback sources (142+ authentic listings)
  async function loadProperties() {
    // 0. Immediately populate from local seed cache for instantaneous 0ms render
    if (!State.properties.length) {
      if (typeof SEED_PROPERTIES !== 'undefined' && Array.isArray(SEED_PROPERTIES)) {
        State.properties = [...SEED_PROPERTIES];
      } else if (typeof window !== 'undefined' && Array.isArray(window.SEED_PROPERTIES)) {
        State.properties = [...window.SEED_PROPERTIES];
      } else if (typeof window !== 'undefined' && window.EXACT_12_REFERENCE_PROPERTIES) {
        State.properties = [...window.EXACT_12_REFERENCE_PROPERTIES];
      }
      State.filteredProperties = [...State.properties];
    }

    if (window.kejaApp && Array.isArray(window.kejaApp.properties) && window.kejaApp.properties.length > 20) {
      State.properties = window.kejaApp.properties;
      State.filteredProperties = [...State.properties];
      return;
    }

    try {
      const res = await fetch('/api/properties?pageSize=300&sort=newest');
      const data = await res.json();
      let propsArray = [];
      if (data && data.properties && Array.isArray(data.properties)) {
        propsArray = data.properties;
      } else if (data && data.data && Array.isArray(data.data)) {
        propsArray = data.data;
      } else if (Array.isArray(data)) {
        propsArray = data;
      }

      if (propsArray.length > 0) {
        State.properties = propsArray;
        State.filteredProperties = [...State.properties];
      }
    } catch (e) {
      // In offline/cached mode, local seed is already active
    }

    if (!State.properties.length) {
      if (typeof SEED_PROPERTIES !== 'undefined' && Array.isArray(SEED_PROPERTIES)) {
        State.properties = SEED_PROPERTIES;
      } else if (typeof window !== 'undefined' && Array.isArray(window.SEED_PROPERTIES)) {
        State.properties = window.SEED_PROPERTIES;
      }
      State.filteredProperties = [...State.properties];
    }
  }

  // Load user conversation messages from storage or start clean
  function loadSampleMessages() {
    try {
      const savedMsgs = localStorage.getItem('keja_chat_threads');
      if (savedMsgs) {
        State.messages = JSON.parse(savedMsgs);
        return;
      }
    } catch (e) {}

    State.messages = [
      {
        id: 'msg-concierge',
        senderName: 'KejaMarket Concierge',
        role: 'Verified Support & Caretaker Desk',
        avatarText: 'KM',
        lastMessage: 'Karibu KejaMarket! All listings feature free viewings, direct verified landlord contacts, and live GPS map pins.',
        time: 'Just now',
        unread: false,
        propertyTitle: 'KejaMarket Verified Direct'
      }
    ];
  }

  function updateFavBadge() {
    const badge = document.getElementById('km-fav-badge');
    if (badge) {
      badge.textContent = State.favorites.length;
      badge.style.display = State.favorites.length > 0 ? 'flex' : 'none';
    }
  }

  // Auth check helper for gating details, photos and bookings
  function isUserLoggedIn() {
    try {
      const session = (window.kejaAuth && typeof window.kejaAuth.getSession === 'function')
        ? window.kejaAuth.getSession()
        : JSON.parse(localStorage.getItem('keja_session') || localStorage.getItem('keja_user') || 'null');
      const token = localStorage.getItem('keja_token') || sessionStorage.getItem('keja_token');
      return !!(session && (session.id || session.phone || session.email || token));
    } catch {
      return false;
    }
  }

  // Screen Switcher
  function showScreen(screen, params = {}) {
    State.currentScreen = screen;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update bottom nav active state
    document.querySelectorAll('.km-nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === screen);
    });

    const headerSlot = document.getElementById('km-mobile-header-slot');
    const mainSlot = document.getElementById('km-mobile-main-slot');
    const bottomNav = document.getElementById('km-bottom-nav');

    if (['detail', 'filters', 'request-viewing', 'payment', 'payment-success', 'chat'].includes(screen)) {
      if (bottomNav) bottomNav.style.display = 'none';
    } else {
      if (bottomNav) bottomNav.style.display = 'flex';
    }

    switch (screen) {
      case 'home':
        renderHomeScreen(headerSlot, mainSlot);
        break;
      case 'browse':
        renderBrowseScreen(headerSlot, mainSlot, params);
        break;
      case 'detail': {
        const propId = params.id || params;
        if (!isUserLoggedIn()) {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('Please sign in or create an account to view full property details.', 'info');
          }
          if (window.kejaAuth && typeof window.kejaAuth.requireTenantAuth === 'function') {
            window.kejaAuth.requireTenantAuth(() => {
              showScreen('detail', propId);
            });
          } else {
            openSignIn();
          }
          return;
        }
        renderDetailScreen(headerSlot, mainSlot, propId);
        break;
      }
      case 'filters':
        renderFiltersScreen(headerSlot, mainSlot);
        break;
      case 'afford':
        renderAffordabilityScreen(headerSlot, mainSlot);
        break;
      case 'request-viewing':
        renderRequestViewingScreen(headerSlot, mainSlot, params.id || params);
        break;
      case 'my-requests':
        renderMyRequestsScreen(headerSlot, mainSlot);
        break;
      case 'messages':
        renderMessagesScreen(headerSlot, mainSlot);
        break;
      case 'chat':
        renderChatScreen(headerSlot, mainSlot, params.id || params);
        break;
      case 'viewing-confirmed':
        renderViewingConfirmedScreen(headerSlot, mainSlot, params);
        break;
      case 'countdown':
        renderCountdownScreen(headerSlot, mainSlot, params);
        break;
      case 'smarthunt':
        renderSmartHuntScreen(headerSlot, mainSlot);
        break;
      case 'payment':
        renderPaymentScreen(headerSlot, mainSlot, params);
        break;
      case 'payment-success':
        renderPaymentSuccessScreen(headerSlot, mainSlot, params);
        break;
      case 'my-bookings':
        renderMyBookingsScreen(headerSlot, mainSlot);
        break;
      case 'admin-mobile':
        renderAdminMobileScreen(headerSlot, mainSlot);
        break;
      case 'profile':
        renderProfileScreen(headerSlot, mainSlot);
        break;
      case 'favorites':
        renderFavoritesScreen(headerSlot, mainSlot);
        break;
      default:
        renderHomeScreen(headerSlot, mainSlot);
    }
  }

  // Filter Helper
  function getFilteredPropertiesList() {
    let list = [...State.properties];

    // Category filter
    const cat = (State.selectedCategory || 'all').toLowerCase();
    if (cat && cat !== 'all') {
      if (cat === 'single-room') {
        list = list.filter(p => 
          (p.category && (p.category.toLowerCase().includes('single') || p.category.toLowerCase() === 'single room')) ||
          (p.title && p.title.toLowerCase().includes('single room')) ||
          (p.badgeLabel && p.badgeLabel.toLowerCase().includes('single'))
        );
      } else if (cat === 'double-room') {
        list = list.filter(p => 
          (p.category && (p.category.toLowerCase().includes('double') || p.category.toLowerCase() === 'double room')) ||
          (p.title && p.title.toLowerCase().includes('double room')) ||
          (p.badgeLabel && p.badgeLabel.toLowerCase().includes('double'))
        );
      } else if (cat === 'bedsitters') {
        list = list.filter(p => 
          (p.category && (p.category.toLowerCase().includes('bedsitter') || p.category.toLowerCase().includes('studio'))) ||
          (p.title && (p.title.toLowerCase().includes('bedsitter') || p.title.toLowerCase().includes('studio'))) ||
          (p.badgeLabel && p.badgeLabel.toLowerCase().includes('bedsitter'))
        );
      } else if (cat === 'studio') {
        list = list.filter(p => 
          (p.category && p.category.toLowerCase().includes('studio')) ||
          (p.title && p.title.toLowerCase().includes('studio'))
        );
      } else if (cat === '1-bedroom') {
        list = list.filter(p => p.bedrooms === 1 && !p.isBnb && !(p.category && (p.category.toLowerCase().includes('bedsitter') || p.category.toLowerCase().includes('single'))));
      } else if (cat === '2-bedroom') {
        list = list.filter(p => p.bedrooms === 2 && !p.isBnb && !(p.category && p.category.toLowerCase().includes('double')));
      } else if (cat === '3-bedroom') {
        list = list.filter(p => (p.bedrooms || 0) >= 3 && !p.isBnb);
      } else if (cat === 'apartments') {
        list = list.filter(p => p.category && (p.category.toLowerCase().includes('apartment') || p.category.toLowerCase().includes('flat')));
      } else if (cat === 'bnb') {
        list = list.filter(p => p.isBnb || (p.category && (p.category.toLowerCase().includes('bnb') || p.category.toLowerCase().includes('airbnb'))));
      } else if (cat === 'mansion') {
        list = list.filter(p => p.category && (p.category.toLowerCase().includes('mansion') || p.category.toLowerCase().includes('townhouse') || p.category.toLowerCase().includes('villa') || p.category.toLowerCase().includes('own compound')));
      } else if (cat === 'land') {
        list = list.filter(p => p.category && (p.category.toLowerCase().includes('land') || p.category.toLowerCase().includes('plot')));
      } else if (cat === 'commercial') {
        list = list.filter(p => p.category && (p.category.toLowerCase().includes('commercial') || p.category.toLowerCase().includes('office') || p.category.toLowerCase().includes('shop')));
      } else if (cat === 'services') {
        list = list.filter(p => p.category && (p.category.toLowerCase().includes('service') || p.category.toLowerCase().includes('mover')));
      }
    }

    // Amenities filter
    if (Array.isArray(State.filters.amenities) && State.filters.amenities.length > 0) {
      list = list.filter(p => {
        const text = `${p.description || ''} ${p.specAmenitiesText || ''} ${JSON.stringify(p.amenities || {})}`.toLowerCase();
        return State.filters.amenities.every(am => text.includes(am.toLowerCase()));
      });
    }

    // Direct Landlord Only filter
    if (State.filters.directLandlordOnly) {
      list = list.filter(p => !p.managedBy || p.managedBy === 'landlord' || (p.badgeLabel && p.badgeLabel.toLowerCase().includes('direct')));
    }

    // Location filter (Supports Counties, Estates, and Sub-zones like Umoja 1/2/3, Mlolongo Phases, etc.)
    if (State.filters.location && State.filters.location !== 'All Kenya') {
      const loc = State.filters.location.toLowerCase().trim();
      list = list.filter(p => {
        const text = `${p.estateSuburb || ''} ${p.county || ''} ${p.title || ''} ${p.location || ''} ${p.exactEstate || ''} ${p.description || ''}`.toLowerCase();
        return text.includes(loc);
      });
    }

    // Min / Max Price
    if (State.filters.minPrice) list = list.filter(p => (p.rentKes || p.price || 0) >= State.filters.minPrice);
    if (State.filters.maxPrice) list = list.filter(p => (p.rentKes || p.price || 0) <= State.filters.maxPrice);

    // Bedrooms
    if (State.filters.beds && State.filters.beds !== 'any') {
      if (State.filters.beds === 'single') {
        list = list.filter(p => 
          (p.category && (p.category.toLowerCase().includes('single') || p.category.toLowerCase().includes('double'))) ||
          (p.title && (p.title.toLowerCase().includes('single room') || p.title.toLowerCase().includes('double room')))
        );
      } else if (State.filters.beds === 'bedsitter') {
        list = list.filter(p => 
          (p.category && (p.category.toLowerCase().includes('bedsitter') || p.category.toLowerCase().includes('studio'))) ||
          (p.title && (p.title.toLowerCase().includes('bedsitter') || p.title.toLowerCase().includes('studio')))
        );
      } else {
        list = list.filter(p => (p.bedrooms || 0) >= parseInt(State.filters.beds));
      }
    }

    // Search query
    if (State.searchQuery && State.searchQuery.trim()) {
      const q = State.searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.estateSuburb && p.estateSuburb.toLowerCase().includes(q)) ||
        (p.county && p.county.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (State.selectedSort === 'price-low') {
      list.sort((a, b) => (a.rentKes || a.price || 0) - (b.rentKes || b.price || 0));
    } else if (State.selectedSort === 'price-high') {
      list.sort((a, b) => (b.rentKes || b.price || 0) - (a.rentKes || a.price || 0));
    } else if (State.selectedSort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }

  function getSortLabel() {
    if (State.selectedSort === 'price-low') return 'Price: Low';
    if (State.selectedSort === 'price-high') return 'Price: High';
    return 'Newest';
  }

  // ==========================================
  // SCREEN 1: HOME SCREEN (KEJAMARKET STANDARD)
  // ==========================================
  function renderHomeScreen(hSlot, mSlot) {
    // 1. Top App Bar
    hSlot.innerHTML = `
      <div class="km-top-bar">
        <a href="javascript:void(0)" onclick="MobileApp.showScreen('home')" class="km-brand-logo">
          <img src="/android-chrome-192x192.png" alt="KejaMarket" class="km-logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="logo-badge" style="display:none;"><i class="fas fa-home"></i></div>
          <div class="logo-text-wrap">
            <div class="logo-text"><span class="keja">Keja</span><span class="market">Market</span></div>
            <span class="logo-tagline">Kenya's #1 Rental App</span>
          </div>
        </a>
        <div class="km-top-actions">
          <button type="button" class="km-wa-header-pill km-wa-concierge-btn" onclick="MobileApp.openWhatsAppAlerts()" title="WhatsApp Alerts">
            <i class="fab fa-whatsapp"></i> <span>Alerts</span>
          </button>
          <button type="button" class="km-hunt-header-pill" onclick="MobileApp.openHouseHunt()" title="House Hunter">
            <i class="fas fa-search-location"></i> <span>Hunter</span>
          </button>
          <button type="button" class="km-icon-btn" onclick="MobileApp.showScreen('messages')" title="Notifications">
            <i class="fas fa-bell"></i>
            <span class="badge-dot"></span>
          </button>
        </div>
      </div>
    `;

    const displayProps = getFilteredPropertiesList();
    const activeLoc = State.filters.location || 'All Nairobi';
    const filterCount = (State.filters.minPrice ? 1 : 0) + (State.filters.maxPrice ? 1 : 0) + (State.filters.beds !== 'any' ? 1 : 0);

    // 2. Main Content
    mSlot.innerHTML = `
      <!-- Sticky Search Bar & Location Selector -->
      <div class="km-sticky-search-container">
        <div class="km-search-pill-row">
          <div class="km-search-pill">
            <i class="fas fa-search search-icon"></i>
            <input type="text" id="km-home-search-input" value="${State.searchQuery || ''}" placeholder="Search bedsitter, 1 & 2 beds, estate..." oninput="MobileApp.handleLiveSearch(this.value)" onkeydown="if(event.key==='Enter') MobileApp.handleSearch(this.value)">
            <button type="button" class="km-search-clear-btn ${State.searchQuery ? 'visible' : ''}" id="km-search-clear-btn" onclick="MobileApp.clearSearch()"><i class="fas fa-times-circle"></i></button>
          </div>
          <button type="button" class="km-filter-trigger-btn ${filterCount > 0 ? 'has-filter' : ''}" onclick="MobileApp.showScreen('filters')" title="Filters">
            <i class="fas fa-sliders-h"></i>
            ${filterCount > 0 ? `<span class="filter-badge">${filterCount}</span>` : ''}
          </button>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
          <button type="button" class="km-loc-chip-btn" onclick="MobileApp.openLocationModal()">
            <i class="fas fa-map-marker-alt"></i>
            <span id="km-active-loc-label">${activeLoc}</span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <div style="font-size:11.5px; color:#64748b; font-weight:600;">
            <i class="fas fa-shield-alt" style="color:#006818;"></i> Direct Landlords
          </div>
        </div>
      </div>

      <!-- Horizontal Category Story Bubbles -->
      <div class="km-story-categories-wrapper" id="km-story-categories-wrapper">
        <button type="button" class="km-story-scroll-btn km-story-scroll-prev" id="km-story-prev-btn" onclick="MobileApp.scrollStories(-1)" aria-label="Previous categories" style="display:none;">
          <i class="fas fa-chevron-left"></i>
        </button>

        <div class="km-story-bubbles-scroll" id="km-story-bubbles-scroll" onscroll="MobileApp.onStoryScroll()">
          <button type="button" class="km-story-bubble ${State.selectedCategory === 'all' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('all')">
            <div class="km-story-icon-ring km-cat-all"><i class="fas fa-border-all"></i></div>
            <span class="km-story-label">All</span>
          </button>

          <button type="button" class="km-story-bubble ${State.selectedCategory === 'single-room' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('single-room')">
            <div class="km-story-icon-ring km-cat-single"><i class="fas fa-door-closed"></i></div>
            <span class="km-story-label">Single Room</span>
          </button>
          <button type="button" class="km-story-bubble ${State.selectedCategory === 'double-room' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('double-room')">
            <div class="km-story-icon-ring km-cat-double"><i class="fas fa-person-booth"></i></div>
            <span class="km-story-label">Double Room</span>
          </button>
          <button type="button" class="km-story-bubble ${State.selectedCategory === 'bedsitters' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('bedsitters')">
            <div class="km-story-icon-ring km-cat-bedsitters"><i class="fas fa-bed"></i></div>
            <span class="km-story-label">Bedsitters</span>
          </button>
          <button type="button" class="km-story-bubble ${State.selectedCategory === '1-bedroom' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('1-bedroom')">
            <div class="km-story-icon-ring km-cat-1bed"><i class="fas fa-door-open"></i></div>
            <span class="km-story-label">1 Bed</span>
          </button>
          <button type="button" class="km-story-bubble ${State.selectedCategory === '2-bedroom' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('2-bedroom')">
            <div class="km-story-icon-ring km-cat-2bed"><i class="fas fa-home"></i></div>
            <span class="km-story-label">2 Beds</span>
          </button>
          <button type="button" class="km-story-bubble ${State.selectedCategory === '3-bedroom' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('3-bedroom')">
            <div class="km-story-icon-ring km-cat-3bed"><i class="fas fa-building"></i></div>
            <span class="km-story-label">3+ Beds</span>
          </button>
          <button type="button" class="km-story-bubble ${State.selectedCategory === 'apartments' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('apartments')">
            <div class="km-story-icon-ring km-cat-apartments"><i class="fas fa-city"></i></div>
            <span class="km-story-label">Apartments</span>
          </button>
          <button type="button" class="km-story-bubble ${State.selectedCategory === 'bnb' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('bnb')">
            <div class="km-story-icon-ring km-cat-bnb"><i class="fas fa-umbrella-beach"></i></div>
            <span class="km-story-label">BnB / Stay</span>
          </button>
          <button type="button" class="km-story-bubble ${State.selectedCategory === 'mansion' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('mansion')">
            <div class="km-story-icon-ring km-cat-mansion"><i class="fas fa-monument"></i></div>
            <span class="km-story-label">Maisonettes</span>
          </button>
          <button type="button" class="km-story-bubble ${State.selectedCategory === 'land' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('land')">
            <div class="km-story-icon-ring km-cat-land"><i class="fas fa-map-marked-alt"></i></div>
            <span class="km-story-label">Land & Plots</span>
          </button>
          <button type="button" class="km-story-bubble ${State.selectedCategory === 'commercial' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('commercial')">
            <div class="km-story-icon-ring km-cat-commercial"><i class="fas fa-store"></i></div>
            <span class="km-story-label">Commercial</span>
          </button>
          <button type="button" class="km-story-bubble ${State.selectedCategory === 'services' ? 'active' : ''}" onclick="MobileApp.setCategoryChip('services')">
            <div class="km-story-icon-ring km-cat-services"><i class="fas fa-truck-moving"></i></div>
            <span class="km-story-label">Movers</span>
          </button>
        </div>

        <button type="button" class="km-story-scroll-btn km-story-scroll-next" id="km-story-next-btn" onclick="MobileApp.scrollStories(1)" aria-label="More categories">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <!-- 4-Pill Home Services Strip (Non-repeating Home Services) -->
      <div class="km-services-strip">
        <div class="km-service-tile" onclick="MobileApp.openMovers()">
          <div class="km-service-icon-wrap km-serv-movers">
            <i class="fas fa-truck-moving"></i>
          </div>
          <span class="km-service-title">Movers</span>
          <span class="km-service-badge km-badge-quote">Quotes</span>
        </div>
        <div class="km-service-tile" onclick="MobileApp.openFibre()">
          <div class="km-service-icon-wrap km-serv-wifi">
            <i class="fas fa-wifi"></i>
          </div>
          <span class="km-service-title">WiFi / Fibre</span>
          <span class="km-service-badge km-badge-isp">Setup</span>
        </div>
        <div class="km-service-tile" onclick="MobileApp.openCleaning()">
          <div class="km-service-icon-wrap km-serv-cleaning">
            <i class="fas fa-broom"></i>
          </div>
          <span class="km-service-title">Cleaning</span>
          <span class="km-service-badge" style="background:#fdf4ff; color:#a21caf;">Hygiene</span>
        </div>
        <div class="km-service-tile" onclick="MobileApp.openRepairs()">
          <div class="km-service-icon-wrap km-serv-repairs">
            <i class="fas fa-tools"></i>
          </div>
          <span class="km-service-title">Repairs</span>
          <span class="km-service-badge" style="background:#fefce8; color:#a16207;">Handyman</span>
        </div>
      </div>

      <!-- Nairobi Quick Suburb Filter Pills -->
      <div class="km-suburb-pills-bar">
        <span class="km-suburb-pill ${!State.filters.location ? 'active' : ''}" onclick="MobileApp.setSuburbPill('')">All Areas</span>
        <span class="km-suburb-pill ${State.filters.location === 'Ruaka' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Ruaka')">📍 Ruaka</span>
        <span class="km-suburb-pill ${State.filters.location === 'Syokimau' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Syokimau')">✈️ Syokimau</span>
        <span class="km-suburb-pill ${State.filters.location === 'Kilimani' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Kilimani')">📍 Kilimani</span>
        <span class="km-suburb-pill ${State.filters.location === 'Westlands' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Westlands')">📍 Westlands</span>
        <span class="km-suburb-pill ${State.filters.location === 'Ongata Rongai' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Ongata Rongai')">🦁 Rongai</span>
        <span class="km-suburb-pill ${State.filters.location === 'Roysambu' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Roysambu')">📍 Roysambu</span>
        <span class="km-suburb-pill ${State.filters.location === 'Kitengela' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Kitengela')">🦁 Kitengela</span>
        <span class="km-suburb-pill ${State.filters.location === 'Kikuyu' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Kikuyu')">🌿 Kikuyu</span>
        <span class="km-suburb-pill ${State.filters.location === 'Mlolongo' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Mlolongo')">✈️ Mlolongo</span>
        <span class="km-suburb-pill ${State.filters.location === 'Kasarani' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Kasarani')">📍 Kasarani</span>
        <span class="km-suburb-pill ${State.filters.location === 'South B' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('South B')">📍 South B</span>
        <span class="km-suburb-pill ${State.filters.location === 'Kileleshwa' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Kileleshwa')">📍 Kileleshwa</span>
        <span class="km-suburb-pill ${State.filters.location === 'Ngong Road' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Ngong Road')">📍 Ngong Rd</span>
        <span class="km-suburb-pill ${State.filters.location === 'Juja' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Juja')">🌿 Juja</span>
        <span class="km-suburb-pill ${State.filters.location === 'Thika' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Thika')">🌿 Thika</span>
        <span class="km-suburb-pill ${State.filters.location === 'Athi River' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Athi River')">✈️ Athi River</span>
        <span class="km-suburb-pill ${State.filters.location === 'Nyali' ? 'active' : ''}" onclick="MobileApp.setSuburbPill('Nyali')">🌊 Nyali</span>
      </div>

      <!-- Instant Matching Alerts Pill (Customer Retention) -->
      ${State.filters.location ? `
        <div style="margin: 0 14px 10px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 7px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div style="font-size: 11.5px; color: #166534; font-weight: 700;">
            <i class="fab fa-whatsapp" style="color: #25d366; font-size: 13px;"></i> Get instant alerts for new <strong>${State.filters.location}</strong> vacancies
          </div>
          <button type="button" onclick="MobileApp.openWhatsAppAlerts()" style="background: #006818; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; flex-shrink: 0; box-shadow: 0 1px 4px rgba(0,104,24,0.3);">
            Turn On
          </button>
        </div>
      ` : ''}

      <!-- Feed Header with Count, Sort Dropdown & Dual View Toggle (Grid vs List) -->
      <div class="km-feed-header">
        <div class="km-feed-count">
          <strong>${displayProps.length}</strong> listings found
        </div>
        <div class="km-feed-actions">
          <div class="km-sort-trigger" onclick="MobileApp.cycleSort()">
            <i class="fas fa-sort-amount-down"></i> <span id="km-sort-label">${getSortLabel()}</span>
          </div>
          <div class="km-view-mode-toggle">
            <button type="button" class="km-view-btn ${State.viewMode === 'grid' ? 'active' : ''}" onclick="MobileApp.setViewMode('grid')" title="Grid view">
              <i class="fas fa-th-large"></i>
            </button>
            <button type="button" class="km-view-btn ${State.viewMode === 'list' ? 'active' : ''}" onclick="MobileApp.setViewMode('list')" title="List view">
              <i class="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Listings Feed: 2-Column Grid or 1-Column List -->
      ${State.viewMode === 'grid' ? `
        <div class="km-property-grid">
          ${renderPropertyGridHtml(displayProps)}
        </div>
      ` : `
        <div class="km-property-list">
          ${renderPropertyListHtml(displayProps)}
        </div>
      `}
    `;
  }

  // Get Category Badge & Theme Color (Matches Desktop Reference)
  function getPropertyTypeBadge(p) {
    if (!p) return { label: 'Bedsitter', color: '#10b981', icon: 'fa-bed' };
    const cat = String(p.category || '').toLowerCase();
    const title = String(p.title || '').toLowerCase();
    const type = String(p.propertyType || '').toLowerCase();
    const beds = Number(p.bedrooms || 0);

    if (cat.includes('single') || title.includes('single room')) {
      return { label: 'Single Room', color: '#0284c7', icon: 'fa-door-open' };
    }
    if (cat.includes('double') || title.includes('double room')) {
      return { label: 'Double Room', color: '#ea580c', icon: 'fa-person-booth' };
    }
    if (cat.includes('bedsit') || title.includes('bedsit')) {
      return { label: 'Bedsitter', color: '#10b981', icon: 'fa-bed' };
    }
    if (cat.includes('studio') || title.includes('studio')) {
      return { label: 'Studio', color: '#06b6d4', icon: 'fa-couch' };
    }
    if (cat.includes('1 bed') || title.includes('1 bed') || (beds === 1 && !cat.includes('single') && !cat.includes('bedsit'))) {
      return { label: '1 Bedroom', color: '#059669', icon: 'fa-door-open' };
    }
    if (cat.includes('2 bed') || title.includes('2 bed') || beds === 2) {
      return { label: '2 Bedrooms', color: '#ef4444', icon: 'fa-door-closed' };
    }
    if (cat.includes('3 bed') || title.includes('3 bed') || beds === 3) {
      return { label: '3 Bedrooms', color: '#2563eb', icon: 'fa-home' };
    }
    if (cat.includes('4 bed') || title.includes('4 bed') || beds >= 4 || title.includes('4+')) {
      return { label: '4+ Bedrooms', color: '#6366f1', icon: 'fa-star' };
    }
    if (cat.includes('maisonette') || title.includes('maisonette') || type.includes('maisonette')) {
      return { label: 'Maisonette', color: '#db2777', icon: 'fa-building' };
    }
    if (cat.includes('villa') || title.includes('villa')) {
      return { label: 'Villa', color: '#006818', icon: 'fa-tree' };
    }
    if (cat.includes('bungalow') || title.includes('bungalow')) {
      return { label: 'Bungalow', color: '#d97706', icon: 'fa-home' };
    }
    if (cat.includes('bnb') || title.includes('bnb') || p.isBnb) {
      return { label: 'BnB / Stay', color: '#8b5cf6', icon: 'fa-umbrella-beach' };
    }
    if (cat.includes('commercial') || title.includes('shop') || title.includes('office')) {
      return { label: 'Commercial', color: '#475569', icon: 'fa-store' };
    }
    if (cat.includes('land') || title.includes('plot')) {
      return { label: 'Land & Plots', color: '#854d0e', icon: 'fa-map-marked-alt' };
    }
    return { label: p.category || 'Apartment', color: '#ec4899', icon: 'fa-city' };
  }

  // Render 2-Column Property Card Items
  function renderPropertyGridHtml(props) {
    if (!props || !props.length) {
      return `
        <div style="grid-column: span 2; text-align:center; padding: 40px 20px; color:#64748b;">
          <i class="fas fa-search" style="font-size:32px; color:#cbd5e1; margin-bottom:10px; display:block;"></i>
          No properties found matching your selection.<br>
          <button type="button" class="km-btn-reset-filters" style="margin-top:12px; padding:8px 16px; font-size:12px; width:auto;" onclick="MobileApp.resetFilters()">Clear Filters</button>
        </div>
      `;
    }

    return props.map((p, idx) => {
      const isFav = State.favorites.includes(p.id);
      const thumb = (p.media && p.media[0] && p.media[0].url) || p.thumbnail || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80';
      const isSale = p.category && p.category.toLowerCase().includes('sale');
      const period = p.rentPeriod || (p.isBnb ? 'night' : 'mo');
      const photoCount = (p.media && p.media.length) || 4;
      const badge = getPropertyTypeBadge(p);

      const cardHtml = `
        <div class="km-property-card" onclick="MobileApp.showScreen('detail', '${p.id}')">
          <div class="km-card-thumb-wrap">
            <img src="${thumb}" alt="${p.title}" loading="lazy">
            <span class="km-card-badge" style="background:${badge.color}; color:#ffffff; font-weight:800; font-size:10px; padding:3px 7px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.25);">
              <i class="fas ${badge.icon}" style="font-size:9px; margin-right:3px;"></i>${badge.label}
            </span>
            <span class="km-card-zero-fee"><i class="fas fa-shield-alt"></i> 0 Fee</span>
            <span class="km-card-photo-count"><i class="fas fa-camera"></i> ${photoCount}</span>
            <button type="button" class="km-card-fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); MobileApp.toggleFav('${p.id}', this)" aria-label="Save">
              <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
            </button>
          </div>
          <div class="km-card-info">
            <div class="km-card-price">KSh ${formatKsh(p.rentKes || p.price)}<span style="font-size:11px; font-weight:600; color:#64748b;">/${period}</span></div>
            <div class="km-card-title">${p.title}</div>
            <div class="km-card-specs">
              <i class="fas fa-map-marker-alt"></i>
              <span>${p.estateSuburb || p.county || 'Nairobi'}</span>
              ${p.bedrooms ? `<span style="margin-left:auto; font-weight:700;">${p.bedrooms} Bed</span>` : ''}
            </div>
          </div>
          <button type="button" class="km-card-wa-btn" onclick="event.stopPropagation(); MobileApp.chatOnWhatsApp('${p.id}')" title="Chat on WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </button>
        </div>
      `;

      // In-feed Card 1: WhatsApp Alerts (after 4 listings to allow rentals to show first)
      if (idx === 3) {
        const waCard = `
          <div class="km-mid-feed-card km-feed-card-wa" onclick="MobileApp.openWhatsAppAlerts()">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <div style="width:34px; height:34px; border-radius:50%; background:#25d366; color:white; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; box-shadow:0 2px 6px rgba(37,211,102,0.3);">
                <i class="fab fa-whatsapp"></i>
              </div>
              <div style="flex:1;">
                <div style="font-size:13px; font-weight:900; color:#0f172a;">Instant WhatsApp Vacancy Alerts</div>
                <div style="font-size:10.5px; color:#166534; font-weight:700;">Never miss a fresh vacancy</div>
              </div>
            </div>
            <div style="font-size:11.5px; color:#334155; line-height:1.4; margin-bottom:10px;">
              Hot bedsitters, single rooms & 1-bedrooms in Ruaka, Roysambu & Umoja get taken fast. Get alerted the moment new units are posted.
            </div>
            <button type="button" class="km-infeed-btn km-infeed-btn-wa" onclick="event.stopPropagation(); MobileApp.openWhatsAppAlerts()">
              <i class="fab fa-whatsapp"></i> Turn On Free WhatsApp Alerts
            </button>
          </div>
        `;
        return cardHtml + waCard;
      }

      // In-feed Card 2: 72-Hour Personal Hunter (after 6 listings)
      if (idx === 5) {
        const huntCard = `
          <div class="km-mid-feed-card km-feed-card-hunt" onclick="MobileApp.openHouseHunt()">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <div style="width:34px; height:34px; border-radius:50%; background:#006818; color:white; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; box-shadow:0 2px 6px rgba(0,104,24,0.3);">
                <i class="fas fa-search-location"></i>
              </div>
              <div style="flex:1;">
                <div style="font-size:13px; font-weight:900; color:#0f172a;">Can't Find Your Ideal Keja?</div>
                <div style="font-size:10.5px; color:#006818; font-weight:700;">72-Hour Dedicated Ground Agent (KSh 2,000)</div>
              </div>
            </div>
            <div style="font-size:11.5px; color:#334155; line-height:1.4; margin-bottom:10px;">
              Avoid rogue brokers. Our ground agents physically inspect vacancies, test water & token meters, and schedule viewings for you.
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" class="km-infeed-btn km-infeed-btn-hunt" onclick="event.stopPropagation(); MobileApp.openHouseHunt()">
                <i class="fas fa-search-location"></i> Hire Hunter (KSh 2,000)
              </button>
              <button type="button" class="km-infeed-btn km-infeed-btn-track" onclick="event.stopPropagation(); MobileApp.trackHunt()">
                <i class="fas fa-clock"></i> Track Hunt
              </button>
            </div>
          </div>
        `;
        return cardHtml + huntCard;
      }

      // In-feed Card 3: Affordability Calculator (after 9 listings)
      if (idx === 9) {
        const midFeedBanner = `
          <div class="km-mid-feed-card" onclick="MobileApp.showScreen('afford')">
            <div class="km-mid-feed-info">
              <div class="km-mid-feed-title"><i class="fas fa-calculator" style="color:#a5b4fc;"></i> What Can I Afford?</div>
              <div class="km-mid-feed-desc">Calculate your safe rental budget in 30 seconds based on your monthly income.</div>
            </div>
            <button type="button" class="km-mid-feed-btn" onclick="event.stopPropagation(); MobileApp.showScreen('afford')">
              Calculate &rarr;
            </button>
          </div>
        `;
        return cardHtml + midFeedBanner;
      }

      return cardHtml;
    }).join('');
  }

  // Render 1-Column List Card Items (KejaMarket Standard)
  function renderPropertyListHtml(props) {
    if (!props || !props.length) {
      return `
        <div style="text-align:center; padding: 40px 20px; color:#64748b;">
          <i class="fas fa-search" style="font-size:32px; color:#cbd5e1; margin-bottom:10px; display:block;"></i>
          No properties found matching your criteria.
        </div>
      `;
    }

    return props.map((p, idx) => {
      const isFav = State.favorites.includes(p.id);
      const thumb = (p.media && p.media[0] && p.media[0].url) || p.thumbnail || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80';
      const period = p.rentPeriod || (p.isBnb ? 'night' : 'mo');
      const phone = p.landlord?.phone || p.phone || p.contactPhone || '+254792409540';
      const badge = getPropertyTypeBadge(p);

      const cardHtml = `
        <div class="km-list-card" onclick="MobileApp.showScreen('detail', '${p.id}')">
          <div style="position:relative; width:110px; height:110px; flex-shrink:0;">
            <img src="${thumb}" alt="${p.title}" class="km-list-thumb" loading="lazy" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">
            <span class="km-card-badge" style="position:absolute; top:6px; left:6px; background:${badge.color}; color:#ffffff; font-weight:800; font-size:9.5px; padding:2px 6px; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.3);">
              <i class="fas ${badge.icon}" style="font-size:8.5px; margin-right:2px;"></i>${badge.label}
            </span>
          </div>
          <div class="km-list-body">
            <div>
              <div class="km-list-price">KSh ${formatKsh(p.rentKes || p.price)}<span style="font-size:11px; font-weight:600; color:#64748b;">/${period}</span></div>
              <div class="km-list-title">${p.title}</div>
              <div class="km-list-location">
                <i class="fas fa-map-marker-alt" style="color:#006818;"></i>
                ${p.estateSuburb || p.county || 'Nairobi'} • Verified Listing
              </div>
            </div>
            <div class="km-list-tags">
              <span class="km-list-tag" style="background:${badge.color}15; color:${badge.color}; font-weight:800; border:1px solid ${badge.color}30;">
                <i class="fas ${badge.icon}"></i> ${badge.label}
              </span>
              ${p.bedrooms ? `<span class="km-list-tag">${p.bedrooms} Beds</span>` : ''}
              <span class="km-list-tag" style="background:#f0fdf4; color:#166534; font-weight:800;"><i class="fas fa-shield-alt"></i> 0 Viewing Fee</span>
              <span class="km-list-tag">Verified Landlord</span>
            </div>
            <div class="km-list-actions">
              <a href="tel:${phone}" class="km-list-call-btn" onclick="event.stopPropagation()">
                <i class="fas fa-phone-alt"></i> Call
              </a>
              <button type="button" class="km-list-wa-btn" onclick="event.stopPropagation(); MobileApp.chatOnWhatsApp('${p.id}')">
                <i class="fab fa-whatsapp"></i> WhatsApp
              </button>
              <button type="button" class="km-card-fav-btn ${isFav ? 'active' : ''}" style="position:static; margin-left:auto; width:30px; height:30px;" onclick="event.stopPropagation(); MobileApp.toggleFav('${p.id}', this)">
                <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
              </button>
            </div>
          </div>
        </div>
      `;

      if (idx === 3) {
        const waCard = `
          <div class="km-mid-feed-card km-feed-card-wa" style="margin: 10px 14px;" onclick="MobileApp.openWhatsAppAlerts()">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <div style="width:34px; height:34px; border-radius:50%; background:#25d366; color:white; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
                <i class="fab fa-whatsapp"></i>
              </div>
              <div style="flex:1;">
                <div style="font-size:13px; font-weight:900; color:#0f172a;">Instant WhatsApp Vacancy Alerts</div>
                <div style="font-size:10.5px; color:#166534; font-weight:700;">Never miss a fresh vacancy</div>
              </div>
            </div>
            <div style="font-size:11.5px; color:#334155; line-height:1.4; margin-bottom:10px;">
              Get notified the exact minute verified landlords post new bedsitters, single rooms & 1-bedrooms in your preferred estate.
            </div>
            <button type="button" class="km-infeed-btn km-infeed-btn-wa" onclick="event.stopPropagation(); MobileApp.openWhatsAppAlerts()">
              <i class="fab fa-whatsapp"></i> Turn On Free Alerts
            </button>
          </div>
        `;
        return cardHtml + waCard;
      }

      if (idx === 4) {
        const huntCard = `
          <div class="km-mid-feed-card km-feed-card-hunt" style="margin: 10px 14px;" onclick="MobileApp.openHouseHunt()">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <div style="width:34px; height:34px; border-radius:50%; background:#006818; color:white; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0;">
                <i class="fas fa-search-location"></i>
              </div>
              <div style="flex:1;">
                <div style="font-size:13px; font-weight:900; color:#0f172a;">Can't Find Your Ideal Keja?</div>
                <div style="font-size:10.5px; color:#006818; font-weight:700;">Hire a Ground Hunter (KSh 2,000)</div>
              </div>
            </div>
            <div style="font-size:11.5px; color:#334155; line-height:1.4; margin-bottom:10px;">
              Our verified ground agents physically inspect vacancies, check token meters & water, and schedule viewings for you in 72h.
            </div>
            <button type="button" class="km-infeed-btn km-infeed-btn-hunt" onclick="event.stopPropagation(); MobileApp.openHouseHunt()">
              <i class="fas fa-search-location"></i> Hire Personal Hunter
            </button>
          </div>
        `;
        return cardHtml + huntCard;
      }

      return cardHtml;
    }).join('');
  }

  // ==========================================
  // SCREEN 2: BROWSE / SEARCH RESULTS
  // ==========================================
  function renderBrowseScreen(hSlot, mSlot, params = {}) {
    if (params.category) State.selectedCategory = params.category;
    if (params.location) State.filters.location = params.location;
    if (params.searchList) {
      renderHomeScreen(hSlot, mSlot);
      return;
    }
    renderHomeScreen(hSlot, mSlot);
  }

  // ==========================================
  // SCREEN 3: PROPERTY DETAILS (KEJAMARKET STANDARD)
  // ==========================================
  async function renderDetailScreen(hSlot, mSlot, propId) {
    let prop = State.properties.find(p => p.id === propId);
    if (!prop && propId) {
      try {
        const res = await fetch(`/api/properties/${encodeURIComponent(propId)}`);
        if (res.ok) {
          const data = await res.json();
          prop = data.property || data;
          if (prop) {
            State.properties.unshift(prop);
          }
        }
      } catch (err) {
        console.warn('Could not fetch single property by id:', err);
      }
    }
    if (!prop) prop = State.properties[0];
    if (!prop) {
      showScreen('home');
      return;
    }
    State.selectedProperty = prop;
    State.activePhotoIndex = 0;

    const isFav = State.favorites.includes(prop.id);
    let media = [];
    if (prop.photos && Array.isArray(prop.photos) && prop.photos.length > 0) {
      media = prop.photos.map(p => typeof p === 'string' ? { url: p } : p);
    } else if (prop.media && Array.isArray(prop.media) && prop.media.length > 0) {
      media = prop.media.map(m => typeof m === 'string' ? { url: m } : m);
    } else {
      media = [{ url: prop.thumbnail || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80' }];
    }

    const period = prop.rentPeriod || (prop.isBnb ? 'night' : 'mo');
    const landlordName = prop.landlord?.name || prop.landlordName || prop.owner_name || 'Verified Landlord';
    const landlordInitials = landlordName.split(' ').map(n => n.charAt(0)).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'VL';
    const phone = prop.landlord?.phone || prop.phone || prop.contactPhone || '+254112377651';
    const wa = prop.landlord?.whatsapp || prop.whatsapp || phone;
    const cleanWa = wa.replace(/[^0-9]/g, '');
    const coords = getCoordinatesForProperty(prop);

    // Header Slot
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">${prop.title}</span>
        <div style="display:flex; gap:6px;">
          <button type="button" class="back-btn" onclick="MobileApp.toggleFav('${prop.id}', this)"><i class="${isFav ? 'fas' : 'far'} fa-heart" style="${isFav ? 'color:#ef4444;' : ''}"></i></button>
          <button type="button" class="back-btn" onclick="MobileApp.shareProperty('${prop.id}')"><i class="fas fa-share-alt"></i></button>
        </div>
      </div>
    `;

    // Similar listings (always guarantee 4 related houses)
    let similar = State.properties
      .filter(p => p.id !== prop.id && (p.estateSuburb === prop.estateSuburb || p.category === prop.category))
      .slice(0, 4);
    if (similar.length === 0) {
      similar = State.properties.filter(p => p.id !== prop.id).slice(0, 4);
    }

    const badge = getPropertyTypeBadge(prop);

    // Main Slot
    mSlot.innerHTML = `
      <div class="km-detail-screen">
        <!-- Touch-Swipeable Image Carousel -->
        <div class="km-detail-carousel" id="km-detail-carousel-box">
          <img id="km-detail-hero-img" src="${media[0].url}" alt="${prop.title}">
          <span class="km-detail-img-badge" style="position:absolute; top:12px; left:12px; z-index:4; background:${badge.color}; color:#ffffff; font-weight:800; font-size:11px; padding:4px 10px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:inline-flex; align-items:center; gap:5px;">
            <i class="fas ${badge.icon}"></i> ${badge.label}
          </span>
          <div class="km-carousel-counter" id="km-carousel-counter">
            <i class="fas fa-camera"></i> <span id="km-photo-cur">1</span> / ${media.length}
          </div>
        </div>

        <!-- Thumbnails Strip -->
        <div class="km-detail-thumbs">
          ${media.map((m, idx) => `
            <img src="${m.url}" class="km-detail-thumb ${idx === 0 ? 'active' : ''}" onclick="MobileApp.switchHeroPhoto('${m.url}', ${idx + 1}, ${media.length}, this)">
          `).join('')}
        </div>

        <!-- Detail Content -->
        <div class="km-detail-content">
          <!-- Price & House Type Badge -->
          <div class="km-detail-price-row">
            <div class="km-detail-price">KSh ${formatKsh(prop.rentKes || prop.price)}<span style="font-size:13px; font-weight:600; color:#64748b;">/${period}</span></div>
            <span class="km-detail-type-badge" style="background:${badge.color}; color:#ffffff; font-weight:800; font-size:11.5px; padding:3px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px; box-shadow:0 1px 3px rgba(0,0,0,0.15);">
              <i class="fas ${badge.icon}"></i> ${badge.label}
            </span>
          </div>

          <h1 class="km-detail-title">${prop.title}</h1>

          <div class="km-detail-location">
            <i class="fas fa-map-marker-alt" style="color:#006818;"></i>
            ${prop.estateSuburb || prop.county || 'Nairobi'} • 100% Verified Location
          </div>

          <!-- Trust Guarantee & Zero Viewing Fee Banner (Reemio-Beating Guarantee) -->
          <div class="km-zero-viewing-fee-card">
            <div class="km-zero-fee-icon"><i class="fas fa-shield-alt"></i></div>
            <div class="km-zero-fee-content">
              <div class="km-zero-fee-title"><i class="fas fa-check-circle" style="color:#006818;"></i> 100% Free Viewings Guaranteed</div>
              <div class="km-zero-fee-sub">KejaMarket strictly bans all viewing fees. Never send money to an agent or broker just to view this house.</div>
              <div style="font-size:10.5px; color:#166534; margin-top:4px; font-weight:700;"><i class="fas fa-check-double" style="color:#006818;"></i> Physical Inspection Verified • Tap Water Pressure & Token Meter Tested</div>
            </div>
          </div>

          <!-- Key Property Specifications (6-Card Grid) -->
          <div class="km-specs-grid">
            <div class="km-spec-card">
              <div class="km-spec-card-icon"><i class="fas fa-bed"></i></div>
              <div class="km-spec-card-value">${prop.bedrooms || 1} Bed</div>
              <div class="km-spec-card-label">Bedrooms</div>
            </div>
            <div class="km-spec-card">
              <div class="km-spec-card-icon"><i class="fas fa-bath"></i></div>
              <div class="km-spec-card-value">${prop.bathrooms || 1} Bath</div>
              <div class="km-spec-card-label">Bathrooms</div>
            </div>
            <div class="km-spec-card">
              <div class="km-spec-card-icon"><i class="fas fa-ruler-combined"></i></div>
              <div class="km-spec-card-value">${prop.sizeSqft || prop.sizeSqm || 25} sqm</div>
              <div class="km-spec-card-label">Floor Area</div>
            </div>
            <div class="km-spec-card">
              <div class="km-spec-card-icon"><i class="fas fa-money-bill-wave"></i></div>
              <div class="km-spec-card-value">${prop.depositKes ? 'KSh ' + formatKsh(prop.depositKes) : '1 Month'}</div>
              <div class="km-spec-card-label">Deposit</div>
            </div>
            <div class="km-spec-card">
              <div class="km-spec-card-icon"><i class="fas ${prop.isBnb ? 'fa-couch' : 'fa-tint'}"></i></div>
              <div class="km-spec-card-value">${prop.isBnb ? (prop.isFurnished ? 'Furnished' : 'Equipped') : (prop.waterSupplyType || 'Borehole')}</div>
              <div class="km-spec-card-label">${prop.isBnb ? 'Furnishing' : 'Water Supply'}</div>
            </div>
            <div class="km-spec-card">
              <div class="km-spec-card-icon"><i class="fas fa-bolt"></i></div>
              <div class="km-spec-card-value">Tokens</div>
              <div class="km-spec-card-label">Electricity</div>
            </div>
          </div>

          <!-- Upfront Move-In Cost Breakdown (Reemio-Beating Transparency) -->
          <div class="km-move-in-breakdown-card">
            <div class="km-breakdown-header">
              <h4><i class="fas fa-calculator" style="color:#006818;"></i> Transparent Move-In Breakdown</h4>
              <span class="km-breakdown-badge">Upfront Terms</span>
            </div>
            <div class="km-breakdown-rows">
              <div class="km-breakdown-row">
                <span>1st Month Rent</span>
                <strong>KSh ${formatKsh(prop.rentKes || prop.price)}</strong>
              </div>
              <div class="km-breakdown-row">
                <span>Refundable Security Deposit</span>
                <strong>KSh ${formatKsh(prop.depositKes || prop.rentKes || prop.price)}</strong>
              </div>
              <div class="km-breakdown-row">
                <span>Water Deposit / Account</span>
                <span class="km-row-highlight">Metered / Pre-paid (KSh 0)</span>
              </div>
              <div class="km-breakdown-row">
                <span>Electricity (KPLC Token)</span>
                <span class="km-row-highlight">Direct Token Meter (KSh 0)</span>
              </div>
              <div class="km-breakdown-row">
                <span>Service Charge (Garbage & Security)</span>
                <span class="km-row-highlight">Included</span>
              </div>
              <div class="km-breakdown-divider"></div>
              <div class="km-breakdown-row km-breakdown-total">
                <span>Estimated Total Move-In</span>
                <span class="km-total-amount">KSh ${formatKsh(Number(prop.rentKes || prop.price) + Number(prop.depositKes || prop.rentKes || prop.price))}</span>
              </div>
            </div>
          </div>

          <!-- Living Quality & Utilities Checklist -->
          <div class="km-utility-card">
            <h4><i class="fas fa-check-double" style="color:#006818;"></i> Verified Living Quality & Utilities</h4>
            <div class="km-utility-grid">
              <div class="km-util-item"><i class="fas fa-tint" style="color:#0284c7;"></i> <div><strong>24/7 Water Supply</strong><span>Borehole + Council backup</span></div></div>
              <div class="km-util-item"><i class="fas fa-bolt" style="color:#f59e0b;"></i> <div><strong>Private KPLC Token</strong><span>Direct paybill, private meter</span></div></div>
              <div class="km-util-item"><i class="fas fa-wifi" style="color:#8b5cf6;"></i> <div><strong>High-Speed Fibre</strong><span>Safaricom & Faiba ready</span></div></div>
              <div class="km-util-item"><i class="fas fa-car" style="color:#10b981;"></i> <div><strong>Secure Parking</strong><span>Free dedicated slot inside gate</span></div></div>
              <div class="km-util-item"><i class="fas fa-shield-alt" style="color:#006818;"></i> <div><strong>Estate Security</strong><span>CCTV + Electric perimeter</span></div></div>
              <div class="km-util-item"><i class="fas fa-trash-alt" style="color:#64748b;"></i> <div><strong>Garbage Collection</strong><span>Included in service charge</span></div></div>
            </div>
          </div>

          <!-- Amenities Section -->
          <div class="km-amenities-section">
            <h4>Features & Amenities</h4>
            <div class="km-amenities-chips-wrap">
              <span class="km-amenity-chip"><i class="fas fa-tint"></i> Borehole Water 24/7</span>
              <span class="km-amenity-chip"><i class="fas fa-wifi"></i> WiFi Ready</span>
              <span class="km-amenity-chip"><i class="fas fa-parking"></i> Dedicated Parking</span>
              <span class="km-amenity-chip"><i class="fas fa-video"></i> CCTV & 24/7 Guards</span>
              <span class="km-amenity-chip"><i class="fas fa-door-closed"></i> Gated Community</span>
              <span class="km-amenity-chip"><i class="fas fa-solar-panel"></i> Solar Water Heating</span>
            </div>
          </div>

          <!-- Description Section -->
          <div class="km-detail-description">
            <h4>Description</h4>
            <p>${prop.description || 'Spacious, well-ventilated property in a secure gated estate. Includes token electricity meter, ample parking, borehole water backup, and perimeter electric fence.'}</p>
          </div>

          <!-- Location & Interactive Leaflet Neighborhood Map -->
          <div class="km-detail-map-box">
            <div class="km-detail-map-header">
              <div>
                <div class="km-map-title"><i class="fas fa-map-marked-alt" style="color:#006818;"></i> Location & Neighborhood Map</div>
                <div class="km-map-sub">${prop.estateSuburb || prop.county || coords.areaName || 'Nairobi'} • Verified Direct Location</div>
              </div>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}" target="_blank" rel="noopener noreferrer" class="km-map-dir-btn">
                <i class="fas fa-directions"></i> Directions
              </a>
            </div>
            <div id="km-mobile-detail-map" class="km-mobile-detail-map"></div>
            <div class="km-map-footer-note" style="color:#006818; font-weight:700; font-size:11.5px; display:flex; align-items:center; gap:6px;">
              <i class="fas fa-check-circle" style="color:#006818;"></i> 100% Verified Location & Direct Directions
            </div>
          </div>

          <!-- Landlord Profile & 4-Way Direct Communication Hub -->
          <div class="km-landlord-card">
            <div class="km-landlord-info">
              <div class="km-landlord-avatar">${landlordInitials}</div>
              <div style="flex:1;">
                <div class="km-landlord-name">${landlordName}</div>
                <div class="km-landlord-meta"><i class="fas fa-check-circle" style="color:#006818;"></i> Identity Verified • Direct Landlord • Replies fast</div>
              </div>
            </div>

            <div class="km-comm-hub-grid">
              <button type="button" class="km-comm-hub-btn km-comm-chat" onclick="MobileApp.showScreen('chat', '${prop.id}')">
                <i class="fas fa-comment-dots"></i>
                <span>In-App Chat</span>
              </button>
              <a href="https://wa.me/${cleanWa}?text=${encodeURIComponent('Hi ' + landlordName + ', I saw your ' + prop.title + ' in ' + (prop.estateSuburb || 'Nairobi') + ' (KSh ' + formatKsh(prop.rentKes || prop.price) + ') on KejaMarket. Is it available for viewing?')}" target="_blank" rel="noopener noreferrer" class="km-comm-hub-btn km-comm-wa">
                <i class="fab fa-whatsapp"></i>
                <span>WhatsApp</span>
              </a>
              <a href="tel:${phone}" class="km-comm-hub-btn km-comm-call">
                <i class="fas fa-phone-alt"></i>
                <span>Call Directly</span>
              </a>
              <button type="button" class="km-comm-hub-btn km-comm-view" onclick="MobileApp.showScreen('request-viewing', '${prop.id}')">
                <i class="fas fa-calendar-check"></i>
                <span>Book Viewing</span>
              </button>
            </div>
          </div>

          <!-- KejaMarket Verified Safety Tips Card -->
          <div class="km-safety-tips-card">
            <h4><i class="fas fa-shield-alt"></i> KejaMarket Verified Safety Tips</h4>
            <ul>
              <li>Do not pay any viewing fee or deposit before visiting the property in person.</li>
              <li>Always meet the caretaker or landlord inside the physical unit.</li>
              <li>Confirm tap water pressure and electricity token meters before making payment.</li>
            </ul>
          </div>

          <!-- Similar Properties / Other Related Houses Section -->
          ${similar.length > 0 ? `
            <div class="km-similar-section" style="margin-top:22px; padding-top:16px; border-top:1px solid #e2e8f0;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                <div>
                  <h4 style="font-size:15px; font-weight:800; color:#0f172a; margin:0; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-home" style="color:#006818;"></i> Other Related Houses
                  </h4>
                  <div style="font-size:11.5px; color:#64748b; margin-top:2px;">
                    Similar verified vacancies in ${prop.estateSuburb || prop.county || 'Nairobi'}
                  </div>
                </div>
                <button type="button" onclick="MobileApp.showScreen('home')" style="font-size:11.5px; font-weight:700; color:#006818; background:#f0fdf4; border:1px solid #86efac; border-radius:14px; padding:4px 10px; cursor:pointer;">
                  View All
                </button>
              </div>
              <div class="km-property-grid" style="padding:0;">
                ${renderPropertyGridHtml(similar)}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- FIXED STICKY ACTION BAR AT BOTTOM (CALL, WHATSAPP, BOOKING) -->
        <div class="km-detail-bottom-bar">
          <a href="tel:${phone}" class="km-btn-call">
            <i class="fas fa-phone-alt"></i> Call Landlord
          </a>
          <a href="https://wa.me/${cleanWa}?text=${encodeURIComponent('Hi ' + landlordName + ', I am interested in viewing your property: ' + prop.title + ' (KSh ' + formatKsh(prop.rentKes || prop.price) + ') listed on KejaMarket. Is it available for viewing?')}" target="_blank" class="km-btn-wa">
            <i class="fab fa-whatsapp"></i> WhatsApp
          </a>
          <button type="button" class="km-btn-viewing" onclick="MobileApp.showScreen('request-viewing', '${prop.id}')">
            <i class="fas fa-calendar-check"></i> Book
          </button>
          <button type="button" class="km-btn-save-fav ${isFav ? 'active' : ''}" onclick="MobileApp.toggleFav('${prop.id}', this)">
            <i class="${isFav ? 'fas' : 'far'} fa-heart" style="${isFav ? 'color:#ef4444;' : ''}"></i>
          </button>
        </div>
      </div>
    `;

    setupDetailSwipe(media);
    setTimeout(() => {
      initMobileDetailMap(prop);
    }, 150);
  }

  // Initialize or refresh Leaflet map on mobile detail screen
  function initMobileDetailMap(property, retryCount = 0) {
    const mapEl = document.getElementById('km-mobile-detail-map');
    if (!mapEl) return;

    if (typeof L === 'undefined') {
      if (retryCount < 15) {
        setTimeout(() => initMobileDetailMap(property, retryCount + 1), 200);
      }
      return;
    }

    if (State.mobileDetailMap) {
      try {
        State.mobileDetailMap.remove();
      } catch (e) {}
      State.mobileDetailMap = null;
    }

    const coords = getCoordinatesForProperty(property);
    const rentText = property.rentKes || property.price || 0;
    const titleText = property.title || 'Property';

    try {
      const map = L.map('km-mobile-detail-map', {
        attributionControl: false,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
        tap: true
      }).setView([coords.lat, coords.lng], 15);

      // High-performance CartoDB Voyager tiles (never blocked with 403 like OSM)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // KejaMarket Signature Green Pin
      const pinIcon = L.divIcon({
        className: 'km-leaflet-pin',
        html: `<div style="background:#006818; color:white; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.35); border:2.5px solid white; font-size:14px;"><i class="fas fa-home"></i></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      L.marker([coords.lat, coords.lng], { icon: pinIcon }).addTo(map)
        .bindPopup(`<b>${titleText}</b><br><span style="color:#006818;font-weight:800;">KSh ${Number(rentText).toLocaleString()}/mo</span><br><small>${property.estateSuburb || coords.areaName}</small>`)
        .openPopup();

      L.circle([coords.lat, coords.lng], {
        radius: 250,
        color: '#006818',
        fillColor: '#1db010',
        fillOpacity: 0.16,
        weight: 2
      }).addTo(map);

      State.mobileDetailMap = map;

      // Invalidate size to guarantee full tile rendering
      setTimeout(() => {
        if (State.mobileDetailMap) State.mobileDetailMap.invalidateSize();
      }, 250);
      setTimeout(() => {
        if (State.mobileDetailMap) State.mobileDetailMap.invalidateSize();
      }, 600);
    } catch (err) {
      console.error('Failed to initialize mobile detail map:', err);
    }
  }

  // Setup Touch Swipe on Detail Photo Carousel
  function setupDetailSwipe(media) {
    const el = document.getElementById('km-detail-carousel-box');
    if (!el || !media || media.length <= 1) return;
    let startX = 0;
    el.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    el.addEventListener('touchend', e => {
      const endX = e.changedTouches[0].clientX;
      const diff = endX - startX;
      if (Math.abs(diff) > 40) {
        if (!isUserLoggedIn()) {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('Please sign in or create an account to browse photos.', 'info');
          }
          if (window.kejaAuth && typeof window.kejaAuth.requireTenantAuth === 'function') {
            window.kejaAuth.requireTenantAuth();
          } else {
            openSignIn();
          }
          return;
        }
        if (diff > 40) {
          // Swipe Right -> Prev photo
          State.activePhotoIndex = (State.activePhotoIndex - 1 + media.length) % media.length;
          updateActivePhoto(media);
        } else if (diff < -40) {
          // Swipe Left -> Next photo
          State.activePhotoIndex = (State.activePhotoIndex + 1) % media.length;
          updateActivePhoto(media);
        }
      }
    }, { passive: true });
  }

  function updateActivePhoto(media) {
    const hero = document.getElementById('km-detail-hero-img');
    const curEl = document.getElementById('km-photo-cur');
    if (hero && media[State.activePhotoIndex]) {
      hero.src = media[State.activePhotoIndex].url;
    }
    if (curEl) {
      curEl.textContent = State.activePhotoIndex + 1;
    }
    document.querySelectorAll('.km-detail-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === State.activePhotoIndex);
    });
  }

  // ==========================================
  // SCREEN 4: FILTERS (BOTTOM SHEET / SCREEN)
  // ==========================================
  function renderFiltersScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-times"></i></button>
        <span class="screen-title">Filter Properties</span>
        <button type="button" class="header-action" onclick="MobileApp.resetFilters()">Reset</button>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-filters-screen">
        <!-- Property Type -->
        <div class="km-filter-group">
          <div class="km-filter-title">Property Type</div>
          <div class="km-filter-chip-grid">
            <div class="km-fchip ${State.selectedCategory === 'all' ? 'active' : ''}" onclick="MobileApp.setFilterType('all', this)">All Types</div>
            <div class="km-fchip ${State.selectedCategory === 'single-room' ? 'active' : ''}" onclick="MobileApp.setFilterType('single-room', this)">Single Room</div>
            <div class="km-fchip ${State.selectedCategory === 'double-room' ? 'active' : ''}" onclick="MobileApp.setFilterType('double-room', this)">Double Room</div>
            <div class="km-fchip ${State.selectedCategory === 'bedsitters' ? 'active' : ''}" onclick="MobileApp.setFilterType('bedsitters', this)">Bedsitters</div>
            <div class="km-fchip ${State.selectedCategory === 'studio' ? 'active' : ''}" onclick="MobileApp.setFilterType('studio', this)">Studio Apartment</div>
            <div class="km-fchip ${State.selectedCategory === '1-bedroom' ? 'active' : ''}" onclick="MobileApp.setFilterType('1-bedroom', this)">1 Bedroom</div>
            <div class="km-fchip ${State.selectedCategory === '2-bedroom' ? 'active' : ''}" onclick="MobileApp.setFilterType('2-bedroom', this)">2 Bedrooms</div>
            <div class="km-fchip ${State.selectedCategory === '3-bedroom' ? 'active' : ''}" onclick="MobileApp.setFilterType('3-bedroom', this)">3+ Bedrooms</div>
            <div class="km-fchip ${State.selectedCategory === 'apartments' ? 'active' : ''}" onclick="MobileApp.setFilterType('apartments', this)">Apartments / Flats</div>
            <div class="km-fchip ${State.selectedCategory === 'mansion' ? 'active' : ''}" onclick="MobileApp.setFilterType('mansion', this)">Maisonettes / Compound</div>
            <div class="km-fchip ${State.selectedCategory === 'bnb' ? 'active' : ''}" onclick="MobileApp.setFilterType('bnb', this)">BnB / Short Stay</div>
            <div class="km-fchip ${State.selectedCategory === 'commercial' ? 'active' : ''}" onclick="MobileApp.setFilterType('commercial', this)">Commercial / Shops</div>
            <div class="km-fchip ${State.selectedCategory === 'land' ? 'active' : ''}" onclick="MobileApp.setFilterType('land', this)">Land & Plots</div>
          </div>
        </div>

        <!-- Quick Budget Presets -->
        <div class="km-filter-group">
          <div class="km-filter-title">Quick Budget Presets (KSh)</div>
          <div class="km-filter-chip-grid">
            <div class="km-fchip" onclick="MobileApp.setBudgetPreset(0, 5000, this)">Under 5K</div>
            <div class="km-fchip" onclick="MobileApp.setBudgetPreset(5000, 10000, this)">5K - 10K</div>
            <div class="km-fchip" onclick="MobileApp.setBudgetPreset(10000, 20000, this)">10K - 20K</div>
            <div class="km-fchip" onclick="MobileApp.setBudgetPreset(20000, 35000, this)">20K - 35K</div>
            <div class="km-fchip" onclick="MobileApp.setBudgetPreset(35000, 60000, this)">35K - 60K</div>
            <div class="km-fchip" onclick="MobileApp.setBudgetPreset(60000, 999999, this)">60K+</div>
          </div>
        </div>

        <!-- Location / County & Area Hierarchy Breakdown -->
        <div class="km-filter-group">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
            <div class="km-filter-title" style="margin-bottom:0;">County &amp; Area Breakdown</div>
            <span style="font-size:11.5px; font-weight:800; color:#006818; background:#dcfce7; padding:2px 8px; border-radius:12px;" id="km-filter-active-loc-badge">${State.filters.location || 'All Kenya'}</span>
          </div>
          <div style="font-size:11px; color:#64748b; margin-bottom:8px;">Select a county/region, then pick your area and sub-zone:</div>

          <!-- County Filter Tabs - All 47 Kenya counties grouped by region -->
          <div class="km-filter-county-tabs" id="km-filter-county-tabs">
            <button type="button" class="km-filter-county-tab ${(!State.activeFilterCounty || State.activeFilterCounty === 'all') ? 'active' : ''}" onclick="MobileApp.switchFilterCounty('all', this)">🇰🇪 All Kenya</button>
            <button type="button" class="km-filter-county-tab ${State.activeFilterCounty === 'nairobi' ? 'active' : ''}" onclick="MobileApp.switchFilterCounty('nairobi', this)">🏙️ Nairobi City</button>
            <button type="button" class="km-filter-county-tab ${State.activeFilterCounty === 'kiambu' ? 'active' : ''}" onclick="MobileApp.switchFilterCounty('kiambu', this)">🌿 Kiambu County</button>
            <button type="button" class="km-filter-county-tab ${State.activeFilterCounty === 'machakos' ? 'active' : ''}" onclick="MobileApp.switchFilterCounty('machakos', this)">✈️ Machakos County</button>
            <button type="button" class="km-filter-county-tab ${State.activeFilterCounty === 'kajiado' ? 'active' : ''}" onclick="MobileApp.switchFilterCounty('kajiado', this)">🦁 Kajiado County</button>
            <button type="button" class="km-filter-county-tab ${State.activeFilterCounty === 'mombasa' ? 'active' : ''}" onclick="MobileApp.switchFilterCounty('mombasa', this)">🌊 Mombasa &amp; Coast</button>
            <button type="button" class="km-filter-county-tab ${State.activeFilterCounty === 'nakuru' ? 'active' : ''}" onclick="MobileApp.switchFilterCounty('nakuru', this)">🦩 Nakuru &amp; Rift Valley</button>
            <button type="button" class="km-filter-county-tab ${State.activeFilterCounty === 'kisumu' ? 'active' : ''}" onclick="MobileApp.switchFilterCounty('kisumu', this)">🐟 Kisumu &amp; Western</button>
            <button type="button" class="km-filter-county-tab ${State.activeFilterCounty === 'eldoret' ? 'active' : ''}" onclick="MobileApp.switchFilterCounty('eldoret', this)">🏃 Eldoret &amp; North Rift</button>
            <button type="button" class="km-filter-county-tab ${State.activeFilterCounty === 'eastern' ? 'active' : ''}" onclick="MobileApp.switchFilterCounty('eastern', this)">🌄 Eastern Kenya</button>
            <button type="button" class="km-filter-county-tab ${State.activeFilterCounty === 'central' ? 'active' : ''}" onclick="MobileApp.switchFilterCounty('central', this)">🏔️ Central Kenya</button>
          </div>

          <!-- Live Suburb Filter Search Bar -->
          <div style="margin: 8px 0 10px;">
            <div class="km-search-pill" style="margin:0; background:#f8fafc; border:1px solid #cbd5e1; height:38px;">
              <i class="fas fa-search search-icon" style="font-size:12px; color:#64748b;"></i>
              <input type="text" id="km-filter-loc-input" placeholder="Quick search area or estate (e.g. Syokimau, Ruaka, Nyali...)" oninput="MobileApp.filterCustomLocationChips(this.value)" autocomplete="off" style="font-size:12px;">
            </div>
          </div>

          <!-- Dynamic Suburb / Residential Area Chips Grid -->
          <div class="km-filter-chip-grid" id="km-filter-areas-grid">
            ${renderFilterAreaChips(State.activeFilterCounty || 'all')}
          </div>

          <!-- Sub-Zone Drilldown Box (Shown when parent area with sub-zones is selected) -->
          <div id="km-filter-subzones-box" style="display:none;" class="km-filter-subzones-box">
            <div class="km-filter-subzone-header">
              <div class="km-filter-subzone-title"><i class="fas fa-layer-group"></i> <span id="km-subzone-parent-name">Sub-Zones / Roads</span></div>
              <button type="button" style="background:none; border:none; font-size:12px; font-weight:800; color:#64748b; cursor:pointer;" onclick="document.getElementById('km-filter-subzones-box').style.display='none'"><i class="fas fa-times"></i></button>
            </div>
            <div class="km-filter-subzone-chips" id="km-filter-subzone-chips"></div>
          </div>
        </div>

        <!-- Custom Price Range -->
        <div class="km-filter-group">
          <div class="km-filter-title">Custom Price Range (KSh)</div>
          <div class="km-range-inputs">
            <input type="number" class="km-range-input" placeholder="Min KSh" id="km-filter-min" value="${State.filters.minPrice || ''}">
            <span style="color:#94a3b8; font-weight:800;">-</span>
            <input type="number" class="km-range-input" placeholder="Max KSh" id="km-filter-max" value="${State.filters.maxPrice || ''}">
          </div>
        </div>

        <!-- Bedrooms Selector -->
        <div class="km-filter-group">
          <div class="km-filter-title">Bedrooms</div>
          <div class="km-filter-chip-grid">
            <div class="km-fchip ${State.filters.beds === 'any' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('any', this)">Any</div>
            <div class="km-fchip ${State.filters.beds === 'single' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('single', this)"><i class="fas fa-door-closed"></i> Single / Double</div>
            <div class="km-fchip ${State.filters.beds === 'bedsitter' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('bedsitter', this)"><i class="fas fa-bed"></i> Bedsitter / Studio</div>
            <div class="km-fchip ${State.filters.beds === '1' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('1', this)">1+ Bed</div>
            <div class="km-fchip ${State.filters.beds === '2' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('2', this)">2+ Beds</div>
            <div class="km-fchip ${State.filters.beds === '3' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('3', this)">3+ Beds</div>
            <div class="km-fchip ${State.filters.beds === '4' ? 'active' : ''}" onclick="MobileApp.setFilterBeds('4', this)">4+ Beds</div>
          </div>
        </div>

        <!-- Must-Have Amenities -->
        <div class="km-filter-group">
          <div class="km-filter-title">Must-Have Features</div>
          <div class="km-filter-chip-grid">
            <div class="km-fchip ${(State.filters.amenities || []).includes('water') ? 'active' : ''}" onclick="MobileApp.toggleFilterAmenity('water', this)"><i class="fas fa-tint"></i> Borehole Water 24/7</div>
            <div class="km-fchip ${(State.filters.amenities || []).includes('token') ? 'active' : ''}" onclick="MobileApp.toggleFilterAmenity('token', this)"><i class="fas fa-bolt"></i> Token Meter</div>
            <div class="km-fchip ${(State.filters.amenities || []).includes('wifi') ? 'active' : ''}" onclick="MobileApp.toggleFilterAmenity('wifi', this)"><i class="fas fa-wifi"></i> WiFi Ready</div>
            <div class="km-fchip ${(State.filters.amenities || []).includes('parking') ? 'active' : ''}" onclick="MobileApp.toggleFilterAmenity('parking', this)"><i class="fas fa-parking"></i> Parking</div>
            <div class="km-fchip ${(State.filters.amenities || []).includes('cctv') ? 'active' : ''}" onclick="MobileApp.toggleFilterAmenity('cctv', this)"><i class="fas fa-shield-alt"></i> Security / CCTV</div>
            <div class="km-fchip ${(State.filters.amenities || []).includes('balcony') ? 'active' : ''}" onclick="MobileApp.toggleFilterAmenity('balcony', this)"><i class="fas fa-door-open"></i> Balcony</div>
          </div>
        </div>

        <!-- Direct Landlord Filter -->
        <div class="km-filter-group">
          <div class="km-filter-title">Trust & Management</div>
          <div class="km-filter-chip-grid">
            <div class="km-fchip ${State.filters.directLandlordOnly ? 'active' : ''}" onclick="MobileApp.toggleDirectLandlord(this)">
              <i class="fas fa-check-circle" style="color:#006818;"></i> Direct Landlords Only (No Agent Fee)
            </div>
          </div>
        </div>

        <!-- Concierge House Hunter CTA Banner inside Filters -->
        <div style="background: linear-gradient(135deg, #075e54 0%, #006818 100%); border-radius: 14px; padding: 14px 16px; color: #ffffff; margin-top: 14px; box-shadow: 0 4px 12px rgba(0, 104, 24, 0.2);">
          <div style="display:flex; align-items:center; gap:8px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; color:#dcfce7; margin-bottom:4px;">
            <i class="fas fa-search-location"></i> Need Help Finding Vacancies?
          </div>
          <div style="font-size:13px; font-weight:800; line-height:1.2; margin-bottom:4px;">Hire a Personal House Hunter (KSh 2,000)</div>
          <div style="font-size:11.5px; opacity:0.92; line-height:1.4; margin-bottom:10px;">Our verified field agents physically visit units, check token meters & 24/7 water, and arrange viewings in 72 hours.</div>
          <div style="display:flex; gap:8px;">
            <button type="button" style="flex:1; background:#25d366; color:#0f172a; font-weight:800; border:none; border-radius:8px; padding:8px 12px; font-size:12px; cursor:pointer;" onclick="MobileApp.openHouseHunt()">
              <i class="fas fa-search-location"></i> Start 72h Hunt
            </button>
            <button type="button" style="flex:1; background:rgba(255,255,255,0.18); color:white; font-weight:700; border:1px solid rgba(255,255,255,0.35); border-radius:8px; padding:8px 12px; font-size:12px; cursor:pointer;" onclick="MobileApp.openWhatsAppAlerts()">
              <i class="fab fa-whatsapp"></i> WA Alerts
            </button>
          </div>
        </div>

        <!-- Sticky Bottom CTA -->
        <div class="km-filters-bottom-cta">
          <button type="button" class="km-btn-reset-filters" onclick="MobileApp.resetFilters()">Clear</button>
          <button type="button" class="km-btn-apply-filters" onclick="MobileApp.applyFilters()">Apply Filters</button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // SCREEN 5: REQUEST A VIEWING
  // ==========================================
  function renderRequestViewingScreen(hSlot, mSlot, propId) {
    const prop = State.properties.find(p => p.id === propId) || State.selectedProperty || State.properties[0];
    State.selectedProperty = prop;
    // Reset viewing state each time screen opens
    State.selectedViewingType = 'physical';
    State.selectedViewingTime = '10:00 AM';
    const thumb = (prop.media && prop.media[0] && prop.media[0].url) || prop.thumbnail;

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('detail', '${prop.id}')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">Schedule a Viewing</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div style="padding:14px; background:#fff; min-height:100vh; padding-bottom:80px;">
        <div style="display:flex; gap:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px; margin-bottom:16px;">
          <img src="${thumb}" style="width:70px; height:70px; border-radius:8px; object-fit:cover;" alt="${prop.title}">
          <div>
            <div style="font-weight:800; font-size:13.5px; color:#0f172a; margin-bottom:2px;">${prop.title}</div>
            <div style="font-size:14px; font-weight:900; color:#006818;">KSh ${formatKsh(prop.rentKes || prop.price)}/mo</div>
            <div style="font-size:11px; color:#64748b;"><i class="fas fa-map-marker-alt" style="color:#006818;"></i> ${prop.estateSuburb || 'Nairobi'}</div>
          </div>
        </div>

        <!-- 100% Free Viewing Notice -->
        <div class="km-zero-viewing-fee-card" style="margin-bottom:14px;">
          <div class="km-zero-fee-icon"><i class="fas fa-shield-alt"></i></div>
          <div class="km-zero-fee-content">
            <div class="km-zero-fee-title"><i class="fas fa-check-circle" style="color:#006818;"></i> 100% Free Inspection</div>
            <div class="km-zero-fee-sub">Zero booking or viewing fees. Directly inspect before paying anything.</div>
          </div>
        </div>

        <!-- Inspection Mode Selector (Physical vs Virtual WhatsApp Video) -->
        <div style="margin-bottom:16px;">
          <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:8px;">Choose Inspection Mode</div>
          <div class="km-viewing-type-selector">
            <div class="km-viewing-type-btn active" id="km-vtype-physical" onclick="MobileApp.selectViewingType('physical', this)">
              <i class="fas fa-walking"></i>
              <strong>In-Person Walk-In</strong>
              <span>Meet caretaker at gate</span>
            </div>
            <div class="km-viewing-type-btn" id="km-vtype-virtual" onclick="MobileApp.selectViewingType('virtual', this)">
              <i class="fab fa-whatsapp"></i>
              <strong>Live Video Tour</strong>
              <span>WhatsApp live inspection</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:6px;">Select Preferred Viewing Date</div>
          <input type="date" id="km-viewing-date" class="km-range-input" style="width:100%; box-sizing:border-box;" value="${new Date().toISOString().split('T')[0]}">
        </div>

        <div style="margin-bottom:16px;">
          <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:6px;">Select Preferred Time Slot (1-Hour Slots)</div>
          <div class="km-filter-chip-grid">
            <div class="km-fchip" onclick="MobileApp.selectTime('09:00 AM', this)">09:00 AM</div>
            <div class="km-fchip active" onclick="MobileApp.selectTime('10:00 AM', this)">10:00 AM</div>
            <div class="km-fchip" onclick="MobileApp.selectTime('11:00 AM', this)">11:00 AM</div>
            <div class="km-fchip" onclick="MobileApp.selectTime('12:00 PM', this)">12:00 PM</div>
            <div class="km-fchip" onclick="MobileApp.selectTime('01:00 PM', this)">01:00 PM</div>
            <div class="km-fchip" onclick="MobileApp.selectTime('02:00 PM', this)">02:00 PM</div>
            <div class="km-fchip" onclick="MobileApp.selectTime('03:00 PM', this)">03:00 PM</div>
            <div class="km-fchip" onclick="MobileApp.selectTime('04:00 PM', this)">04:00 PM</div>
            <div class="km-fchip" onclick="MobileApp.selectTime('05:00 PM', this)">05:00 PM</div>
          </div>
        </div>

        <div style="margin-bottom:20px;">
          <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:6px;">Note to Landlord / Caretaker (Optional)</div>
          <textarea id="km-viewing-msg" class="km-range-input" style="width:100%; height:75px; box-sizing:border-box; padding:8px; font-size:13px;" placeholder="I will be coming with my roommate to inspect the kitchen and bathroom..."></textarea>
        </div>

        <button type="button" class="km-btn-call" style="width:100%; height:48px; font-size:14px;" onclick="MobileApp.submitViewingRequest('${prop.id}')">
          <i class="fas fa-paper-plane"></i> Submit Free Viewing Request
        </button>
      </div>
    `;
  }

  function renderViewingConfirmedScreen(hSlot, mSlot, params) {
    const prop = State.properties.find(p => p.id === params.id) || State.selectedProperty || State.properties[0];
    const isVirtual = params.viewingType === 'virtual';
    const bookDate = params.date || '';
    const bookTime = params.time || '';
    const dateLabel = bookDate ? new Date(bookDate).toLocaleDateString('en-KE', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : '';
    const phone = prop ? (prop.whatsapp || prop.landlord?.whatsapp || prop.phone || prop.contactPhone || '').replace(/[^0-9]/g, '') : '';

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-times"></i></button>
        <span class="screen-title">${isVirtual ? 'Video Tour Scheduled' : 'Viewing Requested'}</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div style="padding:24px 18px; text-align:center; background:#fff; min-height:100vh; padding-bottom:80px;">

        <!-- Success Icon -->
        <div style="width:72px; height:72px; border-radius:50%; background:${isVirtual ? '#dcf8ff' : '#dcfce7'}; color:${isVirtual ? '#25D366' : '#15803d'}; font-size:34px; display:flex; align-items:center; justify-content:center; margin:20px auto 16px; box-shadow:0 4px 16px rgba(0,104,24,0.15);">
          <i class="${isVirtual ? 'fab fa-whatsapp' : 'fas fa-calendar-check'}"></i>
        </div>

        <h2 style="font-size:20px; font-weight:900; color:#0f172a; margin-bottom:6px;">
          ${isVirtual ? '📱 WhatsApp Video Tour Booked!' : '✅ Free Viewing Request Sent!'}
        </h2>

        <!-- Booking Summary Card -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:14px; text-align:left; margin:16px 0;">
          <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px;">Booking Summary</div>
          ${prop ? `<div style="display:flex; gap:10px; align-items:center; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid #e2e8f0;">
            <img src="${(prop.media && prop.media[0] && prop.media[0].url) || prop.thumbnail || ''}" style="width:52px; height:52px; border-radius:8px; object-fit:cover;" alt="${prop.title}">
            <div>
              <div style="font-size:13px; font-weight:800; color:#0f172a;">${prop.title}</div>
              <div style="font-size:12px; color:#006818; font-weight:700;">KSh ${formatKsh(prop.rentKes || prop.price)}/mo</div>
              <div style="font-size:11px; color:#64748b;"><i class="fas fa-map-marker-alt" style="color:#006818;"></i> ${prop.estateSuburb || prop.county || 'Nairobi'}</div>
            </div>
          </div>` : ''}
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px; text-align:center;">
              <i class="${isVirtual ? 'fab fa-whatsapp' : 'fas fa-walking'}" style="color:#006818; font-size:16px; display:block; margin-bottom:3px;"></i>
              <div style="font-size:10px; color:#64748b; font-weight:600;">Type</div>
              <div style="font-size:11px; font-weight:800; color:#0f172a;">${isVirtual ? 'Video Tour' : 'Walk-In'}</div>
            </div>
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px; text-align:center;">
              <i class="fas fa-clock" style="color:#006818; font-size:16px; display:block; margin-bottom:3px;"></i>
              <div style="font-size:10px; color:#64748b; font-weight:600;">Time</div>
              <div style="font-size:11px; font-weight:800; color:#0f172a;">${bookTime || '10:00 AM'}</div>
            </div>
          </div>
          ${dateLabel ? `<div style="margin-top:8px; background:#f0fdf4; border-radius:8px; padding:8px; text-align:center; font-size:11.5px; font-weight:700; color:#166534;"><i class="fas fa-calendar-alt"></i> ${dateLabel}</div>` : ''}
        </div>

        <!-- Description -->
        <p style="font-size:12.5px; color:#64748b; line-height:1.55; margin-bottom:20px; text-align:left;">
          ${isVirtual
            ? '📹 The caretaker will start a live WhatsApp video call at the scheduled time - you can inspect every room, water pressure, lighting, and ask real-time questions without leaving home.'
            : '🏠 The property manager has been notified via SMS & WhatsApp. You will receive gate directions, caretaker name, and gate pin before your visit. Zero fees required.'}
        </p>

        <!-- Action Buttons -->
        ${isVirtual && phone ? `
        <a href="https://wa.me/${phone}?text=${encodeURIComponent(`Hi! I booked a WhatsApp Video Tour on KejaMarket for: *${prop ? prop.title : 'your property'}* on ${dateLabel} at ${bookTime}. Please prepare for the live inspection at the agreed time.`)}"
           target="_blank"
           style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; height:50px; background:#25D366; color:#fff; border-radius:12px; font-weight:800; font-size:14px; text-decoration:none; margin-bottom:10px; box-shadow:0 2px 8px rgba(37,211,102,0.3);">
          <i class="fab fa-whatsapp" style="font-size:18px;"></i> Start Video Tour on WhatsApp
        </a>
        ` : `
        <button type="button" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; height:50px; background:#25D366; color:#fff; border-radius:12px; font-weight:800; font-size:14px; border:none; cursor:pointer; margin-bottom:10px; box-shadow:0 2px 8px rgba(37,211,102,0.3);" onclick="MobileApp.chatOnWhatsApp('${prop ? prop.id : ''}')">
          <i class="fab fa-whatsapp" style="font-size:18px;"></i> Chat with Caretaker
        </button>
        `}

        <button type="button" onclick="MobileApp.showScreen('my-requests')" style="display:flex; align-items:center; justify-content:center; gap:6px; width:100%; height:44px; background:#f1f5f9; color:#0f172a; border-radius:12px; font-weight:700; font-size:13px; border:none; cursor:pointer; margin-bottom:10px;">
          <i class="fas fa-list-check" style="color:#006818;"></i> View My Bookings
        </button>

        <button type="button" onclick="MobileApp.showScreen('home')" style="display:flex; align-items:center; justify-content:center; gap:6px; width:100%; height:44px; background:#fff; color:#64748b; border-radius:12px; font-weight:600; font-size:13px; border:1px solid #e2e8f0; cursor:pointer;">
          <i class="fas fa-home"></i> Back to Listings
        </button>

      </div>
    `;
  }

  // ==========================================
  // PROFILE, SAVED & MESSAGES SCREENS
  // ==========================================
  function renderProfileScreen(hSlot, mSlot) {
    const session = (window.kejaAuth && typeof window.kejaAuth.getSession === 'function' ? window.kejaAuth.getSession() : null) ||
      JSON.parse(localStorage.getItem('keja_session') || localStorage.getItem('keja_user') || 'null');

    const isLoggedIn = !!(session && (session.id || session.phone || session.email));

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <div style="width:36px;"></div>
        <span class="screen-title">${isLoggedIn ? 'My Profile' : 'Account & Support'}</span>
        <div style="width:36px;"></div>
      </div>
    `;

    if (isLoggedIn) {
      const displayName = session.name || session.fullName || 'KejaMarket Member';
      const displayContact = session.phone || session.email || 'Verified Account';
      const initials = displayName.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'U';
      const roleLabel = session.role === 'landlord' ? 'Verified Landlord' : (session.role === 'admin' ? 'Administrator' : 'Tenant Account');

      mSlot.innerHTML = `
        <div style="padding-bottom:80px;">
          <div class="km-profile-header">
            <div class="km-profile-avatar-big">${initials}</div>
            <div>
              <div class="km-profile-name">${displayName}</div>
              <div class="km-profile-email">${displayContact}</div>
              <span style="display:inline-block; margin-top:4px; font-size:10.5px; font-weight:800; background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:12px;">
                <i class="fas fa-check-circle"></i> ${roleLabel}
              </span>
            </div>
          </div>

          <div class="km-profile-menu">
            ${session.role === 'landlord' || session.role === 'admin' ? `
              <div class="km-profile-item" onclick="if(window.app && app.openLandlordPortal) app.openLandlordPortal(); else MobileApp.openPostAd();">
                <div class="km-profile-item-icon" style="background:#e8f8ee; color:#006818;"><i class="fas fa-home"></i></div>
                <div class="km-profile-item-title">Landlord Dashboard & My Properties</div>
                <i class="fas fa-chevron-right km-profile-item-arrow"></i>
              </div>
            ` : ''}

            <div class="km-profile-item" onclick="MobileApp.openPostAd()">
              <div class="km-profile-item-icon" style="background:#e8f8ee; color:#006818;"><i class="fas fa-plus-circle"></i></div>
              <div class="km-profile-item-title">Post a Property for Free</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <div class="km-profile-item" onclick="MobileApp.showScreen('favorites')">
              <div class="km-profile-item-icon"><i class="fas fa-heart"></i></div>
              <div class="km-profile-item-title">Saved Listings</div>
              <span style="background:#006818; color:white; border-radius:12px; padding:2px 8px; font-size:11px; font-weight:800;">${State.favorites.length}</span>
            </div>

            <div class="km-profile-item" onclick="MobileApp.showScreen('my-requests')">
              <div class="km-profile-item-icon"><i class="fas fa-clock"></i></div>
              <div class="km-profile-item-title">My Viewing Appointments</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <div class="km-profile-item" onclick="MobileApp.showScreen('afford')">
              <div class="km-profile-item-icon"><i class="fas fa-calculator"></i></div>
              <div class="km-profile-item-title">What Can I Afford? Calculator</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <div class="km-profile-item" onclick="MobileApp.openWhatsAppAlerts()">
              <div class="km-profile-item-icon" style="background:#e8f8ee; color:#25D366;"><i class="fab fa-whatsapp"></i></div>
              <div class="km-profile-item-title">Instant WhatsApp Vacancy Alerts</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <div class="km-profile-item" onclick="MobileApp.showScreen('smarthunt')">
              <div class="km-profile-item-icon" style="background:#f0fff0; color:#006818;"><i class="fas fa-search-location"></i></div>
              <div class="km-profile-item-title">Hire a House Hunter (72h Concierge)</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <div class="km-profile-item" onclick="MobileApp.openMovers()">
              <div class="km-profile-item-icon" style="background:#fff7ed; color:#ea580c;"><i class="fas fa-truck-moving"></i></div>
              <div class="km-profile-item-title">Verified Nairobi Movers & Quotes</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <div class="km-profile-item" onclick="MobileApp.openFibre()">
              <div class="km-profile-item-icon" style="background:#f0f9ff; color:#0284c7;"><i class="fas fa-wifi"></i></div>
              <div class="km-profile-item-title">Home Fibre & 5G Internet Setup</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <a href="https://wa.me/254792409540?text=Hi%20KejaMarket%20Support" target="_blank" class="km-profile-item">
              <div class="km-profile-item-icon" style="background:#dcfce7; color:#25D366;"><i class="fab fa-whatsapp"></i></div>
              <div class="km-profile-item-title">WhatsApp Customer Support</div>
              <i class="fas fa-external-link-alt km-profile-item-arrow"></i>
            </a>

            <div class="km-profile-item" onclick="MobileApp.logout()" style="margin-top:14px; border-color:#fee2e2;">
              <div class="km-profile-item-icon" style="background:#fef2f2; color:#ef4444;"><i class="fas fa-sign-out-alt"></i></div>
              <div class="km-profile-item-title" style="color:#ef4444; font-weight:800;">Sign Out (${displayName})</div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Clean Auth Screen for Unauthenticated Visitors
      mSlot.innerHTML = `
        <div style="padding-bottom:80px;">
          <div class="km-profile-header" style="flex-direction:column; align-items:center; text-align:center; gap:12px; background:linear-gradient(135deg, #006818 0%, #004d12 100%); color:#ffffff; padding:22px 18px; border-radius:14px; margin:12px; box-shadow:0 4px 14px rgba(0,104,24,0.22);">
            <div style="width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:22px; color:#ffffff;">
              <i class="fas fa-shield-alt"></i>
            </div>
            <div>
              <div style="font-size:17px; font-weight:800; color:#ffffff; letter-spacing:-0.3px;">Sign In to KejaMarket</div>
              <div style="font-size:12px; color:#e2e8f0; line-height:1.4; margin-top:4px; max-width:280px;">
                Direct landlord contacts, verified houses, free scheduled viewings, and zero broker fees.
              </div>
            </div>

            <div style="width:100%; display:flex; flex-direction:column; gap:8px; margin-top:6px;">
              <button type="button" class="km-btn-signin" onclick="MobileApp.openSignIn()" style="background:#ffffff; color:#006818; border:none; padding:12px 18px; border-radius:10px; font-weight:800; font-size:13.5px; cursor:pointer; width:100%; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                <i class="fas fa-sign-in-alt"></i> Sign In to My Account
              </button>
              <button type="button" class="km-btn-signup" onclick="MobileApp.openSignUp()" style="background:transparent; color:#ffffff; border:1.5px solid rgba(255,255,255,0.7); padding:11px 18px; border-radius:10px; font-weight:800; font-size:13.5px; cursor:pointer; width:100%; display:flex; align-items:center; justify-content:center; gap:8px;">
                <i class="fas fa-user-plus"></i> Create Free Account
              </button>
            </div>

            <div style="font-size:11px; color:#bbf7d0; display:flex; align-items:center; gap:6px; margin-top:4px;">
              <i class="fas fa-check-circle"></i> Instant SMS OTP verification • 100% Free Tenant Accounts
            </div>
          </div>

          <div class="km-profile-menu">
            <div class="km-profile-item" onclick="MobileApp.openPostAd()">
              <div class="km-profile-item-icon" style="background:#e8f8ee; color:#006818;"><i class="fas fa-plus-circle"></i></div>
              <div class="km-profile-item-title">Post a Property (Landlord / Agent)</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <div class="km-profile-item" onclick="MobileApp.showScreen('favorites')">
              <div class="km-profile-item-icon"><i class="fas fa-heart"></i></div>
              <div class="km-profile-item-title">Saved Listings</div>
              <span style="background:#006818; color:white; border-radius:12px; padding:2px 8px; font-size:11px; font-weight:800;">${State.favorites.length}</span>
            </div>

            <div class="km-profile-item" onclick="MobileApp.showScreen('afford')">
              <div class="km-profile-item-icon"><i class="fas fa-calculator"></i></div>
              <div class="km-profile-item-title">What Can I Afford? Calculator</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <div class="km-profile-item" onclick="MobileApp.openWhatsAppAlerts()">
              <div class="km-profile-item-icon" style="background:#e8f8ee; color:#25D366;"><i class="fab fa-whatsapp"></i></div>
              <div class="km-profile-item-title">Instant WhatsApp Vacancy Alerts</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <div class="km-profile-item" onclick="MobileApp.showScreen('smarthunt')">
              <div class="km-profile-item-icon" style="background:#f0fff0; color:#006818;"><i class="fas fa-search-location"></i></div>
              <div class="km-profile-item-title">Hire a House Hunter (72h Concierge)</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <div class="km-profile-item" onclick="MobileApp.openMovers()">
              <div class="km-profile-item-icon" style="background:#fff7ed; color:#ea580c;"><i class="fas fa-truck-moving"></i></div>
              <div class="km-profile-item-title">Verified Nairobi Movers & Quotes</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <div class="km-profile-item" onclick="MobileApp.openFibre()">
              <div class="km-profile-item-icon" style="background:#f0f9ff; color:#0284c7;"><i class="fas fa-wifi"></i></div>
              <div class="km-profile-item-title">Home Fibre & 5G Internet Setup</div>
              <i class="fas fa-chevron-right km-profile-item-arrow"></i>
            </div>

            <a href="https://wa.me/254792409540?text=Hi%20KejaMarket%20Support" target="_blank" class="km-profile-item">
              <div class="km-profile-item-icon" style="background:#dcfce7; color:#25D366;"><i class="fab fa-whatsapp"></i></div>
              <div class="km-profile-item-title">WhatsApp Customer Support</div>
              <i class="fas fa-external-link-alt km-profile-item-arrow"></i>
            </a>
          </div>
        </div>
      `;
    }
  }

  function renderFavoritesScreen(hSlot, mSlot) {
    const favProps = State.properties.filter(p => State.favorites.includes(p.id));

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">Saved Listings (${favProps.length})</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div style="padding-top:12px; padding-bottom:80px;">
        ${favProps.length > 0 ? `
          <div class="km-property-grid">
            ${renderPropertyGridHtml(favProps)}
          </div>
        ` : `
          <div style="text-align:center; padding:60px 20px; color:#64748b;">
            <i class="fas fa-heart-broken" style="font-size:36px; color:#cbd5e1; margin-bottom:12px; display:block;"></i>
            <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:6px;">No saved listings yet</h3>
            <p style="font-size:12px; color:#64748b; margin-bottom:18px;">Tap the heart icon on any listing to save it here for later.</p>
            <button type="button" class="km-btn-call" style="margin:0 auto; max-width:200px;" onclick="MobileApp.showScreen('home')">Explore Kejas</button>
          </div>
        `}
      </div>
    `;
  }

  function renderMessagesScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">Messages & Chats</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-messages-list">
        ${State.messages.map(m => `
          <div class="km-msg-card ${m.unread ? 'unread' : ''}" onclick="MobileApp.showScreen('chat', '${m.id}')">
            <div class="km-msg-avatar">${m.avatarText}</div>
            <div class="km-msg-body">
              <div class="km-msg-header">
                <div class="km-msg-sender">${m.senderName}</div>
                <div class="km-msg-time">${m.time}</div>
              </div>
              <div style="font-size:11px; font-weight:700; color:#006818; margin-bottom:2px;">${m.propertyTitle}</div>
              <div class="km-msg-preview">${m.lastMessage}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderChatScreen(hSlot, mSlot, targetId) {
    // Determine whether targetId is a property ID or an existing thread ID
    let prop = State.properties.find(p => p.id === targetId) || (State.selectedProperty && State.selectedProperty.id === targetId ? State.selectedProperty : null);
    let thread = State.messages.find(m => m.id === targetId);

    if (!prop && !thread && targetId && String(targetId).startsWith('prop-')) {
      prop = State.selectedProperty;
    }

    const landlordName = (prop && (prop.landlord?.name || prop.landlordName || prop.owner_name)) || (thread && thread.senderName) || 'Verified Landlord';
    const landlordInitials = landlordName.split(' ').map(n => n.charAt(0)).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'LL';
    const phone = (prop && (prop.landlord?.phone || prop.phone || prop.contactPhone)) || '254112377651';
    const wa = (prop && (prop.landlord?.whatsapp || prop.whatsapp)) || phone;
    const cleanWa = wa.replace(/[^0-9]/g, '');

    const propThumb = prop ? ((prop.photos && prop.photos[0]) || (prop.media && prop.media[0] && prop.media[0].url) || prop.thumbnail || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=300&q=80') : null;

    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen(${prop ? `'detail', '${prop.id}'` : `'messages'`})"><i class="fas fa-arrow-left"></i></button>
        <div style="display:flex; align-items:center; gap:8px; overflow:hidden; flex:1;">
          <div class="km-msg-avatar" style="width:34px; height:34px; font-size:12px; flex:none; background:#006818; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800;">${landlordInitials}</div>
          <div style="text-align:left; overflow:hidden;">
            <div style="font-weight:800; font-size:13.5px; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; color:#0f172a;">${landlordName}</div>
            <div style="font-size:10.5px; color:#16a34a; font-weight:700;"><i class="fas fa-circle" style="font-size:7px;"></i> Direct Landlord • Active</div>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <a href="https://wa.me/${cleanWa}?text=${encodeURIComponent(prop ? 'Hi ' + landlordName + ', I am inquiring about ' + prop.title + ' on KejaMarket' : 'Hello')}" target="_blank" rel="noopener noreferrer" class="back-btn" style="color:#25D366;" title="Chat on WhatsApp"><i class="fab fa-whatsapp" style="font-size:18px;"></i></a>
          <a href="tel:${phone}" class="back-btn" style="color:#006818;" title="Call Landlord"><i class="fas fa-phone-alt"></i></a>
        </div>
      </div>
    `;

    mSlot.innerHTML = `
      <div class="km-chat-container">
        ${prop ? `
          <!-- Top Property Preview Banner -->
          <div class="km-chat-prop-banner" onclick="MobileApp.showScreen('detail', '${prop.id}')">
            <img src="${propThumb}" class="km-chat-prop-thumb" alt="${prop.title}">
            <div class="km-chat-prop-details">
              <div class="km-chat-prop-title">${prop.title}</div>
              <div class="km-chat-prop-sub">KSh ${formatKsh(prop.rentKes || prop.price)}/mo • ${prop.estateSuburb || 'Nairobi'}</div>
            </div>
            <button type="button" class="km-chat-book-btn" onclick="event.stopPropagation(); MobileApp.showScreen('request-viewing', '${prop.id}')">
              <i class="fas fa-calendar-check"></i> Book Viewing
            </button>
          </div>
        ` : ''}

        <!-- Chat messages scroll area -->
        <div id="km-chat-messages-area" class="km-chat-messages-area">
          <div class="km-chat-trust-pill">
            <i class="fas fa-shield-alt"></i> KejaMarket Protected Chat • Direct Landlord Listing • Never pay deposit before in-person inspection
          </div>

          <!-- Landlord Greeting -->
          <div class="km-chat-bubble in">
            <div class="km-bubble-meta">${landlordName} • Active now</div>
            <div>Jambo! Thanks for reaching out regarding ${prop ? `the <strong>${prop.title}</strong> in ${prop.estateSuburb || 'Nairobi'}` : 'this listing'}. The unit is available for viewing. Feel free to ask any questions or schedule a visit!</div>
          </div>
        </div>

        <!-- Quick Kenyan Inquiries Carousel -->
        <div class="km-chat-quick-replies">
          <button type="button" class="km-quick-chip" onclick="MobileApp.sendQuickReply('👋 Jambo, is this unit still available for viewing?')">👋 Still available?</button>
          <button type="button" class="km-quick-chip" onclick="MobileApp.sendQuickReply('📅 Can I come view this property today or tomorrow?')">📅 Can I view today?</button>
          <button type="button" class="km-quick-chip" onclick="MobileApp.sendQuickReply('💧 How is the water pressure and electricity token meters?')">💧 Water & Tokens?</button>
          <button type="button" class="km-quick-chip" onclick="MobileApp.sendQuickReply('💰 Is the deposit and monthly rent negotiable?')">💰 Rent negotiable?</button>
          <button type="button" class="km-quick-chip" onclick="MobileApp.sendQuickReply('📍 What is the nearest landmark or stage for directions?')">📍 Nearest Landmark?</button>
        </div>

        <!-- Input Bar with Send + WhatsApp buttons -->
        <div class="km-chat-input-bar">
          <input type="text" id="km-chat-input" class="km-chat-text-input" placeholder="Message ${landlordName}..." onkeydown="if(event.key==='Enter') MobileApp.sendChatMessage()">
          <button type="button" class="km-chat-send-btn" onclick="MobileApp.sendChatMessage()" title="Send In-App">
            <i class="fas fa-paper-plane"></i>
          </button>
          <button type="button" class="km-chat-wa-direct-btn" onclick="MobileApp.chatOnWhatsApp('${prop ? prop.id : ''}')" title="Send to Landlord WhatsApp">
            <i class="fab fa-whatsapp"></i>
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // AFFORDABILITY, MY REQUESTS & SMART HUNT
  // ==========================================
  function renderAffordabilityScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">Budget Calculator</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div style="padding:16px; background:#fff; min-height:100vh; padding-bottom:80px;">
        <div style="background:linear-gradient(135deg, #006818, #1db010); border-radius:14px; padding:16px; color:white; text-align:center; margin-bottom:18px;">
          <i class="fas fa-calculator" style="font-size:28px; margin-bottom:8px;"></i>
          <div style="font-size:17px; font-weight:800; margin-bottom:2px;">What Can I Afford?</div>
          <div style="font-size:11.5px; opacity:0.9;">Calculate safe monthly rent based on Kenyan housing norms</div>
        </div>

        <div style="margin-bottom:14px;">
          <div style="font-size:12.5px; font-weight:800; color:#0f172a; margin-bottom:5px;">Your Monthly Income (KSh)</div>
          <input type="number" id="km-afford-income" class="km-range-input" style="width:100%; box-sizing:border-box; font-size:15px;" placeholder="e.g. 45000" oninput="MobileApp.calcAffordability()">
        </div>

        <div id="km-afford-result" style="display:none; background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:12px; padding:14px; margin-bottom:18px; text-align:center;">
          <div style="font-size:11.5px; font-weight:800; color:#15803d; margin-bottom:2px;">RECOMMENDED RENT RANGE</div>
          <div id="km-afford-range" style="font-size:22px; font-weight:900; color:#006818;">KSh 0 - 0</div>
          <div style="font-size:11px; color:#64748b; margin-top:3px;">Spend between 15% and 30% of gross income on rent</div>
        </div>

        <button type="button" class="km-btn-call" id="km-afford-browse-btn" onclick="MobileApp.browseAffordable()" style="display:none; width:100%; height:46px;">
          <i class="fas fa-search"></i> View Matching Kejas
        </button>
      </div>
    `;
  }

  function renderSmartHuntScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('home')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">Hire a House Hunter</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div style="padding:16px 14px 80px; background:#fff; min-height:100vh;">
        <!-- Hero Card -->
        <div style="background:linear-gradient(135deg, #064e3b 0%, #065f46 100%); border-radius:16px; padding:20px; color:white; margin-bottom:16px; box-shadow:0 6px 20px rgba(6,78,59,0.3); position:relative; overflow:hidden;">
          <i class="fas fa-search-location" style="position:absolute; right:-15px; bottom:-15px; font-size:110px; opacity:0.1; color:#fff;"></i>
          <span style="display:inline-block; font-size:10px; font-weight:800; background:rgba(251,191,36,0.25); color:#fde68a; border:1px solid rgba(251,191,36,0.4); padding:3px 10px; border-radius:12px; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:8px;">
            <i class="fas fa-shield-alt"></i> 72-Hour Ground Concierge
          </span>
          <div style="font-size:19px; font-weight:900; line-height:1.2; margin-bottom:6px;">Personal House Hunter</div>
          <div style="font-size:12.5px; opacity:0.92; line-height:1.45; margin-bottom:14px;">Stop wasting days walking in the sun and dealing with rogue brokers. Our verified ground team scours vacancies, verifies water & power, and arranges physical viewings for you in 72 hours.</div>
          <div style="font-size:22px; font-weight:900; color:#a7f3d0;">KSh 2,000 <span style="font-size:12px; font-weight:600; color:#e0f2fe;">one-time fee</span></div>
        </div>

        <!-- 3-Step Process -->
        <div style="font-size:13px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:0.3px; margin-bottom:10px;">How It Works</div>
        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:18px;">
          <div style="display:flex; gap:12px; align-items:flex-start; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px;">
            <div style="width:32px; height:32px; border-radius:50%; background:#006818; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; flex-shrink:0;">1</div>
            <div>
              <div style="font-size:13px; font-weight:800; color:#0f172a;">Submit Your Wishlist</div>
              <div style="font-size:11.5px; color:#64748b; line-height:1.35;">Specify your preferred estates (e.g. Ruaka, Roysambu), budget range, bedroom type & move-in date.</div>
            </div>
          </div>
          <div style="display:flex; gap:12px; align-items:flex-start; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px;">
            <div style="width:32px; height:32px; border-radius:50%; background:#006818; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; flex-shrink:0;">2</div>
            <div>
              <div style="font-size:13px; font-weight:800; color:#0f172a;">Agent Scouts on the Ground</div>
              <div style="font-size:11.5px; color:#64748b; line-height:1.35;">Our dedicated agent walks the estates, checks caretakers, tests water pressure, tokens meter & security.</div>
            </div>
          </div>
          <div style="display:flex; gap:12px; align-items:flex-start; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px;">
            <div style="width:32px; height:32px; border-radius:50%; background:#006818; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; flex-shrink:0;">3</div>
            <div>
              <div style="font-size:13px; font-weight:800; color:#0f172a;">Direct Landlord Viewings</div>
              <div style="font-size:11.5px; color:#64748b; line-height:1.35;">Receive verified video tours and arranged physical viewing appointments with direct zero-broker landlords.</div>
            </div>
          </div>
        </div>

        <!-- Verification Checklist -->
        <div style="background:#f0fff0; border:1.5px solid #bbf7d0; border-radius:12px; padding:14px; margin-bottom:18px;">
          <div style="font-size:12.5px; font-weight:800; color:#064e3b; margin-bottom:8px;"><i class="fas fa-check-circle" style="color:#006818;"></i> The KejaMarket Ground Guarantee</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:11px; font-weight:700; color:#166534;">
            <div>💧 24/7 Water Verified</div>
            <div>⚡ KPLC Token Meter Tested</div>
            <div>🛡️ Security & Gate Checked</div>
            <div>🤝 0% Broker Commission</div>
          </div>
        </div>

        <!-- Action CTAs -->
        <button type="button" class="km-btn-apply-filters" style="width:100%; height:50px; font-size:14.5px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="MobileApp.openHouseHunt()">
          <i class="fas fa-bolt"></i> Start 3-Day House Hunt (KSh 2,000)
        </button>
        <button type="button" class="km-btn-reset-filters" style="width:100%; height:44px; font-size:13px; margin-bottom:10px; display:flex; align-items:center; justify-content:center; gap:6px;" onclick="MobileApp.trackHunt()">
          <i class="fas fa-clock"></i> Track Active 72-Hour Hunt
        </button>
        <button type="button" class="km-btn-wa" style="width:100%; height:44px; font-size:13px;" onclick="window.open('https://wa.me/254792409540?text=Hi%20KejaMarket,%20I%20want%20to%20hire%20a%20house%20hunter%20in%20Nairobi', '_blank')">
          <i class="fab fa-whatsapp"></i> Chat with House Hunt Lead Scout
        </button>
      </div>
    `;
  }

  function renderMyRequestsScreen(hSlot, mSlot) {
    hSlot.innerHTML = `
      <div class="km-screen-header">
        <button type="button" class="back-btn" onclick="MobileApp.showScreen('profile')"><i class="fas fa-arrow-left"></i></button>
        <span class="screen-title">My Viewings</span>
        <div style="width:36px;"></div>
      </div>
    `;

    mSlot.innerHTML = `
      <div style="padding:14px; background:#fff; min-height:100vh; padding-bottom:80px;">
        ${State.viewingRequests.length > 0 ? State.viewingRequests.map(r => {
          const isVirtual = r.viewingType === 'virtual';
          return `
          <div style="border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:10px; display:flex; gap:10px; align-items:flex-start;">
            <img src="${r.thumbnail || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=300&q=80'}" style="width:62px; height:62px; border-radius:8px; object-fit:cover; flex-shrink:0;">
            <div style="flex:1; min-width:0;">
              <div style="font-weight:800; font-size:13px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.title}</div>
              <div style="font-size:11.5px; color:#64748b; margin-top:2px;"><i class="fas fa-calendar-alt" style="color:#006818;"></i> ${r.date || 'Pending Confirmation'}</div>
              <div style="display:flex; gap:6px; margin-top:5px; flex-wrap:wrap;">
                <span style="font-size:10px; font-weight:800; background:${isVirtual ? '#eff6ff' : '#f0fdf4'}; color:${isVirtual ? '#2563eb' : '#006818'}; padding:2px 7px; border-radius:4px;">
                  <i class="${isVirtual ? 'fab fa-whatsapp' : 'fas fa-walking'}"></i> ${isVirtual ? 'Video Tour' : 'Walk-In'}
                </span>
                <span style="font-size:10px; font-weight:800; background:#e8f8ee; color:#006818; padding:2px 7px; border-radius:4px;">
                  <i class="fas fa-clock"></i> Active
                </span>
              </div>
            </div>
          </div>
        `}).join('') : `
          <div style="text-align:center; padding:40px 20px; color:#64748b;">
            <i class="fas fa-calendar-times" style="font-size:32px; color:#cbd5e1; margin-bottom:10px; display:block;"></i>
            <div style="font-size:14px; font-weight:700; color:#0f172a; margin-bottom:6px;">No Viewing Appointments Yet</div>
            <div style="font-size:12px; margin-bottom:18px;">Browse listings and tap "Request a Viewing" to book your first free inspection.</div>
            <button type="button" onclick="MobileApp.showScreen('home')" style="background:#006818; color:#fff; border:none; border-radius:10px; padding:10px 22px; font-weight:800; font-size:13px; cursor:pointer;">Browse Listings</button>
          </div>
        `}
      </div>
    `;
  }

  function renderMyBookingsScreen(hSlot, mSlot) {
    renderMyRequestsScreen(hSlot, mSlot);
  }

  function renderPaymentScreen(hSlot, mSlot, params) {
    showScreen('home');
  }

  function renderPaymentSuccessScreen(hSlot, mSlot, params) {
    showScreen('home');
  }

  function renderCountdownScreen(hSlot, mSlot, params) {
    showScreen('detail', params.id);
  }

  function renderAdminMobileScreen(hSlot, mSlot) {
    window.location.href = '/admin-dashboard.html';
  }

  // ==========================================
  // EVENT HANDLERS & PUBLIC INTERFACE
  // ==========================================
  function toggleFav(propId, btn) {
    const idx = State.favorites.indexOf(propId);
    if (idx === -1) {
      State.favorites.push(propId);
    } else {
      State.favorites.splice(idx, 1);
    }
    localStorage.setItem('keja_favorites', JSON.stringify(State.favorites));
    updateFavBadge();

    if (btn) {
      const icon = btn.querySelector('i');
      if (icon) {
        if (State.favorites.includes(propId)) {
          icon.className = 'fas fa-heart';
          icon.style.color = '#ef4444';
          btn.classList.add('active');
        } else {
          icon.className = 'far fa-heart';
          icon.style.color = '';
          btn.classList.remove('active');
        }
      }
    }
  }

  function handleLiveSearch(val) {
    State.searchQuery = val || '';
    const clearBtn = document.getElementById('km-search-clear-btn');
    if (clearBtn) {
      clearBtn.classList.toggle('visible', !!val);
    }
    // Re-render feed without losing focus
    updateFeedDisplay();
  }

  function scrollStories(dir) {
    const el = document.getElementById('km-story-bubbles-scroll');
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  }

  function onStoryScroll() {
    const el = document.getElementById('km-story-bubbles-scroll');
    const prevBtn = document.getElementById('km-story-prev-btn');
    const nextBtn = document.getElementById('km-story-next-btn');
    const wrapper = document.getElementById('km-story-categories-wrapper');
    if (!el) return;

    if (prevBtn) {
      prevBtn.style.display = el.scrollLeft > 20 ? 'flex' : 'none';
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    const isAtEnd = el.scrollLeft >= maxScroll - 20;
    if (nextBtn) {
      nextBtn.style.display = isAtEnd ? 'none' : 'flex';
    }
    if (wrapper) {
      wrapper.classList.toggle('scrolled-end', isAtEnd);
    }
  }

  function clearSearch() {
    State.searchQuery = '';
    const input = document.getElementById('km-home-search-input');
    if (input) input.value = '';
    const clearBtn = document.getElementById('km-search-clear-btn');
    if (clearBtn) clearBtn.classList.remove('visible');
    updateFeedDisplay();
  }

  function handleSearch(val) {
    State.searchQuery = val || '';
    updateFeedDisplay();
  }

  function updateFeedDisplay() {
    const props = getFilteredPropertiesList();
    const countEl = document.querySelector('.km-feed-count strong');
    if (countEl) countEl.textContent = props.length;

    const gridContainer = document.querySelector('.km-property-grid');
    const listContainer = document.querySelector('.km-property-list');

    if (gridContainer) {
      gridContainer.innerHTML = renderPropertyGridHtml(props);
    }
    if (listContainer) {
      listContainer.innerHTML = renderPropertyListHtml(props);
    }
  }

  function setCategoryChip(cat) {
    State.selectedCategory = cat;
    // Update active bubble state
    document.querySelectorAll('.km-story-bubble').forEach(b => {
      b.classList.remove('active');
    });
    showScreen('home');
  }

  function setSuburbPill(suburb) {
    State.filters.location = suburb;
    State.selectedLocation = suburb || 'All Nairobi';
    const chipLabel = document.getElementById('km-active-loc-label');
    if (chipLabel) chipLabel.textContent = suburb || 'All Nairobi';

    document.querySelectorAll('.km-suburb-pill').forEach(p => {
      p.classList.toggle('active', (!suburb && p.textContent.includes('All')) || (suburb && p.textContent.includes(suburb)));
    });

    updateFeedDisplay();
  }

  function setViewMode(mode) {
    State.viewMode = mode;
    localStorage.setItem('keja_mobile_view', mode);
    showScreen('home');
  }

  function cycleSort() {
    if (State.selectedSort === 'newest') State.selectedSort = 'price-low';
    else if (State.selectedSort === 'price-low') State.selectedSort = 'price-high';
    else State.selectedSort = 'newest';

    const sortLabel = document.getElementById('km-sort-label');
    if (sortLabel) sortLabel.textContent = getSortLabel();

    updateFeedDisplay();
  }

  function openLocationModal() {
    const modal = document.getElementById('km-loc-picker-modal');
    if (modal) modal.classList.add('open');
  }

  function closeLocationModal() {
    const modal = document.getElementById('km-loc-picker-modal');
    if (modal) modal.classList.remove('open');
  }

  function setLocation(loc) {
    State.filters.location = loc;
    State.selectedLocation = loc || 'Nairobi';
    closeLocationModal();
    showScreen('home');
  }

  function filterSheetLocations(query) {
    const q = (query || '').toLowerCase().trim();
    const clearBtn = document.getElementById('km-loc-clear-btn');
    const searchResults = document.getElementById('km-loc-search-results');
    const defaultView = document.getElementById('km-loc-default-view');
    const subzonePanel = document.getElementById('km-loc-subzone-panel');

    // Show/hide clear button
    if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';

    if (!q) {
      // Show default popular areas
      if (searchResults) searchResults.style.display = 'none';
      if (defaultView) defaultView.style.display = 'block';
      if (subzonePanel) subzonePanel.style.display = 'none';
      return;
    }

    // Hide defaults, show search results
    if (defaultView) defaultView.style.display = 'none';
    if (subzonePanel) subzonePanel.style.display = 'none';
    if (!searchResults) return;
    searchResults.style.display = 'block';

    // Search the Kenya locations database
    let results = [];
    if (typeof window !== 'undefined' && window.ALL_KE_LOCATIONS) {
      window.ALL_KE_LOCATIONS.forEach(loc => {
        if (loc.searchName && loc.searchName.includes(q)) {
          results.push(loc);
        }
      });
    } else {
      // Fallback: search DOM items
      const items = document.querySelectorAll('.km-sheet-loc-item');
      items.forEach(it => {
        if (it.textContent.toLowerCase().includes(q)) {
          results.push({ name: it.textContent.replace('📍', '').replace('›', '').trim(), type: 'area', emoji: '📍' });
        }
      });
    }

    if (!results.length) {
      searchResults.innerHTML = `<div style="padding:20px; text-align:center; color:#94a3b8; font-size:13px;"><i class="fas fa-search" style="font-size:24px; margin-bottom:8px; display:block; opacity:0.4;"></i>No areas found for "<strong>${query}</strong>"<br><span style="font-size:11px;">Try: Umoja, Ruaka, Pipeline, Westlands...</span></div>`;
      return;
    }

    // Render results with type badges
    const html = results.slice(0, 25).map(loc => {
      const badge = loc.type === 'subzone' ? `<span style="font-size:9px; background:#e0f0e0; color:#006818; padding:2px 5px; border-radius:4px; margin-left:4px;">${loc.parentArea}</span>` : (loc.type === 'county' ? `<span style="font-size:9px; background:#fef3c7; color:#92400e; padding:2px 5px; border-radius:4px; margin-left:4px;">County</span>` : '');
      const emoji = loc.emoji || '📍';
      const countyLabel = loc.county && loc.type !== 'county' ? `<small style="color:#94a3b8; font-size:10px; display:block;">${loc.county}</small>` : '';
      return `<div class="km-loc-result-item" onclick="MobileApp.setLocation('${loc.name.replace(/'/g, "\\'")}')">
        <i class="fas fa-map-marker-alt" style="color:#006818; width:16px;"></i>
        <div style="flex:1; min-width:0;">
          <div style="font-size:13px; font-weight:600;">${loc.name}${badge}</div>
          ${countyLabel}
        </div>
      </div>`;
    }).join('');

    searchResults.innerHTML = `<div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.4px; padding:0 14px 6px;">${results.length} area${results.length !== 1 ? 's' : ''} found</div>${html}`;
  }

  function clearLocSearch() {
    const input = document.getElementById('km-sheet-loc-input');
    if (input) { input.value = ''; input.focus(); }
    filterSheetLocations('');
  }

  function switchLocCounty(countyId, el) {
    // Update tab active state
    document.querySelectorAll('.km-loc-county-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');

    const grid = document.getElementById('km-sheet-suburb-grid');
    if (!grid) return;

    if (countyId === 'all') {
      const allList = KENYA_COUNTY_AREAS.all.areas;
      grid.innerHTML = allList.map(area => {
        const hasMore = area.subZones && area.subZones.length > 0;
        const subZonesAttr = encodeURIComponent(JSON.stringify(area.subZones || []));
        const click = hasMore
          ? `MobileApp.showLocSubZones('${area.name.replace(/'/g, "\\'")}', JSON.parse(decodeURIComponent('${subZonesAttr}')))`
          : `MobileApp.setLocation('${(area.val || '').replace(/'/g, "\\'")}')`;
        return `<div class="km-sheet-loc-item" onclick="${click}">📍 ${area.name}${hasMore ? ' ›' : ''}</div>`;
      }).join('');
      return;
    }

    // Direct from KENYA_COUNTY_AREAS
    const countyData = KENYA_COUNTY_AREAS[countyId];
    if (countyData && countyData.areas) {
      grid.innerHTML = countyData.areas.map(area => {
        const hasMore = area.subZones && area.subZones.length > 0;
        const subZonesAttr = encodeURIComponent(JSON.stringify(area.subZones || []));
        const click = hasMore
          ? `MobileApp.showLocSubZones('${area.name.replace(/'/g, "\\'")}', JSON.parse(decodeURIComponent('${subZonesAttr}')))`
          : `MobileApp.setLocation('${(area.val || '').replace(/'/g, "\\'")}')`;
        return `<div class="km-sheet-loc-item" onclick="${click}">${countyData.emoji || '📍'} ${area.name}${hasMore ? ' ›' : ''}</div>`;
      }).join('');
      return;
    }

    // Fallback to window.ALL_KE_LOCATIONS
    if (window.ALL_KE_LOCATIONS) {
      const areas = window.ALL_KE_LOCATIONS.filter(l => l.countyId === countyId && l.type === 'area');
      if (areas.length) {
        grid.innerHTML = areas.map(area => {
          const hasMore = area.hasSubZones;
          const click = hasMore
            ? `MobileApp.showLocSubZones('${area.name.replace(/'/g, "\\'")}', null)`
            : `MobileApp.setLocation('${area.name.replace(/'/g, "\\'")}')`;
          return `<div class="km-sheet-loc-item" onclick="${click}">${area.emoji || '📍'} ${area.name}${hasMore ? ' ›' : ''}</div>`;
        }).join('');
      }
    }
  }

  function showLocSubZones(parentName, subZones) {
    const panel = document.getElementById('km-loc-subzone-panel');
    const title = document.getElementById('km-loc-subzone-title');
    const grid = document.getElementById('km-loc-subzone-grid');
    const defaultView = document.getElementById('km-loc-default-view');
    if (!panel || !grid) return;

    // Try to get sub-zones from database
    let zones = subZones;
    if (!zones && window.ALL_KE_LOCATIONS) {
      zones = window.ALL_KE_LOCATIONS
        .filter(l => l.type === 'subzone' && l.parentArea === parentName)
        .map(l => l.name);
    }

    if (!zones || !zones.length) {
      setLocation(parentName);
      return;
    }

    if (title) title.textContent = parentName;
    if (defaultView) defaultView.style.display = 'none';

    // Show parent + sub-zones
    grid.innerHTML = `
      <div class="km-sheet-loc-item km-loc-all-btn" onclick="MobileApp.setLocation('${parentName.replace(/'/g, "\\'")}')">📍 All ${parentName}</div>
      ${zones.map(z => `<div class="km-sheet-loc-item" onclick="MobileApp.setLocation('${z.replace(/'/g, "\\'")} ')">${z}</div>`).join('')}
    `;
    panel.style.display = 'block';
  }

  function hideLocSubZones() {
    const panel = document.getElementById('km-loc-subzone-panel');
    const defaultView = document.getElementById('km-loc-default-view');
    if (panel) panel.style.display = 'none';
    if (defaultView) defaultView.style.display = 'block';
  }

  function openWhatsAppAlerts() {
    const modal = document.getElementById('modal-whatsapp-alerts');
    if (modal) {
      modal.classList.add('open');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('z-index', '99990', 'important');
      modal.scrollTop = 0;
      return;
    }
    if (typeof window.openWhatsAppAlertsWithAuth === 'function') {
      window.openWhatsAppAlertsWithAuth();
      return;
    }
    window.open('https://wa.me/254792409540?text=Hello%20KejaMarket,%20I%20want%20to%20subscribe%20to%20WhatsApp%20Rental%20Alerts%20for%20vacancies%20in%20Kenya.', '_blank');
  }

  function openHouseHunt() {
    const modal = document.getElementById('modal-house-hunt');
    if (modal) {
      modal.classList.add('open');
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.setProperty('z-index', '99990', 'important');
      modal.scrollTop = 0;
      return;
    }
    if (window.app && typeof window.app.openHouseHuntModal === 'function') {
      window.app.openHouseHuntModal();
      return;
    }
    showScreen('smarthunt');
  }

  function trackHunt() {
    const activeHuntId = localStorage.getItem('keja_active_hunt_id');
    if (window.app && typeof window.app.openHuntTrackerModal === 'function') {
      window.app.openHuntTrackerModal(activeHuntId);
      return;
    }
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-hunt-tracker');
      return;
    }
    const modal = document.getElementById('modal-hunt-tracker');
    if (modal) {
      modal.classList.add('open');
      modal.style.setProperty('display', 'flex', 'important');
    }
  }

  
  function openCleaning() {
    if (window.app && typeof window.app.filterCategory === 'function') {
      window.app.filterCategory('Services & Artisans');
    } else {
      showScreen('home');
      setCategoryChip('services');
    }
  }

  function openRepairs() {
    if (window.app && typeof window.app.filterCategory === 'function') {
      window.app.filterCategory('Services & Artisans');
    } else {
      showScreen('home');
      setCategoryChip('services');
    }
  }

  function openMovers() {
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-lead-movers');
      return;
    }
    const modal = document.getElementById('modal-lead-movers');
    if (modal) {
      modal.classList.add('open');
      modal.style.setProperty('display', 'flex', 'important');
    }
  }

  function openFibre() {
    if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-lead-fibre');
      return;
    }
    const modal = document.getElementById('modal-lead-fibre');
    if (modal) {
      modal.classList.add('open');
      modal.style.setProperty('display', 'flex', 'important');
    }
  }

  function openPostAd() {
    // 1. Try to open native post ad modal
    const postModal = document.getElementById('modal-post-ad');
    if (postModal) {
      if (window.app && typeof window.app.openModal === 'function') {
        window.app.openModal('modal-post-ad');
      } else {
        postModal.classList.add('open');
        postModal.style.setProperty('display', 'flex', 'important');
      }
      return;
    }
    // Fallback: direct WhatsApp listing concierge
    window.open('https://wa.me/254792409540?text=Hello%20KejaMarket,%20I%20would%20like%20to%20list%20my%20rental%20property%20for%20free', '_blank');
  }

  function chatOnWhatsApp(propId) {
    const prop = State.properties.find(p => p.id === propId) || State.selectedProperty;
    const phone = (prop && (prop.whatsapp || prop.landlord?.whatsapp || prop.phone || prop.contactPhone)) || '+254792409540';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const title = prop ? prop.title : 'property';
    const price = prop ? `KSh ${formatKsh(prop.rentKes || prop.price)}` : '';
    const text = encodeURIComponent(`Hi, I am interested in viewing your listing on KejaMarket: ${title} (${price}). Is it available for viewing?`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  }

  function switchHeroPhoto(url, current, total, thumbEl) {
    if (!isUserLoggedIn()) {
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Please sign in or create an account to view all photos.', 'info');
      }
      if (window.kejaAuth && typeof window.kejaAuth.requireTenantAuth === 'function') {
        window.kejaAuth.requireTenantAuth();
      } else {
        openSignIn();
      }
      return;
    }
    const hero = document.getElementById('km-detail-hero-img');
    const curEl = document.getElementById('km-photo-cur');
    if (hero) hero.src = url;
    if (curEl) curEl.textContent = current;

    document.querySelectorAll('.km-detail-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  }

  async function submitViewingRequest(propId) {
    const prop = State.selectedProperty || State.properties.find(p => p.id === propId);
    if (!prop) return;

    const dateEl = document.getElementById('km-viewing-date');
    const date = (dateEl && dateEl.value) ? dateEl.value : new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const time = State.selectedViewingTime || '10:00 AM';
    const viewingType = State.selectedViewingType || 'physical';
    const msgEl = document.getElementById('km-viewing-msg');
    const notes = (msgEl && msgEl.value.trim()) || '';

    // Show submitting state
    const btn = document.querySelector('.km-btn-call[onclick*="submitViewingRequest"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...'; }

    // Check if user is signed in
    const session = (window.kejaAuth && typeof window.kejaAuth.getSession === 'function')
      ? window.kejaAuth.getSession()
      : JSON.parse(localStorage.getItem('keja_session') || localStorage.getItem('keja_user') || 'null');

    const isLoggedIn = !!(session && (session.id || session.phone || session.email));

    // Save locally always
    const newReq = {
      id: 'vr-' + Date.now(),
      propertyId: prop.id,
      title: prop.title,
      date: `${date} • ${time}`,
      viewingType: viewingType,
      status: 'pending',
      thumbnail: (prop.media && prop.media[0] && prop.media[0].url) || prop.thumbnail
    };
    State.viewingRequests.unshift(newReq);
    localStorage.setItem('keja_viewings', JSON.stringify(State.viewingRequests));

    // If logged in, also POST to server API
    if (isLoggedIn) {
      try {
        const token = session.token || localStorage.getItem('keja_token') || '';
        const resp = await fetch('/api/viewings/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            propertyId: prop.id,
            preferredDate: date,
            preferredTime: time,
            viewingType: viewingType,
            notes: notes
          })
        });
        const result = await resp.json();
        if (!result.success) {
          console.warn('Server viewing request failed:', result.message);
        }
      } catch (err) {
        console.warn('Viewing API error (offline fallback ok):', err.message);
      }
    }

    // If WhatsApp Video Tour - open WhatsApp call directly
    if (viewingType === 'virtual') {
      const phone = (prop.whatsapp || prop.landlord?.whatsapp || prop.phone || prop.contactPhone || '').replace(/[^0-9]/g, '');
      if (phone) {
        const waText = encodeURIComponent(
          `Hi! I have scheduled a WhatsApp Video Tour on KejaMarket for: *${prop.title}* on ${date} at ${time}. Please prepare for a live video inspection at the agreed time. Thank you!`
        );
        setTimeout(() => window.open(`https://wa.me/${phone}?text=${waText}`, '_blank'), 300);
      }
    }

    showScreen('viewing-confirmed', { id: prop.id, viewingType: viewingType, date: date, time: time });
  }

  function sendQuickReply(text) {
    const input = document.getElementById('km-chat-input');
    if (input) {
      input.value = text;
      sendChatMessage();
    }
  }

  function sendChatMessage() {
    const input = document.getElementById('km-chat-input');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';

    const area = document.getElementById('km-chat-messages-area');
    if (area) {
      const bubble = document.createElement('div');
      bubble.className = 'km-chat-bubble out';
      bubble.innerHTML = `
        <div class="km-bubble-meta" style="color:rgba(255,255,255,0.85);">You • Just now</div>
        <div>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      `;
      area.appendChild(bubble);
      area.scrollTop = area.scrollHeight;

      const prop = State.selectedProperty;
      const landlordName = (prop && (prop.landlord?.name || prop.landlordName || prop.owner_name)) || 'Landlord';
      const phone = (prop && (prop.landlord?.phone || prop.phone || prop.contactPhone)) || '254112377651';
      const wa = (prop && (prop.landlord?.whatsapp || prop.whatsapp)) || phone;
      const cleanWa = wa.replace(/[^0-9]/g, '');

      setTimeout(() => {
        const reply = document.createElement('div');
        reply.className = 'km-chat-bubble in';
        reply.innerHTML = `
          <div class="km-bubble-meta">${landlordName} • Just now</div>
          <div>Jambo! I have received your message regarding this property. I am ready to arrange a viewing. Feel free to call me directly or click below to continue on WhatsApp for instant directions!</div>
          <div style="margin-top:8px;">
            <a href="https://wa.me/${cleanWa}?text=${encodeURIComponent('Hi ' + landlordName + ', following up on my KejaMarket chat: ' + text)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:5px; background:#25D366; color:white; padding:6px 12px; border-radius:8px; font-size:11.5px; font-weight:800; text-decoration:none;">
              <i class="fab fa-whatsapp"></i> Chat with ${landlordName} on WhatsApp
            </a>
          </div>
        `;
        area.appendChild(reply);
        area.scrollTop = area.scrollHeight;
      }, 750);

      area.scrollTop = area.scrollHeight;
    }
  }

  function shareProperty(propId) {
    const prop = State.properties.find(p => p.id === propId) || State.selectedProperty;
    const url = window.location.origin + '/?prop=' + (prop ? prop.id : '');
    if (navigator.share) {
      navigator.share({
        title: prop ? prop.title : 'KejaMarket Property',
        text: 'Check out this rental on KejaMarket:',
        url: url
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('Listing link copied to clipboard!');
      });
    } else {
      prompt('Copy listing link:', url);
    }
  }

  function setBudgetPreset(min, max, el) {
    State.filters.minPrice = min;
    State.filters.maxPrice = max;
    const minInput = document.getElementById('km-filter-min');
    const maxInput = document.getElementById('km-filter-max');
    if (minInput) minInput.value = min || '';
    if (maxInput) maxInput.value = max === 999999 ? '' : max;

    if (el && el.parentElement) {
      el.parentElement.querySelectorAll('.km-fchip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    }
  }

  function setFilterType(type, el) {
    State.selectedCategory = type;
    State.filters.type = type;
    if (el && el.parentElement) {
      el.parentElement.querySelectorAll('.km-fchip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    }
  }

  function setFilterBeds(beds, el) {
    State.filters.beds = beds;
    if (el && el.parentElement) {
      el.parentElement.querySelectorAll('.km-fchip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    }
  }

  function resetFilters() {
    State.filters = {
      type: 'all',
      minPrice: null,
      maxPrice: null,
      location: '',
      beds: 'any',
      amenities: [],
      directLandlordOnly: false
    };
    State.selectedCategory = 'all';
    State.searchQuery = '';
    const minInput = document.getElementById('km-filter-min');
    const maxInput = document.getElementById('km-filter-max');
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';
    showScreen('home');
  }

  function toggleFilterAmenity(amenity, el) {
    State.filters.amenities = State.filters.amenities || [];
    const idx = State.filters.amenities.indexOf(amenity);
    if (idx === -1) {
      State.filters.amenities.push(amenity);
      if (el) el.classList.add('active');
    } else {
      State.filters.amenities.splice(idx, 1);
      if (el) el.classList.remove('active');
    }
  }

  function setFilterLocation(loc, el) {
    State.filters.location = loc;
    if (el && el.parentElement) {
      el.parentElement.querySelectorAll('.km-fchip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    }
  }

  function switchFilterCounty(countyId, el) {
    State.activeFilterCounty = countyId;
    document.querySelectorAll('.km-filter-county-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');

    const grid = document.getElementById('km-filter-areas-grid');
    if (grid) grid.innerHTML = renderFilterAreaChips(countyId);

    const subzoneBox = document.getElementById('km-filter-subzones-box');
    if (subzoneBox) subzoneBox.style.display = 'none';

    const searchInput = document.getElementById('km-filter-loc-input');
    if (searchInput) searchInput.value = '';
  }

  // Debounced API location search
  let _locSearchTimer = null;

  function filterCustomLocationChips(query) {
    const q = (query || '').toLowerCase().trim();
    const grid = document.getElementById('km-filter-areas-grid');
    if (!grid) return;

    if (!q) {
      grid.innerHTML = renderFilterAreaChips(State.activeFilterCounty || 'all');
      return;
    }

    // 1. First do instant local search from KENYA_COUNTY_AREAS
    const localMatches = [];
    const seen = new Set();
    Object.values(KENYA_COUNTY_AREAS).forEach(county => {
      county.areas.forEach(a => {
        if (!a.val) return;
        const subMatch = (a.subZones || []).some(sz => sz.toLowerCase().includes(q));
        if ((a.name.toLowerCase().includes(q) || a.val.toLowerCase().includes(q) || subMatch) && !seen.has(a.val)) {
          seen.add(a.val);
          localMatches.push(a);
        }
      });
    });

    if (localMatches.length > 0) {
      grid.innerHTML = localMatches.map(a => {
        const isAct = State.filters.location && State.filters.location.toLowerCase() === a.val.toLowerCase();
        const szJson = encodeURIComponent(JSON.stringify(a.subZones || []));
        const hasSub = a.subZones && a.subZones.length > 0;
        const county = a.county ? ` <span style="font-size:10px;color:#64748b;">(${a.county})</span>` : '';
        return `
          <div class="km-fchip ${isAct ? 'active' : ''}" onclick="MobileApp.selectFilterArea('${a.val.replace(/'/g, "\\'")}', this, decodeURIComponent('${szJson}'))">
            ${a.name}${county}${hasSub ? ' <i class="fas fa-chevron-right" style="font-size:9px; opacity:0.6; margin-left:3px;"></i>' : ''}
          </div>
        `;
      }).join('');
    } else {
      grid.innerHTML = `<div style="font-size:12px; color:#94a3b8; padding:8px 0; width:100%;"><i class="fas fa-circle-notch fa-spin" style="margin-right:6px;"></i>Searching Kenya locations…</div>`;
    }

    // 2. Debounced API search for deeper database results
    clearTimeout(_locSearchTimer);
    _locSearchTimer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/location-search?q=${encodeURIComponent(query)}&limit=20`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (!data.results || !data.results.length) {
          if (!localMatches.length) {
            grid.innerHTML = `<div style="font-size:12px; color:#64748b; padding:10px 0; width:100%;">No areas found for "<strong>${query}</strong>". <span style="color:#006818; cursor:pointer; font-weight:700;" onclick="MobileApp.selectFilterArea('${query}', this)">Use "${query}" anyway</span></div>`;
          }
          return;
        }
        // Render API results (deduplicated with local)
        const apiChips = data.results
          .filter(r => !seen.has(r.name))
          .slice(0, 15)
          .map(r => {
            const breadcrumb = r.breadcrumb && r.breadcrumb.length > 1 ?
              r.breadcrumb.slice(0, -1).join(' › ') : (r.county || '');
            const isAct = State.filters.location && State.filters.location.toLowerCase() === r.name.toLowerCase();
            return `
              <div class="km-fchip ${isAct ? 'active' : ''}" onclick="MobileApp.selectFilterArea('${r.name.replace(/'/g, "\\'")}', this)">
                ${r.name} <span style="font-size:10px;color:#64748b;">(${breadcrumb})</span>
              </div>
            `;
          }).join('');

        if (apiChips) {
          // Append API results after local ones
          const existing = grid.innerHTML;
          grid.innerHTML = existing + (localMatches.length ? '<div style="font-size:10px;color:#94a3b8;width:100%;margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9;">More matches from database:</div>' : '') + apiChips;
        }
      } catch (e) { /* silent API fail */ }
    }, 350);
  }

  function selectFilterArea(loc, el, subZonesStr) {
    State.filters.location = loc;

    // Update active badge in filter screen header
    const badge = document.getElementById('km-filter-active-loc-badge');
    if (badge) badge.textContent = loc || 'All Kenya';

    if (el && el.parentElement) {
      el.parentElement.querySelectorAll('.km-fchip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    }

    // Handle Sub-Zones
    let subZones = [];
    try {
      if (typeof subZonesStr === 'string' && subZonesStr.trim()) {
        subZones = JSON.parse(subZonesStr);
      } else if (Array.isArray(subZonesStr)) {
        subZones = subZonesStr;
      }
    } catch (e) {}

    const subzoneBox = document.getElementById('km-filter-subzones-box');
    const subzoneTitle = document.getElementById('km-subzone-parent-name');
    const subzoneChips = document.getElementById('km-filter-subzone-chips');

    if (subzoneBox && subzoneChips && subZones && subZones.length > 0) {
      if (subzoneTitle) subzoneTitle.textContent = `${loc} Sub-Zones & Roads`;
      subzoneChips.innerHTML = `
        <div class="km-subzone-chip active" onclick="MobileApp.selectFilterSubZone('${loc.replace(/'/g, "\\'")}', this)">All ${loc}</div>
        ${subZones.map(sz => `
          <div class="km-subzone-chip" onclick="MobileApp.selectFilterSubZone('${sz.replace(/'/g, "\\'")}', this)">${sz}</div>
        `).join('')}
      `;
      subzoneBox.style.display = 'block';
    } else if (subzoneBox) {
      subzoneBox.style.display = 'none';
    }
  }

  function selectFilterSubZone(subZone, el) {
    State.filters.location = subZone;
    const badge = document.getElementById('km-filter-active-loc-badge');
    if (badge) badge.textContent = subZone;

    if (el && el.parentElement) {
      el.parentElement.querySelectorAll('.km-subzone-chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    }
  }

  function toggleDirectLandlord(el) {
    State.filters.directLandlordOnly = !State.filters.directLandlordOnly;
    if (el) el.classList.toggle('active', State.filters.directLandlordOnly);
  }

  function applyFilters() {
    const minInput = document.getElementById('km-filter-min');
    const maxInput = document.getElementById('km-filter-max');
    if (minInput && minInput.value) State.filters.minPrice = parseFloat(minInput.value);
    else State.filters.minPrice = null;
    if (maxInput && maxInput.value) State.filters.maxPrice = parseFloat(maxInput.value);
    else State.filters.maxPrice = null;

    showScreen('home');
  }

  function selectTime(timeStr, el) {
    State.selectedViewingTime = timeStr;
    if (el && el.parentElement) {
      el.parentElement.querySelectorAll('.km-fchip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
    }
  }

  function selectViewingType(type, el) {
    State.selectedViewingType = type;
    document.querySelectorAll('.km-viewing-type-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
  }

  function openSignIn(callback) {
    if (window.kejaAuth && typeof window.kejaAuth.openAuthModal === 'function') {
      if (typeof callback === 'function') {
        window.kejaAuth.requireTenantAuth(callback);
      } else {
        window.kejaAuth.openAuthModal('signin');
      }
    } else if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-auth');
    }
  }

  function openSignUp(callback) {
    if (window.kejaAuth && typeof window.kejaAuth.openAuthModal === 'function') {
      window.kejaAuth.openAuthModal('signup');
    } else if (window.app && typeof window.app.openModal === 'function') {
      window.app.openModal('modal-auth');
    }
  }

  function logout() {
    if (window.kejaAuth && typeof window.kejaAuth.signOut === 'function') {
      window.kejaAuth.signOut();
    } else {
      ['keja_token', 'keja_user', 'keja_session', 'kejamarket_user'].forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  }

  // Export to window
  window.MobileApp = {
    init,
    showScreen,
    openSignIn,
    openSignUp,
    toggleFav,
    handleSearch,
    handleLiveSearch,
    scrollStories,
    onStoryScroll,
    clearSearch,
    setCategoryChip,
    setSuburbPill,
    setViewMode,
    cycleSort,
    openLocationModal,
    closeLocationModal,
    setLocation,
    filterSheetLocations,
    clearLocSearch,
    switchLocCounty,
    showLocSubZones,
    hideLocSubZones,
    openPostAd,
    openWhatsAppAlerts,
    openHouseHunt,
    trackHunt,
    openMovers,
    openCleaning,
    openRepairs,
    openFibre,
    chatOnWhatsApp,
    switchHeroPhoto,
    submitViewingRequest,
    sendChatMessage,
    sendQuickReply,
    shareProperty,
    setBudgetPreset,
    setFilterType,
    setFilterBeds,
    setFilterLocation,
    switchFilterCounty,
    filterCustomLocationChips,
    selectFilterArea,
    selectFilterSubZone,
    toggleFilterAmenity,
    toggleDirectLandlord,
    resetFilters,
    applyFilters,
    selectTime,
    selectViewingType,
    logout,
    calcAffordability() {
      const income = parseFloat(document.getElementById('km-afford-income')?.value || 0);
      if (!income || income < 1000) {
        const r = document.getElementById('km-afford-result');
        const b = document.getElementById('km-afford-browse-btn');
        if (r) r.style.display = 'none';
        if (b) b.style.display = 'none';
        return;
      }
      const maxRent = Math.round(income * 0.30);
      const minRent = Math.round(income * 0.15);
      const resultEl = document.getElementById('km-afford-result');
      const rangeEl = document.getElementById('km-afford-range');
      const browseBtn = document.getElementById('km-afford-browse-btn');
      if (resultEl) resultEl.style.display = 'block';
      if (rangeEl) rangeEl.textContent = `KSh ${minRent.toLocaleString()} - ${maxRent.toLocaleString()}`;
      if (browseBtn) browseBtn.style.display = 'block';
      State._affordMax = maxRent;
      State._affordMin = minRent;
    },
    browseAffordable() {
      State.filters.minPrice = State._affordMin || 0;
      State.filters.maxPrice = State._affordMax || 999999;
      showScreen('home');
    }
  };

  // Expose KENYA_COUNTY_AREAS globally for desktop layout, location picker & filters
  if (typeof window !== 'undefined') {
    window.KENYA_COUNTY_AREAS = KENYA_COUNTY_AREAS;
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
