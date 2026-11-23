import type { DeviceInput } from "@/schemas/device";

/**
 * Apple iPhones and iPads. Sizes are CSS viewport pixels in portrait.
 * iPadOS Safari presents itself as a Mac, which the User-Agent builder handles
 * from `platform: "ipados"`.
 */
export const appleDevices: DeviceInput[] = [
  // iPhone 17 family (2025)
  { id: "iphone-17-pro-max", name: "iPhone 17 Pro Max", brand: "Apple", kind: "phone", year: 2025, platform: "ios", osVersion: "26.0", screen: { width: 440, height: 956 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 62, bezel: 10, color: "#d9773b" } },
  { id: "iphone-17-pro", name: "iPhone 17 Pro", brand: "Apple", kind: "phone", year: 2025, platform: "ios", osVersion: "26.0", screen: { width: 402, height: 874 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 62, bezel: 10, color: "#34435c" } },
  { id: "iphone-air", name: "iPhone Air", brand: "Apple", kind: "phone", year: 2025, platform: "ios", osVersion: "26.0", screen: { width: 420, height: 912 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 62, bezel: 9, color: "#dcdad5" } },
  { id: "iphone-17", name: "iPhone 17", brand: "Apple", kind: "phone", year: 2025, platform: "ios", osVersion: "26.0", screen: { width: 402, height: 874 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 62, bezel: 10, color: "#b4a3c8" } },
  { id: "iphone-16e", name: "iPhone 16e", brand: "Apple", kind: "phone", year: 2025, platform: "ios", osVersion: "18.3", screen: { width: 390, height: 844 }, dpr: 3, frame: { cutout: "notch", screenRadius: 47, bezel: 12, color: "#1f1f21" } },

  // iPhone 16 family (2024)
  { id: "iphone-16-pro-max", name: "iPhone 16 Pro Max", brand: "Apple", kind: "phone", year: 2024, platform: "ios", osVersion: "18.0", screen: { width: 440, height: 956 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 62, bezel: 10, color: "#bfae98" } },
  { id: "iphone-16-pro", name: "iPhone 16 Pro", brand: "Apple", kind: "phone", year: 2024, platform: "ios", osVersion: "18.0", screen: { width: 402, height: 874 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 62, bezel: 10, color: "#8f8a81" } },
  { id: "iphone-16-plus", name: "iPhone 16 Plus", brand: "Apple", kind: "phone", year: 2024, platform: "ios", osVersion: "18.0", screen: { width: 430, height: 932 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 55, bezel: 11, color: "#7d97cf" } },
  { id: "iphone-16", name: "iPhone 16", brand: "Apple", kind: "phone", year: 2024, platform: "ios", osVersion: "18.0", screen: { width: 393, height: 852 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 55, bezel: 11, color: "#8bb5a5" } },

  // iPhone 15 family (2023)
  { id: "iphone-15-pro-max", name: "iPhone 15 Pro Max", brand: "Apple", kind: "phone", year: 2023, platform: "ios", osVersion: "18.0", screen: { width: 430, height: 932 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 55, bezel: 11, color: "#3b3f4a" } },
  { id: "iphone-15-pro", name: "iPhone 15 Pro", brand: "Apple", kind: "phone", year: 2023, platform: "ios", osVersion: "18.0", screen: { width: 393, height: 852 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 55, bezel: 11, color: "#8d8a85" } },
  { id: "iphone-15-plus", name: "iPhone 15 Plus", brand: "Apple", kind: "phone", year: 2023, platform: "ios", osVersion: "18.0", screen: { width: 430, height: 932 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 55, bezel: 11, color: "#eecfd2" } },
  { id: "iphone-15", name: "iPhone 15", brand: "Apple", kind: "phone", year: 2023, platform: "ios", osVersion: "18.0", screen: { width: 393, height: 852 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 55, bezel: 11, color: "#cfdfd0" } },

  // iPhone 14 family (2022)
  { id: "iphone-14-pro-max", name: "iPhone 14 Pro Max", brand: "Apple", kind: "phone", year: 2022, platform: "ios", osVersion: "18.0", screen: { width: 430, height: 932 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 55, bezel: 11, color: "#544c61" } },
  { id: "iphone-14-pro", name: "iPhone 14 Pro", brand: "Apple", kind: "phone", year: 2022, platform: "ios", osVersion: "18.0", screen: { width: 393, height: 852 }, dpr: 3, frame: { cutout: "dynamic-island", screenRadius: 55, bezel: 11, color: "#2f2e33" } },
  { id: "iphone-14-plus", name: "iPhone 14 Plus", brand: "Apple", kind: "phone", year: 2022, platform: "ios", osVersion: "18.0", screen: { width: 428, height: 926 }, dpr: 3, frame: { cutout: "notch", screenRadius: 47, bezel: 12, color: "#a6bdd4" } },
  { id: "iphone-14", name: "iPhone 14", brand: "Apple", kind: "phone", year: 2022, platform: "ios", osVersion: "18.0", screen: { width: 390, height: 844 }, dpr: 3, frame: { cutout: "notch", screenRadius: 47, bezel: 12, color: "#c5b8d4" } },
  { id: "iphone-se-3", name: "iPhone SE (3rd gen)", brand: "Apple", kind: "phone", year: 2022, platform: "ios", osVersion: "18.0", screen: { width: 375, height: 667 }, dpr: 2, frame: { cutout: "home-button", screenRadius: 0, bezel: 18, color: "#1c1c1e" } },

  // iPhone 13 family (2021)
  { id: "iphone-13-pro-max", name: "iPhone 13 Pro Max", brand: "Apple", kind: "phone", year: 2021, platform: "ios", osVersion: "18.0", screen: { width: 428, height: 926 }, dpr: 3, frame: { cutout: "notch", screenRadius: 47, bezel: 12, color: "#a5bfcf" } },
  { id: "iphone-13-pro", name: "iPhone 13 Pro", brand: "Apple", kind: "phone", year: 2021, platform: "ios", osVersion: "18.0", screen: { width: 390, height: 844 }, dpr: 3, frame: { cutout: "notch", screenRadius: 47, bezel: 12, color: "#56695a" } },
  { id: "iphone-13", name: "iPhone 13", brand: "Apple", kind: "phone", year: 2021, platform: "ios", osVersion: "18.0", screen: { width: 390, height: 844 }, dpr: 3, frame: { cutout: "notch", screenRadius: 47, bezel: 12, color: "#28354a" } },
  { id: "iphone-13-mini", name: "iPhone 13 mini", brand: "Apple", kind: "phone", year: 2021, platform: "ios", osVersion: "18.0", screen: { width: 375, height: 812 }, dpr: 3, frame: { cutout: "notch", screenRadius: 44, bezel: 12, color: "#efcdcc" } },

  // iPhone 12 family (2020)
  { id: "iphone-12-pro-max", name: "iPhone 12 Pro Max", brand: "Apple", kind: "phone", year: 2020, platform: "ios", osVersion: "18.0", screen: { width: 428, height: 926 }, dpr: 3, frame: { cutout: "notch", screenRadius: 47, bezel: 12, color: "#384b5f" } },
  { id: "iphone-12-pro", name: "iPhone 12 Pro", brand: "Apple", kind: "phone", year: 2020, platform: "ios", osVersion: "18.0", screen: { width: 390, height: 844 }, dpr: 3, frame: { cutout: "notch", screenRadius: 47, bezel: 12, color: "#e3ddd2" } },
  { id: "iphone-12", name: "iPhone 12", brand: "Apple", kind: "phone", year: 2020, platform: "ios", osVersion: "18.0", screen: { width: 390, height: 844 }, dpr: 3, frame: { cutout: "notch", screenRadius: 47, bezel: 12, color: "#2b4a6f" } },
  { id: "iphone-12-mini", name: "iPhone 12 mini", brand: "Apple", kind: "phone", year: 2020, platform: "ios", osVersion: "18.0", screen: { width: 375, height: 812 }, dpr: 3, frame: { cutout: "notch", screenRadius: 44, bezel: 12, color: "#e4e4e4" } },
  { id: "iphone-se-2", name: "iPhone SE (2nd gen)", brand: "Apple", kind: "phone", year: 2020, platform: "ios", osVersion: "18.0", screen: { width: 375, height: 667 }, dpr: 2, frame: { cutout: "home-button", screenRadius: 0, bezel: 18, color: "#1c1c1e" } },

  // iPhone 11 / X generation (2017–2019)
  { id: "iphone-11-pro-max", name: "iPhone 11 Pro Max", brand: "Apple", kind: "phone", year: 2019, platform: "ios", osVersion: "18.0", screen: { width: 414, height: 896 }, dpr: 3, frame: { cutout: "notch", screenRadius: 39, bezel: 13, color: "#4a5a4c" } },
  { id: "iphone-11-pro", name: "iPhone 11 Pro", brand: "Apple", kind: "phone", year: 2019, platform: "ios", osVersion: "18.0", screen: { width: 375, height: 812 }, dpr: 3, frame: { cutout: "notch", screenRadius: 39, bezel: 13, color: "#e2cfb0" } },
  { id: "iphone-11", name: "iPhone 11", brand: "Apple", kind: "phone", year: 2019, platform: "ios", osVersion: "18.0", screen: { width: 414, height: 896 }, dpr: 2, frame: { cutout: "notch", screenRadius: 41, bezel: 15, color: "#b6a6d0" } },
  { id: "iphone-xs-max", name: "iPhone XS Max", brand: "Apple", kind: "phone", year: 2018, platform: "ios", osVersion: "18.0", screen: { width: 414, height: 896 }, dpr: 3, frame: { cutout: "notch", screenRadius: 39, bezel: 13, color: "#e0c6a0" } },
  { id: "iphone-xs", name: "iPhone XS", brand: "Apple", kind: "phone", year: 2018, platform: "ios", osVersion: "18.0", screen: { width: 375, height: 812 }, dpr: 3, frame: { cutout: "notch", screenRadius: 39, bezel: 13, color: "#2b2b2d" } },
  { id: "iphone-xr", name: "iPhone XR", brand: "Apple", kind: "phone", year: 2018, platform: "ios", osVersion: "18.0", screen: { width: 414, height: 896 }, dpr: 2, frame: { cutout: "notch", screenRadius: 41, bezel: 15, color: "#b3242a" } },
  { id: "iphone-x", name: "iPhone X", brand: "Apple", kind: "phone", year: 2017, platform: "ios", osVersion: "16.7", screen: { width: 375, height: 812 }, dpr: 3, frame: { cutout: "notch", screenRadius: 39, bezel: 13, color: "#2b2b2d" } },

  // Home-button iPhones
  { id: "iphone-8-plus", name: "iPhone 8 Plus", brand: "Apple", kind: "phone", year: 2017, platform: "ios", osVersion: "16.7", screen: { width: 414, height: 736 }, dpr: 3, frame: { cutout: "home-button", screenRadius: 0, bezel: 20, color: "#f1efeb" } },
  { id: "iphone-8", name: "iPhone 8", brand: "Apple", kind: "phone", year: 2017, platform: "ios", osVersion: "16.7", screen: { width: 375, height: 667 }, dpr: 2, frame: { cutout: "home-button", screenRadius: 0, bezel: 18, color: "#f1efeb" } },
  { id: "iphone-7-plus", name: "iPhone 7 Plus", brand: "Apple", kind: "phone", year: 2016, platform: "ios", osVersion: "15.8", screen: { width: 414, height: 736 }, dpr: 3, frame: { cutout: "home-button", screenRadius: 0, bezel: 20, color: "#1c1c1e" } },
  { id: "iphone-7", name: "iPhone 7", brand: "Apple", kind: "phone", year: 2016, platform: "ios", osVersion: "15.8", screen: { width: 375, height: 667 }, dpr: 2, frame: { cutout: "home-button", screenRadius: 0, bezel: 18, color: "#1c1c1e" } },
  { id: "iphone-se-1", name: "iPhone SE (1st gen)", brand: "Apple", kind: "phone", year: 2016, platform: "ios", osVersion: "15.8", screen: { width: 320, height: 568 }, dpr: 2, frame: { cutout: "home-button", screenRadius: 0, bezel: 16, color: "#f1efeb" } },

  // iPad Pro
  { id: "ipad-pro-13-m5", name: "iPad Pro 13\" (M5)", brand: "Apple", kind: "tablet", year: 2025, platform: "ipados", osVersion: "26.0", screen: { width: 1032, height: 1376 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 20, color: "#2c2c2e" }, approx: true },
  { id: "ipad-pro-11-m5", name: "iPad Pro 11\" (M5)", brand: "Apple", kind: "tablet", year: 2025, platform: "ipados", osVersion: "26.0", screen: { width: 834, height: 1210 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 20, color: "#c9c9cb" }, approx: true },
  { id: "ipad-pro-13-m4", name: "iPad Pro 13\" (M4)", brand: "Apple", kind: "tablet", year: 2024, platform: "ipados", osVersion: "18.0", screen: { width: 1032, height: 1376 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 20, color: "#2c2c2e" } },
  { id: "ipad-pro-11-m4", name: "iPad Pro 11\" (M4)", brand: "Apple", kind: "tablet", year: 2024, platform: "ipados", osVersion: "18.0", screen: { width: 834, height: 1210 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 20, color: "#c9c9cb" } },
  { id: "ipad-pro-12-9", name: "iPad Pro 12.9\"", brand: "Apple", kind: "tablet", year: 2022, platform: "ipados", osVersion: "18.0", screen: { width: 1024, height: 1366 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 24, color: "#3a3a3c" } },
  { id: "ipad-pro-11", name: "iPad Pro 11\"", brand: "Apple", kind: "tablet", year: 2022, platform: "ipados", osVersion: "18.0", screen: { width: 834, height: 1194 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 24, color: "#c9c9cb" } },
  { id: "ipad-pro-10-5", name: "iPad Pro 10.5\"", brand: "Apple", kind: "tablet", year: 2017, platform: "ipados", osVersion: "17.0", screen: { width: 834, height: 1112 }, dpr: 2, frame: { cutout: "home-button", screenRadius: 0, bezel: 34, color: "#1c1c1e" } },

  // iPad Air
  { id: "ipad-air-13-m3", name: "iPad Air 13\" (M3)", brand: "Apple", kind: "tablet", year: 2025, platform: "ipados", osVersion: "18.3", screen: { width: 1024, height: 1366 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 24, color: "#a7a2c2" } },
  { id: "ipad-air-11-m3", name: "iPad Air 11\" (M3)", brand: "Apple", kind: "tablet", year: 2025, platform: "ipados", osVersion: "18.3", screen: { width: 820, height: 1180 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 24, color: "#9bb3cf" } },
  { id: "ipad-air-13-m2", name: "iPad Air 13\" (M2)", brand: "Apple", kind: "tablet", year: 2024, platform: "ipados", osVersion: "18.0", screen: { width: 1024, height: 1366 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 24, color: "#3a3a3c" } },
  { id: "ipad-air-11-m2", name: "iPad Air 11\" (M2)", brand: "Apple", kind: "tablet", year: 2024, platform: "ipados", osVersion: "18.0", screen: { width: 820, height: 1180 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 24, color: "#e6dcc8" } },
  { id: "ipad-air-5", name: "iPad Air (5th gen)", brand: "Apple", kind: "tablet", year: 2022, platform: "ipados", osVersion: "18.0", screen: { width: 820, height: 1180 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 24, color: "#8fa6c6" } },

  // iPad and iPad mini
  { id: "ipad-a16", name: "iPad (A16)", brand: "Apple", kind: "tablet", year: 2025, platform: "ipados", osVersion: "18.3", screen: { width: 820, height: 1180 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 26, color: "#e9d36f" } },
  { id: "ipad-10", name: "iPad (10th gen)", brand: "Apple", kind: "tablet", year: 2022, platform: "ipados", osVersion: "18.0", screen: { width: 820, height: 1180 }, dpr: 2, frame: { cutout: "none", screenRadius: 18, bezel: 26, color: "#7aa3c9" } },
  { id: "ipad-9", name: "iPad 10.2\" (9th gen)", brand: "Apple", kind: "tablet", year: 2021, platform: "ipados", osVersion: "18.0", screen: { width: 810, height: 1080 }, dpr: 2, frame: { cutout: "home-button", screenRadius: 0, bezel: 40, color: "#1c1c1e" } },
  { id: "ipad-mini-a17-pro", name: "iPad mini (A17 Pro)", brand: "Apple", kind: "tablet", year: 2024, platform: "ipados", osVersion: "18.0", screen: { width: 744, height: 1133 }, dpr: 2, frame: { cutout: "none", screenRadius: 21, bezel: 22, color: "#b8b2d4" } },
  { id: "ipad-mini-6", name: "iPad mini (6th gen)", brand: "Apple", kind: "tablet", year: 2021, platform: "ipados", osVersion: "18.0", screen: { width: 744, height: 1133 }, dpr: 2, frame: { cutout: "none", screenRadius: 21, bezel: 22, color: "#3a3a3c" } },
  { id: "ipad-mini-5", name: "iPad mini (5th gen)", brand: "Apple", kind: "tablet", year: 2019, platform: "ipados", osVersion: "18.0", screen: { width: 768, height: 1024 }, dpr: 2, frame: { cutout: "home-button", screenRadius: 0, bezel: 40, color: "#f1efeb" } },
];
