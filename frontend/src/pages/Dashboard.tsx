export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-gray-900 p-6 rounded-xl shadow">
        <h3>Total Budget</h3>
        <p className="text-2xl mt-2">$1200</p>
      </div>

      <div className="bg-gray-900 p-6 rounded-xl shadow">
        <h3>Expenses</h3>
        <p className="text-2xl mt-2">$800</p>
      </div>

      <div className="bg-gray-900 p-6 rounded-xl shadow">
        <h3>Remaining</h3>
        <p className="text-2xl mt-2 text-green-400">$400</p>
      </div>
    </div>
  );
}