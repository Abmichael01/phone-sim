import type { DeviceInput } from "@/schemas/device";

/**
 * Samsung Galaxy phones, foldables and tablets. Sizes are CSS viewport pixels
 * in portrait at the default (FHD+/QHD+) display setting; models without a
 * widely published browser viewport are marked `approx`.
 */
export const samsungDevices: DeviceInput[] = [
  // Galaxy S25 (2025)
  { id: "galaxy-s25-ultra", name: "Galaxy S25 Ultra", brand: "Samsung", kind: "phone", year: 2025, platform: "android", osVersion: "15", screen: { width: 384, height: 832 }, dpr: 3.75, frame: { cutout: "punch-hole-center", screenRadius: 18, bezel: 9, color: "#3a3d42" }, approx: true },
  { id: "galaxy-s25-edge", name: "Galaxy S25 Edge", brand: "Samsung", kind: "phone", year: 2025, platform: "android", osVersion: "15", screen: { width: 384, height: 832 }, dpr: 3.75, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 9, color: "#a9adb3" }, approx: true },
  { id: "galaxy-s25-plus", name: "Galaxy S25+", brand: "Samsung", kind: "phone", year: 2025, platform: "android", osVersion: "15", screen: { width: 384, height: 832 }, dpr: 3.75, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 9, color: "#1f2836" }, approx: true },
  { id: "galaxy-s25", name: "Galaxy S25", brand: "Samsung", kind: "phone", year: 2025, platform: "android", osVersion: "15", screen: { width: 360, height: 780 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 9, color: "#c7d2e0" }, approx: true },

  // Galaxy S24 (2024)
  { id: "galaxy-s24-ultra", name: "Galaxy S24 Ultra", brand: "Samsung", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 384, height: 832 }, dpr: 3.75, frame: { cutout: "punch-hole-center", screenRadius: 16, bezel: 9, color: "#4a4a4e" }, approx: true },
  { id: "galaxy-s24-plus", name: "Galaxy S24+", brand: "Samsung", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 384, height: 832 }, dpr: 3.75, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 9, color: "#e5d9c2" }, approx: true },
  { id: "galaxy-s24", name: "Galaxy S24", brand: "Samsung", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 360, height: 780 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 9, color: "#c2b4d8" }, approx: true },
  { id: "galaxy-s24-fe", name: "Galaxy S24 FE", brand: "Samsung", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 892 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 11, color: "#5c7fa8" }, approx: true },

  // Galaxy S23 / S22 / S21 / S20
  { id: "galaxy-s23-ultra", name: "Galaxy S23 Ultra", brand: "Samsung", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 384, height: 824 }, dpr: 3.75, frame: { cutout: "punch-hole-center", screenRadius: 16, bezel: 9, color: "#2f3b2f" }, approx: true },
  { id: "galaxy-s23-plus", name: "Galaxy S23+", brand: "Samsung", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 384, height: 832 }, dpr: 2.8125, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 9, color: "#d9cfe6" }, approx: true },
  { id: "galaxy-s23", name: "Galaxy S23", brand: "Samsung", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 360, height: 780 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 9, color: "#e6e0d5" } },
  { id: "galaxy-s22-ultra", name: "Galaxy S22 Ultra", brand: "Samsung", kind: "phone", year: 2022, platform: "android", osVersion: "14", screen: { width: 384, height: 824 }, dpr: 3.75, frame: { cutout: "punch-hole-center", screenRadius: 14, bezel: 9, color: "#5b1f2b" }, approx: true },
  { id: "galaxy-s22", name: "Galaxy S22", brand: "Samsung", kind: "phone", year: 2022, platform: "android", osVersion: "14", screen: { width: 360, height: 780 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 9, color: "#2c4f45" } },
  { id: "galaxy-s21-ultra", name: "Galaxy S21 Ultra", brand: "Samsung", kind: "phone", year: 2021, platform: "android", osVersion: "14", screen: { width: 384, height: 854 }, dpr: 3.75, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 9, color: "#1c1c1c" }, approx: true },
  { id: "galaxy-s21", name: "Galaxy S21", brand: "Samsung", kind: "phone", year: 2021, platform: "android", osVersion: "14", screen: { width: 360, height: 800 }, dpr: 3, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 10, color: "#6d5a8e" } },
  { id: "galaxy-s20-ultra", name: "Galaxy S20 Ultra", brand: "Samsung", kind: "phone", year: 2020, platform: "android", osVersion: "13", screen: { width: 412, height: 915 }, dpr: 3.5, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 10, color: "#3b3b3d" } },
  { id: "galaxy-s20", name: "Galaxy S20", brand: "Samsung", kind: "phone", year: 2020, platform: "android", osVersion: "13", screen: { width: 360, height: 800 }, dpr: 4, frame: { cutout: "punch-hole-center", screenRadius: 28, bezel: 10, color: "#a6c4dd" }, approx: true },
  { id: "galaxy-note-20-ultra", name: "Galaxy Note 20 Ultra", brand: "Samsung", kind: "phone", year: 2020, platform: "android", osVersion: "13", screen: { width: 412, height: 883 }, dpr: 3.5, frame: { cutout: "punch-hole-center", screenRadius: 14, bezel: 9, color: "#b9925f" }, approx: true },
  { id: "galaxy-s9-plus", name: "Galaxy S9+", brand: "Samsung", kind: "phone", year: 2018, platform: "android", osVersion: "10", screen: { width: 320, height: 658 }, dpr: 4.5, frame: { cutout: "none", screenRadius: 22, bezel: 14, color: "#5a3e7a" } },
  { id: "galaxy-s8-plus", name: "Galaxy S8+", brand: "Samsung", kind: "phone", year: 2017, platform: "android", osVersion: "9", screen: { width: 360, height: 740 }, dpr: 4, frame: { cutout: "none", screenRadius: 24, bezel: 16, color: "#2b2b2d" } },

  // Galaxy A series
  { id: "galaxy-a56", name: "Galaxy A56", brand: "Samsung", kind: "phone", year: 2025, platform: "android", osVersion: "15", screen: { width: 412, height: 892 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 12, color: "#a8b3a1" }, approx: true },
  { id: "galaxy-a55", name: "Galaxy A55", brand: "Samsung", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 892 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 12, color: "#c6c9ec" }, approx: true },
  { id: "galaxy-a35", name: "Galaxy A35", brand: "Samsung", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 892 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 12, color: "#9fb8d6" }, approx: true },
  { id: "galaxy-a16", name: "Galaxy A16", brand: "Samsung", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 892 }, dpr: 2.625, frame: { cutout: "waterdrop", screenRadius: 26, bezel: 12, color: "#3d4a5a" }, approx: true },
  { id: "galaxy-a06", name: "Galaxy A06", brand: "Samsung", kind: "phone", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 914 }, dpr: 1.75, frame: { cutout: "waterdrop", screenRadius: 24, bezel: 13, color: "#2a2d33" }, approx: true },
  { id: "galaxy-a54", name: "Galaxy A54", brand: "Samsung", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 412, height: 892 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 30, bezel: 12, color: "#cbbfe3" }, approx: true },
  { id: "galaxy-a25", name: "Galaxy A25", brand: "Samsung", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 412, height: 892 }, dpr: 2.625, frame: { cutout: "waterdrop", screenRadius: 26, bezel: 12, color: "#2f3d5c" }, approx: true },
  { id: "galaxy-a15", name: "Galaxy A15", brand: "Samsung", kind: "phone", year: 2023, platform: "android", osVersion: "14", screen: { width: 412, height: 892 }, dpr: 2.625, frame: { cutout: "waterdrop", screenRadius: 26, bezel: 12, color: "#3a4150" }, approx: true },
  { id: "galaxy-a14", name: "Galaxy A14", brand: "Samsung", kind: "phone", year: 2023, platform: "android", osVersion: "13", screen: { width: 412, height: 915 }, dpr: 2.625, frame: { cutout: "waterdrop", screenRadius: 24, bezel: 13, color: "#9a3a3a" }, approx: true },
  { id: "galaxy-a71", name: "Galaxy A71", brand: "Samsung", kind: "phone", year: 2020, platform: "android", osVersion: "13", screen: { width: 412, height: 914 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 12, color: "#2d3a4f" } },
  { id: "galaxy-a51", name: "Galaxy A51", brand: "Samsung", kind: "phone", year: 2019, platform: "android", osVersion: "13", screen: { width: 412, height: 914 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 12, color: "#3b3f58" } },

  // Galaxy Z foldables (folded = cover screen, unfolded = inner screen)
  { id: "galaxy-z-fold-7", name: "Galaxy Z Fold 7 (folded)", brand: "Samsung", kind: "foldable", year: 2025, platform: "android", osVersion: "16", screen: { width: 412, height: 960 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 22, bezel: 9, color: "#2c3340" }, approx: true },
  { id: "galaxy-z-fold-7-unfolded", name: "Galaxy Z Fold 7 (unfolded)", brand: "Samsung", kind: "foldable", year: 2025, platform: "android", osVersion: "16", screen: { width: 750, height: 832 }, dpr: 2.625, frame: { cutout: "none", screenRadius: 20, bezel: 10, color: "#2c3340", crease: true }, approx: true },
  { id: "galaxy-z-fold-6", name: "Galaxy Z Fold 6 (folded)", brand: "Samsung", kind: "foldable", year: 2024, platform: "android", osVersion: "14", screen: { width: 369, height: 905 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 20, bezel: 10, color: "#e1c7cf" }, approx: true },
  { id: "galaxy-z-fold-6-unfolded", name: "Galaxy Z Fold 6 (unfolded)", brand: "Samsung", kind: "foldable", year: 2024, platform: "android", osVersion: "14", screen: { width: 707, height: 823 }, dpr: 2.625, frame: { cutout: "none", screenRadius: 18, bezel: 11, color: "#e1c7cf", crease: true }, approx: true },
  { id: "galaxy-z-fold-5", name: "Galaxy Z Fold 5 (folded)", brand: "Samsung", kind: "foldable", year: 2023, platform: "android", osVersion: "14", screen: { width: 344, height: 882 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 20, bezel: 10, color: "#bcc9d8" } },
  { id: "galaxy-z-fold-5-unfolded", name: "Galaxy Z Fold 5 (unfolded)", brand: "Samsung", kind: "foldable", year: 2023, platform: "android", osVersion: "14", screen: { width: 690, height: 829 }, dpr: 2.625, frame: { cutout: "none", screenRadius: 18, bezel: 11, color: "#bcc9d8", crease: true }, approx: true },
  { id: "galaxy-z-flip-7", name: "Galaxy Z Flip 7", brand: "Samsung", kind: "foldable", year: 2025, platform: "android", osVersion: "16", screen: { width: 412, height: 960 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 10, color: "#2f4f7a" }, approx: true },
  { id: "galaxy-z-flip-6", name: "Galaxy Z Flip 6", brand: "Samsung", kind: "foldable", year: 2024, platform: "android", osVersion: "14", screen: { width: 412, height: 1006 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 10, color: "#d9e7a6" }, approx: true },
  { id: "galaxy-z-flip-5", name: "Galaxy Z Flip 5", brand: "Samsung", kind: "foldable", year: 2023, platform: "android", osVersion: "14", screen: { width: 412, height: 1006 }, dpr: 2.625, frame: { cutout: "punch-hole-center", screenRadius: 26, bezel: 10, color: "#cfc3e8" }, approx: true },

  // Galaxy Tab
  { id: "galaxy-tab-s9", name: "Galaxy Tab S9", brand: "Samsung", kind: "tablet", year: 2023, platform: "android", osVersion: "14", screen: { width: 800, height: 1280 }, dpr: 2, frame: { cutout: "none", screenRadius: 16, bezel: 22, color: "#3a3b3f" }, approx: true },
  { id: "galaxy-tab-a9-plus", name: "Galaxy Tab A9+", brand: "Samsung", kind: "tablet", year: 2023, platform: "android", osVersion: "14", screen: { width: 800, height: 1280 }, dpr: 1.5, frame: { cutout: "none", screenRadius: 14, bezel: 26, color: "#8f9399" }, approx: true },
  { id: "galaxy-tab-s8", name: "Galaxy Tab S8", brand: "Samsung", kind: "tablet", year: 2022, platform: "android", osVersion: "14", screen: { width: 800, height: 1280 }, dpr: 2, frame: { cutout: "none", screenRadius: 16, bezel: 22, color: "#d3d4d8" }, approx: true },
  { id: "galaxy-tab-s7", name: "Galaxy Tab S7", brand: "Samsung", kind: "tablet", year: 2020, platform: "android", osVersion: "13", screen: { width: 800, height: 1280 }, dpr: 2, frame: { cutout: "none", screenRadius: 16, bezel: 22, color: "#2e2f33" }, approx: true },
];
