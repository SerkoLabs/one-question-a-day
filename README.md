# One Question a Day

## One-line promise
Her gün tek bir soruya cevap ver; zaman içinde düşüncelerinin, değerlerinin ve hayatındaki tekrar eden temaların nasıl değiştiğini gör.

## Problem
İnsanlar günlük yaşam içinde kendi düşünsel değişimlerini güvenilir biçimde izleyemiyor. Klasik günlüklar ise yüksek efor istiyor, düzenli kullanım zorlaşıyor ve aylar sonra yüzlerce dağınık not arasından anlamlı değişimleri görmek neredeyse imkânsız hale geliyor.

## Primary user
Kendini daha iyi tanımak, düşüncelerindeki değişimi görmek ve düzenli ama düşük eforlu bir öz-refleksiyon alışkanlığı kurmak isteyen yetişkin kullanıcı.

## Product concept
Uygulama kullanıcıya yerel takvim gününe göre yalnızca bir adet küratörlü soru gösterir. Kullanıcı kısa veya uzun bir metinle cevap verir. Cevaplar özel olarak saklanır. Zaman içinde uygulama cevaplardan nötr, teşhis koymayan temalar çıkarır ve aylık, 6 aylık ve yıllık raporlarda değişimi görünür hale getirir.

## Core loop
1. Kullanıcı günün tek sorusunu görür.
2. Cevabını yazar ve kaydeder.
3. Zaman geçtikçe geçmiş cevaplarını ve dönemsel analizlerini görür.
4. Uygulama eski cevaplarla bugünkü cevaplar arasındaki tekrarları ve değişimleri nötr biçimde yansıtır.

## MVP
- E-posta tabanlı hesap oluşturma / giriş.
- İlk kullanımda zaman dilimi, günlük hatırlatma tercihi ve AI analiz onayı.
- Küratörlü 365 soruluk soru bankası; her yerel takvim gününde yalnızca bir aktif soru.
- Metin tabanlı günlük cevap oluşturma, düzenleme ve geçmiş cevapları görüntüleme.
- Cezalandırıcı streak yerine yıl içindeki cevaplanan gün sayısı ve basit takvim görünümü.
- Aylık “Bu ay nasıldın?” raporu: tekrar eden temalar, değerler, ilişki/iş/gelecek gibi konu kümeleri, dikkat çekici değişimler ve kullanıcının kendi ifadelerinden kısa alıntılar.
- 6 aylık değişim raporu.
- 1 yıllık kişisel portre / karşılaştırmalı rapor.
- Uygun aralıklarla “Geçmişteki Sen” karşılaştırması: daha önce cevaplanan bir sorunun yeniden sorulması ve iki cevabın yan yana gösterilmesi.
- İsteğe bağlı yerel günlük bildirim.
- Verileri dışa aktarma ve hesabı/verileri silme.
- AI çıktılarında psikolojik teşhis, klinik risk skoru, tedavi önerisi veya kesin kişilik hükmü bulunmaması.

## Explicitly not in MVP
- Terapi, psikolojik teşhis veya klinik karar desteği.
- Serbest biçimli AI chatbot / terapist sohbeti.
- Sosyal ağ, arkadaş ekleme, takipçi, yorum veya herkese açık profil.
- Kullanıcı cevaplarını herkese açık paylaşma.
- Sesli günlük ve ses transkripsiyonu.
- Fotoğraf/video günlükları.
- Ağır gamification, ligler veya streak kaybı cezası.
- Ödeme/subscription sistemi.
- Yönetici paneli; ilk soru bankası migration/seed ile yönetilir.

## Differentiation
- Günlük eforu “tek soru” ile bilinçli olarak sınırlar.
- Değer önerisi günlük AI yorumu değil, zaman içindeki değişimin kanıtlarla görünür hale gelmesidir.
- Kullanıcının kendi cümlelerini ve dönemler arası karşılaştırmayı merkeze alır.
- Klinik iddialar yerine düşünsel ayna yaklaşımını korur.
- Kaçırılan günleri cezalandırmaz.

## Primary success metric
- Beta kullanıcılarının ilk 30 günde en az 12 farklı günde cevap verip ilk aylık anlamlı içgörü raporunu açma oranı.

## Secondary metrics
- İlk 7 günde en az 3 cevap verme oranı.
- 30 günlük cevaplanan gün medyanı.
- Aylık raporu açan uygun kullanıcı oranı.
- Aylık raporda en az bir “bana uyuyor / faydalıydı” geri bildirimi veren kullanıcı oranı.
- 90 günlük kullanıcı tutma oranı.

## Known constraints
- Mobil öncelikli ürün: Expo / React Native / TypeScript.
- Backend, Auth ve PostgreSQL: Supabase.
- AI çağrıları istemciden yapılmaz; güvenilir sunucu/Edge Function katmanından OpenAI API’ye gider.
- Kullanıcı günlükları ve onlardan türetilen analizler özel ve hassas kullanıcı verisidir.
- İlk beta Türkçe odaklıdır; veri ve UI mimarisi yerelleştirmeye hazır tutulur.
- Gün sınırı kullanıcının profilindeki IANA zaman dilimine göre hesaplanır.

## Key assumptions and risks
- Kullanıcılar günde tek soru formatını yeterince düşük eforlu bulacak.
- Anlamlı uzun dönem analiz için yeterli cevap yoğunluğuna ulaşmak zaman alır; raporlar düşük veri durumunda kesinlik iddiasında bulunmamalıdır.
- AI özetlerinin kullanıcıya ait olmayan çıkarımlar üretmesi temel ürün riskidir; kaynak cevaba dayalı, yapılandırılmış ve nötr çıktı gerekir.
- Günlük metinler yüksek mahremiyet taşıyabilir; RLS, veri minimizasyonu, hesap silme ve üçüncü taraf veri işleme açıklamaları kritik olacaktır.
- Bildirimler yardımcı olmalı, suçluluk/gamification baskısı yaratmamalıdır.

## Current status
Stage 02 product README complete. Planning lifecycle continues under `AGENTS.md` and `docs/AI_DEVELOPMENT_PLAYBOOK.md`.
