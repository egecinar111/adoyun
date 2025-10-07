// AdMob toplu yardımcıları
// Not: Testte Google'ın DEMO ID'lerini kullanıyoruz. Yayına almadan kendi Unit ID'lerinle değiştir!
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents
} from '@capacitor-community/admob';

// Google'ın resmi test ilan ID'leri (Android):
// Banner:       ca-app-pub-3940256099942544/6300978111
// Interstitial: ca-app-pub-3940256099942544/1033173712
// Rewarded:     ca-app-pub-3940256099942544/5224354917
// (Geliştirme biterken kendi ID'lerinle değiştir.)  Kaynak: Google Devs. :contentReference[oaicite:1]{index=1}
const TEST = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTER: 'ca-app-pub-3940256099942544/1033173712',
  REWARD: 'ca-app-pub-3940256099942544/5224354917'
};

function onNative() {
  return !!window.Capacitor?.isNativePlatform?.();
}

export const ADS = {
  ready: false,

  async init() {
    if (!onNative()) return; // web'de atla
    try {
      // UMP / izin akışı (özet)
      await AdMob.initialize();
      const consent = await AdMob.requestConsentInfo();
      if (consent?.isConsentFormAvailable && !consent?.canRequestAds) {
        await AdMob.showConsentForm();
      }

      // Banner göster
      await AdMob.showBanner({
        adId: TEST.BANNER,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0
      });

      // Olay dinleyicileri (isteğe bağlı)
      AdMob.addListener(BannerAdPluginEvents.Loaded, () => console.log("banner loaded"));
      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (e) => console.warn("inter fail", e));
      AdMob.addListener(RewardAdPluginEvents.Rewarded, (r) => console.log("reward", r));

      this.ready = true;
    } catch (err) {
      console.warn("AdMob init error", err);
    }
  },

  async showInterstitial() {
    if (!this.ready) return;
    try {
      await AdMob.prepareInterstitial({ adId: TEST.INTER });
      await AdMob.showInterstitial();
    } catch (err) {
      console.warn("interstitial err", err);
    }
  },

  async showRewarded() {
    if (!this.ready) return false;
    try {
      await AdMob.prepareRewardVideoAd({ adId: TEST.REWARD });
      await AdMob.showRewardVideoAd();
      return true; // kullanıcı ödülü aldı
    } catch (err) {
      console.warn("reward err", err);
      return false;
    }
  }
};
