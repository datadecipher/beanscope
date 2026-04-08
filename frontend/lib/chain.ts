import { http } from "wagmi";
import { base } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
  appName: "BeanScope",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "placeholder",
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});
