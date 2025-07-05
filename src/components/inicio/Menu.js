import React from "react";
import { Link } from "react-router-dom";
import { IoHome } from "react-icons/io5";
import { GrCatalog } from "react-icons/gr";
import { LuUser } from "react-icons/lu";
import { MdAdminPanelSettings } from "react-icons/md";
import { RiFileInfoLine } from "react-icons/ri";

export function Menu() {
  return (
    <>
      <nav className="d-flex flex-column bg-dark text-white p-3 vh-100 align-items-center" style={{ width: "150px", position: "fixed", top: 0, left: 0 }}>
        <h4 className="text-center">Gestion De Salud</h4>
        <Link className="nav-link text-white mt-5 d-flex justify-content-center" to="/">
          <IoHome size={30} />
        </Link>
        <Link className="nav-link text-white mt-5 d-flex justify-content-center" to="/Maps">
          <GrCatalog size={30} />
        </Link>
        <Link className="nav-link text-white mt-5 d-flex justify-content-center" to="/usuarios">
          <LuUser size={30} />
        </Link>
        <Link className="nav-link text-white mt-5 d-flex justify-content-center" to="/gestion">
          <MdAdminPanelSettings size={30} />
        </Link>
        <Link className="nav-link text-white mt-5 d-flex justify-content-center" to="/informe">
          <RiFileInfoLine size={30} />
        </Link>
      </nav>
    </>
  );
}