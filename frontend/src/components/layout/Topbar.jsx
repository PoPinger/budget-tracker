export default function Topbar() {
  return (
    <div className="h-16 bg-[#0B0F19] border-b border-gray-800 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold">Dashboard</h2>

      <div className="flex items-center gap-4">
        <button className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 transition">
          + Add
        </button>

        <div className="w-8 h-8 rounded-full bg-gray-700"></div>
      </div>
    </div>
  );
}