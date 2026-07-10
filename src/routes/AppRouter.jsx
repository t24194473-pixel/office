import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Mainlayout from "../layouts/Mainlayout";
import Login from "../pages/Login";
import Register from "../pages/Register";
import PendingApproval from "../pages/PendingApproval";
import UsersRequests from "../pages/Admin/UsersRequests";
import CasesList from "../pages/Cases/CasesList";
import AddCase from "../pages/Cases/AddCase";
import CaseDetail from "../pages/Cases/CaseDetail";
import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/pending", element: <PendingApproval /> },
    {
        path: "/",
        element: <ProtectedRoute />, // يحمي المسارات من الزوار العاديين وبوابة الانتظار
        children: [
            { 
               path: "/", 
               element: <Mainlayout />, // الواجهة الأساسية
               children: [
                  { index: true, element: <Home /> },
                  { path: "cases",          element: <CasesList />  },
                  { path: "cases/new",      element: <AddCase />    },
                  { path: "cases/:caseId",  element: <CaseDetail /> },
                  
                  // مسارات الإدارة (محمية بطبقة إضافية)
                  {
                      path: "admin",
                      element: <ProtectedRoute requireAdmin={true} />,
                      children: [
                          { path: "requests", element: <UsersRequests /> }
                      ]
                  }
               ]
            }
        ]
    }
]);