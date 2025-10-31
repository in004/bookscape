import NextAuth from "next-auth";
import { authOptions } from "@/auth"; // adjust path if your file is named differently

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

