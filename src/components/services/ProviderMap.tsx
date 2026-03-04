import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerCity } from "@/hooks/useCustomerCity";
import { useAuth } from "@/contexts/AuthContext";
import { ALL_PAKISTAN_CITIES } from "@/lib/pakistanCities";
import "leaflet/dist/leaflet.css";

// Extended Pakistan city coordinates - every city from pakistanCities.ts
const cityCoordinates: Record<string, [number, number]> = {
  // Punjab
  "Lahore": [31.5204, 74.3587], "Faisalabad": [31.4504, 73.1350], "Rawalpindi": [33.5651, 73.0169],
  "Multan": [30.1575, 71.5249], "Gujranwala": [32.1877, 74.1945], "Sargodha": [32.0740, 72.6861],
  "Bahawalpur": [29.3956, 71.6836], "Sialkot": [32.4945, 74.5229], "Sheikhupura": [31.7131, 73.9857],
  "Jhang": [31.2681, 72.3181], "Rahim Yar Khan": [28.4202, 70.2952], "Gujrat": [32.5742, 74.0789],
  "Kasur": [31.1186, 74.4503], "Sahiwal": [30.6682, 73.1114], "Okara": [30.8138, 73.4534],
  "Wah Cantonment": [33.7680, 72.7292], "Dera Ghazi Khan": [30.0489, 70.6455],
  "Muzaffargarh": [30.0733, 71.1936], "Chiniot": [31.7167, 72.9781], "Kamoke": [31.9747, 74.2239],
  "Hafizabad": [32.0709, 73.6880], "Sadiqabad": [28.3091, 70.1297], "Burewala": [30.1667, 72.1500],
  "Khanewal": [30.3020, 71.9321], "Mandi Bahauddin": [32.5861, 73.4917],
  "Pakpattan": [30.3500, 73.3833], "Toba Tek Singh": [30.9667, 72.4833], "Vehari": [30.0452, 72.3489],
  "Attock": [33.7667, 72.3597], "Chakwal": [32.9328, 72.8558], "Mianwali": [32.5853, 71.5436],
  "Jhelum": [32.9425, 73.7257], "Bhakkar": [31.6082, 71.0648], "Layyah": [30.9693, 70.9428],
  "Lodhran": [29.5333, 71.6333], "Narowal": [32.1020, 74.8730], "Rajanpur": [29.1044, 70.3301],
  "Khushab": [32.2920, 72.3500], "Nankana Sahib": [31.4500, 73.7000],
  // Sindh
  "Karachi": [24.8607, 67.0011], "Hyderabad": [25.3960, 68.3578], "Sukkur": [27.7052, 68.8574],
  "Larkana": [27.5570, 68.2141], "Nawabshah": [26.2483, 68.4100], "Mirpur Khas": [25.5276, 69.0159],
  "Jacobabad": [28.2769, 68.4514], "Shikarpur": [27.9556, 68.6382], "Khairpur": [27.5295, 68.7592],
  "Dadu": [26.7319, 67.7750], "Tando Adam": [25.7681, 68.6616], "Sanghar": [26.0464, 68.9481],
  "Thatta": [24.7461, 67.9236], "Badin": [24.6560, 68.8372], "Umerkot": [25.3613, 69.7361],
  "Tando Muhammad Khan": [25.1242, 68.5366], "Ghotki": [28.0064, 69.3153], "Matiari": [25.5970, 68.4448],
  "Jamshoro": [25.4302, 68.2802], "Kashmore": [28.4322, 69.5844],
  "Naushahro Feroze": [26.8401, 68.1220], "Tando Allahyar": [25.4603, 68.7174], "Sujawal": [24.5600, 68.4800],
  // KPK
  "Peshawar": [34.0151, 71.5249], "Mardan": [34.1986, 72.0404], "Abbottabad": [34.1688, 73.2215],
  "Swat": [35.2227, 72.3526], "Kohat": [33.5869, 71.4414], "Dera Ismail Khan": [31.8320, 70.9016],
  "Bannu": [32.9888, 70.6046], "Nowshera": [34.0153, 71.9747], "Mansehra": [34.3330, 73.1967],
  "Charsadda": [34.1453, 71.7308], "Swabi": [34.1200, 72.4700], "Haripur": [33.9942, 72.9333],
  "Karak": [33.1167, 71.0833], "Buner": [34.3942, 72.6250], "Chitral": [35.8518, 71.7864],
  "Dir": [35.2000, 71.8800], "Hangu": [33.5300, 71.0600], "Lakki Marwat": [32.6075, 70.9111],
  "Tank": [32.2167, 70.3833], "Batagram": [34.6833, 73.0267], "Shangla": [34.8667, 72.6000],
  "Tor Ghar": [34.6500, 72.8500], "Kohistan": [35.2167, 73.0500], "Kolai-Pallas": [35.0833, 73.1000],
  // Balochistan
  "Quetta": [30.1798, 66.9750], "Turbat": [26.0031, 63.0544], "Khuzdar": [27.8000, 66.6167],
  "Hub": [25.0500, 66.8833], "Gwadar": [25.1264, 62.3225], "Chaman": [30.9210, 66.4597],
  "Sibi": [29.5430, 67.8773], "Zhob": [31.3500, 69.4500], "Dera Murad Jamali": [28.5467, 68.2261],
  "Dera Allah Yar": [28.3500, 68.1500], "Mastung": [29.7997, 66.8456], "Pishin": [30.5833, 67.0000],
  "Kalat": [29.0275, 66.5931], "Loralai": [30.3706, 68.5978], "Kharan": [28.5856, 65.4150],
  "Panjgur": [26.9667, 64.0833], "Nushki": [29.5522, 66.0233], "Usta Muhammad": [28.1750, 68.0444],
  "Bela": [26.2267, 66.3133], "Awaran": [26.4528, 65.2311], "Kohlu": [29.8967, 69.2522],
  "Washuk": [27.6917, 64.7833], "Musakhel": [30.8833, 69.8167], "Ziarat": [30.3797, 67.7264],
  "Harnai": [30.1000, 67.9333], "Jhal Magsi": [28.6000, 67.6000], "Kech": [26.0000, 63.0000],
  "Lasbela": [25.8500, 66.5500], "Sherani": [31.6833, 69.9333],
  // Azad Kashmir
  "Muzaffarabad": [34.3700, 73.4711], "Mirpur": [33.1476, 73.7519], "Kotli": [33.5156, 73.9019],
  "Bhimber": [32.9744, 74.0708], "Rawalakot": [33.8578, 73.7600], "Bagh": [33.9808, 73.7750],
  "Pallandri": [33.7167, 73.6833], "Hajira": [33.7667, 73.6000], "Sudhanoti": [33.7333, 73.7167],
  "Neelum": [34.5897, 73.9117], "Athmuqam": [34.5714, 73.8969], "Hattian Bala": [34.1711, 73.7397],
  // Gilgit-Baltistan
  "Gilgit": [35.9208, 74.3144], "Skardu": [35.2971, 75.6333], "Chilas": [35.4128, 74.0972],
  "Hunza": [36.3167, 74.6500], "Ghizer": [36.1500, 73.6333], "Astore": [35.3661, 74.8556],
  "Khaplu": [35.1500, 76.3333], "Shigar": [35.4333, 75.7333], "Diamer": [35.5167, 74.1000],
  "Nagar": [36.1000, 74.5833],
  // ICT
  "Islamabad": [33.6844, 73.0479],
  // Mingora is in Swat
  "Mingora": [34.7717, 72.3609],
};

interface ProviderMapProps {
  className?: string;
}

const ProviderMap = ({ className = "" }: ProviderMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { user } = useAuth();
  const { customerCity } = useCustomerCity();

  const { data: providers = [] } = useQuery({
    queryKey: ["providers-for-map", customerCity, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("service_providers")
        .select("id, business_name, location, rating, total_reviews, total_jobs, verified, avatar_url, latitude, longitude")
        .eq("is_active", true)
        .eq("verified", true);
      
      if (user && customerCity) {
        query = query.ilike("location", `%${customerCity}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = await import("leaflet");

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      // Default center: Pakistan
      const defaultCenter: [number, number] = [30.3753, 69.3451];
      const defaultZoom = 5;

      const map = L.map(mapRef.current!, {
        scrollWheelZoom: false,
        minZoom: 3,
        maxZoom: 18,
      }).setView(defaultCenter, defaultZoom);

      // Satellite view (worldwide)
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      }).addTo(map);

      // Labels overlay
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      const greenIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background: hsl(168, 80%, 35%); width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const markerPositions: [number, number][] = [];

      providers.forEach((provider: any) => {
        let lat: number | null = null;
        let lng: number | null = null;

        if (provider.latitude && provider.longitude) {
          lat = Number(provider.latitude);
          lng = Number(provider.longitude);
        } else if (provider.location) {
          const locationLower = provider.location.toLowerCase();
          for (const [city, coords] of Object.entries(cityCoordinates)) {
            if (locationLower.includes(city.toLowerCase())) {
              lat = coords[0] + (Math.random() - 0.5) * 0.02;
              lng = coords[1] + (Math.random() - 0.5) * 0.02;
              break;
            }
          }
        }

        if (lat && lng) {
          markerPositions.push([lat, lng]);
          const marker = L.marker([lat, lng], { icon: greenIcon }).addTo(map);
          marker.bindPopup(`
            <div style="min-width: 180px; font-family: 'DM Sans', sans-serif;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${provider.business_name}</div>
              <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">📍 ${provider.location || "Pakistan"}</div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                <span>⭐ ${Number(provider.rating || 0).toFixed(1)}</span>
                <span>• ${provider.total_jobs || 0} jobs</span>
                ${provider.verified ? '<span style="color: #0d9488;">✓ Verified</span>' : ""}
              </div>
              <a href="/provider/${provider.id}" style="display: inline-block; margin-top: 8px; padding: 4px 12px; background: hsl(168, 80%, 35%); color: white; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 500;">View Profile</a>
            </div>
          `);
        }
      });

      if (markerPositions.length > 0) {
        const bounds = L.latLngBounds(markerPositions);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [providers]);

  return (
    <div className={`rounded-2xl overflow-hidden border border-border shadow-card ${className}`}>
      <div ref={mapRef} className="h-[300px] sm:h-[400px] w-full" />
    </div>
  );
};

export default ProviderMap;
