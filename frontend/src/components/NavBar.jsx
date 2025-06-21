import { SquareArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function NavBar() {
  return (
    <nav className="bg-slate-200 px-10 py-5 flex justify-between items-center border-b border-slate-300 shadow-sm">
      <Link
        to={"/"}
        className="font-bold text-gray-700 flex gap-x-2 items-center"
      >
        <SquareArrowUpRight />
        <span>Migrate DB to SF</span>
      </Link>
    </nav>
  );
}
