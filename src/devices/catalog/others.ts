import type { DeviceInput } from "@/schemas/device";

/**
 * Every other brand: Xiaomi (incl. Redmi and POCO), OnePlus, Motorola, Huawei,
 * Nothing, OPPO, vivo, realme, Infinix, Tecno, itel, Microsoft and Amazon.
 * Sizes are CSS viewport pixels in portrait; most are derived from the panel
 * resolution and typical Android density, so they are marked `approx`.
 */
export const otherDevices: DeviceInput[] = [
  // Xiaomi
  { id: "xiaomi-15", name: "Xiaomi 15", brand: "Xiaomi", kind: "phone", year: 2024, platform: "android", osVersion: "15", screen: { width: 400, height: 890 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 9, color: "#2b2d31" }, approx: true },
  { id: "xiaomi-14", name: "Xiaomi 14", brand: "Xiaomi", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 400, height: 890 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 9, color: "#cfe0d6" }, approx: true },
  { id: "xiaomi-13", name: "Xiaomi 13", brand: "Xiaomi", kind: "phone", year: 2022, platform: "android", osVersion: "14", screen: { width: 393, height: 873 }, dpr: 2.75, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 10, color: "#e8e6e1" }, approx: true },
  { id: "redmi-note-14", name: "Redmi Note 14", brand: "Xiaomi", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 393, height: 873 }, dpr: 2.75, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 12, color: "#6b8f7a" }, approx: true },
  { id: "redmi-note-13", name: "Redmi Note 13", brand: "Xiaomi", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 393, height: 873 }, dpr: 2.75, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 12, color: "#9cc0dd" }, approx: true },
  { id: "redmi-note-12", name: "Redmi Note 12", brand: "Xiaomi", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 393, height: 873 }, dpr: 2.75, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 12, color: "#2f3c4d" }, approx: true },
  { id: "redmi-note-11", name: "Redmi Note 11", brand: "Xiaomi", kind: "phone", year: 2022, platform: "android", osVersion: "13", screen: { width: 393, height: 873 }, dpr: 2.75, frame: { cutout: "punch-hole-center", screenRadius: 24, bezel: 12, color: "#3b4e7a" }, approx: true },
  { id: "redmi-13c", name: "Redmi 13C", brand: "Xiaomi", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 412, height: 914 }, dpr: 1.75, frame: { cutout: "waterdrop", screenRadius: 22, bezel: 14, color: "#4a6a8a" }, approx: true },
  { id: "redmi-a3", name: "Redmi A3", brand: "Xiaomi", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 943 }, dpr: 1.75, frame: { cutout: "waterdrop", screenRadius: 22, bezel: 14, color: "#2a5c4f" }, approx: true },
  { id: "poco-f6", name: "POCO F6", brand: "Xiaomi", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 407, height: 904 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 10, color: "#1f2124" }, approx: true },
  { id: "poco-x6-pro", name: "POCO X6 Pro", brand: "Xiaomi", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 407, height: 904 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 10, color: "#e0b100" }, approx: true },
  { id: "poco-x5-pro", name: "POCO X5 Pro", brand: "Xiaomi", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 393, height: 873 }, dpr: 2.75, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 11, color: "#3c6fb0" }, approx: true },
  { id: "xiaomi-pad-6", name: "Xiaomi Pad 6", brand: "Xiaomi", kind: "tablet", year: 2023, platform: "android", osVersion: "14", screen: { width: 800, height: 1280 }, dpr: 2.25, frame: { cutout: "none", screenRadius: 16, bezel: 24, color: "#9fb1c4" }, approx: true },

  // OnePlus
  { id: "oneplus-13", name: "OnePlus 13", brand: "OnePlus", kind: "phone", year: 2025, platform: "android", osVersion: "15", screen: { width: 412, height: 905 }, dpr: 3.5, frame: { cutout: "punch-hole-left", screenRadius: 30, bezel: 9, color: "#2a3b52" }, approx: true },
  { id: "oneplus-12", name: "OnePlus 12", brand: "OnePlus", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 905 }, dpr: 3.5, frame: { cutout: "punch-hole-left", screenRadius: 30, bezel: 9, color: "#3f7d64" }, approx: true },
  { id: "oneplus-11", name: "OnePlus 11", brand: "OnePlus", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 412, height: 919 }, dpr: 3.5, frame: { cutout: "punch-hole-left", screenRadius: 30, bezel: 9, color: "#2c2d30" }, approx: true },
  { id: "oneplus-nord-4", name: "OnePlus Nord 4", brand: "OnePlus", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 924 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 10, color: "#9ab0a1" }, approx: true },
  { id: "oneplus-nord-ce-4", name: "OnePlus Nord CE 4", brand: "OnePlus", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 919 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 11, color: "#5b6e5f" }, approx: true },
  { id: "oneplus-nord-ce-3-lite", name: "OnePlus Nord CE 3 Lite", brand: "OnePlus", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 412, height: 914 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 12, color: "#c7e36b" }, approx: true },
  { id: "oneplus-9", name: "OnePlus 9", brand: "OnePlus", kind: "phone", year: 2021, platform: "android", osVersion: "14", screen: { width: 412, height: 914 }, dpr: 2.625, frame: { cutout: "punch-hole-left", screenRadius: 26, bezel: 10, color: "#a9b8d6" }, approx: true },

  // Motorola
  { id: "moto-edge-50-pro", name: "Motorola Edge 50 Pro", brand: "Motorola", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 915 }, dpr: 2.96, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 9, color: "#6a5a8e" }, approx: true },
  { id: "moto-edge-40", name: "Motorola Edge 40", brand: "Motorola", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 412, height: 915 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 9, color: "#3a4d5c" }, approx: true },
  { id: "moto-g84", name: "Moto G84", brand: "Motorola", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 412, height: 915 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 12, color: "#d64f5c" }, approx: true },
  { id: "moto-g54", name: "Moto G54", brand: "Motorola", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 412, height: 915 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 24, bezel: 13, color: "#2c4a66" }, approx: true },
  { id: "moto-g-power-2022", name: "Moto G Power (2022)", brand: "Motorola", kind: "phone", year: 2022, platform: "android", osVersion: "12", screen: { width: 412, height: 823 }, dpr: 1.75, frame: { cutout: "punch-hole-center", screenRadius: 22, bezel: 14, color: "#2e3440" } },
  { id: "moto-g4", name: "Moto G4", brand: "Motorola", kind: "phone", year: 2016, platform: "android", osVersion: "7", screen: { width: 360, height: 640 }, dpr: 3, frame: { cutout: "none", screenRadius: 4, bezel: 24, color: "#1d1d1f" } },

  // Huawei
  { id: "huawei-p40-pro", name: "Huawei P40 Pro", brand: "Huawei", kind: "phone", year: 2020, platform: "android", osVersion: "10", screen: { width: 400, height: 880 }, dpr: 3, frame: { cutout: "punch-hole-left", screenRadius: 26, bezel: 8, color: "#c9d6e3" }, approx: true },
  { id: "huawei-p30-pro", name: "Huawei P30 Pro", brand: "Huawei", kind: "phone", year: 2019, platform: "android", osVersion: "10", screen: { width: 360, height: 780 }, dpr: 3, frame: { cutout: "waterdrop", screenRadius: 24, bezel: 9, color: "#6fa3c9" }, approx: true },
  { id: "huawei-mate-20-pro", name: "Huawei Mate 20 Pro", brand: "Huawei", kind: "phone", year: 2018, platform: "android", osVersion: "10", screen: { width: 360, height: 780 }, dpr: 4, frame: { cutout: "notch", screenRadius: 24, bezel: 9, color: "#2f5e4e" }, approx: true },
  { id: "huawei-matepad-11", name: "Huawei MatePad 11", brand: "Huawei", kind: "tablet", year: 2021, platform: "android", osVersion: "10", screen: { width: 800, height: 1280 }, dpr: 2, frame: { cutout: "none", screenRadius: 16, bezel: 24, color: "#3a3b3f" }, approx: true },

  // Nothing
  { id: "nothing-phone-3", name: "Nothing Phone (3)", brand: "Nothing", kind: "phone", year: 2025, platform: "android", osVersion: "15", screen: { width: 412, height: 915 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 10, color: "#e9e9e7" }, approx: true },
  { id: "nothing-phone-3a", name: "Nothing Phone (3a)", brand: "Nothing", kind: "phone", year: 2025, platform: "android", osVersion: "15", screen: { width: 412, height: 912 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 11, color: "#1e1e1e" }, approx: true },
  { id: "nothing-phone-2a", name: "Nothing Phone (2a)", brand: "Nothing", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 919 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 11, color: "#f0efeb" }, approx: true },
  { id: "cmf-phone-1", name: "CMF Phone 1", brand: "Nothing", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 915 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 12, color: "#f07c2a" }, approx: true },
  { id: "nothing-phone-2", name: "Nothing Phone (2)", brand: "Nothing", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 412, height: 919 }, dpr: 2.625, frame: { cutout: "punch-hole-left", screenRadius: 30, bezel: 10, color: "#d9d9d6" }, approx: true },
  { id: "nothing-phone-1", name: "Nothing Phone (1)", brand: "Nothing", kind: "phone", year: 2022, platform: "android", osVersion: "14", screen: { width: 412, height: 915 }, dpr: 2.625, frame: { cutout: "punch-hole-left", screenRadius: 28, bezel: 10, color: "#232323" }, approx: true },

  // OPPO, vivo, realme
  { id: "oppo-reno-12", name: "OPPO Reno12", brand: "OPPO", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 919 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 10, color: "#bfa6d9" }, approx: true },
  { id: "vivo-v30", name: "vivo V30", brand: "vivo", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 915 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 10, color: "#4f8fbf" }, approx: true },
  { id: "realme-12-pro", name: "realme 12 Pro", brand: "realme", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 919 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 10, color: "#2a3f6b" }, approx: true },

  // Infinix, Tecno, itel
  { id: "infinix-note-40-pro", name: "Infinix Note 40 Pro", brand: "Infinix", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 928 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 10, color: "#3c5a4a" }, approx: true },
  { id: "infinix-hot-40i", name: "Infinix Hot 40i", brand: "Infinix", kind: "phone", year: 2023, platform: "android", osVersion: "13", screen: { width: 412, height: 923 }, dpr: 1.75, frame: { cutout: "punch-hole-center", screenRadius: 24, bezel: 13, color: "#7fb9d6" }, approx: true },
  { id: "infinix-hot-30", name: "Infinix Hot 30", brand: "Infinix", kind: "phone", year: 2023, platform: "android", osVersion: "13", screen: { width: 412, height: 937 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 24, bezel: 13, color: "#2c2f36" }, approx: true },
  { id: "infinix-note-30", name: "Infinix Note 30", brand: "Infinix", kind: "phone", year: 2023, platform: "android", osVersion: "13", screen: { width: 412, height: 937 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 12, color: "#8fc6a5" }, approx: true },
  { id: "infinix-smart-8", name: "Infinix Smart 8", brand: "Infinix", kind: "phone", year: 2023, platform: "android", osVersion: "13", screen: { width: 412, height: 921 }, dpr: 1.75, frame: { cutout: "waterdrop", screenRadius: 22, bezel: 14, color: "#d8c39a" }, approx: true },
  { id: "tecno-pova-6-pro", name: "Tecno Pova 6 Pro", brand: "Tecno", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 928 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 10, color: "#3a3d44" }, approx: true },
  { id: "tecno-spark-20", name: "Tecno Spark 20", brand: "Tecno", kind: "phone", year: 2023, platform: "android", osVersion: "13", screen: { width: 412, height: 921 }, dpr: 1.75, frame: { cutout: "punch-hole-center", screenRadius: 24, bezel: 13, color: "#e3d9c3" }, approx: true },
  { id: "tecno-camon-20", name: "Tecno Camon 20", brand: "Tecno", kind: "phone", year: 2023, platform: "android", osVersion: "13", screen: { width: 412, height: 915 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 11, color: "#4a6d5c" }, approx: true },
  { id: "tecno-spark-10", name: "Tecno Spark 10", brand: "Tecno", kind: "phone", year: 2023, platform: "android", osVersion: "13", screen: { width: 412, height: 921 }, dpr: 1.75, frame: { cutout: "waterdrop", screenRadius: 22, bezel: 14, color: "#7a9fd0" }, approx: true },
  { id: "itel-a70", name: "itel A70", brand: "itel", kind: "phone", year: 2023, platform: "android", osVersion: "13", screen: { width: 412, height: 921 }, dpr: 1.75, frame: { cutout: "waterdrop", screenRadius: 22, bezel: 15, color: "#3e5a7a" }, approx: true },

  // Microsoft
  { id: "surface-duo-2", name: "Surface Duo 2", brand: "Microsoft", kind: "foldable", year: 2021, platform: "android", osVersion: "12", screen: { width: 540, height: 757 }, dpr: 2.5, frame: { cutout: "none", screenRadius: 10, bezel: 20, color: "#e9e9eb" }, approx: true },
  { id: "surface-duo", name: "Surface Duo", brand: "Microsoft", kind: "foldable", year: 2020, platform: "android", osVersion: "11", screen: { width: 540, height: 720 }, dpr: 2.5, frame: { cutout: "none", screenRadius: 6, bezel: 24, color: "#e9e9eb" } },

  // Amazon
  { id: "fire-hd-10", name: "Fire HD 10", brand: "Amazon", kind: "tablet", year: 2023, platform: "android", osVersion: "11", screen: { width: 800, height: 1280 }, dpr: 1.5, frame: { cutout: "none", screenRadius: 12, bezel: 30, color: "#1f1f21" }, approx: true },
  { id: "fire-7", name: "Fire 7", brand: "Amazon", kind: "tablet", year: 2022, platform: "android", osVersion: "11", screen: { width: 600, height: 1024 }, dpr: 1, frame: { cutout: "none", screenRadius: 10, bezel: 32, color: "#1f1f21" }, approx: true },
  { id: "kindle-fire-hdx", name: "Kindle Fire HDX", brand: "Amazon", kind: "tablet", year: 2013, platform: "android", osVersion: "4.4", screen: { width: 800, height: 1280 }, dpr: 2, frame: { cutout: "none", screenRadius: 6, bezel: 36, color: "#1f1f21" } },
];
