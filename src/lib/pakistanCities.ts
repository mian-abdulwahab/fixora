// Complete list of Pakistani cities organized by province
export const PAKISTAN_CITIES = {
  Punjab: [
    "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala", "Sargodha", 
    "Bahawalpur", "Sialkot", "Sheikhupura", "Jhang", "Rahim Yar Khan", "Gujrat",
    "Kasur", "Sahiwal", "Okara", "Wah Cantonment", "Dera Ghazi Khan", "Muzaffargarh",
    "Chiniot", "Kamoke", "Hafizabad", "Sadiqabad", "Burewala", "Khanewal",
    "Mandi Bahauddin", "Pakpattan", "Toba Tek Singh", "Vehari", "Attock", "Chakwal",
    "Mianwali", "Jhelum", "Bhakkar", "Layyah", "Lodhran", "Narowal", "Rajanpur",
    "Khushab", "Nankana Sahib"
  ],
  Sindh: [
    "Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah", "Mirpur Khas",
    "Jacobabad", "Shikarpur", "Khairpur", "Dadu", "Tando Adam", "Sanghar",
    "Thatta", "Badin", "Umerkot", "Tando Muhammad Khan", "Ghotki", "Matiari",
    "Jamshoro", "Kashmore", "Naushahro Feroze", "Tando Allahyar", "Sujawal"
  ],
  KPK: [
    "Peshawar", "Mardan", "Abbottabad", "Swat", "Kohat", "Dera Ismail Khan",
    "Bannu", "Nowshera", "Mansehra", "Charsadda", "Swabi", "Haripur", "Karak",
    "Buner", "Chitral", "Dir", "Hangu", "Lakki Marwat", "Tank", "Batagram",
    "Shangla", "Tor Ghar", "Kohistan", "Kolai-Pallas"
  ],
  Balochistan: [
    "Quetta", "Turbat", "Khuzdar", "Hub", "Gwadar", "Chaman", "Sibi", "Zhob",
    "Dera Murad Jamali", "Dera Allah Yar", "Mastung", "Pishin", "Kalat", "Loralai",
    "Kharan", "Panjgur", "Nushki", "Usta Muhammad", "Bela", "Awaran", "Kohlu",
    "Washuk", "Musakhel", "Ziarat", "Harnai", "Jhal Magsi", "Kech", "Lasbela",
    "Sherani"
  ],
  "Azad Kashmir": [
    "Muzaffarabad", "Mirpur", "Kotli", "Bhimber", "Rawalakot", "Bagh",
    "Pallandri", "Hajira", "Sudhanoti", "Neelum", "Athmuqam", "Hattian Bala"
  ],
  "Gilgit-Baltistan": [
    "Gilgit", "Skardu", "Chilas", "Hunza", "Ghizer", "Astore", "Khaplu",
    "Shigar", "Diamer", "Nagar"
  ],
  "Islamabad Capital Territory": [
    "Islamabad"
  ]
};

// Flat list of all cities for easy searching
export const ALL_PAKISTAN_CITIES: string[] = Object.values(PAKISTAN_CITIES).flat().sort();

// Get cities grouped by province
export const getCitiesByProvince = () => PAKISTAN_CITIES;

// Search cities
export const searchCities = (query: string): string[] => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return ALL_PAKISTAN_CITIES;
  
  return ALL_PAKISTAN_CITIES.filter(city => 
    city.toLowerCase().includes(lowerQuery)
  );
};

// Get province for a city
export const getProvinceForCity = (cityName: string): string | null => {
  for (const [province, cities] of Object.entries(PAKISTAN_CITIES)) {
    if (cities.some(city => city.toLowerCase() === cityName.toLowerCase())) {
      return province;
    }
  }
  return null;
};
