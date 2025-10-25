// "use client";

// import { useEffect, useState } from "react";

// interface Props {
//   labels: string[];
// }

// export default function PromoBanner({ labels }: Props) {
//   const [index, setIndex] = useState(0);

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setIndex((prev) => (prev + 1) % labels.length);
//     }, 3000);
//     return () => clearInterval(timer);
//   }, [labels]);

//   const colorSets = [
//     { bg: "bg-blue-600", text: "text-white" },
//     { bg: "bg-yellow-400", text: "text-gray-900" },
//     { bg: "bg-green-100", text: "text-green-700" },
//     { bg: "bg-orange-100", text: "text-orange-700" },
//   ];

//   const color = colorSets[index % colorSets.length];

//   return (
//     <div className="flex justify-center py-4">
//       <div
//         className={`transition-all duration-500 px-6 py-2 rounded-md font-semibold text-sm ${color.bg} ${color.text}`}
//       >
//         {labels[index]}
//       </div>
//     </div>
//   );
// }
