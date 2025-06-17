import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

import "./components/styles/flashReports.css";

// Font setup

export default async function FlashReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const cookieStore = cookies();
  // const token = cookieStore.get("authToken")?.value;

  // if (!token) {
  //   redirect("/");
  // }

  // // Decode token
  // let email: string | undefined;
  // let role: string | undefined;
  // try {
  //   const decoded: JwtPayload = jwtDecode(token);
  //   email = decoded.email;
  //   role = decoded.role;
  // } catch (err) {
  //   console.error("Invalid token:", err);
  //   redirect("/");
  // }

  // if (!email) {
  //   redirect("/");
  // }

  // const specialRoles = ["admin", "ad team", "moderator"];

  // // Only check subscription if user is not a special role
  // if (!specialRoles.includes(role || "")) {
  //   const subRes = await fetch(
  //     `${process.env.NEXT_PUBLIC_BACKEND_URL}api/subscription/purchase/${email}`,
  //     {
  //       method: "GET",
  //       cache: "no-store",
  //     }
  //   );

  //   if (!subRes.ok) {
  //     redirect("/subscription");
  //   }

  //   const subscription = await subRes.json();

  //   if (subscription[0]?.status !== "Active") {
  //     redirect("/subscription");
  //   }
  // }

  // Authorized: render layout
  return (
    <>
      <ToastContainer />

      {children}
    </>
  );
}
