export default function BuyerLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-[60vh] items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#e8f4fd] border-t-[#407BB5] rounded-full animate-spin"></div>
      <p className="mt-4 text-[#407BB5] font-medium animate-pulse">Memuat data...</p>
    </div>
  );
}
