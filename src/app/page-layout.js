import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import RootLayout from "./layout";

export default async function PageLayout({ children }) {
  let session;
  
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Error getting session:", error);
    session = null;
  }
  
  return <RootLayout session={session}>{children}</RootLayout>;
} 