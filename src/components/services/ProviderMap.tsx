import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerCity } from "@/hooks/useCustomerCity";
import { useAuth } from "@/contexts/AuthContext";
import "leaflet/dist/leaflet.css";

// Pakistan city coordinates
const cityCoordinates: Record<string, [number, number]> = {
  "Lahore": [31.5204, 74.3587],
  "Karachi": [24.8607, 67.0011],
  "Islamabad": [33.6844, 73.0479],
  "Rawalpindi": [33.5651, 73.0169],
  "Faisalabad": [31.4504, 73.1350],
  "Multan": [30.1575, 71.5249],
  "Peshawar": [34.0151, 71.5249],
  "Quetta": [30.1798, 66.9750],
  "Sialkot": [32.4945, 74.5229],
  "Gujranwala": [32.1877, 74.1945],
  "Sahiwal": [30.6682, 73.1114],
  "Bahawalpur": [29.3956, 71.6836],
  "Sargodha": [32.0740, 72.6861],
  "Abbottabad": [34.1688, 73.2215],
  "Hyderabad": [25.3960, 68.3578],
  "Sukkur": [27.7052, 68.8574],
  "Mardan": [34.1986, 72.0404],
  "Mingora": [34.7717, 72.3609],
  "Okara": [30.8138, 73.4534],
  "Jhang": [31.2681, 72.3181],
  "Rahim Yar Khan": [28.4202, 70.2952],
  "Larkana": [27.5570, 68.2141],
  "Sheikhupura": [31.7131, 73.9857],
  "Kasur": [31.1186, 74.4503],
  "Dera Ghazi Khan": [30.0489, 70.6455],
  "Chiniot": [31.7167, 72.9781],
  "Mianwali": [32.5853, 71.5436],
  "Muzaffarabad": [34.3700, 73.4711],
  "Mirpur": [33.1476, 73.7519],
  "Gilgit": [35.9208, 74.3144],
  "Skardu": [35.2971, 75.6333],
  "Gwadar": [25.1264, 62.3225],
  "Turbat": [26.0031, 63.0544],
  "Nawabshah": [26.2483, 68.4100],
  "Khairpur": [27.5295, 68.7592],
  "Kohat": [33.5869, 71.4414],
  "Bannu": [32.9888, 70.6046],
  "Swat": [35.2227, 72.3526],
  "Chitral": [35.8518, 71.7864],
  "Hunza": [36.3167, 74.6500],
  "Hub": [25.0500, 66.8833],
  "Khuzdar": [27.8000, 66.6167],
  "Jhelum": [32.9425, 73.7257],
  "Attock": [33.7667, 72.3597],
  "Chakwal": [32.9328, 72.8558],
  "Vehari": [30.0452, 72.3489],
  "Khanewal": [30.3020, 71.9321],
  "Burewala": [30.1667, 72.1500],
  "Lodhran": [29.5333, 71.6333],
  "Toba Tek Singh": [30.9667, 72.4833],
  "Pakpattan": [30.3500, 73.3833],
};

// Pakistan bounding box
const PAKISTAN_BOUNDS: [[number, number], [number, number]] = [
  [23.5, 60.5], // SW corner
  [37.5, 77.5], // NE corner
];

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
      
      // Filter by customer's city when logged in
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

      // Fix default marker icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const bounds = L.latLngBounds(PAKISTAN_BOUNDS);

      const map = L.map(mapRef.current!, {
        scrollWheelZoom: false,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        minZoom: 5,
        maxZoom: 17,
      }).setView([30.3753, 69.3451], 5);

      // Satellite view
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
        bounds: bounds,
      }).addTo(map);

      // Labels overlay
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        bounds: bounds,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Provider marker icon
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

      // Fit bounds to providers or default to Pakistan
      const validProviders = providers.filter((p: any) => {
        if (p.latitude && p.longitude) return true;
        if (p.location) {
          return Object.keys(cityCoordinates).some(city =>
            p.location.toLowerCase().includes(city.toLowerCase())
          );
        }
        return false;
      });

      if (validProviders.length > 0) {
        const providerBounds = L.latLngBounds(
          validProviders.map((p: any) => {
            if (p.latitude && p.longitude) return [Number(p.latitude), Number(p.longitude)];
            const loc = p.location.toLowerCase();
            for (const [city, coords] of Object.entries(cityCoordinates)) {
              if (loc.includes(city.toLowerCase())) return coords;
            }
            return [30.3753, 69.3451];
          })
        );
        map.fitBounds(providerBounds, { padding: [50, 50], maxZoom: 12 });
      } else {
        map.fitBounds(bounds, { padding: [20, 20] });
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
