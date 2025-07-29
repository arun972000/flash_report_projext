import db from "@/lib/db";
import axios from "axios";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Authorization code is missing" }, { status: 400 });
  }

  try {
    // 1. Exchange code for access token
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: `${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/auth/google/callback`,
        },
      }
    );

    const { access_token } = data;

    // 2. Get user info
    const { data: userInfo } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userInfo || !userInfo.email) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // 3. Check if the user exists
    // const [result] = await db.execute("SELECT * FROM users WHERE email = ?", [
    //   userInfo.email,
    // ]);

    // let token;
    // if (result.length === 0) {
    //   // Insert new user
    //   await db.execute(
    //     "INSERT INTO users (username, slug, email, google_id) VALUES (?, ?, ?, ?)",
    //     [
    //       userInfo.name,
    //       userInfo.name.toLowerCase().split(" ").join("-"),
    //       userInfo.email,
    //       userInfo.sub,
    //     ]
    //   );

    //   const [newUser] = await db.execute("SELECT * FROM users WHERE email = ?", [userInfo.email]);

    //   token = jwt.sign(
    //     {
    //       id: newUser[0].id,
    //       email: newUser[0].email,
    //       role: newUser[0].role,
    //     },
    //     process.env.JWT_KEY,
    //     { expiresIn: "7d" }
    //   );
    // } else {
    //   token = jwt.sign(
    //     {
    //       id: result[0].id,
    //       email: result[0].email,
    //       role: result[0].role,
    //       username:result[0].username
    //     },
    //     process.env.JWT_KEY,
    //     { expiresIn: "7d" }
    //   );
    // }

    // const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_BACKEND_URL}subscription?verified=true`, req.url);
    // const response = NextResponse.redirect(redirectUrl);

    // // 🔐 Set cookies
    // response.cookies.set("authToken", token, {
    //   sameSite: "Strict",
    //   maxAge: 7 * 24 * 60 * 60,
    //   path: "/",
    // });

    // // 🖼️ Set Google profile picture in a cookie
    // response.cookies.set("profilePic", userInfo.picture, {
    //   sameSite: "Strict",
    //   maxAge: 7 * 24 * 60 * 60,
    //   path: "/",
    // });

    // return response;

    return NextResponse.json({message:'success'})
  } catch (error) {
    console.error("Error authenticating:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
