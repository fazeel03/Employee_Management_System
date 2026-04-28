import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = ({ children }) => {
  console.log("Layout component rendered");
  
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-100 min-h-screen">
        <Header />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Layout;