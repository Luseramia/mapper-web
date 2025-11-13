import { useState } from "react";

export default function StringMapperS() {
  const [input1, setInput1] = useState("default,default,$1,$2");
  const [input2, setInput2] = useState("created_at,updated_at,id,meaning");
  const [result, setResult] = useState<
    Array<{
      index: number;
      value1: string;
      value2: string;
    }>
  >([]);
  const [showResult, setShowResult] = useState(false);

  const handleMap = () => {
    const arr1 = input1.split(",").map((item) => item.trim());
    const arr2 = input2.split(",").map((item) => item.trim());

    const mapped = arr1
      .map((val, index) => ({
        index,
        value1: val,
        value2: arr2[index] || "-",
      }))
      .filter((item) => item.value1.toLowerCase() !== "default");

    setResult(mapped);
    setShowResult(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            String Mapper
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input ช่องที่ 1 (แบ่งด้วย ,)
              </label>
              <input
                type="text"
                value={input1}
                onChange={(e) => setInput1(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="default,default,$1,$2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input ช่องที่ 2 (แบ่งด้วย ,)
              </label>
              <input
                type="text"
                value={input2}
                onChange={(e) => setInput2(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="created_at,updated_at,id,meaning"
              />
            </div>

            <button
              onClick={handleMap}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
            >
              Map ข้อมูล
            </button>
          </div>

          {showResult && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                ผลลัพธ์:
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {result.map((item) => (
                  <div
                    key={item.index}
                    className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center"
                  >
                    <span className="text-sm font-medium text-gray-500">
                      Index {item.index}:
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-mono text-sm">
                        {item.value1}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-mono text-sm">
                        {item.value2}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
