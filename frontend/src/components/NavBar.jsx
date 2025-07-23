import React from "react";
import { useAuthStore } from "../store/useAuth.store";
import { Link } from "react-router-dom";
import { LogOut, MessageSquare, User, LogIn } from "lucide-react";

const NavBar = ({ setLoggedIn }) => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg lg-base-100/80 ">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">
                <span className="absolute top-1">My</span>
                <span className="ml-5">chatty</span>
              </h1>
            </Link>
          </div>
          <div className="flex items-center justify-between gap-2">
            {!authUser && (
              <>
                <Link to={"/signup"} className="btn btn-sm gap-2">
                  <User className="size-5" />
                  <span className="hidden sm:inline">Signup</span>
                </Link>
                <Link to={"/login"} className="btn btn-sm gap-2">
                  <LogIn className="size-5" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </>
            )}

            {authUser && (
              <>
                <Link to={"/profile"} className="btn btn-sm gap-2">
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
