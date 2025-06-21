import { SquareArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <div className="bg-slate-200 px-10 py-5 flex justify-center items-center border-t border-slate-300">
      <div className="text-gray-400 text-sm flex gap-x-1 items-center">
        <SquareArrowUpRight size={20} />
        <span>Migrate DB to SF</span>
      </div>
    </div>
  );
}
