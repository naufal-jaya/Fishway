export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
      <div className="w-12 h-12 border-4 border-[#e8f4fd] border-t-[#407BB5] rounded-full animate-spin"></div>
      <p className="mt-4 text-[#407BB5] font-semibold animate-pulse tracking-wide">Memuat data...</p>
    </div>
  );
}
