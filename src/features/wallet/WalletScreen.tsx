import { WalletScreenContent } from "./components/WalletScreenContent";
import { useWalletController } from "./workflow/useWalletController";

export default function WalletScreen() {
  const { frame, content, presentationProps } = useWalletController();

  return (
    <WalletScreenContent
      content={content}
      frame={frame}
      presentationProps={presentationProps}
    />
  );
}
