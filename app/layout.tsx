import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContext";

export const metadata: Metadata = {
  title: "Fishway – Jual Beli Ikan Segar",
  description: "Platform jual beli ikan segar terpercaya",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="font-sans min-h-screen bg-white text-[#1a1a1a] relative">
        <ToastProvider>
          {/* Background Latar */}
          <div
            className="fixed top-0 left-0 h-full pointer-events-none z-0 w-full max-w-[1300px]"
            style={{
              backgroundImage: "url('/images/latar.png')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
              backgroundPosition: "left center",
              opacity: 1,
            }}
          />

          {/* Fixed Sticky Waves at the bottom of the viewport, layered behind content (z-[5]) but in front of background (z-0) */}
          <div className="fixed bottom-0 left-0 w-full h-24 sm:h-40 pointer-events-none z-[5] overflow-hidden">
            <svg
              className="absolute bottom-0 left-0 w-full z-0 h-full"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <path
                d="M0.000942231 37.2993C0.000942231 37.2993 113.811 -42.2906 166.552 73.4664C219.293 189.223 310.822 105.64 400.046 118.997C489.27 132.353 510.174 197.15 613.941 172.5C730.392 144.837 741.455 276.583 861.631 198.5C962.441 133 1001.02 211.058 1101.94 198.5C1201.03 186.17 1216.93 115.986 1324.94 172.5C1432.95 229.014 1445.94 -6.95959e-05 1523.26 0C1536.06 248.051 1524.08 261.374 1523.26 420C1523.26 420 -0.00114292 865.966 6.43158e-10 394.983C0.00114292 -76.0001 0.739034 205.986 0.000766754 88L0.000942231 37.2993Z"
                fill="#A2D2FF"
                fillOpacity="0.4"
              />
            </svg>

            <svg
              className="absolute -bottom-6 sm:-bottom-10 left-0 w-full z-10 h-full"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <path
                d="M0.000175476 37.2993C0.000175476 37.2993 0.458678 36.9786 1.33097 36.4076C1.50784 23.4542 1.66758 18.8862 1.79234 36.1075C16.4791 26.6079 117.706 -33.7407 166.551 73.4664C219.293 189.223 310.822 105.64 400.046 118.997C489.269 132.353 510.173 197.15 613.941 172.5C746.545 118.997 813.15 115.182 1004.05 188.841C1097.21 224.788 1193.53 116.326 1301.55 172.841C1409.56 229.355 1445.94 -6.95959e-05 1523.26 0C1536.06 248.051 1525.37 175.214 1525.32 252.925C1489.5 297.14 338.341 292.79 2.06249 252.925C2.06281 120.752 1.95866 59.0663 1.79234 36.1075C1.62759 36.214 1.47374 36.3142 1.33097 36.4076C0.903387 67.7215 0.37568 148.039 0 88L0.000175476 37.2993Z"
                fill="#A2D2FF"
                fillOpacity="0.5"
              />
            </svg>

            <svg
              className="absolute -bottom-12 sm:-bottom-24 left-0 w-full z-20 h-full"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <path
                d="M0.000175476 9.72022C0.000175476 9.72022 130.14 -31.7798 226.14 56.7202C322.14 145.22 442.416 53.3636 531.64 66.7202C620.863 80.0768 667.372 135.87 771.14 111.22C903.744 57.7167 885.744 48.061 1076.64 121.72C1169.8 157.667 1193.53 73.312 1301.55 129.826C1409.56 186.341 1454.83 46.7201 1532.15 46.7202C1532.15 140.001 1532.16 158.393 1532.16 160.017C1532.17 152.921 1532.17 161.242 1532.16 160.017C1532.16 163.428 1532.15 170.404 1532.15 183.72H3.20655C3.20606 145.826 0.738267 230.206 0 112.22L0.000175476 9.72022Z"
                fill="#689DD1"
              />
            </svg>
          </div>

          <main className="relative z-10 min-h-screen">{children}</main>
          <footer className="relative z-10 mt-16 border-t border-gray-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-400">
              © 2026 Fishway – Platform Jual Beli Ikan Segar
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}