import Breadcrumbs from "./Breadcrumbs.jsx";
import SearchBar from "./SearchBar.jsx";
import NotificationsMenu from "./NotificationsMenu.jsx";
import AccountMenu from "./AccountMenu.jsx";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="p-4 sm:px-6 flex items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <Breadcrumbs />
        </div>

        {/* Add relative container for search dropdown */}
        {/* <div className="hidden lg:block relative">
          <SearchBar />
        </div> */}

        <div className="flex items-center gap-2">
          <NotificationsMenu />
          <div className="h-6 w-px bg-gray-200"></div>
          <AccountMenu />
        </div>
      </div>

      {/* Mobile search with proper container */}
      {/* <div className="relative px-4 sm:px-6 pb-3 lg:hidden">
        <SearchBar />
      </div> */}

      {/* Decorative header accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#0c2bfc]"></div>
    </header>
  );
}
