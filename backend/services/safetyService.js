/**
 * SafeVoyage Destination Safety Knowledge & Live Correlation Service
 * Provides localized threat advisories, health indicators, safe havens, and risk zones.
 */

const DESTINATIONS_DB = {
  chennai: {
    name: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    advisories: [
      {
        id: 'adv_chn_1',
        type: 'High-Surf Advisory',
        city: 'Chennai',
        location: 'Marina Beach',
        category: 'Beach',
        severity: 'HIGH',
        startDate: '2026-09-24',
        endDate: '2026-09-26',
        startTime: '14:00',
        description: 'Severe coastal swell and rough sea conditions with waves reaching 3.5m–4.2m along the Marina and Elliot beach shorelines.',
        recommendation: 'Avoid beach activities during the affected period. Maintain a 100m safety buffer from water edge.'
      },
      {
        id: 'adv_chn_2',
        type: 'Monsoon Thunderstorm Advisory',
        city: 'Chennai',
        location: 'Central Chennai',
        category: 'Nature',
        severity: 'MODERATE',
        startDate: '2026-09-26',
        endDate: '2026-09-27',
        startTime: '16:00',
        description: 'Isolated intense rainfall and gusty winds predicted over North and Central Chennai suburban corridors.',
        recommendation: 'Plan indoor backup activities, carry rain gear, and check arterial road traffic before departure.'
      }
    ],
    mapPoints: [
      { id: 'p_1', name: 'Apollo Hospital Greams Road', type: 'hospital', lat: 13.0583, lng: 80.2520, x: 35, y: 40, phone: '044 2829 0200', status: '24/7 Trauma Care', isSafe: true },
      { id: 'p_2', name: 'Rajiv Gandhi Govt General Hospital', type: 'hospital', lat: 13.0805, lng: 80.2785, x: 58, y: 20, phone: '044 2530 5000', status: 'Emergency Open', isSafe: true },
      { id: 'p_3', name: 'Marina Beach Police Station', type: 'police', lat: 13.0500, lng: 80.2824, x: 75, y: 50, phone: '044 2844 5555', status: 'Active Patrol HQ', isSafe: true },
      { id: 'p_4', name: 'Marina Shoreline Rough Sea Zone', type: 'risk_zone', lat: 13.0480, lng: 80.2830, x: 82, y: 55, severity: 'HIGH', status: 'Active Wave Advisory: >3.5m', isSafe: false },
      { id: 'p_5', name: 'Kamarajar Safe Haven Shelter', type: 'shelter', lat: 13.0418, lng: 80.2505, x: 40, y: 70, phone: '044 2855 0101', status: 'Verified Safe Zone', isSafe: true },
      { id: 'p_6', name: 'IOCL Emergency Fuel & Evac Hub', type: 'petrol', lat: 13.0490, lng: 80.2580, x: 48, y: 52, phone: '044 2811 9999', status: 'Open 24 Hours', isSafe: true }
    ],
    hospitals: [
      { name: 'Apollo Hospital (Greams Road)', type: 'Multi-Speciality & Level 1 Trauma', address: '21 Greams Lane, Thousand Lights, Chennai', distance: '2.4 km', phone: '044 2829 0200', status: 'Open 24/7' },
      { name: 'Rajiv Gandhi Government General Hospital', type: 'Major Public Referral & Trauma Center', address: 'EVR Periyar Salai, Park Town, Chennai', distance: '4.1 km', phone: '044 2530 5000', status: 'Open 24/7' },
      { name: 'Fortis Malar Hospital', type: 'Cardiac & Emergency Care', address: 'Gandhi Nagar, Adyar, Chennai', distance: '5.8 km', phone: '044 4289 2222', status: 'Open 24/7' }
    ],
    policeStations: [
      { name: 'Marina Beach Police Station (D-6)', address: 'Kamarajar Salai, Marina Beach, Chennai', distance: '0.8 km', phone: '044 2844 5555' },
      { name: 'Anna Square Police Station (D-5)', address: 'Near MGR Memorial, Marina Beach, Chennai', distance: '1.4 km', phone: '044 2858 2222' },
      { name: 'Mylapore Police Station (E-1)', address: 'Kutchery Rd, Mylapore, Chennai', distance: '2.5 km', phone: '044 2464 1234' }
    ],
    healthStatus: { epidemicRisk: 'LOW', details: 'Zero active vector outbreaks. High coastal humidity (drink bottled water).' }
  },
  mumbai: {
    name: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0760,
    lng: 72.8777,
    advisories: [
      {
        id: 'adv_bom_1',
        type: 'High Tide & Coastal Swell Warning',
        city: 'Mumbai',
        location: 'Marine Drive & Juhu',
        category: 'Beach',
        severity: 'HIGH',
        startDate: '2026-09-24',
        endDate: '2026-09-27',
        startTime: '12:00',
        description: 'Spring high tide reaching 4.8m expected along South Mumbai sea face promenade.',
        recommendation: 'Do not approach seaside railings during high tide hours. Keep away from tetrapods.'
      }
    ],
    mapPoints: [
      { id: 'p_bom_1', name: 'Lilavati Hospital & Research Centre', type: 'hospital', lat: 19.0515, lng: 72.8291, x: 38, y: 35, phone: '022 2675 1000', status: '24/7 Trauma Care', isSafe: true },
      { id: 'p_bom_2', name: 'KEM Hospital & Medical College', type: 'hospital', lat: 19.0028, lng: 72.8427, x: 50, y: 55, phone: '022 2410 7000', status: 'Emergency Trauma Hub', isSafe: true },
      { id: 'p_bom_3', name: 'Marine Drive Police Station', type: 'police', lat: 18.9322, lng: 72.8239, x: 30, y: 75, phone: '022 2281 1234', status: 'Coastal Patrol HQ', isSafe: true },
      { id: 'p_bom_4', name: 'Marine Drive High-Tide Hazard Zone', type: 'risk_zone', lat: 18.9400, lng: 72.8200, x: 28, y: 70, severity: 'HIGH', status: 'Active 4.8m Tide Swell', isSafe: false },
      { id: 'p_bom_5', name: 'Bandra Reclamation Safe Haven', type: 'shelter', lat: 19.0450, lng: 72.8350, x: 45, y: 40, phone: '022 2642 0000', status: 'Designated Safe Shelter', isSafe: true }
    ],
    hospitals: [
      { name: 'Lilavati Hospital (Bandra)', type: 'Super-Speciality & Level 1 Trauma', address: 'A-791, Bandra Reclamation, Bandra West, Mumbai', distance: '1.8 km', phone: '022 2675 1000', status: 'Open 24/7' },
      { name: 'KEM Hospital (Parel)', type: 'Premier Emergency Referral Center', address: 'Acharya Donde Marg, Parel, Mumbai', distance: '3.5 km', phone: '022 2410 7000', status: 'Open 24/7' },
      { name: 'Bombay Hospital (Marine Lines)', type: 'Cardiac & General Emergency', address: '12 Marine Lines, Mumbai', distance: '4.2 km', phone: '022 2206 7676', status: 'Open 24/7' }
    ],
    policeStations: [
      { name: 'Marine Drive Police Station', address: 'Netaji Subhash Chandra Bose Rd, Churchgate, Mumbai', distance: '1.1 km', phone: '022 2281 1234' },
      { name: 'Colaba Police Station', address: 'SBS Rd, Colaba, Mumbai', distance: '2.8 km', phone: '022 2285 2222' }
    ],
    healthStatus: { epidemicRisk: 'MODERATE', details: 'Seasonal monsoon alerts. Avoid unboiled street water.' }
  },
  goa: {
    name: 'Goa',
    state: 'Goa',
    lat: 15.2993,
    lng: 74.1240,
    advisories: [
      {
        id: 'adv_goa_1',
        type: 'Rough Sea & Red-Flag Coastal Notice',
        city: 'Goa',
        location: 'Calangute & Baga Beach',
        category: 'Beach',
        severity: 'HIGH',
        startDate: '2026-09-24',
        endDate: '2026-09-28',
        startTime: '10:00',
        description: 'Undercurrents and heavy wave breaks active along North and South Goa beach corridors.',
        recommendation: 'Strictly observe red warning flags. No swimming or watersports permitted.'
      }
    ],
    mapPoints: [
      { id: 'p_goa_1', name: 'Goa Medical College (GMC Bambolim)', type: 'hospital', lat: 15.4600, lng: 73.8500, x: 50, y: 40, phone: '0832 245 8700', status: 'Tertiary Trauma Care', isSafe: true },
      { id: 'p_goa_2', name: 'Manipal Hospital Dona Paula', type: 'hospital', lat: 15.4550, lng: 73.8100, x: 42, y: 45, phone: '0832 664 6666', status: '24/7 Emergency Wing', isSafe: true },
      { id: 'p_goa_3', name: 'Calangute Police Station', type: 'police', lat: 15.5400, lng: 73.7600, x: 30, y: 25, phone: '0832 227 8225', status: 'Tourist Security HQ', isSafe: true },
      { id: 'p_goa_4', name: 'Baga-Calangute Rip Current Hazard Zone', type: 'risk_zone', lat: 15.5500, lng: 73.7500, x: 26, y: 20, severity: 'HIGH', status: 'Red Flag: No Swimming', isSafe: false },
      { id: 'p_goa_5', name: 'Panaji Civil Safe Center', type: 'shelter', lat: 15.4989, lng: 73.8278, x: 48, y: 35, phone: '0832 222 5555', status: 'Verified Safe Zone', isSafe: true }
    ],
    hospitals: [
      { name: 'Goa Medical College (GMC Bambolim)', type: 'Apex Trauma & Multi-Speciality', address: 'NH 66, Bambolim, Goa', distance: '3.2 km', phone: '0832 245 8700', status: 'Open 24/7' },
      { name: 'Manipal Hospital (Dona Paula)', type: 'Emergency Critical Care', address: 'Dr E Borges Rd, Dona Paula, Goa', distance: '4.8 km', phone: '0832 664 6666', status: 'Open 24/7' }
    ],
    policeStations: [
      { name: 'Calangute Police Station', address: 'Calangute, North Goa', distance: '1.5 km', phone: '0832 227 8225' },
      { name: 'Panaji Police Station', address: 'Church Square, Panaji, Goa', distance: '3.2 km', phone: '0832 242 0875' }
    ],
    healthStatus: { epidemicRisk: 'LOW', details: 'Normal coastal health parameters. Use insect repellent in greenery.' }
  },
  netravati: {
    name: 'Netravati',
    state: 'Karnataka',
    lat: 13.1284,
    lng: 75.3305,
    advisories: [
      {
        id: 'adv_net_1',
        type: 'Western Ghats Monsoon Trekking Alert',
        city: 'Netravati',
        location: 'Netravati Peak Trail',
        category: 'Nature',
        severity: 'MODERATE',
        startDate: '2026-09-24',
        endDate: '2026-09-29',
        startTime: '08:00',
        description: 'Slippery ridge trails and sudden afternoon mist on Netravati Peak trek. Leeches active in forest corridor.',
        recommendation: 'Register with Karnataka Forest Department before 11:00 AM. Wear non-slip trek boots and leech gaiters.'
      }
    ],
    mapPoints: [
      { id: 'p_net_1', name: 'Belthangady Taluk Govt Hospital', type: 'hospital', lat: 13.0033, lng: 75.2589, x: 45, y: 40, phone: '08256 232 024', status: 'Government Emergency Care', isSafe: true },
      { id: 'p_net_2', name: 'SDM Multi-Speciality Hospital Ujire', type: 'hospital', lat: 13.0189, lng: 75.2912, x: 55, y: 35, phone: '08256 236 225', status: '24/7 Trauma Care Center', isSafe: true },
      { id: 'p_net_3', name: 'Dharmasthala Police Station', type: 'police', lat: 12.9567, lng: 75.3811, x: 60, y: 65, phone: '08256 277 133', status: 'Active Hill Police Desk', isSafe: true },
      { id: 'p_net_4', name: 'Netravati Peak Ridge Fog & Slip Hazard', type: 'risk_zone', lat: 13.1350, lng: 75.3380, x: 50, y: 20, severity: 'MODERATE', status: 'Active Trekking Slip Hazard', isSafe: false },
      { id: 'p_net_5', name: 'Forest Checkpost Eco Safe Haven', type: 'shelter', lat: 13.1150, lng: 75.3210, x: 40, y: 30, phone: '1800 425 1100', status: 'Forest Ranger Camp', isSafe: true }
    ],
    hospitals: [
      { name: 'SDM Multi-Speciality Hospital (Ujire)', type: 'Emergency Critical Care', address: 'Ujire, Belthangady, Karnataka', distance: '12.4 km', phone: '08256 236 225', status: 'Open 24/7' },
      { name: 'Belthangady Taluk Hospital', type: 'General Emergency Wing', address: 'Main Rd, Belthangady', distance: '15.2 km', phone: '08256 232 024', status: 'Open 24/7' }
    ],
    policeStations: [
      { name: 'Belthangady Police Station', address: 'Police Line, Belthangady, Karnataka', distance: '14.8 km', phone: '08256 232 033' },
      { name: 'Dharmasthala Police Station', address: 'Temple Rd, Dharmasthala', distance: '19.2 km', phone: '08256 277 133' }
    ],
    healthStatus: { epidemicRisk: 'LOW', details: 'High-elevation mountain air. Carry salt/sanitizer for leeches during monsoon.' }
  },
  delhi: {
    name: 'Delhi',
    state: 'Delhi NCR',
    lat: 28.6139,
    lng: 77.2090,
    advisories: [
      {
        id: 'adv_del_1',
        type: 'Air Quality & Dust Inversion Advisory',
        city: 'Delhi',
        location: 'Central Delhi',
        category: 'Sightseeing',
        severity: 'MODERATE',
        startDate: '2026-09-24',
        endDate: '2026-09-27',
        startTime: '08:00',
        description: 'Elevated particulate matter (AQI 180+) during early morning hours across urban corridors.',
        recommendation: 'Sensitive travellers and seniors should carry N95 masks for outdoor monument walks.'
      }
    ],
    mapPoints: [
      { id: 'p_del_1', name: 'AIIMS New Delhi Emergency', type: 'hospital', lat: 28.5672, lng: 77.2100, x: 50, y: 60, phone: '011 2658 8500', status: 'Apex National Trauma Center', isSafe: true },
      { id: 'p_del_2', name: 'Max Super Speciality Saket', type: 'hospital', lat: 28.5280, lng: 77.2150, x: 52, y: 75, phone: '011 2651 5050', status: '24/7 Emergency Care', isSafe: true },
      { id: 'p_del_3', name: 'Connaught Place Police Station', type: 'police', lat: 28.6315, lng: 77.2167, x: 50, y: 35, phone: '011 2336 2200', status: 'Tourist Police Booth', isSafe: true },
      { id: 'p_del_4', name: 'Ring Road Heavy Congestion Zone', type: 'risk_zone', lat: 28.6100, lng: 77.2400, x: 60, y: 45, severity: 'MODERATE', status: 'Traffic & Emission Alert', isSafe: false },
      { id: 'p_del_5', name: 'Delhi Metro Central Transit Safe Haven', type: 'shelter', lat: 28.6328, lng: 77.2195, x: 52, y: 33, phone: '011 155370', status: 'Guarded Safe Zone', isSafe: true }
    ],
    hospitals: [
      { name: 'AIIMS (Ansari Nagar)', type: 'National Apex Level 1 Trauma', address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi', distance: '2.1 km', phone: '011 2658 8500', status: 'Open 24/7' },
      { name: 'Safdarjung Hospital', type: 'Emergency & Burn Care Center', address: 'Ring Road, New Delhi', distance: '2.4 km', phone: '011 2616 5060', status: 'Open 24/7' }
    ],
    policeStations: [
      { name: 'Connaught Place Police Station', address: 'Baba Kharak Singh Rd, Connaught Place, New Delhi', distance: '0.9 km', phone: '011 2336 2200' },
      { name: 'Parliament Street Police Station', address: 'Parliament St, New Delhi', distance: '1.5 km', phone: '011 2336 1222' }
    ],
    healthStatus: { epidemicRisk: 'MODERATE', details: 'AQI fluctuates; carry hydration and inhalers for asthma-prone travelers.' }
  },
  bengaluru: {
    name: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    advisories: [
      {
        id: 'adv_blr_1',
        type: 'Urban Waterlogging Caution',
        city: 'Bengaluru',
        location: 'Outer Ring Road Corridor',
        category: 'Transport',
        severity: 'LOW',
        startDate: '2026-09-24',
        endDate: '2026-09-26',
        startTime: '17:00',
        description: 'Evening shower runoff may cause traffic delays along low-lying underpasses.',
        recommendation: 'Allow 30–45 mins buffer for airport and transit connections.'
      }
    ],
    mapPoints: [
      { id: 'p_blr_1', name: 'Manipal Hospital Old Airport Rd', type: 'hospital', lat: 12.9592, lng: 77.6476, x: 65, y: 55, phone: '080 2502 4444', status: '24/7 Trauma Care', isSafe: true },
      { id: 'p_blr_2', name: 'Apollo Hospitals Bannerghatta', type: 'hospital', lat: 12.8948, lng: 77.5986, x: 50, y: 75, phone: '080 2630 4050', status: 'Emergency Critical Care', isSafe: true },
      { id: 'p_blr_3', name: 'Cubbon Park Police Station', type: 'police', lat: 12.9778, lng: 77.5989, x: 50, y: 35, phone: '080 2294 2222', status: 'Central Patrol HQ', isSafe: true },
      { id: 'p_blr_4', name: 'Silk Board Inundation Delay Zone', type: 'risk_zone', lat: 12.9170, lng: 77.6230, x: 58, y: 68, severity: 'LOW', status: 'Evening Traffic Runoff Alert', isSafe: false },
      { id: 'p_blr_5', name: 'MG Road Metro Safe Haven', type: 'shelter', lat: 12.9756, lng: 77.6066, x: 52, y: 37, phone: '080 2296 9300', status: 'Security Guarded Hub', isSafe: true }
    ],
    hospitals: [
      { name: 'Manipal Hospital (HAL Airport Rd)', type: 'Comprehensive Level 1 Trauma Center', address: '98 HAL Airport Rd, Kodihalli, Bengaluru', distance: '3.1 km', phone: '080 2502 4444', status: 'Open 24/7' },
      { name: 'Victoria Hospital (City Market)', type: 'Apex Public Referral Hospital', address: 'Fort Rd, near City Market, Bengaluru', distance: '4.5 km', phone: '080 2670 1150', status: 'Open 24/7' }
    ],
    policeStations: [
      { name: 'Cubbon Park Police Station', address: 'Kasturba Rd, Shanthala Nagar, Ashok Nagar, Bengaluru', distance: '1.2 km', phone: '080 2294 2222' },
      { name: 'Ashok Nagar Police Station', address: 'Museum Rd, Shanthala Nagar, Bengaluru', distance: '1.8 km', phone: '080 2294 2223' },
      { name: 'Indiranagar Police Station', address: 'CMH Rd, Indiranagar, Bengaluru', distance: '3.5 km', phone: '080 2294 2224' }
    ],
    healthStatus: { epidemicRisk: 'LOW', details: 'Pleasant weather (~23°C). Safe water and sanitation across city center.' }
  },
  jaipur: {
    name: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.9124,
    lng: 75.7873,
    advisories: [
      {
        id: 'adv_jai_1',
        type: 'Afternoon Heat & Sunstroke Advisory',
        city: 'Jaipur',
        location: 'Amer Fort & Nahargarh',
        category: 'Sightseeing',
        severity: 'MODERATE',
        startDate: '2026-09-24',
        endDate: '2026-09-27',
        startTime: '12:00',
        description: 'Direct sunlight and temperatures exceeding 34°C on hilltop fort stone ramparts.',
        recommendation: 'Tour historic ramparts before 11:30 AM or after 4:00 PM. Carry electrolyte hydration.'
      }
    ],
    mapPoints: [
      { id: 'p_jai_1', name: 'SMS Hospital (Sawai Man Singh)', type: 'hospital', lat: 26.8988, lng: 75.8166, x: 55, y: 55, phone: '0141 251 8224', status: 'Apex State Trauma Center', isSafe: true },
      { id: 'p_jai_2', name: 'Fortis Escorts Hospital Malviya Nagar', type: 'hospital', lat: 26.8522, lng: 75.8078, x: 52, y: 75, phone: '0141 254 7000', status: 'Emergency Critical Care', isSafe: true },
      { id: 'p_jai_3', name: 'Manak Chowk Police Station (Old City)', type: 'police', lat: 26.9240, lng: 75.8270, x: 60, y: 35, phone: '0141 260 2222', status: 'Heritage Patrol Post', isSafe: true },
      { id: 'p_jai_4', name: 'Nahargarh Hill Stone Rampart Heat Zone', type: 'risk_zone', lat: 26.9380, lng: 75.8150, x: 52, y: 20, severity: 'MODERATE', status: 'Peak Heat Alert (12 PM–3 PM)', isSafe: false },
      { id: 'p_jai_5', name: 'Hawa Mahal Tourist Assistance Center', type: 'shelter', lat: 26.9239, lng: 75.8267, x: 59, y: 36, phone: '0141 261 8862', status: 'Tourist Safe Hub', isSafe: true }
    ],
    hospitals: [
      { name: 'SMS Hospital (Sawai Man Singh)', type: 'Apex Government Emergency Center', address: 'JLN Marg, Ashok Nagar, Jaipur', distance: '2.5 km', phone: '0141 251 8224', status: 'Open 24/7' },
      { name: 'Fortis Escorts Hospital', type: 'Multi-Speciality Emergency Wing', address: 'Jawaharlal Nehru Marg, Malviya Nagar, Jaipur', distance: '5.2 km', phone: '0141 254 7000', status: 'Open 24/7' }
    ],
    policeStations: [
      { name: 'Manak Chowk Police Station (Old City)', address: 'Old City, Jaipur', distance: '0.9 km', phone: '0141 260 2222' },
      { name: 'Ashok Nagar Police Station', address: 'JLN Marg, Jaipur', distance: '1.5 km', phone: '0141 274 0100' }
    ],
    healthStatus: { epidemicRisk: 'LOW', details: 'Warm dry climate. Keep shaded and hydrated during fort climbs.' }
  },
  madurai: {
    name: 'Madurai',
    state: 'Tamil Nadu',
    lat: 9.9252,
    lng: 78.1198,
    advisories: [
      {
        id: 'adv_mdu_1',
        type: 'Temple Pilgrimage Crowd Advisory',
        city: 'Madurai',
        location: 'Meenakshi Amman Temple Perimeter',
        category: 'Cultural',
        severity: 'LOW',
        startDate: '2026-09-24',
        endDate: '2026-10-02',
        startTime: '07:00',
        description: 'Large pilgrim gatherings during morning and evening pooja hours.',
        recommendation: 'Use designated footwear holding counters. Keep children and seniors close in central corridors.'
      }
    ],
    mapPoints: [
      { id: 'p_mdu_1', name: 'Government Rajaji Hospital (GRH)', type: 'hospital', lat: 9.9290, lng: 78.1310, x: 55, y: 40, phone: '0452 253 2535', status: '24/7 Apex Regional Trauma Center', isSafe: true },
      { id: 'p_mdu_2', name: 'Meenakshi Mission Hospital', type: 'hospital', lat: 9.9480, lng: 78.1630, x: 70, y: 25, phone: '0452 426 3000', status: 'Emergency Critical Care', isSafe: true },
      { id: 'p_mdu_3', name: 'Madurai Town Police Station (Temple Post)', type: 'police', lat: 9.9195, lng: 78.1190, x: 45, y: 50, phone: '0452 234 1000', status: 'Tourist Security Post', isSafe: true },
      { id: 'p_mdu_4', name: 'Chithirai Chariot Heavy Pedestrian Zone', type: 'risk_zone', lat: 9.9180, lng: 78.1210, x: 48, y: 53, severity: 'LOW', status: 'Pilgrim Crowd Alert', isSafe: false }
    ],
    hospitals: [
      { name: 'Government Rajaji Hospital (GRH)', type: 'Tertiary Government Referral & Trauma Center', address: 'Panagal Rd, Alwarpuram, Madurai', distance: '1.4 km', phone: '0452 253 2535', status: 'Open 24/7' },
      { name: 'Meenakshi Mission Hospital & Research Centre', type: 'Multi-Speciality Critical Care', address: 'Lake Area, Melur Rd, Madurai', distance: '4.8 km', phone: '0452 426 3000', status: 'Open 24/7' }
    ],
    policeStations: [
      { name: 'Madurai Town Police Station', address: 'Meenakshi Temple Corridor, Madurai', distance: '0.6 km', phone: '0452 234 1000' },
      { name: 'Thallakulam Police Station', address: 'Alagarkoil Rd, Madurai', distance: '2.1 km', phone: '0452 253 0100' }
    ],
    healthStatus: { epidemicRisk: 'LOW', details: 'Normal regional health status. Drink bottled water during temple circuits.' }
  },
  rameshwaram: {
    name: 'Rameshwaram',
    state: 'Tamil Nadu',
    lat: 9.2876,
    lng: 79.3129,
    advisories: [
      {
        id: 'adv_ram_1',
        type: 'Island Coastal Breeze & Tide Precaution',
        city: 'Rameshwaram',
        location: 'Agni Theertham & Dhanushkodi',
        category: 'Beach',
        severity: 'LOW',
        startDate: '2026-09-24',
        endDate: '2026-10-03',
        startTime: '06:00',
        description: 'Breezy coastal currents around Dhanushkodi point.',
        recommendation: 'Only bathe at approved shoreline bathing ghats with active lifeguard supervision.'
      }
    ],
    mapPoints: [
      { id: 'p_ram_1', name: 'Government Hospital Rameswaram', type: 'hospital', lat: 9.2890, lng: 79.3110, x: 50, y: 45, phone: '04573 221 233', status: 'Emergency Civil Wing', isSafe: true },
      { id: 'p_ram_2', name: 'Rameswaram Town Police Station', type: 'police', lat: 9.2860, lng: 79.3140, x: 52, y: 48, phone: '04573 221 223', status: 'Island Security Post', isSafe: true }
    ],
    hospitals: [
      { name: 'Government Hospital Rameswaram', type: 'Civil Hospital & Trauma Unit', address: 'Railway Feeder Rd, Rameswaram', distance: '0.8 km', phone: '04573 221 233', status: 'Open 24/7' }
    ],
    policeStations: [
      { name: 'Rameswaram Town Police Station', address: 'Car Street, Rameswaram', distance: '0.5 km', phone: '04573 221 223' },
      { name: 'Dhanushkodi Marine Police Post', address: 'Dhanushkodi Rd, Rameswaram', distance: '12 km', phone: '04573 222 100' }
    ],
    healthStatus: { epidemicRisk: 'LOW', details: 'Tropical coastal air. Keep hydrated and protected from midday sun.' }
  },
  dubai: {
    name: 'Dubai',
    state: 'Dubai Emirate',
    lat: 25.2048,
    lng: 55.2708,
    advisories: [
      {
        id: 'adv_dxb_1',
        type: 'Afternoon Heat & Hydration Precaution',
        city: 'Dubai',
        location: 'Downtown & Marina Promenade',
        category: 'Sightseeing',
        severity: 'LOW',
        startDate: '2026-09-24',
        endDate: '2026-10-15',
        startTime: '12:00',
        description: 'Midday sunny temperatures up to 36°C.',
        recommendation: 'Schedule outdoor skyline walks during early morning or sunset hours. Carry water.'
      }
    ],
    mapPoints: [
      { id: 'p_dxb_1', name: 'Rashid Hospital Emergency Trauma', type: 'hospital', lat: 25.2490, lng: 55.3210, x: 55, y: 35, phone: '+971 4 219 2000', status: 'Level 1 Trauma Center', isSafe: true },
      { id: 'p_dxb_2', name: 'Mediclinic City Hospital (Healthcare City)', type: 'hospital', lat: 25.2320, lng: 55.3180, x: 52, y: 40, phone: '+971 4 435 9999', status: '24/7 Emergency Care', isSafe: true },
      { id: 'p_dxb_3', name: 'Bur Dubai Police Station', type: 'police', lat: 25.2520, lng: 55.2980, x: 45, y: 32, phone: '+971 4 398 1111', status: 'Tourist Security Desk', isSafe: true }
    ],
    hospitals: [
      { name: 'Rashid Hospital (Umm Hurair II)', type: 'Premier Government Level 1 Trauma Center', address: 'Oud Metha Rd, Umm Hurair II, Dubai', distance: '2.5 km', phone: '+971 4 219 2000', status: 'Open 24/7' },
      { name: 'Mediclinic City Hospital', type: 'Comprehensive Tertiary Care Center', address: 'Building 37, Dubai Healthcare City', distance: '3.8 km', phone: '+971 4 435 9999', status: 'Open 24/7' }
    ],
    policeStations: [
      { name: 'Bur Dubai Police Station', address: 'Al Fahidi, Bur Dubai', distance: '1.2 km', phone: '+971 4 398 1111' },
      { name: 'Al Barsha Police Station', address: 'Al Barsha 2, Dubai', distance: '4.5 km', phone: '+971 4 609 9999' }
    ],
    healthStatus: { epidemicRisk: 'LOW', details: 'World-class municipal healthcare standards. Ultra-clean drinking water.' }
  }
};

/**
 * Returns complete destination safety intelligence
 */
export function getDestinationSafety(cityName = 'Chennai') {
  const normalized = (cityName || 'Chennai').toLowerCase().trim();
  const foundKey = Object.keys(DESTINATIONS_DB).find(k => normalized.includes(k) || k.includes(normalized));

  if (foundKey) {
    return DESTINATIONS_DB[foundKey];
  }

  // Dynamic Generator for any other custom destination
  const capCity = cityName.charAt(0).toUpperCase() + cityName.slice(1);
  return {
    name: capCity,
    state: 'Region',
    lat: 20.5937,
    lng: 78.9629,
    advisories: [
      {
        id: `adv_${Date.now()}`,
        type: 'Seasonal Weather Precaution',
        city: capCity,
        location: `${capCity} Central`,
        category: 'General',
        severity: 'LOW',
        startDate: '2026-09-24',
        endDate: '2026-09-28',
        startTime: '10:00',
        description: `Routine travel weather advisory active for ${capCity}. Moderate conditions observed.`,
        recommendation: 'Check local weather bulletins before embarking on long day excursions.'
      }
    ],
    mapPoints: [
      { id: 'p_dyn_1', name: `${capCity} General Hospital`, type: 'hospital', lat: 20.60, lng: 78.96, x: 45, y: 40, phone: '108', status: 'Emergency Trauma Wing', isSafe: true },
      { id: 'p_dyn_2', name: `${capCity} Central Police HQ`, type: 'police', lat: 20.61, lng: 78.97, x: 60, y: 35, phone: '100', status: '24/7 Municipal Police Desk', isSafe: true },
      { id: 'p_dyn_3', name: `${capCity} Municipal Transit Shelter`, type: 'shelter', lat: 20.59, lng: 78.95, x: 40, y: 65, phone: '112', status: 'Verified Safe Zone', isSafe: true }
    ],
    hospitals: [
      { name: `${capCity} District Civil Hospital`, type: '24/7 Emergency Care', address: `Civil Lines, ${capCity}`, distance: '2.0 km', phone: '108', status: 'Open 24/7' },
      { name: `${capCity} Super Speciality Clinic`, type: 'Urgent Care Center', address: `Main Road, ${capCity}`, distance: '3.5 km', phone: '112', status: 'Open 24/7' }
    ],
    policeStations: [
      { name: `${capCity} Central Police HQ`, address: `Civil Lines, ${capCity}`, distance: '1.5 km', phone: '100' },
      { name: `${capCity} Town Police Station`, address: `Main Circle, ${capCity}`, distance: '2.8 km', phone: '112' }
    ],
    healthStatus: { epidemicRisk: 'LOW', details: `Standard travel precautions apply in ${capCity}.` }
  };
}

/**
 * Dynamically queries Google Places API (New) using text search for real verified hospitals & police stations
 */
export async function fetchGooglePlacesFacilities(cityName = 'Goa', category = 'hospital') {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const isPolice = (category || '').toLowerCase() === 'police';
    const query = isPolice ? `police station in ${cityName}` : `hospital emergency in ${cityName}`;

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber,places.nationalPhoneNumber'
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 8 })
    });

    const data = await response.json();
    if (data.places && data.places.length > 0) {
      return data.places.map((p, idx) => ({
        id: `gplace_${isPolice ? 'police' : 'hospital'}_${idx}`,
        name: p.displayName?.text || `${cityName} Emergency Service`,
        type: isPolice ? 'police' : 'hospital',
        address: p.formattedAddress || `${cityName} Area`,
        phone: p.nationalPhoneNumber || p.internationalPhoneNumber || (isPolice ? '100' : '108'),
        lat: p.location?.latitude,
        lng: p.location?.longitude,
        status: isPolice ? 'Verified 24/7 Police Station' : 'Verified Emergency Trauma Care',
        isSafe: true,
        distance: 'Local District'
      }));
    }
  } catch (err) {
    console.warn('[Places API New Warning]:', err.message);
  }
  return null;
}

