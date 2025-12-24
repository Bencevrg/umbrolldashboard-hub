import { useState, useCallback } from 'react';
import { Partner } from '@/types/partner';
import { mockPartners } from '@/data/mockPartners';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://n8nlocal.benceaiproject.uk/webhook/42275bdc-cab0-46a4-83be-989d0f937d52';

export const usePartnerData = () => {
  const [partners, setPartners] = useState<Partner[]>(mockPartners);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getPartners' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP hiba: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      let partnersData = Array.isArray(data) ? data : data.partners || data.data || [];
      
      // Normalize field names (handle both underscore and original naming)
      partnersData = partnersData.map((p: Record<string, unknown>) => ({
        partner: p.partner || '',
        osszes_arajanlat: Number(p.osszes_arajanlat ?? p['összes_árajánlat'] ?? 0),
        sikeres_arajanlatok: Number(p.sikeres_arajanlatok ?? p['sikeres_árajánlatok'] ?? 0),
        sikertelen_arajanlatok: Number(p.sikertelen_arajanlatok ?? p['sikertelen_árajánlatok'] ?? 0),
        sikeressegi_arany: Number(p.sikeressegi_arany ?? p['sikerességi_arány'] ?? 0),
        legutobbi_sikeres_datum: p.legutobbi_sikeres_datum ?? p['legutóbbi_sikeres_dátum'] ?? null,
        legutobbi_arajanlat_datum: p.legutobbi_arajanlat_datum ?? p['legutóbbi_árajánlat_dátum'] ?? null,
        napok_a_legutobbi_arajanlat_ota: Number(p.napok_a_legutobbi_arajanlat_ota ?? p['napok_a_legutóbbi_árajánlat_óta'] ?? 0),
        alvo: p.alvo === true || p.alvo === 'igaz' || p['alvó(igaz/hamis)'] === 'igaz' || p['alvó(igaz/hamis)'] === true,
        letrehozva: p.letrehozva ?? p['létrehozva'] ?? '',
        korrigalt_sikeressegi_arany: Number(p.korrigalt_sikeressegi_arany ?? p['korrigált_sikerességi_arány'] ?? 0),
        ertek_pontszam: Number(p.ertek_pontszam ?? p['érték_pontszám'] ?? 0),
        kategoria: (p.kategoria ?? p['kategória'] ?? 'D') as 'A' | 'B' | 'C' | 'D',
        sikertelen_pontszam: Number(p.sikertelen_pontszam ?? p['sikertelen_pontszám'] ?? 0),
      }));
      
      if (partnersData.length > 0) {
        setPartners(partnersData);
        toast({
          title: 'Sikeres frissítés',
          description: `${partnersData.length} partner adat betöltve.`,
        });
      } else {
        toast({
          title: 'Nincs adat',
          description: 'A webhook nem küldött partner adatokat.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Webhook hiba:', error);
      toast({
        title: 'Hiba történt',
        description: 'Nem sikerült lekérni az adatokat a webhookból.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    partners,
    isLoading,
    fetchPartners,
  };
};
