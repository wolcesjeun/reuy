import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY!
);

export async function analyzeImage(imageUrl: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // Görseli al
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Görsel alınamadı");
    }

    const imageBlob = await imageResponse.blob();

    // Base64'e çevir
    const base64data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Data URL'den base64 kısmını ayır
        const base64 = base64String.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

    // Prompt hazırla
    const prompt = `Görseldeki nesneyi analiz et ve aşağıdaki JSON formatında yanıt ver. Tüm alanlar zorunludur ve boş bırakılamaz:

{
  "nesne": {
    "isim": "Nesnenin tam adı",
    "kategori": "Elektronik/Plastik/Metal/Kağıt/Cam/Diğer"
  },
  "malzeme": {
    "ana_malzeme": "Ana malzeme türü",
    "bilesenler": ["Bileşen 1", "Bileşen 2"],
    "saflik_durumu": "TEK_MALZEME veya KARISIK"
  },
  "geri_donusum": {
    "uygunluk": "EVET veya HAYIR",
    "uygunluk_yuzdesi": 0-100 arası sayı,
    "kategori": "Plastik #1 PET/Kağıt/Metal/Cam vb.",
    "kutu_rengi": "MAVİ/YEŞİL/GRİ/SARI"
  },
  "prosedur": {
    "temizlik": ["Gerekli temizlik adımı 1", "Gerekli temizlik adımı 2"],
    "ayristirma": ["Gerekli ayrıştırma adımı 1", "Gerekli ayrıştırma adımı 2"]
  },
  "cevresel_etki": {
    "bozunma_suresi": "Yaklaşık süre (yıl)",
    "risk_seviyesi": "DUSUK/ORTA/YUKSEK",
    "co2_etkisi": "kg CO2/yıl"
  },
  "oneriler": {
    "yeniden_kullanim": ["Öneri 1", "Öneri 2"],
    "guvenlik_uyarilari": ["Uyarı 1", "Uyarı 2"]
  }
}

Lütfen tüm değerleri kesin ve net olarak belirt. Tahminlerden kaçın. JSON formatına kesinlikle uy ve tüm alanları doldur.`;

    // Analiz yap
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64data as string,
          mimeType: imageBlob.type,
        },
      },
    ]);

    const generatedResponse = await result.response;
    let jsonResponse;

    try {
      // API yanıtını temizle ve JSON'a çevir
      const responseText = generatedResponse.text().trim();
      console.log("API Yanıtı:", responseText); // Debug için

      // Eğer yanıt direkt JSON değilse, içindeki JSON'ı bulmaya çalış
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("API yanıtında JSON formatı bulunamadı");
      }

      jsonResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON ayrıştırma hatası:", parseError);
      throw new Error(
        "API yanıtı JSON formatına çevrilemedi. Lütfen tekrar deneyin."
      );
    }

    // JSON yanıtın gerekli tüm alanları içerdiğinden emin ol
    const requiredFields = [
      "nesne",
      "malzeme",
      "geri_donusum",
      "prosedur",
      "cevresel_etki",
      "oneriler",
    ];
    for (const field of requiredFields) {
      if (!jsonResponse[field]) {
        throw new Error(`API yanıtında '${field}' alanı eksik`);
      }
    }

    // Markdown formatına çevir
    return `${jsonResponse.nesne.isim}

## Malzeme Bilgisi
- **Ana Malzeme:** ${jsonResponse.malzeme.ana_malzeme}
- **Bileşenler:** ${jsonResponse.malzeme.bilesenler.join(", ")}
- **Saflık Durumu:** ${jsonResponse.malzeme.saflik_durumu}

## Geri Dönüşüm Durumu
- **Uygunluk:** ${jsonResponse.geri_donusum.uygunluk}
- **Uygunluk Yüzdesi:** %${jsonResponse.geri_donusum.uygunluk_yuzdesi}
- **Kategori:** ${jsonResponse.geri_donusum.kategori}
- **Atılacak Kutu:** ${
      jsonResponse.geri_donusum.kutu_rengi
    } renkli geri dönüşüm kutusu

## Geri Dönüşüm Prosedürü
### Temizlik Adımları:
${jsonResponse.prosedur.temizlik.map((adim: string) => `- ${adim}`).join("\n")}

### Ayrıştırma Adımları:
${jsonResponse.prosedur.ayristirma
  .map((adim: string) => `- ${adim}`)
  .join("\n")}

## Çevresel Etki
- **Doğada Bozunma Süresi:** ${jsonResponse.cevresel_etki.bozunma_suresi}
- **Çevresel Risk:** ${jsonResponse.cevresel_etki.risk_seviyesi}
- **CO2 Etkisi:** ${jsonResponse.cevresel_etki.co2_etkisi}

## Öneriler
### Yeniden Kullanım:
${jsonResponse.oneriler.yeniden_kullanim
  .map((oneri: string) => `- ${oneri}`)
  .join("\n")}

### Güvenlik Uyarıları:
${jsonResponse.oneriler.guvenlik_uyarilari
  .map((uyari: string) => `- ${uyari}`)
  .join("\n")}
`;
  } catch (error: any) {
    console.error("Görsel analiz hatası:", error);
    throw new Error(`Görsel analiz hatası: ${error.message}`);
  }
}
