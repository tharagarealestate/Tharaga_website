// Chennai locality market data (2026)

export interface LocalityData {
  pricePerSqft: { min: number; max: number; avg: number }
  rentalYield: number       // % per year
  appreciation: number      // % per year (3-yr avg)
  marketStatus: 'Hot' | 'Stable' | 'Emerging' | 'Cooling'
  infrastructure: string[]  // nearby infra highlights
  metroDistance: string     // e.g. "800m to Arumbakkam" or "Phase 2 planned"
  itHubDistance: string     // e.g. "2km to TIDEL Park"
  schools: string[]         // top 2-3 schools
  redFlags: string[]
  greenFlags: string[]
  subAreas: string[]        // best sub-localities
  demandLevel: 'High' | 'Medium' | 'Low'
  vacancy: number           // rental vacancy %
}

export const CHENNAI_LOCALITIES: Record<string, LocalityData> = {
  'Anna Nagar': {
    pricePerSqft: { min: 9500, max: 15000, avg: 12200 },
    rentalYield: 2.9,
    appreciation: 8.5,
    marketStatus: 'Hot',
    infrastructure: ['Anna Nagar Tower Park', 'VR Chennai Mall', 'CMBT Bus Terminal', 'Roundtana Metro'],
    metroDistance: '600m to Arumbakkam Metro (Line 1)',
    itHubDistance: '8km to DLF IT Park Ambattur',
    schools: ['DAV Boys Senior Secondary School', 'P.S. Higher Secondary School', 'Balalok Matriculation School'],
    redFlags: ['High traffic congestion on 2nd Ave', 'Limited parking in older buildings', 'Premium pricing leaves little upside'],
    greenFlags: ['Prime central location', 'Strong rental demand from professionals', 'Excellent social infrastructure', 'Metro connectivity'],
    subAreas: ['Anna Nagar West', '2nd Avenue', 'Anna Nagar East', 'Shanthi Colony'],
    demandLevel: 'High',
    vacancy: 4,
  },
  'Adyar': {
    pricePerSqft: { min: 9000, max: 16500, avg: 12800 },
    rentalYield: 2.8,
    appreciation: 7.8,
    marketStatus: 'Stable',
    infrastructure: ['Adyar Estuary', 'Elliot\'s Beach', 'IIT Madras Research Park', 'Adyar Cancer Institute'],
    metroDistance: '1.2km to Taramani Metro (Line 2 Phase 2)',
    itHubDistance: '4km to Taramani IT Corridor',
    schools: ['Vidya Mandir Senior Secondary School', 'Lady Andal School', 'Chettinad Vidyashram'],
    redFlags: ['Flood-prone low-lying areas near river', 'Old buildings with no parking', 'Premium saturation'],
    greenFlags: ['Prestigious address', 'IIT Madras proximity', 'Beach access', 'Strong NRI buyer demand'],
    subAreas: ['Besant Nagar border', 'Kasturba Nagar', 'Indira Nagar', 'Gandhi Nagar'],
    demandLevel: 'High',
    vacancy: 5,
  },
  'OMR': {
    pricePerSqft: { min: 5500, max: 9500, avg: 7200 },
    rentalYield: 4.1,
    appreciation: 9.2,
    marketStatus: 'Hot',
    infrastructure: ['TIDEL Park', 'Ascendas IT Park', 'SP Infocity', 'RmZ Millenia'],
    metroDistance: 'Phase 2 planned — Sholinganallur to Siruseri corridor',
    itHubDistance: '0-3km to TIDEL Park / Ascendas (varies by stretch)',
    schools: ['Velammal Matriculation HSS', 'PSBB Millennium School', 'Gateway International School'],
    redFlags: ['Poor TNEB power supply in outer OMR', 'Waterlogging during monsoon', 'Limited social infra beyond 20km stretch'],
    greenFlags: ['IT hub proximity drives strong rental', 'High appreciation corridor', 'Metro Phase 2 unlocks value', 'Large inventory choice'],
    subAreas: ['Sholinganallur', 'Perungudi', 'Thoraipakkam', 'Karapakkam', 'Siruseri'],
    demandLevel: 'High',
    vacancy: 7,
  },
  'Velachery': {
    pricePerSqft: { min: 7000, max: 11500, avg: 9100 },
    rentalYield: 3.5,
    appreciation: 8.0,
    marketStatus: 'Hot',
    infrastructure: ['Phoenix Market City', 'VGP Golden Beach', 'Velachery MRTS', 'Medavakkam Tank'],
    metroDistance: '500m to Velachery Metro (Line 2)',
    itHubDistance: '3km to Perungudi IT Park / 6km to TIDEL Park',
    schools: ['Padma Seshadri Bala Bhavan', 'Sri Chaitanya Techno School', 'Chettinad Hari Shree Vidyalayam'],
    redFlags: ['Flooding near Velachery lake during heavy rain', 'Traffic bottleneck on 100 Feet Road', 'Rapid density increase'],
    greenFlags: ['Dual Metro + MRTS access', 'Phoenix Mall drives lifestyle premium', 'Strong IT worker demand', 'Mid-segment affordability'],
    subAreas: ['Velachery Main Road', 'Taramani Link Road', 'Vijaya Nagar', 'Pallikaranai border'],
    demandLevel: 'High',
    vacancy: 5,
  },
  'Porur': {
    pricePerSqft: { min: 6000, max: 10000, avg: 7800 },
    rentalYield: 3.8,
    appreciation: 8.8,
    marketStatus: 'Hot',
    infrastructure: ['Ramachandra Hospital', 'DLF IT Park', 'Porur Lake', 'Sri Ramachandra University'],
    metroDistance: '1.5km to Porur Junction (Phase 2 planned)',
    itHubDistance: '1km to DLF IT Park Porur',
    schools: ['Velammal Nexus School', 'SBOA School & Junior College', 'St. Joseph\'s Higher Secondary School'],
    redFlags: ['High traffic at Porur junction', 'Waterlogging near lake belt', 'Under-developed public transit currently'],
    greenFlags: ['DLF IT Park drives rental demand', 'Hospital hub adds stability', 'Phase 2 metro upside', 'Affordable vs central Chennai'],
    subAreas: ['Ramapuram', 'Mugalivakkam', 'Kattupakkam', 'Kolapakkam'],
    demandLevel: 'High',
    vacancy: 6,
  },
  'T Nagar': {
    pricePerSqft: { min: 10500, max: 18000, avg: 13500 },
    rentalYield: 2.5,
    appreciation: 6.5,
    marketStatus: 'Stable',
    infrastructure: ['Panagal Park', 'Express Avenue Mall', 'Mambalam MRTS', 'Commercial Hub'],
    metroDistance: '800m to Mambalam Metro (Phase 2)',
    itHubDistance: '5km to Guindy Industrial Estate',
    schools: ['Bharath Senior Secondary School', 'SIET Girls Higher Secondary School', 'DAV Girls Higher Secondary School'],
    redFlags: ['Extreme traffic — worst in Chennai', 'Commercial-residential conflict', 'Very high entry cost', 'Limited parking'],
    greenFlags: ['Gold and jewellery commercial value', 'Unbeatable central location', 'Strong long-term demand', 'Metro Phase 2 upcoming'],
    subAreas: ['Pondy Bazaar', 'Usman Road', 'Sir Thyagaraja Road', 'Nandanam'],
    demandLevel: 'Medium',
    vacancy: 8,
  },
  'Chromepet': {
    pricePerSqft: { min: 4800, max: 7500, avg: 6000 },
    rentalYield: 4.5,
    appreciation: 7.2,
    marketStatus: 'Emerging',
    infrastructure: ['Chennai International Airport (6km)', 'Chromepet MRTS', 'GST Road corridor', 'Tambaram-Velachery Road'],
    metroDistance: '2km to Chromepet MRTS / Airport Metro planned',
    itHubDistance: '12km to Mahindra World City / 8km to Sholinganallur',
    schools: ['Chettinad Vidyashram', 'St. Thomas Matriculation School', 'Infant Jesus Matriculation'],
    redFlags: ['Noise pollution near airport flight path', 'GST Road traffic', 'Older infrastructure in core areas'],
    greenFlags: ['Airport proximity premium', 'Affordable entry point', 'MRTS connectivity', 'Good rental yields'],
    subAreas: ['Pallavaram', 'Pammal', 'Anakaputhur', 'Zamin Pallavaram'],
    demandLevel: 'Medium',
    vacancy: 8,
  },
  'Ambattur': {
    pricePerSqft: { min: 4500, max: 7000, avg: 5500 },
    rentalYield: 4.8,
    appreciation: 7.5,
    marketStatus: 'Emerging',
    infrastructure: ['SIPCOT Industrial Estate', 'Ambattur Industrial Estate', 'DLF IT Park (3km)', 'Padi MRTS'],
    metroDistance: '1km to Ambattur Metro (Phase 2 planned)',
    itHubDistance: '3km to DLF IT Park Ambattur',
    schools: ['P.U. Middle School', 'Vivek Vidhyalaya', 'Annai Velankanni Higher Secondary School'],
    redFlags: ['Industrial area pollution concerns', 'Traffic congestion near estate', 'Limited premium social infra'],
    greenFlags: ['Strong industrial rental demand', 'Affordable pricing', 'IT park proximity growing', 'Good bus connectivity'],
    subAreas: ['Padi', 'Korattur', 'Nehru Nagar', 'Anna Nagar border'],
    demandLevel: 'Medium',
    vacancy: 9,
  },
  'Sholinganallur': {
    pricePerSqft: { min: 6500, max: 10500, avg: 8200 },
    rentalYield: 4.3,
    appreciation: 9.5,
    marketStatus: 'Hot',
    infrastructure: ['Wipro Campus', 'Infosys Campus', 'Accenture Hub', 'Amazon Development Center'],
    metroDistance: '500m to Sholinganallur Metro (Phase 2)',
    itHubDistance: '0.5km to Sholinganallur IT Cluster',
    schools: ['PSBB Learning Leadership School', 'Gateway International', 'Velammal Matriculation HSS'],
    redFlags: ['OMR traffic jams during peak hours', 'Flooding during heavy rain', 'Oversupply risk in micro-market'],
    greenFlags: ['Highest rental yield on OMR', 'Walk to major IT campuses', 'Metro Phase 2 catalyst', 'Young professional demographic'],
    subAreas: ['Kandhanchavadi', 'Karapakkam', 'Rajiv Gandhi Salai', 'ECR junction'],
    demandLevel: 'High',
    vacancy: 5,
  },
  'Pallikaranai': {
    pricePerSqft: { min: 5000, max: 8500, avg: 6500 },
    rentalYield: 4.0,
    appreciation: 8.2,
    marketStatus: 'Emerging',
    infrastructure: ['Pallikaranai Marshland (Reserve Forest)', 'Medavakkam junction', 'Velachery-Tambaram Road'],
    metroDistance: '2km to Velachery Metro / Phase 2 Medavakkam station planned',
    itHubDistance: '4km to Perungudi IT Park / 6km to Sholinganallur',
    schools: ['Sree Gokulam School', 'Apollo Matriculation', 'Annai Vailankanni Matriculation'],
    redFlags: ['Marshland proximity — flooding risk zone', 'CMDA scrutiny on new projects', 'Waterlogging in low areas'],
    greenFlags: ['Affordable IT corridor alternative', 'Metro Phase 2 will boost prices', 'Good road connectivity', 'Growing social infra'],
    subAreas: ['Medavakkam', 'Kottivakkam', 'Palavakkam', 'Nanmangalam'],
    demandLevel: 'Medium',
    vacancy: 9,
  },
  'Guduvanchery': {
    pricePerSqft: { min: 3200, max: 5500, avg: 4200 },
    rentalYield: 4.8,
    appreciation: 10.5,
    marketStatus: 'Emerging',
    infrastructure: ['Guduvanchery Railway Station', 'Mahindra World City (5km)', 'Grand Southern Trunk Road', 'Oragadam Industrial Corridor'],
    metroDistance: 'No metro — suburban rail (Guduvanchery station)',
    itHubDistance: '5km to Mahindra World City / 15km to OMR',
    schools: ['Sri Chaitanya Techno School', 'Sree Saraswathi Thyagaraja College', 'SBOA Matriculation'],
    redFlags: ['Far from central Chennai (35km)', 'Limited social infra currently', 'Long commute to IT hubs'],
    greenFlags: ['Highest appreciation rate (10.5%)', 'Mahindra World City proximity', 'Affordable land prices', 'Industrial corridor growth story'],
    subAreas: ['Singaperumal Koil', 'Kelambakkam border', 'Potheri', 'Chengalpattu Road'],
    demandLevel: 'Medium',
    vacancy: 12,
  },
  'Siruseri': {
    pricePerSqft: { min: 4000, max: 6500, avg: 5100 },
    rentalYield: 4.5,
    appreciation: 9.8,
    marketStatus: 'Emerging',
    infrastructure: ['SIPCOT IT Park Siruseri', 'HCL Campus', 'Cognizant Campus', 'Kelambakkam junction'],
    metroDistance: 'Phase 2 extension planned to Siruseri',
    itHubDistance: '0km — within SIPCOT IT Park',
    schools: ['Velammal International School', 'PSBB School Kelambakkam', 'GRT Mahalakshmi Vidhya Mandir'],
    redFlags: ['Isolated if IT park slows hiring', 'Limited retail/social infra', 'Far from central city (30km)'],
    greenFlags: ['Dedicated IT park address', 'Lower prices with high yields', 'Metro Phase 2 future value', 'Young professional rentals'],
    subAreas: ['Kelambakkam', 'Navallur', 'Padur', 'Navalur'],
    demandLevel: 'Medium',
    vacancy: 10,
  },
  'Tambaram': {
    pricePerSqft: { min: 4500, max: 7200, avg: 5700 },
    rentalYield: 4.2,
    appreciation: 7.0,
    marketStatus: 'Stable',
    infrastructure: ['Tambaram Railway Junction', 'Tambaram Air Force Station', 'GST Road', 'St. Thomas Mount'],
    metroDistance: '2km to St. Thomas Mount Metro (Line 2)',
    itHubDistance: '10km to Mahindra World City / 14km to OMR',
    schools: ['Vidya Mandir School Tambaram', 'Government Higher Secondary School', 'Infant Jesus Matriculation'],
    redFlags: ['Traffic on GST Road', 'Older infrastructure in core', 'Slower appreciation vs OMR'],
    greenFlags: ['Excellent suburban rail connectivity', 'Affordable family homes', 'Air force station adds stability', 'Growing retail options'],
    subAreas: ['West Tambaram', 'East Tambaram', 'Selaiyur', 'Perungalathur'],
    demandLevel: 'Medium',
    vacancy: 8,
  },
  'Thoraipakkam': {
    pricePerSqft: { min: 7000, max: 11000, avg: 8800 },
    rentalYield: 4.2,
    appreciation: 9.0,
    marketStatus: 'Hot',
    infrastructure: ['Cognizant Campus', 'MPhasis Hub', 'Radial Road 11', 'ECR junction proximity'],
    metroDistance: '1km to Sholinganallur Metro corridor (Phase 2)',
    itHubDistance: '1km to Cognizant / MPhasis campuses',
    schools: ['SBOA School Thoraipakkam', 'Velammal Matriculation', 'Ryan International School'],
    redFlags: ['OMR traffic bottleneck', 'High density apartment micro-market', 'Flood risk in low-lying pockets'],
    greenFlags: ['IT campus walkability', 'Strong rental occupancy', 'Metro Phase 2 imminent', 'Mid-segment pricing'],
    subAreas: ['Karapakkam', 'Egattur', 'Rajiv Gandhi Salai junction', 'Semmancheri Road'],
    demandLevel: 'High',
    vacancy: 6,
  },
  'Perungudi': {
    pricePerSqft: { min: 6800, max: 10500, avg: 8500 },
    rentalYield: 3.9,
    appreciation: 8.5,
    marketStatus: 'Hot',
    infrastructure: ['RmZ Millenia IT Park', 'Perungudi MRTS', 'Rajiv Gandhi Salai start', 'Taramani Link Road'],
    metroDistance: '1.2km to Taramani Metro (Phase 2) / Perungudi MRTS',
    itHubDistance: '0.5km to RmZ Millenia Tech Park',
    schools: ['Chettinad Harishree Vidyalayam', 'PSBB LSRP', 'Kendriya Vidyalaya Taramani'],
    redFlags: ['Perungudi dump yard proximity (older pockets)', 'Traffic on Rajiv Gandhi Salai', 'Limited green open space'],
    greenFlags: ['Gateway to OMR IT corridor', 'RmZ Millenia anchor tenant stability', 'MRTS + Metro Phase 2', 'Strong corporate rental'],
    subAreas: ['Taramani', 'Perungudi Main Road', 'Lattice Bridge Road', 'Nehru Nagar'],
    demandLevel: 'High',
    vacancy: 6,
  },
  'Nungambakkam': {
    pricePerSqft: { min: 12000, max: 22000, avg: 16500 },
    rentalYield: 2.3,
    appreciation: 6.0,
    marketStatus: 'Stable',
    infrastructure: ['US Consulate', 'Hotel Leela Palace', 'Nungambakkam Metro', 'Khader Nawaz Khan Road'],
    metroDistance: '300m to Nungambakkam Metro (Line 1)',
    itHubDistance: '5km to Guindy IT Corridor',
    schools: ['Lady Sivaswami Ayyar Girls Higher Secondary', 'Bharathi Vidyalaya', 'P.S. Senior Secondary School'],
    redFlags: ['Highest price per sqft in Chennai', 'Very low rental yields', 'Limited upside from current valuation'],
    greenFlags: ['Premium address and prestige', 'Consulate zone stability', 'Metro access', 'High NRI demand'],
    subAreas: ['Khader Nawaz Khan Road', 'Cenotaph Road', 'Ranganathan Street area', 'Haddows Road'],
    demandLevel: 'Medium',
    vacancy: 10,
  },
  'Kilpauk': {
    pricePerSqft: { min: 8500, max: 13500, avg: 10800 },
    rentalYield: 3.0,
    appreciation: 7.2,
    marketStatus: 'Stable',
    infrastructure: ['Kilpauk Medical College Hospital', 'Kilpauk Garden', 'Poonamallee High Road', 'Pursaiwakkam'],
    metroDistance: '1km to Kilpauk Metro (Phase 2 planned)',
    itHubDistance: '6km to Ambattur IT Park',
    schools: ['PSBB Main School', 'Padma Seshadri Bala Bhavan (PSBB)', 'Lady Muir Higher Secondary School'],
    redFlags: ['Dense old city traffic', 'Limited new supply of modern apartments', 'Older drainage system'],
    greenFlags: ['Medical hub creates stable demand', 'Good educational institutions', 'Central location', 'Established residential character'],
    subAreas: ['Purasawalkam', 'Chetpet', 'Vepery', 'Egmore border'],
    demandLevel: 'Medium',
    vacancy: 7,
  },
  'Mylapore': {
    pricePerSqft: { min: 9500, max: 15000, avg: 12000 },
    rentalYield: 2.6,
    appreciation: 6.5,
    marketStatus: 'Stable',
    infrastructure: ['Kapaleeshwarar Temple', 'Mylapore Tank', 'Luz Corner', 'San Thome Basilica'],
    metroDistance: '1.5km to Alwarpet Metro (Phase 2)',
    itHubDistance: '5km to Taramani IT Corridor',
    schools: ['P.S. Senior Secondary School', 'Good Shepherd Matriculation', 'Chettinad Vidyashram (branch)'],
    redFlags: ['Conservation zone limits new construction', 'Old buildings without parking', 'Narrow streets restrict access'],
    greenFlags: ['Heritage premium — rare commodity', 'Temple town cultural value', 'Brahmin community demand stability', 'Limited new supply keeps prices firm'],
    subAreas: ['Luz', 'Alwarpet', 'R.A. Puram', 'Abhiramapuram'],
    demandLevel: 'Medium',
    vacancy: 9,
  },
  'Besant Nagar': {
    pricePerSqft: { min: 10000, max: 17500, avg: 13800 },
    rentalYield: 2.7,
    appreciation: 7.0,
    marketStatus: 'Stable',
    infrastructure: ['Elliot\'s Beach', 'Theosophical Society', 'Foreshore Estate', 'Adyar River mouth'],
    metroDistance: '1.8km to Indira Nagar Metro (Phase 2)',
    itHubDistance: '4km to Taramani IT Corridor',
    schools: ['Vidya Mandir School', 'Lady Andal Venkatasubba Rao School', 'AIHT School'],
    redFlags: ['Coastal regulation zone limits construction', 'Premium pricing with low yields', 'Flood risk in coastal pockets'],
    greenFlags: ['Beachfront lifestyle premium', 'Elite residential enclave', 'Strong NRI / HNI demand', 'Limited supply drives value'],
    subAreas: ['Adyar ECR stretch', 'Foreshore Estate', 'Besant Nagar 1st-4th Avenues', 'Edward Elliot\'s Beach Road'],
    demandLevel: 'Medium',
    vacancy: 8,
  },
  'Poonamallee': {
    pricePerSqft: { min: 3800, max: 6500, avg: 5000 },
    rentalYield: 4.6,
    appreciation: 8.0,
    marketStatus: 'Emerging',
    infrastructure: ['Poonamallee Bus Terminus', 'Maduravoyal junction', 'NH-48 (Chennai-Bengaluru Highway)', 'Avadi DRDO'],
    metroDistance: 'Poonamallee Metro (Phase 2 planned)',
    itHubDistance: '5km to Porur IT Park / 8km to Ambattur IE',
    schools: ['P.M. Matriculation Higher Secondary School', 'Bala Vidhya Mandir', 'Sri Chaitanya Techno School'],
    redFlags: ['Suburban — long commute to central Chennai', 'Limited premium apartments', 'Infrastructure still developing'],
    greenFlags: ['NH-48 highway access', 'DRDO/defence sector demand', 'Affordable with good yields', 'Metro Phase 2 potential catalyst'],
    subAreas: ['Maduravoyal', 'Nerkundram', 'Vanagaram', 'Alapakkam'],
    demandLevel: 'Medium',
    vacancy: 10,
  },
  'Madipakkam': {
    pricePerSqft: { min: 5800, max: 9000, avg: 7200 },
    rentalYield: 3.8,
    appreciation: 8.2,
    marketStatus: 'Emerging',
    infrastructure: ['Velachery-Tambaram Road', 'Madipakkam Lake', 'Radial Road 5', 'Vijaya Hospital'],
    metroDistance: '2km to Velachery Metro (Line 2)',
    itHubDistance: '5km to Perungudi IT Park / 7km to TIDEL',
    schools: ['Pon Vidhyashram', 'Sri Ram Vidhyalaya', 'Poompuhar Higher Secondary School'],
    redFlags: ['Traffic bottlenecks on main road', 'Older infrastructure in core Madipakkam', 'Lake flood risk in monsoon'],
    greenFlags: ['Affordable vs Velachery with good connectivity', 'Growing residential preference', 'OMR/Velachery accessibility', 'Family-friendly neighbourhood'],
    subAreas: ['Rajakilpakkam', 'Kovilambakkam', 'Sembakkam', 'Ullagaram'],
    demandLevel: 'Medium',
    vacancy: 8,
  },
  'Perambur': {
    pricePerSqft: { min: 5000, max: 8000, avg: 6300 },
    rentalYield: 4.0,
    appreciation: 6.8,
    marketStatus: 'Stable',
    infrastructure: ['Perambur Railway Station', 'ICF Factory', 'Perambur MRTS', 'Kolathur junction'],
    metroDistance: '800m to Perambur Metro (Phase 2)',
    itHubDistance: '7km to Ambattur IT Park',
    schools: ['Government Higher Secondary School Perambur', 'Annai Velankanni Matriculation', 'St. Anne\'s Matriculation'],
    redFlags: ['Industrial area proximity', 'Older residential stock', 'Limited premium project options'],
    greenFlags: ['Excellent suburban rail connectivity', 'ICF employment stability', 'Metro Phase 2 boosts connectivity', 'Affordable north Chennai'],
    subAreas: ['Kolathur', 'Villivakkam', 'Sembium', 'Otteri'],
    demandLevel: 'Medium',
    vacancy: 9,
  },
  'Korattur': {
    pricePerSqft: { min: 5200, max: 8200, avg: 6500 },
    rentalYield: 4.1,
    appreciation: 7.5,
    marketStatus: 'Emerging',
    infrastructure: ['Korattur Lake', 'Ambattur Industrial Estate (2km)', 'Padi junction', 'Anna Nagar border'],
    metroDistance: '1km to Korattur Metro (Phase 2 planned)',
    itHubDistance: '4km to DLF IT Park Ambattur',
    schools: ['Vidya Vikas Matriculation', 'Sri Ramakrishna Vidyalaya', 'St. Joseph Matriculation Higher Secondary'],
    redFlags: ['Industrial estate traffic and pollution nearby', 'Limited luxury housing options', 'Older streetscape'],
    greenFlags: ['Korattur Lake scenic value', 'Anna Nagar border premium', 'Metro Phase 2 catalyst', 'Good IT commute'],
    subAreas: ['Padi', 'Thirumangalam', 'MKB Nagar', 'Anna Nagar border stretch'],
    demandLevel: 'Medium',
    vacancy: 9,
  },
  'Koyambedu': {
    pricePerSqft: { min: 7500, max: 12000, avg: 9500 },
    rentalYield: 3.2,
    appreciation: 7.0,
    marketStatus: 'Stable',
    infrastructure: ['CMBT (Chennai Mofussil Bus Terminus)', 'Koyambedu Wholesale Market', 'Koyambedu Metro', 'CMBT flyover'],
    metroDistance: '400m to Koyambedu Metro (Line 1)',
    itHubDistance: '3km to Porur IT Park / 5km to Ambattur',
    schools: ['Hindu Higher Secondary School', 'Sri Sankara Matriculation', 'Mount Litera Zee School'],
    redFlags: ['Wholesale market traffic chaos', 'Commercial noise and congestion', 'Limited premium residential supply'],
    greenFlags: ['Best metro connectivity (Line 1 hub)', 'Wholesale market drives constant activity', 'Strong bus connectivity', 'Central west Chennai'],
    subAreas: ['Virugambakkam', 'Vadapalani', 'Saligramam', 'Ashok Nagar'],
    demandLevel: 'Medium',
    vacancy: 7,
  },
  'Kovilambakkam': {
    pricePerSqft: { min: 5500, max: 8800, avg: 7000 },
    rentalYield: 4.0,
    appreciation: 8.5,
    marketStatus: 'Emerging',
    infrastructure: ['Kovilambakkam Bus Depot', 'Medavakkam junction', 'Velachery Road', 'Grand Southern Trunk junction'],
    metroDistance: '2.5km to Velachery Metro / Medavakkam station Phase 2 planned',
    itHubDistance: '6km to Perungudi / 8km to Sholinganallur',
    schools: ['Sri Ram Vidhyalaya', 'Velammal Matriculation', 'Sree Gokulam Matriculation'],
    redFlags: ['Rapid unplanned development', 'Flooding risk in pockets near Kovilambakkam Lake', 'Limited branded developers'],
    greenFlags: ['Affordable entry to south Chennai', 'Fast appreciation trajectory', 'Good road connectivity to OMR/GST', 'Growing family residential demand'],
    subAreas: ['Medavakkam', 'Nanmangalam', 'Puzhuthivakkam', 'Ullagaram'],
    demandLevel: 'Medium',
    vacancy: 9,
  },
  'Medavakkam': {
    pricePerSqft: { min: 5200, max: 8500, avg: 6700 },
    rentalYield: 4.1,
    appreciation: 8.8,
    marketStatus: 'Emerging',
    infrastructure: ['Medavakkam junction', 'Keelkattalai junction', 'Velachery Road', 'Pallikaranai Reserve Forest border'],
    metroDistance: 'Medavakkam Metro station (Phase 2 planned)',
    itHubDistance: '5km to Perungudi / 7km to Sholinganallur',
    schools: ['Pon Vidhyashram School', 'Vedavalli Vidyalaya', 'SBOA School Medavakkam'],
    redFlags: ['Marshland proximity in some sub-sectors', 'Metro Phase 2 delay risk', 'Unorganised construction in outer pockets'],
    greenFlags: ['Metro Phase 2 will be transformative', 'Affordable south Chennai gateway', 'Good OMR commute options', 'Strong rental occupancy from IT workers'],
    subAreas: ['Keelkattalai', 'Kovilambakkam border', 'Kazhipattur Road', 'Puzhuthivakkam'],
    demandLevel: 'Medium',
    vacancy: 10,
  },
}

/**
 * Case-insensitive locality lookup with closest-match fallback
 */
export function getLocality(name: string): LocalityData {
  if (!name) return CHENNAI_LOCALITIES['OMR']

  // Exact match (case-insensitive)
  const lowerName = name.toLowerCase()
  for (const [key, data] of Object.entries(CHENNAI_LOCALITIES)) {
    if (key.toLowerCase() === lowerName) return data
  }

  // Partial match
  for (const [key, data] of Object.entries(CHENNAI_LOCALITIES)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) return data
  }

  // Sub-area match
  for (const [, data] of Object.entries(CHENNAI_LOCALITIES)) {
    if (data.subAreas.some(s => s.toLowerCase().includes(lowerName) || lowerName.includes(s.toLowerCase()))) {
      return data
    }
  }

  // Default to OMR as representative mid-market
  return CHENNAI_LOCALITIES['OMR']
}

/**
 * Returns up to 3 comparable localities based on similar price range and market status
 */
export function getComparableLocalities(name: string, budget: number): string[] {
  const pricePerSqft = budget / 1000 // rough sqft estimate for 1000 sqft

  const scored = Object.entries(CHENNAI_LOCALITIES)
    .filter(([key]) => key.toLowerCase() !== name.toLowerCase())
    .map(([key, data]) => {
      const priceDiff = Math.abs(data.pricePerSqft.avg - pricePerSqft)
      return { name: key, score: priceDiff }
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(e => e.name)

  return scored
}

export interface BankData {
  name: string
  rate: number
  benefit: string
}

export const CHENNAI_BANKS: BankData[] = [
  { name: 'Union Bank of India', rate: 8.25, benefit: 'Lowest rate for salaried + PMAY subsidy eligible' },
  { name: 'Canara Bank',         rate: 8.30, benefit: 'Zero pre-payment charges, best for long tenure' },
  { name: 'Punjab National Bank', rate: 8.35, benefit: 'Special rate for women applicants (8.25%)' },
  { name: 'SBI',                 rate: 8.40, benefit: 'Largest bank — best balance transfer options + Yono app' },
  { name: 'Axis Bank',           rate: 8.55, benefit: 'Fast processing (7 days), flexible part-prepayment' },
  { name: 'HDFC Bank',           rate: 8.50, benefit: 'Best for self-employed, door-step service' },
  { name: 'ICICI Bank',          rate: 8.65, benefit: 'Step-up EMI option, instant sanction for CIBIL 750+' },
  { name: 'Kotak Mahindra Bank', rate: 8.70, benefit: 'Premium service, linked savings account benefit' },
]

export const STAMP_DUTY_RATE       = 0.07   // 7% Tamil Nadu
export const REGISTRATION_FEE_RATE = 0.01   // 1% Tamil Nadu
export const GST_UNDER_CONSTRUCTION = 0.05  // 5% GST on under-construction properties
